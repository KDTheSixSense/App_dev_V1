// /workspaces/my-next-app/src/app/(main)/issue_list/applied_info_afternoon_problem/[problemId]/ProblemClient.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import ProblemStatement from '../components/ProblemStatement';
import TraceScreen from '../components/TraceScreen';
import VariableTraceControl from '@/components/common/VariableTraceControl';
import KohakuChat from '@/components/KohakuChat';
import AnswerEffect from '@/components/AnswerEffect';

import { getNextProblemId, awardXpForCorrectAnswer, recordStudyTimeAction, recordAnswerAction } from '@/lib/actions';
import { getHintFromAI } from '@/lib/actions/hintactions';
import type { SerializableProblem } from '@/lib/data';
import { useTraceProblem } from '@/hooks/useTraceProblem';
import toast from 'react-hot-toast';

// --- Helper Functions and Constants ---

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
      hintTraceInit: "まずはプログラムの初期化部分を確認しましょう。",
      hintTraceLine1: "1行目の処理を確認しましょう。",
      hintTraceLine4: "4行目に注目してください。",
      hintTraceLine5: "5行目での変数の変化を追ってみましょう。",
      hintTraceLine6: "6行目です。値の更新を確認してください。",
      hintTraceCompleted: (y: number | null, z: number | null) => `トレースは完了しています。`,
      hintContinueTrace: "続けてトレースを進めてみましょう。",
      hintGenericQuestion: "はい、何か質問でしょうか？",
      hintVariableQuestion: (vars: any) => `現在の変数の状態ですね。`,
      hintTraceProgress: (line: number) => `現在、${line}行目のトレースを行っています。`,
      hintNoAnswer: "直接の答えはお教えできませんが、ヒントなら出せますよ。",
      resetTraceKohaku1: "トレースを最初からやり直しますね！",
      resetTraceKohaku2: "もう一度、プログラムの動きを追っていきましょう。",
      traceScreenTitle: "トレース画面",
      variableSectionTitle: "変数",
      varX: "整数型 x",
      varY: "整数型 y",
      varZ: "整数型 z",
      nextTraceButton: "次のトレース",
      prevTraceButton: "前のトレース", // Added
      traceCompletedButton: "トレース完了",
      resetTraceButton: "もう一度トレース",
      kohakuChatTitle: "コハクに質問",
      chatInputPlaceholder: "コハクに質問...",
      sendButton: "質問",
      nextProblemButton: "次の問題へ",
      toggleTraceButton: "トレース表示",
      toggleKohakuButton: "コハクチャット表示",
      noCreditsMessage: "アドバイス回数が残っていません。プロフィールページでXPと交換できます。",
      noCreditsPlaceholder: "アドバイス回数がありません",
      creditsLabel: "AIアドバイス残り:",
      creditsUnit: "回",
      increaseCreditsLink: "(XPで増やす)",
    },
  },
  en: {
    problemStatement: {
      title: "Problem",
      programTitle: "(Program)",
      answerGroup: "Answer Choices",
      explanationTitle: "Explanation",
      hintInit: "Hello! Is there anything I can help you with?",
      hintCorrect: "That's correct! Let's read the explanation!",
      hintIncorrect: (correctValue: string) => `Unfortunately, the correct answer was "${correctValue}".`,
      hintTraceInit: "Let's check the initialization.",
      hintTraceLine1: "Check line 1.",
      hintTraceLine4: "Look at line 4.",
      hintTraceLine5: "Follow the variable change at line 5.",
      hintTraceLine6: "Line 6. Check the value update.",
      hintTraceCompleted: (y: number | null, z: number | null) => `Trace completed.`,
      hintContinueTrace: "Let's continue tracing.",
      hintGenericQuestion: "Yes, do you have a question?",
      hintVariableQuestion: (vars: any) => `Current variable state.`,
      hintTraceProgress: (line: number) => `Currently at line ${line}.`,
      hintNoAnswer: "I can't give the direct answer, but I can give hints.",
      resetTraceKohaku1: "I'll reset the trace!",
      resetTraceKohaku2: "Let's trace again.",
      traceScreenTitle: "Trace Screen",
      variableSectionTitle: "Variables",
      varX: "Integer x",
      varY: "Integer y",
      varZ: "Integer z",
      nextTraceButton: "Next Trace",
      prevTraceButton: "Prev Trace", // Added
      traceCompletedButton: "Trace Completed",
      resetTraceButton: "Trace Again",
      kohakuChatTitle: "Ask Kohaku",
      chatInputPlaceholder: "Ask Kohaku...",
      sendButton: "Ask",
      nextProblemButton: "Next Problem",
      toggleTraceButton: "Show Trace",
      toggleKohakuButton: "Show Chat",
      noCreditsMessage: "No advice credits remaining. You can exchange XP for credits on your profile page.",
      noCreditsPlaceholder: "No credits remaining",
      creditsLabel: "AI Advice Credits:",
      creditsUnit: "left",
      increaseCreditsLink: "(Increase with XP)",
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
  initialCredits: number; // Added
}

const ProblemClient: React.FC<ProblemClientProps> = ({ initialProblem, initialCredits }) => {
  const router = useRouter();

  // --- State Management ---
  const [problem, setProblem] = useState<SerializableProblem>(initialProblem);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const [credits, setCredits] = useState(initialCredits);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [answerEffectType, setAnswerEffectType] = useState<'correct' | 'incorrect' | null>(null);
  const [kohakuIcon, setKohakuIcon] = useState('/images/Kohaku/kohaku-normal.png');
  const currentLang = language;

  const startTimeRef = useRef<number | null>(null);

  // Use the custom trace hook
  const {
    currentTraceLine,
    variables,
    traceHistory,
    selectedLogicVariant,
    isPresetSelected,
    selectedPresetLabel,
    handleNextTrace,
    handlePrevTrace,
    handleResetTrace: hookResetTrace, // renamed to wrap with local logic
    handleSetLogicVariant,
    handleSetData,
    handleSetNum,
    setVariables,
    setCurrentTraceLine,
    setTraceHistory,
    setIsPresetSelected
  } = useTraceProblem({ problem, language });

  // --- Effects ---

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
      console.error("Failed to fetch pet status:", error);
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
    // Problem Initialization Logic (similar to BasicInfoB)
    let problemData = initialProblem;
    // Inject problemId into variables for logic that needs it
    const initialVarsWithId = {
      ...problemData.initialVariables,
      problemId: problemData.id
    };

    setProblem(problemData);
    setVariables(initialVarsWithId);
    setCurrentTraceLine(0);
    setTraceHistory([]);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsPresetSelected(false);
    setChatMessages([
      { sender: 'kohaku', text: textResources[language].problemStatement.hintInit },
    ]);
    setCredits(initialCredits);
    startTimeRef.current = Date.now();
    console.log(`Problem Applied Afternoon ${problemData.id} mounted at: ${startTimeRef.current}`);

    return () => {
      if (startTimeRef.current) {
        const endTime = Date.now();
        const durationMs = endTime - startTimeRef.current;
        console.log(`Problem ${problemData.id} unmounted. Duration: ${durationMs}ms`);
        if (durationMs > 3000) {
          recordStudyTimeAction(durationMs).catch(console.error);
        }
        startTimeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProblem, language, initialCredits]);

  const t = textResources[language].problemStatement;

  // --- Handlers ---

  const handleResetTrace = () => {
    hookResetTrace();
    setChatMessages(prev => [...prev, { sender: 'kohaku', text: t.resetTraceKohaku1 }]);
  };

  const handleSelectAnswer = async (selectedValue: string) => {
    if (isAnswered || !problem) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);

    const correct = isCorrectAnswer(selectedValue, problem.correctAnswer);
    setAnswerEffectType(correct ? 'correct' : 'incorrect');

    const numericId = parseInt(problem.id, 10);
    if (!isNaN(numericId)) {
      if (correct) {
        try {
          // Assuming subjectId 5 for 'applied_info_afternoon_problem' 
          // NOTE: Check if subjectId 5 is correct for this category or pass explicit subjectId
          const result = await awardXpForCorrectAnswer(numericId, undefined, 5);
          if (result.message === '経験値を獲得しました！') {
            window.dispatchEvent(new CustomEvent('petStatusUpdated'));
            // Level up check
            const res = await fetch('/api/pet/status');
            if (res.ok) {
              const { data } = await res.json();
              if (data?.level && data.level > 0 && data.level % 30 === 0) {
                setTimeout(() => router.push('/home?evolution=true'), 1500);
              }
            }
          }
          if (result.unlockedTitle) {
            toast.success(`称号【${result.unlockedTitle.name}】を獲得しました！`);
          }
        } catch (error) {
          toast.error('経験値の付与に失敗しました。');
        }
      } else {
        try {
          // record incorrect
          await recordAnswerAction(numericId, 5, false, selectedValue);
        } catch (error) {
          console.error("Failed to record incorrect answer:", error);
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
    setChatMessages(prev => [...prev, { sender: 'user', text: message }]);

    if (credits <= 0) {
      setChatMessages(prev => [...prev, { sender: 'kohaku', text: t.noCreditsMessage }]);
      return;
    }

    setIsAiLoading(true);

    try {
      const res = await fetch('/api/User/decrement-credit', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'クレジットの更新に失敗しました。');
      setCredits(data.newCredits);

      const context = {
        problemTitle: problem.title[currentLang],
        problemDescription: problem.description[currentLang],
        userCode: problem.programLines?.[currentLang]?.join('\n') || '',
        answerOptions: JSON.stringify(problem.answerOptions?.[currentLang] || []),
        correctAnswer: problem.correctAnswer,
        explanation: problem.explanationText?.[currentLang] || '',
        problemType: problem.logicType,
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
    const nextId = await getNextProblemId(parseInt(problem.id, 10), 'applied_info_afternoon_problem');
    if (nextId) {
      router.push(`/issue_list/applied_info_afternoon_problem/${nextId}`);
    } else {
      toast.success("最後の問題です！");
      router.push('/issue_list');
    }
  };

  const showTraceUI = problem.logicType !== 'STATIC_QA';

  // Reused Kohaku Chat Render Logic
  const renderKohakuChat = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center cursor-pointer"
      >
        <span className="font-semibold text-gray-700 text-sm">{t.kohakuChatTitle}</span>
        <div className="text-xs text-gray-600 flex items-center gap-1">
          {t.creditsLabel}
          <span className="font-bold text-base text-blue-600">{credits}</span>
          {t.creditsUnit}
          {credits <= 0 && (
            <Link href="/profile" className="text-xs text-blue-500 hover:underline ml-1">
              {t.increaseCreditsLink}
            </Link>
          )}
        </div>
        <span className={`transform transition-transform duration-200 ${isChatOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
      </button>
      {isChatOpen && (
        <div className="p-0">
          <KohakuChat
            messages={chatMessages}
            onSendMessage={handleUserMessage}
            language={language}
            textResources={{ ...t, chatInputPlaceholder: credits > 0 ? t.chatInputPlaceholder : t.noCreditsPlaceholder }}
            isLoading={isAiLoading}
            isDisabled={isAiLoading || credits <= 0}
            kohakuIcon={kohakuIcon}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center py-4 sm:py-6 bg-gray-100">
      {answerEffectType && (
        <AnswerEffect type={answerEffectType} onAnimationEnd={handleAnimationEnd} />
      )}
      <div className="w-full px-2 container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* 1. Problem Statement */}
          <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 min-h-[calc(100vh-100px)] flex flex-col ${showTraceUI ? 'lg:col-span-5' : 'lg:col-span-9'}`}>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center">
              問{problem.id}: {problem.title[currentLang]}
            </h1>
            <ProblemStatement
              description={problem.description[language]}
              programText={problem.programLines[language].join('\n')}
              answerOptions={problem.answerOptions ? problem.answerOptions[language] : []}
              onSelectAnswer={handleSelectAnswer}
              selectedAnswer={selectedAnswer}
              correctAnswer={problem.correctAnswer}
              isAnswered={isAnswered}
              explanation={problem.explanationText[language]}
              language={language}
              textResources={{ ...t, title: problem.title[language] }}
            />
          </div>

          {/* 2. Trace Screen */}
          {showTraceUI && (
            <div className="lg:col-span-4 flex flex-col gap-4 sticky top-24">
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <h2 className="text-lg font-bold text-gray-700 mb-3">{t.traceScreenTitle}</h2>
                <TraceScreen
                  programLines={problem.programLines[language]}
                  currentLine={currentTraceLine}
                  language={language}
                  textResources={t}
                />
              </div>
              {renderKohakuChat()}
            </div>
          )}

          {/* 3. Variables & Controls */}
          <div className="lg:col-span-3 flex flex-col gap-4 sticky top-24">
            {showTraceUI && (
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <VariableTraceControl
                  problem={problem}
                  variables={variables}
                  onNextTrace={handleNextTrace}
                  onPrevTrace={handlePrevTrace}
                  isTraceFinished={currentTraceLine >= 99 || (problem.programLines && currentTraceLine >= problem.programLines[language].length)}
                  canGoBack={traceHistory.length > 0}
                  onResetTrace={handleResetTrace}
                  currentTraceLine={currentTraceLine}
                  language={language}
                  textResources={t}
                  onSetNum={handleSetNum}
                  onSetData={handleSetData}
                  isPresetSelected={isPresetSelected}
                  selectedPresetLabel={selectedPresetLabel}
                  selectedLogicVariant={selectedLogicVariant}
                  onSetLogicVariant={handleSetLogicVariant}
                />
              </div>
            )}
            {!showTraceUI && renderKohakuChat()}
          </div>

        </div>

        {isAnswered && (
          <div className="w-full max-w-lg mt-8 mb-8 mx-auto flex justify-center">
            <button
              onClick={handleNextProblem}
              className="w-full py-4 px-8 text-xl font-bold text-white bg-green-500 rounded-lg shadow-lg hover:bg-green-600 transition-transform transform hover:scale-105"
            >
              {t.nextProblemButton}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemClient;
