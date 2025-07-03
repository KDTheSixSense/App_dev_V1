import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  output: 'standalone',
  // login-appディレクトリをビルドから除外
  exclude: ['login-app/**'],
};

export default nextConfig;
