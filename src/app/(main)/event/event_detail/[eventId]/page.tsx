// /workspaces/my-next-app/src/app/(main)/event/event_detail/[eventId]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { getAppSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import AdminView from './AdminView'; // admin用ビュー
import MemberView, { type MemberViewEvent } from './MemberView'; // member用ビューと型をインポート

// Define the type for the event data fetched by page.tsx
// This should match the EventWithDetails type in AdminView/MemberView
type EventWithDetailsForPage = Prisma.Create_eventGetPayload<{
  include: {
    participants: {
      include: {
        user: {
          include: {
            eventSubmissions: {
              select: { eventIssueId: true, startedAt: true, status: true },
            },
          },
        },
      };
    };
    issues: {
      include: { problem: true };
    };
  };
}>;

// AdminView/MemberViewに渡すために、currentUserParticipantプロパティを追加した拡張型
type EventForView = MemberViewEvent & { // MemberViewの型を拡張元にする
  currentUserParticipant?: Prisma.Event_ParticipantsGetPayload<{
    include: {
      user: {
        include: {
          eventSubmissions: { select: { eventIssueId: true, startedAt: true, status: true } }
        }
      }
    }
  }> | null
};

type Role = 'admin' | 'member';

/**
 * イベント詳細とユーザーの役割を取得する
 */
async function getEventAndUserRole(eventId: number, userId: number | null) {
  const event = await prisma.create_event.findUnique({
    where: { id: eventId },
    include: {
      // 参加者一覧や問題一覧など、必要な情報をここで取得
      participants: {
        include: {
          user: {
            include: {
              eventSubmissions: {
                select: { eventIssueId: true, startedAt: true, status: true },
              },
            },
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

  if (!event) {
    return { event: null, role: null };
  }

  // Type assertion to match the expected type for AdminView/MemberView
  const typedEvent: EventWithDetailsForPage = event;

  if (!userId) {
    return { event: typedEvent, role: null };
  }

  // 参加者かどうかをチェック
  const participant = typedEvent.participants.find(p => p.userId === userId);

  // 管理者（作成者またはisAdminフラグを持つ参加者）かどうかを判定
  if (typedEvent.creatorId === userId || participant?.isAdmin) {
    return { event: typedEvent, role: 'admin' as Role, participant };
  }

  if (participant) {
    return { event: typedEvent, role: 'member' as Role, participant };
  }

  return { event: typedEvent, role: null, participant: null };
}

export default async function EventDetailPage({ params }: any) {
  const eventId = parseInt(params.eventId, 10);
  const session = await getAppSession();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (isNaN(eventId)) notFound();

  const { event, role, participant } = await getEventAndUserRole(eventId, userId);

  if (!event) notFound();

  // ロールがない(非参加者)場合はイベント一覧にリダイレクト
  if (!role) {
    return redirect('/event/event_list');
  }

  // MemberView に渡す event オブジェクトに、ログイン中のユーザー自身の参加者情報を追加
  const eventForView: EventForView = {
    ...event,
    currentUserParticipant: participant,
  };

  if (role === 'admin') {
    return <AdminView event={eventForView} />;
  } else { // 'member'
    // --- アクセス制御ロジック (管理者でない場合) ---
    // 1. イベントが開始前の場合 (isStarted: false, startTime > now)
    if (!event.isStarted && event.startTime && new Date(event.startTime) > new Date()) {
      return redirect('/event/event_list'); // 開始前は一覧へリダイレクト
    }

    // 2. イベントが終了後の場合 (isStarted: false, endTime < now)
    // ★★★ 修正点: roleが'member'の場合のみリダイレクトする ★★★
    if (!event.isStarted && event.endTime && new Date(event.endTime) < new Date()) {
      const score = event.participants.find(p => p.userId === userId)?.event_getpoint ?? 0;
      // イベント名をエンコード
      const eventName = encodeURIComponent(event.title);
    
      // 結果表示用のパラメータを付けてイベント一覧ページにリダイレクト
      return redirect(`/event/event_list?event_ended=true&score=${score}&eventName=${eventName}`);
    }

    // member もしくは guest (イベントに参加していないが見ることはできる場合)
    return <MemberView event={eventForView} role={role} />;
  }
}
