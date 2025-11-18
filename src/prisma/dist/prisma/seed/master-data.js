"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMasterData = seedMasterData;
const client_1 = require("@prisma/client");
// PrismaClientのインスタンスを引数として受け取るように変更
async function seedMasterData(prisma) {
    console.log('🌱 Seeding master data...');
    //難易度の設定等
    console.log('Seeding difficulties...');
    const difficultiesToSeed = [
        { id: 1, name: 'やさしい', xp: 200, feed: 40 }, { id: 2, name: 'かんたん', xp: 400, feed: 80 }, { id: 3, name: 'ふつう', xp: 800, feed: 160 }, { id: 4, name: 'むずかしい', xp: 1200, feed: 200 }, { id: 5, name: '鬼むず', xp: 2000, feed: 200 }, { id: 6, name: '基本資格A問題', xp: 40, feed: 8 }, { id: 7, name: '基本資格B問題(かんたん)', xp: 120, feed: 24 }, { id: 8, name: '基本資格B問題(むずかしい)', xp: 280, feed: 56 }, { id: 9, name: '応用資格午前問題', xp: 60, feed: 12 }, { id: 10, name: '応用資格午後問題', xp: 1200, feed: 200 },
    ];
    for (const d of difficultiesToSeed) {
        await prisma.difficulty.upsert({ where: { id: d.id }, update: {}, create: d });
    }
    console.log('✅ Difficulties seeded.');
    console.log('Seeding subjects...');
    const subjectsToSeed = [{ id: 1, name: 'プログラミング' }, { id: 2, name: '基本情報A問題' }, { id: 3, name: '基本情報B問題' }, { id: 4, name: '選択問題' }, { id: 5, name: '応用情報午前問題' }];
    for (const s of subjectsToSeed) {
        await prisma.subject.upsert({ where: { id: s.id }, update: {}, create: s });
    }
    console.log('✅ Subjects seeded.');
    console.log('Seeding genres...');
    const genresToSeed = [{ id: 1, genre: 'テクノロジ系' }, { id: 2, genre: 'マネジメント系' }, { id: 3, genre: 'ストラテジ系' }];
    for (const g of genresToSeed) {
        await prisma.genre.upsert({ where: { id: g.id }, update: {}, create: g });
    }
    console.log('✅ Genres seeded.');
    console.log('Seeding languages...');
    const languagesToSeed = [{ id: 1, name: '日本語' }, { id: 2, name: '擬似言語' }];
    for (const l of languagesToSeed) {
        await prisma.language.upsert({ where: { id: l.id }, update: {}, create: l });
    }
    console.log('✅ Languages seeded.');
    //称号
    console.log('Seeding titles...');
    const titlesToSeed = [
        { id: 1, name: '駆け出し冒険者', description: 'ユーザーレベル10に到達した証。', type: client_1.TitleType.USER_LEVEL, requiredLevel: 10 },
        { id: 2, name: '見習いプログラマー', description: 'プログラミングレベル10に到達した証。', type: client_1.TitleType.SUBJECT_LEVEL, requiredLevel: 10, requiredSubjectId: 1 },
        { id: 3, name: 'B問題の新人', description: '基本情報B問題レベル10に到達した証。', type: client_1.TitleType.SUBJECT_LEVEL, requiredLevel: 10, requiredSubjectId: 3 },
        { id: 4, name: 'A問題の新人', description: '基本情報A問題レベル10に到達した証。', type: client_1.TitleType.SUBJECT_LEVEL, requiredLevel: 10, requiredSubjectId: 2 },
        { id: 5, name: 'ベテラン冒険者', description: 'ユーザーレベル20に到達した証。', type: client_1.TitleType.USER_LEVEL, requiredLevel: 20 },
        { id: 6, name: 'マスター冒険者', description: 'ユーザーレベル30に到達した証。', type: client_1.TitleType.USER_LEVEL, requiredLevel: 30 },
        { id: 7, name: '熟練プログラマー', description: 'プログラミングレベル20に到達した証。', type: client_1.TitleType.SUBJECT_LEVEL, requiredLevel: 20, requiredSubjectId: 1 },
        { id: 8, name: 'マスタープログラマー', description: 'プログラミングレベル30に到達した証。', type: client_1.TitleType.SUBJECT_LEVEL, requiredLevel: 30, requiredSubjectId: 1 },
        { id: 9, name: 'A問題の達人', description: '基本情報A問題レベル20に到達した証。', type: client_1.TitleType.SUBJECT_LEVEL, requiredLevel: 20, requiredSubjectId: 2 },
        { id: 10, name: 'B問題の達人', description: '基本情報B問題レベル20に到達した証。', type: client_1.TitleType.SUBJECT_LEVEL, requiredLevel: 20, requiredSubjectId: 3 },
    ];
    for (const t of titlesToSeed) {
        await prisma.title.upsert({ where: { id: t.id }, update: {}, create: t });
    }
    console.log('✅ Titles seeded.');
    // 既存のカテゴリをクリアする場合（必要に応じて）
    const categories = [
        { id: 1, name: 'テクノロジ系' },
        { id: 2, name: 'マネジメント系' },
        { id: 3, name: 'ストラテジ系' },
    ];
    for (const category of categories) {
        await prisma.category.upsert({
            where: { id: category.id },
            update: category,
            create: category,
        });
    }
    const missionsToSeed = [
        {
            id: 1, // IDを固定すると管理しやすい
            title: '問題を解こう！',
            description: '1日1回いずれかの問題を解くと達成',
            missionType: client_1.DailyMissionType.Answer_the_Question,
            targetCount: 1,
            xpReward: 100,
        },
        {
            id: 2,
            title: 'ペットにエサをあげよう！',
            description: 'ペットに餌を150あげると達成',
            missionType: client_1.DailyMissionType.Feed_Them,
            targetCount: 150,
            xpReward: 400,
        },
        {
            id: 3,
            title: '経験値を獲得しよう！',
            description: '経験値を1000獲得すると達成',
            missionType: client_1.DailyMissionType.Gain_Xp,
            targetCount: 1000,
            xpReward: 500,
        },
    ];
    // upsert を使ってデータを登録・更新します
    for (const mission of missionsToSeed) {
        await prisma.dailyMissionMaster.upsert({
            where: { id: mission.id },
            update: {
                // id 以外を更新 (id は where で使われるため)
                title: mission.title,
                description: mission.description,
                missionType: mission.missionType,
                targetCount: mission.targetCount,
                xpReward: mission.xpReward,
            },
            create: mission, // 新規作成の場合は mission オブジェクト全体を使用
        });
    }
}
