// /workspaces/my-next-app/src/lib/actions.ts
'use server'; // このファイルがサーバーアクションであることを示す

import { prisma } from './prisma';
import { calculateLevelFromXp } from './leveling';
import { getSession } from './session';
import { revalidatePath } from 'next/cache';

/**
 * 次の問題のIDを取得するサーバーアクション
 */
export async function getNextProblemId(currentId: number, category: string): Promise<number | null> {
  try {
    // ▼▼▼【ここから修正】▼▼▼
    // 変数を一つに統一し、型を明示的に指定することで、以降の型エラーをすべて解消します
    let problemIds: { id: number }[] = [];

    if (category === 'basic_info_b_problem') {
      const [staticIds, algoIds] = await Promise.all([
        // Questionsテーブルから全IDを取得
        prisma.questions.findMany({
          select: { id: true },
        }),
        // Questions_Algorithmテーブルから「基本情報B問題」のIDを取得
        prisma.questions_Algorithm.findMany({
          where: { subject: { name: '基本情報B問題' } },
          select: { id: true },
        }),
      ]);
      // 取得したIDを結合
      problemIds = [...staticIds, ...algoIds];
    } else {
      // その他のカテゴリの場合も、同じ変数に代入します
      problemIds = await prisma.questions_Algorithm.findMany({
        where: { subject: { name: category } },
        select: { id: true },
      });
    }
    // ▲▲▲【ここまで修正】▲▲▲

    // `problemIds` が正しく型付けされているため、以降の処理で型エラーは発生しません
    const allIds = problemIds.map(p => p.id);
    const sortedUniqueIds = [...new Set(allIds)].sort((a, b) => a - b);

    // 現在のIDのインデックスを探す
    const currentIndex = sortedUniqueIds.indexOf(currentId);
    
    // 見つからないか、最後の問題だった場合はnullを返す
    if (currentIndex === -1 || currentIndex >= sortedUniqueIds.length - 1) {
      return null;
    }
    
    // 次の問題のIDを返す
    return sortedUniqueIds[currentIndex + 1];
    
  } catch (error) {
    console.error("Failed to get next problem ID:", error);
    return null;
  }
}


/**
 * 正解時に経験値を付与し、解答履歴を保存するサーバーアクション
 */
export async function awardXpForCorrectAnswer(problemId: number) {
  'use server';

  const session = await getSession();
  const user = session.user;

  if (!user) {
    throw new Error('認証されていません。ログインしてください。');
  }

  const userId = Number(user.id);
  if (isNaN(userId)) {
    throw new Error('セッション内のユーザーIDが無効です。');
  }

  let problemDetails: { subjectId: number; difficultyId: number; type: 'ALGO' | 'STATIC' } | null = null;
  let alreadyCorrect = false;

  // 1. まずアルゴリズム問題テーブル(Questions_Algorithm)から問題を探す
  const algoProblem = await prisma.questions_Algorithm.findUnique({
    where: { id: problemId },
    select: { subjectId: true, difficultyId: true },
  });

  if (algoProblem) {
    problemDetails = { ...algoProblem, type: 'ALGO' };
    // 解答履歴をチェック
    const existingAnswer = await prisma.answer_Algorithm.findFirst({
      where: { userId, questionId: problemId, isCorrect: true },
    });
    if (existingAnswer) alreadyCorrect = true;

  } else {
    // 2. なければ静的な問題テーブル(Questions)から問題を探す
    const staticProblem = await prisma.questions.findUnique({
      where: { id: problemId },
      select: { difficultyId: true },
    });

    if (staticProblem) {
      problemDetails = {
        // QuestionsテーブルにはsubjectIdがないため、デフォルト値を設定
        // seed.tsの内容から「基本情報A問題」のIDである2を想定
        subjectId: 2,
        difficultyId: staticProblem.difficultyId,
        type: 'STATIC',
      };
      // 解答履歴をチェック
      const existingAnswer = await prisma.userAnswer.findFirst({
        where: { userId, questionId: problemId, isCorrect: true },
      });
      if (existingAnswer) alreadyCorrect = true;
    }
  }

  // 3. どちらのテーブルにも問題が見つからなかった場合
  if (!problemDetails) {
    throw new Error(`問題ID:${problemId} が見つかりません。`);
  }

  // 4. 既に正解済みの場合
  if (alreadyCorrect) {
    console.log(`ユーザーID:${userId} は既に問題ID:${problemId}に正解済みです。`);
    return { message: '既に正解済みです。' };
  }

  // 5. 経験値を付与
  await addXp(userId, problemDetails.subjectId, problemDetails.difficultyId);

  // 6. 解答履歴を正しいテーブルに保存
  if (problemDetails.type === 'ALGO') {
    await prisma.answer_Algorithm.create({
      data: { userId, questionId: problemId, isCorrect: true, symbol: 'CORRECT', text: '正解' },
    });
  } else { // type === 'STATIC'
    await prisma.userAnswer.create({
      data: { userId, questionId: problemId, isCorrect: true, answer: 'CORRECT' },
    });
  }

  console.log(`ユーザーID:${userId} が問題ID:${problemId} に正解し、XPを獲得しました。`);

  return { message: '経験値を獲得しました！' };
}

// ... addXp, updateUserLoginStats 関数 (変更なし) ...
export async function addXp(user_id: number, subject_id: number, difficulty_id: number) {
  const difficulty = await prisma.difficulty.findUnique({
    where: { id: difficulty_id },
  });

  if (!difficulty) {
    throw new Error(`'${difficulty_id}' が見つかりません。`);
  }
  const xpAmount = difficulty.xp;
  console.log(`${difficulty_id}: ${xpAmount}xp`);
  
  const result = await prisma.$transaction(async (tx) => {
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

    let user = await tx.user.update({
      where: { id: user_id },
      data: { xp: { increment: xpAmount } },
    });
    const newAccountLevel = calculateLevelFromXp(user.xp);
    if (newAccountLevel > user.level) {
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

const RESET_HOUR = 6;
function getAppDate(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() - RESET_HOUR);
  return newDate;
}
export async function updateUserLoginStats(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) { throw new Error('User not found'); }

  const now = new Date();
  const lastLoginDate = user.lastlogin;
  const todayAppDateString = getAppDate(now).toDateString();
  const lastLoginAppDateString = lastLoginDate ? getAppDate(lastLoginDate).toDateString() : null;
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

  await prisma.user.update({
    where: { id: userId },
    data: {
      totallogin: newTotalDays,
      continuouslogin: newConsecutiveDays,
      lastlogin: now,
    },
  });
}
