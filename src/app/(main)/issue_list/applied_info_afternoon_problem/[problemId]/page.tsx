// src/app/(main)/issue_list/basic_info_b_problem/[problemId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// --- コンポーネントのインポート ---
import ProblemStatement from '../components/ProblemStatement';
import KohakuChat from '../components/KohakuChat';

// --- データと型のインポート ---
import type { Problem as SerializableProblem } from '@/lib/types/index';
// 基本情報 科目B の問題データを取得する関数をインポート
import { getBasicInfoBProblemsById } from '@/lib/issue_list/basic_info_b_problem/problem';
import { getNextProblemId, awardXpForCorrectAnswer } from '@/lib/actions'; // サーバーアクション
import toast from 'react-hot-toast';

// --- カスタムアラートモーダルコンポーネント ---
const CustomAlertModal: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <p className="text-lg text-gray-800 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
};

// --- 多言語対応テキストリソース ---
const textResources = {
  ja: {
    problemStatement: {
      title: "問題", // 動的に問題のタイトルで上書きされます
      programTitle: "（プログラム）",
      answerGroup: "解答群",
      explanationTitle: "解説",
      hintInit: "こんにちは！何かわからないことはありますか？",
      hintCorrect: "正解です！解説も読んで理解を深めましょう！",
      hintIncorrect: (correctValue: string) => `残念、正解は「${correctValue}」でした。もう一度問題を見直したり、解説を読んでみましょう。`,
      hintGenericQuestion: "はい、何か質問でしょうか？ 具体的に何を知りたいですか？",
      hintNoAnswer: "残念ながら、直接答えをお伝えすることはできません。ヒントを出すことはできますよ。どこがわからないですか？",
      kohakuChatTitle: "コハクに質問",
      chatInputPlaceholder: "コハクに質問...",
      sendButton: "質問",
      nextProblemButton: "次の問題へ",
    },
  },
  en: {
    problemStatement: {
      title: "Problem",
      programTitle: "(Program)",
      answerGroup: "Answer Choices",
      explanationTitle: "Explanation",
      hintInit: "Hello! Is there anything I can help you with?",
      hintCorrect: "That's correct! Let's deepen your understanding by reading the explanation!",
      hintIncorrect: (correctValue: string) => `Unfortunately, the correct answer was "${correctValue}". Let's review the problem or read the explanation.`,
      hintGenericQuestion: "Yes, do you have a question? What specifically would you like to know?",
      hintNoAnswer: "Unfortunately, I cannot give you the direct answer. But I can give you hints. What are you stuck on?",
      kohakuChatTitle: "Ask Kohaku",
      chatInputPlaceholder: "Ask Kohaku...",
      sendButton: "Ask",
      nextProblemButton: "Next Problem",
    },
  },
} as const;

const isCorrectAnswer = (selected: string | null, correct: string): boolean => {
  if (selected === null) {
    return false;
  }
  return selected.trim() === correct.trim();
};

type Language = 'ja' | 'en';
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };

const ProblemDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const problemId = params.problemId as string;

  // 基本情報 科目B の問題データを取得する
  const initialProblemData = getBasicInfoBProblemsById(problemId);

  const [problem, setProblem] = useState<SerializableProblem | undefined>(initialProblemData);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // problemId または language が変更されたときに状態をリセットするエフェクト
  useEffect(() => {
    const currentProblem = getBasicInfoBProblemsById(problemId);
    setProblem(currentProblem);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setChatMessages([
      { sender: 'kohaku', text: textResources[language].problemStatement.hintInit },
    ]);
  }, [problemId, language]);

  // 問題データが利用できない場合のローディング/見つからないメッセージを表示
  if (!problem) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-xl text-gray-700">問題が見つかりません。</p>
      </div>
    );
  }

  const t = textResources[language].problemStatement;

  const generateKohakuResponse = (
    isAnsweredStatus: boolean = false,
    answerToCheckValue?: string | null,
    userQuestion?: string
  ): string => {
    if (!problem) return "問題の読み込み中です...";
    if (isAnsweredStatus) {
      if (isCorrectAnswer(answerToCheckValue || selectedAnswer, problem.correctAnswer)) {
        return t.hintCorrect;
      } else {
        return t.hintIncorrect(problem.correctAnswer);
      }
    }
    if (userQuestion) {
      const lowerCaseQuestion = userQuestion.toLowerCase();
      if (lowerCaseQuestion.includes("答え") || lowerCaseQuestion.includes("answer")) {
        return t.hintNoAnswer;
      }
      return t.hintGenericQuestion;
    }
    return t.hintGenericQuestion;
  };

  const handleSelectAnswer = async (selectedValue: string) => {
    if (isAnswered || !problem) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);

    const correct = isCorrectAnswer(selectedValue, problem.correctAnswer);

    if (correct) {
      const numericId = parseInt(problem.id, 10);
      if (!isNaN(numericId)) {
        try {
          const result = await awardXpForCorrectAnswer(numericId, undefined, 2);
          if (result.message === '経験値を獲得しました！') {
            window.dispatchEvent(new CustomEvent('petStatusUpdated'));

            // レベルアップチェック (30の倍数)
            const res = await fetch('/api/pet/status');
            if (res.ok) {
              const { data } = await res.json();
              if (data?.level && data.level > 0 && data.level % 30 === 0) {
                // 30の倍数に到達した場合、ホーム画面へ強制遷移
                setTimeout(() => {
                  router.push('/home?evolution=true');
                }, 1500);
              }
            }
          }
          if (result.unlockedTitle) {
            toast.success(`称号【${result.unlockedTitle.name}】を獲得しました！`);
          }
        } catch (error) {
          console.error('XP award error:', error);
          toast.error('経験値の付与に失敗しました。');
        }
      }
    }

    const hint = generateKohakuResponse(true, selectedValue);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
  };

  const handleUserMessage = (message: string) => {
    setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
    setTimeout(() => {
      const kohakuResponse = generateKohakuResponse(false, null, message);
      setChatMessages((prev) => [...prev, { sender: 'kohaku', text: kohakuResponse }]);
    }, 1000);
  };

  const handleNextProblem = async () => {
    const currentProblemId = problem.id;

    if (!currentProblemId) {
      setAlertMessage("現在の問題IDが無効です。");
      setShowAlert(true);
      return;
    }

    // 次の問題を取得するために 'basic_info_b_problem' カテゴリを指定
    const nextProblemId = await getNextProblemId(parseInt(currentProblemId), 'applied_info_afternoon_problem'); 

    if (nextProblemId) {
      router.push(`/issue_list/basic_info_b_problem/${nextProblemId}`);
    } else {
      setAlertMessage("最後の問題です！"); // カスタムアラートを使用
      setShowAlert(true);
      router.push('/issue_list'); // 次の問題がない場合は、問題リストの概要ページへ
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {showAlert && <CustomAlertModal message={alertMessage} onClose={() => setShowAlert(false)} />}

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 bg-white p-8 rounded-lg shadow-md min-h-[800px] flex flex-col">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            問{problem.id}: {problem.title[language] || t.title}
          </h1>
          <ProblemStatement
            description={problem.description[language]}
            programText={problem.programLines?.[language]?.join('\n') || ''}
            answerOptions={problem.answerOptions?.[language] || []}
            onSelectAnswer={handleSelectAnswer}
            selectedAnswer={selectedAnswer}
            correctAnswer={problem.correctAnswer}
            isAnswered={isAnswered}
            explanation={problem.explanationText?.[language] || ''}
            language={language}
            textResources={{ ...t, title: problem.title[language] || t.title }}
          />
        </div>

        {/* 基本情報 科目B ではトレース関連のUIを完全に削除するため、このセクションは不要 */}
        {/*
        <div className="flex-1 flex flex-col gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md flex-grow overflow-hidden">
            <div className="h-full flex flex-col">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">プログラム</h2>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 flex-grow overflow-auto text-sm font-mono whitespace-pre-wrap">
                {problem.programLines?.[language]?.map((line, index) => (
                  <div
                    key={index}
                    className={`py-1 px-2 rounded-sm bg-transparent`}
                  >
                    <span className="text-gray-500 mr-2">{index + 1}:</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        */}

        <div className="w-full lg:w-96 flex flex-col">
          <KohakuChat
            messages={chatMessages}
            onSendMessage={handleUserMessage}
            language={language}
            textResources={t}
          />
        </div>
      </div>

      {isAnswered && (
        <div className="w-full max-w-lg mt-8 flex justify-center">
          <button
            onClick={handleNextProblem}
            className="w-full py-4 px-8 text-xl font-semibold text-white bg-green-500 rounded-lg shadow-lg hover:bg-green-600"
          >
            {t.nextProblemButton}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProblemDetailPage;
