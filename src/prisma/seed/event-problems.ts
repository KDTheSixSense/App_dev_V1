import { PrismaClient } from '@prisma/client';
import { beginnerProblems } from './data/event-problems-beginner';
import { intermediateProblems } from './data/event-problems-intermediate';
import { advancedProblems } from './data/event-problems-advanced';

export async function seedEventProblems(prisma: PrismaClient, eventId?: number) {
    console.log('🌱 Seeding Event C Problems...');

    const allProblems = [
        ...beginnerProblems,
        ...intermediateProblems,
        ...advancedProblems
    ];

    // Kobe Taro (kobe_taro@example.com) を取得
    const kobeTaro = await prisma.user.findUnique({
        where: { email: 'kobe_taro@example.com' }
    });

    if (!kobeTaro) {
        console.warn('⚠️ Kobe Taro user not found. Event problems will be created without creatorId.');
    }

    let targetEventId = eventId;

    // eventIdが指定されていない場合、新規イベントを作成
    if (!targetEventId && kobeTaro) {
        console.log('🆕 Creating new event for problems...');
        // 既存の同名イベントがあるか確認（重複作成防止）
        const existingEvent = await prisma.create_event.findUnique({
            where: { inviteCode: 'event-problems-seed-20' }
        });

        if (existingEvent) {
            targetEventId = existingEvent.id;
            console.log(`   Found existing event: ${existingEvent.title} (ID: ${targetEventId})`);
        } else {
            const newEvent = await prisma.create_event.create({
                data: {
                    title: '神戸電子 プログラミングコンテスト',
                    description: 'C言語の問題20問に挑戦しよう！',
                    inviteCode: 'event-problems-seed-20',
                    publicStatus: true,
                    startTime: new Date(), // Now
                    endTime: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days later
                    isStarted: true,
                    hasBeenStarted: true,
                    creatorId: kobeTaro.id,
                }
            });
            targetEventId = newEvent.id;
            console.log(`   Created new event: ${newEvent.title} (ID: ${targetEventId})`);

            // 自分(Kobe Taro)を管理者として参加させる
            await prisma.event_Participants.create({
                data: {
                    eventId: targetEventId,
                    userId: kobeTaro.id,
                    isAdmin: true,
                    event_getpoint: 0
                }
            });
        }
    }

    for (const p of allProblems) {

        // 1. 問題自体の作成（重複チェック：タイトルで検索）
        let problem = await prisma.programmingProblem.findFirst({
            where: { title: p.title }
        });

        if (!problem) {
            problem = await prisma.programmingProblem.create({
                data: {
                    creator: kobeTaro ? { connect: { id: kobeTaro.id } } : undefined,
                    title: p.title,
                    description: p.description,
                    problemType: p.problemType,
                    difficulty: p.difficulty,
                    timeLimit: p.timeLimit,
                    category: p.category,
                    topic: p.topic,
                    tags: p.tags,
                    codeTemplate: p.codeTemplate,
                    isPublic: p.isPublic,
                    isPublished: p.isPublished,
                    testCases: {
                        create: p.testCases
                    },
                    sampleCases: {
                        create: (p as any).sampleCases || []
                    },
                    eventDifficulty: {
                        connect: { id: p.difficulty }
                    }
                }
            });
            // console.log(`   Created problem: ${p.title}`);
        } else {
            // console.log(`   Skipped existing problem: ${p.title}`);
        }

        // 2. イベントへの紐付け（targetEventIdがある場合）
        if (targetEventId && problem) {
            const existingLink = await prisma.event_Issue_List.findUnique({
                where: {
                    eventId_problemId_unique: {
                        eventId: targetEventId,
                        problemId: problem.id
                    }
                }
            });

            if (!existingLink) {
                await prisma.event_Issue_List.create({
                    data: {
                        eventId: targetEventId,
                        problemId: problem.id
                    }
                });
                // console.log(`   Linked problem "${p.title}" to event ID ${targetEventId}`);
            }
        }
    }

    console.log(`✅ Created/Linked ${allProblems.length} event problems.`);
}
