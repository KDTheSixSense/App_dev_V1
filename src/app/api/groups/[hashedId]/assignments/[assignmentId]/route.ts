
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
    user?: { id: number | string; email: string; username?: string | null };
}

// 課題を更新 (PUT)
export async function PUT(req: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id ? Number(session.user.id) : null;

    if (!userId) {
        return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }

    try {
        const urlParts = req.url.split('/');
        const assignmentId = Number(urlParts[urlParts.length - 1]);
        const hashedId = urlParts[urlParts.length - 3]; // .../groups/[hashedId]/assignments/[assignmentId]

        if (isNaN(assignmentId)) {
            return NextResponse.json({ success: false, message: '無効な課題IDです' }, { status: 400 });
        }

        const body = await req.json();
        const { title, description, dueDate, programmingProblemId, selectProblemId } = body;

        // グループと権限のチェック
        const group = await prisma.groups.findUnique({ where: { hashedId } });
        if (!group) {
            return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
        }

        const membership = await prisma.groups_User.findFirst({
            where: {
                group_id: group.id,
                user_id: userId,
                admin_flg: true,
            },
        });

        if (!membership) {
            return NextResponse.json({ success: false, message: 'この操作を行う権限がありません' }, { status: 403 });
        }

        // 更新データ作成
        const updateData: any = {
            title,
            description,
            due_date: new Date(dueDate),
        };

        // 問題の紐付け更新（nullが送られてきたら解除、IDがあれば更新）
        if (programmingProblemId !== undefined) {
            updateData.programmingProblem = programmingProblemId ? { connect: { id: Number(programmingProblemId) } } : { disconnect: true };
        }
        if (selectProblemId !== undefined) {
            updateData.selectProblem = selectProblemId ? { connect: { id: Number(selectProblemId) } } : { disconnect: true };
        }

        const updatedAssignment = await prisma.assignment.update({
            where: { id: assignmentId },
            data: updateData,
            include: {
                programmingProblem: true,
                selectProblem: true
            }
        });

        return NextResponse.json({ success: true, data: updatedAssignment });

    } catch (error) {
        console.error('課題更新エラー:', error);
        return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}

// 課題を削除 (DELETE)
export async function DELETE(req: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const userId = session.user?.id ? Number(session.user.id) : null;

    if (!userId) {
        return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }

    try {
        const urlParts = req.url.split('/');
        const assignmentId = Number(urlParts[urlParts.length - 1]);
        const hashedId = urlParts[urlParts.length - 3];

        if (isNaN(assignmentId)) {
            return NextResponse.json({ success: false, message: '無効な課題IDです' }, { status: 400 });
        }

        // グループと権限のチェック
        const group = await prisma.groups.findUnique({ where: { hashedId } });
        if (!group) {
            return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
        }

        const membership = await prisma.groups_User.findFirst({
            where: {
                group_id: group.id,
                user_id: userId,
                admin_flg: true,
            },
        });

        if (!membership) {
            return NextResponse.json({ success: false, message: 'この操作を行う権限がありません' }, { status: 403 });
        }

        // 削除実行
        // 関連するSubmissionsも削除する必要があるが、PrismaのCascade設定に依存
        // 安全のため手動で削除してから課題を削除する
        await prisma.$transaction([
            prisma.submissions.deleteMany({
                where: { assignment_id: assignmentId }
            }),
            prisma.assignment.delete({
                where: { id: assignmentId }
            })
        ]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('課題削除エラー:', error);
        return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
