'use server';

import { prisma } from "@/lib/prisma";

export async function getSubmissionDetailAction(submissionId: number) {
    try {
        const submission = await prisma.event_Submission.findUnique({
            where: {
                id: submissionId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        icon: true,
                        email: true,
                    }
                },
                eventIssue: {
                    include: {
                        problem: true
                    }
                }
            }
        });

        if (!submission) {
            return { error: '提出が見つかりませんでした。' };
        }

        return { success: true, submission };
    } catch (error) {
        console.error("Error fetching submission details:", error);
        return { error: 'データの取得に失敗しました。' };
    }
}

export async function getParticipantSubmissionsAction(eventId: number, userId: string) {
    try {
        const submissions = await prisma.event_Submission.findMany({
            where: {
                eventIssue: {
                    eventId: eventId
                },
                userId: userId
            },
            include: {
                eventIssue: {
                    include: {
                        problem: true
                    }
                }
            },
            orderBy: {
                submittedAt: 'desc'
            }
        });

        return { success: true, submissions };
    } catch (error) {
        console.error("Error fetching participant submissions:", error);
        return { error: 'データの取得に失敗しました。' };
    }
}

export async function getRecentEventActivityAction(eventId: number) {
    try {
        const recentSubmissions = await prisma.event_Submission.findMany({
            where: {
                eventIssue: {
                    eventId: eventId
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        icon: true,
                    }
                },
                eventIssue: {
                    include: {
                        problem: {
                            select: {
                                title: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                submittedAt: 'desc'
            },
            take: 10
        });

        return { success: true, submissions: recentSubmissions };
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return { error: 'アクティビティの取得に失敗しました。' };
    }
}
