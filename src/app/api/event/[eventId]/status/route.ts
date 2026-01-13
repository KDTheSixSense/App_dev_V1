import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const prismaClient = prisma;
/**
 * 特定のイベントの状態（特に isStarted）を取得するAPIエンドポイント
 */
export async function GET(
  request: Request,
  { params }: any
) {
  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.eventId, 10);

  if (isNaN(eventId)) {
    return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
  }

  try {
    const event = await prismaClient.create_event.findUnique({
      where: { id: eventId },
      select: { isStarted: true, hasBeenStarted: true, theme: true, customImagePath: true }, // hasBeenStartedも取得
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ isStarted: event.isStarted, hasBeenStarted: event.hasBeenStarted, theme: event.theme, customImagePath: (event as any).customImagePath });

  } catch (error) {
    console.error(`Failed to get status for event ${eventId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
