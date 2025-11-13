import { PrismaClient } from '@prisma/client';

export async function seedEventDifficulty(prisma: PrismaClient) {
  console.log('Seeding EventDifficulty data...');

  const eventDifficulties = [
    {
      id: 1,
      difficultyName: 'かんたん',
      basePoints: 50,
      maxBonusPoints: 50,
      maxTotalPoints: 100,
      expectedTimeMinutes: 10,
      bonusPointsPerMinute: 5,
    },
    {
      id: 2,
      difficultyName: 'ふつう',
      basePoints: 100,
      maxBonusPoints: 120,
      maxTotalPoints: 220,
      expectedTimeMinutes: 20,
      bonusPointsPerMinute: 6,
    },
    {
      id: 3,
      difficultyName: 'ちょいむず',
      basePoints: 180,
      maxBonusPoints: 240,
      maxTotalPoints: 420,
      expectedTimeMinutes: 30,
      bonusPointsPerMinute: 8,
    },
    {
      id: 4,
      difficultyName: 'むずい',
      basePoints: 300,
      maxBonusPoints: 440,
      maxTotalPoints: 740,
      expectedTimeMinutes: 40,
      bonusPointsPerMinute: 11,
    },
    {
      id: 5,
      difficultyName: 'おにむず',
      basePoints: 470,
      maxBonusPoints: 750,
      maxTotalPoints: 1220,
      expectedTimeMinutes: 50,
      bonusPointsPerMinute: 15,
    },
  ];

  for (const data of eventDifficulties) {
    await prisma.eventDifficulty.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  console.log('EventDifficulty data seeded.');
}
