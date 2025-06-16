FROM node:18-bullseye

# 作業ディレクトリを設定
WORKDIR /app

# 開発サーバーを起動
CMD ["npm", "run", "dev"]