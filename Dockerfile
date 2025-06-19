# --------------------------------------------------------------------
# ステージ1: ビルダー (Builder)
# --------------------------------------------------------------------
FROM node:20-alpine AS builder

# Next.jsプロジェクトのルートを作業ディレクトリにする
WORKDIR /app

# 依存関係のファイルだけを先にコピー
COPY app/src/package.json ./
COPY app/src/package-lock.json* ./
# prismaのスキーマファイルも先にコピーしておく
COPY app/src/prisma ./prisma/

# 依存関係をインストール
# ここで、package.json の "postinstall" スクリプトが自動で実行されて、
# "prisma generate" も一緒にやってくれる！
RUN npm install

# アプリケーションのソースコードを全部コピー
COPY app/src/ .

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

# ビルダー(builder)ステージから、実行に必要なファイルだけをコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ★ standaloneモードでも、Prismaのスキーマファイルと生成されたクライアントが必要！
# .next/standalone/node_modules/@prisma/client には生成済みクライアントがあるはずやけど、
# スキーマファイルも一緒に置いとくのが安全。
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production

# アプリケーションを起動
CMD ["node", "server.js"]