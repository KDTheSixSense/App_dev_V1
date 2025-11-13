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
import { TitleType } from '@prisma/client';
import { getMissionDate } from './utils';

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

interface LoginCredentials {
  email: string;
  password: string;
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
        // --- 生年月日を保存するロジック ---
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
    } else if (category === 'applied_info_morning_problem') {
      // 応用情報技術者試験 午前問題
      problemIds = await prisma.applied_am_Question.findMany({
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
export async function awardXpForCorrectAnswer(problemId: number, eventId: number | undefined, subjectid?: number, problemStartedAt?: string | number) {
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

   // --- 2. 必須パラメータのチェック ---
  if (subjectid === undefined) {
    throw new Error(`SubjectIDが提供されていません。どの科目の問題か判別できません。`);
  }

  let difficultyId: number | undefined;
  let alreadyCorrectToday = false; // 変数名を「今日正解済みか」に変更

  // 解答履歴を保存する際に、どの外部キーにIDをセットするかを格納する変数
  let userAnswerForeignKeyData: {
      programingProblem_id?: number;
      basic_A_Info_Question_id?: number;
      questions_id?: number;
      selectProblem_id?: number;
  } = {};

  const todayAppDateString = getAppDate(new Date()).toDateString();
  
  if (subjectid === 1) { // 1: ProgrammingProblem
    const problem = await prisma.programmingProblem.findUnique({ 
      where: { id: problemId }, 
      select: { difficulty: true } 
    });
    difficultyId = problem?.difficulty;
    userAnswerForeignKeyData = { programingProblem_id: problemId };
    
    const lastCorrectAnswer = await prisma.userAnswer.findFirst({
      where: { userId, isCorrect: true, programingProblem_id: problemId },
      orderBy: { answeredAt: 'desc' }
    });
    if (lastCorrectAnswer && getAppDate(lastCorrectAnswer.answeredAt).toDateString() === todayAppDateString) {
      alreadyCorrectToday = true;
    }

  } else if (subjectid === 2) { // 2: Basic_Info_A_Question
    const problem = await prisma.basic_Info_A_Question.findUnique({ 
      where: { id: problemId }, 
      select: { difficultyId: true } 
    });
    difficultyId = problem?.difficultyId;
    userAnswerForeignKeyData = { basic_A_Info_Question_id: problemId };
    
    const lastCorrectAnswer = await prisma.userAnswer.findFirst({
      where: { userId, isCorrect: true, basic_A_Info_Question_id: problemId },
      orderBy: { answeredAt: 'desc' }
    });
    if (lastCorrectAnswer && getAppDate(lastCorrectAnswer.answeredAt).toDateString() === todayAppDateString) {
      alreadyCorrectToday = true;
    }

  } else if (subjectid === 3) { // 3: Questions
    const problem = await prisma.questions.findUnique({ 
      where: { id: problemId }, 
      select: { difficultyId: true } 
    });
    difficultyId = problem?.difficultyId;
    userAnswerForeignKeyData = { questions_id: problemId };
    
    const lastCorrectAnswer = await prisma.userAnswer.findFirst({
      where: { userId, isCorrect: true, questions_id: problemId },
      orderBy: { answeredAt: 'desc' }
    });
    if (lastCorrectAnswer && getAppDate(lastCorrectAnswer.answeredAt).toDateString() === todayAppDateString) {
      alreadyCorrectToday = true;
    }

  } else if (subjectid === 4) { // 4: SelectProblem
    const problem = await prisma.selectProblem.findUnique({
      where: { id: problemId },
      select: { difficultyId: true }
    });
    difficultyId = problem?.difficultyId;
    userAnswerForeignKeyData = { selectProblem_id: problemId };
    
    const lastCorrectAnswer = await prisma.userAnswer.findFirst({
      where: { userId, isCorrect: true, selectProblem_id: problemId },
      orderBy: { answeredAt: 'desc' }
    });
    if (lastCorrectAnswer && getAppDate(lastCorrectAnswer.answeredAt).toDateString() === todayAppDateString) {
      alreadyCorrectToday = true;
    }
  } else if (subjectid === 5) { // 5: Applied_am_Question
    // 1. 正しいテーブル (Applied_am_Question) を参照する
    const problem = await prisma.applied_am_Question.findUnique({ 
      where: { id: problemId }, 
      select: { difficultyId: true } 
    });
    difficultyId = problem?.difficultyId;
    
    // 2. UserAnswer テーブルのスキーマに 'applied_am_Question_id' がないため、
    //    'basic_A_Info_Question_id' に保存します。 (スキーマの制約)
    userAnswerForeignKeyData = { basic_A_Info_Question_id: problemId };
    
    // 3. 履歴チェックも 'basic_A_Info_Question_id' で行います
    const lastCorrectAnswer = await prisma.userAnswer.findFirst({
      where: { userId, isCorrect: true, basic_A_Info_Question_id: problemId },
      orderBy: { answeredAt: 'desc' }
    });
    if (lastCorrectAnswer && getAppDate(lastCorrectAnswer.answeredAt).toDateString() === todayAppDateString) {
      alreadyCorrectToday = true;
    }
  } else { // 5: Questions_Algorithm (仮)
    const problem = await prisma.questions_Algorithm.findUnique({ 
      where: { id: problemId }, 
      select: { difficultyId: true } 
    });
    difficultyId = problem?.difficultyId;
    userAnswerForeignKeyData = { questions_id: problemId }; // 暫定でquestions_idに保存
    
    const lastCorrectAnswer = await prisma.userAnswer.findFirst({
      where: { userId, isCorrect: true, questions_id: problemId },
      orderBy: { answeredAt: 'desc' }
    });
    if (lastCorrectAnswer && getAppDate(lastCorrectAnswer.answeredAt).toDateString() === todayAppDateString) {
      alreadyCorrectToday = true;
    }
  }

  // --- 4. 問題の存在と難易度IDのチェック ---
  if (!difficultyId) {
    throw new Error(`問題ID:${problemId} (科目ID:${subjectid}) が見つかりません、またはdifficultyIdが設定されていません。`);
  }

   // --- 5. 正解済みかチェック ---
  if (alreadyCorrectToday) {
    console.log(`ユーザーID:${userId} は本日既に問題ID:${problemId}に正解済みです。`);
    return { message: '既に正解済みです。' };
  }

  // 5. XP量と学習時間を計算
  let xpAmount = 0;
  let timeSpentMs = 0;

  // 5a. XP量を取得
  const difficulty = await prisma.difficulty.findUnique({
    where: { id: difficultyId },
  });
  if (difficulty) {
    xpAmount = difficulty.xp;
  }

  // 5b. 学習時間（ミリ秒）を計算（開始時刻が渡された場合のみ計算）
  if (typeof problemStartedAt !== 'undefined' && problemStartedAt !== null) {
    try {
      // クライアントから渡されるのは Date.now() の数値タイムスタンプのはず
      const startTime = typeof problemStartedAt === 'number'
        ? problemStartedAt
          : Date.parse(String(problemStartedAt)); // 文字列の場合も考慮
        
      if (!isNaN(startTime)) {
          const endTime = Date.now(); // サーバー側で現在時刻を取得
        timeSpentMs = endTime - startTime;
          console.log(`[awardXp] Calculated timeSpentMs: ${timeSpentMs}`);
      } else {
          console.warn('[awardXp] Invalid problemStartedAt value received:', problemStartedAt);
      }
    } catch (e) {
      console.warn('[awardXp] Failed to calculate study time:', e);
    }
  } else {
      console.log('[awardXp] problemStartedAt was not provided.');
  }

  // 5c. 日次サマリーテーブルを更新（非同期で実行し、待たない）
  upsertDailyActivity(userId, xpAmount, timeSpentMs);

  // --- 6. 史上初の解答かどうかの判定 ---
  const totalAnswerCount = await prisma.userAnswer.count({ where: { userId } });
  const isFirstAnswerEver = (totalAnswerCount === 0);


  updateDailyMissionProgress(1, 1); // デイリーミッションの「問題を解く」進捗を1増やす

  if(!subjectid){
    subjectid = 0;
  }
  // 5. 経験値を付与
  const { unlockedTitle } = await addXp(userId, subjectid, difficultyId);
  // 6. コハクの満腹度を回復
  await feedPetAction(difficultyId);

  // 7. イベント参加者の得点を更新 (eventIdが渡された場合のみ)
  if (eventId !== undefined && xpAmount > 0) {
    await prisma.event_Participants.updateMany({
      where: {
        eventId: eventId,
        userId: userId,
      },
      data: {
        event_getpoint: { increment: xpAmount },
      },
    });
    console.log(`[EventScore] ユーザーID:${userId} の イベントID:${eventId} での得点を ${xpAmount}点 加算しました。`);
  }

  // ログイン統計を更新
  await updateUserLoginStats(userId);

  // --- 9. 統一された解答履歴の保存 ---
  await prisma.userAnswer.create({
    data: {
      userId: userId,
      isCorrect: true,
      answer: 'CORRECT',
      
      // Step 3で決定した、正しい外部キーにIDをセットする
      ...userAnswerForeignKeyData 
    },
  });
  
  console.log(`ユーザーID:${userId} が問題ID:${problemId} (科目ID:${subjectid}) に正解し、XPを獲得しました。`);

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

// XPを加算し、レベルアップと称号獲得を処理するサーバーアクション
// * @param user_id - XPを加算するユーザーのID
// * @param subject_id - 科目のID
// * @param difficulty_id - 難易度のID
export async function addXp(user_id: number, subject_id: number, difficulty_id: number) {
  const difficulty = await prisma.difficulty.findUnique({
    where: { id: difficulty_id },
  });

  if (!difficulty) {
    throw new Error(`'${difficulty_id}' が見つかりません。`);
  }
  const xpAmount = difficulty.xp;
  console.log(`${difficulty_id}: ${xpAmount}xp`);
  
  updateDailyMissionProgress(3, xpAmount); // デイリーミッションの「XPを獲得する」進捗を更新

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

/**
 * 特定のデイリーミッションの進捗を更新するサーバーアクション
 * * @param missionId - 更新するミッションのID (DailyMissionMaster の ID)
 * @param incrementAmount - 加算する進捗量 
 * @returns 更新結果 ({ success: boolean, completed?: boolean, unlockedTitle?: { name: string } | null })
 */
export async function updateDailyMissionProgress(
  missionId: number,
  incrementAmount: number
) {
  'use server';

  // --- 1. ユーザー認証 ---
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const user = session.user;
  if (!user?.id) {
    console.error('[updateDailyMissionProgress] Error: User not authenticated.');
    return { success: false, error: '認証されていません。' };
  }
  const userId = Number(user.id);
  if (isNaN(userId)) {
    console.error('[updateDailyMissionProgress] Error: Invalid user ID in session.');
    return { success: false, error: 'セッション情報が無効です。' };
  }

  // --- 2. 日付の取得 ---
  const missionDate = getMissionDate();

  try {
    // --- 3. トランザクション開始 ---
    // 進捗更新 -> 達成確認 -> 完了フラグ更新 & XP付与 をアトミックに行う
    const result = await prisma.$transaction(async (tx) => {
      
      // --- 3a. 現在の進捗とマスターデータを取得 (ロック) ---
      // findUniqueOrThrow を使い、レコードがない場合はエラーにする
      const currentProgress = await tx.userDailyMissionProgress.findUniqueOrThrow({
        where: {
          userId_missionId_date: {
            userId: userId,
            missionId: missionId,
            date: missionDate,
          },
          // isCompleted: false // ここで false を条件にすると、達成直後の重複呼び出しでエラーになるため外す
        },
        include: {
          mission: true, // targetCount と xpReward を取得
        },
      });

      // --- 3b. 既に完了済みかチェック ---
      if (currentProgress.isCompleted) {
        console.log(`[updateDailyMissionProgress] Mission ${missionId} for user ${userId} on ${missionDate.toISOString().split('T')[0]} is already completed.`);
        // 既に完了している場合は、更新せずに成功として終了 (nullを返す)
        return null; 
      }

      // --- 3c. 進捗を加算 ---
      const newProgress = currentProgress.progress + incrementAmount;

      // --- 3d. 進捗を更新 ---
      await tx.userDailyMissionProgress.update({
        where: {
          userId_missionId_date: {
            userId: userId,
            missionId: missionId,
            date: missionDate,
          },
        },
        data: {
          progress: newProgress,
        },
      });

      let unlockedTitle: { name: string } | null = null;
      let justCompleted = false;

      // --- 3e. 達成したかチェック ---
      if (newProgress >= currentProgress.mission.targetCount) {
        console.log(`[updateDailyMissionProgress] Mission ${missionId} completed for user ${userId}!`);
        justCompleted = true;

        // --- 3f. 完了フラグを立てる ---
        await tx.userDailyMissionProgress.update({
           where: {
            userId_missionId_date: {
              userId: userId,
              missionId: missionId,
              date: missionDate,
            },
          },
          data: {
            isCompleted: true,
          },
        });

        // --- 3g. XPを付与 ---
        // grantXpToUser を直接呼び出す代わりに、XP加算ロジックをトランザクション内で実行
        // (注意: grantXpToUser 内の称号付与ロジックもここに含める必要があります)
        grantXpToUser(userId, currentProgress.mission.xpReward).then(({ unlockedTitle: title }) => {
          unlockedTitle = title;
        });

      } 

      // トランザクションの結果を返す
      return { justCompleted, unlockedTitle };

    }); // --- トランザクション終了 ---

    // トランザクション結果に応じたレスポンスを返す
    if (result === null) {
      // 既に完了していた場合
      return { success: true, completed: true, message: '既に達成済みです。' };
    } else {
      // 更新が成功した場合
      return { success: true, completed: result.justCompleted, unlockedTitle: result.unlockedTitle };
    }

  } catch (error: any) {
    // レコードが見つからない場合(findUniqueOrThrow)やその他のエラー
    if (error.code === 'P2025') { // Prisma の RecordNotFound エラーコード
        console.error(`[updateDailyMissionProgress] Error: Progress record not found for mission ${missionId}, user ${userId}, date ${missionDate.toISOString().split('T')[0]}. Ensure ensureDailyMissionProgress was called.`);
        return { success: false, error: '本日のミッション進捗が見つかりません。' };
    }
    console.error(`[updateDailyMissionProgress] Error updating progress for mission ${missionId}, user ${userId}:`, error);
    return { success: false, error: 'ミッション進捗の更新中にエラーが発生しました。' };
  }
}


/**
 * ユーザーにXPを直接付与し、レベルアップと称号のチェックを行う。
 * (ミッション報酬など、科目XPとは無関係なXP付与に使用)
 * * @param userId - XPを付与するユーザーのID
 * @param xpAmount - 付与するXPの量
 * @returns 獲得した称号（あれば）
 */
export async function grantXpToUser(userId: number, xpAmount: number) {
  'use server';

  // 付与するXPが0以下なら何もしない
  if (xpAmount <= 0) {
    return { unlockedTitle: null };
  }

  // 複数のDB操作を安全に行うためトランザクションを使用
  const { unlockedTitle } = await prisma.$transaction(async (tx) => {
    
    // 1. ユーザーの総XPを加算
    let user = await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: xpAmount } },
    });

    let unlockedTitle: { name: string } | null = null;
    const oldLevel = user.level;
    const newAccountLevel = calculateLevelFromXp(user.xp);

    // 2. レベルアップしたかチェック
    if (newAccountLevel > oldLevel) {
      
      // 2a. ユーザーの level を更新
      user = await tx.user.update({
        where: { id: userId },
        data: { level: newAccountLevel },
      });
      console.log(`[アカウントレベルアップ!] ユーザーID:${userId} がアカウントレベル ${newAccountLevel} に！`);

      // 2b. 称号付与ロジック (USER_LEVEL)
      const userTitles = await tx.title.findMany({
        where: {
          type: TitleType.USER_LEVEL, // USER_LEVEL の称号のみ
          requiredLevel: { lte: newAccountLevel }, // 新しいレベルでアンロックされるもの
        },
      });

      for (const title of userTitles) {
        // 既にその称号を持っているか確認
        const existingUnlock = await tx.userUnlockedTitle.findUnique({
          where: { userId_titleId: { userId: userId, titleId: title.id } },
        });
        
        // 持っていなければ、新しくアンロックする
        if (!existingUnlock) {
          await tx.userUnlockedTitle.create({
            data: { userId: userId, titleId: title.id },
          });
          unlockedTitle = { name: title.name }; // 最後に獲得した称号を返す
          console.log(`[称号獲得!] ${title.name} を獲得しました！`);
        }
      }
    }
    
    return { unlockedTitle };
  });

  console.log(`ユーザーID:${userId} に ${xpAmount}XP (ミッション報酬) を付与しました。`);
  return { unlockedTitle, xpAmount };
}

/**
 * デイリーミッションの進捗を確実に作成するサーバーアクション
 * @param userId - 進捗を作成するユーザーのID
 */
export async function ensureDailyMissionProgress(userId: number) {
  'use server';

  // 0. ユーザーの存在を最初に確認
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }, // IDのみ取得して軽量化
  });

  if (!user) {
    console.error(`[ensureDailyMissionProgress] Error: User with ID ${userId} not found. Aborting mission creation.`);
    return; // ユーザーが存在しない場合は処理を中断
  }

  // 1. 日付を取得
  const missionDate = getMissionDate(); // 今日の日付

  try {
    // 2. 既存のデイリーミッションをカウント
    const existingProgressCount = await prisma.userDailyMissionProgress.count({
      where: {
        userId: userId,
        date: missionDate,
      },
    });

    // 3. デイリーミッションのが既に存在する場合は何もしない
    if (existingProgressCount > 0) {
      console.log(`ユーザーID:${userId} の ${missionDate.toISOString().split('T')[0]} 分のデイリーミッションは既に存在します。`);
      return;
    }

    // 4. マスターデータから全ミッションを取得
    const missionMasters = await prisma.dailyMissionMaster.findMany({
      select: { id: true }, // Only need the IDs
    });

    if (missionMasters.length === 0) {
      console.warn('デイリーミッションのマスターデータが見つかりません。');
      return;
    }

    // 5. 新しい進捗エントリのデータを準備
    const newProgressData = missionMasters.map((master) => ({
      userId: userId,
      missionId: master.id,
      date: missionDate,
      progress: 0,
      isCompleted: false,
    }));

    // 6. 新しい進捗エントリを一括作成
    await prisma.userDailyMissionProgress.createMany({
      data: newProgressData,
    });

    console.log(`ユーザーID:${userId} の ${missionDate.toISOString().split('T')[0]} 分のデイリーミッション (${newProgressData.length}件) を作成しました。`);

  } catch (error) {
    console.error(`ユーザーID:${userId} のデイリーミッション進捗作成中にエラーが発生しました:`, error);
    // ここでエラーを再スローするか、エラーハンドリングを行うかは要件次第
    // throw error;
  }
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

// ★ 新しする関数
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
      updateDailyMissionProgress(2, foodAmount); // デイリーミッションの進捗を更新
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
          isStarted: true, // イベント作成時は「未終了」状態にする
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

/**
 * 日々の活動を集計・更新するヘルパー関数
 */
async function upsertDailyActivity(
  userId: number,
  xpAmount: number,
  timeSpentMs: number
) {
  // 1. 「今日の日付」を取得します（JSTを考慮）
  // タイムゾーンをJST（UTC+9）に設定
  const jstOffset = 9 * 60 * 60 * 1000;
  const todayJST = new Date(Date.now() + jstOffset);
  
  // JSTでの「YYYY-MM-DD」の文字列を元に、UTCの「日付」オブジェクトを作成
  // (例: '2025-10-25' -> 2025-10-25 00:00:00 UTC)
  // これにより、@db.Date 型に正しく保存されます
  const todayDate = new Date(todayJST.toISOString().split('T')[0]);

  try {
    await prisma.dailyActivitySummary.upsert({
      where: {
        userId_date: {
          userId: userId,
          date: todayDate,
        },
      },
      // 該当する日付のデータがなければ、新しいレコードを作成
      create: {
        userId: userId,
        date: todayDate,
        totalXpGained: xpAmount,
        totalTimeSpentMs: BigInt(timeSpentMs),
        problemsCompleted: 1,
      },
      // 該当する日付のデータがあれば、既存の値に加算
      update: {
        totalXpGained: { increment: xpAmount },
        totalTimeSpentMs: { increment: BigInt(timeSpentMs) },
        problemsCompleted: { increment: 1 },
      },
    });
    console.log(`[ActivitySummary] ユーザーID:${userId} の ${todayDate.toISOString().split('T')[0]} の活動を更新しました。`);
  } catch (error) {
    console.error(`[ActivitySummary] ユーザーID:${userId} の活動更新に失敗:`, error);
  }
}

/**
 * 学習時間を記録するサーバーアクション
 * @param timeSpentMs ページ滞在時間 (ミリ秒)
 */
export async function recordStudyTimeAction(timeSpentMs: number) {
  'use server'; // サーバーアクションであることを明示

  const session = await getIronSession<{ user?: { id: string } }>(await cookies(), sessionOptions);
  const user = session.user;

  if (!user?.id) {
    // ログインしていない場合はエラーを返すか、何もしない
    console.warn('[recordStudyTimeAction] User not authenticated.');
    return { error: 'Authentication required.' };
    // throw new Error('Authentication required.'); // エラーを投げるとクライアント側でcatchが必要
  }

  const userId = Number(user.id);
  if (isNaN(userId)) {
    console.error('[recordStudyTimeAction] Invalid user ID in session.');
    return { error: 'Invalid user session.' };
    // throw new Error('Invalid user session.');
  }

  // 時間が有効な数値か基本的なチェック
  if (typeof timeSpentMs !== 'number' || timeSpentMs <= 0 || isNaN(timeSpentMs)) {
    console.warn(`[recordStudyTimeAction] Invalid timeSpentMs received: ${timeSpentMs}`);
    return { error: 'Invalid time value.' };
    // throw new Error('Invalid time value.');
  }

  console.log(`[recordStudyTimeAction] Recording ${timeSpentMs}ms for UserID:${userId}`);

    try {
    // upsertDailyActivityを呼び出し、時間だけを加算 (XP=0)
    await upsertDailyActivity(userId, 0, timeSpentMs);
    return { success: true, message: 'Study time recorded.' };
  } catch (error) {
    console.error('[recordStudyTimeAction] Failed to update daily activity:', error);
    return { error: 'Failed to record study time.' };
    // throw new Error('Failed to record study time.');
  }
}

/**
 * イベントを開始または終了するサーバーアクション
 * @param eventId 対象のイベントID
 * @param start trueで開始、falseで終了
 */
export async function toggleEventStatusAction(eventId: number, start: boolean) {
  'use server';
  const session = await getIronSession<{ user?: { id: string } }>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return { error: 'ログインしていません。' };
  }
  const userId = Number(session.user.id);

  const event = await prisma.create_event.findUnique({ where: { id: eventId } });
  if (!event || event.creatorId !== userId) {
    return { error: 'このイベントを操作する権限がありません。' };
  }

  let dataToUpdate: { isStarted: boolean; startTime?: Date; hasBeenStarted?: boolean } = { isStarted: start };

  // イベントを開始する場合
  if (start) {
    // 現在時刻が設定上の開始時刻より前の場合、開始時刻を現在時刻に上書きして強制開始する
    if (event.startTime && new Date() < new Date(event.startTime)) {
      dataToUpdate.startTime = new Date();
    }
    // 「開始済み」フラグを立てる
    dataToUpdate.hasBeenStarted = true;
  }

  try {
    await prisma.create_event.update({
      where: { id: eventId },
      data: dataToUpdate,
    });
    revalidatePath(`/event/event_detail/${eventId}`);
    return { success: true };
  } catch (error) {
    return { error: 'イベント状態の更新に失敗しました。' };
  }
}

/**
 * イベントを削除するサーバーアクション
 * @param eventId 削除対象のイベントID
 */
export async function deleteEventAction(eventId: number) {
  'use server';
  const session = await getIronSession<{ user?: { id: string } }>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return { error: 'ログインしていません。' };
  }
  const userId = Number(session.user.id);

  // 削除対象のイベントを取得し、作成者であることを確認
  const event = await prisma.create_event.findUnique({
    where: { id: eventId },
    select: { creatorId: true },
  });

  if (!event) {
    return { error: 'イベントが見つかりません。' };
  }

  if (event.creatorId !== userId) {
    return { error: 'このイベントを削除する権限がありません。' };
  }

  // 関連データも onDelele: Cascade により自動で削除される
  await prisma.create_event.delete({ where: { id: eventId } });

  revalidatePath('/event/event_list');
  return { success: true };
}

/**
 * JST（日本標準時）の「日付」オブジェクトを取得するヘルパー関数
 * @param daysAgo 0 = JSTの今日, 1 = JSTの昨日
 */
function getJstDate(daysAgo: number = 0): Date {
  const jstOffset = 9 * 60 * 60 * 1000;
  const targetJST = new Date(Date.now() + jstOffset);
  targetJST.setDate(targetJST.getDate() - daysAgo);
  return new Date(targetJST.toISOString().split('T')[0]);
}

/**
 * ペットの名前を更新するサーバーアクション
 * @param newName 新しいペットの名前
 */
export async function updatePetName(newName: string) {
  // 1. セッションからユーザーIDを取得
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const user = session.user;

  if (!user?.id) {
    return { error: '認証されていません。' };
  }
  const userId = Number(user.id);
  
  // 2. バリデーション
  const trimmedName = newName.trim();
  if (trimmedName.length === 0 || trimmedName.length > 20) {
    return { error: '名前は1文字以上20文字以下である必要があります。' };
  }

  // 3. データベースを更新
  try {
    await prisma.status_Kohaku.update({
      where: { user_id: userId }, // ログイン中のユーザーのペットを更新
      data: { name: trimmedName }, // 新しい名前をセット
    });

    // 4. キャッシュをクリア
    // このペットコンポーネントが表示されているページのパスを指定 (例: '/dashboard' や '/')
    revalidatePath('/profile'); // 
    
    return { success: true };

  } catch (error) {
    console.error('ペットの名前更新に失敗しました:', error);
    return { error: 'データベースエラーで名前を変更できませんでした。' };
  }
}