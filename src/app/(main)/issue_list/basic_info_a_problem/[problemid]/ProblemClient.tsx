// src/app/(main)/issue_list/basic_info_a_problem/[problemId]/ProblemClient.tsx
'use client';

import React, { useState, useEffect, useTransition} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- コンポーネントのインポート ---
import ProblemStatement from '../components/ProblemStatement';
// 
// --- データと型、アクションのインポート ---
import { getNextProblemId, awardXpForCorrectAnswer } from '@/lib/actions';
import { getHintFromAI } from '@/lib/actions/hintactions';
import { useNotification } from '@/app/contexts/NotificationContext';

import type { SerializableProblem } from '@/lib/data';


// --- 多言語対応テキストリソース ---
const textResources = {
  ja: {
    problemStatement: {
      title: "問題",
      programTitle: "（プログラム）",
      answerGroup: "解答群",
      explanationTitle: "解説",
      // hintInit: "こんにちは！何かわからないことはありますか？",
      // hintCorrect: "正解です！解説も読んで理解を深めましょう！",
      // hintIncorrect: (correctValue: string) => `残念、正解は「${correctValue}」でした。解説を読んでみましょう。`,
      // kohakuChatTitle: "コハクに質問",
      // chatInputPlaceholder: "コハクに質問する...",
      // sendButton: "質問",
      nextProblemButton: "次の問題へ",
      // noCreditsMessage: "アドバイス回数が残っていません。プロフィールページでXPと交換できます。",
      // noCreditsPlaceholder: "アドバイス回数がありません",
    },
  },
  en: {
    problemStatement: {
      title: "Problem",
      programTitle: "(Program)",
      answerGroup: "Answer Choices",
      explanationTitle: "Explanation",
      // hintInit: "Hello! Is there anything I can help you with?",
      // hintCorrect: "That's correct! Let's read the explanation to deepen your understanding!",
      // hintIncorrect: (correctValue: string) => `Unfortunately, the correct answer was "${correctValue}". Let's read the explanation.`,
      // kohakuChatTitle: "Ask Kohaku",
      // chatInputPlaceholder: "Ask Kohaku...",
      // sendButton: "Ask",
      nextProblemButton: "Next Problem",
      // noCreditsMessage: "No advice credits remaining. You can exchange XP for credits on your profile page.",
      // noCreditsPlaceholder: "No credits remaining",
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
  const { showNotification } = useNotification();
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [problem, setProblem] = useState<SerializableProblem>(initialProblem);
  const [credits, setCredits] = useState(initialCredits);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    setProblem(initialProblem);
    setCredits(initialCredits);
    setSelectedAnswer(null);
    setIsAnswered(false);
    // setChatMessages([
    //   { sender: 'kohaku', text: textResources[language].problemStatement.hintInit },
    // ]);
  }, [initialProblem, initialCredits, language]);

  const t = textResources[language].problemStatement;

  const handleSelectAnswer = async (selectedValue: string) => {
    if (isAnswered) return;
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

  //   const hint = correct ? t.hintCorrect : t.hintIncorrect(problem.correctAnswer);
  //   setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
  };

  const handleNextProblem = async () => {
    const nextProblemId = await getNextProblemId(parseInt(problem.id), 'basic_info_a_problem');
    if (nextProblemId) {
      router.push(`/issue_list/basic_info_a_problem/${nextProblemId}`);
    } else {
      showNotification({ message: "これが最後の問題です！", type: 'success' });
      router.push('/issue_list');
    }
  };

  // const handleUserMessage = async (message: string) => {
  //     if (credits <= 0) {
  //       setChatMessages(prev => [...prev, { sender: 'kohaku', text: t.noCreditsMessage }]);
  //       return;
  //     }
  
  //     setChatMessages(prev => [...prev, { sender: 'user', text: message }]);
  //     setIsAiLoading(true);
  
  //     try {
  //       const res = await fetch('/api/User/decrement-credit', { method: 'POST' });
  //       const data = await res.json();
  //       if (!res.ok) throw new Error(data.error || 'クレジットの更新に失敗しました。');
  //       setCredits(data.newCredits);
  
  //       const context = { 
  //         problemTitle: problem.title[currentLang], 
  //         problemDescription: problem.description[currentLang],
  //         userCode: problem.programLines?.[currentLang]?.join('\n') || '' // プログラムを文字列として渡す
  //       };
  //       const hint = await getHintFromAI(message, context);
  //       setChatMessages(prev => [...prev, { sender: 'kohaku', text: hint }]);
  //     } catch (error: any) {
  //       setChatMessages(prev => [...prev, { sender: 'kohaku', text: error.message }]);
  //     } finally {
  //       setIsAiLoading(false);
  //     }
  //   };

  const currentLang = language;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 bg-white p-8 rounded-lg shadow-md min-h-[800px] flex flex-col lg:col-span-8 lg:col-start-3">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            問{problem.id}: {problem.title[currentLang] || t.title}
          </h1>
          <ProblemStatement
            description={problem.description[currentLang]}
            programText={problem.programLines?.[currentLang]?.join('\n') || ''}
            answerOptions={problem.answerOptions?.[currentLang] || []}
            onSelectAnswer={handleSelectAnswer}
            selectedAnswer={selectedAnswer}
            correctAnswer={problem.correctAnswer}
            isAnswered={isAnswered}
            explanation={problem.explanationText?.[currentLang] || ''}
            language={language}
            textResources={{ ...t, title: problem.title[currentLang] || t.title }}
          />
        </div>

        {/* <div className="fixed bottom-4 right-4 lg:col-span-8 lg:col-start-3 w-full max-w-md lg:max-w-none mx-auto lg:w-full mt-8">
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
            isLoading={isPending}
            isDisabled={credits <= 0}
          />
        </div> */}
      </div>

      {isAnswered && (
        <div className="w-full max-w-lg mt-8 flex justify-center">
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
