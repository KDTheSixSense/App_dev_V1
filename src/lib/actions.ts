// src/lib/actions.ts
'use server';

import { basicInfoAProblems } from './issue_list/basic_info_a_problem/problem';
import { appliedInfoMorningProblems } from './issue_list/applied_info_morning_problem/problem';
import { appliedInfoAfternoonProblems } from './issue_list/applied_info_afternoon_problem/problem';
import { basicInfoBProblems } from './issue_list/basic_info_b_problem/problem';
import { CplusProblems } from './issue_list/Cplus_problem/problem';
import { CsyaProblems } from './issue_list/Csya_problem/problem'; // ★ここを修正しました★
import { JavaProblems } from './issue_list/java_problem/problem';
import { JavaScriptProblems } from './issue_list/JavaScript_problem/problem';
import { PythonProblems } from './issue_list/python_problem/problem';

// Problem 型をインポートする
import type { Problem } from '@/lib/types';


const allProblemsMap = {
  'basic_info_a_problem': basicInfoAProblems, // 科目Aを追加
  'applied_info_morning_problem': appliedInfoMorningProblems, // 応用午前
  'applied_info_afternoon_problem': appliedInfoAfternoonProblems,//応用午後
  'basic_info_b_problem': basicInfoBProblems, // 科目Bを追加
  'Cplus_problem': CplusProblems,//cコーディング
  'Csya_problem': CsyaProblems,//c#コーディング
  'java_problem': JavaProblems,//javaコーディング
  'JavaScript_problem': JavaScriptProblems,//JSコーディング
  'python_problem': PythonProblems,//pythonコーディング
};

export async function getNextProblemId(currentId: string, categoryType: string): Promise<string | null> {
  const problems = allProblemsMap[categoryType as keyof typeof allProblemsMap];

  if (!problems) {
    console.warn(`カテゴリタイプ '${categoryType}' は問題マップに見つかりません。`);
    return null;
  }

  // ここで 'p' に Problem 型を明示的に指定
  const currentIndex = problems.findIndex((p: Problem) => p.id === currentId);

  if (currentIndex !== -1 && currentIndex < problems.length - 1) {
    return problems[currentIndex + 1].id;
  }
  return null;
}