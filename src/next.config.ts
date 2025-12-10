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
      // Force text/plain for uploaded code files to prevent execution (XSS)
      {
        source: '/uploads/:path*.js',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
          { key: 'Content-Disposition', value: 'inline' }, // Allow viewing in browser as text
        ],
      },
      {
        source: '/uploads/:path*.ts',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
          { key: 'Content-Disposition', value: 'inline' },
        ],
      },
      {
        source: '/uploads/:path*.py',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
          { key: 'Content-Disposition', value: 'inline' },
        ],
      },
      {
        source: '/uploads/:path*.java',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
          { key: 'Content-Disposition', value: 'inline' },
        ],
      },
      {
        source: '/uploads/:path*.c',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
          { key: 'Content-Disposition', value: 'inline' },
        ],
      },
      {
        source: '/uploads/:path*.cpp',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
          { key: 'Content-Disposition', value: 'inline' },
        ],
      },
    ];
  },
  // @ts-ignore: Next.js 16 turbopack config
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
