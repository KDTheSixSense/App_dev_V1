// /workspaces/my-next-app/src/lib/actions/problem.ts

'use server'; // サーバーアクションとして定義 (クライアントから関数として呼び出し可能)

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { getNowJST, isSameAppDay } from '@/lib/dateUtils';
import type { Problem as SerializableProblem } from '@/lib/types';
import { TitleType } from '@prisma/client';
import { calculateLevelFromXp } from '@/lib/leveling';
import { checkAndSaveEvolution } from '@/lib/evolutionActions';
import {
    updateDailyMissionProgress,
    feedPetAction,
    upsertDailyActivity,
    updateUserLoginStats
} from './user';

// -----------------------------------------------------------------------------
// ヘルパー関数: DBの問題データをフロントエンドで扱いやすい型に変換
// -----------------------------------------------------------------------------
const convertToSerializableProblem = (dbProblem: any): SerializableProblem | undefined => {
    if (!dbProblem) {
        return undefined;
    }
    return {
        id: String(dbProblem.id),
        logicType: 'CODING_PROBLEM', // 現状はコーディング問題として固定
        title: { ja: dbProblem.title, en: dbProblem.title },
        description: { ja: dbProblem.description, en: dbProblem.description },
        // コードテンプレートを行ごとの配列に変換
        programLines: {
            ja: (dbProblem.codeTemplate || '').split('\n'),
            en: (dbProblem.codeTemplate || '').split('\n'),
        },
        answerOptions: { ja: [], en: [] }, // 選択肢はないため空配列
        correctAnswer: dbProblem.sampleCases?.[0]?.expectedOutput || '',
        explanationText: {
            ja: dbProblem.sampleCases?.[0]?.description || '解説は準備中です。',
            en: dbProblem.sampleCases?.[0]?.description || 'Explanation is not ready yet.',
        },
        sampleCases: dbProblem.sampleCases || [],
        initialVariables: {},
        traceLogic: [],
        tags: JSON.parse(dbProblem.tags || '[]'), // JSON文字列をパース
    };
};

// -----------------------------------------------------------------------------
// Action: 問題IDから詳細データを取得 (コーディング問題用)
// -----------------------------------------------------------------------------
export async function getProblemByIdAction(problemId: string): Promise<SerializableProblem | undefined> {
    const id = parseInt(problemId, 10);
    if (isNaN(id)) {
        console.error('Invalid problem ID:', problemId);
        return undefined;
    }

    try {
        // 問題データ本体と、関連するサンプルケース・テストケースを一括取得
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

// -----------------------------------------------------------------------------
// Action: 次の問題IDを取得 (「次の問題へ」ボタン用)
// -----------------------------------------------------------------------------
export async function getNextProblemId(currentId: number, category: string): Promise<number | null> {
    try {
        let problemIds: { id: number }[] = [];

        // カテゴリに応じて対象テーブルを切り替え、全IDを取得
        // ※データ量が増えると重くなる可能性があるため、将来的に最適化が推奨される箇所です
        if (category === 'basic_info_b_problem') {
            const [staticIds, algoIds] = await Promise.all([
                prisma.questions.findMany({ select: { id: true } }),
                prisma.questions_Algorithm.findMany({
                    where: { subject: { name: '基本情報B問題' } },
                    select: { id: true },
                }),
            ]);
            problemIds = [...staticIds, ...algoIds];
        } else if (category === 'basic_info_a_problem') {
            problemIds = await prisma.basic_Info_A_Question.findMany({ select: { id: true } });
        } else if (category === 'applied_info_morning_problem') {
            problemIds = await prisma.applied_am_Question.findMany({ select: { id: true } });
        } else {
            problemIds = await prisma.questions_Algorithm.findMany({
                where: { subject: { name: category } },
                select: { id: true },
            });
        }

        // IDリストをソートし、現在のIDの次を探す
        const allIds = problemIds.map(p => p.id);
        const sortedUniqueIds = [...new Set(allIds)].sort((a, b) => a - b);
        const currentIndex = sortedUniqueIds.indexOf(currentId);

        if (currentIndex === -1 || currentIndex >= sortedUniqueIds.length - 1) {
            return null; // 次の問題がない場合
        }

        return sortedUniqueIds[currentIndex + 1];

    } catch (error) {
        console.error("Failed to get next problem ID:", error);
        return null;
    }
}

// -----------------------------------------------------------------------------
// Action: 正解時の処理 (XP付与、履歴記録、ペット育成、ミッション達成など)
// -----------------------------------------------------------------------------
export async function awardXpForCorrectAnswer(problemId: number, eventId: number | undefined, subjectid?: number, problemStartedAt?: string | number) {
    'use server';

    // 1. 認証チェック
    const session = await getSession();
    const user = session.user;

    if (!user) {
        throw new Error('認証されていません。ログインしてください。');
    }

    const userId = user.id;
    if (!userId) {
        throw new Error('セッション内のユーザーIDが無効です。');
    }

    if (subjectid === undefined) {
        throw new Error(`SubjectIDが提供されていません。どの科目の問題か判別できません。`);
    }

    const nowJST = getNowJST();

    // 2. 問題情報の取得と重複正解チェック
    // 科目ID (subjectid) に応じてテーブルを切り替える必要があるため、if-elseで分岐
    let difficultyId: number | undefined;
    let alreadyCorrectToday = false; // 本日既に正解しているか？
    let hasSolvedInPast = false;     // 今日より前に正解したことがあるか？
    let userAnswerForeignKeyData: any = {}; // 回答履歴テーブルへの外部キー設定用
    let createdByUser = false; // ユーザー自作問題か？

    // --- 各科目ごとの分岐処理 ---
    if (subjectid === 1) { // プログラミング問題
        const problem = await prisma.programmingProblem.findUnique({
            where: { id: problemId },
            select: { difficulty: true, createdBy: true }
        });
        difficultyId = problem?.difficulty;
        userAnswerForeignKeyData = { programingProblem_id: problemId };

        if (problem?.createdBy) {
            createdByUser = true;
        }

        // 直近の正解履歴を確認し、今日の日付ならフラグを立てる
        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, programingProblem_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer) {
            if (isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
                alreadyCorrectToday = true;
            } else {
                hasSolvedInPast = true; // 今日ではないが履歴がある = 過去に解いている
            }
        }

    } else if (subjectid === 2) { // 基本情報A問題
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
        if (lastCorrectAnswer) {
            if (isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
                alreadyCorrectToday = true;
            } else {
                hasSolvedInPast = true; // 今日ではないが履歴がある = 過去に解いている
            }
        }

    } else if (subjectid === 3) { // アルゴリズム問題
        const problem = await prisma.questions_Algorithm.findUnique({
            where: { id: problemId },
            select: { difficultyId: true }
        });
        difficultyId = problem?.difficultyId;
        userAnswerForeignKeyData = { questions_algorithm_id: problemId };

        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, questions_algorithm_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer) {
            if (isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
                alreadyCorrectToday = true;
            } else {
                hasSolvedInPast = true; // 今日ではないが履歴がある = 過去に解いている
            }
        }
    } else if (subjectid === 4) { // 選択式問題 (自作問題含む)
        const problem = await prisma.selectProblem.findUnique({
            where: { id: problemId },
            select: { difficultyId: true, createdBy: true }
        });
        difficultyId = problem?.difficultyId;
        userAnswerForeignKeyData = { selectProblem_id: problemId };

        if (problem?.createdBy) {
            createdByUser = true;
        }
        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, selectProblem_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer) {
            if (isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
                alreadyCorrectToday = true;
            } else {
                hasSolvedInPast = true; // 今日ではないが履歴がある = 過去に解いている
            }
        }
    } else if (subjectid === 5) { // 応用情報午前問題
        const problem = await prisma.applied_am_Question.findUnique({
            where: { id: problemId },
            select: { difficultyId: true }
        });
        difficultyId = problem?.difficultyId;
        userAnswerForeignKeyData = { applied_am_question_id: problemId };

        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, applied_am_question_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer) {
            if (isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
                alreadyCorrectToday = true;
            } else {
                hasSolvedInPast = true; // 今日ではないが履歴がある = 過去に解いている
            }
        }
    } else { // その他 (デフォルト: Algorithm)
        const problem = await prisma.questions_Algorithm.findUnique({
            where: { id: problemId },
            select: { difficultyId: true }
        });
        difficultyId = problem?.difficultyId;
        userAnswerForeignKeyData = { questions_id: problemId };

        const lastCorrectAnswer = await prisma.userAnswer.findFirst({
            where: { userId, isCorrect: true, questions_id: problemId },
            orderBy: { answeredAt: 'desc' }
        });
        if (lastCorrectAnswer) {
            if (isSameAppDay(lastCorrectAnswer.answeredAt, new Date())) {
                alreadyCorrectToday = true;
            } else {
                hasSolvedInPast = true; // 今日ではないが履歴がある = 過去に解いている
            }
        }
    }

    if (!difficultyId) {
        throw new Error(`問題ID:${problemId} (科目ID:${subjectid}) が見つかりません、またはdifficultyIdが設定されていません。`);
    }

    // 3. 既に本日正解済みの場合はここで終了
    if (alreadyCorrectToday) {
        console.log(`ユーザーID:${userId} は本日既に問題ID:${problemId}に正解済みです。`);
        return { message: '既に正解済みです。' };
    }

    // 4. 獲得XPと学習時間の計算
    let xpAmount = 0;
    let timeSpentMs = 0;

    const difficulty = await prisma.difficulty.findUnique({
        where: { id: difficultyId },
    });
    if (difficulty) {
        xpAmount = difficulty.xp;
        // 過去に正解済みなら 0.75倍 する (Math.floorで整数に丸める)
        if (hasSolvedInPast) {
            xpAmount = Math.floor(xpAmount * 0.75);
            console.log(`ユーザーID:${userId} は過去にこの問題を解いているため、XPが0.75倍(${xpAmount})になります。`);
        }
    }

    // 開始時刻が渡されている場合、経過時間を計算
    if (typeof problemStartedAt !== 'undefined' && problemStartedAt !== null) {
        try {
            const startTime = typeof problemStartedAt === 'number'
                ? problemStartedAt
                : Date.parse(String(problemStartedAt));

            if (!isNaN(startTime)) {
                const endTime = Date.now();
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

    // 5. 日々の活動記録(Activity)を更新
    upsertDailyActivity(userId, xpAmount, timeSpentMs);

    // 初めての回答かどうかを判定 (チュートリアル用など)
    const totalAnswerCount = await prisma.userAnswer.count({ where: { userId } });
    const isFirstAnswerEver = (totalAnswerCount === 0);

    // 6. デイリーミッション進行 (問題を解いた数)
    updateDailyMissionProgress(1, 1);

    if (!subjectid) {
        subjectid = 0;
    }

    let unlockedTitle = undefined;

    // 7. 自作問題でなければ、XP付与とペットの世話を行う
    if (!createdByUser) {
        // XP付与、レベルアップ、称号判定
        const result = await addXp(userId, subjectid || 0, xpAmount );
        unlockedTitle = result.unlockedTitle;
        const updatedUser = result.updatedUser;
        const isLevelUp = result.isLevelUp;
        const previousLevel = result.previousLevel;

        // ペットに餌をやる (難易度に応じて)
        await feedPetAction(difficultyId);

        // 8. 進化判定 (レベルアップ時かつ30の倍数到達時)
        if (updatedUser && isLevelUp) {
            const currentLevel = updatedUser.level;
            const milestone = 30;
            if (Math.floor(currentLevel / milestone) > Math.floor(previousLevel / milestone)) {
                const evolutionLevel = Math.floor(currentLevel / milestone) * milestone;
                await checkAndSaveEvolution(userId, evolutionLevel);
                // 画面更新
                revalidatePath('/profile');
                revalidatePath('/home');
                revalidatePath('/', 'layout');
            }
        }
    }

    // 9. イベント開催中ならイベントスコア加算
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

    // 10. ログイン統計の更新と回答履歴の保存
    await updateUserLoginStats(userId);

    await prisma.userAnswer.create({
        data: {
            userId: userId,
            isCorrect: true,
            answer: 'CORRECT',
            answeredAt: new Date(),
            ...userAnswerForeignKeyData // 適切なカラムに問題IDを入れる
        },
    });

    console.log(`ユーザーID:${userId} が問題ID:${problemId} (科目ID:${subjectid}) に正解し、XPを獲得しました。`);

    // 11. 初回正解時のみ、ペットの空腹度タイマーを開始
    if (isFirstAnswerEver) {
        await prisma.status_Kohaku.updateMany({
            where: { user_id: userId },
            data: {
                hungerLastUpdatedAt: nowJST,
            },
        });
        console.log(`ユーザーID:${userId} のペットの満腹度タイマーを開始しました。`);
    }

    return { message: '経験値を獲得しました！', unlockedTitle };
}

// -----------------------------------------------------------------------------
// Action: 回答履歴のみを記録 (不正解時などXPが発生しない場合に使用)
// -----------------------------------------------------------------------------
export async function recordAnswerAction(problemId: number, subjectid: number, isCorrect: boolean, answer: string) {
    'use server';

    const session = await getSession();
    const userId = session.user?.id;

    if (!userId) {
        throw new Error('User not authenticated');
    }

    let userAnswerForeignKeyData = {};
    if (subjectid === 1) userAnswerForeignKeyData = { programingProblem_id: problemId };
    else if (subjectid === 2) userAnswerForeignKeyData = { basic_A_Info_Question_id: problemId };
    else if (subjectid === 3) userAnswerForeignKeyData = { questions_algorithm_id: problemId };
    else if (subjectid === 4) userAnswerForeignKeyData = { selectProblem_id: problemId };
    else if (subjectid === 5) userAnswerForeignKeyData = { applied_am_question_id: problemId };
    else userAnswerForeignKeyData = { questions_id: problemId };

    await prisma.userAnswer.create({
        data: {
            userId,
            isCorrect,
            answer,
            answeredAt: new Date(),
            ...userAnswerForeignKeyData
        }
    });
}

// -----------------------------------------------------------------------------
// Action: XPを加算し、科目レベル・ユーザーレベル・称号を更新する (トランザクション処理)
// -----------------------------------------------------------------------------
export async function addXp(user_id: string, subject_id: number, xpAmount: number) {
    const nowJST = getNowJST();

    console.log(` ${xpAmount}xpを付与`);

    // ミッション更新: 「XPを獲得する」系
    updateDailyMissionProgress(3, xpAmount);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. 科目ごとの進捗(XP)を更新
        const updatedProgress = await tx.userSubjectProgress.upsert({
            where: { user_id_subject_id: { user_id, subject_id } },
            create: { user_id, subject_id, xp: xpAmount, level: 1 },
            update: { xp: { increment: xpAmount } },
        });

        let unlockedTitle: { name: string } | null = null;

        // 2. 科目レベルの再計算と更新
        const newSubjectLevel = calculateLevelFromXp(updatedProgress.xp);
        if (newSubjectLevel > updatedProgress.level) {
            await tx.userSubjectProgress.update({
                where: { user_id_subject_id: { user_id, subject_id } },
                data: { level: newSubjectLevel },
            });
            console.log(`[科目レベルアップ!] subjectId:${subject_id} がレベル ${newSubjectLevel} に！`);
        }

        // 3. 科目レベル条件の称号チェック
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
                        data: { userId: user_id, titleId: title.id, unlockedAt: nowJST },
                    });
                    unlockedTitle = { name: title.name };
                    console.log(`[称号獲得!] ${title.name} を獲得しました！`);
                }
            }
        }

        // 4. ユーザー全体のXP更新とレベルアップ判定
        let user = await tx.user.update({
            where: { id: user_id },
            data: { xp: { increment: xpAmount } },
        });
        const previousLevel = user.level;
        const newAccountLevel = calculateLevelFromXp(user.xp);
        let isLevelUp = false;
        
        if (newAccountLevel > user.level) {
            isLevelUp = true;
            user = await tx.user.update({
                where: { id: user_id },
                data: { level: newAccountLevel },
            });
            console.log(`[アカウントレベルアップ!] ${user.username} がアカウントレベル ${newAccountLevel} に！`);

            // 5. ユーザーレベル条件の称号チェック
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
                            data: { userId: user_id, titleId: title.id, unlockedAt: nowJST },
                        });
                        unlockedTitle = { name: title.name };
                        console.log(`[称号獲得!] ${title.name} を獲得しました！`);
                    }
                }
            }
        }

        return { updatedUser: user, updatedProgress, unlockedTitle, isLevelUp, previousLevel };
    });

    return result;
}

// -----------------------------------------------------------------------------
// Action: プログラミング問題の次のIDを取得 (管理用)
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Action: プログラミング問題の削除 (自作問題用)
// -----------------------------------------------------------------------------
export async function deleteProblemAction(formData: FormData) {
    'use server';

    const session = await getSession();
    const user = session.user;

    if (!user?.id) {
        throw new Error('認証が必要です。');
    }

    const userId = user.id;

    const problemIdStr = formData.get('problemId');
    if (typeof problemIdStr !== 'string') {
        throw new Error('無効な問題IDです。');
    }

    const problemId = Number(problemIdStr);
    if (isNaN(problemId)) {
        throw new Error('問題IDが数値ではありません。');
    }

    try {
        const problem = await prisma.programmingProblem.findUnique({
            where: {
                id: problemId,
            },
            select: {
                createdBy: true,
            },
        });

        if (!problem || problem.createdBy !== userId) {
            throw new Error('この問題を削除する権限がありません。');
        }

        await prisma.programmingProblem.delete({
            where: {
                id: problemId,
            },
        });

        revalidatePath('/issue_list/mine_issue_list/problems');

        console.log(`ユーザーID:${userId} が 問題ID:${problemId} を削除しました。`);

    } catch (error) {
        console.error('問題の削除中にエラーが発生しました:', error);
    }
}

// -----------------------------------------------------------------------------
// Action: 自分が作成したプログラミング問題の一覧取得
// -----------------------------------------------------------------------------
export async function getMineProblems() {
    'use server';
    try {
        const session = await getSession();
        const user = session.user;

        if (!user || !user.id) {
            return { error: '認証が必要です。ログインしてください。' };
        }

        const userId = user.id;
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

// -----------------------------------------------------------------------------
// Action: 自分が作成した選択式問題の一覧取得
// -----------------------------------------------------------------------------
export async function getMineSelectProblems() {
    'use server';
    try {
        const session = await getSession();
        const user = session.user;

        if (!user || !user.id) {
            return { error: '認証が必要です。ログインしてください。' };
        }

        const userId = user.id;

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

// -----------------------------------------------------------------------------
// Action: 選択式問題の削除
// -----------------------------------------------------------------------------
export async function deleteSelectProblemAction(formData: FormData) {
    'use server';

    const session = await getSession();
    const user = session.user;

    if (!user?.id) {
        throw new Error('認証が必要です。');
    }
    const userId = user.id;

    const problemIdStr = formData.get('problemId');
    if (typeof problemIdStr !== 'string') {
        throw new Error('無効な問題IDです。');
    }
    const problemId = Number(problemIdStr);

    try {
        const problem = await prisma.selectProblem.findUnique({
            where: { id: problemId },
            select: { createdBy: true },
        });

        if (!problem || problem.createdBy !== userId) {
            throw new Error('この問題を削除する権限がありません。');
        }

        await prisma.selectProblem.delete({
            where: { id: problemId },
        });

        revalidatePath('/issue_list/mine_issue_list/problems');

    } catch (error) {
        console.error('選択問題の削除中にエラーが発生しました:', error);
    }
}

// -----------------------------------------------------------------------------
// Action: 選択式問題の詳細取得 (編集用)
// -----------------------------------------------------------------------------
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

        if (problem.createdBy !== session.user.id) {
            return { error: 'この問題の編集権限がありません。' };
        }

        return { data: problem };
    } catch (error) {
        console.error("Failed to fetch select problem:", error);
        return { error: '問題の取得に失敗しました。' };
    }
}

// -----------------------------------------------------------------------------
// Action: 選択式問題の更新
// -----------------------------------------------------------------------------
export async function updateSelectProblemAction(formData: FormData) {
    'use server';
    try {
        const session = await getSession();
        const user = session.user;
        if (!user) {
            return { error: '認証が必要です。' };
        }

        // フォームデータの取得と型変換
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

        // 権限チェック
        const existingProblem = await prisma.selectProblem.findUnique({ where: { id: problemId } });
        if (!existingProblem || existingProblem.createdBy !== user.id) {
            return { error: 'この問題を更新する権限がありません。' };
        }

        // 更新実行
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

        revalidatePath('/issue_list/mine_issue_list/problems');
        return { success: true, problem: updatedProblem };

    } catch (error) {
        console.error('Error updating select problem:', error);
        return { error: '問題の更新中にエラーが発生しました。' };
    }
}