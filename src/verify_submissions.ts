import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetTitles = [
        '[Python基礎] 変数宣言の基本',
        '[ウォーミングアップ] 簡単な足し算'
    ];

    const assignments = await prisma.assignment.findMany({
        where: {
            title: { in: targetTitles }
        },
        include: {
            Submissions: true
        }
    });

    console.log('--- Submission Stats ---');
    for (const assignment of assignments) {
        const total = assignment.Submissions.length;
        const submitted = assignment.Submissions.filter(s => s.status === '提出済み').length;
        console.log(`Assignment: ${assignment.title}`);
        console.log(`Total Submissions: ${total}`);
        console.log(`Submitted Count: ${submitted} (${Math.round(submitted / total * 100)}%)`);

        // Check a few descriptions
        const sample = assignment.Submissions.filter(s => s.status === '提出済み').slice(0, 3);
        sample.forEach((s, i) => {
            console.log(`  Sample ${i + 1} Description: "${s.description.substring(0, 50)}..."`);
        });
        console.log('-----------------------------');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
