// /workspaces/my-next-app/src/app/(main)/event/admin/create_event/CreateEventClient.tsx
'use client';

import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { type ProblemSelectItem } from './page'; // page.tsx から型をインポート
import {
  createEventAction,
  saveEventDraftAction,
  getMyDraftEventsAction,
  getDraftEventDetailsAction, 
} from '@/lib/actions';
import { useRouter } from 'next/navigation';

// CSS Modules を使うとスタイリングが楽です
// このファイルは次のステップで作成します
import styles from './CreateEvent.module.css'; 

type Tab = 'basic' | 'problems';

interface DraftEvent {
  id: number;
  title: string;
}

interface Props {
  problems: ProblemSelectItem[];
}

export function CreateEventClient({ problems }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  
  // フォームの状態管理
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [publicTime, setPublicTime] = useState('');
  const [selectedProblemIds, setSelectedProblemIds] = useState<number[]>([]);

  // 通信状態
  const [isLoading, setIsLoading] = useState(false);

  // 下書き保存ハンドラ
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [draftsList, setDraftsList] = useState<DraftEvent[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // マウント時に下書きリストを読み込む
  useEffect(() => {
    const loadDrafts = async () => {
      const result = await getMyDraftEventsAction();
      if (result.data) {
        setDraftsList(result.data);
      } else if (result.error) {
        toast.error(result.error); // 
      }
    };
    loadDrafts();
  }, []); // マウント時に一度だけ実行

  // 下書き読み込みボタンのハンドラ
  const handleLoadDraft = async () => {
    if (!selectedDraftId) {
      toast.error('読み込む下書きを選択してください。');
      return;
    }

    setIsLoadingDraft(true);

    try {
      const result = await getDraftEventDetailsAction(Number(selectedDraftId));

      if (result.data) {
        const { data } = result;
        setTitle(data.title);
        setDescription(data.description);
        setStartTime(data.startTime);
        setEndTime(data.endTime);
        setPublicTime(data.publicTime);
        setSelectedProblemIds(data.selectedProblemIds);
        toast.success('下書きを読み込みました。');
      } else {
        toast.error(result.error || '読み込みに失敗しました。');
      }
    } catch (err) {
      toast.error('クライアントエラーが発生しました。');
    } finally {
      setIsLoadingDraft(false);
    }
  };

  // プログラミング問題のチェックボックスハンドラ
  const handleProblemToggle = (problemId: number) => {
    setSelectedProblemIds((prev) =>
      prev.includes(problemId)
        ? prev.filter((id) => id !== problemId)
        : [...prev, problemId]
    );
  };

  // イベント作成ボタンのハンドラ
  const handleSubmit = async () => {
    
    // 1. 基本設定タブの必須項目をチェック
    if (!title) {
      toast.error('イベントタイトル名を入力してください。');
      setActiveTab('basic'); // エラーのあるタブに強制移動
      return;
    }
    if (!description) {
      toast.error('イベント説明を入力してください。');
      setActiveTab('basic');
      return;
    }
    if (!startTime || !endTime || !publicTime) {
      toast.error('すべての日時（開始・終了・公開）を入力してください。');
      setActiveTab('basic');
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
       toast.error('終了日時は開始日時より後に設定してください。');
       setActiveTab('basic');
       return;
    }

    // 2. プログラミング問題タブの必須項目をチェック
    if (selectedProblemIds.length === 0) {
      toast.error('プログラミング問題を1つ以上選択してください。');
      setActiveTab('problems'); // エラーのあるタブに強制移動
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await createEventAction({
        title,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        publicTime: new Date(publicTime).toISOString(),
        selectedProblemIds,
      });

      if (result.success) {
        toast.success('イベントを作成しました！');
        // イベント詳細ページや一覧ページにリダイレクト
        router.push(`/event/event_list`); // TODO: 適切なパスに変更
      } else {
        toast.error(result.error || '不明なエラーが発生しました。');
      }
    } catch (err) {
      toast.error('クライアントエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // ▼▼▼ 下書き保存ボタンのハンドラを新しく作成 ▼▼▼
  const handleSaveDraft = async () => {

    // 下書き用のクライアントバリデーション (タイトルのみ)
    if (!title) {
      toast.error('下書き保存するには、イベントタイトル名が必須です。');
      setActiveTab('basic');
      return;
    }

    setIsSavingDraft(true);
    
    try {
      const result = await saveEventDraftAction({
        title,
        description,
        startTime: startTime ? new Date(startTime).toISOString() : '',
        endTime: endTime ? new Date(endTime).toISOString() : '',
        publicTime: publicTime ? new Date(publicTime).toISOString() : '',
        selectedProblemIds,
      });

      if (result.success) {
        toast.success(result.message || '下書きを保存しました。');
        // ここではページ遷移せず、成功メッセージを出すだけ
      } else {
        toast.error(result.error || '不明なエラーが発生しました。');
      }
    } catch (err) {
      toast.error('クライアントエラーが発生しました。');
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className={styles.eventCreator}>
      {/* タブ切り替え */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'basic' ? styles.active : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          基本設定
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'problems' ? styles.active : ''}`}
          onClick={() => setActiveTab('problems')}
        >
          プログラミング問題
        </button>
      </div>

      {/* メインコンテンツ */}
      <div className={styles.tabContent}>
        {/* ----- 基本設定タブ ----- */}
        {activeTab === 'basic' && (
          <div className={styles.formSection}>
            {/*下書き読み込みUIのロジックを接続) */}
            <div className={styles.draftLoaderSection}>
              <label htmlFor="draft-select">下書きを読み込む:</label>
              <select 
                id="draft-select"
                value={selectedDraftId}
                onChange={(e) => setSelectedDraftId(e.target.value)}
                disabled={draftsList.length === 0 || isLoadingDraft}
              >
                <option value="">-- 下書きを選択 --</option>
                {draftsList.map((draft) => (
                  <option key={draft.id} value={draft.id}>
                    {draft.title}
                  </option>
                ))}
              </select>
              <button 
                onClick={handleLoadDraft}
                disabled={!selectedDraftId || isLoadingDraft}
              >
                {isLoadingDraft ? '読込中...' : '読み込む'}
              </button>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="title">イベントタイトル名 <span className={styles.required}>必須*</span></label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：プログラミングイベント！"
                disabled={isLoading}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description">イベント説明 <span className={styles.required}>必須*</span></label>
              {/* TODO: B/I/U/S のリッチテキストエディタを導入 (ここではtextareaで代用) */}
              <textarea
                id="description"
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例：イベントを○月○日開催します"
                disabled={isLoading}
              />
            </div>

            <div className={styles.dateGroup}>
              <div className={styles.formGroup}>
                <label htmlFor="startTime">開始日時</label>
                <input 
                  type="datetime-local" 
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="endTime">終了日時</label>
                <input 
                  type="datetime-local" 
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="publicTime">公開日時</label>
                <input 
                  type="datetime-local" 
                  id="publicTime"
                  value={publicTime}
                  onChange={(e) => setPublicTime(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* ----- プログラミング問題タブ ----- */}
        {activeTab === 'problems' && (
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label>プログラミング問題選択 <span className={styles.required}>1つ以上選択 必須*</span></label>
              <div className={styles.problemList}>
                {problems.length > 0 ? (
                  problems.map((problem) => (
                    <div key={problem.id} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        id={`problem-${problem.id}`}
                        checked={selectedProblemIds.includes(problem.id)}
                        onChange={() => handleProblemToggle(problem.id)}
                        disabled={isLoading}
                      />
                      <label htmlFor={`problem-${problem.id}`}>{problem.title}</label>
                    </div>
                  ))
                ) : (
                  <p>登録されている問題がありません。</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* エラーメッセージ */}

      {/*  成功メッセージ(下書き用) を追加  */}

      {/* フッターボタン */}
      <div className={styles.footerActions}>
        {/* ボタンのロジックを更新 */}
        <button 
          className={styles.saveDraftButton} 
          onClick={handleSaveDraft}
          disabled={isLoading || isSavingDraft} // どちらかが実行中なら無効
        >
          {isSavingDraft ? '保存中...' : '下書き保存'}
        </button>
        <button 
          className={styles.createEventButton} 
          onClick={handleSubmit}
          disabled={isLoading || isSavingDraft} // どちらかが実行中なら無効
        >
          {isLoading ? '作成中...' : 'イベント作成'}
        </button>
      </div>
    </div>
  );
}