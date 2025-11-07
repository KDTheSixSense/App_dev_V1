/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dockerコンテナで本番環境を動かすために、'standalone'モードは必須やで！
  output: 'standalone',
  reactStrictMode: false,
};

module.exports = nextConfig;
