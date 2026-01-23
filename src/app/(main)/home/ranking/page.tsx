// /src/app/(main)/home/ranking/page.tsx

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { assignRanks } from "@/lib/ranking";
import RankingContainer from "@/components/RankingContainer";

// ISR (Incremental Static Regeneration) の設定
// このページはビルド時に生成され、その後は300秒（5分）ごとにキャッシュが更新されます。
// ランキングのように「リアルタイム性はそこまで重要ではないが、定期的に更新したい」データに最適です。
export const revalidate = 300; 

export default async function RankingPage() {
  // --------------------------------------------------------------------------------
  // 1. 総合ランキングの取得 (Prisma ORM標準機能)
  // --------------------------------------------------------------------------------
  // 単純な並び替えなら findMany の方が型安全で読みやすいため、こちらを採用しています
  const allUsersOverall = await prisma.user.findMany({
    orderBy: { level: 'desc' }, // レベルが高い順
    take: 100,                  // 上位100件に絞る
  });

  // 取得したデータに順位(rank)を付与するヘルパー関数を通す
  const overallRankingFull = assignRanks(allUsersOverall.map(user => ({
    id: user.id,
    name: user.username || '名無しさん',
    iconUrl: user.icon || '/images/test_icon.webp',
    score: user.level,
    level: user.level,
  })));

  // --------------------------------------------------------------------------------
  // 2. 科目別ランキングの取得 (Raw Query / 生SQL)
  // --------------------------------------------------------------------------------
  // 科目ごとに「グループ化してランク付け」を行うのはPrismaの標準機能では難しいため、
  // パフォーマンスの良いSQLのウィンドウ関数 (DENSE_RANK) を使用しています。

  const subjects = await prisma.subject.findMany(); // 科目名のリストを取得

  // $queryRaw を使用して、複雑な集計を一発で行う
  // 返り値の型定義をジェネリクスで指定
  const rawRankings: Array<{
    id: string;
    name: string;
    iconUrl: string | null;
    score: number;
    subjectId: number;
    rank: bigint; // SQLの集計結果は BigInt で返ってくるため注意
    level: number;
  }> = await prisma.$queryRaw(Prisma.sql`
    -- CTE (共通テーブル式) を定義して、ランク計算を前処理
    WITH RankedProgress AS (
      SELECT
        usp.user_id,
        usp.subject_id,
        usp.level AS score,
        usp.level AS level,
        u.username AS name,
        u.icon AS "iconUrl",
        -- DENSE_RANK: 同点の場合は同じ順位にし、次の順位を飛ばさない (1位, 1位, 2位...)
        -- PARTITION BY: 科目IDごとに区切って計算
        RANK() OVER (PARTITION BY usp.subject_id ORDER BY usp.level DESC) as rank
      FROM
        "UserSubjectProgress" usp
      JOIN
        "User" u ON usp.user_id = u.id
    )
    -- 計算結果から上位100件のみを抽出
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

  // --------------------------------------------------------------------------------
  // 3. データの整形
  // --------------------------------------------------------------------------------
  
  // SQLの結果はフラットな配列なので、科目名ごとのオブジェクトに変換します
  const subjectRankingsFull: { [key: string]: any[] } = {};
  
  subjects.forEach(subject => {
    subjectRankingsFull[subject.name] = rawRankings
      .filter(r => r.subjectId === subject.id)
      .map(r => ({
        id: r.id,
        name: r.name || '名無しさん',
        iconUrl: r.iconUrl || '/images/test_icon.webp',
        score: r.score,
        // 【重要】BigIntはそのままではクライアントに送信できない(JSON化できない)ため、Numberに変換
        rank: Number(r.rank), 
        level: r.level,
      }));
  });

  // --------------------------------------------------------------------------------
  // 4. 表示用データの準備
  // --------------------------------------------------------------------------------

  // 初回表示用 (スクロール表示などのために、ここではトップ10件のみ渡す想定)
  const allRankingsForDisplay = {
    '総合': overallRankingFull.slice(0, 10),
    ...Object.fromEntries(
      Object.entries(subjectRankingsFull).map(([key, value]) => [key, value.slice(0, 10)])
    ),
  };

  // 全データ (モーダルや「もっと見る」を押したときに使う用)
  const allRankingsFull = {
    '総合': overallRankingFull,
    ...subjectRankingsFull,
  };

  // タブ生成用の配列
  const tabs = [{ name: '総合' }, ...subjects.map(s => ({ name: s.name }))];

  return (
    // h-[calc(100vh-140px)]: ヘッダーや余白を除いた高さを確保し、スクロール可能領域を作る
    // sticky top-24: スクロール時に位置を固定
    <div className="bg-gradient-to-r from-[#e0f4f9] to-cyan-100 rounded-3xl p-6 shadow-sm h-[calc(100vh-140px)] sticky top-24 flex flex-col">
      <h1 className="text-2xl font-bold text-[#3a6b8b] mb-4 text-center">ランキング</h1>
      <RankingContainer
        tabs={tabs}
        allRankings={allRankingsForDisplay}
        allRankingsFull={allRankingsFull}
      />
    </div>
  );
}