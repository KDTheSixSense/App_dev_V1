'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- コンポーネントとロジック ---
import ProblemStatement from '../components/ProblemStatement';
import TraceScreen from '../components/TraceScreen';
import VariableTraceControl from '../components/VariableTraceControl';
import KohakuChat from '@/components/KohakuChat'; // KohakuChat コンポーネントをインポート
import { getHintFromAI } from '@/lib/actions/hintactions';
import { getNextProblemId, awardXpForCorrectAnswer, recordStudyTimeAction, recordAnswerAction } from '@/lib/actions';
import toast from 'react-hot-toast';
import { problemLogicsMap } from '../data/problem-logics';
import AnswerEffect from '@/components/AnswerEffect'; // AnswerEffect コンポーネントをインポート

// --- 型定義 ---
import type { SerializableProblem } from '@/lib/data';
import type { VariablesState, TraceStep } from '../data/problems';


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
      resetTraceButton: "リセット",
      prevTraceButton: "前のトレース",
      nextTraceButton: "次のトレース",
      traceCompletedButton: "トレース完了",
      noCreditsMessage: "アドバイス回数が残っていません。プロフィールページでXPと交換できます。",
      noCreditsPlaceholder: "アドバイス回数がありません",
      creditsLabel: "AIアドバイス残り:", // クレジット表示用ラベル追加
      creditsUnit: "回", // クレジット表示用単位追加
      increaseCreditsLink: "(XPで増やす)", // クレジット増加リンクテキスト追加
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
      nextTraceButton: "Next Step",
      prevTraceButton: "Prev Step",
      traceCompletedButton: "Trace Complete",
      noCreditsMessage: "No advice credits remaining. You can exchange XP for credits on your profile page.",
      noCreditsPlaceholder: "No credits remaining",
      creditsLabel: "AI Advice Credits:", // ★ クレジット表示用ラベル追加 (EN)
      creditsUnit: "left", // ★ クレジット表示用単位追加 (EN)
      increaseCreditsLink: "(Increase with XP)", // ★ クレジット増加リンクテキスト追加 (EN)
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

// 履歴データの型定義を追加
type TraceHistoryItem = {
  line: number;
  variables: VariablesState;
};

const ProblemClient: React.FC<ProblemClientProps> = ({ initialProblem, initialCredits }) => {
  const router = useRouter();


  // --- 状態管理 ---
  const [problem, setProblem] = useState<SerializableProblem>(initialProblem);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentTraceLine, setCurrentTraceLine] = useState(0);
  const [variables, setVariables] = useState<VariablesState>(initialProblem.initialVariables);
  const [traceHistory, setTraceHistory] = useState<TraceHistoryItem[]>([]);　// 履歴管理用のStateを追加
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('ja');
  const [isPresetSelected, setIsPresetSelected] = useState<boolean>(false);
  const [credits, setCredits] = useState(initialCredits);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const [answerEffectType, setAnswerEffectType] = useState<'correct' | 'incorrect' | null>(null); // エフェクトタイプを追加

  const [kohakuIcon, setKohakuIcon] = useState('/images/Kohaku/kohaku-normal.png');
  const [selectedLogicVariant, setSelectedLogicVariant] = useState<string | null>(null);

  const [isTraceFinished, setIsTraceFinished] = useState(false);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string | null>(null);
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
    let problemData = initialProblem;
    // ここで problemId を variables に注入する
    const initialVarsWithId = {
      ...problemData.initialVariables,
      problemId: problemData.id // これを追加
    };

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

    // 【追加点】問11のデータ補完処理
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
    setVariables(initialVarsWithId);
    setCurrentTraceLine(0);
    setTraceHistory([]);
    setVariables(problemData.initialVariables);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsPresetSelected(false);
    setChatMessages([
      { sender: 'kohaku', text: textResources[language].problemStatement.hintInit },
    ]);
    setCredits(initialCredits);
    // コンポーネントマウント時に開始時刻を記録
    startTimeRef.current = Date.now();
    console.log(`Problem ${problemData.id} mounted at: ${startTimeRef.current}`);

    // コンポーネントアンマウント時に実行されるクリーンアップ関数
    return () => {
      if (startTimeRef.current) {
        const endTime = Date.now();
        const durationMs = endTime - startTimeRef.current;
        console.log(`Problem ${problemData.id} unmounted. Duration: ${durationMs}ms`);

        // 短すぎる滞在時間は記録しない (例: 3秒未満)
        if (durationMs > 3000) {
          // サーバーアクションを呼び出す (エラーはコンソールに出力)
          // awaitは付けず、バックグラウンドで実行させる (UIをブロックしない)
          recordStudyTimeAction(durationMs).catch(error => {
            console.error("Failed to record study time:", error);
            // 必要であればユーザーに通知 (ただし、ページ離脱時なので難しい場合も)
            // toast.error('学習時間の記録に失敗しました。');
          });
        }
        startTimeRef.current = null; // 念のためリセット
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProblem, language, initialCredits]); // 依存配列は元のまま or 必要に応じて調整

  const t = textResources[language].problemStatement;

  const handleSelectAnswer = async (selectedValue: string) => {
    if (isAnswered || !problem) return;
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);
    const correct = isCorrectAnswer(selectedValue, problem.correctAnswer);

    setAnswerEffectType(correct ? 'correct' : 'incorrect'); // エフェクトタイプを設定

    if (correct) {
      try {
        const problemId = parseInt(problem.id, 10);
        const result = await awardXpForCorrectAnswer(problemId, undefined, 3); // 科目Bの問題なのでsubjectidに3を渡す
        // 処理が成功し、エラーでなければヘッダーのペットゲージを更新する
        if (result.message === '経験値を獲得しました！') {
          window.dispatchEvent(new CustomEvent('petStatusUpdated'));
        } console.log(result.message); // "経験値を獲得しました！" or "既に正解済みです。"
        if (result.unlockedTitle) {
          toast.success(`称号【${result.unlockedTitle.name}】を獲得しました！`);
        }
      } catch (error) {
        toast.error('経験値の付与に失敗しました。');
      }
    } else {
      // Log incorrect answer
      try {
        const problemId = parseInt(problem.id, 10);
        await recordAnswerAction(problemId, 3, false, selectedValue);
      } catch (error) {
        console.error("Failed to record incorrect answer:", error);
      }
    }
    const hint = correct ? t.hintCorrect : t.hintIncorrect(problem.correctAnswer);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
  };

  const handleAnimationEnd = useCallback(() => {
    setAnswerEffectType(null); // アニメーション終了後にエフェクトを非表示にする
  }, []);

  const handleNextTrace = () => {
    if (!problem || !problem.programLines) return;

    // 1. 最初にトレースが終了しているかチェック
    const traceFinished = currentTraceLine >= 99 || (currentTraceLine >= (problem.programLines[language]?.length || 99));

    if (!traceFinished) { // トレースが終了していない場合のみ実行
      // 1. 現在の状態を履歴に保存 (ディープコピーで保存してバグを防ぐ)
      // 配列やオブジェクトが参照渡しにならないように JSON.parse(JSON.stringify(...)) を使用
      const currentSnapshot: TraceHistoryItem = {
        line: currentTraceLine,
        variables: JSON.parse(JSON.stringify(variables))
      };
      setTraceHistory(prev => [...prev, currentSnapshot]);
      const logic = problemLogicsMap[problem.logicType as keyof typeof problemLogicsMap];
      if (!logic) return;

      // 2. 次にジャンプすべき行番号(nextLine)を決定
      let nextLine = currentTraceLine + 1; // デフォルトは次の行
      if ('calculateNextLine' in logic && logic.calculateNextLine) {
        nextLine = logic.calculateNextLine(currentTraceLine, variables, selectedLogicVariant);
      }

      // 3. 現在の行(currentTraceLine)の実行内容(traceStepFunction)を取得
      let traceStepFunction: TraceStep | undefined = undefined;

      if ('getTraceStep' in logic && typeof (logic as any).getTraceStep === 'function') {
        // --- (A) getTraceStep を持つロジック (問6: ビット反転) ---
        traceStepFunction = (logic as any).getTraceStep(currentTraceLine, selectedLogicVariant);

      } else if ('traceLogic' in logic) {
        // --- (B) 従来の traceLogic 配列を持つロジック (問4など) ---
        traceStepFunction = (logic as any).traceLogic[currentTraceLine];

      } else {
        // --- (C) どちらも持たない場合 (エラー) ---
        console.error(`Logic for ${problem.logicType} has neither getTraceStep nor traceLogic.`);
        traceStepFunction = (vars) => vars; // 何もしない
      }

      const varsWithContext = { ...variables, currentLine: currentTraceLine, problemId: problem.id };
      const nextVariables = traceStepFunction ? traceStepFunction(varsWithContext) : { ...variables };

      setVariables(nextVariables); // 状態を更新
      setCurrentTraceLine(nextLine); // 次の行番号をセット
    } else {
      console.warn("Trace attempted beyond program lines length.");
    }
  };


  // 前のトレースに戻る関数
  const handlePrevTrace = () => {
    if (traceHistory.length === 0) return;

    // 履歴の最後（1つ前の状態）を取得
    const prevStep = traceHistory[traceHistory.length - 1];

    // 状態を復元
    setVariables(prevStep.variables);
    setCurrentTraceLine(prevStep.line);

    // 履歴から削除
    setTraceHistory(prev => prev.slice(0, -1));
  };

  // リセット時の処理（修正）
  const handleResetTrace = () => {
    const cleanVariables = JSON.parse(JSON.stringify(problem.initialVariables));

    setVariables({
      ...problem.initialVariables,
      problemId: problem.id,
      initialized: false
    });

    const initialLine = problem.id === '28' ? 4 : 0;

    setCurrentTraceLine(initialLine);
    setTraceHistory([]); // 履歴もクリア
    setIsPresetSelected(false);
    setSelectedLogicVariant(null);
    setChatMessages(prev => [...prev, { sender: 'kohaku', text: "トレースをリセットしました。" }]);
  };

  const handleSetLogicVariant = (variantId: string) => {
    // 1. UIの選択状態を更新
    setSelectedLogicVariant(variantId);

    // 2. ロジック側が参照できるように variables._variant にも注入する
    setVariables((prev) => ({
      ...prev,
      _variant: variantId,
    }));

    // (オプション) ロジックを変えたらトレースをリセットする場合
    setCurrentTraceLine(0);
    setIsTraceFinished(false);
  };

  const handleSetData = (dataToSet: Record<string, any>, label: string = "") => {
    const cleanVariables = JSON.parse(JSON.stringify(problem.initialVariables));

    setVariables((prev) => ({
      ...cleanVariables, // まず初期状態に戻す
      ...dataToSet,                // 選択されたデータを上書き

      // ★重要: 現在選択中のロジック(variant)を維持してセットする
      // これをしないと、データを変えた瞬間にロジック判定が消えてしまいます
      _variant: selectedLogicVariant,

      initialized: false,
      problemId: problem.id
    }));
    setCurrentTraceLine(0);
    setTraceHistory([]);
    setIsPresetSelected(true);
    // setSelectedLogicVariant(null); //入力データを選択する度にロジックがリセットされていたのでコメントアウト化
    setSelectedPresetLabel(label);
  };

  const handleSetNum = (num: number) => {
    setVariables({ ...problem.initialVariables, num: num, initialized: false, problemId: problem.id }); // initializedをfalseにリセット
    setCurrentTraceLine(0); // トレース行をリセット
    setTraceHistory([]);
    setIsPresetSelected(true); // プリセットが選択されたことを示すフラグを立てる
    setSelectedLogicVariant(null);
    setSelectedPresetLabel(String(num));
  };

  const handleNextProblem = async () => {
    const nextId = await getNextProblemId(parseInt(problem.id, 10), 'basic_info_b_problem');
    if (nextId) {
      router.push(`/issue_list/basic_info_b_problem/${nextId}`);
    } else {
      toast.success("これが最後の問題です！");
      router.push('/issue_list');
    }
  };

  const handleUserMessage = async (message: string) => {
    // ユーザーのメッセージは常にチャット履歴に追加
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
        userCode: problem.programLines?.[currentLang]?.join('\n') || '', // プログラムを文字列として渡す
        answerOptions: JSON.stringify(problem.answerOptions?.[currentLang] || []),
        correctAnswer: problem.correctAnswer,
        explanation: problem.explanationText?.[currentLang] || '',
        problemType: problem.logicType, // 問題の種類を追加
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

  // コハクのチャットUIを共通パーツとして定義（配置場所が変わるため）
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
    <div className="min-h-screen flex flex-col items-center py-4 sm:py-6">
      <div className="w-full px-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* 1. 左カラム: 問題文 */}
          {/* 変更点: トレース無し(Basic A)の場合、col-span-8(中央寄せ)からcol-span-9(左詰め)に変更し、右側にチャットエリアを確保 */}
          <div className={`bg-white p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200 min-h-[calc(100vh-100px)] flex flex-col ${showTraceUI ? 'lg:col-span-5' : 'lg:col-span-9'}`}>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center">
              問{problem.id}: {problem.title[currentLang]}
            </h1>
            <ProblemStatement
              description={problem.description[currentLang]}
              programText={problem.programLines?.[currentLang]?.join('\n') || ''}
              answerOptions={problem.answerOptions?.[currentLang] || []}
              onSelectAnswer={handleSelectAnswer}
              selectedAnswer={selectedAnswer}
              correctAnswer={problem.correctAnswer}
              isAnswered={isAnswered}
              explanation={problem.explanationText[currentLang] || ''}
              language={language}
              textResources={{ ...t, title: problem.title[currentLang] }}
              problemId={problem.id} // 追加: 画像表示判定のために問題IDを渡す
            />
          </div>

          {/* 2. 中央カラム: トレース画面 & コハクの質問(B問題用) */}
          {/* トレースがある場合のみ表示 */}
          {showTraceUI && (
            <div className="lg:col-span-4 flex flex-col gap-4 sticky top-24">
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-lg font-bold text-gray-700 mb-3">{t.traceScreenTitle}</h2>
                <TraceScreen
                  programLines={problem.programLines?.[currentLang] || []}
                  currentLine={currentTraceLine}
                  language={language}
                  textResources={t}
                />
              </div>
              {/* 変更点: コハクの質問をここ(中央カラム下)に移動 */}
              {renderKohakuChat()}
            </div>
          )}

          {/* 3. 右カラム: トレース結果(変数) または コハクの質問(A問題用) */}
          <div className="lg:col-span-3 flex flex-col gap-4 sticky top-24">

            {/* トレース結果 (トレースがある場合のみ) */}
            {showTraceUI && (
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <VariableTraceControl
                  problem={problem}
                  variables={variables}
                  onNextTrace={handleNextTrace}
                  onPrevTrace={handlePrevTrace}
                  isTraceFinished={currentTraceLine >= 99 || (problem.programLines && currentTraceLine >= problem.programLines[currentLang].length)}
                  canGoBack={traceHistory.length > 0}
                  onResetTrace={handleResetTrace}
                  currentTraceLine={currentTraceLine}
                  language={language}
                  textResources={t}
                  onSetData={handleSetData}
                  isPresetSelected={isPresetSelected}
                  onSetNum={handleSetNum}
                  selectedPresetLabel={selectedPresetLabel}
                  selectedLogicVariant={selectedLogicVariant}
                  onSetLogicVariant={setSelectedLogicVariant}
                />
              </div>
            )}

            {/* 変更点: トレースが無い場合(A問題)は、ここにコハクの質問を表示して2カラム構成にする */}
            {!showTraceUI && renderKohakuChat()}
          </div>

        </div>

        {/* 次の問題へボタン */}
        {isAnswered && (
          <div className="w-full max-w-2xl mx-auto mt-6 flex justify-center">
            <button onClick={handleNextProblem} className="w-full py-3 px-8 text-lg font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105">
              {t.nextProblemButton}
            </button>
          </div>
        )}
      </div>
      {answerEffectType && (
        <AnswerEffect type={answerEffectType} onAnimationEnd={handleAnimationEnd} />
      )}
    </div>
  );
};

export default ProblemClient;