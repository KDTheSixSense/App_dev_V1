# ベースイメージとしてNode.js 20がプリインストールされたイメージを使用
FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# rootユーザーでPostgreSQLクライアントをインストール (psqlコマンドやPrismaでの接続に便利)
USER root
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client \
    && npm install -g npm@11.4.2

# ユーザーをnodeに戻す (devcontainer.jsonのremoteUserと合わせる)
USER node