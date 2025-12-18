//components/evolution.tsx

'use client';

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { getEvolvedImageSrc, SubjectProgress } from './kohakuUtils';

type EvolutionProps = {
  userLevel: number;
  subjectProgress: SubjectProgress[];
  className?: string;
};

type EvolutionPhase = 'idle' | 'pre-animation' | 'front-video' | 'post-evolution';

function EvolutionContent({ userLevel, subjectProgress, className = '' }: EvolutionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasEvolutionParam = searchParams.get('evolution') === 'true';
  const [phase, setPhase] = useState<EvolutionPhase>('idle');
  const [displayImage, setDisplayImage] = useState('/images/Kohaku/kohaku-normal.png');
  const frontVideoRef = useRef<HTMLVideoElement>(null);

  const evolvedImageSrc = useMemo(() => getEvolvedImageSrc(subjectProgress), [subjectProgress]);
  const normalImageSrc = '/images/Kohaku/kohaku-normal.png';

  // レンダリング確認用ログ
  console.log('[Evolution] Rendering component. Level:', userLevel);

  // エフェクトの制御
  useEffect(() => {
    // クエリパラメータがある場合、強制的にエフェクトを表示
    if (hasEvolutionParam) {
      // まだ開始していない場合のみ開始
      if (phase === 'idle') {
        console.log('[Evolution Debug] Starting evolution sequence.');
        setPhase('pre-animation');
        setDisplayImage(normalImageSrc);
      }
    } else {
      // パラメータがない場合はアイドル状態に戻す
      if (phase !== 'idle') setPhase('idle');
      // 30の倍数でない、または既に進化済みの場合は、レベルに応じて適切な画像を即時表示
      if (userLevel >= 30) {
        setDisplayImage(evolvedImageSrc);
      } else {
        setDisplayImage(normalImageSrc);
      }
    }
  }, [userLevel, evolvedImageSrc, hasEvolutionParam, normalImageSrc, phase]);

  // フェーズ遷移の制御
  useEffect(() => {
    if (phase === 'pre-animation') {
      // 5秒動かす進化前コハク
      const timer = setTimeout(() => {
        setPhase('front-video');
      }, 5000);
      return () => clearTimeout(timer);
    }

    if (phase === 'post-evolution') {
      setDisplayImage(evolvedImageSrc);
      // 進化後画像が表示されている状態
      // 数秒後に演出終了
      const timer = setTimeout(() => {
        // setPhase('idle'); // URLパラメータ削除検知による自動遷移に任せることで、一瞬進化前に戻るのを防ぐ
        // エフェクト終了後、URLからクエリパラメータを削除
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('evolution');
        router.replace(`?${newParams.toString()}`, { scroll: false });
        router.refresh();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, evolvedImageSrc, router, searchParams]);

  // Front動画の再生を確実に行うための制御
  useEffect(() => {
    if (phase === 'front-video' && frontVideoRef.current) {
      // 明示的に再生を実行
      const playPromise = frontVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e: any) => {
          // DOM削除による中断エラーなどは無視する
          if (e?.name === 'AbortError' || e?.message?.includes('interrupted')) return;
          console.error('Front video play failed:', e);
        });
      }
    }
  }, [phase]);

  // エフェクト表示中でなく、かつ進化パラメータもない場合は何も表示しない（オーバーレイを消す）
  if (phase === 'idle' && !hasEvolutionParam) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black ${className}`}>
      {/* 進化エフェクト (Back) - 進化後のみ表示 */}
      {phase === 'post-evolution' && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <video
            src="/images/evolution/action/back.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* コハク画像 - Front動画再生中は非表示 */}
      {phase !== 'front-video' && (
        <div className={`relative z-10 transition-all duration-1000 ease-in-out ${phase === 'pre-animation' ? 'animate-bounce scale-110' : 'scale-100 brightness-100'}`}>
          <Image
            src={displayImage}
            alt="Kohaku"
            width={600}
            height={600}
            className="object-contain drop-shadow-lg max-w-[80vw] max-h-[80vh]"
            priority
          />
        </div>
      )}

      {/* 進化エフェクト (Front) - 最初に再生 */}
      {phase === 'front-video' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
          <video
            ref={frontVideoRef}
            src="/images/evolution/action/front.mp4"
            autoPlay
            muted
            // loopはさせず、終了を検知する
            playsInline
            onEnded={() => setPhase('post-evolution')}
            onError={(e) => console.error('Video load error:', e)}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

export default function Evolution(props: EvolutionProps) {
  return (
    <Suspense fallback={<div className={props.className} />}>
      <EvolutionContent {...props} />
    </Suspense>
  );
}
