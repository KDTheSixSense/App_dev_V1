import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const participation = await prisma.event_Participants.findUnique({
    where: {
      eventId_userId_unique: {
        eventId: 2,
        userId: 12,
      },
    },
  });
  console.log(participation);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
