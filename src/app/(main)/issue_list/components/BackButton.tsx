import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string; // 追加のクラス名を許可
}

const BackButton: React.FC<BackButtonProps> = ({ 
  href = "/issue_list", 
  label = "問題種別一覧へ戻る",
  className = ""
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <Link 
        href={href} 
        className="
          inline-flex items-center gap-2 px-5 py-2.5 
          bg-white text-gray-700 font-bold text-lg rounded-full 
          shadow-sm border border-gray-200 
          hover:shadow-md hover:bg-gray-50 hover:text-blue-600 
          transition-all duration-200 ease-in-out
          transform hover:-translate-y-0.5
        "
      >
        <ArrowLeft className="h-6 w-6" />
        <span>{label}</span>
      </Link>
    </div>
  );
};

export default BackButton;
