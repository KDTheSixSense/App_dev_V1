import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getAppSession } from "@/lib/auth"; // セッション取得用

// OpenAI APIのエンドポイント
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const hintTemplate = `「{{question}}」についてですね！
解決のヒントを3つお伝えします。

1. まずは「{{hint1}}」について調べてみましょう。
2. 次に、「{{hint2}}」がどのように関係しているか考えてみてください。
3. 最後に、「{{hint3}}」の観点からコードを見直すと、解決の糸口が見つかるかもしれません。

これらのヒントが問題解決の一助となれば幸いです。頑張ってください！`;


export async function POST(req: Request) {
  try {
    const { question, context } = await req.json();

    // --- 0. 認証とレート制限 ---
    const session = await getAppSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }
    const userId = session.user.id;

    // レート制限: 過去1分間に5回以上の生成を禁止
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentHints = await prisma.auditLog.count({
      where: {
        userId: userId,
        action: 'GENERATE_HINT',
        createdAt: { gte: oneMinuteAgo }
      }
    });

    if (recentHints >= 5) {
      return NextResponse.json({ error: 'ヒント生成の回数制限を超えました。少し時間を置いてから再試行してください。' }, { status: 429 });
    }

    // ログを記録
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'GENERATE_HINT',
        details: `Question: ${question.substring(0, 50)}...`,
        ipAddress: 'unknown' // 必要であれば取得
      }
    });

    // --- AIへの指示（プロンプト）を作成 ---
    // より構造化され、AIが役割を理解しやすくなりました。
    const systemPrompt = `
# 役割
あなたは、300年の経験を持つ非常に親切で伝説的なソフトウェアエンジニアです。
ユーザーがプログラミングの問題を自力で解決できるよう、教育的で的確なヒントを与えるのがあなたの仕事です。

# 口調
丁寧で、かつ親しみやすい口調で話します。

# タスク
ユーザーからの質問と提供されたコンテキスト（問題タイトル、問題文、ユーザーのコード、問題タイプ）を深く理解し、教育的で的確なヒントを生成してください。

## 思考プロセス
1.  ユーザーからの質問と提供されたコンテキスト（問題タイトル、問題文、ユーザーのコード、問題タイプ）を深く理解します。
2.  **問題タイプに応じたヒント生成の調整:**
    -   **問題タイプが 'STATIC_QA' の場合（基本情報技術者試験の知識問題など、プログラミングコードが直接関係しない問題）:**
        -   ユーザーの質問が問題文や解説の内容に関連しているかを重視します。
        -   プログラミングコードは直接的なヒント生成には使用せず、問題の背景知識としてのみ考慮します。
        -   ヒントは、問題文の理解、選択肢の分析、関連する概念知識に焦点を当てて生成します。
        -   プログラミングコードに関する質問が来た場合は、「この問題はプログラミングの知識ではなく、〇〇（関連する概念）の理解を問うものです。問題文や解説をもう一度確認してみましょう。」のように、問題タイプに合わせた回答を生成します。
    -   **問題タイプが 'STATIC_QA' 以外の場合（プログラミング問題）:**
        -   ユーザーの質問がプログラミングコードやその実行ロジックに関連しているかを重視します。
        -   ユーザーのコード全体を注意深く読み、どこで問題が発生している可能性があるか、またはユーザーが何を理解していないかを分析します。
        -   ヒントは、コードの構造、アルゴリズム、変数の動き、デバッグの観点に焦点を当てて生成します。

3.  **質問の関連性に応じたヒント生成:**
    -   質問が直接問題に関連する場合：問題解決に役立つ具体的なヒントを3つ考案します。
    -   質問がプログラミング全般に関連するが、現在の問題とは直接関係しない場合：一般的なプログラミング知識として、可能な限り問題の文脈に沿った形でヒントを提供します。
    -   質問がプログラミングや現在の問題と全く関係ない場合：その旨を丁寧に伝え、現在のプログラミング問題に焦点を戻すよう促すメッセージを生成します。

4.  ヒントは、直接的な答えやコードの断片を含んではいけません。あくまで考え方や次に調べるべきキーワードを示唆するものとします。
5.  最後に、考案したヒントを "hint1", "hint2", "hint3" というキーを持つJSONオブジェクトとして出力します。思考プロセス自体は出力に含めないでください。

# 出力形式
- 出力は必ずJSONオブジェクト形式とします。
    - 質問がこの問題と全く関係ない場合は、\`{\"hint\": \"ごめんなさい、その質問は現在の問題とは関係がないようです。問題解決に役立つ質問をしてくださいね！\"}\` の形式で出力します。
- それ以外の場合は、"hint1", "hint2", "hint3" の3つのキーが含まれている必要があります。
- 各キーの値は、ユーザーへのヒントとなる文字列です。
- また、1. まずは「{{hint1}}」について調べてみましょう。
- 2. 次に、「{{hint2}}」がどのように関係しているか考えてみてください。
- 3. 最後に、「{{hint3}}」の観点からコードを見直すと、解決の糸口が見つかるかもしれません。
のテンプレートで出力するので、これに合わせた出力にしてください。
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
## 選択肢
${context.answerOptions}
## 正解
${context.correctAnswer}
## 解説
${context.explanation}
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

    let finalHint: string;
    if (aiResponseJson.hint) {
      // 単一のヒントが返された場合
      finalHint = aiResponseJson.hint;
    } else if (aiResponseJson.hint1 && aiResponseJson.hint2 && aiResponseJson.hint3) {
      // 3つのヒントが返された場合、テンプレートを適用
      finalHint = hintTemplate
        .replace('{{question}}', question)
        .replace('{{hint1}}', aiResponseJson.hint1 || "ヒント1の取得に失敗しました")
        .replace('{{hint2}}', aiResponseJson.hint2 || "ヒント2の取得に失敗しました")
        .replace('{{hint3}}', aiResponseJson.hint3 || "ヒント3の取得に失敗しました");
    } else {
      throw new Error("AIからの応答形式が不正です。期待されるヒントの形式ではありません。");
    }

    // フロントエンドに完成したヒントを返す
    return NextResponse.json({ hint: finalHint });

  } catch (error) {
    console.error(error);
    // エラー内容をもう少し具体的に返す
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}