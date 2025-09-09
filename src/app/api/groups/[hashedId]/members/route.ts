// src/app/api/groups/[hashedId]/members/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: Request,
  context: any
) {
  const { params } = context;
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }

    const { hashedId } = params;

    const group = await prisma.groups.findUnique({
      where: { hashedId },
      include: {
        groups_User: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                icon: true,
                level: true,
                xp: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // フロントエンドの型定義に合わせてデータを整形
    const members = group.groups_User.map(gu => ({
      id: gu.user.id,
      name: gu.user.username || '名無し',
      email: gu.user.email,
      avatar: gu.user.icon || gu.user.username?.charAt(0) || '?', // アバターがない場合のフォールバック
      isAdmin: gu.admin_flg,
      onlineStatus: 'offline', // オンライン状態は別途実装が必要です
      level: gu.user.level,
      xp: gu.user.xp,
      posts: 0, // 仮の値
      assignments: 0, // 仮の値
      attendance: 0, // 仮の値
    }));
    
    const adminCount = members.filter(m => m.isAdmin).length;

    const stats = {
        totalMembers: members.length,
        onlineMembers: 0, // オンライン状態は別途実装が必要です
        adminCount: adminCount,
        studentCount: members.length - adminCount,
    };

    return NextResponse.json({ success: true, data: { members, stats } });

  } catch (error) {
    console.error('メンバー情報の取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}