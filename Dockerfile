# --------------------------------------------------------------------
# ステージ1: ビルダー (Builder) - アプリの部品を作る専門の職人
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
# あんたのプロジェクトは'src'フォルダの中にあるから、ちゃんと'src/'を指定するんや
COPY src/package*.json ./

# 依存関係をインストール
# ビルドとコンパイルにはdevDependenciesも必要やから、ここでは全部インストールする
RUN npm install

# プロジェクトのソースコードを全部コピー
COPY src/ .

# Prisma Clientを生成する（これはbuildの前に必要）
RUN npx prisma generate

# ▼▼▼【ここがプロの仕事や！】▼▼▼
# package.jsonの "build" スクリプトを実行する。
# これで、まず "seed:compile" が動いて、その後に "next build" が動く。
# DATABASE_URLも、Prismaが文句を言わん形式のダミーで渡すから、DB接続エラーも起きへん。
RUN DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy" npm run build
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


# --------------------------------------------------------------------
# ステージ2: ランナー (Runner) - 完成品を動かす専門の職人
# --------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# 実行に必要な最小限のユーザーを作成（セキュリティ対策やで）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ビルダー(builder)ステージから、実行に必要なファイルだけを厳選してコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prismaのスキーマファイルと、「dist」フォルダに作られた完成品をコピー
# COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/
# COPY --from=builder --chown=nextjs:nodejs /app/prisma/dist/seed.js ./prisma/
# COPY --from=builder --chown=nextjs:nodejs /app/prisma/dist/seed ./prisma/seed

# 作成したユーザーに切り替え
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# アプリケーションを起動
CMD ["node", "server.js"]

