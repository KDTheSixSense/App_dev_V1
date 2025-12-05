import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
    user?: { id: number; email: string };
}

// お知らせを更新 (PUT)
export async function PUT(req: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const sessionUserId = session.user?.id;

    if (!sessionUserId) {
        return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }

    try {
        const urlParts = req.url.split('/');
        // .../groups/[hashedId]/posts/[postId]
        const postId = parseInt(urlParts[urlParts.length - 1], 10);

        if (isNaN(postId)) {
            return NextResponse.json({ success: false, message: '無効な投稿IDです' }, { status: 400 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json({ success: false, message: '投稿内容がありません' }, { status: 400 });
        }

        // 投稿の存在確認
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { group: true }
        });

        if (!post) {
            return NextResponse.json({ success: false, message: '投稿が見つかりません' }, { status: 404 });
        }

        // 権限チェック: 投稿者本人 または グループの管理者
        // Groups_User テーブルを使用し、admin_flg をチェック
        const member = await prisma.groups_User.findFirst({
            where: {
                group_id: post.groupId,
                user_id: sessionUserId,
                admin_flg: true
            }
        });

        if (!member && post.authorId !== sessionUserId) {
            return NextResponse.json({ success: false, message: '権限がありません' }, { status: 403 });
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { content },
        });

        return NextResponse.json({ success: true, data: updatedPost });
    } catch (error) {
        console.error('お知らせ更新エラー:', error);
        return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}

// お知らせを削除 (DELETE)
export async function DELETE(req: NextRequest) {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    const sessionUserId = session.user?.id;

    if (!sessionUserId) {
        return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }

    try {
        const urlParts = req.url.split('/');
        const postId = parseInt(urlParts[urlParts.length - 1], 10);

        if (isNaN(postId)) {
            return NextResponse.json({ success: false, message: '無効な投稿IDです' }, { status: 400 });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { group: true }
        });

        if (!post) {
            return NextResponse.json({ success: false, message: '投稿が見つかりません' }, { status: 404 });
        }

        // 権限チェック
        const member = await prisma.groups_User.findFirst({
            where: {
                group_id: post.groupId,
                user_id: sessionUserId,
                admin_flg: true
            }
        });

        if (!member && post.authorId !== sessionUserId) {
            return NextResponse.json({ success: false, message: '権限がありません' }, { status: 403 });
        }

        await prisma.post.delete({
            where: { id: postId },
        });

        return NextResponse.json({ success: true, message: '投稿を削除しました' });
    } catch (error) {
        console.error('お知らせ削除エラー:', error);
        return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
