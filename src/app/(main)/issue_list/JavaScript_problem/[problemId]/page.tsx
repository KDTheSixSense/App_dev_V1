// src/app/(main)/issue_list/JavaScript_problem/[problemId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// --- コンポーネントのインポート ---
import ProblemStatement from '../components/ProblemStatement';
import KohakuChat from '../components/KohakuChat';

// --- データと型のインポート ---
import type { Problem as SerializableProblem } from '@/lib/types';
import { getJavaScriptProblemsById } from '@/lib/issue_list/JavaScript_problem/problem'; // JavaScript問題用のデータソースをインポート
import { getNextProblemId } from '@/lib/actions'; // サーバーアクション

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

  // 問題データ取得関数を正しく呼び出し
  const initialProblemData = getJavaScriptProblemsById(problemId);

  const [problem, setProblem] = useState<SerializableProblem | undefined>(initialProblemData);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // problemId または language が変更されたときに状態をリセットするエフェクト
  useEffect(() => {
    // 問題データ取得関数を正しく呼び出し
    const currentProblem = getJavaScriptProblemsById(problemId);
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

  const handleSelectAnswer = (selectedValue: string) => {
    if (isAnswered || !problem) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);
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

    // JavaScript問題用のカテゴリを渡すように修正
    const nextProblemId = await getNextProblemId(parseInt(currentProblemId), 'JavaScript_problem'); 

    if (nextProblemId) {
      router.push(`/issue_list/JavaScript_problem/${nextProblemId}`);
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
}; // この閉じ括弧が余分だった可能性もあります。

export default ProblemDetailPage;
