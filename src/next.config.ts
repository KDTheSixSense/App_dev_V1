import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  output: 'standalone',
  reactStrictMode: false,
  transpilePackages: ['three', 'three-stdlib', '@react-three/drei', 'troika-three-text', 'troika-worker-utils'],
  images: {
    // remotePatterns (推奨される新しい形式) を使用
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**', // このドメインのすべてのパスを許可
      },
    ],
  },
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://static.doubleclick.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://lh3.googleusercontent.com https://*.ytimg.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://lh3.googleusercontent.com https://raw.githubusercontent.com; frame-src 'self' https://www.youtube.com https://youtube.com; worker-src 'self' blob: data: 'unsafe-inline' 'unsafe-eval';",
      },
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

};

export default nextConfig;
