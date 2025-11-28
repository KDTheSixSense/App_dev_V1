import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1. k8s向け最適化: そのままでOK */
  output: 'standalone',

  /* 2. セキュリティ強化: バージョン情報隠蔽 */
  // レスポンスヘッダから 'X-Powered-By: Next.js' を削除し、
  // 攻撃者にフレームワークを特定されにくくします。
  poweredByHeader: false,

  /* 3. 画像最適化 */
  images: {
    // Googleアカウントのアイコン表示用設定ですね。問題ありません。
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    // AVIFを追加すると、対応ブラウザでさらに画像転送量が減ります
    formats: ['image/avif', 'image/webp'],
  },

  /* 4. セキュリティヘッダーの追加 (重要) */
  async headers() {
    return [
      {
        // 全てのパスに適用
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            // HSTS: 1年間HTTPSを強制。サブドメインも含む。
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            // MIMEタイプスニッフィング対策
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            // クリックジャッキング対策 (iframe埋め込み禁止)
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ];
  },
};

export default nextConfig;