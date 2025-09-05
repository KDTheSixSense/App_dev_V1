/* === app/(main)/profile/Advice/Advice.tsx === */
'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

interface AdviceProps {
  advice: string | null;
}

const Advice: React.FC<AdviceProps> = ({ advice }) => {
  if (!advice) {
    return null;
  }
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
        <Lightbulb className="w-6 h-6 mr-2 text-blue-500" />
        AIからの学習アドバイス
      </h3>
      <p className="text-gray-700 leading-relaxed">{advice}</p>
    </div>
  );
};

export default Advice;
