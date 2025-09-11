'use client';

import React, { useRef, useState } from 'react';
import { FormatState } from '../types/AdminTypes';

interface PostEditorProps {
    onPost: (content: string) => Promise<void>;
}

export const PostEditor: React.FC<PostEditorProps> = ({ onPost }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [content, setContent] = useState('');
    const [formatState, setFormatState] = useState<FormatState>({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false
    });
    
    const editorRef = useRef<HTMLDivElement>(null);

    // エディター展開処理
    const handleExpand = () => {
        setIsExpanded(true);
        setTimeout(() => editorRef.current?.focus(), 100);
    };

    // エディター縮小処理
    const handleCollapse = () => {
        setIsExpanded(false);
        setContent('');
        setFormatState({ bold: false, italic: false, underline: false, strikethrough: false });
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
    };

    // 投稿処理
    const handleSubmit = async () => {
        if (!content.trim()) {
            alert('内容が空です。');
            return;
        }
        
        try {
            await onPost(content);
            handleCollapse();
        } catch (error) {
            console.error('投稿エラー:', error);
        }
    };

    // フォーマット適用
    const applyFormat = (command: string) => {
        document.execCommand(command, false, undefined);
        setFormatState({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough')
        });
    };

    // エディター内容変更処理
    const handleEditorChange = () => {
        if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
        }
    };

    // その他のツール機能
    const insertList = () => document.execCommand('insertUnorderedList', false, undefined);
    const handleFileAttach = () => alert('ファイル添付機能');
    const handleVideoEmbed = () => alert('動画埋め込み機能');
    const handleFileUpload = () => alert('ファイルアップロード機能');
    const handleLinkInsert = () => {
        const url = prompt('URLを入力してください:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    };

    return (
        <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            transition: 'all 0.3s ease'
        }}>
            {!isExpanded ? (
                // 縮小状態のエディター
                <div onClick={handleExpand} style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'text',
                    padding: '8px 0'
                }}>
                    {/* ユーザーアバター */}
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#00bcd4',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px'
                    }}>
                        <span style={{ color: '#fff', fontSize: '14px' }}>ク</span>
                    </div>
                    {/* プレースホルダーテキスト */}
                    <div style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: '#9e9e9e'
                    }}>
                        クラスへの連絡事項を入力
                    </div>
                </div>
            ) : (
                // 展開状態のエディター
                <div style={{ animation: 'expandEditor 0.3s ease-out' }}>
                    {/* エディターヘッダー */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#00bcd4',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px'
                        }}>
                            <span style={{ color: '#fff', fontSize: '14px' }}>ク</span>
                        </div>
                        <span style={{ fontSize: '14px', color: '#3c4043' }}>
                            クラスへの連絡事項を入力
                        </span>
                    </div>

                    {/* テキストエディター */}
                    <div
                        ref={editorRef}
                        contentEditable={true}
                        onInput={handleEditorChange}
                        style={{
                            minHeight: '120px',
                            padding: '12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            backgroundColor: '#fff',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            outline: 'none',
                            marginBottom: '16px'
                        }}
                        data-placeholder="内容を入力してください..."
                    />

                    {/* フォーマットツールバー */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 0',
                        borderTop: '1px solid #e0e0e0',
                        marginBottom: '16px'
                    }}>
                        {/* フォーマットボタン */}
                        <button onClick={() => applyFormat('bold')} style={{
                            padding: '6px 8px',
                            border: `1px solid ${formatState.bold ? '#a1c2fa' : '#e0e0e0'}`,
                            backgroundColor: formatState.bold ? '#e3f2fd' : '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }} title="太字">B</button>

                        <button onClick={() => applyFormat('italic')} style={{
                            padding: '6px 8px',
                            border: `1px solid ${formatState.italic ? '#a1c2fa' : '#e0e0e0'}`,
                            backgroundColor: formatState.italic ? '#e3f2fd' : '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontStyle: 'italic'
                        }} title="斜体">I</button>

                        <button onClick={() => applyFormat('underline')} style={{
                            padding: '6px 8px',
                            border: `1px solid ${formatState.underline ? '#a1c2fa' : '#e0e0e0'}`,
                            backgroundColor: formatState.underline ? '#e3f2fd' : '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }} title="下線">U</button>

                        <button onClick={() => applyFormat('strikeThrough')} style={{
                            padding: '6px 8px',
                            border: `1px solid ${formatState.strikethrough ? '#a1c2fa' : '#e0e0e0'}`,
                            backgroundColor: formatState.strikethrough ? '#e3f2fd' : '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textDecoration: 'line-through'
                        }} title="取り消し線">S</button>

                        {/* リストボタン */}
                        <button onClick={insertList} style={{
                            padding: '6px 8px',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }} title="リスト">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                            </svg>
                        </button>

                        {/* 区切り線 */}
                        <div style={{
                            width: '1px',
                            height: '24px',
                            backgroundColor: '#e0e0e0',
                            margin: '0 4px'
                        }} />

                        {/* その他のツールボタン */}
                        <button onClick={handleFileAttach} style={{
                            padding: '6px 8px',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }} title="ファイル添付">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                            </svg>
                        </button>

                        <button onClick={handleVideoEmbed} style={{
                            padding: '6px 8px',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }} title="動画">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                            </svg>
                        </button>

                        <button onClick={handleFileUpload} style={{
                            padding: '6px 8px',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }} title="アップロード">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                            </svg>
                        </button>

                        <button onClick={handleLinkInsert} style={{
                            padding: '6px 8px',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }} title="リンク">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
                                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.9C4.29 7 2.2 9.09 2.2 11.7s2.09 4.7 4.7 4.7H11v-1.9H6.9c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm5-6h4.1c2.61 0 4.7 2.09 4.7 4.7s-2.09 4.7-4.7 4.7H13v1.9h4.1c2.61 0 4.7-2.09 4.7-4.7S19.71 7 17.1 7H13v1.9z"/>
                            </svg>
                        </button>
                    </div>

                    {/* アクションボタン */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px'
                    }}>
                        <button onClick={handleCollapse} style={{
                            padding: '8px 16px',
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#fff',
                            color: '#5f6368',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            キャンセル
                        </button>

                        <button onClick={handleSubmit} style={{
                            padding: '8px 16px',
                            border: 'none',
                            backgroundColor: '#2196f3',
                            color: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            投稿
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
