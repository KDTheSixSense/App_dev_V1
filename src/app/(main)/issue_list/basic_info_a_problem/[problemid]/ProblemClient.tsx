'use client';

import React, { useState, useEffect } from 'react'; // useTransition removed if not used
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProblemStatement from '../components/ProblemStatement';
import { getNextProblemId, awardXpForCorrectAnswer } from '@/lib/actions';
// import { getHintFromAI } from '@/lib/actions/hintactions'; // Commented out if not used yet
import { useNotification } from '@/app/contexts/NotificationContext';
import type { SerializableProblem } from '@/lib/data';

// --- 多言語対応テキストリソース ---
const textResources: Record<'ja' | 'en', {
  problemStatement: {
    title: string;
    programTitle: string;
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
      sendButton: "質問",
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
      hintCorrect: "Correct! Read the explanation to deepen your understanding.",
      hintIncorrect: (correctValue: string) => `Too bad — the correct answer was "${correctValue}". Try reading the explanation.`,
      kohakuChatTitle: "Ask Kohaku",
      chatInputPlaceholder: "Ask Kohaku...",
      sendButton: "Ask",
      nextProblemButton: "Next problem",
      noCreditsMessage: "You have no advice credits left; exchange XP on your profile page.",
      noCreditsPlaceholder: "No advice credits",
    },
  },
};

const isCorrectAnswer = (selected: string | null, correct: string): boolean => {
  if (selected === null) return false;
  // Ensure comparison happens only if correctAnswer is defined
  return correct ? selected.trim() === correct.trim() : false;
};

type Language = 'ja' | 'en';
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };

interface ProblemClientProps {
  initialProblem: SerializableProblem; // Keep receiving initialProblem
  initialCredits: number;
}

const ProblemClient: React.FC<ProblemClientProps> = ({ initialProblem, initialCredits }) => {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [isAiLoading, setIsAiLoading] = useState(false); // Commented out if chat not used

  // ★★★ 修正 1: useStateの初期値として initialProblem を設定 ★★★
  const [problem, setProblem] = useState<SerializableProblem | null>(initialProblem);
  const [credits, setCredits] = useState(initialCredits);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const [showAlert, setShowAlert] = useState(false); // Commented out if not used
  const [alertMessage, setAlertMessage] = useState(''); // Commented out if not used

  // ★★★ 修正 2: useEffect を簡略化、問題が変わった時のリセット処理に集中 ★★★
  useEffect(() => {
    // initialProblem が変更された場合（別の問題ページに遷移した場合）にステートをリセット
    setProblem(initialProblem);
    setCredits(initialCredits);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setChatMessages([{ sender: 'kohaku', text: textResources[language].problemStatement.hintInit }]); // Reset chat if needed
    console.log('[ProblemClient useEffect] Resetting state with new initialProblem:', initialProblem);
    console.log('[ProblemClient useEffect] Image path in new initialProblem:', initialProblem?.imagePath);
  }, [initialProblem]); // 依存配列を initialProblem のみにする

  const t = textResources[language].problemStatement;
  const currentLang = language;

  const handleSelectAnswer = async (selectedValue: string) => {
    if (isAnswered || !problem) return; // problem が null でないことも確認
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);
    // ★ 正解チェックを安全に行う
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
    // Handle chat message update if needed
    const hint = correct ? t.hintCorrect : t.hintIncorrect(problem.correctAnswer);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
  };

  const handleNextProblem = async () => {
    if (!problem) return; // problem が null でないことを確認
    const nextProblemId = await getNextProblemId(parseInt(problem.id), 'basic_info_a_problem');
    if (nextProblemId) {
      router.push(`/issue_list/basic_info_a_problem/${nextProblemId}`);
    } else {
      showNotification({ message: "これが最後の問題です！", type: 'success' });
      router.push('/issue_list');
    }
  };

  const handleUserMessage = async (message: string) => { /* ... Chat handler ... */ };

  // ★★★ 修正 3: レンダリング前のチェックとログ ★★★
  if (!problem) {
    console.log("[ProblemClient] problem state is null, rendering loading...");
    return <div>問題を読み込み中...</div>;
  }
  // この時点での problem.imagePath をログに出力
  console.log(`[ProblemClient] Rendering ProblemStatement. Current problem state imagePath: "${problem.imagePath}"`);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 bg-white p-8 rounded-lg shadow-md min-h-[800px] flex flex-col">
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
            imagePath={problem.imagePath} // ここで渡す値を確認
            language={language}
            textResources={t}
          />
        </div>
        {/* Chat Component */}
      </div>
      {/* Next Problem Button */}
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