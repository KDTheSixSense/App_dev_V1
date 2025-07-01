import RankingList from "./RankingList";
import RankingTabs from "./RankingTab"; // 作成したTabsコンポーネントをインポート
import { prisma } from "@/lib/prisma";

// サーバーコンポーネントは、propsとしてsearchParamsを受け取ることができる
export default async function RankingPage({
  searchParams,
}: {
  searchParams: { subject?: string };
}) {

  // URLのクエリパラメータから選択された科目名を取得。なければ'総合'
  const selectedSubject = searchParams.subject || '総合';

  let rankedUsers: any[] = []; // ランキングデータを格納する配列

  const tabs = await prisma.subject.findMany({
    select: { name: true },
  });
  const allTabs = [{ name: '総合' }, ...tabs];

  // --- データベースクエリの分岐 ---
  if (selectedSubject === '総合') {
    // "総合"タブの場合：Userテーブルを総XPでソート
    const topUsers = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 10,
    });
    rankedUsers = topUsers.map((user, index) => ({
      id: user.id,
      rank: index + 1,
      name: user.username || '名無しさん',
      avatarUrl: '/images/test_icon.webp',
      score: user.level,
    }));

  } else {
    // 科目タブの場合：UserSubjectProgressテーブルをソート
    const subjectProgress = await prisma.userSubjectProgress.findMany({
      where: {
        subject: {
          name: selectedSubject, // 科目名で絞り込み
        },
      },
      orderBy: {
        xp: 'desc', // 科目XPでソート
      },
      take: 10,
      include: {
        user: true, // ユーザー情報も一緒に取得
        subject: true, // 科目情報も一緒に取得
      },
    });
    rankedUsers = subjectProgress.map((progress, index) => ({
      id: progress.user.id,
      rank: index + 1,
      name: progress.user.username || '名無しさん',
      avatarUrl: '/images/test_icon.webp',
      score: progress.level, // スコアとして科目レベルを表示
    }));
  }

  return (
    <div >
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-800">ランキング</h1>
        
        {/* インタラクティブなタブ部分をコンポーネントとして呼び出す */}
        <RankingTabs tabs={allTabs} />

        {/* 取得したランキングデータをリストに渡す */}
        <RankingList users={rankedUsers} />
      </div>
    </div>
  );
}