import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

// --- ヘルパー関数 ---

/**
 * 指定された範囲のランダムな整数を生成します
 * @param min 最小値
 * @param max 最大値
 */
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * ランダムな4文字の日本人名を生成します (姓2文字 + 名2文字)
 */
function generateJapaneseName(): string {
  const surnames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本'];
  const givenNames = ['太郎', '花子', '一郎', '次郎', '健太', '美咲', '愛子', '結衣', '大輔', '直人', '真一', '翔太', '美優', '陽菜', '葵'];

  const surname = surnames[Math.floor(Math.random() * surnames.length)];
  const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];

  return `${surname}${givenName}`;
}

const defaultIcons = [
  '/images/DefaultIcons/cursor_fox_tail.png',
  '/images/DefaultIcons/female1.jpg',
  '/images/DefaultIcons/female2.jpg',
  '/images/DefaultIcons/female3.jpg',
  '/images/DefaultIcons/male1.jpg',
  '/images/DefaultIcons/male2.jpg',
  '/images/DefaultIcons/male3.jpg',
];

/**
 * デフォルトアイコンのパスをランダムに返します
 */
function getRandomIcon(): string {
  const index = Math.floor(Math.random() * defaultIcons.length);
  return defaultIcons[index];
}

/**
 * 総経験値からレベルを計算します (1000XPごとに1レベルアップ)
 * @param xp 経験値
 */
function calculateLevelFromXp(xp: number): number {
  if (xp < 0) return 1;
  return Math.floor(xp / 1000) + 1;
}

/**
 * ユーザーとグループのデモデータを作成する関数
 * @param prisma PrismaClientのインスタンス
 */
export async function seedUsersAndGroups(prisma: PrismaClient) {
  console.log('🌱 Seeding users and groups...');

  // --- 1. 既存データをクリア ---
  // 依存関係の末端から削除していく
  await prisma.assignmentComment.deleteMany({});
  await prisma.submissions.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.groups_User.deleteMany({});
  await prisma.groups.deleteMany({});

  await prisma.event_Submission.deleteMany({});
  await prisma.event_Issue_List.deleteMany({});
  await prisma.event_Participants.deleteMany({});
  await prisma.create_event.deleteMany({});

  await prisma.userUnlockedTitle.deleteMany({});
  await prisma.userDailyMissionProgress.deleteMany({});
  await prisma.dailyActivitySummary.deleteMany({});
  await prisma.userAnswer.deleteMany({});
  await prisma.answer_Algorithm.deleteMany({});
  await prisma.loginHistory.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.bannedUser.deleteMany({});

  await prisma.userSubjectProgress.deleteMany({});
  await prisma.status_Kohaku.deleteMany({});

  // 最後にユーザーを削除
  await prisma.user.deleteMany({});
  console.log('🗑️ Cleared existing user, group, and related data.');


  // --- 2. シーディングするユーザーの基本情報を定義 ---
  const usersToSeed = [
    { email: 'alice@example.com', password: 'password123', username: generateJapaneseName(), icon: '/images/users/alice.png', isAdmin: true },
    { email: 'bob@example.com', password: 'securepassword', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'charlie@example.com', password: 'anotherpassword', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'diana@example.com', password: 'password456', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'eva@example.com', password: 'password789', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'frank@example.com', password: 'password101', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'grace@example.com', password: 'password112', username: generateJapaneseName(), icon: getRandomIcon() },

    { email: 'kobe_taro@example.com', password: 'kobetarou', username: '神戸太郎', icon: '/images/users/kobe.png' },
    // その他ダミーユーザー (田中, 鈴木, 佐藤の代わり)
    { email: 'tanaka@example.com', password: 'password131', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'suzuki@example.com', password: 'password415', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'sato@example.com', password: 'password617', username: generateJapaneseName(), icon: getRandomIcon() },

    { email: 'evo@example1.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo@example2.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo@example3.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo@example4.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo@example5.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    // 複合属性確認用アカウント
    { email: 'evo_mix_ab@example.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo_mix_ap@example.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo_mix_ao@example.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo_mix_bp@example.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo_mix_bo@example.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo_mix_po@example.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo_mix_all@example.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },
    { email: 'evo_60_check@example.com', password: 'password123', username: generateJapaneseName(), icon: getRandomIcon() },

  ];

  // --- 3. 各ユーザーのデータと関連データを作成 ---
  console.log('🌱 Seeding users, pets, and subject progresses...');
  for (const userData of usersToSeed) {
    const subjectProgressData = [];
    let totalAccountXp = 0;
    const numberOfSubjects = 5; // subject_idは1から5まで

    // 科目ごとの進捗を生成
    for (let subjectId = 1; subjectId <= numberOfSubjects; subjectId++) {
      let subjectXp = 0;

      // ユーザーごとにXPの生成範囲を変える
      if (userData.username === '神戸太郎') {
        subjectXp = 8999;
      } else if (userData.email.startsWith('evo@example')) {
        // ユーザーごとに特定の科目をレベル29 (XP 28950) に設定
        let targetSubjectId = 1;
        if (userData.email === 'evo@example1.com') targetSubjectId = 2; // 基本A
        else if (userData.email === 'evo@example2.com') targetSubjectId = 3; // 基本B
        else if (userData.email === 'evo@example3.com') targetSubjectId = 1; // プログラミング
        else if (userData.email === 'evo@example4.com') targetSubjectId = 5; // 応用
        else if (userData.email === 'evo@example5.com') targetSubjectId = 4; // 選択問題

        // ランキングのばらつきを確認するために、レベルもばらけさせる (概ねLevel 20 ~ 50程度)
        // 28950 XP = Level 29. ランダムに加算
        const baseTargetXp = 28950;
        const randomOffset = getRandomInt(-15000, 25000);

        subjectXp = subjectId === targetSubjectId ? Math.max(1000, baseTargetXp + randomOffset) : 0;
      } else if (userData.email.startsWith('evo_mix_')) {
        // 複合属性確認用: アカウントレベルがばらけるように合計XPをランダム設定
        // 概ね 20000 ~ 60000 程度
        const totalTargetXp = getRandomInt(20000, 60000);
        // 科目IDマッピング: 1=Prog(P), 2=BasicA(A), 3=BasicB(B), 4=Select(A), 5=Applied(O)

        if (userData.email === 'evo_mix_ab@example.com') {
          if (subjectId === 2 || subjectId === 3) subjectXp = Math.floor(totalTargetXp / 2); // A & B
        } else if (userData.email === 'evo_mix_ap@example.com') {
          if (subjectId === 2 || subjectId === 1) subjectXp = Math.floor(totalTargetXp / 2); // A & P
        } else if (userData.email === 'evo_mix_ao@example.com') {
          if (subjectId === 2 || subjectId === 5) subjectXp = Math.floor(totalTargetXp / 2); // A & O
        } else if (userData.email === 'evo_mix_bp@example.com') {
          if (subjectId === 3 || subjectId === 1) subjectXp = Math.floor(totalTargetXp / 2); // B & P
        } else if (userData.email === 'evo_mix_bo@example.com') {
          if (subjectId === 3 || subjectId === 5) subjectXp = Math.floor(totalTargetXp / 2); // B & O
        } else if (userData.email === 'evo_mix_po@example.com') {
          if (subjectId === 1 || subjectId === 5) subjectXp = Math.floor(totalTargetXp / 2); // P & O
        } else if (userData.email === 'evo_mix_all@example.com') {
          subjectXp = Math.floor(totalTargetXp / 5); // 全科目
        }
      } else if (userData.email === 'evo_60_check@example.com') {
        // レベル59 (XP 58900) に設定。あと100XPでレベル60になる。
        // B-B進化条件 (Bレベル - 10 >= Aレベル) を満たすように設定
        if (subjectId === 2) subjectXp = 15000; // 基本A (Lv16)
        else if (subjectId === 3) subjectXp = 43900; // 基本B (Lv44)
        else subjectXp = 0;
      } else if (['フランク・キャッスル', 'グレース・ホッパー'].includes(userData.username!)) {
        subjectXp = getRandomInt(10000, 50000);
      } else if (['アリス・スミス', '鈴木 一郎'].includes(userData.username!)) {
        subjectXp = getRandomInt(5000, 20000);
      } else {
        subjectXp = getRandomInt(100, 8000);
      }

      totalAccountXp += subjectXp;
      subjectProgressData.push({
        subject_id: subjectId,
        xp: subjectXp,
        level: calculateLevelFromXp(subjectXp),
      });
    }

    // アカウント全体のレベルとXPを計算
    const accountLevel = calculateLevelFromXp(totalAccountXp);

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const isKobeTaro = userData.username === '神戸太郎';
    const hungerLevel = isKobeTaro ? 150 : getRandomInt(10, 200);
    let userLoginData = {};

    if (isKobeTaro) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1); // 1日前の日付に設定
      yesterday.setHours(10, 0, 0, 0);            // 時刻をAM 10:00に設定

      userLoginData = {
        continuouslogin: 30,
        lastlogin: yesterday,
        totallogin: 100,
      };
    }
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        username: userData.username,
        password: hashedPassword,
        icon: userData.icon,
        level: accountLevel,
        xp: totalAccountXp,
        totallogin: getRandomInt(1, 500),
        ...userLoginData,
        isAdmin: userData.isAdmin || false,
      },
      create: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        icon: userData.icon,
        level: accountLevel,
        xp: totalAccountXp,
        totallogin: getRandomInt(1, 500),
        ...userLoginData, // 神戸太郎の場合のみ、ここにデータが追加される
        isAdmin: userData.isAdmin || false, // 管理者権限を設定
        status_Kohaku: {
          create: {
            status: '元気',
            hungerlevel: hungerLevel,
            evolutionType: userData.email === 'evo_60_check@example.com' ? 'A-A' : undefined,
          },
        },
        progresses: {
          create: subjectProgressData,
        },
      },
    });
  }
  console.log('✅ Users, pets, and progresses seeded.');


  // --- 4. グループとメンバーシップを作成 ---
  console.log('🌱 Seeding specific groups for Taro Kobe...');
  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const bob = await prisma.user.findUnique({ where: { email: 'bob@example.com' } });
  const kobeTaro = await prisma.user.findUnique({ where: { email: 'kobe_taro@example.com' } });

  if (alice && bob && kobeTaro) {
    // グループ1: (削除 - Kobe Taro Dataで作成するため)


    // グループ2: 神戸太郎が一般メンバー
    const group2 = await prisma.groups.create({
      data: {
        groupname: '先端技術研究会',
        body: 'アリスが主催する研究会です。',
        invite_code: nanoid(8),
      },
    });
    await prisma.groups_User.createMany({
      data: [
        { user_id: alice.id, group_id: group2.id, admin_flg: true },
        { user_id: kobeTaro.id, group_id: group2.id, admin_flg: false },
        { user_id: bob.id, group_id: group2.id, admin_flg: false },
      ],
    });
    console.log(`✅ Created group "${group2.groupname}" with Taro as a Member.`);

    // グループ3: 神戸太郎が参加していない (招待コード固定)
    const group3 = await prisma.groups.create({
      data: {
        groupname: 'KDITクラス',
        body: '神戸電子専門学校のITクラスです。',
        invite_code: 'itinvite', // 招待コードを固定
      },
    });
    console.log(`✅ Created group "${group3.groupname}" with fixed invite code.`);

    // God以外の全ユーザーを取得
    const allUsersExceptGod = await prisma.user.findMany({
      where: {
        // email: {
        //   not: 'kobe_taro@example.com'
        // }
      }
    });

    // Aliceを管理者、それ以外を一般メンバーとして一括で追加
    const group3Members = allUsersExceptGod.map(user => ({
      user_id: user.id,
      group_id: group3.id,
      admin_flg: user.email === 'alice@example.com', // Aliceだけ管理者
    }));

    await prisma.groups_User.createMany({
      data: group3Members,
    });
    console.log(`✅ Added ${group3Members.length} members to "${group3.groupname}".`);

    // 「神戸ゼミ」のお知らせと課題 (Kobe Taro Dataに移動)



    // 「KDITクラス」のお知らせ
    await prisma.post.create({
      data: {
        content: '夏期集中講座の申し込みが開始されました。希望者はメールを確認してください。',
        groupId: group3.id,
        authorId: alice.id, // 管理者であるアリスが投稿
      }
    });
    // --- ▼▼▼ ここから課題のシーディング処理を追加 ▼▼▼ ---
    console.log('🌱 Seeding assignments with problem relations...');

    // 1. 課題を割り当てるグループを名前で取得
    // 神戸ゼミはここでは取得しない
    const kditGroup = await prisma.groups.findFirst({
      where: { groupname: 'KDITクラス' },
    });

    // 2. 紐付けたい問題をタイトルで取得（IDよりも安定的です）
    const problemAplusB = await prisma.programmingProblem.findFirst({ where: { title: 'A + B' } });
    const problemFizzBuzz = await prisma.programmingProblem.findFirst({ where: { title: 'FizzBuzz' } });
    const problemPythonVar = await prisma.selectProblem.findFirst({ where: { title: 'Pythonの変数宣言について' } });

    if (kditGroup) {
      const assignmentsToCreate = [];

      // --- 神戸ゼミの課題 (削除) ---

      // FizzBuzz問題が見つかった場合のみ、課題を作成して紐付ける
      if (problemFizzBuzz) {
        assignmentsToCreate.push({
          groupid: kditGroup.id,
          title: '[アルゴリズム] FizzBuzz問題',
          description: '添付の問題を解き、プログラミングの基本的なループと条件分岐の理解を深めましょう。',
          due_date: new Date('2026-01-24T23:59:59Z'), // 1/24
          programmingProblemId: problemFizzBuzz.id,
        });
      }

      // --- KDITクラスの課題 ---
      // Python変数宣言の問題が見つかった場合のみ、課題を作成して紐付ける
      if (problemPythonVar) {
        assignmentsToCreate.push({
          groupid: kditGroup.id,
          title: '[Python基礎] 変数宣言の基本',
          description: '添付の選択問題を解いて、Pythonにおける正しい変数宣言の方法を理解しましょう。',
          due_date: new Date('2026-01-31T23:59:59Z'), // 1/31
          selectProblemId: problemPythonVar.id,
        });
      }

      // A+B問題が見つかった場合のみ、課題を作成して紐付ける
      if (problemAplusB) {
        assignmentsToCreate.push({
          groupid: kditGroup.id,
          title: '[ウォーミングアップ] 簡単な足し算',
          description: 'プログラミングに慣れるための最初のステップです。添付問題の指示に従い、2つの数値を足し合わせるプログラムを書いてみましょう。',
          due_date: new Date('2026-01-24T23:59:59Z'), // 1/24
          programmingProblemId: problemAplusB.id,
        });
        // もう一つ課題を追加して、2-2にする
        assignmentsToCreate.push({
          groupid: kditGroup.id,
          title: '[復習] 足し算 再挑戦',
          description: '復習としてもう一度解いてみましょう。',
          due_date: new Date('2026-01-31T23:59:59Z'), // 1/31
          programmingProblemId: problemAplusB.id, // 同じ問題でOK（Assignment的には別IDになる）
        });
      }

      // 3. 準備ができた課題データをデータベースに作成
      await prisma.assignment.createMany({
        data: assignmentsToCreate,
        skipDuplicates: true,
      });
      console.log(`✅ Created ${assignmentsToCreate.length} assignments.`);

    } else {
      console.warn('⚠️ Could not find "KDITクラス". Skipping assignment creation.');
    }
  }

  // --- 5. イベントと参加者のシーディング ---
  console.log('🌱 Seeding events and participants...');
  const kobeTaroForEvent = await prisma.user.findUnique({ where: { email: 'kobe_taro@example.com' } });
  const satoMisaki = await prisma.user.findUnique({ where: { email: 'sato@example.com' } });

  if (kobeTaroForEvent && satoMisaki) {
    // イベントを作成 (作成者は神戸太郎)
    const event1 = await prisma.create_event.create({
      data: {
        title: 'コーディングチャレンジ Vol.1',
        description: '最初のコーディングチャレンジイベントです。腕試しをしてみましょう！',
        inviteCode: 'event1-invite',
        publicStatus: true,
        startTime: new Date('2025-12-01T10:00:00Z'),
        endTime: new Date('2025-12-01T12:00:00Z'),
        publicTime: new Date('2025-11-30T10:00:00Z'),
        creatorId: kobeTaroForEvent.id,
      },
    });

    // 参加者を登録 (神戸太郎: 管理者, 佐藤美咲: 一般参加者)
    await prisma.event_Participants.createMany({
      data: [
        {
          eventId: event1.id,
          userId: kobeTaroForEvent.id,
          isAdmin: true,
        },
        {
          eventId: event1.id,
          userId: satoMisaki.id,
          isAdmin: false,
        },
      ],
    });
    console.log(`✅ Created event "${event1.title}" with 2 participants.`);
  }

  console.log(`🎉 User and group seeding finished.`);
}