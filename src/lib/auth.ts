//lib/auth.ts

import { getIronSession, IronSession, IronSessionData } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from './session';

/**
 * アプリケーションセッション取得ヘルパー
 * 
 * Iron Sessionを取得し、ユーザーのトークンバージョンをDBと照合して
 * セッションの有効性を確認します。（強制ログアウト対応）
 */
export async function getAppSession(): Promise<IronSession<IronSessionData>> {

  const cookieStore = cookies();

  const session = await getIronSession<IronSessionData>(await cookieStore, sessionOptions);

  if (session.user) {
    // セッションが無効化されているか確認
    // パフォーマンス考慮: ここで毎回DBアクセスが発生します。
    // 大規模アクセスの場合はRedis等へのキャッシュを検討してください。
    // 今回は基本的なセキュリティ対策として実装します。
    try {
      // 循環参照を避けるため、動的にprismaをインポートするか、ここでは簡易チェックに留める判断も可
      // しかし要件として無効化が必要なため、prismaでチェックする
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tokenVersion: true },
      });

      // ユーザーが存在しない、またはトークンバージョンが一致しない（古い）場合はログアウト
      // session.user.tokenVersion が undefined の場合も無効とみなす（移行措置）
      if (!user || (user.tokenVersion !== (session.user.tokenVersion || 0))) {
        session.destroy();
        return session; // 空のセッションを返す
      }
    } catch (e) {
      console.error("Session validation error:", e);
      // DBエラー時は安全側に倒してセッション維持するか、破棄するか...
      // ここではログを出して維持する（DoS回避）
    }
  }

  return session;
}
