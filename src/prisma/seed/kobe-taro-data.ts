import { PrismaClient } from '@prisma/client';

import crypto from 'crypto';

function nanoid(length = 21): string {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
}

/**
 * Kobe Taro-specific seed data generation
 * This function handles all "rich" data creation for the demo user "Kobe Taro"
 */
export async function seedKobeTaroData(prisma: PrismaClient) {
    console.log('🌱 Seeding specific data for Kobe Taro...');

    // 1. Retrieve necessary users (created in users-groups-data.ts)
    const kobeTaro = await prisma.user.findUnique({ where: { email: 'kobe_taro@example.com' } });
    const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
    const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
    const charlie = await prisma.user.findUnique({ where: { email: 'charlie@example.com' } });
    const satoMisaki = await prisma.user.findUnique({ where: { email: 'sato@example.com' } });

    if (!kobeTaro || !alice || !bob || !charlie || !satoMisaki) {
        console.error('❌ Required users for Kobe Taro seed not found. Skipping.');
        return;
    }

    // --- 2. Groups Management ---

    // (A) "Kobe Zemi" - Taro is Admin
    let kobeZemi = await prisma.groups.findFirst({ where: { groupname: '神戸ゼミ' } });
    if (!kobeZemi) {
        kobeZemi = await prisma.groups.create({
            data: {
                groupname: '神戸ゼミ',
                body: '神戸太郎が主催するゼミです。最新技術のキャッチアップと論文講読を行います。',
                invite_code: nanoid(8),
            },
        });
        // Add Taro as Admin
        await prisma.groups_User.create({
            data: { user_id: kobeTaro.id, group_id: kobeZemi.id, admin_flg: true },
        });
        // Add Bob and Sato as members
        await prisma.groups_User.createMany({
            data: [
                { user_id: bob.id, group_id: kobeZemi.id, admin_flg: false },
                { user_id: satoMisaki.id, group_id: kobeZemi.id, admin_flg: false },
            ],
            skipDuplicates: true,
        });
        console.log(`✅ Created "Kobe Zemi" for Kobe Taro.`);
    }

    // (B) "Advanced Tech" - Taro is Member (Alice is Admin - created in previous seed or here if missing)
    let advancedTech = await prisma.groups.findFirst({ where: { groupname: '先端技術研究会' } });
    if (!advancedTech) {
        advancedTech = await prisma.groups.create({
            data: {
                groupname: '先端技術研究会',
                body: 'アリスが主催する研究会です。',
                invite_code: nanoid(8),
            },
        });
        await prisma.groups_User.createMany({
            data: [
                { user_id: alice.id, group_id: advancedTech.id, admin_flg: true },
                { user_id: kobeTaro.id, group_id: advancedTech.id, admin_flg: false },
                { user_id: charlie.id, group_id: advancedTech.id, admin_flg: false },
            ],
            skipDuplicates: true,
        });
        console.log(`✅ Joined "Advanced Tech" as member.`);
    }

    // (C) "KDIT Class" - Taro is Member (Alice is Admin)
    // Logic from old file: Invite code 'itinvite'
    let kditClass = await prisma.groups.findFirst({ where: { groupname: 'KDITクラス' } });
    if (!kditClass) {
        kditClass = await prisma.groups.create({
            data: {
                groupname: 'KDITクラス',
                body: '神戸電子専門学校のITクラスです。',
                invite_code: 'itinvite',
            },
        });
        // Alice admin, Taro member
        await prisma.groups_User.createMany({
            data: [
                { user_id: alice.id, group_id: kditClass.id, admin_flg: true },
                { user_id: kobeTaro.id, group_id: kditClass.id, admin_flg: false },
            ],
            skipDuplicates: true,
        });
        console.log(`✅ Joined "KDIT Class" as member.`);
    } else {
        // Ensure Taro is in KDIT class if group already exists (e.g. from shared seed)
        await prisma.groups_User.upsert({
            where: { group_id_user_id: { group_id: kditClass.id, user_id: kobeTaro.id } },
            create: { user_id: kobeTaro.id, group_id: kditClass.id, admin_flg: false },
            update: {},
        });
    }


    // --- 3. Posts (Announcements) ---

    if (kobeZemi) {
        await prisma.post.createMany({
            data: [
                { content: '【重要】来週のゼミは10時から開始します。遅れないように。', groupId: kobeZemi.id, authorId: kobeTaro.id, createdAt: getDate(2) },
                { content: '参考文献のPDFを共有ドライブにアップしました。', groupId: kobeZemi.id, authorId: kobeTaro.id, createdAt: getDate(5) },
            ]
        });
    }

    // --- 4. Assignments & Submissions ---

    // (A) Assignments Created by Kobe Taro (in Kobe Zemi)
    if (kobeZemi) {
        // Assignment 1: Review
        const assignment1 = await prisma.assignment.create({
            data: {
                groupid: kobeZemi.id,
                title: '論文要約課題',
                description: '先日配布した論文を読み、主要なポイントを3点まとめてください。',
                due_date: getDate(-5), // 5 days later
                authorId: kobeTaro.id,
                created_at: getDate(10), // 10 days ago
            }
        });
        console.log(`✅ Created assignment "論文要約課題".`);

        // Submissions for Assignment 1 (Bob submitted)
        await prisma.submissions.create({
            data: {
                assignment_id: assignment1.id,
                userid: bob.id,
                status: '提出済み',
                description: '一番難しかったです。',
                submitted_at: getDate(1),
                codingid: 0,
            }
        });

        // Comments on Bob's submission
        // Note: AssignmentComment is linked to Assignment, not Submission directly in this schema?
        // Checking schema: model AssignmentComment { assignmentId, authorId, content }
        // It seems comments are on the Assignment itself, purely chat-like?
        // Or looks like common chat. Let's add some conversation.
        await prisma.assignmentComment.createMany({
            data: [
                { assignmentId: assignment1.id, authorId: bob.id, content: 'この論文の第2章が難解です。ヒントをいただけますか？', createdAt: getDate(8) },
                { assignmentId: assignment1.id, authorId: kobeTaro.id, content: 'そこは背景知識としてAppendix Aを参照すると良いですよ。', createdAt: getDate(8) },
                { assignmentId: assignment1.id, authorId: bob.id, content: 'ありがとうございます！', createdAt: getDate(7) },
            ]
        });
    }

    // (B) Assignments Kobe Taro needs to do (in KDIT Class)
    // We need problems to link.
    const problemFizzBuzz = await prisma.programmingProblem.findFirst({ where: { title: 'FizzBuzz' } });

    if (kditClass && problemFizzBuzz) {
        // Create assignment if not exists (might be created by shared seed, but let's ensure one specific one)
        let homework = await prisma.assignment.findFirst({ where: { title: '週末課題: FizzBuzz', groupid: kditClass.id } });
        if (!homework) {
            homework = await prisma.assignment.create({
                data: {
                    groupid: kditClass.id,
                    title: '週末課題: FizzBuzz',
                    description: '基本アルゴリズムの確認です。',
                    due_date: getDate(-2), // Due in 2 days
                    programmingProblemId: problemFizzBuzz.id,
                    authorId: alice.id, // Alice created it
                }
            });
        }

        // Taro submits it
        const submission = await prisma.submissions.findUnique({
            where: { assignment_id_userid: { assignment_id: homework.id, userid: kobeTaro.id } }
        });

        if (!submission) {
            await prisma.submissions.create({
                data: {
                    assignment_id: homework.id,
                    userid: kobeTaro.id,
                    status: '未提出', // Not Submitted
                    description: '', // Required field
                    codingid: 0, // Mock ID
                    // submitted_at: new Date(),
                    language: 'python'
                }
            });
            console.log(`✅ Kobe Taro submitted "週末課題: FizzBuzz".`);
        }
    }


    // --- 5. Events ---

    // Create Event hosted by Kobe Taro
    const event1 = await prisma.create_event.create({
        data: {
            title: 'Kobe Algorithm Cup',
            description: 'アルゴリズム力を競う大会です。初心者歓迎！',
            inviteCode: 'kobe-cup',
            publicStatus: true,
            startTime: getDate(-10), // 10 days from now
            endTime: getDate(-10, 2), // 10 days from now + 2 hours (Fixed: added positive 2 hours)
            publicTime: getDate(1), // published yesterday
            creatorId: kobeTaro.id,
            isStarted: true, // Show as started
            hasBeenStarted: true,
        }
    });

    // Participants
    await prisma.event_Participants.createMany({
        data: [
            { eventId: event1.id, userId: kobeTaro.id, isAdmin: true },
            { eventId: event1.id, userId: bob.id, isAdmin: false },
            { eventId: event1.id, userId: satoMisaki.id, isAdmin: false },
        ]
    });
    console.log(`✅ Created event "Kobe Algorithm Cup".`);


    // --- 6. Rich Activity History (Daily Activity Summary) ---
    // Generate a graph that looks like a real active user
    console.log('🌱 Generating rich activity graph for Kobe Taro...');
    const today = new Date();
    const activities = [];

    // Generate for last 30 days
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        // Reset time part to avoid issues, though schema says @db.Date, Prisma passes JS Date
        // Helper to strip time
        const dateOnly = new Date(date.toISOString().split('T')[0]);

        // Pattern: Active on weekdays, less on weekends
        const dayOfWeek = date.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        let xp = 0;
        let time = 0;
        let problems = 0;

        if (!isWeekend) {
            // Weekday: High activity
            xp = getRandomInt(100, 500);
            time = getRandomInt(30, 120) * 60 * 1000; // 30-120 mins
            problems = getRandomInt(1, 5);
        } else {
            // Weekend: Low activity (sometimes 0)
            if (Math.random() > 0.5) {
                xp = getRandomInt(0, 50);
                time = getRandomInt(0, 30) * 60 * 1000;
                problems = getRandomInt(0, 1);
            }
        }

        if (xp > 0 || time > 0) {
            activities.push({
                userId: kobeTaro.id,
                date: dateOnly,
                totalXpGained: xp,
                totalTimeSpentMs: BigInt(time),
                problemsCompleted: problems
            });
        }
    }

    if (activities.length > 0) {
        await prisma.dailyActivitySummary.createMany({
            data: activities,
            skipDuplicates: true
        });
    }
    console.log(`✅ Created ${activities.length} daily activity stats for Kobe Taro.`);

    console.log('🎉 Kobe Taro seed data complete.');
}

// --- Helpers ---

/**
 * Get Date object for X days ago (positive) or future (negative input... wait relative to now)
 * Let's standardize: 
 * positive number = days ago
 * negative number = days in future
 */
function getDate(daysAgo: number, addHours: number = 0): Date {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(d.getHours() + addHours);
    return d;
}

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
