# --------------------------------------------------------------------
# ステージ1: ビルダー (Builder / キッチン)
# --------------------------------------------------------------------
FROM node:20-alpine3.20 AS builder

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL

WORKDIR /app

# 依存関係のファイルを先にコピー
COPY src/package.json src/package-lock.json* ./

# Native modules build dependencies
RUN apk add --no-cache python3 make g++

# 依存関係をインストール
RUN npm install

# プロジェクトのソースコードを全部コピー
COPY src/ .
RUN npx prisma generate
RUN npm run build

# --------------------------------------------------------------------
# ステージ2: ランナー (Runner / アプリ用のお弁当箱)
# --------------------------------------------------------------------
FROM node:20-alpine3.20 AS runner

# Add packages for linting
RUN apk update && apk add --no-cache \
    openssl \
    curl \
    postgresql-client

WORKDIR /app

# PrismaにはOpenSSLが必要です
# また、lint機能のためにPython3などのランタイムも必要です
RUN apk add --no-cache openssl python3 make g++ openjdk17-jre php

# 実行に必要な最小限のユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prismaのスキーマファイルも実行環境にコピーする
# これがないと、実行時にPrismaがスキーマを見つけられずにエラーになることがある
# Prismaのスキーマファイルも実行環境にコピーする
# これがないと、実行時にPrismaがスキーマを見つけられずにエラーになることがある
COPY --from=builder /app/prisma ./prisma

# Tracerスクリプトをコピー (traceActions.tsが参照するため)
# builderでは src/ の中身をルートにコピーしているため /app/lib/python_tracer.py にある
COPY --from=builder /app/lib/python_tracer.py ./src/lib/python_tracer.py

USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]

# --------------------------------------------------------------------
# ★★★ ステージ3: マイグレーター (Migrator / マイグレーション用のキッチン) ★★★
# --------------------------------------------------------------------
FROM builder AS migrator

# このイメージのデフォルトの動作を設定
CMD ["npm", "run", "db:deploy"]

# --------------------------------------------------------------------
# ★★★ ステージ4: サンドボックス (Sandbox / コード実行用の隔離部屋) ★★★
# --------------------------------------------------------------------
# コンパイラの互換性のため、Debianベースのイメージを使用します
FROM node:20-bookworm AS sandbox-env

# 1. コンパイラと実行環境のインストール
#    (iptablesはNetworkPolicyで代用するため除外しました)
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    python3 \
    python3-pip \
    openjdk-17-jdk \
    build-essential \
    mono-mcs \
    php-cli \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. TypeScriptコンパイラをグローバルインストール
RUN npm install -g typescript

# 3. セキュリティ強化: 権限の低いユーザーを作成
RUN useradd -m -s /bin/bash sandboxuser

WORKDIR /sandbox

# 4. ローカルで作成したsandbox-workerフォルダの中身をコピー
COPY sandbox/package.json ./

# 5. 依存関係のインストール
RUN npm install

# 6. サーバーコードのコピー
COPY sandbox/server.js ./

# 7. ユーザー切り替え (rootでの実行は禁止)
USER sandboxuser

# 8. ポート公開 (server.jsで4000番を指定しています)
EXPOSE 4000

# 9. サーバー起動
CMD ["node", "server.js"]