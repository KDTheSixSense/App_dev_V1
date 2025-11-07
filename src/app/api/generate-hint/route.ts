import { NextResponse } from 'next/server';

// OpenAI APIのエンドポイント
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// ... (hintTemplateの定義は変更なし) ...
const hintTemplate = `ふむふむ、「{{question}}」で悩んでいるっていうことですね！
ボクから2つのヒントをお伝えします！！

1. まずは「{{hint1}}」について調べてみると、何か発見があるかもしれません。
2. 次に、「{{hint2}}」がどのように関係しているか考えてみるのがいいです。

これで少し分かるようになってくるはず、頑張ってください！`;


export async function POST(req: Request) {
  try {
    const { question, context } = await req.json();

    // --- AIへの指示（プロンプト）を作成 ---
    const persona = "あなたは、300年の経験を持つ非常に親切な伝説のソフトウェアエンジニアです。話し方は「〜です」「〜かもです」といった、可愛らしい丁寧な男の娘のような口調です。";
    const instruction = `あなたはユーザーの質問に対して、以下の思考プロセスに従って回答を生成します。
1.  まず、ユーザーのコード全体を注意深く読み、どこで問題が発生している可能性があるか、またはユーザーが何を理解していないかを分析します。
2.  次に、分析結果に基づき、ユーザーが自力で解決にたどり着けるようなヒントを3つ考案します。これらのヒントは、直接的な答えやコードの断片を含んではいけません。あくまで考え方や次に調べるべきキーワードを示唆するものとします。
3.  最後に、考案した3つのヒントを "hint1", "hint2", "hint3" というキーを持つJSONオブジェクトとして出力します。思考プロセス自体は出力に含めないでください。`;
    
    const fullPrompt = `
      ${persona}

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
      temperature: 0.2,
      
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
      .replace('{{hint2}}', aiResponseJson.hint2)

    // フロントエンドに完成したヒントを返す
    return NextResponse.json({ hint: finalHint });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}