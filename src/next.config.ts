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
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];

    const codeFileExtensions = ['js', 'ts', 'py', 'java', 'c', 'cpp'];
    const codeFileHeaders = [
      { key: 'Content-Type', value: 'text/plain' },
      { key: 'Content-Disposition', value: 'inline' },
    ];

    const headers = [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Force text/plain for uploaded code files to prevent execution (XSS)
      ...codeFileExtensions.map((ext) => ({
        source: `/uploads/:path*.${ext}`,
        headers: codeFileHeaders,
      })),
      // ZAP対策: 静的ファイルにもCSPを付与する（動的ページはMiddlewareで処理）
      {
        source: '/images/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'none'; frame-ancestors 'none';" }
        ]
      },
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'none'; frame-ancestors 'none';" }
        ]
      },
    ];

    return headers;
  },
  // @ts-ignore: Next.js 16 turbopack config
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;