import { prisma } from "@/lib/prisma";
import RankingContainer from "@/components/RankingContainer";
import { assignRanks } from "@/lib/ranking"; 

// --- ▼▼▼ Propsの型定義を修正 ▼▼▼ ---
// searchParamsに加えて、userIdも受け取るように定義します
interface RankingPageProps {
  searchParams: { subject?: string };
  userId: number | null; 
}

// --- ▼▼▼ 関数の引数を修正 ▼▼▼ ---
export default async function RankingPage({ searchParams, userId }: RankingPageProps) {

  // 総合ランキングのデータを準備
  const allUsersOverall = await prisma.user.findMany({ orderBy: { xp: 'desc' } });
  const overallRankingFull = assignRanks(allUsersOverall.map(user => ({
    id: user.id,
    name: user.username || '名無しさん',
    iconUrl: user.icon || '/images/test_icon.webp',
    score: user.level,
  })));

  // 科目別ランキングのデータを準備
  const subjects = await prisma.subject.findMany();
  const subjectRankingsFull: { [key: string]: any[] } = {};

  for (const subject of subjects) {
    const allProgress = await prisma.userSubjectProgress.findMany({
      where: { subject_id: subject.id },
      orderBy: { xp: 'desc' },
      include: { user: true },
    });
    subjectRankingsFull[subject.name] = assignRanks(allProgress.map(p => ({
      id: p.user.id,
      name: p.user.username || '名無しさん',
      iconUrl: p.user.icon || '/images/test_icon.webp',
      score: p.level,
    })));
  }

  // 表示用のデータを準備
  const allRankingsForDisplay = {
    '総合': overallRankingFull.slice(0, 10),
    ...Object.fromEntries(
      Object.entries(subjectRankingsFull).map(([key, value]) => [key, value.slice(0, 10)])
    ),
  };
  
  // 自分の順位を取得
  const selectedSubject = searchParams.subject || '総合';
  let myRankInfo = null;

  // 親から渡されたuserIdを使って自分の順位を探します
  if (userId) {
    const fullListForSelectedSubject = selectedSubject === '総合' 
      ? overallRankingFull 
      : subjectRankingsFull[selectedSubject];
      
    if (fullListForSelectedSubject) {
      myRankInfo = fullListForSelectedSubject.find(user => user.id === userId) || null;
    }
  }
  
  const tabs = [{ name: '総合' }, ...subjects.map(s => ({ name: s.name }))];

  return (
    <div className="bg-slate-50">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-800">ランキング</h1>
        
        <RankingContainer 
          tabs={tabs} 
          allRankings={allRankingsForDisplay}
          myRankInfo={myRankInfo}
        />
      </div>
    </div>
  );
}
