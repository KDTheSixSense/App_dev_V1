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
  await prisma.groups_User.deleteMany({});
  await prisma.userSubjectProgress.deleteMany({});
  await prisma.status_Kohaku.deleteMany({});
  await prisma.groups.deleteMany({});
  await prisma.create_event.deleteMany({});
  await prisma.userDailyMissionProgress.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('🗑️ Cleared existing user and group data.');

  
  // --- 2. シーディングするユーザーの基本情報を定義 ---
  const usersToSeed = [
    { email: 'alice@example.com', password: 'password123', username: 'Alice Smith' },
    { email: 'bob@example.com', password: 'securepassword', username: 'Bob Johnson' },
    { email: 'charlie@example.com', password: 'anotherpassword', username: 'Charlie Brown' },
    { email: 'diana@example.com', password: 'password456', username: 'Diana Prince' },
    { email: 'eva@example.com', password: 'password789', username: 'Eva Green' },
    { email: 'frank@example.com', password: 'password101', username: 'Frank Castle' },
    { email: 'grace@example.com', password: 'password112', username: 'Grace Hopper' },
    { email: 'tanaka@example.com', password: 'password131', username: '田中 恵子' },
    { email: 'suzuki@example.com', password: 'password415', username: '鈴木 一郎' },
    { email: 'sato@example.com', password: 'password617', username: '佐藤 美咲' },
    { email: 'kobe_taro@example.com', password: 'kobe', username: '神戸太郎' },
  ];

  // --- 3. 各ユーザーのデータと関連データを作成 ---
  console.log('🌱 Seeding users, pets, and subject progresses...');
  for (const userData of usersToSeed) {
    const subjectProgressData = [];
    let totalAccountXp = 0;
    const numberOfSubjects = 4; // subject_idが4まであると仮定

    // 科目ごとの進捗を生成
    for (let subjectId = 1; subjectId <= numberOfSubjects; subjectId++) {
      let subjectXp = 0;
      
      // ユーザーごとにXPの生成範囲を変える
      if (userData.username === '神戸太郎') {
        subjectXp = 8999;
      } else if (['Frank Castle', 'Grace Hopper'].includes(userData.username!)) {
        subjectXp = getRandomInt(10000, 50000);
      } else if (['Alice Smith', '鈴木 一郎'].includes(userData.username!)) {
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
    await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        level: accountLevel,
        xp: totalAccountXp,
        totallogin: getRandomInt(1, 500),
        ...userLoginData, // 神戸太郎の場合のみ、ここにデータが追加される
        status_Kohaku: {
          create: {
            status: '元気',
            hungerlevel: hungerLevel,
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
    // グループ1: 神戸太郎が管理者
    const group1 = await prisma.groups.create({
      data: {
        groupname: '神戸ゼミ',
        body: '神戸太郎が主催するゼミです。',
        invite_code: nanoid(8),
      },
    });
    await prisma.groups_User.create({
      data: { user_id: kobeTaro.id, group_id: group1.id, admin_flg: true },
    });
    console.log(`✅ Created group "${group1.groupname}" with Taro as Admin.`);

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
        email: {
          not: 'kobe_taro@example.com'
        }
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

        // 「神戸ゼミ」のお知らせと課題
    await prisma.post.createMany({
        data: [
            { content: '第一回ゼミ会のお知らせです。来週月曜の18時から開催します。', groupId: group1.id, authorId: kobeTaro.id },
            { content: '参考文献リストを共有します。各自確認してください。', groupId: group1.id, authorId: kobeTaro.id },
        ]
    });
    await prisma.assignment.createMany({
        data: [
            { groupid: group1.id, title: '事前課題: 論文レビュー', description: '指定した論文を読み、A4一枚でレビューをまとめてください。', due_date: new Date('2025-09-30T23:59:59Z') },
            { groupid: group1.id, title: '[実践] ReactでTodoアプリ作成', description: 'Next.jsとTypeScriptを使い、簡単なTodoアプリを実装してください。', due_date: new Date('2025-10-15T23:59:59Z') },
        ]
    });

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
    const kobeZemiGroup = await prisma.groups.findFirst({
      where: { groupname: '神戸ゼミ' },
    });
    const kditGroup = await prisma.groups.findFirst({
      where: { groupname: 'KDITクラス' },
    });

    // 2. 紐付けたい問題をタイトルで取得（IDよりも安定的です）
    const problemAplusB = await prisma.programmingProblem.findFirst({ where: { title: 'A + B' } });
    const problemFizzBuzz = await prisma.programmingProblem.findFirst({ where: { title: 'FizzBuzz' } });
    const problemPythonVar = await prisma.selectProblem.findFirst({ where: { title: 'Pythonの変数宣言について' } });

    if (kobeZemiGroup && kditGroup) {
      const assignmentsToCreate = [];

      // --- 神戸ゼミの課題 ---
      assignmentsToCreate.push({ groupid: kobeZemiGroup.id, title: '事前課題: 論文レビュー', description: '指定した論文を読み、A4一枚でレビューをまとめてください。', due_date: new Date('2025-10-30T23:59:59Z') });

      // FizzBuzz問題が見つかった場合のみ、課題を作成して紐付ける
      if (problemFizzBuzz) {
        assignmentsToCreate.push({
          groupid: kditGroup.id,
          title: '[アルゴリズム] FizzBuzz問題',
          description: '添付の問題を解き、プログラミングの基本的なループと条件分岐の理解を深めましょう。',
          due_date: new Date('2025-11-20T23:59:59Z'),
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
          due_date: new Date('2025-10-31T23:59:59Z'),
          selectProblemId: problemPythonVar.id,
        });
      }

      // A+B問題が見つかった場合のみ、課題を作成して紐付ける
      if (problemAplusB) {
        assignmentsToCreate.push({
          groupid: kditGroup.id,
          title: '[ウォーミングアップ] 簡単な足し算',
          description: 'プログラミングに慣れるための最初のステップです。添付問題の指示に従い、2つの数値を足し合わせるプログラムを書いてみましょう。',
          due_date: new Date('2025-11-05T23:59:59Z'),
          programmingProblemId: problemAplusB.id,
        });
      }

      // 3. 準備ができた課題データをデータベースに作成
      await prisma.assignment.createMany({
        data: assignmentsToCreate,
        skipDuplicates: true,
      });
      console.log(`✅ Created ${assignmentsToCreate.length} assignments.`);

    } else {
      console.warn('⚠️ Could not find "神戸ゼミ" or "KDITクラス". Skipping assignment creation.');
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