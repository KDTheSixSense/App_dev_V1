FROM node:18-bullseye

# 作業ディレクトリを設定
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# 開発サーバーを起動
CMD ["npm", "run", "dev"]