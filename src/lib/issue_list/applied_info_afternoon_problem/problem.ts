// src/lib/issue_list/applied_info_afternoon_problem/problem.ts
import type { Problem } from '@/lib/types'; // '@/lib/types'のパスとProblem型が正しいことを確認

export const appliedInfoAfternoonProblems: Problem[] = [
  {
    id: 'APM1',
    logicType: 'TYPE_A', // 午後問題もトレースなしを想定
    title: { ja: "応用情報 午後 問題1: ソフトウェア開発", en: "Applied Info Afternoon Problem 1: Software Development" },
    description: {
      ja: "これは応用情報技術者試験の午後問題（記述式）のサンプルです。システム開発プロセスに関する問題。",
      en: "This is a sample Applied Information Technology Engineer Examination afternoon problem (essay type). It's about system development processes."
    },
    programLines: { ja: [], en: [] }, // 午後問題はプログラムがない場合が多い
    answerOptions: {
      ja: [
        { label: 'ア', value: 'ウォーターフォールモデル' },
        { label: 'イ', value: 'アジャイル開発' },
        { label: 'ウ', value: 'スパイラルモデル' },
        { label: 'エ', value: 'プロトタイピング' }
      ],
      en: [
        { label: 'A', value: 'Waterfall Model' },
        { label: 'B', value: 'Agile Development' },
        { label: 'C', value: 'Spiral Model' },
        { label: 'D', value: 'Prototyping' }
      ]
    },
    correctAnswer: 'アジャイル開発', // 例
    explanationText: {
      ja: "アジャイル開発は、短い期間で開発とテストを繰り返しながら、柔軟にソフトウェアを開発する手法です。",
      en: "Agile development is a flexible software development method that iterates development and testing in short cycles."
    },
    initialVariables: {}, // トレース不要な問題では変数も不要
    traceLogic: []       // トレース不要
  },
  {
    id: 'APM2',
    logicType: 'TYPE_A',
    title: { ja: "応用情報 午後 問題2: 情報セキュリティ", en: "Applied Info Afternoon Problem 2: Information Security" },
    description: {
      ja: "情報セキュリティのリスクマネジメントに関する問題です。",
      en: "This problem is about information security risk management."
    },
    programLines: { ja: [], en: [] },
    answerOptions: {
      ja: [
        { label: 'ア', value: 'ISMS' },
        { label: 'イ', value: 'CSIRT' },
        { label: 'ウ', value: 'IDS' },
        { label: 'エ', value: 'VPN' }
      ],
      en: [
        { label: 'A', value: 'ISMS' },
        { label: 'B', value: 'CSIRT' },
        { label: 'C', value: 'IDS' },
        { label: 'D', value: 'VPN' }
      ]
    },
    correctAnswer: 'ISMS',
    explanationText: {
      ja: "ISMS (情報セキュリティマネジメントシステム) は、組織が情報セキュリティを体系的に管理するための枠組みです。",
      en: "ISMS (Information Security Management System) is a framework for organizations to systematically manage information security."
    },
    initialVariables: {},
    traceLogic: []
  },
  // 必要に応じて応用情報午後問題を追加
];

export const getAppliedInfoAfternoonProblemById = (id: string): Problem | undefined => {
  return appliedInfoAfternoonProblems.find(p => p.id === id);
};
