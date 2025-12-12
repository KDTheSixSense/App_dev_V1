import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, subYears } from 'date-fns';

export async function seedHistoryDummy(prisma: PrismaClient) {
    console.log('🌱 Seeding dummy history data...');

    const user = await prisma.user.findUnique({
        where: { email: 'alice@example.com' },
    });

    if (!user) {
        console.warn('⚠️ User "alice@example.com" not found. Skipping history seed.');
        return;
    }

    // Helper to get random item from array
    const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    // Helper to simulate correctness
    const randomBoolean = () => Math.random() > 0.4; // 60% correct

    // Dates
    const today = new Date();
    const yesterday = subDays(today, 1);
    const lastWeek = subDays(today, 5);
    const lastMonth = subMonths(today, 1);
    const oldDate = subYears(today, 1);

    const dates = [today, yesterday, lastWeek, lastMonth, oldDate];

    // 1. Basic Info A (UserAnswer)
    const basicAQuestions = await prisma.basic_Info_A_Question.findMany({ take: 5 });
    if (basicAQuestions.length > 0) {
        for (const date of dates) {
            await prisma.userAnswer.create({
                data: {
                    userId: user.id,
                    answer: '1', // Dummy answer
                    isCorrect: randomBoolean(),
                    answeredAt: date,
                    basic_A_Info_Question_id: randomItem(basicAQuestions).id
                }
            });
        }
        console.log('   Derived Basic Info A history.');
    }

    // 2. Applied Info AM (UserAnswer)
    const appliedQuestions = await prisma.applied_am_Question.findMany({ take: 5 });
    if (appliedQuestions.length > 0) {
        for (const date of dates) {
            await prisma.userAnswer.create({
                data: {
                    userId: user.id,
                    answer: '1',
                    isCorrect: randomBoolean(),
                    answeredAt: subDays(date, 1), // Slightly different time
                    applied_am_question_id: randomItem(appliedQuestions).id
                }
            });
        }
        console.log('   Derived Applied Info history.');
    }

    // 3. Programming (UserAnswer)
    const progQuestions = await prisma.programmingProblem.findMany({ take: 5 });
    if (progQuestions.length > 0) {
        for (const date of dates) {
            await prisma.userAnswer.create({
                data: {
                    userId: user.id,
                    answer: 'print("hello")',
                    isCorrect: randomBoolean(),
                    answeredAt: subDays(date, 2),
                    programingProblem_id: randomItem(progQuestions).id
                }
            });
        }
        console.log('   Derived Programming history.');
    }

    // 4. Selection (UserAnswer)
    const selectQuestions = await prisma.selectProblem.findMany({ take: 5 });
    if (selectQuestions.length > 0) {
        for (const date of dates) {
            await prisma.userAnswer.create({
                data: {
                    userId: user.id,
                    answer: 'Option 1',
                    isCorrect: randomBoolean(),
                    answeredAt: subDays(date, 3),
                    selectProblem_id: randomItem(selectQuestions).id
                }
            });
        }
        console.log('   Derived Selection history.');
    }

    // 5. Basic Info B Sample (UserAnswer -> Questions)
    const basicBSample = await prisma.questions.findMany({ take: 5 });
    if (basicBSample.length > 0) {
        for (const date of dates) {
            await prisma.userAnswer.create({
                data: {
                    userId: user.id,
                    answer: 'Sample Answer',
                    isCorrect: randomBoolean(),
                    answeredAt: date,
                    questions_id: randomItem(basicBSample).id
                }
            });
        }
        console.log('   Derived Basic Info B (Sample) history.');
    }

    // 6. Basic Info B Excel/Algo (Answer_Algorithm -> Questions_Algorithm)
    const algoQuestions = await prisma.questions_Algorithm.findMany({ take: 5 });
    if (algoQuestions.length > 0) {
        for (const date of dates) {
            await prisma.answer_Algorithm.create({
                data: {
                    userId: user.id,
                    questionId: randomItem(algoQuestions).id,
                    symbol: 'A', // Dummy
                    isCorrect: randomBoolean(),
                    text: 'Trace result...',
                    answeredAt: date
                }
            });
        }
        console.log('   Derived Basic Info B (Algo) history.');
    } else {
        console.log('   ⚠️ No Questions_Algorithm found. Skipping Algo history.');
    }

    console.log('✅ Dummy history data seeded.');
}
