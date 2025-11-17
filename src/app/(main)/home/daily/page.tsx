import React from 'react';
import { redirect } from 'next/navigation'; // リダイレクト機能を追加
import { prisma } from '@/lib/prisma';      // Prisma Client をインポート
import { getIronSession } from 'iron-session'; // セッション関数をインポート (または getSession)
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session'; // セッション設定をインポート
import { ensureDailyMissionProgress } from '@/lib/actions'; // ミッション作成関数をインポート
import { getMissionDate } from '@/lib/utils'; // 日付取得ヘルパーをインポート
import MissionList, { Mission } from './missionList';

/**
 * デイリーミッションページ (サーバーコンポーネント)
 */
// async 関数に変更
const DailyMissionPage = async () => {

  // 1. セッションとユーザーIDを取得
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? Number(session.user.id) : null;

  // 2. 未ログインの場合はログインページへリダイレクト
  if (!userId) {
    redirect('/auth/login'); // '/login' は実際のログインページのパスに合わせてください
  }

  // 3. 今日のミッション日付を取得
  const missionDate = getMissionDate();

  try {
    // 4. 今日のミッション進捗が存在するか確認し、なければ作成する
    await ensureDailyMissionProgress(userId);

    // 5. データベースから今日のミッション進捗を取得
    const progressEntries = await prisma.userDailyMissionProgress.findMany({
      where: {
        userId: userId,
        date: missionDate,
      },
      // 関連するミッションマスターの情報も一緒に取得 (include)
      include: {
        mission: true, // DailyMissionMaster のデータを含める
      },
      orderBy: {
        missionId: 'asc', // ミッションID順で表示
      },
    });

    // 6. 取得したデータをフロントエンド (MissionList) が期待する Mission[] 型に変換
    const missionsForClient: Mission[] = progressEntries.map(entry => ({
      id: entry.missionId,
      title: entry.mission.title,       // マスターデータから取得
      description: entry.mission.description, // マスターデータから取得
      progress: entry.progress,         // 進捗テーブルから取得
      targetCount: entry.mission.targetCount, // マスターデータから取得
      xpReward: entry.mission.xpReward,   // マスターデータから取得
      isCompleted: entry.isCompleted,     // 進捗テーブルから取得
    }));

    // 7. 画面を描画
    return (
      <div className="bg-[#f0f9ff] py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            デイリーミッション
          </h1>
          
          {/* DBから取得・変換したデータを MissionList に渡す */}
          <MissionList missions={missionsForClient} />

        </div>
      </div>
    );

  } catch (error) {
    console.error("デイリーミッションの取得中にエラーが発生しました:", error);
    // エラー発生時の表示 (必要に応じて調整)
    return (
      <div className="min-h-screen bg-gray-100 py-10 flex items-center justify-center">
        <p className="text-red-500">ミッションデータの読み込みに失敗しました。</p>
      </div>
    );
  }
};

export default DailyMissionPage;