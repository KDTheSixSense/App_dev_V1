/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dockerコンテナで本番環境を動かすために、'standalone'モードは必須やで！
  output: 'standalone',

  // 'exclude'はnext.config.jsの有効なオプションやないで。
  // 前のビルドエラー 'Unrecognized key(s) in object: exclude' の原因はこれや。
  // もし特定のディレクトリをビルドから除外したい場合は、.dockerignoreを使うか、
  // プロジェクトの構造を見直すのが一般的なやり方やで。
  // exclude: ['login-app/**'],
};

module.exports = nextConfig;
