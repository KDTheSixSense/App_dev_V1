/**
 * @file 科目Bの各問題ページを表示・操作するためのメインコンポーネントです。
 * @description
 * このファイルはNext.jsの動的ルーティング（[problemId]）に対応しています。
 * URLから問題IDを取得し、対応する問題データを外部ファイルから読み込みます。
 * ユーザーの操作（解答選択、トレース実行など）に応じて状態を管理し、
 * 各UIコンポーネントに情報を渡して画面を更新します。
 */

// 'use client' は、このコンポーネントがクライアントサイドで動作することを示すNext.jsの宣言です。
// これにより、useStateやuseEffectなどのReactフックが使用可能になります。
'use client';

// --- React / Next.js のコア機能 ---
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Next.jsのルーティング機能

// --- 自作コンポーネント ---
// 画面を構成する各UIパーツをインポートします。
import ProblemStatement from '../components/ProblemStatement';     // 問題文、解答群、解説エリア
import TraceScreen from '../components/TraceScreen';               // トレース画面（コード表示）
import VariableTraceControl from '../components/VariableTraceControl'; // 変数表示とトレース操作エリア
import KohakuChat from '../components/KohakuChat';                 // AIチャットエリア

// --- データと型定義 ---
// 外部ファイルから問題データ取得関数とTypeScriptの型定義をインポートします。
// こうすることで、ページコンポーネントは純粋に表示とロジックに集中できます。
import { getProblemById, Problem, VariablesState } from '../data/problems';

/**
 * @constant textResources
 * @description
 * アプリケーション全体で使われる共通のUIテキストを定義します。
 * テキストを一元管理することで、文言の修正や多言語対応が容易になります。
 * 各問題固有のタイトルなどは、問題データから取得して上書きします。
 */
const textResources = {
  ja: {
    problemStatement: {
      title: "サンプル問題 [科目B] 問1", // デフォルトのタイトル（問題データで上書きされる）
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
        const varString = Object.entries(vars)
          .map(([key, value]) => `${key} = ${value !== null ? `"${value}"` : 'null'}`)
          .join(', ');
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
        const varString = Object.entries(vars)
          .map(([key, value]) => `${key} = ${value !== null ? `"${value}"` : 'null'}`)
          .join(', ');
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
} as const; // 'as const' をつけることで、TypeScriptが型をより厳密に推論し、プロパティの変更を防ぎます。

// --- 型定義 ---
// このページコンポーネント内で利用する型を定義します。
type Language = 'ja' | 'en';
type TextResources = typeof textResources['ja']['problemStatement'];
type ChatMessage = { sender: 'user' | 'kohaku'; text: string };


/**
 * 選択された解答が正しいかどうかを判定するヘルパー関数
 * @param selected ユーザーが選択した解答の文字列
 * @param correct 問題データに定義されている正解の文字列
 * @returns {boolean} 正解であればtrue、そうでなければfalseを返します。
 */
const isCorrectAnswer = (selected: string | null, correct: string): boolean => {
  // 解答が選択されていない場合は不正解
  if (selected === null) {
    return false;
  }
  // 解答の前後の空白を削除して比較することで、予期せぬ不一致を防ぎます。
  return selected.trim() === correct.trim();
};

/**
 * 科目Bの問題ページを表示するメインコンポーネント
 */
const BasicInfoBProblemPage: React.FC = () => {
  // --- Hooks ---
  // ReactやNext.jsが提供するフック（機能）を初期化します。
  const router = useRouter(); // ページ遷移を制御するためのフック
  const params = useParams(); // URLの動的な部分（例: /.../[problemId]）を取得するためのフック

  // --- State Management ---
  // このコンポーネントが持つ「状態（State）」を定義します。
  // Stateが変化すると、画面が自動的に再描画されます。

  // URLから取得した問題ID (例: "1", "2")
  const problemId = Array.isArray(params.problemId) ? params.problemId[0] : params.problemId;

  // 現在表示している問題の全データ。非同期で読み込むため、初期値はnullに設定。
  const [problem, setProblem] = useState<Problem | null>(null);
  // 現在のトレースのステップ数（プログラムの何行目まで実行したか）。0から始まる。
  const [currentTraceLine, setCurrentTraceLine] = useState(0);
  // プログラム内の変数の状態を保持するオブジェクト。 (例: { x: 1, y: 2, z: 3 })
  const [variables, setVariables] = useState<VariablesState>({});
  // AIチャットのメッセージ履歴を保持する配列。
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  // ユーザーが選択した解答。
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  // ユーザーが解答済みかどうかのフラグ。
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  // 現在の表示言語。
  const [language, setLanguage] = useState<Language>('ja');

  // --- Side Effects (副作用) ---
  // `useEffect`は、特定のStateが変更されたときに特定の処理を実行するために使用します。
  // ここでは、URL（problemId）や言語（language）が変更されたときに、問題データを読み込み直し、各種Stateをリセットします。
  useEffect(() => {
    // URLからproblemIdが取得できている場合のみ処理を実行
    if (problemId) {
      // IDに対応する問題データを外部ファイルから取得
      const currentProblem = getProblemById(problemId);

      if (currentProblem) {
        // 問題データが見つかった場合、各種Stateをその問題の初期状態に更新する
        setProblem(currentProblem);                      // 問題データをStateにセット
        setCurrentTraceLine(0);                          // トレースのステップを最初に戻す
        setVariables(currentProblem.initialVariables);   // 変数を問題の初期状態にリセット
        setSelectedAnswer(null);                         // ユーザーの解答をリセット
        setIsAnswered(false);                            // 解答済みフラグをリセット
        // チャット履歴を初期メッセージでリセット
        setChatMessages([
          { sender: 'kohaku', text: textResources[language].problemStatement.hintInit },
        ]);
      } else {
        // 問題データが見つからなかった場合、問題一覧ページにリダイレクトする
        router.push('/issue_list');
      }
    }
    // `useEffect`の依存配列。この配列内の値が変更されたときだけ、この中の処理が再実行されます。
  }, [problemId, language, router]);

  // --- UI Text ---
  // 現在の言語に応じた共通UIテキストを`t`という短い名前で使えるようにします。
  const t = textResources[language].problemStatement;

  // --- Handlers ---
  // ユーザーのアクション（ボタンクリックなど）に応じて実行される関数群です。

  /**
   * コハク（AIチャット）の応答を生成するロジック。
   * @param userQuestion ユーザーからの質問文字列（オプション）
   * @returns {string} コハクからの応答メッセージ文字列
   */
  const generateKohakuResponse = (
    currentLine: number,
    currentVariables: typeof variables,
    isAnsweredStatus: boolean = false,
    answerToCheckValue?: string | null,
    userQuestion?: string
  ): string => {
    // problemがまだ読み込まれていない場合は、待機メッセージを返す
    if (!problem) return "問題の読み込み中です...";

    // 解答が送信された直後の正誤判定メッセージを生成
    if (isAnsweredStatus) {
      if (isCorrectAnswer(answerToCheckValue || selectedAnswer, problem.correctAnswer)) {
        return t.hintCorrect; // 正解メッセージ
      } else {
        return t.hintIncorrect(problem.correctAnswer); // 不正解メッセージ
      }
    }
    
    // ユーザーからの自由な質問に対する応答を生成
    if (userQuestion) {
        const lowerCaseQuestion = userQuestion.toLowerCase(); // 判定のため小文字に変換
        if (lowerCaseQuestion.includes("変数") || lowerCaseQuestion.includes("variable")) {
            return t.hintVariableQuestion(currentVariables);
        } else if (lowerCaseQuestion.includes("答え") || lowerCaseQuestion.includes("answer")) {
            return t.hintNoAnswer;
        }
        // どのキーワードにも当てはまらない場合
        return t.hintGenericQuestion;
    }
    // どの条件にも当てはまらない場合のデフォルト応答
    return t.hintGenericQuestion;
  };

  /**
   * 「次のトレース」ボタンがクリックされたときの処理。トレースを1ステップ進めます。
   */
  const handleNextTrace = () => {
    // 問題データが存在し、かつトレースが完了していない場合のみ実行
    if (problem && currentTraceLine < problem.programLines[language].length) {
      // 1. 次の変数の状態を計算します（この時点ではまだStateを更新しません）
      const traceStepFunction = problem.traceLogic[currentTraceLine];
      const nextVariables = traceStepFunction ? traceStepFunction(variables) : { ...variables };

      // 2. 「更新後の変数」を使って、次に進むべき行を決定します（FizzBuzzのような条件分岐問題用）
      let nextLine;
      if (problem.calculateNextLine) {
        // 問題データに特別な分岐計算ロジックが定義されていれば、それを使って次の行を計算
        nextLine = problem.calculateNextLine(currentTraceLine, nextVariables);
      } else {
        // なければ、単純に現在の行の次の行へ進む
        nextLine = currentTraceLine + 1;
      }
      
      // 3. 計算した変数の状態と行番号で、Stateを一度に更新します
      setVariables(nextVariables);
      setCurrentTraceLine(nextLine);
    }
  };

  /**
   * FizzBuzz問題などで、ユーザーがトレース開始時の入力値を設定したときの処理。
   * @param num ユーザーが設定した数値
   */
  const handleSetNum = (num: number) => {
    if (problem) {
      // 変数オブジェクトにnumを設定してリセットします
      setVariables({ ...problem.initialVariables, num: num });
      setCurrentTraceLine(0); // トレースも最初からやり直します
    }
  };

  /**
   * 「もう一度トレース」ボタンがクリックされたときの処理。トレースを初期状態に戻します。
   */
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

  /**
   * 解答選択肢がクリックされたときの処理。
   * @param selectedValue ユーザーが選択した解答のvalue (例: '1,2', 'ウ')
   */
  const handleSelectAnswer = (selectedValue: string) => {
    // 解答済み、または問題データがない場合は何もしない
    if (isAnswered || !problem) return;

    // 選択された解答を記録し、解答済みフラグを立てる
    setSelectedAnswer(selectedValue);
    setIsAnswered(true);

    // 正誤判定に基づき、コハクのメッセージを生成してチャットに追加
    const hint = generateKohakuResponse(currentTraceLine, variables, true, selectedValue);
    setChatMessages((prev) => [...prev, { sender: 'kohaku', text: hint }]);
  };

  /**
   * チャットでメッセージが送信されたときの処理。
   * @param message ユーザーが入力したメッセージ文字列
   */
  const handleUserMessage = (message: string) => {
    // ユーザーのメッセージをチャット履歴に追加
    setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
    // 1秒後にコハクの応答をシミュレート
    setTimeout(() => {
      const kohakuResponse = generateKohakuResponse(currentTraceLine, variables, false, null, message);
      setChatMessages((prev) => [...prev, { sender: 'kohaku', text: kohakuResponse }]);
    }, 1000);
  };

  /**
   * 「次の問題へ」ボタンがクリックされたときの処理。
   */
  const handleNextProblem = () => {
    if (problem) {
      // 現在の問題IDを数値に変換して+1する
      const currentId = parseInt(problem.id, 10);
      const nextProblemId = (currentId + 1).toString();
      
      // 次の問題が存在するか確認
      if (getProblemById(nextProblemId)) {
        // 次の問題ページへ遷移
        router.push(`/issue_list/basic_info_b_problem/${nextProblemId}`);
      } else {
        // 最後の問題だった場合
        alert("最後の問題です！");
        router.push('/issue_list');
      }
    }
  };

  // --- Render (画面描画) ---

  // データ読み込み中はローディング画面を表示します。
  // これにより、problemがnullの状態で後続のコードが実行されるのを防ぎます。
  if (!problem) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  // 画面の構造をJSX（HTMLに似た記法）で記述します。
  // 各UIコンポーネントに、Stateやハンドラ関数をPropsとして渡します。
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* ページ全体のレイアウトコンテナ */}
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* 左カラム: 問題文エリア */}
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
            textResources={{ ...t, title: problem.title[language] }} // 共通テキストと問題固有タイトルをマージ
          />
        </div>
        
        {/* 中央カラム: トレース & 変数エリア */}
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
        
        {/* 右カラム: AIチャットエリア */}
        <div className="w-full lg:w-96 flex flex-col">
          <KohakuChat
            messages={chatMessages}
            onSendMessage={handleUserMessage}
            language={language}
            textResources={t}
          />
        </div>
      </div>

      {/* 解答後に表示される「次の問題へ」ボタン */}
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

export default BasicInfoBProblemPage;