import { prisma } from "@/lib/prisma";
import RankingContainer from "@/components/RankingContainer";

type RankingComponentProps = {
  searchParams: { subject?: string };
};

export default async function RankingComponent({ searchParams }: RankingComponentProps) {

  // --- 1. 総合ランキングのデータを取得 ---
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

  // --- 2. 全ての科目のランキングデータを取得 ---
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
      id: p.user.id,
      rank: index + 1,
      name: p.user.username || '名無しさん',
      iconUrl: p.user.icon || '/images/test_icon.webp',
      score: p.level,
    }));
  }

  // --- 3. 全てのデータをまとめる ---
  const allRankings = {
    '総合': overallRanking,
    ...subjectRankings,
  };
  
  const tabs = [{ name: '総合' }, ...subjects.map(s => ({ name: s.name }))];

  return (
    <div className="bg-slate-50 min-h-150">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-800">ランキング</h1>
        
        {/* 全てのデータをクライアントコンポーネントに渡す */}
        <RankingContainer tabs={tabs} allRankings={allRankings} />
      </div>
    </div>
  );
}