// /app/api/submissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sessionOptions } from '@/lib/session';

interface SessionData {
  user?: { id: number | string; email: string };
}

/**
 * 課題に対する新しい提出を作成します。
 */
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      assignmentId, // どの課題に対する提出か
      status,       // 例: '提出済み', '採点中'
      description,  // 選択問題の答えや、プログラミング問題へのコメントなど
      codingId,     // プログラミング問題の提出コードID
    } = body;

    // 基本的なバリデーション
    if (!assignmentId) {
      return NextResponse.json({ success: false, message: '課題IDが必要です' }, { status: 400 });
    }

    const userId = Number(sessionUserId);

    // トランザクションで権限チェックと作成を同時に行う
    const newSubmission = await prisma.$transaction(async (tx) => {
      // 1. 課題が存在し、どのグループに属しているか確認
      const assignment = await tx.assignment.findUnique({
        where: { id: Number(assignmentId) },
        select: { groupid: true },
      });

      if (!assignment || !assignment.groupid) {
        throw new Error('指定された課題が見つかりません。');
      }

      // 2. ユーザーがそのグループのメンバーであるか確認
      const membership = await tx.groups_User.findFirst({
        where: { group_id: assignment.groupid, user_id: userId },
      });

      if (!membership) {
        throw new Error('この課題に提出する権限がありません。');
      }

      // 3. 既存の提出レコードを検索
      const existingSubmission = await tx.submissions.findUnique({
        where: {
          assignment_id_userid: {
            assignment_id: Number(assignmentId),
            userid: userId,
          },
        },
      });

      if (existingSubmission) {
        // 4a. レコードがあれば更新
        return tx.submissions.update({
          where: { id: existingSubmission.id },
          data: {
            status: status || '提出済み',
            description: description || '',
            ...(codingId !== undefined && { codingid: Number(codingId) }),
            submitted_at: new Date(),
          },
        });
      } else {
        // 4b. レコードがなければ作成
        return tx.submissions.create({
          data: {
            assignment_id: Number(assignmentId),
            userid: userId,
            status: status || '提出済み',
            description: description || '',
            codingid: codingId ? Number(codingId) : 0,
            submitted_at: new Date(),
          },
        });
      }
    });

    return NextResponse.json({ success: true, data: newSubmission }, { status: 201 });

  } catch (error) {
    console.error('提出APIエラー:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      if (error.message.includes('課題が見つかりません')) {
        return NextResponse.json({ success: false, message: error.message }, { status: 404 });
      }
      if (error.message.includes('権限がありません')) {
        return NextResponse.json({ success: false, message: error.message }, { status: 403 });
      }
    }
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}