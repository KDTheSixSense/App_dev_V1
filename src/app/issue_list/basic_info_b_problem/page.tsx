// 'use client' ディレクティブは、このファイルがクライアントサイドで実行されることを示します。
// useStateやuseEffect、イベントハンドラなどのフックを使用する場合に必要です。
'use client';

// Reactのコア機能であるuseStateとuseEffectをインポートします。
import React, { useState, useEffect } from 'react';
// Next.jsのルーター機能を使用するためにuseRouterをインポートします。
// これにより、プログラムでページ遷移を制御できます。
import { useRouter } from 'next/navigation';

// このページを構成する各コンポーネントをインポートします。
import ProblemStatement from './components/ProblemStatement';         // 左側の問題文と解答群を表示するコンポーネント
import TraceScreen from './components/TraceScreen';                   // 中央上部のトレース画面（疑似言語コードと実行行の矢印）を表示するコンポーネント
import VariableTraceControl from './components/VariableTraceControl'; // 中央下部の変数表示とトレース操作ボタンを含むコンポーネント
import KohakuChat from './components/KohakuChat';                     // 右側のコハクとのチャットインターフェースコンポーネント

// --- アプリケーションの静的データとテキストリソースの定義 ---

// 疑似言語のプログラムコードを定義します。
// 各言語（日本語 'ja' と英語 'en'）に対応した配列で保持します。
const programLines = {
  ja: [
    '1 整数型: x ← 1',
    '2 整数型: y ← 2',
    '3 整数型: z ← 3',
    '4 x ← y',
    '5 y ← z',
    '6 z ← x',
    '7 yとzの値をこの順にコンマ区切りで出力する',
  ],
  en: [
    '1 Integer: x ← 1',
    '2 Integer: y ← 2',
    '3 Integer: z ← 3',
    '4 x ← y',
    '5 y ← z',
    '6 z ← x',
    '7 Output the values of y and z separated by a comma in this order',
  ],
};

// 問題の解答群を定義します。
// 各解答には表示ラベル（例: 'ア', 'A'）と、実際に比較に使用する値（例: '1,2'）があります。
// 日本語と英語の両方に対応します。
const answerOptions = {
  ja: [
    { label: 'ア', value: '1,2' },
    { label: 'イ', value: '1,3' },
    { label: 'ウ', value: '2,1' },
    { label: 'エ', value: '2,3' },
    { label: 'オ', value: '3,1' },
    { label: 'カ', value: '3,2' }, // この値が正解
  ],
  en: [
    { label: 'A', value: '1,2' },
    { label: 'B', value: '1,3' },
    { label: 'C', value: '2,1' },
    { label: 'D', value: '2,3' },
    { label: 'E', value: '3,1' },
    { label: 'F', value: '3,2' }, // This is the correct answer
  ],
};

// 問題の正しい解答の値を定数として定義します。
// これは言語によらず一意の識別子として機能します。
const CORRECT_ANSWER_VALUE = '3,2';

// 問題の解説テキストを定義します。
// 日本語と英語の両方に対応した文字列で保持します。
const explanationText = {
  ja: `
xは1、yは2、zは3で初期化されています。

x ← y
xに、yの値(2)を代入します。この時点で、x=2、y=2、z=3 です。

y ← z
yに、zの値(3)を代入します。この時点で、x=2、y=3、z=3 です。

z ← x
zに、xの値(2)を代入します。この時点で、x=2、y=3、z=2 です。

したがって、yの値(3)とzの値(2)をコンマ(,)で区切った「3,2」が適切です。
`,
  en: `
x is initialized to 1, y to 2, and z to 3.

x ← y
Assigns the value of y (2) to x. At this point, x=2, y=2, z=3.

y ← z
Assigns the value of z (3) to y. At this point, x=2, y=3, z=3.

z ← x
Assigns the value of x (2) to z. At this point, x=2, y=3, z=2.

Therefore, "3,2" (y value (3) and z value (2) separated by a comma) is appropriate.
`,
};

// 各UI要素の表示テキストを言語ごとに定義します。
// これにより、各コンポーネント内でテキストの切り替えロジックを簡素化できます。
const textResources = {
  ja: {
    problemStatement: {
      title: "サンプル問題 [科目B] 問1",
      questionSentence1: "次の記述中の",
      questionSentence2: "に入れる正しい答えを、解答群の中から選べ。",
      questionSentence3: "プログラムを実行すると、",
      questionSentence4: "と出力される。",
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
      hintVariableQuestion: (x: number | null, y: number | null, z: number | null) => `現在の変数の値は、x=${x}, y=${y}, z=${z} のようですね。この値で合っていますか？`,
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
      toggleTraceButton: "トレース表示",     // 新しく追加したトグルボタンのテキスト
      toggleKohakuButton: "コハクチャット表示", // 新しく追加したトグルボタンのテキスト
    },
  },
  en: {
    problemStatement: {
      title: "Sample Problem [Subject B] Q1",
      questionSentence1: "Select the correct answer to fill in the blank in the following statement from the answer choices.",
      questionSentence2: "", // Blank is part of the sentence above
      questionSentence3: "Executing the program outputs ",
      questionSentence4: ".",
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
      hintVariableQuestion: (x: number | null, y: number | null, z: number | null) => `The current variable values are x=${x}, y=${y}, z=${z}. Is this correct?`,
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
      toggleTraceButton: "Show Trace",     // 新しく追加したトグルボタンのテキスト
      toggleKohakuButton: "Show Kohaku Chat", // 新しく追加したトグルボタンのテキスト
    },
  },
};

// 言語の型を定義します。'ja'または'en'のいずれかを取ります。
type Language = 'ja' | 'en';
// テキストリソースの型を定義します。日本語の`problemStatement`オブジェクトの構造を型として利用します。
type TextResources = typeof textResources['ja']['problemStatement'];

/**
 * 選択された解答が正しいかどうかを判定するヘルパー関数。
 * @param selected ユーザーが選択した解答の文字列（またはnull）
 * @param correct 正しい解答の文字列
 * @returns 正解であればtrue、そうでなければfalse
 */
const isCorrectAnswer = (selected: string | null, correct: string): boolean => {
  if (selected === null) {
    return false; // 解答が選択されていない場合は不正解
  }
  // 前後の空白を除去して厳密に比較することで、より堅牢な判定を保証します。
  return selected.trim() === correct.trim();
};


// BasicInfoBProblemPage コンポーネントの定義
const BasicInfoBProblemPage: React.FC = () => {
  // Next.jsのルーターフックを初期化します。ページ遷移に使用します。
  const router = useRouter();

  // --- ページの状態管理 ---
  // currentTraceLine: 現在トレースしている疑似言語の行番号（0-indexed）
  const [currentTraceLine, setCurrentTraceLine] = useState(0);
  // variables: 疑似言語の実行に伴う変数の値を保持します（x, y, z）
  const [variables, setVariables] = useState<{ x: number | null; y: number | null; z: number | null }>({
    x: null,
    y: null,
    z: null,
  });
  // chatMessages: コハクとのチャット履歴を保持します。
  // 初期メッセージは現在の言語に応じたものが設定されます。
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'kohaku'; text: string }[]>([
    { sender: 'kohaku', text: textResources.ja.problemStatement.hintInit },
  ]);

  // selectedAnswer: ユーザーが選択した解答の値を保持します（解答前はnull）
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  // isAnswered: ユーザーが解答を提出済みかどうかを示すフラグ
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  // language: 現在選択されている表示言語（'ja' または 'en'）
  const [language, setLanguage] = useState<Language>('ja');

  // showTraceSection: トレースセクション（トレース画面と変数コントロール）の表示/非表示を制御するフラグ
  const [showTraceSection, setShowTraceSection] = useState(true); // デフォルトで表示
  // showKohakuChat: コハクチャットセクションの表示/非表示を制御するフラグ
  const [showKohakuChat, setShowKohakuChat] = useState(true);   // デフォルトで表示

  // 現在選択されている言語に基づいたテキストリソースを取得します。
  // これにより、コンポーネント内で `t.propertyName` のように簡潔にテキストを参照できます。
  const t: TextResources = textResources[language].problemStatement;


  /**
   * コハクからの応答メッセージを生成するロジック。
   * 解答の正誤判定フィードバック、またはユーザーの質問に応じたヒントを生成します。
   * @param currentLine 現在トレース中の行番号
   * @param currentVariables 現在の変数の値
   * @param isAnsweredStatus この関数が解答後のフィードバックとして呼ばれたか
   * @param answerToCheckValue 解答後のフィードバックの場合、ユーザーが選択した解答値
   * @param userQuestion ユーザーがチャットで入力した質問（あれば）
   * @returns コハクからの応答メッセージの文字列
   */
  const generateKohakuResponse = (
    currentLine: number,
    currentVariables: typeof variables,
    isAnsweredStatus: boolean = false, // デフォルト値を設定
    answerToCheckValue?: string | null,
    userQuestion?: string
  ): string => {
    // 1. 解答選択時のフィードバックロジック
    if (isAnsweredStatus) {
      if (isCorrectAnswer(answerToCheckValue || selectedAnswer, CORRECT_ANSWER_VALUE)) {
        return t.hintCorrect; // 正解時のメッセージ
      } else {
        return t.hintIncorrect(CORRECT_ANSWER_VALUE); // 不正解時のメッセージ（正しい答えを含む）
      }
    }

    // 2. ユーザーの質問に対する応答ロジック
    if (userQuestion) {
      // ユーザーの質問内容に応じて、動的に応答を生成します。
      // 言語に応じてキーワードを判定します。
      if (userQuestion.includes(language === 'ja' ? "変数" : "variable")) {
        return t.hintVariableQuestion(currentVariables.x, currentVariables.y, currentVariables.z);
      } else if (userQuestion.includes(language === 'ja' ? "トレース" : "trace")) {
        return t.hintTraceProgress(currentLine + 1);
      } else if (userQuestion.includes(language === 'ja' ? "答え" : "answer")) {
        return t.hintNoAnswer; // 答えを直接教えないメッセージ
      } else if (userQuestion.includes(language === 'ja' ? "ヒント" : "hint")) {
        // 「ヒント」という質問があった場合、トレースの進行状況に応じたヒントを返します。
        if (currentLine === 0) {
          return t.hintTraceInit;
        } else if (currentLine === 1) {
          return t.hintTraceLine1;
        } else if (currentLine === 4) {
          return t.hintTraceLine4;
        } else if (currentLine === 5) {
          return t.hintTraceLine5;
        } else if (currentLine === 6) {
          return t.hintTraceLine6;
        } else if (currentLine === programLines[language].length) {
          // トレースが完了している場合のメッセージ
          return t.hintTraceCompleted(currentVariables.y, currentVariables.z);
        }
        return t.hintContinueTrace; // 一般的なトレース継続のヒント
      }
      return t.hintGenericQuestion; // 認識できない質問に対する一般的な返答
    }

    // 上記のどの条件にも当てはまらない場合のフォールバックメッセージ
    return t.hintGenericQuestion;
  };

  /**
   * 「次のトレース」ボタンがクリックされた時のハンドラ。
   * 疑似言語の実行を1行進め、変数の値を更新します。
   */
  const handleNextTrace = () => {
    // トレースがプログラムの全行数をまだ超えていない場合のみ実行
    if (currentTraceLine < programLines[language].length) {
      const nextLineToExecute = currentTraceLine + 1; // 実行される次の行の番号（1始まり）
      let updatedVariables = { ...variables }; // 現在の変数をコピーして、変更を反映する

      // 各行の疑似言語に応じた変数の更新ロジック
      // 実際のトレースロジックは、より複雑なパーサーや実行エンジンが必要になる場合があります。
      switch (nextLineToExecute) {
        case 1: updatedVariables.x = 1; break;
        case 2: updatedVariables.y = 2; break;
        case 3: updatedVariables.z = 3; break;
        case 4: updatedVariables.x = updatedVariables.y; break; // xにyの現在の値を代入
        case 5: updatedVariables.y = updatedVariables.z; break; // yにzの現在の値を代入
        case 6: updatedVariables.z = updatedVariables.x; break; // zにxの現在の値を代入
        case 7: /* 最終的な出力に関する処理があればここに記述 */ break;
        default: break; // その他の行
      }
      // 更新された変数の状態をセット
      setVariables(updatedVariables);
      // トレース行を1つ進める
      setCurrentTraceLine((prevLine) => prevLine + 1);

      // 解答済みの場合は、自動ヒントを生成しないように制御。
      // ユーザーからの明示的な質問があった場合のみチャットが更新されるようにします。
    }
  };

  /**
   * ユーザーがチャットメッセージを送信した時のハンドラ。
   * ユーザーのメッセージをチャット履歴に追加し、コハクからの返信を生成します。
   * @param message ユーザーが送信したメッセージ文字列
   */
  const handleUserMessage = (message: string) => {
    // ユーザーのメッセージをチャット履歴に追加
    setChatMessages((prevMessages) => [...prevMessages, { sender: 'user', text: message }]);
    // 1秒後にコハクからの返信をシミュレート
    setTimeout(() => {
      // ユーザーの質問に応じてコハクの応答を生成
      const kohakuResponse = generateKohakuResponse(currentTraceLine, variables, false, null, message);
      // コハクの返信をチャット履歴に追加
      setChatMessages((prevMessages) => [...prevMessages, { sender: 'kohaku', text: kohakuResponse }]);
    }, 1000);
  };

  /**
   * 「もう一度トレース」ボタンがクリックされた時のハンドラ。
   * トレースの状態（現在の行、変数の値）を初期状態にリセットします。
   * ユーザーが選択した解答と回答済みフラグは保持します。
   */
  const handleResetTrace = () => {
    setCurrentTraceLine(0); // トレースの行を0にリセット
    setVariables({ x: null, y: null, z: null }); // 変数を初期値にリセット
    // チャットメッセージをトレースリセットに関するメッセージで初期化
    setChatMessages([
      { sender: 'kohaku', text: t.resetTraceKohaku1 },
      { sender: 'kohaku', text: t.resetTraceKohaku2 },
    ]);
    // selectedAnswer と isAnswered はここではリセットせず、ユーザーの解答状況を保持します。
  };

  /**
   * 解答群の選択肢がクリックされた時のハンドラ。
   * ユーザーの解答を記録し、回答済みフラグを立てます。
   * @param selectedValue ユーザーが選択した解答のvalue文字列
   */
  const handleSelectAnswer = (selectedValue: string) => {
    if (isAnswered) return; // すでに回答済みの場合は、再度解答を受け付けない

    setSelectedAnswer(selectedValue); // 選択された解答を状態にセット
    setIsAnswered(true); // 回答済みフラグを立てる

    // 解答後のコハクからのメッセージ（正誤判定に基づくフィードバック）を生成し、チャットに追加
    const hint = generateKohakuResponse(currentTraceLine, variables, true, selectedValue);
    setChatMessages((prevMessages) => [...prevMessages, { sender: 'kohaku', text: hint }]);
  };

  /**
   * 言語切り替えボタンがクリックされた時のハンドラ。
   * 表示言語を日本語と英語の間で切り替えます。
   */
  const toggleLanguage = () => {
    // 現在の言語に応じて、次の言語を設定
    setLanguage((prevLang) => (prevLang === 'ja' ? 'en' : 'ja'));
    // 言語切り替え時にコハクの初期メッセージも新しい言語に合わせて更新
    setChatMessages([
      { sender: 'kohaku', text: textResources[language === 'ja' ? 'en' : 'ja'].problemStatement.hintInit },
    ]);
  };

  /**
   * 「次の問題へ」ボタンがクリックされた時のハンドラ。
   * 次の問題ページへ遷移します。
   * 実際には、問題IDなどを渡して動的にルーティングすることが多いです。
   */
  const handleNextProblem = () => {
    // 例としてダミーのパスに遷移。実際のアプリケーションでは次の問題のパスを指定します。
    router.push('/create_questions/qualification_creation/next_problem_page');
  };

  /**
   * トレースセクションの表示/非表示を切り替えるハンドラ。
   */
  const toggleTraceSection = () => {
    // 一旦コメントアウト、PBI2で外す
    //setShowTraceSection((prev) => !prev);
  };

  /**
   * コハクチャットセクションの表示/非表示を切り替えるハンドラ。
   */
  const toggleKohakuChat = () => {
    // 一旦コメントアウト、PBI2で外す
    // setShowKohakuChat((prev) => !prev);
  };


  // コンポーネントのレンダリング
  return (
    // 画面全体のコンテナ。中央寄せ、背景色設定
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      {/* 言語切り替えボタンとトレース/コハク表示トグルボタン群をまとめて右上に配置 */}
      {/* <div className="absolute top-4 right-4 z-10 flex gap-2"> */}
        {/* トレースセクション表示/非表示トグルボタン */}
        {/* <button
          onClick={toggleTraceSection}
          className={`px-3 py-1 rounded-full shadow-lg font-bold text-sm
                      ${showTraceSection ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
        > */}
          {/* {t.toggleTraceButton} 言語に応じたテキスト */}
        {/* </button> */}
        {/* コハクチャットセクション表示/非表示トグルボタン */}
        {/* <button */}
          {/* onClick={toggleKohakuChat} */}
          {/* className={`px-3 py-1 rounded-full shadow-lg font-bold text-sm */}
                      {/* ${showKohakuChat ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`} */}
        {/* > */}
          {/* {t.toggleKohakuButton} 言語に応じたテキスト */}
        {/* </button> */}
        {/* 言語切り替えボタン */}
        {/* <button */}
          {/* onClick={toggleLanguage} */}
          {/* // 言語切り替えボタンは、他のトグルボタンと区別するために色を変えています。 */}
          {/* className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full shadow-lg" */}
        {/* > */}
          {/* {language === 'ja' ? 'English' : '日本語'} 現在の言語に応じてボタンのテキストを切り替え */}
        {/* </button> */}
      {/* </div> */}
      {/* メインコンテンツエリア。左右のカラム（問題、トレース/変数、コハクチャット）を含む */}
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        {/* 左側: 問題表示エリア。ProblemStatement コンポーネント */}
        <div className="flex-1 bg-white p-8 rounded-lg shadow-md min-h-[800px] flex flex-col">
          <ProblemStatement
            // 各プロップに現在の言語に応じたデータを渡します。
            programText={programLines[language].join('\n')}
            answerOptions={answerOptions[language]}
            onSelectAnswer={handleSelectAnswer}
            selectedAnswer={selectedAnswer}
            correctAnswer={CORRECT_ANSWER_VALUE}
            isAnswered={isAnswered}
            explanation={explanationText[language]}
            language={language}
            textResources={t} // 各コンポーネントでテキストリソースを参照できるように渡す
          />
        </div>

        {/* 中央: トレース画面と変数表示、次へボタン (showTraceSectionがtrueの場合のみ表示) */}
        {showTraceSection && (
          <div className="flex-1 flex flex-col gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md flex-grow overflow-hidden">
              <TraceScreen
                programLines={programLines[language]}
                currentLine={currentTraceLine}
                language={language}
                textResources={t}
              />
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <VariableTraceControl
                variables={variables}
                onNextTrace={handleNextTrace}
                isTraceFinished={currentTraceLine >= programLines[language].length}
                onResetTrace={handleResetTrace}
                currentTraceLine={currentTraceLine}
                language={language}
                textResources={t}
              />
            </div>
          </div>
        )}

        {/* 右側: コハクとの質疑応答エリア (showKohakuChatがtrueの場合のみ表示) */}
        {showKohakuChat && (
          <div className="w-full lg:w-96 flex flex-col">
            <KohakuChat
              messages={chatMessages}
              onSendMessage={handleUserMessage}
              language={language}
              textResources={t}
            />
          </div>
        )}
      </div>

      {/* 「次の問題へ」ボタン (isAnsweredがtrueの場合のみ表示) */}
      {isAnswered && (
        <div className="w-full max-w-lg mt-8 flex justify-center">
          <button
            onClick={handleNextProblem}
            className="w-full py-4 px-8 text-xl font-semibold text-white bg-green-500 rounded-lg shadow-lg
                       hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-opacity-75
                       transition-colors duration-200"
          >
            {t.nextProblemButton} {/* 言語に応じたテキスト */}
          </button>
        </div>
      )}
    </div>
  );
};

export default BasicInfoBProblemPage;