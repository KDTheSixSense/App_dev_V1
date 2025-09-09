'use server';

import { prisma } from "@/lib/prisma";
import RankingContainer from "@/components/RankingContainer";
import { assignRanks } from "@/lib/ranking";
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

export default async function RankingPage() {
  const session = await getIronSession<SessionData>(cookies() as any, sessionOptions);
  const userId = session.user?.id ? Number(session.user.id) : null;
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

  // 全ランキングデータを渡す
  const allRankingsFull = {
    '総合': overallRankingFull,
    ...subjectRankingsFull,
  };

  const tabs = [{ name: '総合' }, ...subjects.map(s => ({ name: s.name }))];

  return (
    <div className="bg-slate-50">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-800">ランキング</h1>
        <RankingContainer
          tabs={tabs}
          allRankings={allRankingsForDisplay}
          allRankingsFull={allRankingsFull}
          userId={userId}
        />
      </div>
    </div>
  );
}