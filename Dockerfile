# --------------------------------------------------------------------
# ステージ1: ビルダー (Builder) - アプリの部品を作る専門の職人
# --------------------------------------------------------------------
# このステージはほぼ完璧なので、変更なし！
FROM node:20-alpine AS builder

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

WORKDIR /app

COPY src/package*.json ./
RUN npm install
COPY src/ .
RUN npx prisma generate
RUN DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy" npm run build


# --------------------------------------------------------------------
# ステージ2: ランナー (Runner) - 完成品を動かしつつ、道具箱も持ってる職人
# --------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ▼▼▼【ここからが修正ポイントや！】▼▼▼

# [修正点1] package.jsonを先にコピー
# これで `npm run db:deploy` のようなスクリプトを実行できるようになる
COPY --from=builder /app/package*.json ./

# [修正点2] 本番用の依存関係をインストール
# これにより、Prisma CLIのようなdevDependenciesは除外されつつ、
# Prisma Clientのようなdependenciesはインストールされる
# --omit=dev は npm v7以降で使えるで
RUN npm install --omit=dev

# [修正点3] Prismaのスキーマとマイグレーションファイルをコピー
# Jobで `prisma migrate deploy` を実行するために必須
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# 実行に必要なNext.jsのビルド成果物をコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]