// src/app/api/groups/[hashedId]/members/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session.server';
import { Icon } from 'lucide-react';

export async function GET(request: NextRequest, context: { params: Promise<{ hashedId: string }> }) {
  const params = await context.params;
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

    // メンバーシップチェック: リクエストユーザーがグループのメンバーか確認
    // 型の不一致を防ぐため String() で比較します
    const isMember = group.groups_User.some(gu => String(gu.user.id) === String(session.user?.id));

    if (!isMember) {
      return NextResponse.json({ success: false, message: 'このグループのメンバーではありません' }, { status: 403 });
    }

    // フロントエンドの型定義に合わせてデータを整形
    const members = group.groups_User.map(gu => ({
      id: gu.user.id,
      name: gu.user.username || '名無し',
      email: gu.user.email,
      icon: gu.user.icon || null,
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

// メンバーの権限を変更するPUTメソッド
export async function PUT(request: NextRequest, context: { params: Promise<{ hashedId: string }> }) {
  const params = await context.params;
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
    }
    const requesterId = session.user.id;
    const { hashedId } = params;
    const body = await request.json();
    const { userId, isAdmin } = body; // 対象ユーザーIDと新しい権限フラグ

    // グループIDを取得
    const group = await prisma.groups.findUnique({
      where: { hashedId },
      select: { id: true }
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // リクエスト送信者が管理者であることを確認
    const requesterMembership = await prisma.groups_User.findUnique({
      where: {
        group_id_user_id: {
          group_id: group.id,
          user_id: requesterId as any
        }
      }
    });

    if (!requesterMembership || !requesterMembership.admin_flg) {
      return NextResponse.json({ success: false, message: '権限を変更する権限がありません' }, { status: 403 });
    }

    // 新しい権限が「メンバー(isAdmin: false)」の場合のみチェックを行う
    if (isAdmin === false) {
      // 現在のこのグループの管理者数をカウント
      const adminCount = await prisma.groups_User.count({
        where: {
          group_id: group.id,
          admin_flg: true
        }
      });

      // ターゲットのユーザーが現在管理者かどうかを確認
      const targetMembership = await prisma.groups_User.findUnique({
        where: {
          group_id_user_id: {
            group_id: group.id,
            user_id: userId as any
          }
        },
        select: { admin_flg: true }
      });

      // 管理者が現在1名以下で、かつ対象ユーザーが管理者である場合、変更を許可しない
      // (adminCountが1で、その唯一の管理者をメンバーに降格させようとしている場合)
      if (adminCount <= 1 && targetMembership?.admin_flg) {
        return NextResponse.json({
          success: false,
          message: 'グループには最低1人の管理者が必要です。最後の管理者の権限は変更できません。'
        }, { status: 400 });
      }
    }

    // 対象メンバーの権限を更新
    await prisma.groups_User.update({
      where: {
        group_id_user_id: {
          group_id: group.id,
          user_id: userId as any
        }
      },
      data: {
        admin_flg: isAdmin
      }
    });

    return NextResponse.json({ success: true, message: '権限を更新しました' });

  } catch (error) {
    console.error('権限更新エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}