import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getAppSession } from "@/lib/auth";
import { z } from "zod";

// --- Constants ---
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const RATE_LIMIT_COUNT = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const HINT_TEMPLATE = `「{{question}}」についてですね！
解決のヒントを3つお伝えします。

1. まずは「{{hint1}}」について調べてみましょう。
2. 次に、「{{hint2}}」がどのように関係しているか考えてみてください。
3. 最後に、「{{hint3}}」の観点からコードを見直すと、解決の糸口が見つかるかもしれません。

これらのヒントが問題解決の一助となれば幸いです。頑張ってください！`;

// --- Validation with Zod ---
const requestSchema = z.object({
  question: z.string().trim().min(1, "質問を入力してください。").max(200, "質問は200文字以下にしてください。"),
  context: z.object({
    problemTitle: z.string().optional(),
    problemDescription: z.string().optional(),
    userCode: z.string().max(10000, "コードが長すぎます。").optional(),
    answerOptions: z.string().optional(),
    correctAnswer: z.string().optional(),
    explanation: z.string().optional(),
    problemType: z.string().optional(),
  }).optional(),
});

type RequestData = z.infer<typeof requestSchema>;

/**
 * AIヒント生成API
 * 
 * ユーザーの質問とコンテキスト（コードや問題情報）を受け取り、
 * OpenAI APIを使用して解決のヒントを生成します。
 * レート制限機能付きです。
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();

    // 1. Input Validation
    const parseResult = requestSchema.safeParse(json);
    if (!parseResult.success) {
      // Return the first error message
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }
    const { question, context } = parseResult.data;

    // 2. Authentication Check
    const session = await getAppSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }
    const userId = session.user.id;

    // 3. Rate Limiting (Log then Count)
    await logAttempt(userId, question, context);
    const isRateLimited = await checkRateLimit(userId);

    if (isRateLimited) {
      return NextResponse.json({ error: 'ヒント生成の回数制限を超えました。少し時間を置いてから再試行してください。' }, { status: 429 });
    }

    // 4. Generate Hint via AI
    const hint = await generateHintCall(question, context);

    return NextResponse.json({ hint });

  } catch (error) {
    console.error("Generate Hint Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// --- Helper Functions ---

async function logAttempt(userId: string, question: string, context?: RequestData['context']) {
  const detailsPayload = {
    question,
    context: {
      problemTitle: context?.problemTitle,
      problemType: context?.problemType,
    },
  };

  await prisma.auditLog.create({
    data: {
      userId: userId,
      action: 'GENERATE_HINT',
      details: JSON.stringify(detailsPayload), // JSONとして保存
      ipAddress: 'unknown', // TODO: middlewareなどから取得
      createdAt: new Date(),
    },
  });
}

async function checkRateLimit(userId: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentHints = await prisma.auditLog.count({
    where: {
      userId: userId,
      action: 'GENERATE_HINT',
      createdAt: { gte: windowStart }
    }
  });
  return recentHints > RATE_LIMIT_COUNT;
}

async function generateHintCall(question: string, context?: RequestData['context']): Promise<string> {
  const systemPrompt = `
# 役割
あなたは、300年の経験を持つ非常に親切で伝説的なソフトウェアエンジニアです。
ユーザーがプログラミングの問題を自力で解決できるよう、教育的で的確なヒントを与えるのがあなたの仕事です。

# 口調
丁寧で、かつ親しみやすい口調で話します。

# タスク
ユーザーからの質問とコンテキストを深く理解し、解決のためのヒントを生成してください。
直接的な答えは避け、"考え方"や"着眼点"を提供してください。
`;

  const userPrompt = `
# コンテキスト
- 問題タイトル: ${context?.problemTitle || "不明"}
- 問題タイプ: ${context?.problemType || "不明"}

# ユーザーコード
\`\`\`
${context?.userCode || ""}
\`\`\`

# ユーザーからの質問
"""
${question.replace(/"/g, '\\"')}
"""

上記の質問に対し、コンテキストを踏まえたヒントを JSON形式 {"hint1": "...", "hint2": "...", "hint3": "..."} で生成してください。
`;

  const payload = {
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { "type": "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("OpenAI API Error Details:", errText);
    throw new Error('AIからの応答取得に失敗しました。');
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AIからの応答形式が不正です。");

  let jsonResult;
  try {
    jsonResult = JSON.parse(content);
  } catch (e) {
    throw new Error("AIの応答がJSONではありません。");
  }

  if (jsonResult.hint) return jsonResult.hint;
  if (jsonResult.hint1) {
    return HINT_TEMPLATE
      .replace('{{question}}', question)
      .replace('{{hint1}}', jsonResult.hint1 || "...")
      .replace('{{hint2}}', jsonResult.hint2 || "...")
      .replace('{{hint3}}', jsonResult.hint3 || "...");
  }

  throw new Error("AIの応答に必要なデータが含まれていません。");
}