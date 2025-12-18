// /app/api/groups/[hashedId]/assignments/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { groupParamsSchema, paginationSchema, assignmentSchema } from '@/lib/validations';
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
  const rawHashedId = urlParts[urlParts.length - 2];

  // Validate hashedId
  const groupValidation = groupParamsSchema.safeParse({ hashedId: rawHashedId });
  if (!groupValidation.success) {
    return NextResponse.json({ success: false, message: '無効なグループID形式です' }, { status: 400 });
  }
  const hashedId = groupValidation.data.hashedId;

  try {
    const { searchParams } = req.nextUrl;
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const withSubmissions = searchParams.get('withSubmissions') === 'true';

    // Validate Pagination
    const pageValidation = paginationSchema.safeParse({ page: rawPage, limit: rawLimit });
    if (!pageValidation.success) {
      return NextResponse.json({ success: false, message: '無効なページネーションパラメータです' }, { status: 400 });
    }
    const { page, limit } = pageValidation.data;

    const skip = (page - 1) * limit;

    const group = await prisma.groups.findUnique({
      where: { hashedId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // Verify membership for GET
    const membership = await prisma.groups_User.findFirst({
      where: { group_id: group.id, user_id: userId as any },
    });

    if (!membership) {
      return NextResponse.json({ success: false, message: 'グループのメンバーではありません。' }, { status: 403 });
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
    const rawHashedId = urlParts[urlParts.length - 2];

    // Validate hashedId
    const groupValidation = groupParamsSchema.safeParse({ hashedId: rawHashedId });
    if (!groupValidation.success) {
      return NextResponse.json({ success: false, message: '無効なグループID形式です' }, { status: 400 });
    }
    const hashedId = groupValidation.data.hashedId;
    // Validate body with assignmentSchema
    const body = await req.json();
    const validationResult = assignmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ success: false, message: '入力データが無効です', details: validationResult.error.flatten() }, { status: 400 });
    }

    const { title, description, dueDate, programmingProblemId, selectProblemId } = validationResult.data;

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

    // dueDate string is already validated as date string by Zod, safe to use new Date()
    // programmingProblemId and selectProblemId are optional

    const newAssignment = await prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.assignment.create({
        data: {
          title,
          description: description ?? '',
          due_date: new Date(dueDate),
          group: { connect: { id: group.id } },
          // Validation ensures these are numbers if coercible, or we cast them safely
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        // 外部キー制約違反
        if (error.meta?.field_name === 'Assignment_programmingProblemId_fkey') {
          return NextResponse.json({ success: false, message: '指定されたプログラミング問題が見つかりません。' }, { status: 404 });
        }
        if (error.meta?.field_name === 'Assignment_selectProblemId_fkey') {
          return NextResponse.json({ success: false, message: '指定された選択問題が見つかりません。' }, { status: 404 });
        }
      }
      // ★ Unique制約違反 (P2002) - 二重送信時の重複エラーハンドリング
      if (error.code === 'P2002') {
        return NextResponse.json({
          success: false,
          message: 'この問題は既に課題として割り当てられています（二重登録の可能性があります）。'
        }, { status: 409 });
      }
    }
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}