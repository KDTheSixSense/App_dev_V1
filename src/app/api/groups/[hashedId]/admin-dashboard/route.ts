import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: number; email: string };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hashedId: string }> }
) {
  const { hashedId } = await params;
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    // 1. グループIDの取得
    const group = await prisma.groups.findUnique({
      where: { hashedId },
      select: { id: true, groupname: true, body: true, invite_code: true }
    });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    // --- Security Check: Global Admin OR Group Admin ---
    // セッションのisAdminは古いため、DBで直接確認する
    const currentUser = await prisma.user.findUnique({
      where: { id: String(session.user.id) },
      select: { isAdmin: true }
    });

    if (!currentUser?.isAdmin) {
      // グローバル管理者でない場合、グループ管理者か確認
      const groupUser = await prisma.groups_User.findUnique({
        where: {
          group_id_user_id: {
            group_id: group.id,
            user_id: String(session.user.id)
          }
        }
      });

      if (!groupUser?.admin_flg) {
        return NextResponse.json({ success: false, message: 'このページにアクセスする権限がありません' }, { status: 403 });
      }
    }
    // ----------------------------------------------------

    // 2. 関連データを並列で一気に取得 (Promise.all)
    // これにより、それぞれのクエリが同時に走るため、最も遅いクエリの時間だけで済みます
    const [members, posts, assignments] = await Promise.all([
      // メンバー取得
      prisma.groups_User.findMany({
        where: { group_id: group.id },
        include: {
          user: {
            select: { id: true, username: true, email: true, icon: true, level: true, xp: true }
          }
        }
      }),
      // 最新の投稿取得 (20件)
      prisma.post.findMany({
        where: { groupId: group.id },
        include: { author: { select: { username: true, icon: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      // 最新の課題取得 (20件)
      prisma.assignment.findMany({
        where: { groupid: group.id },
        orderBy: { created_at: 'desc' },
        include: {
          author: { select: { username: true, icon: true } },
          programmingProblem: { select: { id: true, title: true, difficulty: true } },
          selectProblem: { select: { id: true, title: true, difficultyId: true } },
          _count: { select: { Submissions: true } }
        },
        take: 20
      })
    ]);

    // 3. データの整形 (フロントエンドの型に合わせる)

    // メンバー整形
    const formattedMembers = members.map(gu => ({
      id: gu.user.id,
      name: gu.user.username || '名無し',
      email: gu.user.email,
      icon: gu.user.icon,
      isAdmin: gu.admin_flg,
      onlineStatus: 'offline',
      level: gu.user.level,
      xp: gu.user.xp,
    }));

    const adminCount = formattedMembers.filter(m => m.isAdmin).length;
    const memberStats = {
      totalMembers: formattedMembers.length,
      onlineMembers: 0,
      adminCount: adminCount,
      studentCount: formattedMembers.length - adminCount,
    };

    // 投稿整形
    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      author: {
        username: post.author.username || '不明なユーザー',
        icon: post.author.icon
      },
      date: post.createdAt, // 文字列変換はフロントで行う方が高速
      createdAt: post.createdAt
    }));

    // 課題整形
    const formattedAssignments = assignments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      due_date: a.due_date,
      created_at: a.created_at,
      programmingProblemId: a.programmingProblemId,
      selectProblemId: a.selectProblemId,
      programmingProblem: a.programmingProblem,
      selectProblem: a.selectProblem,
      author: a.author,
      // Submissionsカウントがある場合はダミー配列を入れる（フロントのロジック維持）
      Submissions: a._count.Submissions > 0 ? [{ id: 1 }] : []
    }));

    // 4. まとめてレスポンス
    return NextResponse.json({
      success: true,
      data: {
        group: {
          id: group.id,
          hashedId,
          name: group.groupname,
          description: group.body,
          invite_code: group.invite_code,
          teacher: '管理者', // 仮置き
          memberCount: formattedMembers.length
        },
        members: formattedMembers,
        memberStats,
        posts: formattedPosts,
        assignments: formattedAssignments
      }
    });

  } catch (error) {
    console.error('Admin Dashboard API Error:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}