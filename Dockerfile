# ステージ1: ビルド環境 (依存関係のインストールとアプリケーションのビルド)
FROM node:20-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係のファイルを先にコピーして、キャッシュを効かせる
COPY package.json yarn.lock* package-lock.json* ./

# 依存関係をインストール (npm, yarn, pnpm など、あんたが使ってるものに合わせてな)
# RUN yarn install
RUN npm install

# アプリケーションのソースコードを全部コピー
COPY . .

# ★ ビルド時に必要な環境変数をここで設定
# ARG NEXT_PUBLIC_API_ENDPOINT=https://api.example.com
# ENV NEXT_PUBLIC_API_ENDPOINT=$NEXT_PUBLIC_API_ENDPOINT

# Next.jsアプリをビルド
RUN npm run build

# 実行時に必要な本番用の依存関係だけをインストール
RUN npm prune --production


# ステージ2: 実行環境 (軽量なイメージ)
FROM node:20-alpine AS runner

WORKDIR /app

# 実行に必要な最小限のユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# ビルドステージから、実行に必要なファイルだけをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# ディレクトリの所有者を新しいユーザーに変更
USER nextjs
RUN chown -R nextjs:nodejs ./.next

# Next.jsアプリが使うポートを公開
EXPOSE 3000

# ★ 実行時に必要な環境変数を設定 (これはKubernetesのSecret/ConfigMapから渡すのが本番流)
# ENV NODE_ENV=production
# ENV DATABASE_URL=... (Secretから)

# アプリケーションを起動
CMD ["npm", "start"]