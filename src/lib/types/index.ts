// src/lib/types/index.ts

/**
 * @interface AnswerOption
 * @description 解答群の一つ一つの選択肢が持つデータ構造を定義します。
 */
export interface AnswerOption {
  label: string; // 画面に表示される選択肢の記号 (例: 'ア', 'イ')
  value: string; // 正誤判定に使われる内部的な値 (例: '1,2', 'ウ')
}

/**
 * @type VariablesState
 * @description プログラムのトレース中に変化する、すべての変数の状態を保持するオブジェクトの型です。
 * `Record<string, ...>` を使うことで、どんな名前の変数（'x', 'num', 'out'など）でも柔軟に扱えます。
 */
export type VariablesState = Record<string, number | null | string | number[]>;

/**
 * @type TraceStep
 * @description トレースの1ステップ（1行）で実行される処理を定義する「関数」の型です。
 * この関数は、現在の変数の状態 `vars` を受け取り、その行の処理を適用した「新しい変数の状態」を返します。
 */
export type TraceStep = (vars: VariablesState) => VariablesState;

/**
 * @interface Problem
 * @description 1つの問題を構成するために必要な、すべてのデータの構造を定義します。
 * 新しい問題を追加する際は、必ずこの `Problem` 型に従ってデータを作成します。
 */
export interface Problem {
  id: string; // 問題をURLなどで一意に識別するためのID (例: "1", "2")
  title: { ja: string; en: string }; // 問題のタイトル (日本語/英語)
  description: { ja: string; en: string }; // 問題文
  programLines: { ja: string[]; en: string[] }; // 擬似言語プログラムの各行
  answerOptions: { ja: AnswerOption[]; en: AnswerOption[] }; // 解答群の選択肢
  correctAnswer: string; // この問題の正解の値
  explanationText: { ja: string; en: string }; // 解答後に表示される解説文
  initialVariables: VariablesState; // トレース開始時の変数の初期状態
  traceLogic: TraceStep[]; // プログラムの各行に対応するトレース処理の配列
  logicType: string;

  // --- 以下は特定の種類の問題でのみ使用するオプションのプロパティです ---

  /**
   * @property {object} [traceOptions] - トレースの特別な設定（FizzBuzz問題などで使用）
   * @property {number[]} presets - ユーザーが選択できるトレース開始時のプリセット値 (例: [3, 5, 15, 7])
   */
  traceOptions?: {
    presets?: number[];
  };

  /**
   * @property {function} [calculateNextLine] - 次に実行すべき行を計算する特別なロジック（条件分岐やループ問題で使用）
   * @param currentLine 現在の行番号
   * @param vars 更新後の変数の状態
   * @returns {number} 次にジャンプすべき行番号
   */
  calculateNextLine?: (currentLine: number, vars: VariablesState) => number;
}