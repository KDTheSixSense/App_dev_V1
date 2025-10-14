// /app/api/groups/[hashedId]/assignments/programming/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

interface SessionData {
  user?: { id: number | string; email: string };
}

export async function POST(req: NextRequest, context: any) {
  const { params } = context;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;

    if (!sessionUserId) {
        return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }
    
    const userId = Number(sessionUserId);

    try {
        const body = await req.json();
        // selectProblemId も受け取る
        const { title, description, dueDate, programmingProblemId, selectProblemId } = body;

        if (!title || !description || !dueDate) {
            return NextResponse.json({ success: false, message: '必須項目が不足しています' }, { status: 400 });
        }

        const group = await prisma.groups.findUnique({
            where: { hashedId: params.hashedId },
            select: { id: true },
        });

        if (!group) {
            return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
        }

        const membership = await prisma.groups_User.findUnique({
            where: {
                group_id_user_id: { group_id: group.id, user_id: userId },
            },
        });

        if (!membership?.admin_flg) {
            return NextResponse.json({ success: false, message: '権限がありません' }, { status: 403 });
        }
        
        // ★ 修正: Prismaに渡すデータを作成
        const dataToCreate: Prisma.AssignmentCreateInput = {
            title,
            description,
            due_date: new Date(dueDate),
            group: {
                connect: { id: group.id }
            },
        };

        // programmingProblemId があれば接続
        if (programmingProblemId) {
            dataToCreate.programmingProblem = {
                connect: { id: Number(programmingProblemId) }
            };
        } 
        // selectProblemId があれば接続
        else if (selectProblemId) {
            dataToCreate.selectProblem = {
                connect: { id: Number(selectProblemId) }
            };
        }

        const newAssignment = await prisma.assignment.create({
            data: dataToCreate,
        });

        return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
    } catch (error) {
        console.error('課題作成エラー:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Prismaのエラーをより具体的に返す
            return NextResponse.json({ success: false, message: `データベースエラー: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}