# セキュリティ監査自動化運用マニュアル

## 1. Windows環境 (監視のみ)
`daily_audit_check.bat` を使用して、脆弱性を検知した場合にログを保存します。

### セットアップ手順
1. **タスクスケジューラ** を起動。
2. 「基本タスクの作成」から、毎日実行するタスクを作成。
3. プログラムに `scripts\daily_audit_check.bat` を指定。
4. **重要**: 「開始オプション (フォルダー)」に `scripts` フォルダのパスを指定してください。

---

## 2. Linux / Docker環境 (自動修正機能付き)
**「勝手に npm audit fix が動く」**ようにするための設定です。
`scripts/auto_security_patch.sh` を使用します。このスクリプトは、一時的なDockerコンテナを立ち上げてソースコードに対して `npm audit fix` を実行します。

### 前提条件
- Docker および Docker Compose がインストールされていること。
- プロジェクトの `src` ディレクトリが存在すること。

### スクリプトの動作確認
まず手動で実行して、正しく動作するか確認します。
```bash
chmod +x scripts/auto_security_patch.sh
./scripts/auto_security_patch.sh
```

### 自動実行 (Cron) の設定手順
毎日深夜 (例: AM 4:00) に自動実行し、修正があればコンテナを再ビルドさせる設定です。

1. **Crontabを開く**
   ```bash
   crontab -e
   ```

2. **以下の行を追加**
   (パス `/path/to/project` は実際のプロジェクトのルートパスに書き換えてください)

   ```cron
   # 毎日AM 4:00にセキュリティパッチ適用を実行 & 再ビルド
   0 4 * * * /bin/bash /path/to/project/scripts/auto_security_patch.sh >> /path/to/project/audit_logs/cron_audit.log 2>&1 && cd /path/to/project && docker-compose -f docker-compose.prod.yml up -d --build
   ```

   - `>> ... 2>&1`: 実行ログを保存します。
   - `&& ...`: パッチ適用が成功した場合のみ、`docker-compose` で再ビルド・再起動を行います。

### 注意点
- `npm audit fix` は `package-lock.json` を更新します。
- `--force` オプションを使用している場合、破壊的変更（メジャーバージョンアップ）が含まれる可能性があります。本番環境での完全自動化はリスクを伴うため、まずは開発環境で運用することをお勧めします。
