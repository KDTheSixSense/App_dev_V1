"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOperations = runOperations;
// 注意: actions.ts はサーバーコンポーネントの機能('use server')に依存しているため、
// seedスクリプトから直接インポートするとエラーになる可能性があります。
// そのため、ロジックをこのファイルに再実装するか、actions.tsから'use server'を含まないヘルパー関数として
// ロジックを切り出して、それをseedとactionの両方から使うのが望ましいです。
// ここでは、簡単のため、元のロジックを参考に一部を再実装します。
async function addXpForSeed(prisma, user_id, subject_id, difficulty_id) {
    const difficulty = await prisma.difficulty.findUnique({ where: { id: difficulty_id } });
    if (!difficulty)
        return;
    const xpAmount = difficulty.xp;
    await prisma.user.update({
        where: { id: user_id },
        data: { xp: { increment: xpAmount } },
    });
    await prisma.userSubjectProgress.upsert({
        where: { user_id_subject_id: { user_id, subject_id } },
        create: { user_id, subject_id, xp: xpAmount, level: 1 },
        update: { xp: { increment: xpAmount } },
    });
}
async function runOperations(prisma) {
    console.log('🧪 Running post-seeding operations...');
    const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    const godUser = await prisma.user.findUnique({ where: { email: 'GodOfGod@example.com' } });
    if (alice) {
        // console.log("🧪 Testing addXp function for Alice...");
        // await addXpForSeed(prisma, alice.id, 1, 1);
        // for (let i = 0; i < 40; i++) {
        //   await addXpForSeed(prisma, alice.id, 2, 8); // Basic Info A
        //   await addXpForSeed(prisma, alice.id, 3, 8); // Basic Info B
        // }
        // console.log(`✅ Alice's XP updated.`);
    }
    if (godUser) {
        console.log('👼 Creating God Mode progress...');
        const subjects = await prisma.subject.findMany();
        const progressData = subjects.map((subject) => ({ user_id: godUser.id, subject_id: subject.id, level: 9999, xp: 99999999 }));
        await prisma.userSubjectProgress.createMany({ data: progressData, skipDuplicates: true });
        console.log(`✅ God Mode progress created.`);
    }
    console.log('🌱 Seeding assignments and submissions...');
    // 1. 既存の課題と配布状況をクリアして初期化
    await prisma.submissions.deleteMany({});
    await prisma.assignment.deleteMany({});
    // 2. 必要なグループと問題を取得
    const kobeZemiGroup = await prisma.groups.findFirst({ where: { groupname: '神戸ゼミ' } });
    const kditGroup = await prisma.groups.findFirst({ where: { groupname: 'KDITクラス' } });
    const problemAplusB = await prisma.programmingProblem.findFirst({ where: { title: 'A + B' } });
    const problemFizzBuzz = await prisma.programmingProblem.findFirst({ where: { title: 'FizzBuzz' } });
    const problemPythonVar = await prisma.selectProblem.findFirst({ where: { title: 'Pythonの変数宣言について' } });
    if (kobeZemiGroup && kditGroup) {
        const assignmentsToCreate = [];
        // --- 課題データを作成 ---
        assignmentsToCreate.push({ groupid: kobeZemiGroup.id, title: '事前課題: 論文レビュー', description: '指定した論文を読み、A4一枚でレビューをまとめてください。', due_date: new Date('2025-10-30T23:59:59Z') });
        if (problemFizzBuzz) {
            assignmentsToCreate.push({ groupid: kobeZemiGroup.id, title: '[アルゴリズム] FizzBuzz問題', description: '添付の問題を解き、プログラミングの基本的なループと条件分岐の理解を深めましょう。', due_date: new Date('2025-11-20T23:59:59Z'), programmingProblemId: problemFizzBuzz.id });
        }
        if (problemPythonVar) {
            assignmentsToCreate.push({ groupid: kditGroup.id, title: '[Python基礎] 変数宣言の基本', description: '添付の選択問題を解いて、Pythonにおける正しい変数宣言の方法を理解しましょう。', due_date: new Date('2025-10-31T23:59:59Z'), selectProblemId: problemPythonVar.id });
        }
        if (problemAplusB) {
            assignmentsToCreate.push({ groupid: kditGroup.id, title: '[ウォーミングアップ] 簡単な足し算', description: 'プログラミングに慣れるための最初のステップです。添付問題の指示に従い、2つの数値を足し合わせるプログラムを書いてみましょう。', due_date: new Date('2025-11-05T23:59:59Z'), programmingProblemId: problemAplusB.id });
        }
        // 3. 課題を一括作成
        await prisma.assignment.createMany({
            data: assignmentsToCreate,
        });
        console.log(`✅ Created ${assignmentsToCreate.length} assignments.`);
        // 4. 作成した課題をメンバーに配布 (Submissions作成)
        console.log('🌱 Distributing assignments to members...');
        const allAssignments = await prisma.assignment.findMany();
        const allNonAdminMembers = await prisma.groups_User.findMany({
            where: { admin_flg: false },
        });
        const submissionsToCreate = [];
        for (const assignment of allAssignments) {
            const membersInGroup = allNonAdminMembers.filter((member) => member.group_id === assignment.groupid);
            for (const member of membersInGroup) {
                submissionsToCreate.push({
                    assignment_id: assignment.id,
                    userid: member.user_id,
                    status: '未提出',
                    description: '',
                    codingid: 0,
                });
            }
        }
        if (submissionsToCreate.length > 0) {
            await prisma.submissions.createMany({
                data: submissionsToCreate,
            });
            console.log(`✅ Distributed assignments, creating ${submissionsToCreate.length} submission records.`);
        }
        console.log('🌱 Creating dummy "submitted" records...');
        // 提出済みにしたい課題とユーザーを取得
        const pythonAssignment = await prisma.assignment.findFirst({
            where: { title: '[Python基礎] 変数宣言の基本' },
        });
        const aPlusBAssignment = await prisma.assignment.findFirst({
            where: { title: '[ウォーミングアップ] 簡単な足し算' },
        });
        const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
        const charlie = await prisma.user.findUnique({ where: { email: 'charlie@example.com' } });
        const diana = await prisma.user.findUnique({ where: { email: 'diana@example.com' } });
        // BobとCharlieがPythonの課題を提出したことにする
        if (pythonAssignment && bob && charlie) {
            await prisma.submissions.updateMany({
                where: {
                    assignment_id: pythonAssignment.id,
                    userid: { in: [bob.id, charlie.id] },
                },
                data: {
                    status: '提出済み',
                    submitted_at: new Date('2025-10-20T10:00:00Z'), // ダミーの提出日時
                    description: '提出しました。確認お願いします。', // ダミーのコメント
                },
            });
            console.log(`✅ Created 2 dummy submissions for "${pythonAssignment.title}".`);
        }
        // Dianaが足し算の課題を提出したことにする
        if (aPlusBAssignment && diana) {
            await prisma.submissions.updateMany({
                where: {
                    assignment_id: aPlusBAssignment.id,
                    userid: diana.id,
                },
                data: {
                    status: '提出済み',
                    submitted_at: new Date('2025-10-22T15:30:00Z'),
                    description: '完了しました。',
                },
            });
            console.log(`✅ Created 1 dummy submission for "${aPlusBAssignment.title}".`);
        }
    }
    else {
        console.warn('⚠️ Could not find groups to seed assignments.');
    }
}
