// src/app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const newUser = await prisma.user.create({
    data: {
      password: data.password,
      email: data.email,
      birth: data.birth
    },
  });
  return NextResponse.json(newUser);
}
