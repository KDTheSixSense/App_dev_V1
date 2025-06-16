# ベースイメージとしてNode.jsの公式イメージを使用
FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# Prismaが依存する可能性のあるシステムパッケージ（例: PostgreSQLクライアント、または特定の環境でのOpenSSLライブラリ）
# これはデータベースの種類やOSイメージによって異なります。
# 例: PostgreSQLと関連するライブラリをインストールする場合
# RUN apt-get update && apt-get install -y libpq-dev

# 作業ディレクトリを設定
WORKDIR /workspaces/my-next-app

# ユーザーをnodeに設定 (devcontainer.jsonのremoteUserと合わせる)
USER node