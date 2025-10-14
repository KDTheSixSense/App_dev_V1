# --------------------------------------------------------------------
# ステージ1: ビルダー (Builder)
# --------------------------------------------------------------------
FROM node:20-alpine AS builder

# Prisma generateにはDB接続情報が必要なためARGで受け取る
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

WORKDIR /app

# 依存関係のファイルを先にコピー
COPY src/package.json src/package-lock.json* ./

# ★改善案: 本番ビルドに必要な依存関係のみインストール
RUN npm ci

# プロジェクトのソースコードを全部コピー
COPY src/ .

# Prisma Client を生成する
RUN npx prisma generate

# Next.jsアプリをビルド
RUN npm run build

# --------------------------------------------------------------------
# ステージ2: ランナー (Runner)
# --------------------------------------------------------------------
# --------------------------------------------------------------------
# ステージ2: ランナー (Runner)
# --------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# (adduser, addgroupは変更なし)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# (standalone出力のコピーは変更なし)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# (前回追加したPrisma Clientのコピーもそのまま残す)
COPY --from=builder /app/node_modules/.prisma ./.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# ★★★★★ ここに2行追加 ★★★★★
# マイグレーション実行に必要なprisma CLIをbuilderからコピーする
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/

# (prisma/migrations を含む prisma ディレクトリのコピーもそのまま残す)
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]