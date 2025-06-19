// api/auth/reset-password.ts

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';



export async function POST(req: Request) {
  const { token, password } = await req.json();

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return new Response(JSON.stringify({ message: '無効または期限切れのトークンです' }), { status: 400 });
  }

  // ハッシュ化（bcrypt推奨）
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    },
  });

  return new Response(JSON.stringify({ message: 'パスワードを更新しました' }), { status: 200 });
}
