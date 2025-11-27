// src/components/help/HelpTour.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HelpStep } from "@/types/help";

interface HelpTourProps {
  steps: HelpStep[];
  onClose: () => void;
}

const HelpTour: React.FC<HelpTourProps> = ({ steps, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];

  // エスケープキーでツアーを終了
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose(); // 最後のステップならツアー終了
    }
  }, [currentStepIndex, steps.length, onClose]);

  const goToPrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  // 現在のステップの要素をハイライトする処理 (ここでは要素をビューポートにスクロールする処理を記述)
  useEffect(() => {
    if (currentStep) {
      const targetElement = document.querySelector(currentStep.targetSelector);
      if (targetElement) {
        // 対象要素を画面中央にスクロール
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 実際のハイライト処理（例：要素に一時的なCSSクラスを付与）
        // targetElement.classList.add('tour-highlight');
        // return () => targetElement.classList.remove('tour-highlight');
      }
    }
  }, [currentStep]);

  if (!currentStep) return null;

  return (
    // Spotlight effect: White overlay with a hole for the target element
    <div className="help-tour-overlay fixed inset-0 z-[9999]">
      {/* Semi-transparent white overlay */}
      <div className="absolute inset-0 bg-white/80"></div>

      {/* Help modal positioned near the spotlight */}
      <div className="help-tour-modal absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/4 bg-white px-6 py-4 rounded-lg shadow-xl w-[1400px] relative z-10 transition-all">
        <h3 className="text-3xl font-bold mb-1 text-gray-900">{currentStep.title}</h3>
        <p className="text-gray-700 mb-2 whitespace-pre-wrap text-xl leading-relaxed">{currentStep.description}</p>

        {currentStep.imagePath && (
          // Next.jsのImageコンポーネントの代わりに標準のimgタグを使用
          <div className="my-2 rounded-lg overflow-hidden min-h-[600px] min-w-[900px] flex items-center justify-center shadow-lg">
            <img
              src={currentStep.imagePath}
              alt={currentStep.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <button
            onClick={goToPrevStep}
            disabled={currentStepIndex === 0}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 transition text-lg"
          >
            {'< 戻る'}
          </button>
          <span className="text-lg text-gray-600">
            {currentStepIndex + 1} / {steps.length}
          </span>
          <button
            onClick={goToNextStep}
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-lg"
          >
            {currentStepIndex === steps.length - 1 ? "終了" : "次へ"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl"
          aria-label="閉じる"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default HelpTour;
