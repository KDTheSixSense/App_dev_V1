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
# 備考: `src`ディレクトリ内にプロジェクトがある場合は、 `COPY src/package.json ./` のようにパスを調整してな
COPY package*.json ./

# 依存関係をインストール
# ビルドとコンパイルにはdevDependenciesも必要やから、ここでは全部インストールする
RUN npm install

# プロジェクトのソースコードを全部コピー
COPY . .

# ▼▼▼【ここがプロの仕事や！】▼▼▼
# 1. Prisma Clientを生成する
RUN npx prisma generate

# 2. tsconfig.seed.jsonっていう「翻訳ルールブック」を使って、シーディングスクリプトをコンパイルする
RUN npx tsc --project prisma/tsconfig.seed.json
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# Next.jsアプリをビルド (next.config.js に output: 'standalone' がある前提)
RUN npm run build


# --------------------------------------------------------------------
# ステージ2: ランナー (Runner) - 完成品を動かす専門の職人
# --------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# 実行に必要な最小限のユーザーを作成（セキュリティ対策やで）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ビルダー(builder)ステージから、実行に必要なファイルだけを厳選してコピー
# standaloneモードの出力を使うと、これだけでOK
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ▼▼▼【ここも大事なとこや！】▼▼▼
# Prismaのスキーマファイルと、さっきコンパイルしたseed.jsを実行環境にコピーする
# これで、マイグレーションJobがこのイメージを使い回せるようになるんや
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.js ./prisma/
# もしseed.tsが他のファイルを読み込んどるなら、それらもコピーする必要があるで
# 例: COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed ./prisma/seed
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# 作成したユーザーに切り替え
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# アプリケーションを起動
CMD ["node", "server.js"]

