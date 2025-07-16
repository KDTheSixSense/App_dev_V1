// /workspaces/my-next-app/src/lib/actions.ts
'use server'; // このファイルがサーバーアクションであることを示す

import { prisma } from './prisma';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { calculateLevelFromXp } from './leveling';
import { getSession } from './session';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid'; // 招待コード生成に使う
import { sessionOptions } from '../lib/session';
import type { Problem as SerializableProblem } from '@/lib/types';

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

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
  const { unlockedTitle } = await addXp(userId, problemDetails.subjectId, problemDetails.difficultyId);
  // ログイン統計を更新
  await updateUserLoginStats(userId);

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

  return { message: '経験値を獲得しました！', unlockedTitle };
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
    let unlockedTitle: { name: string } | null = null;

    const newSubjectLevel = calculateLevelFromXp(updatedProgress.xp);
    if (newSubjectLevel > updatedProgress.level) {
      await tx.userSubjectProgress.update({
        where: { user_id_subject_id: { user_id, subject_id } },
        data: { level: newSubjectLevel },
      });
      console.log(`[科目レベルアップ!] subjectId:${subject_id} がレベル ${newSubjectLevel} に！`);

      }

    // 称号付与ロジック (科目)
    if (newSubjectLevel >= 10) {
      const title = await tx.title.findFirst({
        where: {
          type: 'SUBJECT_LEVEL',
          requiredLevel: 10,
          requiredSubjectId: subject_id,
        },
      });
      if (title) {
        const existingUnlock = await tx.userUnlockedTitle.findUnique({
          where: { userId_titleId: { userId: user_id, titleId: title.id } },
        });
        if (!existingUnlock) {
          await tx.userUnlockedTitle.create({
            data: { userId: user_id, titleId: title.id },
          });
          unlockedTitle = { name: title.name };
          console.log(`[称号獲得!] ${title.name} を獲得しました！`);
        }
      }
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

      // 称号付与ロジック (ユーザー)
      if (newAccountLevel >= 10) {
        const title = await tx.title.findFirst({
          where: {
            type: 'USER_LEVEL',
            requiredLevel: 10,
          },
        });
        if (title) {
          const existingUnlock = await tx.userUnlockedTitle.findUnique({
            where: { userId_titleId: { userId: user_id, titleId: title.id } },
          });
          if (!existingUnlock) {
            await tx.userUnlockedTitle.create({
              data: { userId: user_id, titleId: title.id },
            });
            unlockedTitle = { name: title.name };
            console.log(`[称号獲得!] ${title.name} を獲得しました！`);
          }
        }
      }
    }

    return { updatedUser: user, updatedProgress, unlockedTitle };
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

  if(lastLoginAppDateString === todayAppDateString) {
    console.log(`ユーザーID:${userId} は今日すでにログインしています。連続ログインは更新されません。`);
    return;
  }

  if (lastLoginAppDateString && lastLoginAppDateString === yesterdayAppDateString) {
    // ケースA: 最後のログインが「アプリ内での昨日」 -> 連続ログイン
    newConsecutiveDays += 1;
  } else {
    // ケースB: 連続ログインが途切れた -> リセット
    newConsecutiveDays = 1;
  }
  newTotalDays += 1;
  console.log(`ユーザーID:${userId} のログイン統計を更新: 連続ログイン ${newConsecutiveDays}日, 総ログイン日数 ${newTotalDays}日`);

  await prisma.user.update({
    where: { id: userId },
    data: {
      totallogin: newTotalDays,
      continuouslogin: newConsecutiveDays,
      lastlogin: now,
    },
  });
}

// Prismaのデータモデルを、フロントエンドで利用している `SerializableProblem` 型に変換するヘルパー関数
const convertToSerializableProblem = (dbProblem: any): SerializableProblem | undefined => {
  if (!dbProblem) {
    return undefined;
  }
  return {
    id: String(dbProblem.id),
    logicType: 'CODING_PROBLEM',
    title: { ja: dbProblem.title, en: dbProblem.title },
    description: { ja: dbProblem.description, en: dbProblem.description },
    programLines: {
      ja: (dbProblem.codeTemplate || '').split('\n'),
      en: (dbProblem.codeTemplate || '').split('\n'),
    },
    answerOptions: { ja: [], en: [] },
    // ▼▼▼【ここを修正】▼▼▼
    // testCasesではなく、データが存在するsampleCasesから正解を取得します。
    // これで「NONE」になる問題が解決します。
    correctAnswer: dbProblem.sampleCases?.[0]?.expectedOutput || '',
    // ▲▲▲【修正ここまで】▲▲▲
    explanationText: {
      ja: dbProblem.sampleCases?.[0]?.description || '解説は準備中です。',
      en: dbProblem.sampleCases?.[0]?.description || 'Explanation is not ready yet.',
    },
    sampleCases: dbProblem.sampleCases || [],
    initialVariables: {},
    traceLogic: [],
  };
};

/**
 * IDに基づいて単一のプログラミング問題を取得する Server Action
 * @param problemId 問題のID
 * @returns 問題データ、または見つからない場合は undefined
 */
export async function getProblemByIdAction(problemId: string): Promise<SerializableProblem | undefined> {
  const id = parseInt(problemId, 10);
  if (isNaN(id)) {
    console.error('Invalid problem ID:', problemId);
    return undefined;
  }

  try {
    const problemFromDb = await prisma.programmingProblem.findUnique({
      where: { id },
      include: {
        sampleCases: { orderBy: { order: 'asc' } },
        testCases: { orderBy: { order: 'asc' } },
      },
    });

    return convertToSerializableProblem(problemFromDb);

  } catch (error) {
    console.error(`Failed to fetch problem ${id}:`, error);
    return undefined;
  }
}

/**
 * 次のプログラミング問題のIDを取得する Server Action
 */
export async function getNextProgrammingProblemId(currentId: number): Promise<string | null> {
    try {
        const nextProblem = await prisma.programmingProblem.findFirst({
            where: {
                id: {
                    gt: currentId
                },
                isPublished: true,
            },
            orderBy: {
                id: 'asc'
            },
            select: {
                id: true
            }
        });
        return nextProblem ? String(nextProblem.id) : null;
    } catch (error) {
        console.error("Failed to get next programming problem ID:", error);
        return null;
    }
}

/**
 * 新しいグループを作成し、招待コードを発行するAction
 * @param groupName フォームから受け取った新しいグループの名前
 */
export async function createGroupAction(data:{groupName: string,body: string}) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) return { error: 'ログインしていません。' };
  const userId = Number(session.user.id);

  const { groupName, body } = data;

  if (!groupName || groupName.trim() === '') {
      return { error: 'グループ名を入力してください。'};
  }

  const inviteCode = nanoid(8);

  const newGroup = await prisma.groups.create({
    data: {
      groupname: groupName,
      invite_code: inviteCode,
      body: body, // グループの説明は空で初期化
    },
  });

  await prisma.groups_User.create({
    data: {
      user_id: userId,
      group_id: newGroup.id,
      admin_flg: true, // 作成者は自動的に管理者
    },
  });
  revalidatePath('/groups');
  return { success: true, groupName: newGroup.groupname, inviteCode: newGroup.invite_code };
}

export async function joinGroupAction(inviteCode: string) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) return { error: 'ログインしていません。' };
  const userId = Number(session.user.id);

  if (!inviteCode || inviteCode.trim() === '') {
    return { error: '招待コードを入力してください。'};
  }

  // モデル名とフィールド名をあなたのスキーマに合わせる
  const group = await prisma.groups.findUnique({
    where: { invite_code: inviteCode },
  });

  if (!group) {
    return { error: '無効な招待コードです。' };
  }

  // モデル名とフィールド名をあなたのスキーマに合わせる
  const existingMembership = await prisma.groups_User.findUnique({
    where: {
      group_id_user_id: { group_id: group.id, user_id: userId },
    },
  });

  if (existingMembership) {
    return { error: '既にこのグループに参加しています。' };
  }

  // モデル名とフィールド名をあなたのスキーマに合わせる
  await prisma.groups_User.create({
    data: {
      user_id: userId,
      group_id: group.id,
      admin_flg: false, // 参加者はデフォルトで管理者ではない
    },
  });

  revalidatePath('/groups');
  return { success: true, groupName: group.groupname };
}

export async function getGroupsAction() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? Number(session.user.id) : null;

  // --- ▼▼▼ デバッグログ1: セッションから取得したユーザーIDを確認 ---
  console.log('[DEBUG] getGroupsAction: userId from session is:', userId);

  if (!userId) {
    return { error: 'ログインしていません。' };
  }

  try {
    const groups = await prisma.groups.findMany({
      where: {
        // ログイン中のユーザーがメンバーに含まれるグループのみを検索
        groups_User: {
          some: {
            user_id: userId,
          },
        },
      },
      // 各グループのメンバー数を一緒に取得
      include: {
        // メンバー数と、メンバーの詳細リストの両方を取得します
        _count: {
          select: {
            groups_User: true,
          },
        },
        groups_User: {
          include: {
            user: { // 各メンバーのユーザー情報も取得
              select: {
                id: true,
                username: true,
                icon: true,
              },
            },
          },
        },
      },
    });
    console.log('[DEBUG] getGroupsAction: Raw groups from DB:', JSON.stringify(groups, null, 2));
    return { success: true, data: groups };
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return { error: 'グループの取得に失敗しました。' };
  }
}
