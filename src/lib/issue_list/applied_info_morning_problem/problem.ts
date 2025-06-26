// src/lib/issue_list/applied_info_morning_problem/problem.ts
import type { Problem } from '@/lib/types'; // '@/lib/types'のパスとProblem型が正しいことを確認

export const appliedInfoMorningProblems: Problem[] = [
  {
    id: 'AM1',
    logicType: 'TYPE_A', // 午前の問題はトレースなしを想定
    title: { ja: "応用情報 午前 問題1: ネットワーク", en: "Applied Info Morning Problem 1: Network" },
    description: { ja: "これは応用情報技術者試験の午前問題です。", en: "This is an Applied Information Technology Engineer Examination morning problem." },
    programLines: { ja: [], en: [] }, // 午前の問題はプログラムがない場合が多い
    answerOptions: {
      ja: [
        { label: 'ア', value: 'IPv4' },
        { label: 'イ', value: 'TCP/IP' },
        { label: 'ウ', value: 'OSI参照モデル' },
        { label: 'エ', value: 'UDP' }
      ],
      en: [
        { label: 'A', value: 'IPv4' },
        { label: 'B', value: 'TCP/IP' },
        { label: 'C', value: 'OSI Reference Model' },
        { label: 'D', value: 'UDP' }
      ]
    },
    correctAnswer: 'TCP/IP',
    explanationText: {
      ja: "TCP/IPはインターネットの通信で広く利用されるプロトコルです。",
      en: "TCP/IP is a widely used protocol for internet communication."
    },
    initialVariables: {}, // トレース不要な問題では変数も不要
    traceLogic: []       // トレース不要
  },
  {
    id: 'AM2',
    logicType: 'TYPE_A',
    title: { ja: "応用情報 午前 問題2: データベース", en: "Applied Info Morning Problem 2: Database" },
    description: { ja: "データベースの正規化に関する問題です。", en: "This problem is about database normalization." },
    programLines: { ja: [], en: [] },
    answerOptions: {
      ja: [
        { label: 'ア', value: '第一正規形' },
        { label: 'イ', value: '第二正規形' },
        { label: 'ウ', value: '第三正規形' },
        { label: 'エ', value: '第四正規形' }
      ],
      en: [
        { label: 'A', value: 'First Normal Form' },
        { label: 'B', value: 'Second Normal Form' },
        { label: 'C', value: 'Third Normal Form' },
        { label: 'D', value: 'Fourth Normal Form' }
      ]
    },
    correctAnswer: '第三正規形',
    explanationText: {
      ja: "部分関数従属と推移的関数従属をなくすのが第三正規形です。",
      en: "Third Normal Form eliminates partial and transitive functional dependencies."
    },
    initialVariables: {},
    traceLogic: []
  },
  // 必要に応じて問題を追加
];

export const getAppliedInfoMorningProblemById = (id: string): Problem | undefined => {
  return appliedInfoMorningProblems.find(p => p.id === id);
};