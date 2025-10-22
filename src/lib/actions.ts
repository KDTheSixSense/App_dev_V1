// /workspaces/my-next-app/src/lib/actions.ts
'use server'; // このファイルがサーバーアクションであることを示す

import { prisma } from './prisma';
import { Prisma } from '@prisma/client'; // Prismaのエラー型をインポート
import bcrypt from 'bcryptjs';
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

const MAX_HUNGER = 200; //満腹度の最大値を一括管理

/**
 * 新しいユーザーアカウントと、そのペットを作成するAction (改良版)
 * @param data - ユーザー名、メールアドレス、パスワード、生年月日
 */
export async function registerUserAction(data: { username: string, email: string, password: string, birth?: string }) {
  const { username, email, password, birth } = data;

  if (!username || !email || !password) {
    return { error: '必須項目が不足しています。' };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
        // --- ▼▼▼ 生年月日を保存するロジックを追加 ▼▼▼ ---
        birth: birth ? new Date(birth) : null,
        // 関連するペットステータスも同時に作成
        status_Kohaku: {
          create: {
            status: '満腹 ',
            hungerlevel: 150,
            hungerLastUpdatedAt: new Date(),
          },
        },
      },
    });

    return { success: true, user: newUser };

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'そのメールアドレスまたはユーザー名は既に使用されています。' };
    }
    console.error("User registration failed:", error);
    return { error: 'アカウントの作成中にエラーが発生しました。' };
  }
}

/**
 * 次の問題のIDを取得するサーバーアクション
 */
export async function getNextProblemId(currentId: number, category: string): Promise<number | null> {
  try {
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
    } else if (category === 'basic_info_a_problem') {
      // Basc_Info_A_Question テーブルからIDを取得
      problemIds = await prisma.basic_Info_A_Question.findMany({
        select: { id: true },
      });
    } else {
      problemIds = await prisma.questions_Algorithm.findMany({
        where: { subject: { name: category } },
        select: { id: true },
      });
    }

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
export async function awardXpForCorrectAnswer(problemId: number, subjectid?: number) {
  'use server';

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const user = session.user;

  if (!user) {
    throw new Error('認証されていません。ログインしてください。');
  }

  const userId = Number(user.id);
  if (isNaN(userId)) {
    throw new Error('セッション内のユーザーIDが無効です。');
  }

  let problemDetails: { subjectId: number; difficultyId: number; type: 'ALGO' | 'STATIC' | 'BASIC_A' } | null = null; 
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
        // QuestionsテーブルにはsubjectIdがないため、正しい値を設定
        // seed.tsでこのテーブルに投入されるのは「基本情報B問題」なので、IDである3を設定
        subjectId: 3,
        difficultyId: staticProblem.difficultyId,
        type: 'STATIC',
      };
      } else {
      // 3. なければ基本情報A問題テーブル(Basc_Info_A_Question)を探す
      const basicAProblem = await prisma.basic_Info_A_Question.findUnique({
        where: { id: problemId },
        select: { subjectId: true, difficultyId: true },
      });

      if (basicAProblem) {
        problemDetails = { ...basicAProblem, type: 'BASIC_A' };
        // 解答履歴をチェック (UserAnswerモデルを共有)
        const existingAnswer = await prisma.userAnswer.findFirst({
          where: { userId, questionId: problemId, isCorrect: true },
        });
        if (existingAnswer) alreadyCorrect = true;
      }
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

  //ユーザーの回答数を数える
  const userAnswerCount = await prisma.userAnswer.count({ where: { userId } });
  const algoAnswerCount = await prisma.answer_Algorithm.count({ where: { userId } });
  const isFirstAnswerEver = (userAnswerCount + algoAnswerCount) === 0; //初めての解答ならtrue,違うならfalse

  // 5. 経験値を付与
  const { unlockedTitle } = await addXp(userId, problemDetails.subjectId, problemDetails.difficultyId);
  // 6. コハクの満腹度を回復
  await feedPetAction(problemDetails.difficultyId);
  // ログイン統計を更新
  await updateUserLoginStats(userId);

  // 7. 解答履歴を正しいテーブルに保存
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


    // 8. もし最初の解答だったら、ペットの満腹度減少タイマーを開始する
  if (isFirstAnswerEver) {
    await prisma.status_Kohaku.updateMany({
      where: { user_id: userId },
      data: {
        hungerLastUpdatedAt: new Date(), // 最終更新日時を「今」に設定
      },
    });
    console.log(`ユーザーID:${userId} のペットの満腹度タイマーを開始しました。`);
  }

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
    const subjectTitles = await tx.title.findMany({
      where: {
        type: 'SUBJECT_LEVEL',
        requiredSubjectId: subject_id,
      },
    });

    for (const title of subjectTitles) {
      if (newSubjectLevel >= title.requiredLevel) {
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
      const userTitles = await tx.title.findMany({
        where: {
          type: 'USER_LEVEL',
        },
      });

      for (const title of userTitles) {
        if (newAccountLevel >= title.requiredLevel) {
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

//世界標準時が日本の-9時間なので+3して日本時間で朝6時にリセットされるようにする
const RESET_HOUR = 3;
function getAppDate(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + RESET_HOUR);
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
    console.log(`ユーザーID:${userId} は今日すでにログインしています。連続ログインは更新されません。今日は${now}。 最終ログインは${lastLoginDate}です。`);
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

  await prisma.loginHistory.create({
    data: {
      userId: userId,
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

/**
 * プログラミング問題を削除するサーバーアクション
 * @param formData - フォームから送信されたデータ
 */
export async function deleteProblemAction(formData: FormData) {
  'use server'; // Server Actionであることを明示

  // 1. セッションを取得し、ユーザー認証を行う
  const session = await getSession();
  const user = session.user;

  if (!user?.id) {
    // ログインしていない場合はエラー
    throw new Error('認証が必要です。');
  }

  const userId = Number(user.id);
  if (isNaN(userId)) {
    throw new Error('セッションのユーザーIDが無効です。');
  }

  // 2. フォームから問題IDを取得し、検証する
  const problemIdStr = formData.get('problemId');
  if (typeof problemIdStr !== 'string') {
    throw new Error('無効な問題IDです。');
  }

  const problemId = Number(problemIdStr);
  if (isNaN(problemId)) {
    throw new Error('問題IDが数値ではありません。');
  }

  try {
    // 3. 削除対象の問題を取得し、所有者か確認する (セキュリティ上、非常に重要)
    const problem = await prisma.programmingProblem.findUnique({
      where: {
        id: problemId,
      },
      select: {
        createdBy: true, // 所有者IDのみ取得
      },
    });

    // 問題が存在しない、または作成者が自分でない場合はエラー
    if (!problem || problem.createdBy !== userId) {
      throw new Error('この問題を削除する権限がありません。');
    }

    // 4. 問題を削除する
    // schema.prismaの onDelele: Cascade 設定により、関連データも自動削除される
    await prisma.programmingProblem.delete({
      where: {
        id: problemId,
      },
    });

    // 5. 問題一覧ページのキャッシュをクリアし、UIを更新する
    revalidatePath('/issue_list/mine_issue_list/problems');

    console.log(`ユーザーID:${userId} が 問題ID:${problemId} を削除しました。`);
    // return { success: true };

  } catch (error) {
    console.error('問題の削除中にエラーが発生しました:', error);
    // エラー内容をオブジェクトで返すことで、将来的にUIでのハンドリングも可能
    // return { error: (error instanceof Error) ? error.message : '問題の削除に失敗しました。' };
  }
}

// ★ 新しく追加する関数
export async function getMineProblems() {
  'use server';
  try {
    const session = await getSession();
    const user = session.user;

    if (!user || !user.id) {
      return { error: '認証が必要です。ログインしてください。' };
    }

    const userId = Number(user.id);
    if (isNaN(userId)) {
      return { error: 'ユーザー情報が無効です。' };
    }

    const problems = await prisma.programmingProblem.findMany({
      where: { createdBy: userId },
      include: {
        creator: {
          select: { username: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return { data: problems };
  } catch (error) {
    console.error("Failed to fetch user's problems:", error);
    return { error: '問題の取得中にエラーが発生しました。' };
  }
}

/**
 * コハクに餌を与え、満腹度を更新するAction
 * @param foodAmount - 与える餌の量（回復する満腹度）
 */
export async function feedPetAction(difficultyId: number) {
  // 1. ログインセッションを取得
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return { error: 'ログインしていません。' };
  }
  const userId = Number(session.user.id);

  try {
    // 2. 難易度IDを元に、回復する満腹度(feed)を取得
    const difficulty = await prisma.difficulty.findUnique({
      where: { id: difficultyId },
    });

    if (!difficulty) {
      return { error: '指定された難易度が見つかりません。' };
    }
    const foodAmount = difficulty.feed; // データベースから回復量を取得

    // 3. 現在のペットのステータスを取得
    const petStatus = await prisma.status_Kohaku.findFirst({
      where: { user_id: userId },
    });

    const now = new Date();

    if (!petStatus) {
      // 4a. ペット情報がない場合は、新しく作成する
      await prisma.status_Kohaku.create({
          data: {
              user_id: userId,
              status: "満腹",
              hungerlevel: Math.min(foodAmount, MAX_HUNGER), // 初回でも上限を超えないように
              hungerLastUpdatedAt: now,
          }
      });
      console.log(`新規ペットステータスを作成し、満腹度を${Math.min(foodAmount, MAX_HUNGER)}に設定しました。`);
    } else {
      // 4b. ペット情報がある場合は、満腹度を更新する
      const newHungerLevel = petStatus.hungerlevel + foodAmount;
      const cappedHungerLevel = Math.min(newHungerLevel, MAX_HUNGER); // 最大値を超えないように調整

      await prisma.status_Kohaku.update({
        where: {
          id: petStatus.id,
        },
        data: {
          hungerlevel: cappedHungerLevel,
          hungerLastUpdatedAt: now, // 最終更新日時を「今」に設定
        },
      });
      console.log(`満腹度を${cappedHungerLevel}に更新しました。`);
    }

    // revalidatePath('/'); // PetStatusが表示されているページを再検証
    return { success: true };

  } catch (error) {
    console.error("Failed to feed pet:", error);
    return { error: 'コハクへの餌やりに失敗しました。' };
  }
}

/**
 * ログイン中のユーザーが作成した「選択問題」を取得するサーバーアクション
 */
export async function getMineSelectProblems() {
  'use server';
  try {
    const session = await getSession();
    const user = session.user;

    if (!user || !user.id) {
      return { error: '認証が必要です。ログインしてください。' };
    }

    const userId = Number(user.id);
    if (isNaN(userId)) {
      return { error: 'ユーザー情報が無効です。' };
    }

    // `SelectProblem` モデルからデータを取得するように変更
    const problems = await prisma.selectProblem.findMany({
      where: { createdBy: userId },
      include: {
        creator: {
          select: { username: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return { data: problems };
  } catch (error) {
    console.error("Failed to fetch user's select problems:", error);
    return { error: '選択問題の取得中にエラーが発生しました。' };
  }
}

/**
 * 選択問題を削除するサーバーアクション
 * @param formData - フォームから送信されたデータ
 */
export async function deleteSelectProblemAction(formData: FormData) {
  'use server';

  const session = await getSession();
  const user = session.user;

  if (!user?.id) {
    throw new Error('認証が必要です。');
  }
  const userId = Number(user.id);

  const problemIdStr = formData.get('problemId');
  if (typeof problemIdStr !== 'string') {
    throw new Error('無効な問題IDです。');
  }
  const problemId = Number(problemIdStr);

  try {
    // 削除対象の選択問題を取得し、所有者か確認
    const problem = await prisma.selectProblem.findUnique({
      where: { id: problemId },
      select: { createdBy: true },
    });

    if (!problem || problem.createdBy !== userId) {
      throw new Error('この問題を削除する権限がありません。');
    }

    // `selectProblem` を削除するように変更
    await prisma.selectProblem.delete({
      where: { id: problemId },
    });

    // キャッシュをクリアしてUIを更新
    revalidatePath('/issue_list/mine_issue_list/problems');

  } catch (error) {
    console.error('選択問題の削除中にエラーが発生しました:', error);
    // UI側でエラーハンドリングが必要な場合は、オブジェクトを返す
    // return { error: (error instanceof Error) ? error.message : '問題の削除に失敗しました。' };
  }
}

/**
 * IDに基づいて単一の選択問題を取得するサーバーアクション
 * @param problemId 取得する問題のID
 */
export async function getSelectProblemByIdAction(problemId: number) {
  'use server';
  try {
    const session = await getSession();
    if (!session.user) {
      return { error: '認証が必要です。' };
    }

    const problem = await prisma.selectProblem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return { error: '問題が見つかりません。' };
    }

    // ログインユーザーが作成者であることを確認 (セキュリティのため)
    if (problem.createdBy !== Number(session.user.id)) {
        return { error: 'この問題の編集権限がありません。' };
    }

    return { data: problem };
  } catch (error) {
    console.error("Failed to fetch select problem:", error);
    return { error: '問題の取得に失敗しました。' };
  }
}

/**
 * 既存の選択問題を更新するサーバーアクション
 * @param formData フォームから送信されたデータ
 */
export async function updateSelectProblemAction(formData: FormData) {
  'use server';
  try {
    const session = await getSession();
    const user = session.user;
    if (!user) {
      return { error: '認証が必要です。' };
    }

    // フォームデータの取得と検証
    const problemId = Number(formData.get('problemId'));
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const explanation = formData.get('explanation') as string;
    const answerOptions = JSON.parse(formData.get('answerOptions') as string);
    const correctAnswer = formData.get('correctAnswer') as string;
    const subjectId = Number(formData.get('subjectId'));
    const difficultyId = Number(formData.get('difficultyId'));

    if (isNaN(problemId) || !title || !description || !answerOptions || !correctAnswer || isNaN(subjectId) || isNaN(difficultyId)) {
        return { error: '必須項目が不足しています。' };
    }

    // 更新対象の問題の所有者か再度確認
    const existingProblem = await prisma.selectProblem.findUnique({ where: { id: problemId } });
    if (!existingProblem || existingProblem.createdBy !== Number(user.id)) {
        return { error: 'この問題を更新する権限がありません。' };
    }

    // データベースを更新
    const updatedProblem = await prisma.selectProblem.update({
      where: { id: problemId },
      data: {
        title,
        description,
        explanation,
        answerOptions,
        correctAnswer,
        subjectId,
        difficultyId,
      },
    });
    
    // 問題一覧ページのキャッシュをクリアして表示を更新
    revalidatePath('/issue_list/mine_issue_list/problems');
    return { success: true, problem: updatedProblem };

  } catch (error) {
    console.error('Error updating select problem:', error);
    return { error: '問題の更新中にエラーが発生しました。' };
  }
}

/**
 * イベント作成フォームの入力データ型
 */
interface CreateEventFormData {
  title: string;
  description: string;
  startTime: string; // ISO 8601 形式の文字列を期待
  endTime: string;   // ISO 8601 形式の文字列を期待
  publicTime: string; // ISO 8601 形式の文字列を期待
  selectedProblemIds: number[]; // 選択された問題IDの配列
}

/**
 * 新規イベントを作成するサーバーアクション
 * @param data CreateEventFormData
 */
export async function createEventAction(data: CreateEventFormData) {
  // 1. ユーザーセッションを取得
  const session = await getIronSession<{ user?: { id: string } }>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return { error: 'ログインしていません。' };
  }
  const userId = Number(session.user.id);

  const { title, description, startTime, endTime, publicTime, selectedProblemIds } = data;

  // 2. サーバーサイドでのバリデーション
  if (!title || !description || !startTime || !endTime || !publicTime) {
    return { error: '必須項目（基本設定）が不足しています。' };
  }
  if (selectedProblemIds.length === 0) {
    return { error: 'プログラミング問題を1つ以上選択してください。' };
  }

  try {
    const inviteCode = nanoid(10); // 10桁のランダムな招待コードを生成

    // 3. データベースへの書き込み（トランザクション）
    const newEvent = await prisma.$transaction(async (tx) => {
      // a. イベント本体を作成
      const event = await tx.create_event.create({
        data: {
          title: title,
          description: description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          publicTime: new Date(publicTime), // ※スキーマに publicTime が必要
          inviteCode: inviteCode,
          publicStatus: true, // デフォルトで公開（画像からは設定項目がなかったため）
          creatorId: userId,
        },
      });

      // b. 選択された問題を Event_Issue_List に登録
      const issueListData = selectedProblemIds.map(problemId => ({
        eventId: event.id,
        problemId: problemId,
      }));
      await tx.event_Issue_List.createMany({
        data: issueListData,
      });

      // c. 作成者を参加者（管理者）として登録
      await tx.event_Participants.create({
        data: {
          eventId: event.id,
          userId: userId,
          isAdmin: true,
        },
      });

      return event;
    });

    // 4. キャッシュのクリアと成功レスポンス
    revalidatePath('/event/event_list'); // イベント一覧ページなどのキャッシュをクリア
    return { success: true, eventId: newEvent.id };

  } catch (error) {
    console.error('イベント作成に失敗しました:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: 'データベースエラーが発生しました。' };
    }
    return { error: 'イベントの作成に失敗しました。' };
  }
}

/**
 * イベント下書き保存フォームの入力データ型
 * (createEventAction と同じ型を流用)
 */
interface EventFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  publicTime: string;
  selectedProblemIds: number[];
}

/**
 * 新規イベントを下書きとして保存するサーバーアクション
 * @param data EventFormData
 */
export async function saveEventDraftAction(data: EventFormData) {
  // 1. ユーザーセッションを取得
  const session = await getIronSession<{ user?: { id: string } }>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return { error: 'ログインしていません。' };
  }
  const userId = Number(session.user.id);

  const { title, description, startTime, endTime, publicTime, selectedProblemIds } = data;

  // 2. サーバーサイドでの「下書き用」バリデーション
  if (!title) {
    return { error: '下書きを保存するには、イベントタイトル名が必須です。' };
  }

  try {
    const inviteCode = nanoid(10); // 下書きでも招待コードはユニークに発行

    // 3. データベースへの書き込み（トランザクション）
    const newDraftEvent = await prisma.$transaction(async (tx) => {
      // a. イベント本体を作成
      const event = await tx.create_event.create({
        data: {
          title: title,
          description: description || '', // 説明が空でもOK
          // 日付が空文字列
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          publicTime: publicTime ? new Date(publicTime) : null,
          inviteCode: inviteCode,
          publicStatus: false, // 下書き保存
          creator: {
            connect: {
              id: userId
            }
          }
        },
      });

      // b. 選択された問題も保存 (もしあれば)
      if (selectedProblemIds.length > 0) {
        const issueListData = selectedProblemIds.map(problemId => ({
          eventId: event.id,
          problemId: problemId,
        }));
        await tx.event_Issue_List.createMany({
          data: issueListData,
        });
      }

      // c. 作成者を参加者（管理者）として登録
      await tx.event_Participants.create({
        data: {
          eventId: event.id,
          userId: userId,
          isAdmin: true,
        },
      });

      return event;
    });

    // 4. 成功レスポンス
    return { success: true, message: '下書きを保存しました。' };

  } catch (error) {
    console.error('下書き保存に失敗しました:', error);
    return { error: '下書きの保存に失敗しました。' };
  }
}

/**
 * ログイン中のユーザーが作成した下書きイベントの一覧を取得する
 */
export async function getMyDraftEventsAction() {
  'use server';
  const session = await getIronSession<{ user?: { id: string } }>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return { error: 'ログインしていません。' };
  }
  const userId = Number(session.user.id);

  try {
    const drafts = await prisma.create_event.findMany({
      where: {
        creatorId: userId,
        publicStatus: false, // 
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        updatedAt: 'desc', // 
      },
    });
    return { data: drafts };
  } catch (error) {
    console.error('下書き一覧の取得に失敗:', error);
    return { error: '下書きの読み込みに失敗しました。' };
  }
}

/**
 * 日付オブジェクトを datetime-local 
 * @param date
 */
const formatDateTimeForInput = (date: Date | null | undefined): string => {
  if (!date) return '';
  try {
    // 
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  } catch (e) {
    return '';
  }
};

/**
 * 特定の下書きイベントの詳細を取得する
 * @param eventId 読み込む下書きのID
 */
export async function getDraftEventDetailsAction(eventId: number) {
  'use server';
  const session = await getIronSession<{ user?: { id: string } }>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return { error: 'ログインしていません。' };
  }
  const userId = Number(session.user.id);

  try {
    const event = await prisma.create_event.findFirst({
      where: {
        id: eventId,
        creatorId: userId, // 
        publicStatus: false,
      },
      include: {
        issues: { // 
          select: {
            problemId: true,
          },
        },
      },
    });

    if (!event) {
      return { error: '指定された下書きが見つかりません。' };
    }

    // 
    const formattedEvent = {
      title: event.title,
      description: event.description,
      startTime: formatDateTimeForInput(event.startTime),
      endTime: formatDateTimeForInput(event.endTime),
      publicTime: formatDateTimeForInput(event.publicTime),
      selectedProblemIds: event.issues.map((issue) => issue.problemId),
    };

    return { data: formattedEvent };

  } catch (error) {
    console.error('下書き詳細の取得に失敗:', error);
    return { error: '下書きの読み込みに失敗しました。' };
  }
}