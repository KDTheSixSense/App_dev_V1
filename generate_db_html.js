const fs = require('fs');
const path = require('path');

const PRISMA_SCHEMA_PATH = path.join('src', 'prisma', 'schema.prisma');
const OUTPUT_HTML_PATH = 'db_documentation.html';

// 論理名マッピング辞書
const LOGICAL_NAME_MAP = {
    // 汎用
    'id': 'ID',
    'createdAt': '作成日時',
    'updatedAt': '更新日時',
    'email': 'メールアドレス',
    'password': 'パスワード',
    'name': '名称',
    'description': '説明/詳細',
    'userId': 'ユーザーID',
    'isPublic': '公開フラグ',

    // Difficulty
    'xp': '獲得経験値',
    'feed': '獲得満腹度（コハク）',
    'difficultyName': '難易度名',
    'basePoints': '基本ポイント',
    'maxBonusPoints': '最大ボーナスポイント',
    'expectedTimeMinutes': '想定所要時間(分)',

    // Title
    'requiredLevel': '必要レベル',
    'requiredSubjectId': '必要科目ID',
    'type': '称号タイプ(USER_LEVEL/SUBJECT_LEVEL)',

    // ProgrammingProblem
    'timeLimit': '制限時間(分)',
    'codeTemplate': '初期コードテンプレート',
    'allowTestCaseView': 'テストケース表示許可',
    'problemType': '問題タイプ',
    'topic': 'トピック',
    'tags': 'タグ(JSON)',
    'sampleCases': 'サンプルケース',
    'testCases': 'テストケース',

    // Event
    'inviteCode': '招待コード',
    'startTime': '開始日時',
    'endTime': '終了日時',
    'publicTime': '公開日時',
    'isStarted': 'イベント開始済みフラグ',
    'theme': '背景テーマ',

    // DailyMission
    'missionType': 'ミッションタイプ',
    'targetCount': '目標回数/数値',
    'xpReward': '報酬XP',
    'progress': '現在の進捗',
    'isCompleted': '達成済みフラグ',

    // Generic fallback for foreign keys
    'authorId': '作成者ID',
    'creatorId': '作成者ID',
    'assignmentId': '課題ID',
    'eventId': 'イベントID',
    'problemId': '問題ID',
};

function parsePrismaSchema(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const models = [];

    let currentModel = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // コメントのみの行は、モデル定義外ならスキップ、定義内ならフィールドパース時に処理
        if (line.startsWith('//') && !currentModel) continue;

        // モデル開始判定 (model ModelName {)
        if (!currentModel && line.startsWith('model ')) {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                const modelName = parts[1];
                currentModel = {
                    name: modelName,
                    fields: []
                };
                if (line.includes('{')) braceCount++;
            }
            continue;
        }

        // ブロック内処理
        if (currentModel) {
            // 中括弧のカウント処理
            // line内に { があればインクリメント、 } があればデクリメント
            // コメント内の {} は無視したいが、簡易的に行内の文字で判定
            // 行末にコメントがある場合を除去してからカウント
            const cleanLineForCount = line.split('//')[0];
            const openBraces = (cleanLineForCount.match(/\{/g) || []).length;
            const closeBraces = (cleanLineForCount.match(/\}/g) || []).length;

            braceCount += openBraces;
            braceCount -= closeBraces;

            // フィールド解析
            if (line && !line.startsWith('//') && !line.startsWith('@@') && !line.includes('{') && !line.includes('}')) {
                // フィールド定義とみなす
                // 例: id Int @id @default(autoincrement()) // comment
                let lineContent = line;
                let comment = "";

                if (line.includes('//')) {
                    const parts = line.split('//');
                    lineContent = parts[0].trim();
                    comment = parts.slice(1).join('//').trim();
                }

                const parts = lineContent.split(/\s+/);
                if (parts.length >= 2) {
                    const name = parts[0];
                    // 型名は attribute (@) がつく前まで
                    let typeRaw = parts[1];
                    const type = typeRaw.split('@')[0];

                    // 配列型 [] や オプショナル ? は型名に含めるべきか？
                    // Mermaid生成時はきれいな型名がほしいので、分離しておく

                    const attributes = parts.length > 2 ? parts.slice(2).join(' ') : "";

                    // 論理名の決定: スキーマコメント > マッピング辞書
                    let logicalName = comment;
                    if (!logicalName && LOGICAL_NAME_MAP[name]) {
                        logicalName = LOGICAL_NAME_MAP[name];
                    }

                    currentModel.fields.push({
                        name: name,
                        type: type,
                        attributes: attributes,
                        comment: logicalName
                    });
                }
            }

            // ブロック終了判定
            if (braceCount === 0) {
                models.push(currentModel);
                currentModel = null;
            }
        }
    }
    return models;
}

function generateHtml(models) {
    // 全モデル名のリスト（リレーション描画用）
    const existingModelNames = new Set(models.map(m => m.name));

    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>データベース定義書</title>
    <style>
        body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; max-width: 1400px; margin: 0 auto; padding: 20px; color: #333; background-color: #f4f6f8; }
        h1, h2, h3 { color: #2c3e50; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; }
        h1 { text-align: center; margin-bottom: 40px; }
        .toc { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .toc ul { column-count: 3; list-style: none; padding: 0; }
        .toc li { margin-bottom: 5px; }
        .toc a { text-decoration: none; color: #3498db; }
        .toc a:hover { text-decoration: underline; }
        
        table { border-collapse: collapse; width: 100%; margin-bottom: 30px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        th, td { border: 1px solid #eee; padding: 12px 15px; text-align: left; }
        th { background-color: #34495e; color: #fff; font-weight: 600; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        tr:hover { background-color: #f1f1f1; }
        
        .mermaid { margin: 40px 0; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow-x: auto; text-align: center; }
        
        @media print {
            .no-print { display: none; }
            body { padding: 0; background: #fff; }
            .toc { display: none; }
            .mermaid { box-shadow: none; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
        }
    </style>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ 
            startOnLoad: true,
            maxTextSize: 1000000, // 文字数制限緩和
            theme: 'default',
            securityLevel: 'loose'
        });
    </script>
</head>
<body>
    <h1>データベース定義書</h1>
    <div class="toc">
    <h2>テーブル一覧</h2>
    <ul>
`;

    for (const model of models) {
        html += `<li><a href="#${model.name}">${model.name}</a></li>`;
    }

    html += `</ul></div>
    
    <h2>ER図</h2>
    <div class="mermaid">
    erDiagram
`;

    // Mermaid Entity Definitions
    for (const model of models) {
        html += `    ${model.name} {\n`;
        for (const field of model.fields) {
            const cleanType = field.type.replace('?', '').replace('[]', '').trim();

            // 予約語対策
            const reservedWords = ['class', 'order', 'group', 'type', 'end', 'start', 'direction', 'subgraph', 'click'];
            let displayFieldName = field.name;
            if (reservedWords.includes(displayFieldName)) {
                displayFieldName = `_${displayFieldName}`;
            }

            // 全てダブルクォートで囲む
            const fieldName = `"${displayFieldName}"`;

            // 型名が長すぎる、または不適切な記号を含む場合のフェイルセーフ
            const safeType = cleanType.replace(/[^a-zA-Z0-9_]/g, '');

            html += `        ${safeType} ${fieldName}\n`;
        }
        html += `    }\n`;

        // Relations
        for (const field of model.fields) {
            const isArray = field.type.includes('[]');
            const isOptional = field.type.includes('?');
            const targetModelName = field.type.replace('?', '').replace('[]', '').trim();

            if (existingModelNames.has(targetModelName) && targetModelName !== model.name) {
                let label = `"${field.name}"`;

                if (isArray) {
                    html += `    ${model.name} ||--o{ ${targetModelName} : ${label}\n`;
                } else {
                    if (field.attributes.includes('@relation')) {
                        if (isOptional) {
                            html += `    ${model.name} }|--o| ${targetModelName} : ${label}\n`;
                        } else {
                            html += `    ${model.name} }|--|| ${targetModelName} : ${label}\n`;
                        }
                    }
                }
            }
        }
    }

    html += `    </div>
    </body></html>`;
    return html;
}

function generateTableHtml(models) {
    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>データベース定義書 - テーブル一覧</title>
    <style>
        body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; max-width: 1400px; margin: 0 auto; padding: 20px; color: #333; background-color: #f4f6f8; }
        h1, h2, h3 { color: #2c3e50; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; }
        h1 { text-align: center; margin-bottom: 40px; }
        .nav { text-align: center; margin-bottom: 30px; }
        .nav a { margin: 0 15px; text-decoration: none; color: #3498db; font-weight: bold; font-size: 1.2em; }
        .nav a.active { color: #2c3e50; pointer-events: none; border-bottom: 2px solid #2c3e50; }
        .toc { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .toc ul { column-count: 3; list-style: none; padding: 0; }
        .toc li { margin-bottom: 5px; }
        .toc a { text-decoration: none; color: #3498db; }
        .toc a:hover { text-decoration: underline; }
        
        table { border-collapse: collapse; width: 100%; margin-bottom: 30px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        th, td { border: 1px solid #eee; padding: 12px 15px; text-align: left; }
        th { background-color: #34495e; color: #fff; font-weight: 600; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        tr:hover { background-color: #f1f1f1; }
        
        @media print {
            .no-print { display: none; }
            .nav { display: none; }
            body { padding: 0; background: #fff; }
            .toc { display: none; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
        }
    </style>
</head>
<body>
    <div class="nav no-print">
        <a href="db_er.html">ER図</a>
        <a href="db_tables.html" class="active">テーブル一覧</a>
    </div>

    <h1>データベース定義書 - テーブル一覧</h1>
    <div class="toc">
    <h2>目次</h2>
    <ul>
`;

    for (const model of models) {
        html += `<li><a href="#${model.name}">${model.name}</a></li>`;
    }

    html += `</ul></div>
    
    <h2>テーブル詳細</h2>
`;

    for (const model of models) {
        html += `<h3 id="${model.name}">${model.name}</h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 25%;">論理名(説明)</th>
                    <th style="width: 20%;">物理名</th>
                    <th style="width: 15%;">型</th>
                    <th style="width: 40%;">属性・制約</th>
                </tr>
            </thead>
            <tbody>
`;
        for (const field of model.fields) {
            html += `<tr>
                <td>${field.comment || ''}</td>
                <td style="font-family: monospace;">${field.name}</td>
                <td style="font-family: monospace;">${field.type}</td>
                <td style="font-size: 0.9em; color: #666;">${field.attributes}</td>
            </tr>`;
        }
        html += `</tbody></table>`;
    }

    html += `</body></html>`;
    return html;
}

function generateERHtml(models) {
    const existingModelNames = new Set(models.map(m => m.name));

    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>データベース定義書 - ER図</title>
    <!-- svg-pan-zoom library -->
    <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
    <style>
        body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; max-width: 100%; margin: 0; padding: 20px; color: #333; background-color: #f4f6f8; height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-top: 0; }
        .nav { text-align: center; margin-bottom: 20px; flex-shrink: 0; }
        .nav a { margin: 0 15px; text-decoration: none; color: #3498db; font-weight: bold; font-size: 1.2em; }
        .nav a.active { color: #2c3e50; pointer-events: none; border-bottom: 2px solid #2c3e50; }
        
        /* Mermaidコンテナを画面いっぱいに広げ、ズームしやすくする */
        .mermaid { 
            flex-grow: 1;
            background: #fff; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            overflow: hidden; /* パン移動のためスクロールバーは隠す */
            text-align: center; 
            border: 1px solid #ccc;
            position: relative;
        }
        
        .mermaid svg {
            height: 100%;
            width: 100%;
        }

        @media print {
            .no-print { display: none; }
            .nav { display: none; }
            body { padding: 0; background: #fff; height: auto; display: block; }
            .mermaid { box-shadow: none; height: auto; overflow: visible; }
            .mermaid svg { height: auto; width: 100%; }
        }
    </style>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        
        // 設定
        const config = {
            startOnLoad: false, // 手動実行にして完了を待つ
            maxTextSize: 1000000,
            theme: 'default',
            securityLevel: 'loose',
        };
        mermaid.initialize(config);

        // 描画実行とPanZoom適用
        window.addEventListener('load', async () => {
            await mermaid.run();
            
            const svgElement = document.querySelector('.mermaid svg');
            if (svgElement) {
                // SVG本来のstyle属性が邪魔する場合があるのでリセット
                svgElement.style.maxWidth = 'none';
                svgElement.style.height = '100%';
                
                svgPanZoom(svgElement, {
                    zoomEnabled: true,
                    controlIconsEnabled: true,
                    fit: true,
                    center: true,
                    minZoom: 0.1,
                    maxZoom: 10
                });
            }
        });
    </script>
</head>
<body>
    <div class="nav no-print">
        <a href="db_er.html" class="active">ER図</a>
        <a href="db_tables.html">テーブル一覧</a>
    </div>

    <h1>データベース定義書 - ER図</h1>
    <p class="no-print" style="text-align: center; font-size: 0.9em; color: #666;">
        ※ マウスホイールで拡大縮小、ドラッグで移動ができます。<br>
    </p>

    <div class="mermaid">
    erDiagram
`;

    // Mermaid記法の内容を構築
    let mermaidContent = '';

    // Mermaid Entity Definitions
    for (const model of models) {
        // モデル名にプレフィックスを付けて予約語衝突を回避（例: Groups -> M_Groups）
        const safeModelName = `M_${model.name}`;

        mermaidContent += `    ${safeModelName} {\n`;
        for (const field of model.fields) {
            const cleanType = field.type.replace('?', '').replace('[]', '').trim();

            // 予約語対策
            const reservedWords = ['class', 'order', 'group', 'type', 'end', 'start', 'direction', 'subgraph', 'click'];
            let displayFieldName = field.name;
            if (reservedWords.includes(displayFieldName)) {
                displayFieldName = `_${displayFieldName}`;
            }

            // ダブルクォートは削除（標準的な英数字_のみであれば引用符不要で、むしろエラー要因になりうるため）
            const fieldName = `${displayFieldName}`;

            // 型名が長すぎる、または不適切な記号を含む場合のフェイルセーフ
            const safeType = cleanType.replace(/[^a-zA-Z0-9_]/g, '');

            // 型がモデル名リストに含まれている（＝リレーションフィールド）場合は、
            // ER図の属性としては表示せず、リレーション線でのみ表現する。
            if (existingModelNames.has(cleanType)) {
                continue;
            }

            mermaidContent += `        ${safeType} ${fieldName}\n`;
        }
        mermaidContent += `    }\n`;

        // Relations
        for (const field of model.fields) {
            const isArray = field.type.includes('[]');
            const isOptional = field.type.includes('?');
            const targetModelName = field.type.replace('?', '').replace('[]', '').trim();

            if (existingModelNames.has(targetModelName) && targetModelName !== model.name) {
                let label = `"${field.name}"`;
                const safeModelName = `M_${model.name}`;
                const safeTargetModelName = `M_${targetModelName}`;

                if (isArray) {
                    mermaidContent += `    ${safeModelName} ||--o{ ${safeTargetModelName} : ${label}\n`;
                } else {
                    if (field.attributes.includes('@relation')) {
                        if (isOptional) {
                            mermaidContent += `    ${safeModelName} }|--o| ${safeTargetModelName} : ${label}\n`;
                        } else {
                            mermaidContent += `    ${safeModelName} }|--|| ${safeTargetModelName} : ${label}\n`;
                        }
                    }
                }
            }
        }
    }

    // .mmd ファイルとしてMermaidの定義を保存（デバッグ・外部ツール用）
    try {
        fs.writeFileSync('db_er.mmd', 'erDiagram\n' + mermaidContent);
        console.log(`Mermaid definition generated at ${path.resolve('db_er.mmd')}`);
    } catch (err) {
        console.error('Error writing db_er.mmd:', err);
    }

    html += mermaidContent;

    html += `    </div>
    </body></html>`;
    return html;
}


const models = parsePrismaSchema(PRISMA_SCHEMA_PATH);

// ER図とテーブル一覧を別々に出力
const erHtml = generateERHtml(models);
fs.writeFileSync('db_er.html', erHtml, 'utf-8');
console.log(`ER Diagram generated at ${path.resolve('db_er.html')}`);

const tableHtml = generateTableHtml(models);
fs.writeFileSync('db_tables.html', tableHtml, 'utf-8');
console.log(`Table List generated at ${path.resolve('db_tables.html')}`);
