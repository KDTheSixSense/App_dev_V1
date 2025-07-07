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

import { calculateLevelFromXp } from './leveling';

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
        const nextProblem = await prisma.questions_Algorithm.findFirst({
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

/**
 * ユーザーに経験値を加算し、レベルアップ処理を行う関数（最終版）
 * @param user_id - 対象のユーザーID
 * @param subject_id - 対象の科目ID
 * @param difficulty_id - 難易度の名前 (例: "Easy", "上級")
 */
export async function addXp(user_id: number, subject_id: number, difficulty_id: number) {

  // 1. 難易度名から獲得XP量を取得
  const difficulty = await prisma.difficulty.findUnique({
    where: { id: difficulty_id },
  });

  if (!difficulty) {
    throw new Error(`'${difficulty_id}' が見つかりません。`);
  }
  const xpAmount = difficulty.xp;
  console.log(`${difficulty_id}: ${xpAmount}xp`);
  
  // 2. トランザクションでXPを加算・レベルアップ処理
  const result = await prisma.$transaction(async (tx) => {
    
    // === 2a. 科目レベルの更新処理 ===
    const updatedProgress = await tx.userSubjectProgress.upsert({
      where: { user_id_subject_id: { user_id, subject_id } },
      create: { user_id, subject_id, xp: xpAmount, level: 1 },
      update: { xp: { increment: xpAmount } },
    });
    const newSubjectLevel = calculateLevelFromXp(updatedProgress.xp);
    if (newSubjectLevel > updatedProgress.level) {
      await tx.userSubjectProgress.update({
        where: { user_id_subject_id: { user_id, subject_id } },
        data: { level: newSubjectLevel },
      });
      console.log(`[科目レベルアップ!] subjectId:${subject_id} がレベル ${newSubjectLevel} に！`);
    }

    // === 2b. アカウントレベルの更新処理 ===
    let user = await tx.user.update({
      where: { id: user_id },
      data: { xp: { increment: xpAmount } },
    });
    const newAccountLevel = calculateLevelFromXp(user.xp);
    if (newAccountLevel > user.level) {
      // レベルアップ後の最新情報で user 変数を上書きする
      user = await tx.user.update({
        where: { id: user_id },
        data: { level: newAccountLevel },
      });
      console.log(`[アカウントレベルアップ!] ${user.username} がアカウントレベル ${newAccountLevel} に！`);
    }

    return { updatedUser: user, updatedProgress };
  });

  console.log('XP加算処理が完了しました。');
  return result;
}


//ログイン日数計算
const RESET_HOUR = 6; // 日付のリセット時刻を朝6時に設定
/**
 * 指定された日時から6時間引いて、「アプリ内での日付」を返すヘルパー関数
 * @param date - 判定したい日時オブジェクト
 * @returns 6時間引いた後の日時オブジェクト
 */
function getAppDate(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() - RESET_HOUR);
  return newDate;
}
export async function updateUserLoginStats(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date(); // 実際の現在時刻
  const lastLoginDate = user.lastlogin; // DBに保存されている実際の最終ログイン時刻

// 「アプリ内での今日」の日付文字列を取得
  const todayAppDateString = getAppDate(now).toDateString();

  // 最後にログインした「アプリ内での日付」の文字列を取得
  const lastLoginAppDateString = lastLoginDate ? getAppDate(lastLoginDate).toDateString() : null;

  // アプリ内での日付が同じなら、すでにログイン済み
  // if (lastLoginAppDateString && lastLoginAppDateString === todayAppDateString) {
  //   console.log('本日（アプリ内日付）は既にログイン済みです。');
  //   return;
  // }

  // --- 日数計算 ---
  
  // 「アプリ内での昨日」の日付文字列を取得
  const yesterdayAppDate = getAppDate(now);
  yesterdayAppDate.setDate(yesterdayAppDate.getDate() - 1);
  const yesterdayAppDateString = yesterdayAppDate.toDateString();

  let newConsecutiveDays = user.continuouslogin ?? 0;
  let newTotalDays = user.totallogin ?? 0;

  // if (lastLoginAppDateString && lastLoginAppDateString === yesterdayAppDateString) {
    // ケースA: 最後のログインが「アプリ内での昨日」 -> 連続ログイン
    newConsecutiveDays += 1;
  // } else {
    // ケースB: 連続ログインが途切れた -> リセット
    // newConsecutiveDays = 1;
  // }
  
  newTotalDays += 1;

  // データベースを更新
  await prisma.user.update({
    where: { id: userId },
    data: {
      totallogin: newTotalDays,
      continuouslogin: newConsecutiveDays,
      // DBに保存するのは、実際のログイン時刻
      lastlogin: now,
    },
  });
}