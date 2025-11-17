"use client";

import React, { useState, useEffect } from 'react';

interface AnswerEffectProps {
  type: 'correct' | 'incorrect';
  onAnimationEnd: () => void;
}

const AnswerEffect: React.FC<AnswerEffectProps> = ({ type, onAnimationEnd }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onAnimationEnd();
    }, 1000); // エフェクト表示時間

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  if (!isVisible) return null;

  const effectClass = type === 'correct' ? 'correct-effect' : 'incorrect-effect';

  return (
    <div className={`answer-effect-container ${effectClass}`}>
      {type === 'correct' ? '⭕' : '❌'}
    </div>
  );
};

export default AnswerEffect;
