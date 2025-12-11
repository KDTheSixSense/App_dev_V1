import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/session.server'; // iron-sessionのセッション取得関数

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 1. セッションを確認し、ログイン中のユーザー情報を取得
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }

    // 1-2. 管理者権限のチェック (Reverted: 生徒でも作成可能にする)
    // admin check removed as per user request.

    // 2. リクエストボディから問題データを取得
    const body = await req.json();
    const {
      title,
      description,
      explanation,
      answerOptions,
      correctAnswer,
      language_id,
      subjectId,
      difficultyId,
    } = body;

    // 3. バリデーション
    if (!title || !description || !answerOptions || !correctAnswer) {
      return NextResponse.json({ message: '必須フィールドが不足しています' }, { status: 400 });
    }

    // 4. Prismaを使ってデータベースに新しい問題を作成
    const newQuestion = await prisma.questions_Algorithm.create({
      data: {
        title,
        description,
        explanation,
        answerOptions, // JSON文字列として受け取る
        correctAnswer,
        language_id,
        subjectId,
        difficultyId,
        // デフォルト値や固定値が必要なカラム
        initialVariable: {},
        logictype: 'MULTIPLE_CHOICE',
        options: {},
      },
    });

    // 5. 成功レスポンスを返す
    return NextResponse.json(newQuestion, { status: 201 });

  } catch (error) {
    console.error('Error creating question:', error);
    // エラーがPrisma関連か、それ以外かでメッセージを分けることも可能
    return NextResponse.json({ message: '問題の作成中にエラーが発生しました' }, { status: 500 });
  }
}