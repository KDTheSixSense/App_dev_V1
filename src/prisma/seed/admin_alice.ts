import { PrismaClient } from '@prisma/client';

export async function seedAdminUsers(prisma: PrismaClient) {
    console.log('👑 Seeding Admin Users...');

    const adminEmails = [
        'alice@example.com',
        'kd1244225@st.kobedenshi.ac.jp'
    ];

    for (const email of adminEmails) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            await prisma.user.update({
                where: { email },
                data: { isAdmin: true },
            });
            console.log(`✅ User ${email} is now an Admin.`);
        } else {
            console.warn(`⚠️ User ${email} not found. Skipping Admin update.`);
        }
    }
}
