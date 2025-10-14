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
RUN npm ci --only=production

# プロジェクトのソースコードを全部コピー
COPY src/ .

# Prisma Client を生成する
RUN npx prisma generate

# Next.jsアプリをビルド
RUN npm run build

# --------------------------------------------------------------------
# ステージ2: ランナー (Runner)
# --------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# 実行に必要な最小限のユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ビルダーから、実行に必要なファイルだけをコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ★★★★★ ここが最重要ポイント ★★★★★
# builderステージのnode_modulesから、生成済みのPrisma Clientをコピーする
# これでクエリエイジンが確実に含まれる
COPY --from=builder /app/node_modules/.prisma ./.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client


# ★★★★★ これも重要 ★★★★★
# prisma/migrations を含む prisma ディレクトリをコピーする
# これがないとマイグレーションJobが失敗する
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# アプリケーションを起動
CMD ["node", "server.js"]