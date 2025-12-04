# --------------------------------------------------------------------
# ステージ1: ビルダー (Builder / キッチン)
# --------------------------------------------------------------------
FROM node:20-alpine AS builder

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

WORKDIR /app
COPY package.json package-lock.json* ./
# prismaもdependenciesに含めておく
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# --------------------------------------------------------------------
# ステージ2: ランナー (Runner / アプリ用のお弁当箱)
# --------------------------------------------------------------------
FROM node:20-alpine AS runner

# Add packages for linting
RUN apk add --no-cache openjdk17 build-base mono php postgresql-client

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# schema.prismaは実行時にも必要
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma

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