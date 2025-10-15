"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
// OpenAI APIのエンドポイント
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
// ... (hintTemplateの定義は変更なし) ...
const hintTemplate = `ふむふむ、「{{question}}」で悩んでいるっていうことですね！
ボクから2つのヒントをお伝えします！！

1. まずは「{{hint1}}」について調べてみると、何か発見があるかもしれません。
2. 次に、「{{hint2}}」がどのように関係しているか考えてみるのがいいです。

これで少し分かるようになってくるはず、頑張ってください！`;
async function POST(req) {
    try {
        const { question, context } = await req.json();
        // --- AIへの指示（プロンプト）を作成 ---
        const persona = "あなたは、300年の経験を持つ非常に親切な伝説のソフトウェアエンジニアです。話し方は「〜です」「〜かもです」といった、可愛らしい丁寧な男の娘のような口調です。";
        const instruction = `以下の質問に対して、初心者が自分で答えにたどり着けるように、直接的な答えは絶対に言わず、3つの重要なキーワードや考え方をJSON形式で返してください。JSONのキーは "hint1", "hint2", "hint3" としてください。`;
        const fullPrompt = `
      ${persona}

      # 前提情報
      ユーザーは以下のプログラミング問題に取り組んでいます。
      ## 問題タイトル
      ${context.problemTitle}
      ## 問題文
      ${context.problemDescription}
      ## ユーザーが書いたコード
      \`\`\`
      ${context.userCode}
      \`\`\`

      # ユーザーからの質問
      「${question}」

      # あなたへの指示
      ${instruction}
    `;
        // OpenAI APIに送信するデータ形式
        const payload = {
            // ★★★ ここでモデルを指定します ★★★
            // "gpt-4.0" という名前ではなく、"gpt-4o" や "gpt-4-turbo" を使います。
            // "gpt-4o" は最新・最速・最も賢いモデルです。
            model: "gpt-4o",
            response_format: { "type": "json_object" },
            messages: [
                {
                    role: "user",
                    content: fullPrompt
                }
            ]
        };
        // OpenAI APIを呼び出す
        const res = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            console.error("OpenAI API Error:", await res.text());
            throw new Error('AIからの応答取得に失敗しました。');
        }
        const data = await res.json();
        // 受け取ったJSONでテンプレートを穴埋め
        const aiResponseJson = JSON.parse(data.choices[0].message.content);
        let finalHint = hintTemplate
            .replace('{{question}}', question)
            .replace('{{hint1}}', aiResponseJson.hint1)
            .replace('{{hint2}}', aiResponseJson.hint2);
        // フロントエンドに完成したヒントを返す
        return server_1.NextResponse.json({ hint: finalHint });
    }
    catch (error) {
        console.error(error);
        return server_1.NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
    }
}
