"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nextConfig = {
    /* config options here */
    output: 'standalone',
    // login-appディレクトリをビルドから除外
    exclude: ['login-app/**'],
};
exports.default = nextConfig;
