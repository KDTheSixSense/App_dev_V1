// /workspaces/my-next-app/src/lib/types.ts

/**
 * サンプルケースの型定義
 */
export interface SampleCase {
  id: number;
  problemId: number;
  input: string;
  expectedOutput: string;
  description: string;
  order: number;
}

/**
 * フロントエンド全体で利用する、シリアライズ可能な問題オブジェクトの型定義
 */
export interface Problem {
  id: string;
  logicType: string;
  title: { ja: string; en: string };
  description: { ja: string; en: string };
  // programLinesとexplanationTextはオプショナル（?）であることを明記
  programLines?: { ja: string[]; en: string[] };
  answerOptions?: { ja: { label: string; value: string }[]; en: { label: string; value: string }[] };
  correctAnswer: string;
  explanationText?: { ja: string; en: string };
  initialVariables?: { [key: string]: number | string };
  traceLogic?: any[];
  traceOptions?: { presets?: number[] };
  // sampleCasesプロパティを追加し、オプショナル（?）に設定
  sampleCases?: SampleCase[];
}

export type VariablesState = { [key: string]: number | string | number[] | null };

export type TraceStep = (vars: VariablesState) => VariablesState;
