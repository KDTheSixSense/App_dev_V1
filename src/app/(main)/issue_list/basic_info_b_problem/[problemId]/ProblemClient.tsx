'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- コンポーネントとロジック ---
import ProblemStatement from '../components/ProblemStatement';
import TraceScreen from '../components/TraceScreen';
import VariableTraceControl from '../components/VariableTraceControl';
import KohakuChat from '@/components/KohakuChat';
import { getHintFromAI } from '@/lib/actions/hintactions';
import { getNextProblemId, awardXpForCorrectAnswer } from '@/lib/actions';
import { useNotification } from '@/app/contexts/NotificationContext';
import { problemLogicsMap } from '../data/problem-logics';

// --- 型定義 ---
import type { SerializableProblem } from '@/lib/data';
import type { VariablesState } from '../data/problems';

// --- 多言語リソース ---
const textResources = {
  ja: {
    problemStatement: {
      title: "問題",
      programTitle: "（プログラム）",
      answerGroup: "解答群",
      explanationTitle: "解説",
      hintInit: "こんにちは！何かわからないことはありますか？",
      hintCorrect: "正解です！解説も読んで理解を深めましょう！",
      hintIncorrect: (correctValue: string) => `残念、正解は「${correctValue}」でした。解説を読んでみましょう。`,
      hintGenericQuestion: "ごめんなさい、その質問には詳しく答えられません。他の聞き方を試してもらえますか？",
      hintNoAnswer: "直接の答えはお教えできませんが、ヒントなら出せますよ。どこが一番難しいですか？",
      kohakuChatTitle: "コハクに質問",
      chatInputPlaceholder: "コハクに質問する...",
      sendButton: "送信",
      nextProblemButton: "次の問題へ",
      traceScreenTitle: "トレース画面",
      variableSectionTitle: "変数",
      resetTraceButton: "もう一度トレース",
      nextTraceButton: "次のトレース",
      traceCompletedButton: "トレース完了",
      noCreditsMessage: "アドバイス回数が残っていません。プロフィールページでXPと交換できます。",
      noCreditsPlaceholder: "アドバイス回数がありません",
    },
  },
  en: {
    problemStatement: {
      title: "Problem",
      programTitle: "(Program)",
      answerGroup: "Answer Choices",
      explanationTitle: "Explanation",
      hintInit: "Hello! Is there anything I can help you with?",
      hintCorrect: "That's correct! Let's read the explanation to deepen your understanding!",
      hintIncorrect: (correctValue: string) => `Unfortunately, the correct answer was "${correctValue}". Let's read the explanation.`,
      hintGenericQuestion: "I'm sorry, I can't answer that question in detail. Could you try asking another way?",
      hintNoAnswer: "I can't give you the direct answer, but I can give you hints. What are you most stuck on?",
      kohakuChatTitle: "Ask Kohaku",
      chatInputPlaceholder: "Ask Kohaku...",
      sendButton: "Send",
      nextProblemButton: "Next Problem",
      traceScreenTitle: "Trace Screen",
      variableSectionTitle: "Variables",
      resetTraceButton: "Trace Again",
      nextTraceButton: "Next Trace",
      traceCompletedButton: "Trace Complete",
      // ★★★ エラー修正箇所 ★★★
      // 日本語側と型を一致させるため、クレジット関連の英語テキストを追加します。
      noCreditsMessage: "No advice credits remaining. You can exchange XP for credits on your profile page.",
      noCreditsPlaceholder: "No credits remaining",
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

interface ProblemClientProps {
  initialProblem: SerializableProblem;
  initialCredits: number;
}

const ProblemClient: React.FC<ProblemClientProps> = ({ initialProblem, initialCredits }) => {
  const router = useRouter();
  const { showNotification } = useNotification();
  
  // --- 状態管理 ---
  const [problem, setProblem] = useState<SerializableProblem>(initialProblem);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentTraceLine, setCurrentTraceLine] = useState(0);
  const [variables, setVariables] = useState<VariablesState>(initialProblem.initialVariables);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const [isPresetSelected, setIsPresetSelected] = useState<boolean>(false);
  const [credits, setCredits] = useState(initialCredits);

  useEffect(() => {
    let problemData = initialProblem;

    // 問13のデータがサーバーから不完全に渡された場合に備え、クライアント側でデータを補う
    if (initialProblem.id.toString() === '13') {
        const initialVarsFor13 = {
            data: null, target: null, low: null, high: null, middle: null, result: null, initialized: false,
        };
        const presetsFor13 = [
            { label: 'ア: data:{10}, target:10', value: { data: [10], target: 10 } },
            { label: 'イ: data:{10,20}, target:10', value: { data: [10, 20], target: 10 } },
            { label: 'ウ: data:{10,20}, target:20', value: { data: [10, 20], target: 20 } },
            { label: 'エ: data:{10,20,30,40}, target:30', value: { data: [10, 20, 30, 40], target: 30 } }
        ];
        problemData = {
            ...initialProblem,
            initialVariables: { ...initialVarsFor13, ...initialProblem.initialVariables },
            traceOptions: {
                ...initialProblem.traceOptions,
                presets_array: initialProblem.traceOptions?.presets_array || presetsFor13,
            }
        };
    }

    // ✅【追加点】問11のデータ補完処理
    if (initialProblem.id.toString() === '11') {
        const initialVarsFor11 = {
            data: null, n: null, bins: null, i: null,
        };
        const presetsFor11 = [
            { label: 'ア: {2, 6, 3, 1, 4, 5}', value: { data: [2, 6, 3, 1, 4, 5] } },
            { label: 'イ: {3, 1, 4, 4, 5, 2}', value: { data: [3, 1, 4, 4, 5, 2] } },
            { label: 'ウ: {4, 2, 1, 5, 6, 2}', value: { data: [4, 2, 1, 5, 6, 2] } },
            { label: 'エ: {5, 3, 4, 3, 2, 6}', value: { data: [5, 3, 4, 3, 2, 6] } },
        ];
        problemData = {
            ...initialProblem,
            initialVariables: { ...initialVarsFor11, ...initialProblem.initialVariables },
            traceOptions: {
                ...initialProblem.traceOptions,
                presets_array: initialProblem.traceOptions?.presets_array || presetsFor11,
            }
        };
    }

    setProblem(problemData);
    setCurrentTraceLine(0);
    setVariables(problemData.initialVariables);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsPresetSelected(false);
    setChatMessages([
      { sender: 'kohaku', text: textResources[language].problemStatement.hintInit },
    ]);
    setCredits(initialCredits);
  }, [initialProblem, language, initialCredits]);

  const t = textResources[language].problemStatement;

  const handleSelectAnswer = async (selectedValue: string) => {
    if (isAnswered || !problem) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);
    const correct = isCorrectAnswer(selectedValue, problem.correctAnswer);

    if (correct) {
      try {
        const problemId = parseInt(problem.id, 10);
        const result = await awardXpForCorrectAnswer(problemId);
        // 処理が成功し、エラーでなければヘッダーのペットゲージを更新する
        if (result.message === '経験値を獲得しました！') {
            window.dispatchEvent(new CustomEvent('petStatusUpdated'));
        }        console.log(result.message); // "経験値を獲得しました！" or "既に正解済みです。"
        if (result.unlockedTitle) {
          showNotification({ message: `称号【${result.unlockedTitle.name}】を獲得しました！`, type: 'success' });
        }
      } catch (error) {
        showNotification({ message: '経験値の付与に失敗しました。', type: 'error' });
      }
    }
    const hint = correct ? t.hintCorrect : t.hintIncorrect(problem.correctAnswer);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
  };

  const handleNextTrace = () => {
    if (!problem || !problem.programLines) return;
    
    if (currentTraceLine < problem.programLines[language].length) {
      const logic = problemLogicsMap[problem.logicType as keyof typeof problemLogicsMap];
      if (!logic) return;

      const traceStepFunction = logic.traceLogic[currentTraceLine];
      const nextVariables = traceStepFunction ? traceStepFunction(variables) : { ...variables };

      let nextLine = currentTraceLine + 1;
      if ('calculateNextLine' in logic && logic.calculateNextLine) {
        nextLine = logic.calculateNextLine(currentTraceLine, nextVariables);
      }
      
      setVariables(nextVariables);
      setCurrentTraceLine(nextLine);
    }
  };

  const handleResetTrace = () => {
    setVariables(problem.initialVariables);
    setCurrentTraceLine(0);
    setIsPresetSelected(false);
    setChatMessages(prev => [...prev, { sender: 'kohaku', text: "トレースをリセットしました。" }]);
  };
  
  const handleSetData = (dataToSet: Record<string, any>) => {
    setVariables({ ...problem.initialVariables, ...dataToSet, initialized: false });
    setCurrentTraceLine(0);
    setIsPresetSelected(true);
  };
  
  const handleNextProblem = async () => {
    const nextId = await getNextProblemId(parseInt(problem.id, 10), 'basic_info_b_problem');
    if (nextId) {
      router.push(`/issue_list/basic_info_b_problem/${nextId}`);
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
        userCode: problem.programLines?.[currentLang]?.join('\n') || '' // プログラムを文字列として渡す
      };
      const hint = await getHintFromAI(message, context);
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: hint }]);
    } catch (error: any) {
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: error.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };
  
  const showTraceUI = problem.logicType !== 'STATIC_QA';
  const currentLang = language;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6 sm:py-10">
      <div className="container mx-auto px-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
          <div className={`bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 min-h-[calc(100vh-120px)] flex flex-col ${showTraceUI ? 'lg:col-span-7' : 'lg:col-span-8'}`}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
              問{problem.id}: {problem.title[currentLang]}
            </h1>
            <ProblemStatement 
              description={problem.description[currentLang]}
              programText={problem.programLines?.[currentLang]?.join('\n') || ''}
              answerOptions={problem.answerOptions[currentLang] || []}
              onSelectAnswer={handleSelectAnswer}
              selectedAnswer={selectedAnswer}
              correctAnswer={problem.correctAnswer}
              isAnswered={isAnswered}
              explanation={problem.explanationText[currentLang] || ''}
              language={language}
              textResources={{...t, title: problem.title[currentLang]}}
            />
          </div>
          
          {showTraceUI && (
            <div className="lg:col-span-5 flex flex-col gap-8 sticky top-10">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <TraceScreen programLines={problem.programLines?.[currentLang] || []} currentLine={currentTraceLine} language={language} textResources={t} />
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <VariableTraceControl problem={problem} variables={variables} onNextTrace={handleNextTrace} isTraceFinished={problem.programLines ? currentTraceLine >= problem.programLines[currentLang].length : true} onResetTrace={handleResetTrace} currentTraceLine={currentTraceLine} language={language} textResources={t} onSetData={handleSetData} isPresetSelected={isPresetSelected} onSetNum={() => {}} />
              </div>
            </div>
          )}

          <div className="fixed bottom-4 right-4 lg:relative lg:bottom-auto lg:right-auto lg:col-span-12 w-full max-w-md lg:max-w-none mx-auto lg:w-full lg:col-start-9 lg:col-end-13 lg:sticky lg:top-10">
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
              isLoading={isAiLoading}
              isDisabled={credits <= 0}
            />
          </div>
        </div>

        {isAnswered && (
          <div className="w-full max-w-2xl mx-auto mt-8 flex justify-center">
            <button onClick={handleNextProblem} className="w-full py-4 px-8 text-lg font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105">
              {t.nextProblemButton}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemClient;

