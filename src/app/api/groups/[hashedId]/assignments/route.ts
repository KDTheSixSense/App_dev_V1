// /app/api/groups/[hashedId]/assignments/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Prismaの型をインポート
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: string; email: string; username?: string | null };
}

// 課題一覧を取得 (GET)
export async function GET(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? session.user.id : null;
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  const urlParts = req.url.split('/');
  const hashedId = urlParts[urlParts.length - 2];

  if (!hashedId) {
    return NextResponse.json({ success: false, message: 'Invalid group ID format.' }, { status: 400 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const withSubmissions = searchParams.get('withSubmissions') === 'true';
    const skip = (page - 1) * limit;

    const group = await prisma.groups.findUnique({
      where: { hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    let assignments;
    let total;

    if (withSubmissions) {
      // === Admin: 提出状況一覧用のデータ取得ロジック ===
      const [rawAssignments, totalAssignments] = await Promise.all([
        prisma.assignment.findMany({
          where: { groupid: group.id },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.assignment.count({ where: { groupid: group.id } }),
      ]);
      total = totalAssignments;

      const groupMembers = await prisma.groups_User.findMany({
        where: { group_id: group.id },
        include: { user: { select: { id: true, username: true, icon: true } } },
      });

      assignments = await Promise.all(
        rawAssignments.map(async (assignment) => {
          const submissionsInDb = await prisma.submissions.findMany({
            where: { assignment_id: assignment.id },
          });

          const memberSubmissions = groupMembers.map(member => {
            const submission = submissionsInDb.find(s => s.userid === member.user_id);
            return {
              user: {
                id: member.user.id,
                username: member.user.username,
                icon: member.user.icon,
              },
              status: submission ? submission.status : '未提出',
            };
          });

          return { ...assignment, Submissions: memberSubmissions };
        })
      );
    } else {
      // === Member: 通常の課題一覧用のデータ取得ロジック ===
      const [rawAssignments, totalAssignments] = await Promise.all([
        prisma.assignment.findMany({
          where: { groupid: group.id },
          include: {
            // ログインユーザー自身の提出状況のみを取得
            Submissions: { where: { userid: userId ?? -1 as any } },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.assignment.count({ where: { groupid: group.id } }),
      ]);
      assignments = rawAssignments;
      total = totalAssignments;
    }

    return NextResponse.json({
      success: true,
      data: assignments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('課題取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// 課題を作成 (POST)
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  const userId = sessionUserId;

  try {
    const urlParts = req.url.split('/');
    const hashedId = urlParts[urlParts.length - 2]; // Assuming hashedId is the second to last part of the URL
    const body = await req.json();
    const { title, description, dueDate, programmingProblemId, selectProblemId } = body;

    if (!title || !dueDate) {
      return NextResponse.json({ success: false, message: 'タイトルと期日は必須です。' }, { status: 400 });
    }
    // 課題がなくても投稿できるようにする場合は、以下のチェックをコメントアウト
    // if (!programmingProblemId && !selectProblemId) {
    //   return NextResponse.json({ success: false, message: '課題となる問題が指定されていません。' }, { status: 400 });
    // }

    if (typeof hashedId !== 'string') {
      return NextResponse.json({ success: false, message: '無効なグループIDです。' }, { status: 400 });
    }

    const group = await prisma.groups.findUnique({ where: { hashedId: hashedId } });
    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // ユーザーが管理者かどうかのチェック
    const membership = await prisma.groups_User.findFirst({
      where: {
        group_id: group.id,
        user_id: userId as any,
        admin_flg: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ success: false, message: 'この操作を行う権限がありません' }, { status: 403 });
    }

    const newAssignment = await prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.assignment.create({
        data: {
          title,
          description,
          due_date: new Date(dueDate), // due_dateをDateオブジェクトに変換
          group: { connect: { id: group.id } },
          // IDが存在する場合のみ、それぞれの問題と接続
          ...(programmingProblemId && { programmingProblem: { connect: { id: Number(programmingProblemId) } } }),
          ...(selectProblemId && { selectProblem: { connect: { id: Number(selectProblemId) } } }),
        },
      });

      // グループの全メンバーを取得
      const members = await tx.groups_User.findMany({
        where: { group_id: group.id },
        select: { user_id: true },
      });

      // 全メンバーに対して「未提出」の提出レコードを作成
      const submissionData = members.map(member => ({
        assignment_id: createdAssignment.id,
        userid: member.user_id,
        status: '未提出',
        description: '', // 初期値は空
        codingid: 0,     // 初期値は0
      }));

      if (submissionData.length > 0) {
        await tx.submissions.createMany({
          data: submissionData,
        });
      }

      return createdAssignment;
    });

    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('課題作成APIエラー:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      // 外部キー制約違反
      if (error.meta?.field_name === 'Assignment_programmingProblemId_fkey') {
        return NextResponse.json({ success: false, message: '指定されたプログラミング問題が見つかりません。' }, { status: 404 });
      }
      if (error.meta?.field_name === 'Assignment_selectProblemId_fkey') {
        return NextResponse.json({ success: false, message: '指定された選択問題が見つかりません。' }, { status: 404 });
      }
    }
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}