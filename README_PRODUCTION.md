# 本番環境（Production）起動・セットアップ手順

このプロジェクトをDocker環境（本番構成）で起動し、初期データを投入するための手順書です。

## 1. アプリケーションの起動

以下のコマンドを実行して、Dockerコンテナをビルド・起動します。
※`--build` オプションを付けることで、最新のコードと設定（Python環境など）が確実に反映されます。

```powershell
docker-compose -f docker-compose.prod.yml up -d --build
```

起動後、全てのコンテナ（app, db, nginx, sandbox）が `Running` または `Started` になるまで少し待ちます。

## 2. データベースの初期化（Seed）

ホスト側のPowerShellから、Docker内のデータベース（ポート6543で公開中）に対して初期データを流し込みます。

> **注意**: データベースのポートは **6543** に設定されています（ホストの5432との競合を避けるため）。

```powershell
# 1. ソースディレクトリへ移動
cd src

# 2. 接続先URLを設定（PowerShell用）
$env:DATABASE_URL="postgresql://user:password@localhost:6543/mydatabase"

# 3. Seedコマンドを実行
npx prisma db seed

# 4. 元のディレクトリに戻る（任意）
cd ..
```

成功すると `✅ Seeding finished.` と表示されます。

## 3. 動作確認

ブラウザで以下のURLにアクセスしてください。

- **URL**: [http://localhost](http://localhost)

### ログイン確認用アカウント
Seedコマンドで作成された管理者（作成者）アカウントです。

- **メールアドレス**: `alice@example.com`
- **パスワード**: `password123`

### 確認事項
- ログインができること
- 「問題一覧」ページに問題が表示されていること
- 任意のプログラミング問題を開き、「実行」ボタンを押して結果が返ってくること（Sandbox機能の確認）

---

## 補足: 環境の停止・削除

環境を完全に停止し、コンテナを削除する場合は以下のコマンドを使用します。

```powershell
docker-compose -f docker-compose.prod.yml down
```
