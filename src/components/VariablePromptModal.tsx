'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type VariablePromptModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    defaultValue?: string;
    title?: string;
    message?: string;
    confirmColor?: string;
};

/**
 * 変数名入力プロンプトモーダル
 * 
 * ユーザーに新しい変数名の入力などを求めるための汎用的なモーダルダイアログです。
 * ブラウザ標準の prompt() の代替として、UIの一貫性を保つために使用されます。
 */
const VariablePromptModal: React.FC<VariablePromptModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    defaultValue = '',
    title = '新しい変数の名前:',
    message,
    confirmColor = '#3b82f6', // Default blue
}) => {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [isOpen, defaultValue]);

    const handleConfirm = () => {
        if (value.trim()) {
            onConfirm(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white text-gray-800 rounded-lg shadow-2xl w-full max-w-md flex flex-col border border-gray-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-700">
                        {title}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {message && <p className="mb-4 text-gray-500 text-sm">{message}</p>}
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                        style={{
                            borderColor: 'transparent',
                            boxShadow: `0 0 0 2px ${confirmColor}33` // 20% opacity for ring
                        }}
                        placeholder="入力してください..."
                    />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-lg bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!value.trim()}
                        className="px-6 py-2 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-transform hover:scale-105 active:scale-95 shadow-md"
                        style={{ backgroundColor: confirmColor }}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariablePromptModal;
