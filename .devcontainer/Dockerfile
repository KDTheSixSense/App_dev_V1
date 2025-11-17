# ベースイメージとしてNode.js 20がプリインストールされたイメージを使用
FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# rootユーザーでPostgreSQLクライアントをインストール (psqlコマンドやPrismaでの接続に便利)
USER root
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client \
    && npm install -g npm@11.4.2 \
# サーバーサイド・リンティング (/api/lint_code) に必要なパッケージを追加
    && apt-get -y install --no-install-recommends \
        python3 \
        python3-pip \
        python3-pyflakes \
        openjdk-17-jdk \  
        build-essential \ 
        mono-mcs \        
        php-cli \
# apt-get のキャッシュをクリーンアップ
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# JavaのPATHを設定 ---
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk
ENV PATH=$PATH:$JAVA_HOME/bin

# ユーザーをnodeに戻す (devcontainer.jsonのremoteUserと合わせる)
USER node