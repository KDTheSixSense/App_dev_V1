'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SelectProblem } from '@prisma/client';
import type { Problem as SerializableProblem } from '@/lib/types';
import ProblemStatement from '../components/ProblemStatement';
import KohakuChat from '@/components/KohakuChat';
import { recordStudyTimeAction } from '@/lib/actions';

// サーバーから渡されるデータの型
interface ProblemDetailClientProps {
  problem: SelectProblem;
}

// カスタムアラートモーダル
const CustomAlertModal: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
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

// 多言語リソース
const textResources = {
  ja: {
    problemStatement: {
      title: "問題", programTitle: "（プログラム）", answerGroup: "解答群", explanationTitle: "解説",
      hintInit: "こんにちは！何かわからないことはありますか？",
      hintCorrect: "正解です！解説も読んで理解を深めましょう！",
      hintIncorrect: (correctValue: string) => `残念、正解は「${correctValue}」でした。もう一度問題を見直したり、解説を読んでみましょう。`,
      hintGenericQuestion: "はい、何か質問でしょうか？ 具体的に何を知りたいですか？",
      hintNoAnswer: "残念ながら、直接答えをお伝えすることはできません。ヒントを出すことはできますよ。どこがわからないですか？",
      kohakuChatTitle: "コハクに質問", chatInputPlaceholder: "コハクに質問...", sendButton: "質問", nextProblemButton: "次の問題へ",
    },
  },
  en: {
    problemStatement: {
      title: "Problem", programTitle: "(Program)", answerGroup: "Answer Choices", explanationTitle: "Explanation",
      hintInit: "Hello! Is there anything I can help you with?",
      hintCorrect: "That's correct! Let's deepen your understanding by reading the explanation!",
      hintIncorrect: (correctValue: string) => `Unfortunately, the correct answer was "${correctValue}". Let's review the problem or read the explanation.`,
      hintGenericQuestion: "Yes, do you have a question? What specifically would you like to know?",
      hintNoAnswer: "Unfortunately, I cannot give you the direct answer. But I can give you hints. What are you stuck on?",
      kohakuChatTitle: "Ask Kohaku", chatInputPlaceholder: "Ask Kohaku...", sendButton: "Ask", nextProblemButton: "Next Problem",
    },
  },
} as const;

type Language = 'ja' | 'en';
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };

const isCorrectAnswer = (selected: string | null, correct: string): boolean => {
  if (selected === null) return false;
  return selected.trim() === correct.trim();
};

const ProblemDetailClient: React.FC<ProblemDetailClientProps> = ({ problem: initialProblem }) => {
  const router = useRouter();

  const formatProblem = (p: SelectProblem): SerializableProblem => {
    const answerOptionsArray = Array.isArray(p.answerOptions) ? p.answerOptions.map(String) : [];
    return {
      id: String(p.id),
      logicType: 'TYPE_A',
      title: { ja: p.title, en: p.title },
      description: { ja: p.description, en: p.description },
      programLines: { ja: [], en: [] },
      answerOptions: {
        ja: answerOptionsArray.map((opt, i) => ({ label: ['ア','イ','ウ','エ'][i] || '', value: opt })),
        en: answerOptionsArray.map((opt, i) => ({ label: ['A','B','C','D'][i] || '', value: opt })),
      },
      correctAnswer: p.correctAnswer,
      explanationText: { ja: p.explanation || '', en: p.explanation || '' },
      initialVariables: {},
      traceLogic: [],
    };
  };

  const [problem, setProblem] = useState<SerializableProblem>(() => formatProblem(initialProblem));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // AIチャットのローディング状態

  // 問題の表示開始時刻を保存
  const [problemStartedAt, setProblemStartedAt] = useState<number>(Date.now());
  // この問題の時間をすでに記録したかを管理
  const hasRecordedTime = useRef(false);

  useEffect(() => {
    // ページ遷移（次の問題）が発生したときに状態をリセットする
    setProblem(formatProblem(initialProblem));
    setSelectedAnswer(null);
    setIsAnswered(false);
    setChatMessages([{ sender: 'kohaku', text: textResources.ja.problemStatement.hintInit }]);
    setProblemStartedAt(Date.now()); // 開始時刻をリセット
    hasRecordedTime.current = false;   // 記録フラグをリセット
  }, [initialProblem.id]);

  /**
   * 学習時間を計算し、サーバーに送信する
   */
  const recordStudyTime = () => {
    // まだこの問題の時間を記録していない場合のみ実行
    if (!hasRecordedTime.current) {
      const endTime = Date.now();
      const timeSpentMs = endTime - problemStartedAt;

      // 3秒以上の滞在のみを記録 (ページ移動のノイズを除外)
      if (timeSpentMs > 3000) {
        console.log(`Recording ${timeSpentMs}ms for problem ${problem.id}`);
        recordStudyTimeAction(timeSpentMs); // サーバーアクションを呼び出し
        hasRecordedTime.current = true; // 記録済みフラグを立てる
      }
    }
  };

  // --- 6. ページを離れる時に時間を記録する Effect を追加 ---
  useEffect(() => {
    // このEffectは、problemStartedAt（＝新しい問題）が変わるたびに再登録される
    return () => {
      // クリーンアップ関数（ページ離脱時）に時間を記録
      recordStudyTime();
    };
  }, [problemStartedAt]); // problemStartedAt が変わるたびにクリーンアップを再設定

  const handleNextProblem = async () => {
    recordStudyTime(); // 次の問題に行く前に時間を記録
    try {
      const res = await fetch(`/api/selects_problems/next/${problem.id}`);
      const data = await res.json();
      if (data.nextProblemId) {
        router.push(`/issue_list/selects_problems/${data.nextProblemId}`);
      } else {
        setAlertMessage("最後の問題です！お疲れ様でした。");
        setShowAlert(true);
      }
    } catch (error) {
      console.error("次の問題の取得に失敗しました:", error);
      alert("次の問題の取得に失敗しました。");
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    if (alertMessage.includes("最後の問題です")) {
      router.push('/issue_list/selects_problems');
    }
  };
  
  const t = textResources[language].problemStatement;

  const generateKohakuResponse = ( isAnsweredStatus: boolean = false, answerToCheckValue?: string | null, userQuestion?: string ): string => {
    if (isAnsweredStatus) {
      return isCorrectAnswer(answerToCheckValue || selectedAnswer, problem.correctAnswer)
        ? t.hintCorrect
        : t.hintIncorrect(problem.correctAnswer);
    }
    if (userQuestion) {
      if (userQuestion.toLowerCase().includes("答え")) return t.hintNoAnswer;
    }
    return t.hintGenericQuestion;
  };

  const handleSelectAnswer = (selectedValue: string) => {
    if (isAnswered) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);
    const hint = generateKohakuResponse(true, selectedValue);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
    recordStudyTime();
  };

  const handleUserMessage = async (message: string) => {
    setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
    setIsLoading(true);

    try {
      // AIに渡すコンテキストを作成
      const context = {
        problemTitle: problem.title.ja,
        problemDescription: problem.description.ja,
        // この問題タイプにはユーザーコードがないため、問題文を代わりに使用
        userCode: problem.description.ja, 
      };

      const response = await fetch('/api/generate-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message, context }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'APIからの応答エラー');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setChatMessages((prev) => [...prev, { sender: 'kohaku', text: data.hint }]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました。";
      setChatMessages((prev) => [...prev, { sender: 'kohaku', text: `エラー: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {showAlert && <CustomAlertModal message={alertMessage} onClose={handleCloseAlert} />}
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 bg-white p-8 rounded-lg shadow-md min-h-[800px] flex flex-col">
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              問{problem.id}: {problem.title[language]}
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
              textResources={{ ...t, title: problem.title[language] }}
            />
          </>
        </div>
        <div className="w-full lg:w-96 flex flex-col">
          <KohakuChat messages={chatMessages} onSendMessage={handleUserMessage} language={language} textResources={t} isLoading={isLoading} />
        </div>
      </div>
      {isAnswered && (
        <div className="w-full max-w-lg mt-8 flex justify-center">
          <button onClick={handleNextProblem} className="w-full py-4 px-8 text-xl font-semibold text-white bg-green-500 rounded-lg shadow-lg hover:bg-green-600">
            {t.nextProblemButton}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProblemDetailClient;