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

        // 2. イベントへの紐付け（eventIdが指定されている場合）
        if (eventId && problem) {
            const existingLink = await prisma.event_Issue_List.findUnique({
                where: {
                    eventId_problemId_unique: {
                        eventId: eventId,
                        problemId: problem.id
                    }
                }
            });

            if (!existingLink) {
                await prisma.event_Issue_List.create({
                    data: {
                        eventId: eventId,
                        problemId: problem.id
                    }
                });
                // console.log(`   Linked problem "${p.title}" to event ID ${eventId}`);
            }
        }
    }

    console.log(`✅ Created ${allProblems.length} event problems.`);
}
