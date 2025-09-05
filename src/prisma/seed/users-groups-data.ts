import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export async function seedUsersAndGroups(prisma: PrismaClient) {
  console.log('🌱 Seeding users and groups...');

  // 既存のグループ関連データをクリア
  await prisma.groups_User.deleteMany({});
  await prisma.groups.deleteMany({});

  //ユーザー情報
  const usersToSeed = [
    { email: 'alice@example.com', password: 'password123', username: 'Alice Smith', year: 2020, class: 1, birth: new Date('2002-04-15') },
    { email: 'bob@example.com', password: 'securepassword', username: 'Bob Johnson', year: 2021, class: 2, birth: new Date('2003-08-20') },
    { email: 'charlie@example.com', password: 'anotherpassword', username: 'Charlie Brown', year: 2020, class: 3, birth: new Date('2002-11-05') ,level: 18, xp: 17800, totallogin: 10 },
    { email: 'GodOfGod@example.com', password: 'godisgod', username: 'God', level: 9999, xp: 9999999, totallogin: 999 },
    { email: 'diana@example.com', password: 'password456', username: 'Diana Prince', level: 25, xp: 24500, totallogin: 50 },
    { email: 'eva@example.com', password: 'password789', username: 'Eva Green', level: 5, xp: 4100, totallogin: 3 },
    { email: 'frank@example.com', password: 'password101', username: 'Frank Castle', level: 50, xp: 49900, totallogin: 100 },
    { email: 'grace@example.com', password: 'password112', username: 'Grace Hopper', level: 50, xp: 49900, totallogin: 200 },
    { email: 'tanaka@example.com', password: 'password131', username: '田中 恵子', level: 2, xp: 1500, totallogin: 1 },
    { email: 'suzuki@example.com', password: 'password415', username: '鈴木 一郎', level: 18, xp: 17500, totallogin: 25 },
    { email: 'sato@example.com', password: 'password617', username: '佐藤 美咲', level: 22, xp: 21300, totallogin: 42 },
  ];

  //デモユーザーのペット情報の作成
  for (const u of usersToSeed) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        username: u.username,
        password: hashedPassword,
        level: u.level,
        xp: u.xp,
        totallogin: u.totallogin,
      },
      create: {
        email: u.email,
        username: u.username,
        password: hashedPassword,
        level: u.level,
        xp: u.xp,
        totallogin: u.totallogin,
        status_Kohaku: {
          create: {
            status: '空腹',
            hungerlevel: 49,
          },
        },
      },
    });
    console.log(`✅ Upserted user with email: ${u.email}`);
  }
  console.log('✅ Users seeded.');
  
  // グループとメンバーシップの作成
  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const godUser = await prisma.user.findUnique({ where: { email: 'GodOfGod@example.com' } });

  if (!alice || !godUser) {
    console.error("❌ Seeding users (alice, GodOfGod) not found. Aborting group creation.");
    return;
  }

  const pblGroup = await prisma.groups.create({
    data: {
      groupname: 'プログラミングクラブ',
      body: 'プログラミングについて学ぶグループです',
      invite_code: nanoid(8),
    },
  });
  console.log(`✅ Created group: "${pblGroup.groupname}"`);

  await prisma.groups_User.create({
    data: { user_id: alice.id, group_id: pblGroup.id, admin_flg: false },
  });
  console.log(`✅ Added Alice to "${pblGroup.groupname}" as a member.`);

  await prisma.groups_User.create({
    data: { user_id: godUser.id, group_id: pblGroup.id, admin_flg: true },
  });
  console.log(`✅ Added God to "${pblGroup.groupname}" as an admin.`);

  // UserSubjectProgressのシードデータ
  await prisma.userSubjectProgress.deleteMany({});
  await prisma.userSubjectProgress.createMany({
    data: [
      { user_id: 3, subject_id: 2, level: 9, xp: 8900 },
      { user_id: 3, subject_id: 3, level: 9, xp: 8900 },
    ],
  });
  console.log(`✅ Seeded UserSubjectProgress data for Alice.`);
}
