import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1. k8s向け最適化: そのままでOK */
  output: 'standalone',
  reactStrictMode: false,
  transpilePackages: ['three', 'three-stdlib', '@react-three/drei', 'troika-three-text', 'troika-worker-utils'],

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;