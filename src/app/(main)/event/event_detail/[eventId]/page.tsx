// /workspaces/my-next-app/src/app/(main)/event/event_detail/[eventId]/page.tsx
import { notFound, redirect } from 'next/navigation';
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
      include: {
        user: {
          // ユーザーに紐づくイベント提出情報を取得
          include: { eventSubmissions: true };
        };
      };
    };
    issues: {
      include: { problem: true };
    };
  };
}>;

// AdminView/MemberViewに渡すために、currentUserParticipantプロパティを追加した拡張型
type EventForView = EventWithDetailsForPage & {
  currentUserParticipant?: Prisma.Event_ParticipantsGetPayload<{
    include: {
      user: {
        include: { eventSubmissions: true };
      };
    };
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
          user: {
            include: { eventSubmissions: true },
          },
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

  // 参加者かどうかをチェック
  const participant = typedEvent.participants.find(p => p.userId === userId);

  // 管理者（作成者またはisAdminフラグを持つ参加者）かどうかを判定
  if (typedEvent.creatorId === userId || participant?.isAdmin) {
    return { event: typedEvent, role: 'admin' as Role };
  }

  if (participant) {
    return { event: typedEvent, role: 'member' as Role };
  }

  return { event: typedEvent, role: 'guest' as Role };
}

export default async function EventDetailPage({ params }: { params: { eventId: string } }) {
  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.eventId, 10);
  const session = await getAppSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (isNaN(eventId)) notFound();

  const { event, role } = await getEventAndUserRole(eventId, userId) as { event: EventForView | null, role: Role }; // Type assertion for destructuring

  if (!event) notFound();

  // --- アクセス制御ロジック ---
  // 管理者でない場合
  if (role !== 'admin') {
    // 1. イベントが開始前の場合 (isStarted: false, startTime > now)
    //    ※終了後と区別するためstartTimeも見るが、現状のロジックではisStartedだけで十分
    if (!event.isStarted && event.startTime && new Date(event.startTime) > new Date()) {
      return redirect('/event/event_list'); // 開始前は一覧へリダイレクト
    }

    // 2. イベントが終了後の場合 (isStarted: false, endTime < now)
    if (!event.isStarted && event.endTime && new Date(event.endTime) < new Date()) {
      const score = event.participants.find(p => p.userId === userId)?.event_getpoint ?? 0;
      const eventName = encodeURIComponent(event.title);
      // 終了後はポップアップ表示用のパラメータを付けてリダイレクト
      return redirect(`/event/event_list?event_ended=true&score=${score}&eventName=${eventName}`);
    }
  }
  // --- アクセス制御ここまで ---

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
