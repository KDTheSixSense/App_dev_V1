// /workspaces/my-next-app/src/app/(main)/issue_list/basic_info_b_problem/[problemId]/ProblemClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import ProblemStatement from '../components/ProblemStatement';
import TraceScreen from '../components/TraceScreen';
import VariableTraceControl from '../components/VariableTraceControl';
import KohakuChat from '../components/KohakuChat';

import { problemLogicsMap } from '../problems/problem-logics';
import type { SerializableProblem } from '@/lib/data';
import type { VariablesState } from '@/lib/types/index';
import { getNextProblemId } from '@/lib/actions';

// --- 多言語対応テキストとヘルパー関数 ---

const textResources = {
  ja: {
    problemStatement: {
      title: "サンプル問題 [科目B] 問1",
      programTitle: "（プログラム）",
      answerGroup: "解答群",
      explanationTitle: "解説",
      hintInit: "こんにちは！何かわからないことはありますか？",
      hintCorrect: "正解です！プログラムのトレースはバッチリですね。解説も読んで理解を深めましょう！",
      hintIncorrect: (correctValue: string) => `残念、正解は「${correctValue}」でした。もう一度トレースを見直したり、解説を読んでみましょう。`,
      hintTraceInit: "まずはプログラムの初期化部分を確認しましょう。変数x, y, zに何が代入されますか？",
      hintTraceLine1: "1行目でxに1が代入されましたね。トレース表のxの値を確認しましょう。",
      hintTraceLine4: "4行目に注目してください。変数xの値がyの値に更新されます。現在のyの値は何でしたか？",
      hintTraceLine5: "5行目ではyがzの値に更新されますね。トレース表でのyの変化を追ってみましょう。",
      hintTraceLine6: "6行目です。zがxの値に更新されます。一つ前の行までのxの値を確認してください。",
      hintTraceCompleted: (y: number | null, z: number | null) => `トレースは完了しています。最終的なyの値は${y}, zの値は${z}のようですね。`,
      hintContinueTrace: "続けてトレースを進めてみましょう。一歩ずつ確認することが大切です。",
      hintGenericQuestion: "はい、何か質問でしょうか？ 具体的に何を知りたいですか？",
      hintVariableQuestion: (vars: VariablesState) => {
        const varString = Object.entries(vars).map(([key, value]) => `${key} = ${value !== null ? `"${value}"` : 'null'}`).join(', ');
        return `現在の変数の値は、 ${varString} のようですね。この値で合っていますか？`;
      },
      hintTraceProgress: (line: number) => `現在、${line}行目のトレースを行っています。プログラムの流れを確認してみましょう。`,
      hintNoAnswer: "残念ながら、直接答えをお伝えすることはできません。ヒントを出すことはできますよ。どこがわからないですか？",
      resetTraceKohaku1: "トレースを最初からやり直しますね！",
      resetTraceKohaku2: "もう一度、プログラムの動きを追っていきましょう。",
      traceScreenTitle: "トレース画面",
      variableSectionTitle: "変数",
      varX: "整数型 x",
      varY: "整数型 y",
      varZ: "整数型 z",
      nextTraceButton: "次のトレース",
      traceCompletedButton: "トレース完了",
      resetTraceButton: "もう一度トレース",
      kohakuChatTitle: "コハクに質問",
      chatInputPlaceholder: "コハクに質問...",
      sendButton: "質問",
      nextProblemButton: "次の問題へ",
      toggleTraceButton: "トレース表示",
      toggleKohakuButton: "コハクチャット表示",
    },
  },
  en: {
    problemStatement: {
      title: "Sample Problem [Subject B] Q1",
      programTitle: "(Program)",
      answerGroup: "Answer Choices",
      explanationTitle: "Explanation",
      hintInit: "Hello! Is there anything I can help you with?",
      hintCorrect: "That's correct! You've mastered the program trace. Let's deepen your understanding by reading the explanation!",
      hintIncorrect: (correctValue: string) => `Unfortunately, the correct answer was "${correctValue}". Let's review the trace or read the explanation.`,
      hintTraceInit: "Let's start by checking the program's initialization. What values are assigned to variables x, y, and z?",
      hintTraceLine1: "In line 1, x is assigned 1. Let's check the value of x in the trace table.",
      hintTraceLine4: "Pay attention to line 4. The value of variable x is updated to the value of y. What was the current value of y?",
      hintTraceLine5: "In line 5, y is updated to the value of z. Let's follow the change of y in the trace table.",
      hintTraceLine6: "Line 6. z is updated to the value of x. Please check the value of x up to the previous line.",
      hintTraceCompleted: (y: number | null, z: number | null) => `Trace completed. The final values seem to be y=${y}, z=${z}.`,
      hintContinueTrace: "Let's continue tracing step by step. It's important to check each step.",
      hintGenericQuestion: "Yes, do you have a question? What specifically would you like to know?",
      hintVariableQuestion: (vars: VariablesState) => {
        const varString = Object.entries(vars).map(([key, value]) => `${key} = ${value !== null ? `"${value}"` : 'null'}`).join(', ');
        return `The current variable values seem to be: ${varString}. Is this correct?`;
      },
      hintTraceProgress: (line: number) => `Currently, tracing line ${line}. Let's review the program flow.`,
      hintNoAnswer: "Unfortunately, I cannot give you the direct answer. But I can give you hints. What are you stuck on?",
      resetTraceKohaku1: "I'll reset the trace for you!",
      resetTraceKohaku2: "Let's trace the program's movement again.",
      traceScreenTitle: "Trace Screen",
      variableSectionTitle: "Variables",
      varX: "Integer x",
      varY: "Integer y",
      varZ: "Integer z",
      nextTraceButton: "Next Trace",
      traceCompletedButton: "Trace Completed",
      resetTraceButton: "Trace Again",
      kohakuChatTitle: "Ask Kohaku",
      chatInputPlaceholder: "Ask Kohaku...",
      sendButton: "Ask",
      nextProblemButton: "Next Problem",
      toggleTraceButton: "Show Trace",
      toggleKohakuButton: "Show Kohaku Chat",
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
type TextResources = typeof textResources['ja']['problemStatement'];
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };

interface ProblemClientProps {
  initialProblem: SerializableProblem;
}

const ProblemClient: React.FC<ProblemClientProps> = ({ initialProblem }) => {
  const router = useRouter();

  const [problem, setProblem] = useState<SerializableProblem>(initialProblem);
  const [currentTraceLine, setCurrentTraceLine] = useState(0);
  const [variables, setVariables] = useState<VariablesState>(initialProblem.initialVariables);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');

  useEffect(() => {
    setProblem(initialProblem);
    setCurrentTraceLine(0);
    setVariables(initialProblem.initialVariables);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setChatMessages([
      { sender: 'kohaku', text: textResources[language].problemStatement.hintInit },
    ]);
  }, [initialProblem.id, language]);

  const t = textResources[language].problemStatement;

  const generateKohakuResponse = (
    currentLine: number,
    currentVariables: typeof variables,
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
      if (lowerCaseQuestion.includes("変数") || lowerCaseQuestion.includes("variable")) {
        return t.hintVariableQuestion(currentVariables);
      } else if (lowerCaseQuestion.includes("答え") || lowerCaseQuestion.includes("answer")) {
        return t.hintNoAnswer;
      }
      return t.hintGenericQuestion;
    }
    return t.hintGenericQuestion;
  };

  const handleNextTrace = () => {
    if (problem && currentTraceLine < problem.programLines[language].length) {
      const logic = problemLogicsMap[problem.logicType as keyof typeof problemLogicsMap];
      if (!logic) return;

      const traceStepFunction = logic.traceLogic[currentTraceLine];
      const nextVariables = traceStepFunction ? traceStepFunction(variables) : { ...variables };

      let nextLine;
      if ('calculateNextLine' in logic && logic.calculateNextLine) {
        nextLine = logic.calculateNextLine(currentTraceLine, nextVariables);
      } else {
        nextLine = currentTraceLine + 1;
      }
      
      setVariables(nextVariables);
      setCurrentTraceLine(nextLine);
    }
  };

  const handleSetNum = (num: number) => {
    if (problem) {
      setVariables({ ...problem.initialVariables, num: num });
      setCurrentTraceLine(0);
    }
  };

  const handleResetTrace = () => {
    if (problem) {
      setCurrentTraceLine(0);
      setVariables(problem.initialVariables);
      setChatMessages([
        { sender: 'kohaku', text: t.resetTraceKohaku1 },
        { sender: 'kohaku', text: t.resetTraceKohaku2 },
      ]);
    }
  };

  const handleSelectAnswer = (selectedValue: string) => {
    if (isAnswered || !problem) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);
    const hint = generateKohakuResponse(currentTraceLine, variables, true, selectedValue);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
  };

  const handleUserMessage = (message: string) => {
    setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
    setTimeout(() => {
      const kohakuResponse = generateKohakuResponse(currentTraceLine, variables, false, null, message);
      setChatMessages((prev) => [...prev, { sender: 'kohaku', text: kohakuResponse }]);
    }, 1000);
  };

  const handleNextProblem = async () => {
    const currentId = parseInt(problem.id, 10);
    const nextProblemId = await getNextProblemId(currentId, 'applied_info_afternoon_problem');
    
    if (nextProblemId) {
      router.push(`/issue_list/basic_info_b_problem/${nextProblemId}`);
    } else {
      alert("最後の問題です！");
      router.push('/issue_list');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 bg-white p-8 rounded-lg shadow-md min-h-[800px] flex flex-col">
          <ProblemStatement
            description={problem.description[language]}
            programText={problem.programLines[language].join('\n')}
            answerOptions={problem.answerOptions[language]}
            onSelectAnswer={handleSelectAnswer}
            selectedAnswer={selectedAnswer}
            correctAnswer={problem.correctAnswer}
            isAnswered={isAnswered}
            explanation={problem.explanationText[language]}
            language={language}
            textResources={{ ...t, title: problem.title[language] }}
          />
        </div>
        
        <div className="flex-1 flex flex-col gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md flex-grow overflow-hidden">
            <TraceScreen
              programLines={problem.programLines[language]}
              currentLine={currentTraceLine}
              language={language}
              textResources={t}
            />
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <VariableTraceControl
              problem={problem}
              variables={variables}
              onNextTrace={handleNextTrace}
              isTraceFinished={currentTraceLine >= problem.programLines[language].length}
              onResetTrace={handleResetTrace}
              currentTraceLine={currentTraceLine}
              language={language}
              textResources={t}
              onSetNum={handleSetNum}
            />
          </div>
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
};

export default ProblemClient;