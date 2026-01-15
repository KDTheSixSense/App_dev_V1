import { PrismaClient } from '@prisma/client';
import { beginnerProblems } from './data/event-problems-beginner';
import { intermediateProblems } from './data/event-problems-intermediate';
import { advancedProblems } from './data/event-problems-advanced';

export async function seedEventProblems(prisma: PrismaClient) {
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

        // 問題を作成
        const created = await prisma.programmingProblem.create({
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
                // Difficulty 1-5 maps to EventDifficulty ID 1-5 (かんたん, ふつう, ちょいむず, むずい, おにむず)
                eventDifficulty: {
                    connect: { id: p.difficulty }
                }
            }
        });
    }

    console.log(`✅ Created ${allProblems.length} event problems.`);
}
