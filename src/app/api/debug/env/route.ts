import { NextResponse } from 'next/server';

/**
 * 環境変数デバッグ用API
 * 
 * 重要な環境変数の設定状況（存在するかどうか、長さなど）を確認します。
 * 本番運用時は無効化または削除を推奨します。
 */
export async function GET() {
  // 注意: このエンドポイントはデバッグ目的でのみ使用し、確認後は必ず削除してください。

  // 安全のため、機密情報は表示せず、存在と長さのみを確認します。
  const debugEnvs = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    // 'NEXT_PUBLIC_GOOGLE_CLIENT_ID'の存在と長さを確認
    NEXT_PUBLIC_GOOGLE_CLIENT_ID_EXISTS: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID_LENGTH: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.length || 0,
    // 'GOOGLE_CLIENT_SECRET'の存在と長さを確認
    GOOGLE_CLIENT_SECRET_EXISTS: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CLIENT_SECRET_LENGTH: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
  };

  return NextResponse.json(debugEnvs);
}
