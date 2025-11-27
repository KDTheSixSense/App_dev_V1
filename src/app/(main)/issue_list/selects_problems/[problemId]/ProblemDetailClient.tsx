'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SelectProblem } from '@prisma/client';
import Link from 'next/link';
import type { Problem as SerializableProblem } from '@/lib/types';
import ProblemStatement from '../components/ProblemStatement'; // パスは環境に合わせて調整してください
import KohakuChat from '@/components/KohakuChat';
import { recordStudyTimeAction, awardXpForCorrectAnswer } from '@/lib/actions';
import AnswerEffect from '@/components/AnswerEffect';
import { useNotification } from '@/app/contexts/NotificationContext'; // 通知用
import { getHintFromAI } from '@/lib/actions/hintactions'; // AIヒント用

const MAX_HUNGER = 200;

const getPetDisplayState = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return { icon: '/images/Kohaku/kohaku-full.png' };
  } else if (hungerLevel >= 100) {
    return { icon: '/images/Kohaku/kohaku-normal.png' };
  } else if (hungerLevel >= 50) {
    return { icon: '/images/Kohaku/kohaku-hungry.png' };
  } else {
    return { icon: '/images/Kohaku/kohaku-starving.png' };
  }
};

// サーバーから渡されるデータの型
interface ProblemDetailClientProps {
  problem: SelectProblem & { imagePath?: string }; // 画像パスを含めるよう拡張
  initialCredits: number; // クレジット数を追加
}

// 多言語リソース
const textResources = {
  ja: {
    problemStatement: {
      title: "問題",
      // programTitle: "（プログラム）", // ★削除: プログラム表記を消すため
      answerGroup: "解答群",
      explanationTitle: "解説",
      hintInit: "こんにちは！何かわからないことはありますか？",
      hintCorrect: "正解です！解説も読んで理解を深めましょう！",
      hintIncorrect: (correctValue: string) => `残念、正解は「${correctValue}」でした。もう一度問題を見直したり、解説を読んでみましょう。`,
      kohakuChatTitle: "コハクに質問",
      chatInputPlaceholder: "コハクに質問...",
      sendButton: "質問",
      nextProblemButton: "次の問題へ",
      noCreditsMessage: "アドバイス回数が残っていません。プロフィールページでXPと交換できます。",
      noCreditsPlaceholder: "アドバイス回数がありません",
    },
  },
  en: {
    problemStatement: {
      title: "Problem",
      // programTitle: "(Program)", // ★削除
      answerGroup: "Answer Choices",
      explanationTitle: "Explanation",
      hintInit: "Hello! Is there anything I can help you with?",
      hintCorrect: "That's correct! Let's deepen your understanding by reading the explanation!",
      hintIncorrect: (correctValue: string) => `Unfortunately, the correct answer was "${correctValue}". Let's review the problem.`,
      kohakuChatTitle: "Ask Kohaku",
      chatInputPlaceholder: "Ask Kohaku...",
      sendButton: "Ask",
      nextProblemButton: "Next Problem",
      noCreditsMessage: "No advice credits remaining.",
      noCreditsPlaceholder: "No credits remaining",
    },
  },
} as const;

type Language = 'ja' | 'en';
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };

const isCorrectAnswer = (selected: string | null, correct: string): boolean => {
  if (selected === null) return false;
  return selected.trim() === correct.trim();
};

const ProblemDetailClient: React.FC<ProblemDetailClientProps> = ({ problem: initialProblem, initialCredits }) => {
  const router = useRouter();
  const { showNotification } = useNotification();
  
  // データ整形関数
  const formatProblem = (p: SelectProblem & { imagePath?: string }): SerializableProblem => {
    const answerOptionsArray = Array.isArray(p.answerOptions) ? p.answerOptions.map(String) : [];
    
    // seedで画像パスがdescriptionに含まれている場合の対応（念のため）
    // もしDBのimagePathカラムがあるなら p.imagePath を優先
    let displayImagePath = p.imagePath; 

    // 問題IDを取得し、11以上なら 'A, B, C, D'、それ以外（1-10）なら 'ア, イ, ウ, エ' を使用
    const problemIdNum = parseInt(String(p.id), 10);
    const useABCD = !isNaN(problemIdNum) && problemIdNum >= 11;

    const labelsJa = useABCD ? ['A', 'B', 'C', 'D'] : ['ア', 'イ', 'ウ', 'エ'];
    const labelsEn = ['A', 'B', 'C', 'D'];
    
    return {
      id: String(p.id),
      logicType: 'TYPE_A',
      title: { ja: p.title, en: p.title },
      description: { ja: p.description, en: p.description },
      programLines: { ja: [], en: [] }, // 空配列にしておく
      answerOptions: {
        // 定義したラベル配列を使用
        ja: answerOptionsArray.map((opt, i) => ({ label: labelsJa[i] || '', value: opt })),
        en: answerOptionsArray.map((opt, i) => ({ label: labelsEn[i] || '', value: opt })),
      },
      correctAnswer: p.correctAnswer,
      explanationText: { ja: p.explanation || '', en: p.explanation || '' },
      initialVariables: {},
      traceLogic: [],
      imagePath: displayImagePath, // ★画像パスを追加
    };
  };

  const [problem, setProblem] = useState<SerializableProblem>(() => formatProblem(initialProblem));
  const [credits, setCredits] = useState(initialCredits);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [kohakuIcon, setKohakuIcon] = useState('/images/Kohaku/kohaku-normal.png');
  const [answerEffectType, setAnswerEffectType] = useState<'correct' | 'incorrect' | null>(null);

  // 問題の表示開始時刻を保存
  const startTimeRef = useRef<number>(Date.now());

  // ペット情報の取得ロジック
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

  useEffect(() => {
    refetchPetStatus();
    window.addEventListener('petStatusUpdated', refetchPetStatus);
    return () => {
      window.removeEventListener('petStatusUpdated', refetchPetStatus);
    };
  }, [refetchPetStatus]);

  useEffect(() => {
    // ページ遷移時に状態をリセット
    setProblem(formatProblem(initialProblem));
    setCredits(initialCredits);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setChatMessages([{ sender: 'kohaku', text: textResources.ja.problemStatement.hintInit }]);
    startTimeRef.current = Date.now();

    // ページ離脱時に学習時間を記録
    return () => {
      const endTime = Date.now();
      const timeSpentMs = endTime - startTimeRef.current;
      if (timeSpentMs > 3000) {
        recordStudyTimeAction(timeSpentMs).catch(e => console.error(e));
      }
    };
  }, [initialProblem, initialCredits]);

  const handleNextProblem = async () => {
    try {
      // 応用情報と同じようにAPIまたはActionから次のIDを取得する形に合わせる
      const res = await fetch(`/api/selects_problems/next/${problem.id}`);
      const data = await res.json();
      if (data.nextProblemId) {
        router.push(`/issue_list/selects_problems/${data.nextProblemId}`);
      } else {
        showNotification({ message: "これが最後の問題です！お疲れ様でした。", type: 'success' });
        router.push('/issue_list/selects_problems');
      }
    } catch (error) {
      console.error("次の問題の取得に失敗しました:", error);
    }
  };
  
  const t = textResources[language].problemStatement;
  const currentLang = language;

  const handleSelectAnswer = async (selectedValue: string) => {
    if (isAnswered) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);
    const correct = isCorrectAnswer(selectedValue, problem.correctAnswer);
    setAnswerEffectType(correct ? 'correct' : 'incorrect');

    // 2: 学習時間の記録 (正解・不正解にかかわらず記録)
    if (startTimeRef.current) {
        const endTime = Date.now();
        const durationMs = endTime - startTimeRef.current;
        // 3秒以上滞在していれば記録
        if (durationMs > 3000) {
            recordStudyTimeAction(durationMs).catch(e => console.error(e));
        }
        // 重複記録を防ぐため、記録後にnullにするか、ページ遷移時に再設定するロジックが必要ですが
        // ここでは「回答時点での時間」を記録し、ページ離脱時にも記録する設計の場合、
        // 二重計上になる可能性があるため注意が必要です。
        // 一般的には「回答時」か「離脱時」のどちらか一方で記録します。
        // 今回は「回答時」に記録し、startTimeRefを更新して、その後の滞在時間は別途（離脱時に）記録するようにします。
        startTimeRef.current = Date.now(); 
    }

    if (correct) {
      const numericId = parseInt(problem.id, 10);
      if (!isNaN(numericId)) {
        try {
          const result = await awardXpForCorrectAnswer(
            numericId, 
            undefined, 
            4, 
            startTimeRef.current || Date.now()
          );

          if (result.message === '経験値を獲得しました！') {
              window.dispatchEvent(new CustomEvent('petStatusUpdated'));
          }
          if (result.unlockedTitle) {
            showNotification({ message: `称号【${result.unlockedTitle.name}】を獲得しました！`, type: 'success' });
          }
        } catch (error) {
          console.error("XP award error:", error);
          showNotification({ message: '経験値の付与に失敗しました。', type: 'error' });
        }
      }
    }
    
    // 簡単なヒントを表示（APIコールせず即時フィードバック）
    const hint = correct ? t.hintCorrect : t.hintIncorrect(problem.correctAnswer);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
    
    if(correct) {
        window.dispatchEvent(new CustomEvent('petStatusUpdated'));
    }
  };

  const handleAnimationEnd = useCallback(() => {
    setAnswerEffectType(null);
  }, []);

  const handleUserMessage = async (message: string) => {
    if (credits <= 0) {
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: t.noCreditsMessage }]);
      return;
    }

    setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
    setIsAiLoading(true);

    try {
      // クレジット消費
      const res = await fetch('/api/User/decrement-credit', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'クレジットの更新に失敗しました。');
      setCredits(data.newCredits);

      // AIへ質問
      const context = {
        problemTitle: problem.title[currentLang],
        problemDescription: problem.description[currentLang],
        problemType: problem.logicType,
        userCode: '', // コードはないので空
        answerOptions: JSON.stringify(problem.answerOptions?.[currentLang]),
        explanation: problem.explanationText?.[currentLang],
      };

      const hint = await getHintFromAI(message, context);
      setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);

    } catch (error: any) {
      setChatMessages((prev) => [...prev, { sender: 'kohaku', text: `エラー: ${error.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10">
      {answerEffectType && (
        <AnswerEffect type={answerEffectType} onAnimationEnd={handleAnimationEnd} />
      )}
      
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* 左カラム：問題表示 */}
        <div className="flex-1 bg-white p-8 rounded-lg shadow-md min-h-[600px] flex flex-col lg:col-span-8 lg:col-start-3">
          <div className="text-center text-gray-500 mb-2 text-sm">
             {/* 出典情報があれば表示（SelectProblemにフィールドがあれば） */}
             {/* {initialProblem.sourceYear} {initialProblem.sourceNumber} */}
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            問{problem.id}: {problem.title[currentLang]}
          </h1>
          
          <ProblemStatement
            description={problem.imagePath ? "" : problem.description[currentLang]}
            imagePath={problem.imagePath} 
            programText=""
            answerOptions={problem.answerOptions?.[currentLang] || []}
            onSelectAnswer={handleSelectAnswer}
            selectedAnswer={selectedAnswer}
            correctAnswer={problem.correctAnswer}
            isAnswered={isAnswered}
            explanation={problem.explanationText?.[currentLang] || ''}
            language={language}
            textResources={{ ...t, title: t.title }}
          />
        </div>

        {/* 右カラム：コハクチャット & クレジット */}
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
            textResources={{...t, chatInputPlaceholder: credits > 0 ? t.chatInputPlaceholder : t.noCreditsPlaceholder}} 
            isLoading={isPending || isAiLoading} 
            isDisabled={credits <= 0 || isPending || isAiLoading}
            kohakuIcon={kohakuIcon} 
          />
        </div>
      </div>

      {/* 次へボタン */}
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

export default ProblemDetailClient;