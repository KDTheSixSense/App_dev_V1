'use client';

import React, { useState, useEffect, useTransition } from 'react'; // ★ useTransition をインポート
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProblemStatement from '../components/ProblemStatement';
// ★★★ KohakuChat のインポートパスを確認 ★★★
import KohakuChat from '@/components/KohakuChat'; // '@/' から始まるパスに変更 (B問題のコード例より)
import { getNextProblemId, awardXpForCorrectAnswer } from '@/lib/actions';
import { getHintFromAI } from '@/lib/actions/hintactions'; // ★ インポート
import { useNotification } from '@/app/contexts/NotificationContext';
import type { SerializableProblem } from '@/lib/data';

// --- 多言語対応テキストリソース ---
const textResources: Record<'ja' | 'en', {
  problemStatement: {
    title: string;
    programTitle: string; // A問題では使わないが型定義のため残す
    answerGroup: string;
    explanationTitle: string;
    hintInit: string;
    hintCorrect: string;
    hintIncorrect: (correctValue: string) => string;
    kohakuChatTitle: string;
    chatInputPlaceholder: string;
    sendButton: string;
    nextProblemButton: string;
    noCreditsMessage: string;
    noCreditsPlaceholder: string;
  };
}> = {
  ja: {
    problemStatement: {
      title: "問題",
      programTitle: "（プログラム）",
      answerGroup: "解答群",
      explanationTitle: "解説",
      hintInit: "こんにちは！何かわからないことはありますか？",
      hintCorrect: "正解です！解説も読んで理解を深めましょう！",
      hintIncorrect: (correctValue: string) => `残念、正解は「${correctValue}」でした。解説を読んでみましょう。`,
      kohakuChatTitle: "コハクに質問",
      chatInputPlaceholder: "コハクに質問する...",
      sendButton: "送信", // B問題に合わせて "送信" に変更
      nextProblemButton: "次の問題へ",
      noCreditsMessage: "アドバイス回数が残っていません。プロフィールページでXPと交換できます。",
      noCreditsPlaceholder: "アドバイス回数がありません",
    },
  },
  en: {
    problemStatement: {
      title: "Problem",
      programTitle: "(Program)",
      answerGroup: "Answer choices",
      explanationTitle: "Explanation",
      hintInit: "Hello! Do you have any questions?",
      hintCorrect: "Correct! Read the explanation to deepen your understanding!",
      hintIncorrect: (correctValue: string) => `Sorry, the correct answer was "${correctValue}". Please read the explanation.`,
      kohakuChatTitle: "Ask Kohaku",
      chatInputPlaceholder: "Ask Kohaku...",
      sendButton: "Send",
      nextProblemButton: "Next problem",
      noCreditsMessage: "You have no advice attempts left. You can exchange XP on your profile page.",
      noCreditsPlaceholder: "No advice attempts",
    },
  },
};

const isCorrectAnswer = (selected: string | null, correct: string): boolean => {
  if (selected === null) return false;
  return correct ? selected.trim() === correct.trim() : false;
};

type Language = 'ja' | 'en';
// ★ ChatMessage 型を定義
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };

interface ProblemClientProps {
  initialProblem: SerializableProblem;
  initialCredits: number;
}

const ProblemClient: React.FC<ProblemClientProps> = ({ initialProblem, initialCredits }) => {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isPending, startTransition] = useTransition(); 
  const [isAiLoading, setIsAiLoading] = useState(false); 

  const [problem, setProblem] = useState<SerializableProblem | null>(initialProblem);
  const [credits, setCredits] = useState(initialCredits);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]); 
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');

  useEffect(() => {
    if (initialProblem) {
      setProblem(initialProblem);
      setCredits(initialCredits);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setChatMessages([{ sender: 'kohaku', text: textResources[language].problemStatement.hintInit }]);
      console.log('[ProblemClient useEffect] State reset. Image path:', initialProblem?.imagePath);
    } else {
      console.error('[ProblemClient useEffect] Received null initialProblem');
    }
  }, [initialProblem, language]);

  const t = textResources[language].problemStatement;
  const currentLang = language;

  const handleSelectAnswer = async (selectedValue: string) => {
    if (isAnswered || !problem) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);
    const correct = isCorrectAnswer(selectedValue, problem.correctAnswer);

    if (correct) {
      const numericId = parseInt(problem.id, 10);
      if (!isNaN(numericId)) {
        try {
          const result = await awardXpForCorrectAnswer(numericId);
          if (result.message === '経験値を獲得しました！') {
            window.dispatchEvent(new CustomEvent('petStatusUpdated'));
          }
          if (result.unlockedTitle) {
            showNotification({ message: `称号【${result.unlockedTitle.name}】を獲得しました！`, type: 'success' });
          }
        } catch (error) {
          showNotification({ message: '経験値の付与に失敗しました。', type: 'error' });
        }
      }
    }
    // ★ 正誤メッセージをチャットに追加
    const hint = correct ? t.hintCorrect : t.hintIncorrect(problem.correctAnswer);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
  };

  const handleNextProblem = async () => {
    if (!problem) return;
    const nextProblemId = await getNextProblemId(parseInt(problem.id), 'basic_info_a_problem');
    if (nextProblemId) {
      router.push(`/issue_list/basic_info_a_problem/${nextProblemId}`);
    } else {
      showNotification({ message: "これが最後の問題です！", type: 'success' });
      router.push('/issue_list');
    }
  };

  const handleUserMessage = async (message: string) => {
    if (credits <= 0) {
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: t.noCreditsMessage }]);
      return;
    }
    if (!problem) {
        setChatMessages(prev => [...prev, { sender: 'kohaku', text: '問題データが読み込まれていません。' }]);
        return;
    }

    // ユーザーのメッセージをチャットに追加
    setChatMessages(prev => [...prev, { sender: 'user', text: message }]);
    setIsAiLoading(true); // ローディング開始

    try {
      // クレジット消費API呼び出し (パスを確認)
      const res = await fetch('/api/User/decrement-credit', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'クレジットの更新に失敗しました。');
      }
      const data = await res.json();
      setCredits(data.newCredits); // 新しいクレジット数で更新

      // AIに渡すコンテキスト情報 (A問題用に調整)
      const context = {
        problemTitle: problem.title[currentLang],
        problemDescription: problem.description[currentLang],
        userCode: '', // A問題にはコードがない
        // 必要なら選択肢や解説も追加
        answerOptions: JSON.stringify(problem.answerOptions?.[currentLang]),
        explanation: problem.explanationText?.[currentLang],
      };

      // AIヒント取得 (Server Action呼び出し)
      // startTransition を使う場合はここでラップする
       startTransition(async () => {
         const hint = await getHintFromAI(message, context);
         setChatMessages(prev => [...prev, { sender: 'kohaku', text: hint }]);
       });
      // useTransitionを使わない場合は直接呼び出す
      const hint = await getHintFromAI(message, context);
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: hint }]);

    } catch (error: any) {
      // エラーメッセージをチャットに追加
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: `エラーが発生しました: ${error.message}` }]);
      // TODO: クレジット消費をロールバックするAPI呼び出しなどが必要な場合
    } finally {
      setIsAiLoading(false); // ローディング終了
    }
  };

  if (!problem) {
    return <div>問題を読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* 全体を左右に分割 */}
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start w-full">

        {/* 左側: 問題表示エリア */}
        <div className="lg:w-1/2 w-full bg-white p-8 rounded-lg shadow-md min-h-[800px] flex flex-col">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            問{problem.id}: {problem.title[currentLang] || t.title}
          </h1>
          <ProblemStatement
            description={problem.description[currentLang]}
            answerOptions={problem.answerOptions?.[currentLang] || []}
            onSelectAnswer={handleSelectAnswer}
            selectedAnswer={selectedAnswer}
            correctAnswer={problem.correctAnswer}
            isAnswered={isAnswered}
            explanation={problem.explanationText?.[currentLang] || ''}
            imagePath={problem.imagePath}
            language={language}
            textResources={t}
            // programText={''} // programText プロップは削除
          />
        </div>

        {/*  右側: コハクチャットエリア */}
        <div className="lg:w-1/2 w-full lg:sticky lg:top-10"> {/* 追従させる */}
          <div className="bg-white p-3 rounded-t-lg shadow-lg border-b text-center">
            <p className="text-sm text-gray-600">
              AIアドバイス残り回数: <span className="font-bold text-lg text-blue-600">{credits}</span> 回
            </p>
            {credits <= 0 && (
              <Link href="/profile" className="text-xs text-blue-500 hover:underline">
                (XPを消費して増やす)
              </Link>
            )}
          </div>
          {/* KohakuChat コンポーネントを表示 */}
          <KohakuChat
            messages={chatMessages}
            onSendMessage={handleUserMessage} // ★ 実装したハンドラを渡す
            language={language}
            textResources={{...t, chatInputPlaceholder: credits > 0 ? t.chatInputPlaceholder : t.noCreditsPlaceholder}}
            isLoading={isAiLoading} // ★ AIローディング状態を渡す
            isDisabled={credits <= 0 || isAiLoading} // ★ 無効化条件
          />
        </div>
        {/* ★★★ コハクチャットエリアここまで ★★★ */}

      </div>

      {/* 次の問題へボタン */}
      {isAnswered && (
         <div className="w-full max-w-lg mt-8 mb-4 flex justify-center px-4">
           <button
             onClick={handleNextProblem}
             className="w-full py-4 px-8 text-lg font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
           >
             {t.nextProblemButton}
           </button>
         </div>
       )}
    </div>
  );
};

export default ProblemClient;