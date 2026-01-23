// /workspaces/my-next-app/src/components/dashboard/RankingSection.tsx

import { prisma } from "@/lib/prisma";
import RankingContainer from "@/components/RankingContainer";
import { assignRanks } from "@/lib/ranking";
import { Prisma } from '@prisma/client';

export default async function RankingSection() {
    // --------------------------------------------------------------------------------
    // 1. 総合ランキングの取得
    // --------------------------------------------------------------------------------
    // ユーザー全体からレベルが高い順に上位100名を取得します
    const allUsersOverall = await prisma.user.findMany({
        orderBy: { level: 'desc' },
        take: 100,
    });
    
    // 順位付けヘルパー関数を通して、同率順位などを計算したデータを生成
    const overallRankingFull = assignRanks(allUsersOverall.map(user => ({
        id: user.id,
        name: user.username || '名無しさん',
        iconUrl: user.icon || '/images/test_icon.webp',
        score: user.level,
        level: user.level,
    })));

    // --------------------------------------------------------------------------------
    // 2. 科目別ランキングの取得 (Raw SQL)
    // --------------------------------------------------------------------------------
    // まず科目一覧を取得
    const subjects = await prisma.subject.findMany();

    // Prisma標準機能では「科目ごとにグループ化して上位N件」を取得するのが難しいため、
    // 生のSQLクエリ ($queryRaw) を使用して高速に取得しています。
    const rawRankings: Array<{
        id: string;
        name: string;
        iconUrl: string | null;
        score: number;
        subjectId: number;
        rank: bigint; // SQLの計算結果は BigInt 型で返ってきます
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
        -- DENSE_RANK: 同点の場合は同じ順位とし、順位を飛ばさない (例: 1, 1, 2...)
        -- PARTITION BY subject_id: 科目ごとに区切ってランキングを計算
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
      rp.rank <= 100 -- 各科目、上位100位までを取得
    ORDER BY
      rp.subject_id, rp.rank;
  `);

    // Raw Queryの結果を、科目名をキーとしたオブジェクト形式に整形
    const subjectRankingsFull: { [key: string]: any[] } = {};
    subjects.forEach(subject => {
        subjectRankingsFull[subject.name] = rawRankings
            .filter(r => r.subjectId === subject.id)
            .map(r => ({
                id: r.id,
                name: r.name || '名無しさん',
                iconUrl: r.iconUrl || '/images/test_icon.webp',
                score: r.score,
                rank: Number(r.rank), // 重要: クライアントに渡すために BigInt を Number に変換
                level: r.level,
            }));
    });

    // --------------------------------------------------------------------------------
    // 3. 表示データの準備
    // --------------------------------------------------------------------------------
    
    // UI表示用データ (リスト描画用)
    // ここでは初期表示用にトップ10件のみを切り出しています
    const allRankingsForDisplay = {
        '総合': overallRankingFull.slice(0, 10),
        ...Object.fromEntries(
            Object.entries(subjectRankingsFull).map(([key, value]) => [key, value.slice(0, 10)])
        ),
    };

    // 自分の順位検索用データ (全件データ)
    // RankingContainer内で「自分の順位」を探すために使われます
    const allRankingsFull = {
        '総合': overallRankingFull,
        ...subjectRankingsFull,
    };

    // タブの定義 (総合 + 科目名リスト)
    const tabs = [{ name: '総合' }, ...subjects.map(s => ({ name: s.name }))];

    return (
        // ダッシュボード内でのレイアウト設定
        // h-[calc(100vh-95px)]: 画面の高さからヘッダー分(約95px)を引いて、画面内に収まるように調整
        <div className="bg-gradient-to-r from-[#e0f4f9] to-cyan-100 rounded-3xl p-6 shadow-sm h-[calc(100vh-95px)] top-24 flex flex-col">
            <h1 className="text-xl font-bold text-slate-700 mb-4 text-center">ランキング</h1>
            
            {/* flex-1 overflow-hidden min-h-0: 
                これらを組み合わせることで、内側のRankingContainerだけがスクロールし、
                外側のコンテナは固定サイズを保つように制御しています
            */}
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