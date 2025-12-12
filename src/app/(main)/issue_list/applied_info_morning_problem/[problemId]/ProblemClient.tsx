'use client';

import React, { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- コンポーネントのインポート ---
// 修正: basic_info_b_problem ではなく、ローカルの(応用午前用の)コンポーネントをインポート
import ProblemStatement from '../components/ProblemStatement';
import KohakuChat from '@/components/KohakuChat';

// --- データと型、アクションのインポート ---
import { getNextProblemId, awardXpForCorrectAnswer, recordStudyTimeAction, recordAnswerAction } from '@/lib/actions';
import toast from 'react-hot-toast';
import type { SerializableProblem } from '@/lib/data';
import { getHintFromAI } from '@/lib/actions/hintactions';
import AnswerEffect from '@/components/AnswerEffect';

const MAX_HUNGER = 200;

const getPetDisplayState = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return {
      icon: '/images/Kohaku/kohaku-full.png',
    };
  } else if (hungerLevel >= 100) {
    return {
      icon: '/images/Kohaku/kohaku-normal.png',
    };
  } else if (hungerLevel >= 50) {
    return {
      icon: '/images/Kohaku/kohaku-hungry.png',
    };
  } else {
    return {
      icon: '/images/Kohaku/kohaku-starving.png',
    };
  }
};

// --- 多言語対応テキストリソース ---
const textResources = {
  ja: {
    problemStatement: {
      title: "問題",
      // programTitle: "（プログラム）", // 不要なので削除またはコメントアウト
      answerGroup: "解答群",
      explanationTitle: "解説",
      hintInit: "こんにちは！何かわからないことはありますか？",
      hintCorrect: "正解です！解説も読んで理解を深めましょう！",
      hintIncorrect: (correctValue: string) => `残念、正解は「${correctValue}」でした。解説を読んでみましょう。`,
      kohakuChatTitle: "コハクに質問",
      chatInputPlaceholder: "コハクに質問する...",
      sendButton: "質問",
      nextProblemButton: "次の問題へ",
      noCreditsMessage: "アドバイス回数が残っていません。プロフィールページでXPと交換できます。",
      noCreditsPlaceholder: "アドバイス回数がありません",
    },
  },
  en: {
    problemStatement: {
      title: "Problem",
      // programTitle: "(Program)", // 不要なので削除またはコメントアウト
      answerGroup: "Answer Choices",
      explanationTitle: "Explanation",
      hintInit: "Hello! Is there anything I can help you with?",
      hintCorrect: "That's correct! Let's read the explanation to deepen your understanding!",
      hintIncorrect: (correctValue: string) => `Unfortunately, the correct answer was "${correctValue}". Let's read the explanation.`,
      kohakuChatTitle: "Ask Kohaku",
      chatInputPlaceholder: "Ask Kohaku...",
      sendButton: "Ask",
      nextProblemButton: "Next Problem",
      noCreditsMessage: "No advice credits remaining. You can exchange XP for credits on your profile page.",
      noCreditsPlaceholder: "No credits remaining",
    },
  },
} as const;

const isCorrectAnswer = (selected: string | null, correct: string): boolean => {
  if (selected === null) return false;
  return selected.trim() === correct.trim();
};

type Language = 'ja' | 'en';
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };

interface ProblemClientProps {
  initialProblem: SerializableProblem;
  initialCredits: number;
}

const ProblemClient: React.FC<ProblemClientProps> = ({ initialProblem, initialCredits }) => {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [problem, setProblem] = useState<SerializableProblem>(initialProblem);
  const [credits, setCredits] = useState(initialCredits);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const startTimeRef = useRef<number | null>(null);
  const [kohakuIcon, setKohakuIcon] = useState('/images/Kohaku/kohaku-normal.png');
  const [answerEffectType, setAnswerEffectType] = useState<'correct' | 'incorrect' | null>(null);

  // ペット情報の取得ロジック (ProblemSolverPage.tsxと同様)
  const refetchPetStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/pet/status');
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          const displayState = getPetDisplayState(data.hungerlevel);
          setKohakuIcon(displayState.icon);
        }
      }
    } catch (error) {
      console.error("ペット情報の取得に失敗:", error);
    }
  }, []);

  // 初期ロード時とイベントリスナー設定
  useEffect(() => {
    refetchPetStatus();
    window.addEventListener('petStatusUpdated', refetchPetStatus);
    return () => {
      window.removeEventListener('petStatusUpdated', refetchPetStatus);
    };
  }, [refetchPetStatus]);

  useEffect(() => {
    setProblem(initialProblem);
    setCredits(initialCredits);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setChatMessages([{ sender: 'kohaku', text: textResources[language].problemStatement.hintInit }]);
    startTimeRef.current = Date.now();
    return () => {
      if (startTimeRef.current) {
        const endTime = Date.now();
        const durationMs = endTime - startTimeRef.current;
        // const problemIdForLog = initialProblem?.id || 'unknown';
        startTimeRef.current = null;
        // 滞在時間の記録が必要ならここで recordStudyTimeAction を呼び出す
        if (durationMs > 3000) {
          recordStudyTimeAction(durationMs).catch(e => console.error(e));
        }
      }
    };
  }, [initialProblem, initialCredits, language]);

  const t = textResources[language].problemStatement;

  const handleSelectAnswer = async (selectedValue: string) => {
    if (isAnswered) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);
    const correct = isCorrectAnswer(selectedValue, problem.correctAnswer);
    setAnswerEffectType(correct ? 'correct' : 'incorrect');

    if (correct) {
      const numericId = parseInt(problem.id, 10);
      if (!isNaN(numericId)) {
        try {
          // 応用情報午前問題の subjectId は 5 と想定（DBシードに合わせて調整してください）
          const result = await awardXpForCorrectAnswer(numericId, undefined, 5, startTimeRef.current || Date.now());
          if (result.message === '経験値を獲得しました！') {
            window.dispatchEvent(new CustomEvent('petStatusUpdated'));
          }
          if (result.unlockedTitle) {
            toast.success(`称号【${result.unlockedTitle.name}】を獲得しました！`);
          }
        } catch (error) {
          toast.error('経験値の付与に失敗しました。');
        }
      }
    } else {
      // Log incorrect answer
      const numericId = parseInt(problem.id, 10);
      if (!isNaN(numericId)) {
        try {
          await recordAnswerAction(numericId, 5, false, selectedValue);
        } catch (error) {
          console.error(error);
        }
      }
    }

    const hint = correct ? t.hintCorrect : t.hintIncorrect(problem.correctAnswer);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
  };

  const handleAnimationEnd = useCallback(() => {
    setAnswerEffectType(null);
  }, []);

  const handleUserMessage = async (message: string) => {
    if (credits <= 0) {
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: t.noCreditsMessage }]);
      return;
    }

    setChatMessages(prev => [...prev, { sender: 'user', text: message }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/User/decrement-credit', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'クレジットの更新に失敗しました。');
      setCredits(data.newCredits);

      const context = {
        problemTitle: problem.title[currentLang],
        problemDescription: problem.description[currentLang],
        problemType: problem.logicType,
        // userCode: problem.programLines?.[currentLang]?.join('\n') || '' // プログラムはないので空文字か、選択肢を渡す
        userCode: '',
        answerOptions: JSON.stringify(problem.answerOptions?.[currentLang]), // AIに選択肢の情報を渡す
        explanation: problem.explanationText?.[currentLang],
      };
      const hint = await getHintFromAI(message, context);
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: hint }]);
    } catch (error: any) {
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: error.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNextProblem = async () => {
    const nextProblemId = await getNextProblemId(parseInt(problem.id), 'applied_info_morning_problem');
    if (nextProblemId) {
      router.push(`/issue_list/applied_info_morning_problem/${nextProblemId}`);
    } else {
      toast.success("これが最後の問題です！");
      router.push('/issue_list');
    }
  };

  const currentLang = language;

  return (
    <div className="min-h-screen flex flex-col items-center py-10">
      {answerEffectType && (
        <AnswerEffect type={answerEffectType} onAnimationEnd={handleAnimationEnd} />
      )}
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 bg-white p-8 rounded-lg shadow-md min-h-[600px] flex flex-col lg:col-span-8 lg:col-start-3">
          {/* 出典情報があれば表示するエリア（オプション） */}
          <div className="text-center text-gray-500 mb-2 text-sm">
            {problem.sourceYear} {problem.sourceNumber}
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {problem.title[currentLang]}
          </h1>
          <ProblemStatement
            description={problem.description[currentLang]}
            imagePath={problem.imagePath} // ここで画像パスを渡す
            answerOptions={problem.answerOptions?.[currentLang] || []}
            onSelectAnswer={handleSelectAnswer}
            selectedAnswer={selectedAnswer}
            correctAnswer={problem.correctAnswer}
            isAnswered={isAnswered}
            explanation={problem.explanationText?.[currentLang] || ''}
            language={language}
            textResources={{ ...t, title: t.title }} // タイトルは上で表示しているので、t.titleをそのまま渡すか、調整してください
          />
        </div>

        {/* コハクチャットエリア */}
        <div className="lg:w-1/3 w-full lg:sticky lg:top-10 mt-8 lg:mt-0">
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
          <KohakuChat
            messages={chatMessages}
            onSendMessage={handleUserMessage}
            language={language}
            textResources={{ ...t, chatInputPlaceholder: credits > 0 ? t.chatInputPlaceholder : t.noCreditsPlaceholder }}
            isLoading={isPending || isAiLoading}
            isDisabled={credits <= 0 || isPending || isAiLoading}
            kohakuIcon={kohakuIcon}
          />
        </div>
      </div>

      {isAnswered && (
        <div className="w-full max-w-lg mt-8 mb-10 flex justify-center px-4">
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