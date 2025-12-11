

import { prisma } from "@/lib/prisma";
import RankingContainer from "@/components/RankingContainer";
import { assignRanks } from "@/lib/ranking";
import { Prisma } from '@prisma/client'; // Prisma.sql を使うためにインポート

export const revalidate = 300; // 5分間キャッシュ

export default async function RankingPage() {
  // 総合ランキングのデータを準備 (上位100件のみ取得)
  const getUsers = prisma.user.findMany({
    orderBy: { level: 'desc' },
    take: 100,
  });

  // 科目別ランキングのデータを準備 (Raw Queryを使用)
  const getSubjects = prisma.subject.findMany(); // 科目リストは引き続き必要

  const rawRankingsPromise = prisma.$queryRaw<Array<{
    id: string;
    name: string;
    iconUrl: string | null;
    score: number;
    subjectId: number;
    // Safe: No user input is interpolated here. Prisma.sql handles templating if needed.
    rank: bigint; // rankをbigint型に変更
    level: number;
  }>>(Prisma.sql`
    WITH RankedProgress AS (
      SELECT
        usp.user_id,
        usp.subject_id,
        usp.level AS score,
        usp.level AS level,
        u.username AS name,
        u.icon AS "iconUrl",
        DENSE_RANK() OVER (PARTITION BY usp.subject_id ORDER BY usp.level DESC) as rank
      FROM
        "UserSubjectProgress" usp
      JOIN
        "User" u ON usp.user_id = u.id
    )
    SELECT
      rp.user_id AS id,
      rp.name,
      rp."iconUrl",
      rp.score,
      rp.subject_id AS "subjectId",
      rp.rank,
      rp.level -- levelも選択
    FROM
      RankedProgress rp
    WHERE
      rp.rank <= 100
    ORDER BY
      rp.subject_id, rp.rank;
  `);

  const [allUsersOverall, subjects, rawRankings] = await Promise.all([getUsers, getSubjects, rawRankingsPromise]);
  
  const overallRankingFull = assignRanks(allUsersOverall.map(user => ({
    id: String(user.id),
    name: user.username || '名無しさん',
    iconUrl: user.icon || '/images/test_icon.webp',
    score: user.level,
    level: user.level, // levelプロパティを追加
  })));

  // Raw Queryの結果をsubjectRankingsFullの形式に整形
  const subjectRankingsFull: { [key: string]: any[] } = {};
  subjects.forEach(subject => {
    subjectRankingsFull[subject.name] = rawRankings
      .filter(r => r.subjectId === subject.id)
      .map(r => ({
        id: r.id,
        name: r.name || '名無しさん',
        iconUrl: r.iconUrl || '/images/test_icon.webp',
        score: r.score,
        rank: Number(r.rank), // bigintをnumberに変換
        level: r.level,
      }));
  });

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
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md py-3 px-5">
        <h1 className="text-2xl font-bold text-slate-800">ランキング</h1>
        <RankingContainer
          tabs={tabs}
          allRankings={allRankingsForDisplay}
          allRankingsFull={allRankingsFull}
        />
      </div>
    </div>
  );
}