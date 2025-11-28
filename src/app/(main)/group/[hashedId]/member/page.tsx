import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import MemberGroupClientPage from './MemberGroupClientPage';

interface Post {
    id: number;
    content: string;
    authorName: string;
    authorAvatar: string;
    authorIcon: string | null;
    createdAt: string;
}

interface Kadai {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    createdAt: string;
    completed?: boolean;
    programmingProblemId?: number;
    selectProblemId?: number;
    author?: {
        username: string | null;
        icon: string | null;
    } | null;
}

interface GroupDetail {
    id: number;
    hashedId: string;
    name: string;
    description: string;
    memberCount: number;
    teacher: string;
}

interface Member {
  admin_flg: boolean;
  user: {
      id: number;
      username: string | null;
      icon: string | null;
  };
}

interface PageProps {
  params: Promise<{ hashedId: string }>;
}

const POSTS_LIMIT = 20;
const ASSIGNMENTS_LIMIT = 20;

export default async function MemberGroupPage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise;
  const { hashedId } = params;
  const session = await getSession();
  const user = session.user;

  if (!user) {
    redirect('/auth/login');
  }

  const userIdAsNumber = parseInt(String(user.id), 10);

  if (isNaN(userIdAsNumber)) {
      console.error("Invalid user ID in session:", user.id);
      redirect('/auth/login');
  }

  // グループ情報、お知らせ、課題を並列で取得
  const [groupData, postsData, assignmentsData] = await Promise.all([
    prisma.groups.findUnique({
      where: { hashedId: hashedId },
      include: {
        groups_User: {
          select: {
            admin_flg: true,
            user: { select: { id: true, username: true, icon: true } },
          },
        },
        _count: { select: { groups_User: true } },
      },
    }),
    prisma.post.findMany({
      where: { group: { hashedId: hashedId } },
      include: { author: { select: { username: true, icon: true } } },
      orderBy: { createdAt: 'desc' },
      take: POSTS_LIMIT,
    }),
    prisma.assignment.findMany({
      where: {
        group: { hashedId: hashedId },
        Submissions: {
          some: { userid: userIdAsNumber }
        }
      },
      include: {
        Submissions: {
          where: { userid: userIdAsNumber },
          select: { status: true },
          take: 1,
        },
        author: { select: { username: true, icon: true } },
      },
      orderBy: { due_date: 'asc' },
      take: ASSIGNMENTS_LIMIT,
    }),
  ]);

  if (!groupData) {
    redirect('/group?error=not_found');
  }

  // グループ詳細の整形
  const members: Member[] = groupData.groups_User || [];
  const teacher = members.find(member => member.admin_flg)?.user?.username || '管理者';
  const initialGroup: GroupDetail = {
    id: groupData.id,
    hashedId: groupData.hashedId,
    name: groupData.groupname,
    description: groupData.body,
    memberCount: groupData._count?.groups_User || 0,
    teacher: teacher,
  };

  // お知らせの整形
  const initialPosts: Post[] = postsData.map(post => ({
    id: post.id,
    content: post.content,
    authorName: post.author?.username || '不明なユーザー',
    authorAvatar: post.author?.username?.charAt(0) || '?',
    authorIcon: post.author?.icon || null,
    createdAt: post.createdAt.toISOString(),
  }));

  // 課題リストの整形
  const initialKadaiList: Kadai[] = assignmentsData.map(kadai => ({
    id: kadai.id,
    title: kadai.title,
    description: kadai.description || '',
    dueDate: kadai.due_date.toISOString(),
    createdAt: kadai.created_at.toISOString(),
    completed: kadai.Submissions?.some(
      (sub: any) => sub.status === '提出済み'
    ),
    programmingProblemId: kadai.programmingProblemId ?? undefined,
    selectProblemId: kadai.selectProblemId ?? undefined,
    author: kadai.author,
  }));

  // お知らせと課題の総数を取得してページネーションを判断
  const totalPostsCount = await prisma.post.count({
    where: { group: { hashedId: hashedId } },
  });
  const totalAssignmentsCount = await prisma.assignment.count({
    where: { group: { hashedId: hashedId } },
  });

  const initialHasMorePosts = totalPostsCount > POSTS_LIMIT;
  const initialHasMoreKadai = totalAssignmentsCount > ASSIGNMENTS_LIMIT;

  return (
    <MemberGroupClientPage
      initialGroup={initialGroup}
      initialPosts={initialPosts}
      initialKadaiList={initialKadaiList}
      initialHasMorePosts={initialHasMorePosts}
      initialHasMoreKadai={initialHasMoreKadai}
    />
  );
}
