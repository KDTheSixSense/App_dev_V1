'use client';

import React, { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Text, Float, Stars, Sparkles, KeyboardControls, Sky, useKeyboardControls,
  Html, MeshDistortMaterial, OrbitControls,
  Billboard, ContactShadows, MeshReflectorMaterial, Instance, Instances,
  useGLTF, useAnimations, Environment, Cone
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { Physics, RigidBody, CapsuleCollider, useRapier, RapierRigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { GLTF } from 'three-stdlib';

// --- 定数・設定 ---
const CONTROL_MAP = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
];

const WALK_SPEED = 6;
const RUN_SPEED = 12;
const JUMP_FORCE = 9;
const RESPAWN_THRESHOLD = -30;
const FOX_MODEL_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb';

// --- 型定義 ---
type FoxGLTF = GLTF & {
  materials: { [key: string]: THREE.Material };
  nodes: { [key: string]: THREE.SkinnedMesh | THREE.Mesh };
};

// 型エラー回避用: EffectComposerをanyとして扱う
const EffectComposerAny = EffectComposer as any;

// --- コンポーネント群 ---

function Loader() {
  return <Html center><div className="text-emerald-200 font-serif animate-pulse text-xl tracking-widest w-full text-center">Loading World...</div></Html>;
}

// ◆ アニメーション付きキツネモデル (コハク)
function AnimatedFoxModel({ isMoving, run, isAirborne, isFalling }: { isMoving: boolean, run: boolean, isAirborne: boolean, isFalling: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(FOX_MODEL_URL) as unknown as FoxGLTF;
  const { actions } = useAnimations(animations, group);
  
  // ランダム待機モーション用のState
  const [idleSpeed, setIdleSpeed] = useState(1.0);

  // マテリアルの変更 (初回のみ)
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.name.includes("Terrain")) {
          mesh.visible = false;
        }

        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          const newMaterial = mesh.material.clone();
          newMaterial.color = new THREE.Color("#00bfff");
          newMaterial.emissive = new THREE.Color("#00ffff");
          newMaterial.emissiveIntensity = 0.8;
          mesh.material = newMaterial;
        }
      }
    });
  }, [scene]);

  // ランダムな待機仕草の生成
  useEffect(() => {
    if (isMoving || isAirborne) return;

    const interval = setInterval(() => {
        const randomVal = Math.random();
        if (randomVal > 0.6) {
            setIdleSpeed(1.5);
            setTimeout(() => setIdleSpeed(1.0), 1000);
        } else if (randomVal < 0.2) {
            setIdleSpeed(0.5);
            setTimeout(() => setIdleSpeed(1.0), 1500);
        }
    }, 3000);

    return () => clearInterval(interval);
  }, [isMoving, isAirborne]);

  // アニメーション制御
  useEffect(() => {
    const idleAction = actions['Survey'];
    const walkAction = actions['Walk'];
    const runAction = actions['Run'];

    if (!idleAction || !walkAction || !runAction) return;

    const fadeDuration = 0.2;

    if (isAirborne) {
      // ◆ 空中 (ジャンプ〜落下)
      idleAction.fadeOut(fadeDuration);
      walkAction.fadeOut(fadeDuration);
      runAction.reset().fadeIn(fadeDuration).play();

      if (isFalling) {
          runAction.timeScale = 0.4; // 落下中
      } else {
          runAction.timeScale = 0.75; // 上昇中
      }

    } else if (isMoving) {
      // ◆ 地上移動
      idleAction.fadeOut(fadeDuration);
      if (run) {
        walkAction.fadeOut(fadeDuration);
        runAction.reset().fadeIn(fadeDuration).play();
        runAction.timeScale = 2.0;
      } else {
        runAction.fadeOut(fadeDuration);
        walkAction.reset().fadeIn(fadeDuration).play();
        walkAction.timeScale = 1.2;
      }
    } else {
      // ◆ 待機 (初期状態に戻しました: 等速ループ)
      walkAction.fadeOut(fadeDuration);
      runAction.fadeOut(fadeDuration);
      idleAction.reset().fadeIn(fadeDuration).play();
      idleAction.timeScale = 1.0;
    }
  }, [actions, isMoving, run, isAirborne, isFalling, idleSpeed]);

  return (
    <group ref={group} dispose={null}>
      {/* 向き修正済み */}
      <primitive object={scene} scale={0.01} rotation={[0, 0, 0]} />
      <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={2} blur={2.5} far={1} color="#001133" frames={1} />
    </group>
  );
}
useGLTF.preload(FOX_MODEL_URL);

// ◆ プレイヤー制御
function KohakuCharacter({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const rigidBody = useRef<RapierRigidBody>(null);
  const containerRef = useRef<THREE.Group>(null);
  const [, getKeys] = useKeyboardControls();
  
  const { world, rapier } = useRapier();
  const isRunning = useKeyboardControls((state) => state.run);
  
  const [isMoving, setIsMoving] = useState(false);
  const [isAirborne, setIsAirborne] = useState(false);
  const [isFalling, setIsFalling] = useState(false);
  const canJumpRef = useRef(true);
  const jumpCooldownRef = useRef(0); 

  // ★ワープイベントのリスナー設定
  useEffect(() => {
    const handleTeleport = (e: CustomEvent<{ position: [number, number, number] }>) => {
        if (rigidBody.current) {
            const [x, y, z] = e.detail.position;
            // 物理演算の位置を強制更新
            rigidBody.current.setTranslation({ x, y, z }, true);
            // 速度をリセットして落下死などを防ぐ
            rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
    };
    
    window.addEventListener('teleport-player', handleTeleport as EventListener);
    return () => {
        window.removeEventListener('teleport-player', handleTeleport as EventListener);
    };
  }, []);

  useFrame((state, delta) => {
    if (!rigidBody.current || !containerRef.current) return;
    const { forward, backward, left, right, jump } = getKeys();
    const currentPos = rigidBody.current.translation();
    const linvel = rigidBody.current.linvel();

    // 1. 奈落リスポーン
    if (currentPos.y < RESPAWN_THRESHOLD) {
      rigidBody.current.setTranslation({ x: 0, y: 10, z: 0 }, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // 2. 接地判定 & 落下判定
    const rayOrigin = { x: currentPos.x, y: currentPos.y + 0.5, z: currentPos.z };
    const rayDirection = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(rayOrigin, rayDirection);
    const hit = world.castRay(ray, 2.5, true); 
    
    const hitDistance = hit ? ((hit as any).timeOfImpact ?? (hit as any).toi) : 100;
    
    // 多段ジャンプ防止ロジック
    const isStableGround = hitDistance < 0.8 && Math.abs(linvel.y) < 2.0;
    
    setIsAirborne(!isStableGround);
    setIsFalling(linvel.y < -0.1);

    if (isStableGround && !jump) {
      canJumpRef.current = true;
    }

    // 3. 移動計算
    const cameraFront = new THREE.Vector3();
    state.camera.getWorldDirection(cameraFront);
    cameraFront.y = 0;
    cameraFront.normalize();
    const cameraRight = new THREE.Vector3(-cameraFront.z, 0, cameraFront.x);

    const moveDirection = new THREE.Vector3(0, 0, 0);
    if (forward) moveDirection.add(cameraFront);
    if (backward) moveDirection.sub(cameraFront);
    if (left) moveDirection.sub(cameraRight);
    if (right) moveDirection.add(cameraRight);
    moveDirection.normalize();

    const currentSpeed = (isRunning ? RUN_SPEED : WALK_SPEED);
    const targetVelX = moveDirection.x * currentSpeed;
    const targetVelZ = moveDirection.z * currentSpeed;
    const currentVel = rigidBody.current.linvel();
    
    // 入力判定
    setIsMoving(moveDirection.length() > 0.1);

    const lerpFactor = isStableGround ? 0.2 : 0.05; 
    
    rigidBody.current.setLinvel({
      x: THREE.MathUtils.lerp(currentVel.x, targetVelX, lerpFactor),
      y: currentVel.y,
      z: THREE.MathUtils.lerp(currentVel.z, targetVelZ, lerpFactor)
    }, true);

    // 4. 回転
    if (moveDirection.length() > 0.1) {
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
      const currentQuaternion = containerRef.current.quaternion.clone();
      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);
      containerRef.current.quaternion.slerp(targetQuaternion, 0.15);
    }

    // 5. ジャンプ
    const now = Date.now();
    if (jump && isStableGround && canJumpRef.current && (now - jumpCooldownRef.current > 200)) {
      rigidBody.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
      canJumpRef.current = false;
      jumpCooldownRef.current = now;
    }

    // 6. カメラ追従 (距離固定)
    if (controlsRef.current) {
      const idealTarget = new THREE.Vector3(currentPos.x, currentPos.y + 1.5, currentPos.z);
      
      // 現在のターゲット位置
      const currentTarget = controlsRef.current.target;
      
      // 次のターゲット位置を計算 (スムーズに移動)
      const nextTarget = currentTarget.clone().lerp(idealTarget, 0.1);
      
      // ターゲットが移動した分だけ、カメラも平行移動させる
      const diff = nextTarget.clone().sub(currentTarget);
      state.camera.position.add(diff);
      
      // ターゲット更新
      controlsRef.current.target.copy(nextTarget);
      controlsRef.current.update();
    }
  });

  return (
    <RigidBody ref={rigidBody} colliders={false} position={[0, 5, 0]} enabledRotations={[false, false, false]} friction={0} restitution={0}>
      <CapsuleCollider args={[0.4, 0.4]} position={[0, 0.8, 0]} />
      <group ref={containerRef}>
        <AnimatedFoxModel 
            isMoving={isMoving} 
            run={!!isRunning} 
            isAirborne={isAirborne} 
            isFalling={isFalling} 
        />
      </group>
    </RigidBody>
  );
}

// ◆ 最適化された木 (Instancing)
function InstancedTrees({ count = 80 }: { count?: number }) {
  const treesData = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * 120;
      return {
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number],
        scale: 0.8 + Math.random() * 0.6,
        rotation: [0, Math.random() * Math.PI, 0] as [number, number, number]
      };
    });
  }, [count]);

  return (
    <group>
      <Instances range={count} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.7, 5, 8]} />
        <meshStandardMaterial color="#4a3b2a" roughness={0.9} />
        {treesData.map((data, i) => (
          <Instance
            key={`trunk-${i}`}
            position={[data.position[0], 2.5, data.position[2]]}
            scale={[data.scale, data.scale, data.scale]}
            rotation={data.rotation}
          />
        ))}
      </Instances>

      <Instances range={count} castShadow receiveShadow>
        <dodecahedronGeometry args={[2, 1]} />
        <MeshDistortMaterial color="#1a4d1a" roughness={0.6} distort={0.2} speed={1.5} />
        {treesData.map((data, i) => (
          <Instance
            key={`leaf-${i}`}
            position={[data.position[0], 5 * data.scale, data.position[2]]}
            scale={[data.scale, data.scale, data.scale]}
          />
        ))}
      </Instances>

      {treesData.map((data, i) => (
        <RigidBody key={`col-${i}`} type="fixed" position={data.position}>
           <CylinderCollider args={[2.5 * data.scale, 0.5 * data.scale]} />
        </RigidBody>
      ))}
    </group>
  );
}

// ◆ 最適化された岩 (Instancing)
function InstancedRocks({ count = 100 }: { count?: number }) {
  const rocksData = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 150;
      return {
        position: [Math.cos(angle) * radius, 0.2, Math.sin(angle) * radius] as [number, number, number],
        scale: 0.5 + Math.random() * 1.5,
        rotation: [Math.random(), Math.random(), Math.random()] as [number, number, number]
      };
    });
  }, [count]);

  return (
    <Instances range={count} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#555" roughness={0.7} flatShading />
      {rocksData.map((data, i) => (
        <Instance
          key={i}
          position={data.position}
          scale={[data.scale, data.scale, data.scale]}
          rotation={data.rotation}
        />
      ))}
    </Instances>
  );
}

// ◆ ポータル
const Portal = ({ position, label, path }: { position: [number, number, number], label: string, path: string }) => {
  const router = useRouter();
  const [hovered, setHover] = useState(false);
  const color = "#55ffaa";

  return (
    <RigidBody type="fixed" position={position} colliders="hull">
      <group>
        <Float speed={3} rotationIntensity={1.5} floatIntensity={1.5}>
          <mesh
            onClick={() => router.push(path)}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
          >
            <octahedronGeometry args={[1.2, 0]} />
            <MeshDistortMaterial
              color={hovered ? '#ffffff' : color}
              emissive={color}
              emissiveIntensity={hovered ? 5 : 2}
              toneMapped={false}
              distort={0.3}
              speed={3}
              transparent
              opacity={0.9}
            />
          </mesh>
        </Float>
        <Billboard position={[0, 2.5, 0]} follow={true}>
          <Text fontSize={0.6} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor="#000000">
            {label}
          </Text>
        </Billboard>
        <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.5, 32]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.3} toneMapped={false} />
        </mesh>
      </group>
    </RigidBody>
  );
};

// ◆ 天体
function CelestialBodies({ time, isNight }: { time: number, isNight: boolean }) {
  const sunRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const radius = 300;
    const sunX = Math.cos(time) * radius;
    const sunY = Math.sin(time) * radius;
    const sunZ = -100;

    if (sunRef.current) {
      sunRef.current.position.set(sunX, sunY, sunZ);
      sunRef.current.lookAt(0, 0, 0);
    }
    if (moonRef.current) {
      moonRef.current.position.set(-sunX, -sunY, sunZ);
      moonRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <mesh ref={sunRef} visible={!isNight}>
        <sphereGeometry args={[25, 32, 32]} />
        <meshStandardMaterial 
          color="#ffddaa" 
          emissive="#ffddaa"
          emissiveIntensity={5} 
          toneMapped={false} 
        />
      </mesh>
      
      <mesh ref={moonRef} visible={isNight}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#aaddff" 
          emissiveIntensity={2} 
          toneMapped={false} 
        />
      </mesh>
    </>
  );
}

// ◆ 新規追加: 中に入れる巨大お城と走り登れる階段 (内階段・床修正版)
function ProceduralCastleAndStairs() {
    // --- 外階段の設定 ---
    const steps = 60;
    const stepWidth = 15;
    const stepHeight = 0.5;
    const stepDepth = 3;
    const totalHeight = steps * stepHeight; // 30m
    const totalDepth = steps * stepDepth;   // 180m
    const startZ = -10;
    const castleFloorY = totalHeight;
    const castleCenterZ = startZ - totalDepth - 30;

    // --- 内階段の設定 ---
    const inStepHeight = 0.5;
    const inStepDepth = 1.5;
    const inStepWidth = 8; 
    const floorThickness = 1; 

    // 1F -> 2F
    const height1Fto2F = 12;
    const steps1Fto2F = height1Fto2F / inStepHeight; // 24段
    const depth1Fto2F = steps1Fto2F * inStepDepth;   // 36m

    // 2F -> 3F
    const height2Fto3F = 16;
    const steps2Fto3F = height2Fto3F / inStepHeight; // 32段
    const depth2Fto3F = steps2Fto3F * inStepDepth;   // 48m

    const wallMaterial = new THREE.MeshStandardMaterial({ color: '#dddddd', roughness: 0.2 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: '#334455', roughness: 0.8 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: '#3366cc', roughness: 0.3 });
    const stairsMaterial = new THREE.MeshStandardMaterial({ color: '#aaaaaa', roughness: 0.8 });

    // 物理演算用のスロープ角度と長さの計算
    const rampAngle = Math.atan(stepHeight / stepDepth);
    const rampLength = Math.sqrt(totalHeight ** 2 + totalDepth ** 2);

    // 内階段のスロープ計算
    const rampAngle1F = Math.atan(height1Fto2F / depth1Fto2F);
    const rampLength1F = Math.sqrt(height1Fto2F ** 2 + depth1Fto2F ** 2);

    const rampAngle2F = Math.atan(height2Fto3F / depth2Fto3F);
    const rampLength2F = Math.sqrt(height2Fto3F ** 2 + depth2Fto3F ** 2);

    // 1F階段の位置 (左の壁際 x=-24 へ)
    const stairs1F_X = -24;
    // 2F階段の位置 (右の壁際 x=24 へ)
    const stairs2F_X = 24; 

    return (
      <group>
        {/* ================= 外階段 ================= */}
        {Array.from({ length: steps }).map((_, i) => (
          <mesh 
             key={`step-${i}`} 
             position={[0, i * stepHeight + stepHeight/2, startZ - (i * stepDepth + stepDepth/2)]}
             receiveShadow castShadow material={stairsMaterial}
          >
            <boxGeometry args={[stepWidth, stepHeight, stepDepth]} />
          </mesh>
        ))}
        <RigidBody type="fixed" position={[0, totalHeight / 2, startZ - totalDepth / 2]} rotation={[rampAngle, 0, 0]} friction={0}>
             <CuboidCollider args={[stepWidth / 2, 0.1, rampLength / 2]} />
        </RigidBody>
  
        {/* ================= 1階 ================= */}
        {/* 1F床 */}
        <RigidBody type="fixed" position={[0, castleFloorY, castleCenterZ]}>
           <mesh receiveShadow castShadow material={floorMaterial}>
               <boxGeometry args={[60, floorThickness, 60]} /> 
           </mesh>
        </RigidBody>

        {/* 1F壁 (広間) */}
        <group position={[0, castleFloorY + floorThickness/2 + height1Fto2F/2, castleCenterZ]}>
            <RigidBody type="fixed" position={[0, 0, -28]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[60, height1Fto2F, 4]} /></mesh></RigidBody>
            <RigidBody type="fixed" position={[-28, 0, 0]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[4, height1Fto2F, 60]} /></mesh></RigidBody>
            <RigidBody type="fixed" position={[28, 0, 0]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[4, height1Fto2F, 60]} /></mesh></RigidBody>
            <RigidBody type="fixed" position={[-20, 0, 28]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[20, height1Fto2F, 4]} /></mesh></RigidBody>
            <RigidBody type="fixed" position={[20, 0, 28]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[20, height1Fto2F, 4]} /></mesh></RigidBody>
            <RigidBody type="fixed" position={[0, height1Fto2F/2 - 2, 28]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[20, 4, 4]} /></mesh></RigidBody>
        </group>

        {/* --- 内部階段 1F -> 2F (左側配置) --- */}
        {Array.from({ length: steps1Fto2F }).map((_, i) => (
             <mesh key={`in-step1-${i}`} 
                   position={[stairs1F_X, castleFloorY + floorThickness/2 + i*inStepHeight + inStepHeight/2, castleCenterZ + 18 - i*inStepDepth]} 
                   material={stairsMaterial}>
                 <boxGeometry args={[inStepWidth, inStepHeight, inStepDepth]} />
             </mesh>
        ))}
        {/* 物理スロープ (1F->2F) */}
        <RigidBody type="fixed" 
                   position={[stairs1F_X, castleFloorY + floorThickness/2 + height1Fto2F/2, castleCenterZ + 18 - depth1Fto2F/2 + inStepDepth/2]} 
                   rotation={[rampAngle1F, 0, 0]} // 奥へ登る角度
                   friction={0.1}>
             <CuboidCollider args={[inStepWidth/2, 0.1, rampLength1F/2]} />
        </RigidBody>


        {/* ================= 2階 ================= */}
        {/* 2F床 */}
        <group position={[0, castleFloorY + height1Fto2F + floorThickness/2, castleCenterZ]}>
             <RigidBody type="fixed" position={[10, 0, 0]}>
                 <mesh receiveShadow castShadow material={floorMaterial}><boxGeometry args={[40, floorThickness, 60]} /></mesh>
             </RigidBody>
             <RigidBody type="fixed" position={[-20, 0, 24]}>
                 <mesh receiveShadow castShadow material={floorMaterial}><boxGeometry args={[20, floorThickness, 12]} /></mesh>
             </RigidBody>
             <RigidBody type="fixed" position={[-20, 0, -24]}>
                 <mesh receiveShadow castShadow material={floorMaterial}><boxGeometry args={[20, floorThickness, 12]} /></mesh>
             </RigidBody>
        </group>

        {/* 2F壁 */}
        <group position={[0, castleFloorY + height1Fto2F + floorThickness + height2Fto3F/2, castleCenterZ]}>
             <RigidBody type="fixed" position={[-15, 0, -20]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[14, height2Fto3F, 4]} /></mesh></RigidBody>
             <RigidBody type="fixed" position={[15, 0, -20]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[14, height2Fto3F, 4]} /></mesh></RigidBody>
             <RigidBody type="fixed" position={[0, height2Fto3F/2 - 2, -20]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[16, 4, 4]} /></mesh></RigidBody>
             <RigidBody type="fixed" position={[0, 0, 20]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[44, height2Fto3F, 4]} /></mesh></RigidBody>
             <RigidBody type="fixed" position={[-20, 0, 0]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[4, height2Fto3F, 44]} /></mesh></RigidBody>
             <RigidBody type="fixed" position={[20, 0, 0]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[4, height2Fto3F, 44]} /></mesh></RigidBody>
        </group>

        {/* --- 内部階段 2F -> 3F (右側配置) --- */}
        {Array.from({ length: steps2Fto3F }).map((_, i) => (
             <mesh key={`in-step2-${i}`} 
                   position={[stairs2F_X, castleFloorY + height1Fto2F + floorThickness + i*inStepHeight + inStepHeight/2, castleCenterZ + 15 - i*inStepDepth]} 
                   material={stairsMaterial}>
                 <boxGeometry args={[inStepWidth, inStepHeight, inStepDepth]} />
             </mesh>
        ))}
        <RigidBody type="fixed" 
                   position={[stairs2F_X, castleFloorY + height1Fto2F + floorThickness + height2Fto3F/2, castleCenterZ + 15 - depth2Fto3F/2 + inStepDepth/2]} 
                   rotation={[rampAngle2F, 0, 0]} 
                   friction={0.1}>
             <CuboidCollider args={[inStepWidth/2, 0.1, rampLength2F/2]} />
        </RigidBody>


        {/* ================= 3階 ================= */}
        {/* 3F床 */}
         <group position={[0, castleFloorY + height1Fto2F + height2Fto3F + floorThickness*1.5, castleCenterZ]}>
             <RigidBody type="fixed" position={[-12, 0, 0]}>
                 <mesh receiveShadow castShadow material={floorMaterial}><boxGeometry args={[28, floorThickness, 44]} /></mesh>
             </RigidBody>
             <RigidBody type="fixed" position={[15, 0, 18.5]}>
                 <mesh receiveShadow castShadow material={floorMaterial}><boxGeometry args={[inStepWidth+18, floorThickness, 7]} /></mesh>
             </RigidBody>
             <RigidBody type="fixed" position={[15, 0, -20]}>
                 <mesh receiveShadow castShadow material={floorMaterial}><boxGeometry args={[inStepWidth+18, floorThickness, 4]} /></mesh>
             </RigidBody>
        </group>

        {/* 3F壁 */}
        <group position={[0, castleFloorY + height1Fto2F + height2Fto3F + floorThickness*2 + 5, castleCenterZ]}>
             <RigidBody type="fixed" position={[0, 0, -12]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[28, 10, 4]} /></mesh></RigidBody>
             <RigidBody type="fixed" position={[0, 0, 12]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[28, 10, 4]} /></mesh></RigidBody>
             <RigidBody type="fixed" position={[-12, 0, 0]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[4, 10, 28]} /></mesh></RigidBody>
             <RigidBody type="fixed" position={[12, 0, 0]}><mesh receiveShadow castShadow material={wallMaterial}><boxGeometry args={[4, 10, 28]} /></mesh></RigidBody>
        </group>

        {/* ================= 屋根・尖塔 ================= */}
        <mesh position={[0, castleFloorY + height1Fto2F + height2Fto3F + floorThickness*2 + 10 + 8, castleCenterZ]} material={roofMaterial}>
             <Cone args={[20, 16, 4]} rotation={[0, Math.PI/4, 0]}/>
        </mesh>

        {[[-30, -30], [30, -30], [-30, 30], [30, 30]].map(([x, z], i) => (
            <group key={`tower-${i}`} position={[x, castleFloorY, castleCenterZ + z]}>
                <RigidBody type="fixed" position={[0, 30, 0]}>
                    <mesh receiveShadow castShadow material={wallMaterial}>
                        <cylinderGeometry args={[6, 7, 60, 12]} />
                    </mesh>
                </RigidBody>
                <mesh position={[0, 65, 0]} material={roofMaterial}>
                    <Cone args={[7, 15, 12]} />
                </mesh>
            </group>
        ))}

        {/* ポータル群 (1F広間 - 位置を右側の広いスペースへ移動) */}
        <group position={[15, castleFloorY + floorThickness + 1, castleCenterZ]}>
             <Portal position={[0, 0, -15]} label="ホーム" path="/home" />
             <Portal position={[-8, 0, -5]} label="問題ー覧" path="/issue_list" />
             <Portal position={[8, 0, -5]} label="問題作成" path="/CreateProgrammingQuestion" />
             <Portal position={[-8, 0, 10]} label="グループ" path="/group" />
             <Portal position={[8, 0, 10]} label="課題" path="/unsubmitted-assignments" />
             <Portal position={[0, 0, 15]} label="イベント" path="/event/event_list" />
             <Portal position={[0, 0, 0]} label="カスタムトレース" path="/customize_trace" />
        </group>
      </group>
    );
  }

// --- SceneContent ---
function SceneContent() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const timeRef = useRef(Math.PI / 2);
  const [isNight, setIsNight] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.PI / 2);

  useFrame((state, delta) => {
    timeRef.current += delta * 0.05;
    const t = timeRef.current;
    setCurrentTime(t);

    const sunY = Math.sin(t) * 300;
    
    if (sunY < -20 && !isNight) setIsNight(true);
    if (sunY >= -20 && isNight) setIsNight(false);

    if (isNight) {
      state.scene.background = new THREE.Color('#1a2b44');
      state.scene.fog = new THREE.FogExp2('#1a2b44', 0.008);
    } else {
      state.scene.background = new THREE.Color('#87CEEB');
      state.scene.fog = new THREE.FogExp2('#87CEEB', 0.005);
    }

    if (lightRef.current) {
        const radius = 300;
        lightRef.current.position.set(
            Math.cos(t) * radius,
            Math.sin(t) * radius,
            -100
        );
        lightRef.current.intensity = isNight ? 0.2 : 1.5;
        lightRef.current.color.setHSL(isNight ? 0.6 : 0.1, 0.5, 0.8);
    }
  });

  return (
    <>
      <ambientLight intensity={isNight ? 0.3 : 0.6} />
      <directionalLight 
        ref={lightRef}
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} />
      </directionalLight>

      <CelestialBodies time={currentTime} isNight={isNight} />
      
      {!isNight && <Sky sunPosition={[0, 1, 0]} turbidity={10} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />}
      {isNight && <Stars radius={300} depth={50} count={3000} factor={4} fade speed={1} />}
      
      <Sparkles count={200} scale={150} size={4} speed={0.2} opacity={0.5} color={isNight ? "#aaaaff" : "#ffffaa"} position={[0, 20, 0]} />

      <Physics gravity={[0, -20, 0]}>
        <RigidBody type="fixed" position={[0, -0.5, 0]} friction={2}>
          <CuboidCollider args={[200, 2, 200]} position={[0, -1, 0]} />
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[400, 400]} />
            <MeshReflectorMaterial
                blur={[300, 100]}
                resolution={1024} 
                mixBlur={1}
                mixStrength={10} 
                roughness={1}
                depthScale={1.0}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#aacc44"
                metalness={0.1} 
                mirror={0}
            />
          </mesh>
        </RigidBody>

        <InstancedTrees />
        <InstancedRocks />
        
        <ProceduralCastleAndStairs />
        
        <KohakuCharacter controlsRef={controlsRef} />
      </Physics>

      <OrbitControls 
        ref={controlsRef} 
        enablePan={false} 
        enableZoom={true} 
        minDistance={5} 
        maxDistance={40} 
        maxPolarAngle={Math.PI / 2} 
        makeDefault 
      />

      <EffectComposerAny disableNormalPass multisampling={0}>
        {/* @ts-ignore */}
        <Bloom luminanceThreshold={1.0} intensity={1.5} radius={0.7} mipmapBlur />
        {/* @ts-ignore */}
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
        {/* @ts-ignore */}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposerAny>
    </>
  );
}

// --- メインコンポーネント ---
// ワープポイントの定義
const WARP_POINTS = [
  { name: "スタート地点", pos: [0, 5, 0] },
  { name: "お城: 広間", pos: [15, 32, -220] },
];

type Scene404Props = { onBack: () => void; };

export default function Scene404({ onBack }: Scene404Props) {
  // メニューの表示状態
  const [showMenu, setShowMenu] = useState(false);

  // ワープイベント発火関数
  const triggerTeleport = (pos: number[]) => {
    const event = new CustomEvent('teleport-player', { detail: { position: pos } });
    window.dispatchEvent(event);
    setShowMenu(false); // ワープしたらメニューを閉じる
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black z-50 animate-in fade-in duration-2000">
      <KeyboardControls map={CONTROL_MAP}>
        <Canvas shadows="soft" dpr={[1, 1.5]} camera={{ fov: 55, position: [0, 6, 18], far: 1000 }} gl={{ antialias: true, toneMappingExposure: 1.0 }}>
          <Suspense fallback={<Loader />}>
            <SceneContent />
          </Suspense>
        </Canvas>
      </KeyboardControls>

      {/* 左上のタイトルと操作説明 */}
      <div className="absolute top-6 left-6 p-6 bg-slate-900/60 rounded-xl text-emerald-50 backdrop-blur-md border border-emerald-500/30 pointer-events-none select-none shadow-2xl font-serif">
         <h1 className="text-4xl font-extrabold tracking-widest mb-3 text-transparent bg-clip-text bg-gradient-to-br from-emerald-200 to-cyan-400">Lost Garden</h1>
         <div className="text-sm opacity-90 space-y-2 font-medium">
           <p><kbd className="bg-slate-700 px-2 py-1 rounded border border-slate-500">WASD</kbd> 移動 <kbd className="bg-slate-700 px-2 py-1 rounded border border-slate-500 ml-2">Space</kbd> 跳躍</p>
           <p><kbd className="bg-slate-700 px-2 py-1 rounded border border-slate-500">Shift</kbd> 疾走 <span className="ml-2">[ドラッグ]</span> 視点</p>
         </div>
      </div>

      {/* ワープメニュー */}
      <div className={`absolute bottom-24 left-10 flex flex-col gap-2 transition-all duration-300 ${showMenu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          {WARP_POINTS.map((point, idx) => (
              <button 
                  key={idx}
                  onClick={() => triggerTeleport(point.pos)}
                  className="bg-slate-800/90 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg backdrop-blur-md border border-emerald-500/30 shadow-lg text-left font-serif tracking-wide transition-colors"
              >
                  {point.name}
              </button>
          ))}
      </div>

      {/* メニューボタン (❖) */}
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="absolute bottom-10 left-10 bg-slate-800/80 hover:bg-emerald-900/90 text-emerald-100 border border-emerald-500/50 w-14 h-14 rounded-full backdrop-blur-md transition-all shadow-xl hover:shadow-emerald-500/30 pointer-events-auto flex items-center justify-center text-2xl group z-50"
      >
        <span className={`transition-transform duration-300 ${showMenu ? 'rotate-90' : 'rotate-0'}`}>❖</span>
      </button>
    </div>
  );
}