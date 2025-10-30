
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const eventDifficulties = await prisma.eventDifficulty.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return NextResponse.json(eventDifficulties);
  } catch (error) {
    console.error('Error fetching event difficulties:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch event difficulties', details: errorMessage }, { status: 500 });
  }
}
