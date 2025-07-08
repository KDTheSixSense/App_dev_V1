import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import RankingContainer from "@/components/RankingContainer"; 
import type { User } from '@prisma/client';

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

export default async function RankingPage({ searchParams}: { searchParams: { subject?: string } }) {

  // --- 1. iron-sessionでログインユーザー情報を取得 ---
  // 1. cookies()をawaitで取得します
  const cookieStore = await cookies();
  
  // 2. getIronSessionに<SessionData>という型を明示的に渡します
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  // 3. セッション、またはセッション内のユーザー情報がなければ、ここで処理を中断します
  if (!session.user?.id) {
    return <div>ログインしていません。</div>;
  }

  // 4. DBからユーザー情報を取得します。型は PrismaのUser型またはnullになります
  const user: User | null = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
  });

  // 5. DBから取得したユーザーが見つからない場合も、ここで処理を中断します
  if (!user) {
    return <div>ユーザーが見つかりません。</div>;
  }   
  const userId = session.user?.id ? Number(session.user.id) : null;

  // --- 2. 総合ランキングのデータを取得 (これはログイン状態に関わらず表示) ---
  const topUsersOverall = await prisma.user.findMany({
    orderBy: { xp: 'desc' },
    take: 10,
  });
  const overallRanking = topUsersOverall.map((user, index) => ({
    id: user.id,
    rank: index + 1,
    name: user.username || '名無しさん',
    iconUrl: user.icon || '/images/test_icon.webp',
    score: user.level,
  }));

  // --- 3. 全ての科目のランキングデータを取得 (これもログイン状態に関わらず表示) ---
  const subjects = await prisma.subject.findMany();
  const subjectRankings: { [key: string]: any[] } = {};

  for (const subject of subjects) {
    const progress = await prisma.userSubjectProgress.findMany({
      where: { subject_id: subject.id },
      orderBy: { xp: 'desc' },
      take: 10,
      include: { user: true },
    });
    subjectRankings[subject.name] = progress.map((p, index) => ({
      id: p.user_id,
      rank: index + 1,
      name: p.user.username || '名無しさん',
      iconUrl: p.user.icon || '/images/test_icon.webp',
      score: p.level,
    }));
  }
  
  const allRankings = { '総合': overallRanking, ...subjectRankings };
  const tabs = [{ name: '総合' }, ...subjects.map(s => ({ name: s.name }))];

  // --- 4. 「自分の順位」を計算 (ログインしている場合のみ) ---
  let myRankInfo = null;
  if (userId) {
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (currentUser) {
      const higherRankCount = await prisma.user.count({
        where: { xp: { gt: currentUser.xp } },
      });
      myRankInfo = {
        id: currentUser.id,
        rank: higherRankCount + 1,
        name: currentUser.username || '名無しさん',
        iconUrl: currentUser.icon || '/images/test_icon.webp',
        score: currentUser.level,
      };
    }
  }
  return (
    <div className="bg-slate-50 min-h-150">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-800">ランキング</h1>
        
        {/* 全てのデータをクライアントコンポーネントに渡す */}
        <RankingContainer tabs={tabs} allRankings={allRankings} myRankInfo={myRankInfo}/>
      </div>
    </div>
  );
}