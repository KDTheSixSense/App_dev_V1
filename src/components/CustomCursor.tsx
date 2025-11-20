"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  rotation: number;
}

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [effects, setEffects] = useState<ClickEffect[]>([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const nextId = useRef(0);

  const addStars = useCallback((count: number, x: number, y: number) => {
    const newEffects: ClickEffect[] = [];
    for (let i = 0; i < count; i++) {
      newEffects.push({
        id: nextId.current++,
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 80,
        rotation: Math.random() * 360,
      });
    }

    setEffects(prevEffects => [...prevEffects, ...newEffects]);

    setTimeout(() => {
      setEffects(prevEffects =>
        prevEffects.filter(
          effect => !newEffects.some(newEffect => newEffect.id === effect.id)
        )
      );
    }, 500);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    const onMouseDown = (e: MouseEvent) => {
      setIsMouseDown(true);
      addStars(7, e.clientX, e.clientY);
    };
    const onMouseUp = () => {
      setIsMouseDown(false);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [addStars]);

  useEffect(() => {
    if (isMouseDown) {
      const interval = setInterval(() => {
        addStars(1, position.x, position.y);
      }, 150);

      return () => clearInterval(interval);
    }
  }, [isMouseDown, position, addStars]);

  return (
    <div style={{ pointerEvents: 'none' }}>
      <img
        src="/images/Kohaku/kohaku_pointer.png"
        alt="Fox Tail Cursor"
        className="custom-cursor"
        style={{ left: `${position.x}px`, top: `${position.y}px`, transform: 'translate(-3px, -3px) rotate(-45deg)', zIndex: 99999 }}
      />
      {effects.map(effect => (
        <div
          key={effect.id}
          className="click-effect-wrapper"
          style={{
            left: `${effect.x - 10}px`,
            top: `${effect.y - 10}px`,
            transform: `rotate(${effect.rotation}deg)`,
          }}
        >
          <div className="click-effect">★</div>
        </div>
      ))}
    </div>
  );
};

export default CustomCursor;