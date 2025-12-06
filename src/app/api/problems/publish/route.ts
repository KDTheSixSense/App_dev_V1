// /app/api/problems/publish/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client'; // Prismaのエラー型をインポート

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // サーバー側で受け取ったデータをログに出力して確認
    // console.log('✅ [API] Request body received:', JSON.stringify(body, null, 2));

    // --- データ検証（例） ---
    if (!body.title || typeof body.title !== 'string') {
      throw new Error('Title is missing or has an invalid type.');
    }
    if (typeof body.difficulty !== 'number' || isNaN(body.difficulty)) {
      throw new Error('Difficulty must be a valid number.');
    }
    // 必要に応じて他のフィールドの検証も追加

    const newProblem = await prisma.programmingProblem.create({
      data: {
        // フロントエンドから送られてきたデータをそのまま使用
        title: body.title,
        problemType: body.problemType,
        difficulty: body.difficulty,
        timeLimit: body.timeLimit,
        category: body.category,
        topic: body.topic,
        tags: body.tags, // フロントエンドでJSON.stringify()された文字列を期待
        description: body.description,
        codeTemplate: body.codeTemplate,
        isPublic: body.isPublic,
        allowTestCaseView: body.allowTestCaseView,
        isDraft: false,
        isPublished: true,
      },
    });

    // console.log('✅ [API] Problem created successfully with ID:', newProblem.id);

    return NextResponse.json({
      message: '問題が正常に公開されました！',
      id: newProblem.id
    }, { status: 201 }); // 成功時は 201 Created を返すのが一般的

  } catch (error: unknown) {
    console.error('❌ [API] An error occurred during problem creation:');

    // Prismaに起因するエラーかチェック
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Code:', error.code);
      console.error('Prisma Error Meta:', error.meta);
      return NextResponse.json({
        message: 'データベースエラーが発生しました。',
        error: `Prisma Error: ${error.code}`
      }, { status: 400 });
    }

    // その他のエラーを処理
    if (error instanceof Error) {
      console.error('Generic Error:', error.message);
      console.error('Stack Trace:', error.stack);
      return NextResponse.json({
        message: '問題の公開に失敗しました',
        error: error.message
      }, { status: 500 });
    }

    // 未知のエラー
    console.error('Unknown Error:', error);
    return NextResponse.json({
      message: '予期せぬエラーが発生しました。',
      error: 'An unknown error occurred'
    }, { status: 500 });

  } finally {
    // 処理の最後に必ず接続を閉じる
    await prisma.$disconnect();
    // console.log('🔌 [API] Database connection closed.');
  }
}
