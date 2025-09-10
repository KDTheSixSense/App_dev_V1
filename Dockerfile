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

# Next.jsアプリをビルドする。
# この時だけ、DATABASE_URLをダミーの値で上書きして、ビルド中にDB接続しようとするのを防ぐ
RUN DATABASE_URL="dummy" npm run build

# ▼▼▼【ここが最後の修正ポイントや！】▼▼▼
# Next.jsの掃除が終わった「後」で、シーディングスクリプトをコンパイルするんや！
# これで、もう勝手に消されることはあらへん。
WORKDIR /app/prisma
RUN npx tsc --project tsconfig.seed.json
WORKDIR /app
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# ▼▼▼【デバッグ用のコマンドや！】▼▼▼
# コンパイルが終わった直後に、prismaフォルダの中身を全部表示させる。
# これで、'seed.js' がほんまに作られとるか、ワシら自身の目で確認できるんや。
RUN ls -laR prisma
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

# Prismaのスキーマファイルと、コンパイル済みのseed.jsと関連ファイルをコピー
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.js ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed ./prisma/seed

# 作成したユーザーに切り替え
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# アプリケーションを起動
CMD ["node", "server.js"]

