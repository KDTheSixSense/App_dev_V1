import { NextResponse } from 'next/server';
import os from 'os';

/**
 * ヘルスチェックAPI
 * 
 * アプリケーションの稼働状況を確認するためのエンドポイントです。
 * Kubernetes等のオーケストレーターからの使用を想定しています。
 */
export async function GET() {
  // ホスト名（KubernetesではPod名になる）を取得
  const hostname = os.hostname();

  return NextResponse.json({
    status: 'ok',
    processed_by: hostname, // レスポンスにPod名を含める
  });
}