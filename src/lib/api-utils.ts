import { NextResponse } from 'next/server';

/**
 * APIエラーを安全に処理し、標準化されたレスポンスを返します。
 * 本番環境では詳細なエラーメッセージを隠蔽し、開発環境では表示するなどの制御も可能です。
 * 今回の要件では、一律して詳細をログに出力し、クライアントには汎用メッセージを返します。
 * 
 * @param error 発生したエラーオブジェクト
 * @param context エラーのコンテキスト（どの処理で発生したか）
 * @param headers 任意のレスポンスヘッダー
 */
export function handleApiError(error: unknown, context: string, headers?: HeadersInit) {
    console.error(`[API Error] ${context}:`, error);

    // ステータスコードの判定（基本は500だが、用途に応じて変えることも可能）
    // ここでは「サーバー内部エラー」として統一的に扱う
    const status = 500;

    // クライアントへ返すメッセージ
    // セキュリティのため、具体的なエラー内容は返さない
    const message = 'サーバー内部でエラーが発生しました。';

    return NextResponse.json(
        {
            success: false, // 統一フォーマットとしてsuccessを含めると便利
            message
        },
        { status, headers }
    );
}
