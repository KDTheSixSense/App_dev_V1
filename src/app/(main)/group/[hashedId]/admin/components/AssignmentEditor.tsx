'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ★ 追加
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import { FormatState, ProgrammingProblem, Assignment } from '../types/AdminTypes';
import { ProblemTypeSelectModal } from './ProblemTypeSelectModal';

interface AssignmentEditorProps {
    isExpanded: boolean;
    onExpand: () => void;
    onCollapse: () => void;
    onCreateAssignment: (assignmentData: any) => Promise<void>;
    onUpdateAssignment?: (assignmentData: Assignment) => Promise<void>; // 更新用ハンドラ
    initialAssignment?: Assignment | null; // 編集時の初期データ
    onNavigateToCreateProblem: () => void;
    onNavigateToCreateSelectionProblem: () => void;
    onOpenProblemSelectModal: () => void;
    problemPreview: ProgrammingProblem | null;
    onRemoveProblemPreview?: () => void;
}

export const AssignmentEditor: React.FC<AssignmentEditorProps> = ({
    isExpanded,
    onExpand,
    onCollapse,
    onCreateAssignment,
    onUpdateAssignment,
    initialAssignment,
    onNavigateToCreateProblem,
    onNavigateToCreateSelectionProblem,
    onOpenProblemSelectModal,
    problemPreview,
    onRemoveProblemPreview
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [formatState, setFormatState] = useState<FormatState>({
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false
    });
    const [showCreateOptions, setShowCreateOptions] = useState(false);
    const [showProblemTypeModal, setShowProblemTypeModal] = useState(false);
    const router = useRouter(); // ★ 追加

    const editorRef = useRef<HTMLDivElement>(null);
    const STORAGE_KEY = 'assignment_create_draft';
    const STORAGE_FLAG_KEY = 'assignment_create_in_progress';

    // 初期データが渡された場合（編集モード）、stateを更新
    useEffect(() => {
        if (initialAssignment) {
            setTitle(initialAssignment.title);
            setDescription(initialAssignment.description);
            // datetime-local input expects YYYY-MM-DDThh:mm format
            if (initialAssignment.due_date) {
                const date = new Date(initialAssignment.due_date);
                // 日本時間(JST)に変換してフォーマット
                // Note: This is a simple conversion, might need library for robust timezone handling
                // For now, assuming local time input
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
            } else {
                setDueDate('');
            }

            if (editorRef.current) {
                editorRef.current.innerHTML = DOMPurify.sanitize(initialAssignment.description);
            }
        } else {
            // 新規作成モードの場合、特定の遷移（問題作成）から戻ってきた場合のみ復元
            const shouldRestore = sessionStorage.getItem(STORAGE_FLAG_KEY) === 'true';

            if (shouldRestore) {
                const savedDraft = sessionStorage.getItem(STORAGE_KEY);
                if (savedDraft) {
                    try {
                        const { title: savedTitle, description: savedDescription, dueDate: savedDueDate } = JSON.parse(savedDraft);
                        if (savedTitle) setTitle(savedTitle);
                        if (savedDescription) {
                            setDescription(savedDescription);
                            if (editorRef.current) {
                                editorRef.current.innerHTML = DOMPurify.sanitize(savedDescription);
                            }
                        }
                        if (savedDueDate) setDueDate(savedDueDate);
                    } catch (e) {
                        console.error('Failed to parse assignment draft', e);
                    }
                }
                // フラグを消費（次回は復元しない）
                sessionStorage.removeItem(STORAGE_FLAG_KEY);
            } else {
                // 通常の遷移で来た場合はドラフトをクリア（クリーンな状態で開始）
                sessionStorage.removeItem(STORAGE_KEY);
            }
        }
    }, [initialAssignment]);

    // stateが変更されたらsessionStorageに保存（新規作成モードのみ）
    useEffect(() => {
        if (!initialAssignment) {
            const draft = { title, description, dueDate };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        }
    }, [title, description, dueDate, initialAssignment]);

    // エディター内容変更処理
    const handleEditorChange = () => {
        if (editorRef.current) {
            setDescription(editorRef.current.innerHTML);
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

    // 課題作成・更新処理
    const handleSubmit = async () => {
        if (!title.trim() || !dueDate) {
            toast.error('必須項目が不足しています');
            return;
        }

        try {
            if (initialAssignment && onUpdateAssignment) {
                // 更新処理
                const updatedAssignment: Assignment = {
                    ...initialAssignment,
                    title: title,
                    description: description,
                    due_date: new Date(dueDate).toISOString(),
                    // 問題の更新はproblemPreviewの状態に基づく
                    programmingProblem: problemPreview && problemPreview.type !== 'select' ? problemPreview : undefined,
                    selectProblem: problemPreview && problemPreview.type === 'select' ? problemPreview : undefined,
                };
                await onUpdateAssignment(updatedAssignment);
            } else {
                // 新規作成処理
                const assignmentData: any = {
                    title: title,
                    description: description,
                    dueDate: new Date(dueDate).toISOString(),
                };

                if (problemPreview) {
                    assignmentData.problem = problemPreview;
                }

                await onCreateAssignment(assignmentData);
                // 作成成功時にドラフトとフラグを削除
                sessionStorage.removeItem(STORAGE_KEY);
                sessionStorage.removeItem(STORAGE_FLAG_KEY);
            }
            handleReset();
            router.refresh(); // ★ 追加: 画面更新
        } catch (error) {
            console.error('課題保存エラー:', error);
            toast.error(`課題の保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
        }
    };

    // フォームリセット
    const handleReset = () => {
        setTitle('');
        setDescription('');
        setDueDate('');
        setFormatState({ bold: false, italic: false, underline: false, strikethrough: false });
        setShowCreateOptions(false);
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
        // キャンセル時もドラフトを削除
        if (!initialAssignment) {
            sessionStorage.removeItem(STORAGE_KEY);
            sessionStorage.removeItem(STORAGE_FLAG_KEY);
        }
        onCollapse();
    };

    // 作成オプションボタンクリック
    const handleCreateOptionsClick = () => {
        setShowCreateOptions(!showCreateOptions);
    };

    if (!isExpanded) {
        return (
            <div
                onClick={onExpand}
                style={{
                    padding: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#5f6368',
                    fontSize: '14px',
                    transition: 'background-color 0.2s',
                    borderRadius: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#1976d2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                </div>
                新しい課題を作成
            </div>
        );
    }

    return (
        <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            marginBottom: '24px',
            backgroundColor: '#fff'
        }}>
            {/* 課題タイトル入力 */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="課題のタイトルを入力..."
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '16px',
                        fontWeight: '500',
                        outline: 'none'
                    }}
                />
            </div>

            {/* ツールバー */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
            }}>
                <button
                    onClick={() => applyFormat('bold')}
                    style={{
                        padding: '6px 8px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: formatState.bold ? '#e8f0fe' : '#fff',
                        color: formatState.bold ? '#1976d2' : '#5f6368',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    B
                </button>
                <button
                    onClick={() => applyFormat('italic')}
                    style={{
                        padding: '6px 8px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: formatState.italic ? '#e8f0fe' : '#fff',
                        color: formatState.italic ? '#1976d2' : '#5f6368',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontStyle: 'italic'
                    }}
                >
                    I
                </button>
                <button
                    onClick={() => applyFormat('underline')}
                    style={{
                        padding: '6px 8px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: formatState.underline ? '#e8f0fe' : '#fff',
                        color: formatState.underline ? '#1976d2' : '#5f6368',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textDecoration: 'underline'
                    }}
                >
                    U
                </button>
                <button
                    onClick={() => applyFormat('strikeThrough')}
                    style={{
                        padding: '6px 8px',
                        border: '1px solid #e0e0e0',
                        backgroundColor: formatState.strikethrough ? '#e8f0fe' : '#fff',
                        color: formatState.strikethrough ? '#1976d2' : '#5f6368',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textDecoration: 'line-through'
                    }}
                >
                    S
                </button>
            </div>

            {/* 課題説明エディター */}
            <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleEditorChange}
                data-placeholder="課題の詳細説明を入力..."
                style={{
                    padding: '16px',
                    minHeight: '120px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    outline: 'none',
                    position: 'relative'
                }}
            />

            {/* 期限設定 */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid #e0e0e0',
                borderBottom: '1px solid #e0e0e0'
            }}>
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#3c4043',
                    marginBottom: '8px'
                }}>
                    期限
                </label>
                <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none'
                    }}
                />
            </div>

            {/* 課題作成オプション */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #e0e0e0',
                position: 'relative'
            }}>
                <button
                    onClick={handleCreateOptionsClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        marginBottom: '16px'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    <span>{initialAssignment ? '問題を変更' : '追加または作成'}</span>
                </button>

                {showCreateOptions && (
                    <div style={{
                        position: 'absolute',
                        top: '60px',
                        left: '16px',
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 10,
                        minWidth: '250px',
                        padding: '8px 0'
                    }}>
                        <button
                            onClick={() => {
                                setShowProblemTypeModal(true);
                                setShowCreateOptions(false);
                            }}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                background: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#3c4043'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            問題作成 (新規作成)
                        </button>
                        <button
                            onClick={() => {
                                onOpenProblemSelectModal();
                                setShowCreateOptions(false);
                            }}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                background: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#3c4043'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            問題作成 (既存から選択)
                        </button>
                    </div>
                )}

                {/* プレビューUI */}
                {problemPreview && (
                    <div style={{
                        border: '1px solid #1976d2',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: '#e3f2fd',
                        marginTop: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <p style={{ margin: '0', color: '#1565c0', flex: 1 }}>
                            <strong>添付された問題:</strong> {problemPreview.title}
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={onOpenProblemSelectModal}
                                style={{
                                    background: 'none',
                                    border: '1px solid #1976d2',
                                    color: '#1976d2',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                title="問題を変更"
                            >
                                変更
                            </button>
                            {onRemoveProblemPreview && (
                                <button
                                    onClick={onRemoveProblemPreview}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#d32f2f',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(211, 47, 47, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    title="添付された問題を削除"
                                >
                                    ✕ 削除
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* アクションボタン */}
            <div style={{
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
            }}>
                <button
                    onClick={handleReset}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#5f6368',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    キャンセル
                </button>
                <button
                    onClick={handleSubmit}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    {initialAssignment ? '課題を更新' : '課題を作成'}
                </button>
            </div>

            {/* 問題タイプ選択モーダル */}
            <ProblemTypeSelectModal
                isOpen={showProblemTypeModal}
                onClose={() => setShowProblemTypeModal(false)}
                onSelectProgrammingProblem={() => {
                    // 問題作成へ遷移する前にフラグを立てる
                    sessionStorage.setItem(STORAGE_FLAG_KEY, 'true');
                    onNavigateToCreateProblem();
                    setShowProblemTypeModal(false);
                }}
                onSelectSelectionProblem={() => {
                    // 問題作成へ遷移する前にフラグを立てる
                    sessionStorage.setItem(STORAGE_FLAG_KEY, 'true');
                    onNavigateToCreateSelectionProblem();
                    setShowProblemTypeModal(false);
                }}
            />
        </div>
    );
};

