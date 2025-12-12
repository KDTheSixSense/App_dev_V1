# --------------------------------------------------------------------
# ステージ1: ビルダー (Builder)
# --------------------------------------------------------------------
FROM node:20-alpine AS builder

ARG DATABASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXTAUTH_URL
# その引数の値を環境変数として設定
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL


# Next.jsプロジェクトのルートを作業ディレクトリにする
WORKDIR /app

# 依存関係のファイルを先にコピー
COPY src/package.json src/package-lock.json* ./

# Native modules build dependencies
RUN apk add --no-cache python3 make g++

# 依存関係をインストール
RUN npm install

# プロジェクトのソースコードを全部コピー
COPY src/ .

# ★★★★★★★★★★★★★★★★★★★★★★★
# ★ ここに Prisma Client を生成するコマンドを追加！ ★
# ★★★★★★★★★★★★★★★★★★★★★★★
RUN npx prisma generate

# Next.jsアプリをビルド (next.config.js に output: 'standalone' がある前提)
RUN npm run build


# --------------------------------------------------------------------
# ステージ2: ランナー (Runner)
# --------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# PrismaにはOpenSSLが必要です
# また、lint機能のためにPython3などのランタイムも必要です
RUN apk add --no-cache openssl python3 make g++ openjdk17-jre php

# 実行に必要な最小限のユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ビルダー(builder)ステージから、実行に必要なファイルだけをコピー
# standaloneモードの出力を使うと、これだけでOK
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prismaのスキーマファイルも実行環境にコピーする
# これがないと、実行時にPrismaがスキーマを見つけられずにエラーになることがある
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# アプリケーションを起動
CMD ["node", "server.js"]