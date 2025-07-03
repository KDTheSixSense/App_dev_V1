// src/lib/actions.ts
'use server';

import { prisma } from './prisma';

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

/**
 * 次の問題IDをデータベースから取得するサーバーアクション
 * @param currentId 現在の問題ID (文字列)
 * @param category  問題のカテゴリ (現在は未使用ですが、将来の拡張のために残します)
 * @returns 次の問題ID (文字列)、または存在しない場合はnull
 */
export async function getNextProblemId(currentId: string, category: string): Promise<string | null> {
    // category引数は現在使用していませんが、将来的な機能拡張のためにログ出力などを残しておくと良いでしょう
    console.log(`Finding next problem ID for category: ${category} after current ID: ${currentId}`);

    const currentIdNum = parseInt(currentId, 10);

    if (isNaN(currentIdNum)) {
        console.error("Invalid currentId provided:", currentId);
        return null;
    }

    try {
        // Prismaを使って、現在のID(currentIdNum)より大きいIDを持つ
        // 最初の問題をデータベースから検索します。
        const nextProblem = await prisma.questions.findFirst({
            where: {
                id: {
                    gt: currentIdNum, // gt は "greater than" の略
                },
                // もし将来的にカテゴリで問題を絞り込む場合は、以下のように条件を追加します
                // logicType: { contains: category } // 例
            },
            orderBy: {
                id: 'asc', // IDの昇順で並べ替え
            },
            select: {
                id: true, // idフィールドだけ取得すれば十分です
            },
        });

        if (nextProblem) {
            // 見つかった問題のID（数値）を文字列に変換して返します
            return nextProblem.id.toString();
        } else {
            // 次の問題が見つからなかった場合
            return null;
        }
    } catch (error) {
        console.error("Failed to get next problem ID from database:", error);
        return null; // エラーが発生した場合もnullを返す
    }
}