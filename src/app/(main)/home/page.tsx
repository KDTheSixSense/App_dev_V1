// /src/app/(main)/home/page.tsx

import React, { Suspense } from "react";
// 各セクションのコンポーネントをインポート
import User from "./user/UserDetail"; // ユーザープロフィール表示
import RankingSection from "@/components/dashboard/RankingSection"; // ランキング（サーバーコンポーネント）
import DailyMissionSection from "@/components/dashboard/DailyMissionSection"; // ミッション（サーバーコンポーネント）
import Pet from "./components/PetStatus"; // ペット状態表示
import EventCard from "./components/EventCard"; // イベント情報
import Evolution from "@/components/evolution"; // 進化エフェクト（クライアントコンポーネント想定）

// --- ▼▼▼ セッション・データ取得用のライブラリ ▼▼▼ ---
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from "@/lib/prisma";
import { getUnsubmittedAssignmentCount, getNextDueAssignment, getUpcomingEvents } from '@/lib/data';

// セッションデータの型定義
interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * ホームページ (ダッシュボード) (Server Component)
 * 
 * ログイン直後に表示されるメイン画面です。
 * ユーザー情報の取得、科目の進捗状況、未提出課題、近日開催イベントなどをサーバーサイドで並列取得し、
 * 各ウィジェットコンポーネントに渡して表示します。
 */
export default async function HomePage({
  searchParams,
}: {
  // Next.js 15以降の型定義に対応 (searchParamsはPromise)
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {

  // 1. セッションからユーザーIDを取得
  // サーバーサイドでクッキーを読み取り、ログイン中のユーザーIDを特定します
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? session.user.id : null;

  // 2. 独立したデータを並列取得 (Promise.all)
  // 課題数、次の課題、イベント情報は互いに依存しないため、並列でリクエストして
  // 全体の待ち時間を短縮（ウォーターフォール解消）しています。
  const [assignmentCount, nextAssignment, upcomingEvents] = await Promise.all([
    getUnsubmittedAssignmentCount(),
    getNextDueAssignment(),
    getUpcomingEvents(),
  ]);

  // 3. ログインユーザーの詳細情報をDBから取得
  // Petコンポーネントや進化判定、プロフィール表示に必要なデータを一括取得
  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      level: true,
      xp: true,
      icon: true,
      class: true,
      year: true,
      birth: true,
      lastlogin: true,
      continuouslogin: true,
      totallogin: true,
      selectedTitle: true,
      status_Kohaku: true, // ペットの満腹度などの状態
      
      // 進化条件の判定用に、各科目の進捗レベルも一緒に取得
      progresses: {
        select: {
          level: true,
          subject: {
            select: {
              name: true
            }
          }
        }
      },
      isAdmin: true, // 管理者バッジ用
    }
  }) as any : null; // ※型推論を簡略化するために any キャストされていますが、本来は型定義推奨

  // 4. データ整形
  // DBの深い構造 (progresses[i].subject.name) を扱いやすいフラットな配列に変換
  const subjectProgress = user?.progresses?.map((us: any) => ({
    subjectName: us.subject.name,
    level: us.level
  })) || [];

  // ローディング中のプレースホルダー (Suspenseのフォールバック)
  const LoadingSkeleton = () => (
    <div className="bg-[#e0f4f9] rounded-3xl p-6 shadow-sm min-h-[400px] h-full animate-pulse flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className='bg-white select-none min-h-screen'>
      {/* 進化エフェクト:
        条件を満たした瞬間に画面全体にオーバーレイ表示される想定。
        userが存在する場合のみレンダリング。
      */}
      {user && (
        <Evolution
          userLevel={user.level}
          subjectProgress={subjectProgress}
        />
      )}

      {/* メインレイアウト: 最大幅制限とパディング */}
      <main className="max-w-[1920px] mx-auto p-6 md:p-8 lg:p-10">
        
        {/* 3カラムグリッドレイアウト (Left / Center / Right)
          - モバイル(grid-cols-1): 縦一列
          - デスクトップ(lg:grid-cols-12): 3 : 6 : 3 の比率
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Left Column: ランキング (幅3) */}
          {/* order-2: モバイルでは2番目(真ん中)に来るが、デスクトップでは左端 */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1 h-full">
            {/* Suspense: ランキングデータの取得を待たずに他の部分を先に表示 */}
            <Suspense fallback={<LoadingSkeleton />}>
              <RankingSection />
            </Suspense>
          </div>

          {/* Center Column: ペット & イベント (幅6) */}
          {/* order-1: モバイルでは一番上に来る (最重要コンテンツ) */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col h-full gap-6">
            {/* 1. Pet Status (メインビジュアル) */}
            <div className="shrink-0">
              <Pet 
                user={user} 
                assignmentCount={assignmentCount} 
                nextAssignment={nextAssignment} 
                subjectProgress={subjectProgress} 
              />
            </div>
            {/* 2. Events (下部リスト) */}
            <div className="flex-1 min-h-0">
              <EventCard events={upcomingEvents} />
            </div>
          </div>

          {/* Right Column: プロフィール & デイリーミッション (幅3) */}
          {/* order-3: 一番右 */}
          <div className="lg:col-span-3 space-y-6 order-3 lg:order-3 h-full flex flex-col">
            {/* 1. User Profile */}
            <User user={user} unsubmittedAssignmentCount={assignmentCount} />

            {/* 2. Daily Missions */}
            {/* Suspense: ミッション読み込み中もプロフィールは即座に表示される */}
            <div className="flex-1">
              <Suspense fallback={<LoadingSkeleton />}>
                <DailyMissionSection />
              </Suspense>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}