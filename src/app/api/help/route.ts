 import { NextResponse } from "next/server";
// @/app/data/helpData のパスは、プロジェクトのエイリアス設定に合わせて調整してください
import { helpSteps } from "@/app/data/helpData";
import { HelpApiResponse } from "@/types/help";
import { getSession } from "@/lib/session";

/**
 * ヘルプコンテンツのリストを返すAPI
 * GET /api/help?page=pageName
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const eventId = searchParams.get('eventId');

    // セッションからユーザーロールを取得
    const session = await getSession();
    const user = session.user;
    const userId = user?.id;

    let filteredSteps = helpSteps;

    // ページがgroupの場合、ロールに基づいてフィルタリング
    if (page === 'group') {
      // 一般的なグループページ: roleなしのステップのみ
      filteredSteps = helpSteps.filter(step => step.page === 'group' && !step.role);
    } else if (page === 'group/admin') {
      // 管理者ページ: adminロールのステップ
      filteredSteps = helpSteps.filter(step => step.page === 'group' && step.role === 'admin');
    } else if (page === 'group/member') {
      // メンバーページ: memberロールのステップ
      filteredSteps = helpSteps.filter(step => step.page === 'group' && step.role === 'member');
    } else if (page === 'event') {
      // イベントページ: 共通ステップのみ
      filteredSteps = helpSteps.filter(step => step.page === 'event' && !step.role);
    } else if (page === 'create_event') {
      // イベント作成ページ: 専用ステップのみ
      filteredSteps = helpSteps.filter(step => step.page === 'create_event');
    } else if (page === 'event_detail') {
      // イベント詳細ページ: ユーザーのロールに基づいてフィルタリング
      if (eventId && userId) {
        // イベント作成者かどうかをチェック (仮定: イベントモデルにcreatorIdがある)
        // ここでは簡易的に、ユーザーが作成者かどうかを判定するロジックを追加
        // 実際にはデータベースからイベントを取得してチェック
        const isCreator = await checkIfUserIsEventCreator(userId.toString(), eventId);
        if (isCreator) {
          filteredSteps = helpSteps.filter(step => step.page === 'event' && step.role === 'creator');
        } else {
          filteredSteps = helpSteps.filter(step => step.page === 'event' && step.role === 'participant');
        }
      } else {
        // デフォルト: 参加者向け
        filteredSteps = helpSteps.filter(step => step.page === 'event' && step.role === 'participant');
      }
    } else if (page === 'event_detail_problem') {
      // イベント詳細問題ページ: ユーザーのロールに基づいてフィルタリング
      if (eventId && userId) {
        const isCreator = await checkIfUserIsEventCreator(userId.toString(), eventId);
        if (isCreator) {
          filteredSteps = helpSteps.filter(step => step.page === 'event_detail_problem' && step.role === 'creator');
        } else {
          filteredSteps = helpSteps.filter(step => step.page === 'event_detail_problem' && step.role === 'participant');
        }
      } else {
        // デフォルト: 参加者向け
        filteredSteps = helpSteps.filter(step => step.page === 'event_detail_problem' && step.role === 'participant');
      }
    } else if (page === 'group_assignments_create_programming') {
      // グループ課題プログラミング問題作成ページ
      filteredSteps = helpSteps.filter(step => step.page === 'group_assignments_create_programming');
    } else if (page?.startsWith('group/coding-page')) {
      // グループコーディングページ
      filteredSteps = helpSteps.filter(step => step.page === 'group/coding-page');
    } else if (page) {
      filteredSteps = helpSteps.filter(step => step.page === page);
    }

    // 順序(order)に基づいてソート
    const sortedSteps = filteredSteps.sort((a, b) => a.order - b.order);

    const response: HelpApiResponse = {
      steps: sortedSteps,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch help steps:", error);
    return NextResponse.json(
      { message: "ヘルプコンテンツの取得に失敗しました。" },
      { status: 500 }
    );
  }
}

// イベント作成者かどうかをチェックする関数
async function checkIfUserIsEventCreator(userId: string, eventId: string): Promise<boolean> {
  // ここにデータベースからイベントを取得して作成者かどうかをチェックするロジックを追加
  // 仮定: Prismaを使ってイベントを取得
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const event = await prisma.create_event.findUnique({
      where: { id: parseInt(eventId) },
      select: { creatorId: true },
    });
    return event?.creatorId === parseInt(userId);
  } catch (error) {
    console.error("Error checking event creator:", error);
    return false;
  }
}
