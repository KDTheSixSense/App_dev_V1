'use server';

import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session-config';
import { cookies } from 'next/headers';

// Define the shape of the history item for the frontend
export type HistoryItem = {
    id: string;
    dbId: number;
    type: 'basic_a' | 'basic_b' | 'applied_am' | 'programming' | 'select' | 'unknown';
    title: string;
    isCorrect: boolean;
    answeredAt: Date;
    category: string;
};

export type HistoryStatistics = {
    totalQuestions: number;
    totalCorrect: number;
    accuracy: number;
    byCategory: Record<string, { total: number; correct: number; accuracy: number }>;
};

type FetchHistoryParams = {
    startDate?: Date;
    endDate?: Date;
};

export async function getUserHistory(params: FetchHistoryParams = {}) {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.user) {
        throw new Error('Unauthorized');
    }

    const userId = session.user.id;
    const { startDate, endDate } = params;

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;
    const hasDateFilter = startDate || endDate;

    try {
        // 1. Fetch from UserAnswer (for most question types)
        const userAnswers = await prisma.userAnswer.findMany({
            where: {
                userId: userId,
                answeredAt: hasDateFilter ? dateFilter : undefined,
            },
            include: {
                programmingProblem: true,
                basic_A_Info_Question: {
                    include: { category: true }
                },
                questions: true,
                selectProblem: true,
                applied_am_question: {
                    include: { category: true }
                },
            },
            orderBy: {
                answeredAt: 'desc',
            },
        });

        // 2. Fetch from Answer_Algorithm (for Basic Info B Excel/Detailed questions)
        const algoAnswers = await prisma.answer_Algorithm.findMany({
            where: {
                userId: userId,
                answeredAt: hasDateFilter ? dateFilter : undefined,
            },
            include: {
                question: true
            },
            orderBy: {
                answeredAt: 'desc'
            }
        });

        // Normalize UserAnswers
        const normalizedUserAnswers: HistoryItem[] = userAnswers.map((ua) => {
            let type: HistoryItem['type'] = 'unknown';
            let title = '不明な問題';
            let category = '未分類';

            // Check which relation is present
            if (ua.programmingProblem) {
                type = 'programming';
                title = ua.programmingProblem.title;
                category = ua.programmingProblem.category || 'プログラミング';
            } else if (ua.basic_A_Info_Question) {
                type = 'basic_a';
                title = ua.basic_A_Info_Question.title;
                category = ua.basic_A_Info_Question.category?.name || '基本情報A';
            } else if (ua.questions) {
                type = 'basic_b';
                title = ua.questions.title;
                category = '基本情報B (サンプル)';
            } else if (ua.selectProblem) {
                type = 'select';
                title = ua.selectProblem.title;
                category = '選択問題';
            } else if (ua.applied_am_question) {
                type = 'applied_am';
                title = ua.applied_am_question.title;
                category = ua.applied_am_question.category?.name || '応用情報午前';
            }

            return {
                id: `ua-${ua.id}`,
                dbId: ua.id,
                type,
                title,
                isCorrect: ua.isCorrect,
                answeredAt: ua.answeredAt,
                category
            };
        });

        // Normalize Algorithm Answers
        const normalizedAlgoAnswers: HistoryItem[] = algoAnswers.map((aa) => {
            return {
                id: `aa-${aa.id}`,
                dbId: aa.id,
                type: 'basic_b',
                title: aa.question.title,
                isCorrect: aa.isCorrect,
                answeredAt: aa.answeredAt,
                category: '基本情報B (応用)'
            };
        });

        // Combine and Sort
        const allHistory = [...normalizedUserAnswers, ...normalizedAlgoAnswers];
        allHistory.sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime());

        // Calculate Statistics
        const totalQuestions = allHistory.length;
        const totalCorrect = allHistory.filter(h => h.isCorrect).length;
        const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

        const byCategory: HistoryStatistics['byCategory'] = {};

        for (const item of allHistory) {
            if (!byCategory[item.type]) {
                byCategory[item.type] = { total: 0, correct: 0, accuracy: 0 };
            }
            const catStat = byCategory[item.type];
            catStat.total++;
            if (item.isCorrect) {
                catStat.correct++;
            }
        }

        // Finalize accuracy for categories
        for (const key in byCategory) {
            const catStat = byCategory[key];
            if (catStat.total > 0) {
                catStat.accuracy = (catStat.correct / catStat.total) * 100;
            }
        }

        return {
            items: allHistory,
            statistics: {
                totalQuestions,
                totalCorrect,
                accuracy,
                byCategory
            }
        };

    } catch (error) {
        console.error('Failed to fetch user history:', error);
        // Do not expose internal error details to client
        throw new Error('履歴データの取得に失敗しました。');
    }
}
