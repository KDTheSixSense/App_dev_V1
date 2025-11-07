import { NextResponse } from 'next/server';

// OpenAI APIのエンドポイント
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// --- ヒントのテンプレート ---
// ユーザーに表示する最終的なヒントの形式を定義します。
const hintTemplate = `ふむふむ、「{{question}}」で悩んでいるのですね！
ボクから3つのヒントをお伝えします！

1. まずは「{{hint1}}」について調べてみると、何か発見があるかもしれません。
2. 次に、「{{hint2}}」がどのように関係しているか考えてみるのがいいでしょう。
3. 最後に、「{{hint3}}」の観点からコードを見直すと、解決の糸口が見えるかもです。

これで少し分かるようになってくるはずです。頑張ってください！`;


export async function POST(req: Request) {
  try {
    const { question, context } = await req.json();

    // --- AIへの指示（プロンプト）を作成 ---
    // より構造化され、AIが役割を理解しやすくなりました。
    const systemPrompt = `
# 役割
あなたは、300年の経験を持つ非常に親切で伝説的なソフトウェアエンジニアです。
ユーザーがプログラミングの問題を自力で解決できるよう、教育的で的確なヒントを与えるのがあなたの仕事です。

# 口調
「〜です」「〜かもです」といった、可愛らしく丁寧な男の娘のような口調で話します。

# タスク
ユーザーからの質問と提供されたコンテキスト（問題タイトル、問題文、ユーザーのコード）を深く理解し、以下の思考プロセスに従って回答を生成してください。

## 思考プロセス
1.  まず、ユーザーのコード全体を注意深く読み、どこで問題が発生している可能性があるか、またはユーザーが何を理解していないかを分析します。
2.  次に、分析結果に基づき、ユーザーが自力で解決にたどり着けるようなヒントを3つ考案します。
3.  これらのヒントは、直接的な答えやコードの断片を含んではいけません。あくまで考え方や次に調べるべきキーワードを示唆するものとします。
4.  最後に、考案した3つのヒントを "hint1", "hint2", "hint3" というキーを持つJSONオブジェクトとして出力します。思考プロセス自体は出力に含めないでください。

# 出力形式
- 出力は必ずJSONオブジェクト形式とします。
- JSONオブジェクトには "hint1", "hint2", "hint3" の3つのキーが含まれている必要があります。
- 各キーの値は、ユーザーへのヒントとなる文字列です。
`;

    const userPrompt = `
# 良いヒントの生成例
## 例1
### ユーザーからの質問
「変数のスコープがよくわかりません。」
### あなたが生成すべきJSON
{
  "hint1": "グローバル変数とローカル変数の違い",
  "hint2": "関数の中で宣言された変数が、関数の外からアクセスできない理由",
  "hint3": "JavaScriptの巻き上げ（Hoisting）という概念"
}
## 例2
### ユーザーからの質問
「配列の各要素を2倍にする方法がわかりません。」
### あなたが生成すべきJSON
{
  "hint1": "forループの代わりに使える、配列用の便利なメソッド",
  "hint2": "map()メソッドの使い方と、コールバック関数が受け取る引数",
  "hint3": "アロー関数式を使った、より短いコールバック関数の書き方"
}

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
上記の内容をすべて踏まえ、ユーザーへのヒントをJSON形式で生成してください。
`;

    // OpenAI APIに送信するデータ形式
    const payload = {
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { "type": "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
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
    
    // AIからの応答を安全に処理
    let aiResponseJson;
    try {
      const messageContent = data.choices?.[0]?.message?.content;
      if (!messageContent) {
        throw new Error("AIの応答にメッセージコンテンツが含まれていません。");
      }
      aiResponseJson = JSON.parse(messageContent);
    } catch (e) {
      console.error("AIの応答のJSONパースに失敗しました:", e);
      throw new Error("AIからの応答形式が不正です。");
    }

    // 受け取ったJSONでテンプレートを穴埋め
    const finalHint = hintTemplate
      .replace('{{question}}', question)
      .replace('{{hint1}}', aiResponseJson.hint1 || "ヒント1の取得に失敗しました")
      .replace('{{hint2}}', aiResponseJson.hint2 || "ヒント2の取得に失敗しました")
      .replace('{{hint3}}', aiResponseJson.hint3 || "ヒント3の取得に失敗しました");

    // フロントエンドに完成したヒントを返す
    return NextResponse.json({ hint: finalHint });

  } catch (error) {
    console.error(error);
    // エラー内容をもう少し具体的に返す
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}