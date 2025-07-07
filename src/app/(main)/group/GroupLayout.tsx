'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface GroupLayoutProps {
    children: React.ReactNode;
}

export const GroupLayout: React.FC<GroupLayoutProps> = ({ children }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const router = useRouter();
    const pathname = usePathname(); // 現在のURLパスを取得

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // 'settings' ページにいるかどうかをパスで判定
    const isSettingsPage = pathname.includes('/settings'); 
    // グループ関連ページ（一覧または詳細）にいるかどうか
    const isGroupPage = pathname.startsWith('/group');

    return (
        <div style={{
            fontFamily: "'Hiragino Sans', 'ヒラギノ角ゴシック', 'Yu Gothic', 'メイリオ', sans-serif",
            backgroundColor: '#ffffff', // ★ 全体の背景色を白に
            minHeight: '100vh',
            paddingTop: '80px', // ヘッダーの高さを考慮
        }}>
            <div style={{ display: 'flex', position: 'relative' }}>
                {/* サイドバー */}
                <aside style={{
                    width: sidebarCollapsed ? '60px' : '240px',
                    backgroundColor: '#f8f9fa',
                    borderRight: '1px solid #e0e0e0',
                    height: 'calc(100vh - 64px)',
                    padding: '16px 8px',
                    transition: 'width 0.3s ease',
                    position: 'fixed',
                    top: '80px',
                    zIndex: 999,
                    boxSizing: 'border-box'
                }}>
                    <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', width: '100%', padding: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="#5f6368"/></svg>
                    </button>
                    {/* ホームボタン */}
                    <div onClick={() => router.push('/group')} style={{
                        backgroundColor: isGroupPage && !isSettingsPage ? '#e3f2fd' : 'transparent',
                        borderRadius: '24px', padding: '12px 16px', marginBottom: '8px',
                        display: 'flex', alignItems: 'center', cursor: 'pointer',
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isGroupPage && !isSettingsPage ? '#1976d2' : '#5f6368'}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                        {!sidebarCollapsed && <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500', color: isGroupPage && !isSettingsPage ? '#1976d2' : '#5f6368' }}>ホーム</span>}
                    </div>
                    {/* 設定ボタン*/}
                    <div onClick={() => router.push('/group/settings')} style={{ // ★ クリックでページ遷移
                        backgroundColor: isSettingsPage ? '#e8eaf6' : 'transparent',
                        borderRadius: sidebarCollapsed ? '50%' : '24px', padding: sidebarCollapsed ? '12px' : '12px 16px',
                        marginBottom: '8px', display: 'flex', alignItems: 'center', cursor: 'pointer',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start', transition: 'all 0.2s'
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSettingsPage ? '#e8eaf6' : 'transparent'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isSettingsPage ? '#3f51b5' : '#5f6368'}>
                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" /></svg>
                        {!sidebarCollapsed && <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: '500', color: isSettingsPage ? '#3f51b5' : '#5f6368' }}>設定</span>}
                    </div>
                </aside>

                {/* メインコンテンツ */}
                <main style={{
                    flex: 1,
                    marginLeft: sidebarCollapsed ? '60px' : '240px',
                    padding: '24px 48px',
                    transition: 'margin-left 0.3s ease',
                    width: `calc(100% - ${sidebarCollapsed ? '60px' : '240px'})` // 幅を計算
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