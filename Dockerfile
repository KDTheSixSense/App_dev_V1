# --------------------------------------------------------------------
# ステージ1: ビルダー (Builder)
# --------------------------------------------------------------------
# Alpine LinuxベースのNode.js 20イメージを使う。軽くてええで。
FROM node:20-alpine AS builder

# ビルド時に外部から DATABASE_URL を受け取るための引数を定義
ARG DATABASE_URL
# 受け取った引数を環境変数として設定
ENV DATABASE_URL=$DATABASE_URL

# Next.jsプロジェクトのルートを作業ディレクトリにする
WORKDIR /app

# 依存関係のファイルを先にコピー
COPY src/package.json src/package-lock.json* ./

# 依存関係をインストール
# --omit=dev を付けると、devDependenciesを除外して本番に必要なもんだけインストールする
RUN npm install --omit=dev

# プロジェクトのソースコードを全部コピー
COPY src/ .

# ▼▼▼【ここがプロの仕事や！】▼▼▼
# Prisma Clientを生成する
RUN npx prisma generate
# シーディングスクリプトを、TypeScriptからJavaScriptにコンパイルする
RUN npx tsc prisma/seed.ts
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

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

# ▼▼▼【ここも大事なとこや！】▼▼▼
# Prismaのスキーマファイルと、さっきコンパイルしたseed.jsを実行環境にコピーする
# これで、マイグレーションJobがちゃんと動くようになるで
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.js ./prisma/
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# 作成したユーザーに切り替え
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# アプリケーションを起動
CMD ["node", "server.js"]

