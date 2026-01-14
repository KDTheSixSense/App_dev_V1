'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface CreateEventFormData {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    publicTime: string;
    selectedProblemIds: number[];
}

export async function createEventAction(data: CreateEventFormData) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) {
        return { error: 'ログインしていません。' };
    }
    const userId = session.user.id;

    const { title, description, startTime, endTime, publicTime, selectedProblemIds } = data;

    if (!title || !description || !startTime || !endTime || !publicTime) {
        return { error: '必須項目（基本設定）が不足しています。' };
    }
    if (selectedProblemIds.length === 0) {
        return { error: 'プログラミング問題を1つ以上選択してください。' };
    }

    try {
        const inviteCode = nanoid(10);

        const newEvent = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const event = await tx.create_event.create({
                data: {
                    title: title,
                    description: description,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    publicTime: new Date(publicTime),
                    inviteCode: inviteCode,
                    publicStatus: true,
                    isStarted: true,
                    creatorId: userId,
                },
            });

            const issueListData = selectedProblemIds.map(problemId => ({
                eventId: event.id,
                problemId: problemId,
            }));
            await tx.event_Issue_List.createMany({
                data: issueListData,
            });

            await tx.event_Participants.create({
                data: {
                    eventId: event.id,
                    userId: userId,
                    isAdmin: true,
                },
            });

            return event;
        });

        revalidatePath('/event/event_list');
        return { success: true, eventId: newEvent.id };

    } catch (error) {
        console.error('イベント作成に失敗しました:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return { error: 'データベースエラーが発生しました。' };
        }
        return { error: 'イベントの作成に失敗しました。' };
    }
}

interface EventFormData {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    publicTime: string;
    selectedProblemIds: number[];
}

export async function saveEventDraftAction(data: EventFormData) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) {
        return { error: 'ログインしていません。' };
    }
    const userId = session.user.id;

    const { title, description, startTime, endTime, publicTime, selectedProblemIds } = data;

    if (!title) {
        return { error: '下書きを保存するには、イベントタイトル名が必須です。' };
    }

    try {
        const inviteCode = nanoid(10);

        const newDraftEvent = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const event = await tx.create_event.create({
                data: {
                    title: title,
                    description: description || '',
                    startTime: startTime ? new Date(startTime) : null,
                    endTime: endTime ? new Date(endTime) : null,
                    publicTime: publicTime ? new Date(publicTime) : null,
                    inviteCode: inviteCode,
                    publicStatus: false,
                    creator: {
                        connect: {
                            id: userId
                        }
                    }
                },
            });

            if (selectedProblemIds.length > 0) {
                const issueListData = selectedProblemIds.map(problemId => ({
                    eventId: event.id,
                    problemId: problemId,
                }));
                await tx.event_Issue_List.createMany({
                    data: issueListData,
                });
            }

            await tx.event_Participants.create({
                data: {
                    eventId: event.id,
                    userId: userId,
                    isAdmin: true,
                },
            });

            return event;
        });

        return { success: true, message: '下書きを保存しました。' };

    } catch (error) {
        console.error('saveEventDraftAction Error:', error);
        return { error: '下書きの保存に失敗しました。' };
    }
}

export async function getMyDraftEventsAction() {
    'use server';
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) {
        return { error: 'ログインしていません。' };
    }
    const userId = session.user.id;

    try {
        const drafts = await prisma.create_event.findMany({
            where: {
                creatorId: userId,
                publicStatus: false,
            },
            select: {
                id: true,
                title: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
        return { data: drafts };
    } catch (error) {
        console.error('getMyDraftEventsAction Error:', error);
        return { error: '下書きの読み込みに失敗しました。' };
    }
}

const formatDateTimeForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    } catch (e) {
        return '';
    }
};

export async function getDraftEventDetailsAction(eventId: number) {
    'use server';
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (!session.user?.id) {
        return { error: 'ログインしていません。' };
    }
    const userId = session.user.id;

    try {
        const event = await prisma.create_event.findFirst({
            where: {
                id: eventId,
                creatorId: userId,
                publicStatus: false,
            },
            include: {
                issues: {
                    select: {
                        problemId: true,
                    },
                },
            },
        });

        if (!event) {
            return { error: '指定された下書きが見つかりません。' };
        }

        const formattedEvent = {
            title: event.title,
            description: event.description,
            startTime: formatDateTimeForInput(event.startTime),
            endTime: formatDateTimeForInput(event.endTime),
            publicTime: formatDateTimeForInput(event.publicTime),
            selectedProblemIds: event.issues.map((issue: { problemId: number }) => issue.problemId),
        };

        return { data: formattedEvent };

    } catch (error) {
        console.error('getDraftEventDetailsAction Error:', error);
        return { error: '下書きの読み込みに失敗しました。' };
    }
}

export async function toggleEventStatusAction(eventId: number, start: boolean) {
    'use server';
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.user?.id) {
            return { error: 'ログインしていません。' };
        }
        const userId = session.user.id;

        const event = await prisma.create_event.findUnique({ where: { id: eventId } });
        if (!event || event.creatorId !== userId) {
            return { error: 'このイベントを操作する権限がありません。' };
        }

        let dataToUpdate: { isStarted: boolean; startTime?: Date; hasBeenStarted?: boolean } = { isStarted: start };

        if (start) {
            if (event.startTime && new Date() < new Date(event.startTime)) {
                dataToUpdate.startTime = new Date();
            }
            dataToUpdate.hasBeenStarted = true;
        }

        await prisma.create_event.update({
            where: { id: eventId },
            data: dataToUpdate,
        });
        revalidatePath(`/event/event_detail/${eventId}`);
        return { success: true };
    } catch (error) {
        console.error('toggleEventStatusAction Error:', error);
        return { error: 'イベント状態の更新に失敗しました。' };
    }
}

export async function deleteEventAction(eventId: number) {
    'use server';
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.user?.id) {
            return { error: 'ログインしていません。' };
        }
        const userId = session.user.id;

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

        await prisma.create_event.delete({ where: { id: eventId } });

        revalidatePath('/event/event_list');
        return { success: true };

    } catch (error) {
        console.error('deleteEventAction Error:', error);
        return { error: 'イベントの削除に失敗しました。' };
    }
}

export async function acceptEventAction(eventId: number, userId: string) {
    'use server';
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.user?.id) {
            return { error: 'ログインしていません。' };
        }

        // session.user.id can be compared with userId or we can just use session.user.id to be safe
        const currentUserId = session.user.id;
        if (currentUserId !== userId) {
            return { error: 'ユーザーIDが一致しません。' };
        }

        const result = await prisma.event_Participants.updateMany({
            where: {
                eventId: eventId,
                userId: userId,
            },
            data: {
                hasAccepted: true,
            },
        });

        if (result.count === 0) {
            return { error: '参加者情報が見つかりません。' };
        }

        revalidatePath(`/event/event_detail/${eventId}`);
        return { success: true };
    } catch (error) {
        console.error('acceptEventAction Error:', error);
        return { error: '参加承認に失敗しました。' };
    }
}

export async function updateEventThemeAction(eventId: number, theme: string) {
    'use server';
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.user?.id) {
            return { error: 'ログインしていません。' };
        }
        const userId = session.user.id;

        const event = await prisma.create_event.findUnique({
            where: { id: eventId },
            select: { creatorId: true },
        });

        if (!event) {
            return { error: 'イベントが見つかりません。' };
        }

        if (event.creatorId !== userId) {
            return { error: '設定を変更する権限がありません。' };
        }

        await prisma.create_event.update({
            where: { id: eventId },
            data: { theme } as any,
        });

        revalidatePath(`/event/event_detail/${eventId}`);
        return { success: true };
    } catch (error) {
        console.error('updateEventThemeAction Error:', error);
        return { error: `テーマの更新に失敗しました: ${error instanceof Error ? error.message : String(error)}` };
    }
}

export async function uploadEventBackgroundAction(eventId: number, formData: FormData) {
    'use server';
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.user?.id) {
            return { error: 'ログインしていません。' };
        }
        const userId = session.user.id;

        const file = formData.get('file') as File;
        if (!file) {
            return { error: 'ファイルが選択されていません。' };
        }

        // Validation (Size, Type)
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return { error: 'ファイルサイズは5MB以下にしてください。' };
        }
        if (!file.type.startsWith('image/')) {
            return { error: '画像ファイルのみアップロード可能です。' };
        }

        const event = await prisma.create_event.findUnique({
            where: { id: eventId },
            select: { creatorId: true },
        });

        if (!event) {
            return { error: 'イベントが見つかりません。' };
        }
        if (event.creatorId !== userId) {
            return { error: '権限がありません。' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${eventId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'events');
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        const publicPath = `/uploads/events/${filename}`;

        await prisma.create_event.update({
            where: { id: eventId },
            data: {
                theme: 'custom',
                customImagePath: publicPath,
            } as any,
        });

        revalidatePath(`/event/event_detail/${eventId}`);
        return { success: true, imagePath: publicPath };

    } catch (error) {
        console.error('uploadEventBackgroundAction Error:', error);
        return { error: '画像のアップロードに失敗しました。' };
    }
}
