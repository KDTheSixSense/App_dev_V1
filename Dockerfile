# --------------------------------------------------------------------
# ステージ1: ビルダー (Builder)
# --------------------------------------------------------------------
FROM node:20-alpine AS builder

# Next.jsプロジェクトのルートを作業ディレクトリにする
WORKDIR /app

# 依存関係のファイルを先にコピー
COPY src/package.json src/package-lock.json* ./

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