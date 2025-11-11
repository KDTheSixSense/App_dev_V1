'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface GroupLayoutProps {
    children: React.ReactNode;
}

export const GroupLayout: React.FC<GroupLayoutProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname(); // 現在のURLパスを取得

    return (
        <div style={{
            fontFamily: "'Hiragino Sans', 'ヒラギノ角ゴシック', 'Yu Gothic', 'メイリオ', sans-serif",
            backgroundColor: '#ffffff', // ★ 全体の背景色を白に
            minHeight: '100vh',
            paddingTop: '80px', // ヘッダーの高さを考慮
        }}>
            <div style={{ display: 'flex', position: 'relative' }}>
                {/* メインコンテンツ */}
                <main style={{
                    flex: 1,
                    marginLeft: '0',
                    padding: '24px 48px',
                    transition: 'margin-left 0.3s ease',
                    width: '100%' // 幅を計算
                }}>
                    {children}
                </main>
            </div>
            {/* CSSアニメーション */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes expandEditor {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                        max-height: 0;
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                        max-height: 500px;
                    }
                }
                
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9e9e9e;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};