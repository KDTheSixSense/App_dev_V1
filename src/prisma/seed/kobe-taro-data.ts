import { PrismaClient } from '@prisma/client';
import { seedEventProblems } from './event-problems';
import crypto from 'crypto';

function nanoid(length = 21): string {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
}

/**
 *神戸太郎のシードデータ作成
 * 要件:
 * 1. 問題解決履歴 (基本A, B, 応用, プログラミング, 選択)
 * 2. 問題作成 (プログラミング1問, 選択1問)
 * 3. グループ管理
 *    - 自分が作成 (管理者): 課題3つ (全員提出, 半分提出, 全員未提出)
 *    - 他人が作成 (メンバー): 2つ参加, 課題提出期限 (1/24, 1/31), お知らせ2つ以上
 * 4. イベント
 *    - 開催中 (自分が作成): 5人以上参加, スコア表示, 問題5問
 *    - 開催前 (自分が参加): 5人以上参加
 */
export async function seedKobeTaroData(prisma: PrismaClient) {
    console.log('🌱 Seeding specific data for Kobe Taro...');

    // 1. ユーザー取得
    const kobeTaro = await prisma.user.findUnique({ where: { email: 'kobe_taro@example.com' } });
    const users = await prisma.user.findMany({
        where: { email: { not: 'kobe_taro@example.com' } }
    });

    if (!kobeTaro || users.length < 5) {
        console.error('❌ Required users for Kobe Taro seed not found (Need Taro + 5 others). Skipping.');
        return;
    }

    // ユーザーエイリアス
    // ユーザーエイリアス
    const alice = users.find(u => u.email === 'alice@example.com') || users[0];
    const bob = users.find(u => u.email === 'bob@example.com') || users[1];
    const charlie = users.find(u => u.email === 'charlie@example.com') || users[2];
    const sato = users.find(u => u.email === 'sato@example.com') || users[3];
    const tanaka = users.find(u => u.email === 'tanaka@example.com') || users[4];

    // 他のメンバーも含めるためのリスト
    const otherMembers = users.filter(u => u.id !== alice.id && u.id !== bob.id && u.id !== kobeTaro.id);

    // --- 1. 問題解決履歴の作成 ---
    console.log('📝 Creating problem solving history for Kobe Taro...');

    // 履歴をクリアして再実行可能にする
    await prisma.userAnswer.deleteMany({ where: { userId: kobeTaro.id } });

    // (A) Basic Info A (基本情報A)
    const basicAQuestions = await prisma.basic_Info_A_Question.findMany({ take: 3 });
    if (basicAQuestions.length > 0) {
        await prisma.userAnswer.createMany({
            data: basicAQuestions.map((q, i) => ({
                userId: kobeTaro.id,
                basic_A_Info_Question_id: q.id,
                answer: 'ア', // ダミー
                isCorrect: i % 2 === 0, // 交互に正解
                answeredAt: getDate(i + 1),
            }))
        });
    }

    // (B) Questions Algorithm (基本情報B相当)
    const basicBQuestions = await prisma.questions_Algorithm.findMany({ take: 3 });
    if (basicBQuestions.length > 0) {
        await prisma.userAnswer.createMany({
            data: basicBQuestions.map((q, i) => ({
                userId: kobeTaro.id,
                questions_algorithm_id: q.id,
                answer: 'mock_code',
                isCorrect: true,
                answeredAt: getDate(i + 2),
            }))
        });
    }

    // (C) Applied Info (応用情報)
    const appliedQuestions = await prisma.applied_am_Question.findMany({ take: 3 });
    if (appliedQuestions.length > 0) {
        await prisma.userAnswer.createMany({
            data: appliedQuestions.map((q, i) => ({
                userId: kobeTaro.id,
                applied_am_question_id: q.id,
                answer: 'ウ',
                isCorrect: false,
                answeredAt: getDate(i + 3),
            }))
        });
    }

    // (D) Programming Problem
    const progQuestions = await prisma.programmingProblem.findMany({ take: 3 });
    if (progQuestions.length > 0) {
        await prisma.userAnswer.createMany({
            data: progQuestions.map((q, i) => ({
                userId: kobeTaro.id,
                programingProblem_id: q.id,
                answer: 'print("hello")',
                isCorrect: true,
                answeredAt: getDate(i + 4),
            }))
        });
    }

    // (E) Select Problem
    const selectQuestions = await prisma.selectProblem.findMany({ take: 3 });
    if (selectQuestions.length > 0) {
        await prisma.userAnswer.createMany({
            data: selectQuestions.map((q, i) => ({
                userId: kobeTaro.id,
                selectProblem_id: q.id,
                answer: 'Option A',
                isCorrect: true,
                answeredAt: getDate(i + 1),
            }))
        });
    }


    // (F) Today's Activity (当日分のデータ)
    // 今日の日付で正解・不正解履歴を追加
    const todayQuestions = await prisma.questions_Algorithm.findMany({ take: 2, skip: 3 });
    if (todayQuestions.length > 0) {
        await prisma.userAnswer.createMany({
            data: todayQuestions.map((q, i) => ({
                userId: kobeTaro.id,
                questions_algorithm_id: q.id,
                answer: 'mock_code_today',
                isCorrect: true,
                answeredAt: new Date(), // Today
            }))
        });
    }


    // --- 2. 問題作成 (神戸太郎作成) ---
    console.log('🔨 Creating problems authored by Kobe Taro...');

    // プログラミング問題
    const createdProgProblem = await prisma.programmingProblem.create({
        data: {
            title: 'フィボナッチ数列の計算',
            description: '第n項のフィボナッチ数を求めるプログラムを作成してください。',
            problemType: 'コーディング問題',
            difficulty: 5,
            createdBy: kobeTaro.id,
            isPublic: true,
            isPublished: true,
        }
    });

    // 選択問題
    const createdSelectProblem = await prisma.selectProblem.create({
        data: {
            title: 'ReactのuseEffectフック',
            description: 'useEffectの第2引数に空配列を渡した場合の挙動として正しいものを選びなさい。',
            answerOptions: ["マウント時にのみ実行される", "更新ごとに実行される", "アンマウント時にのみ実行される"],
            correctAnswer: "マウント時にのみ実行される",
            difficultyId: 1, // 仮のID
            subjectId: 1, // 仮のID
            createdBy: kobeTaro.id,
        }
    });


    // --- 3. グループ管理 ---
    console.log('👥 Setting up groups and assignments...');

    // (3-1) 管理しているグループ: "神戸ゼミ"
    // メンバー: 5人以上 (Taro + Alice, Bob, Charlie, Sato, Tanaka = 6)
    // (3-1) 管理しているグループ: "神戸ゼミ"
    // メンバー: 5人以上 (Taro + Alice, Bob, Charlie, Sato, Tanaka = 6)
    const myGroup = await prisma.groups.upsert({
        where: { invite_code: 'kobe-zemi-code' },
        update: {},
        create: {
            groupname: '神戸ゼミ',
            body: '神戸太郎が主催するプログラミング学習ゼミです。課題の提出は期限厳守でお願いします。',
            invite_code: 'kobe-zemi-code',
        }
    });

    // メンバー登録 (Taro=Admin)
    await prisma.groups_User.upsert({
        where: { group_id_user_id: { group_id: myGroup.id, user_id: kobeTaro.id } },
        update: {},
        create: { user_id: kobeTaro.id, group_id: myGroup.id, admin_flg: true }
    });
    // 他のメンバー5人を追加
    const members = [alice, bob, charlie, sato, tanaka];
    for (const member of members) {
        await prisma.groups_User.upsert({
            where: { group_id_user_id: { group_id: myGroup.id, user_id: member.id } },
            update: {},
            create: { user_id: member.id, group_id: myGroup.id, admin_flg: false }
        });
    }

    // お知らせ (2件以上)
    await prisma.post.createMany({
        data: [
            { content: '次回のゼミはオンラインで行います。Zoomのリンクを確認してください。', groupId: myGroup.id, authorId: kobeTaro.id, createdAt: getDate(3) },
            { content: '課題の提出期限が迫っています。遅れないようにしてください。', groupId: myGroup.id, authorId: kobeTaro.id, createdAt: getDate(1) },
        ]
    });

    // 課題作成 (3パターン)
    // パターン1: 全員提出済み
    const assignmentAll = await prisma.assignment.create({
        data: {
            groupid: myGroup.id,
            title: '【必修】基礎確認テスト',
            description: '基礎知識の確認です。全員提出してください。',
            due_date: getDate(-5),
            authorId: kobeTaro.id,
            programmingProblemId: createdProgProblem.id, // Problem Link
        }
    });
    // 全員分の提出データ作成 (全員「提出済み」)
    for (let i = 0; i < members.length; i++) {
        await prisma.submissions.create({
            data: {
                assignment_id: assignmentAll.id,
                userid: members[i].id,
                description: '提出します。',
                status: '提出済み', // 全員提出済み
                codingid: 0,
            }
        });
    }

    // パターン2: 半分提出済み、半分未提出 (提出済みのうち数名は「差し戻し」)
    const assignmentHalf = await prisma.assignment.create({
        data: {
            groupid: myGroup.id,
            title: '応用課題演習',
            description: '任意課題です。余裕がある人は取り組んでください。',
            due_date: getDate(-10),
            authorId: kobeTaro.id,
            selectProblemId: createdSelectProblem.id, // Problem Link
        }
    });
    // 半分だけ提出
    const halfCount = Math.ceil(members.length / 2);
    for (let i = 0; i < members.length; i++) {
        const member = members[i];
        if (i < halfCount) {
            // 提出済みのうち、最初の2人は「差し戻し」にする (数名必要という要件)
            const status = i < 2 ? '差し戻し' : '提出済み';
            await prisma.submissions.create({
                data: {
                    assignment_id: assignmentHalf.id,
                    userid: member.id,
                    description: i < 2 ? '不十分な点がありました。' : '難しかったです。',
                    status: status,
                    codingid: 0,
                }
            });
        } else {
            // 残りは未提出レコードを作成
            await prisma.submissions.create({
                data: {
                    assignment_id: assignmentHalf.id,
                    userid: member.id,
                    description: '',
                    status: '未提出',
                    codingid: 0,
                }
            });
        }
    }

    // パターン3用のダミー問題作成 (Unique constraint回避)
    const reportProblem = await prisma.programmingProblem.create({
        data: {
            title: '最終プロジェクト計画書提出',
            description: '計画書を提出してください。',
            problemType: '記述式',
            difficulty: 1,
            createdBy: kobeTaro.id,
            isPublic: true,
            isPublished: true,
        }
    });

    // パターン3: 全員未提出
    const assignmentNone = await prisma.assignment.create({
        data: {
            groupid: myGroup.id,
            title: '最終プロジェクト計画書',
            description: '来月のプロジェクトに向けた計画書を提出してください。まだ提出しないでください。',
            due_date: getDate(-20), // まだ先
            authorId: kobeTaro.id,
            programmingProblemId: reportProblem.id, // Linked to unique problem
        }
    });
    // 全員の未提出レコードを作成
    for (const member of members) {
        await prisma.submissions.create({
            data: {
                assignment_id: assignmentNone.id,
                userid: member.id,
                description: '',
                status: '未提出',
                codingid: 0,
            }
        });
    }


    // (3-2) 自分が参加しているグループ (他人が作成) Create 2 Groups
    // (3-2) 自分が参加しているグループ (他人が作成) Create 2 Groups
    const joinedGroup1 = await prisma.groups.upsert({
        where: { invite_code: 'web-dev-study' },
        update: {},
        create: {
            groupname: 'Web開発研究会',
            body: '最新のWeb技術について語り合う会です。',
            invite_code: 'web-dev-study',
        }
    });
    await prisma.groups_User.createMany({
        data: [
            { user_id: alice.id, group_id: joinedGroup1.id, admin_flg: true }, // Alice Admin
            { user_id: kobeTaro.id, group_id: joinedGroup1.id, admin_flg: false },
            { user_id: bob.id, group_id: joinedGroup1.id, admin_flg: false },
        ],
        skipDuplicates: true
    });

    const joinedGroup2 = await prisma.groups.upsert({
        where: { invite_code: 'ai-study-comm' },
        update: {},
        create: {
            groupname: 'AI学習コミュニティ',
            body: '機械学習の基礎から応用まで。',
            invite_code: 'ai-study-comm',
        }
    });
    await prisma.groups_User.createMany({
        data: [
            { user_id: sato.id, group_id: joinedGroup2.id, admin_flg: true }, // Sato Admin
            { user_id: kobeTaro.id, group_id: joinedGroup2.id, admin_flg: false },
            { user_id: tanaka.id, group_id: joinedGroup2.id, admin_flg: false },
        ],
        skipDuplicates: true
    });

    // 参加グループのお知らせ (最低2つ)
    await prisma.post.createMany({
        data: [
            { content: '次回の勉強会の日程が決まりました。', groupId: joinedGroup1.id, authorId: alice.id },
            { content: '新しいメンバーが加入しました！歓迎しましょう。', groupId: joinedGroup1.id, authorId: alice.id },
            { content: 'おすすめの教材をシェアします。', groupId: joinedGroup2.id, authorId: sato.id },
        ]
    });

    // 参加グループの課題 (特定の日付: 2026/1/24, 2026/1/31)
    // Note: Assuming specific year/month is required by user prompt "1/24の課題2つ、1/31の課題2つ"
    // Since current year is 2026 (from metadata), we set it to 2026.

    const date1 = new Date('2026-01-24T23:59:59');
    const date2 = new Date('2026-01-31T23:59:59');

    // 1/24 Deadlines (2 Assignments)
    await prisma.assignment.create({
        data: {
            groupid: joinedGroup1.id,
            title: '1/24提出課題: Web API設計',
            description: 'RESTful APIの設計書を提出してください。',
            due_date: date1,
            authorId: alice.id,
        }
    });
    await prisma.assignment.create({
        data: {
            groupid: joinedGroup2.id,
            title: '1/24提出課題: データセット収集',
            description: '学習に使用するデータセットを集めてください。',
            due_date: date1,
            authorId: sato.id,
        }
    });

    // 1/31 Deadlines (2 Assignments)
    await prisma.assignment.create({
        data: {
            groupid: joinedGroup1.id,
            title: '1/31提出課題: フロントエンド実装',
            description: '設計に基づき画面を実装してください。',
            due_date: date2,
            authorId: alice.id,
        }
    });
    await prisma.assignment.create({
        data: {
            groupid: joinedGroup2.id,
            title: '1/31提出課題: モデル学習',
            description: '収集したデータでモデルを学習させてください。',
            due_date: date2,
            authorId: sato.id,
        }
    });


    // --- 4. イベント管理 ---
    console.log('🏆 Setting up events...');

    // (4-1) 開催中のイベント (自分が作成)
    // 参加者5人以上, スコア表示, 問題5問
    const activeEvent = await prisma.create_event.upsert({
        where: { inviteCode: 'kobe-cup-active' },
        update: {},
        create: {
            title: '第1回 神戸カップ (開催中)',
            description: 'プログラミングの実力を競う大会です。現在開催中！',
            inviteCode: 'kobe-cup-active',
            publicStatus: true,
            startTime: getDate(2), // 2 days ago
            endTime: getDate(-5), // 5 days later
            isStarted: true,
            hasBeenStarted: true,
            creatorId: kobeTaro.id,
        }
    });

    // 参加者追加 (Taro + 5 others)
    const eventParticipants = [kobeTaro, ...members];
    for (const p of eventParticipants) {
        await prisma.event_Participants.upsert({
            where: { eventId_userId_unique: { eventId: activeEvent.id, userId: p.id } },
            update: {},
            create: {
                eventId: activeEvent.id,
                userId: p.id,
                isAdmin: p.id === kobeTaro.id,
                event_getpoint: p.id === kobeTaro.id ? 0 : getRandomInt(100, 500),
            }
        });
    }

    // 問題を5問リンク (Event_Issue_List)
    const eventProblems = await prisma.programmingProblem.findMany({ take: 5 });
    if (eventProblems.length >= 5) {
        for (const problem of eventProblems) {
            await prisma.event_Issue_List.upsert({
                where: { eventId_problemId_unique: { eventId: activeEvent.id, problemId: problem.id } },
                update: {},
                create: {
                    eventId: activeEvent.id,
                    problemId: problem.id,
                }
            });
        }
    } else {
        // 問題が足りない場合は作成してリンク
        for (let i = 0; i < 5; i++) {
            const p = await prisma.programmingProblem.create({
                data: {
                    title: `イベント用問題 ${i + 1}`,
                    description: 'この問題を解いてください。',
                    difficulty: 3,
                    createdBy: kobeTaro.id,
                }
            });
            await prisma.event_Issue_List.upsert({
                where: { eventId_problemId_unique: { eventId: activeEvent.id, problemId: p.id } },
                update: {},
                create: {
                    eventId: activeEvent.id,
                    problemId: p.id,
                }
            });
        }
    }

    // 開催中のイベントについて、Event_Submissionを作成してスコアの実態を作る
    if (activeEvent && eventProblems.length > 0) {
        // 参加者のうち、Taro以外がいくつか問題を解いたことにする
        const participants = [alice, bob, charlie, sato, tanaka]; // membersと同じ
        for (const p of participants) {
            // スコア合計計算用
            let totalScore = 0;

            // 全ての問題に対してアクションを決定 (解いた/失敗した/未着手)
            for (let i = 0; i < eventProblems.length; i++) {
                const problem = eventProblems[i];

                // ランダムなアクション決定
                const actionRoll = Math.random(); // 0.0 - 1.0
                let isAttempted = false;
                let isCorrect = false;

                // 60% 解く、20% 失敗(挑戦中)、20% 未着手
                if (actionRoll < 0.6) {
                    isAttempted = true;
                    isCorrect = true;
                } else if (actionRoll < 0.8) {
                    isAttempted = true;
                    isCorrect = false;
                } else {
                    isAttempted = false; // 未着手
                }

                if (isAttempted) {
                    // IssueListのIDを取得（イベントと問題のリンクID）
                    const issueLink = await prisma.event_Issue_List.findUnique({
                        where: { eventId_problemId_unique: { eventId: activeEvent.id, problemId: problem.id } }
                    });

                    if (issueLink) {
                        const score = isCorrect ? getRandomInt(50, 100) : 0;
                        if (isCorrect) {
                            totalScore += score;
                        }

                        await prisma.event_Submission.upsert({
                            where: { userId_eventIssueId: { userId: p.id, eventIssueId: issueLink.id } },
                            update: {
                                status: isCorrect,
                                score: score,
                            },
                            create: {
                                userId: p.id,
                                eventIssueId: issueLink.id,
                                status: isCorrect,
                                score: score,
                                codeLog: isCorrect ? 'print("Correct Answer")' : 'print("Wrong Answer")',
                                language: 'python',
                                startedAt: getDate(1),
                                submittedAt: new Date(),
                            }
                        });
                    }
                }
            }

            // 参加者の合計得点を更新 (Event_Participants)
            await prisma.event_Participants.upsert({
                where: { eventId_userId_unique: { eventId: activeEvent.id, userId: p.id } },
                update: { event_getpoint: totalScore }, // 計算したスコアで更新
                create: {
                    eventId: activeEvent.id,
                    userId: p.id,
                    isAdmin: false,
                    event_getpoint: totalScore,
                }
            });
        }
        // Kobe Taroは0点のまま (あるいは管理側で解いてない)
    }

    // (4-2) 開催前のイベント (自分が参加)
    // 参加者5人以上
    const futureEvent = await prisma.create_event.upsert({
        where: { inviteCode: 'winter-fes' },
        update: {},
        create: {
            title: 'ウィンターコードフェス (開催前)',
            description: '来月開催される大規模なハッカソンです。',
            inviteCode: 'winter-fes',
            publicStatus: true,
            startTime: getDate(-20), // 20 days later
            endTime: getDate(-22),
            isStarted: false,
            hasBeenStarted: false,
            creatorId: alice.id, // Alice created
        }
    });

    // 参加者追加 (Taro + others)
    for (const p of eventParticipants) {
        await prisma.event_Participants.upsert({
            where: { eventId_userId_unique: { eventId: futureEvent.id, userId: p.id } },
            update: {},
            create: {
                eventId: futureEvent.id,
                userId: p.id,
                isAdmin: p.id === alice.id, // Alice is admin
            }
        });
    }


    // --- 5. Rich Activity (Daily Activity Summary) ---
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

    // --- 6. KDITクラスの課題を1つ「提出済み」にする ---
    console.log('📝 Marking one KDIT assignment as submitted for Kobe Taro...');
    const kditGroup = await prisma.groups.findFirst({ where: { groupname: 'KDITクラス' } });
    if (kditGroup) {
        const kditAssignments = await prisma.assignment.findMany({ where: { groupid: kditGroup.id } });
        if (kditAssignments.length > 0) {
            // ランダムに1つ選ぶ
            const randomIndex = getRandomInt(0, kditAssignments.length - 1);
            const targetAssignment = kditAssignments[randomIndex];

            await prisma.submissions.upsert({
                where: {
                    assignment_id_userid: {
                        assignment_id: targetAssignment.id,
                        userid: kobeTaro.id
                    }
                },
                update: {
                    status: '提出済み',
                    description: 'なんとか解けました。',
                    submitted_at: getDate(1), // 昨日提出
                    codingid: 0,
                },
                create: {
                    assignment_id: targetAssignment.id,
                    userid: kobeTaro.id,
                    status: '提出済み',
                    description: 'なんとか解けました。',
                    submitted_at: getDate(1),
                    codingid: 0,
                }
            });
            console.log(`✅ Marked assignment "${targetAssignment.title}" as submitted for Kobe Taro.`);
        }
    }

    console.log('🎉 Kobe Taro seed data complete.');
}

// --- Helpers ---

/**
 * Get Date object for X days ago (positive) or future (negative)
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
