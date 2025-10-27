// /workspaces/my-next-app/src/app/(main)/event/event_detail/[eventId]/page.tsx
import { notFound } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import AdminView from './AdminView'; // admin用ビュー
import MemberView from './MemberView'; // member用ビュー

// Define the type for the event data fetched by page.tsx
// This should match the EventWithDetails type in AdminView/MemberView
type EventWithDetailsForPage = Prisma.Create_eventGetPayload<{
  include: {
    participants: {
      include: { user: true };
    };
    issues: {
      include: { problem: true };
    };
  };
}>;

// AdminView/MemberViewに渡すために、currentUserParticipantプロパティを追加した拡張型
type EventForView = EventWithDetailsForPage & {
  currentUserParticipant?: Prisma.Event_ParticipantsGetPayload<{
    include: { user: true };
  }> | null;
};

type Role = 'admin' | 'member' | 'guest';

/**
 * イベント詳細とユーザーの役割を取得する
 */
async function getEventAndUserRole(eventId: number, userId: number | null) {
  const event = await prisma.create_event.findUnique({ // Corrected model name
    where: { id: eventId },
    include: {
      // 参加者一覧や問題一覧など、必要な情報をここで取得
      participants: {
        include: { // Include user details for participants
          user: true,
        },
      },
      issues: { // Corrected relation name from 'problems' to 'issues'
        include: {
          problem: true, // Include the actual ProgrammingProblem
        },
      },
    },
  });

  if (!event) { // event can be null if not found
    return { event: null, role: 'guest' as Role }; // Return null event
  }

  // Type assertion to match the expected type for AdminView/MemberView
  const typedEvent: EventWithDetailsForPage = event;

  if (!userId) {
    return { event: typedEvent, role: 'guest' as Role };
  }

  // Check if the current user is the creator of the event
  if (typedEvent.creatorId === userId) { // Use creatorId from Create_event model
    return { event, role: 'admin' as Role };
  }

  // 参加者かどうかをチェック（ここでは participants に含まれるかで判定）
  const isParticipant = typedEvent.participants.some(p => p.userId === userId); // Check userId in Event_Participants
  return { event: typedEvent, role: isParticipant ? 'member' as Role : 'guest' as Role };
}

export default async function EventDetailPage({ params }: { params: { eventId: string } }) {
  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.eventId, 10);
  const session = await getAppSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (isNaN(eventId)) notFound();

  const { event, role } = await getEventAndUserRole(eventId, userId) as { event: EventForView | null, role: Role }; // Type assertion for destructuring

  if (!event) notFound();

  // --- ▼▼▼【ここから修正】▼▼▼ ---
  // MemberView に渡す event オブジェクトに、ログイン中のユーザー自身の参加者情報を追加します。
  // これにより、MemberView は「誰が」参加承認ボタンを押したのかを正しく認識できるようになります。
  event.currentUserParticipant = event.participants.find(p => p.userId === userId) || null;
  // --- ▲▲▲【修正ここまで】▲▲▲ ---

  if (role === 'admin') {
    return <AdminView event={event} />; // event is already typed correctly
  }

  // member もしくは guest (イベントに参加していないが見ることはできる場合)
  return <MemberView event={event} role={role} />;
}
