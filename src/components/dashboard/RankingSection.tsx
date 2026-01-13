
import { prisma } from "@/lib/prisma";
import RankingContainer from "@/components/RankingContainer";
import { assignRanks } from "@/lib/ranking";
import { Prisma } from '@prisma/client';

export default async function RankingSection() {
    // 総合ランキングのデータを準備 (上位100件のみ取得)
    const allUsersOverall = await prisma.user.findMany({
        orderBy: { level: 'desc' },
        take: 100,
    });
    const overallRankingFull = assignRanks(allUsersOverall.map(user => ({
        id: user.id,
        name: user.username || '名無しさん',
        iconUrl: user.icon || '/images/test_icon.webp',
        score: user.level,
        level: user.level,
    })));

    // 科目別ランキングのデータを準備 (Raw Queryを使用)
    const subjects = await prisma.subject.findMany();

    const rawRankings: Array<{
        id: string;
        name: string;
        iconUrl: string | null;
        score: number;
        subjectId: number;
        rank: bigint;
        level: number;
    }> = await prisma.$queryRaw(Prisma.sql`
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
      rp.level
    FROM
      RankedProgress rp
    WHERE
      rp.rank <= 100
    ORDER BY
      rp.subject_id, rp.rank;
  `);

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
                rank: Number(r.rank),
                level: r.level,
            }));
    });

    // 表示用のデータを準備 (スクロールさせるために10件表示)
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
        <div className="bg-gradient-to-r from-[#e0f4f9] to-cyan-100 rounded-3xl p-6 shadow-sm h-[calc(100vh-95px)] top-24 flex flex-col">
            <h1 className="text-xl font-bold text-slate-700 mb-4 text-center">ランキング</h1>
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <RankingContainer
                    tabs={tabs}
                    allRankings={allRankingsForDisplay}
                    allRankingsFull={allRankingsFull}
                />
            </div>
        </div>
    );
}
