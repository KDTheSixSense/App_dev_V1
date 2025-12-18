import { PrismaClient } from '@prisma/client';

export async function seedAdminUsers(prisma: PrismaClient) {
    console.log('👑 Seeding Admin Users...');

    const adminEmails = [
        'alice@example.com',
        'kd1244225@st.kobedenshi.ac.jp'
    ];

    for (const email of adminEmails) {
        await prisma.user.upsert({
            where: { email },
            update: { isAdmin: true },
            create: {
                email,
                isAdmin: true,
                username: email.split('@')[0], // create default username from email part
            },
        });
        console.log(`✅ User ${email} is ensured as Admin.`);
    }
}
