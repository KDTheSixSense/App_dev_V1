// /app/api/problems/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient();

// グローバルオブジェクトにPrismaClientの型を拡張
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 問題一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const isPublic = searchParams.get('isPublic')
    const isDraft = searchParams.get('isDraft')

    const skip = (page - 1) * limit

    const where: any = {}
    if (category) where.category = category
    if (isPublic !== null) where.isPublic = isPublic === 'true'
    if (isDraft !== null) where.isDraft = isDraft === 'true'

    const [problems, total] = await Promise.all([
      // ★ 修正: prisma.problem -> prisma.programmingProblem
      prisma.programmingProblem.findMany({
        where,
        skip,
        take: limit,
        include: {
          sampleCases: {
            orderBy: { order: 'asc' }
          },
          testCases: {
            orderBy: { order: 'asc' }
          },
          files: true,
        // userAnswersリレーションはProgrammingProblemモデルに存在しないためコメントアウト
          // _count: {
          //   select: {
          //     userAnswers: true
          //   }
          // }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // ★ 修正: prisma.problem -> prisma.programmingProblem
      prisma.programmingProblem.count({ where })
    ])

    return NextResponse.json({
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching problems:', error)
    return NextResponse.json(
      { error: 'Failed to fetch problems' },
      { status: 500 }
    )
  }
}

// 問題作成 (POST) - 改善版
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      problemType,
      difficulty,
      timeLimit,
      category,
      topic,
      tags, // JSON文字列として受け取る
      description,
      codeTemplate,
      isPublic,
      allowTestCaseView,
      isDraft = false,
      sampleCases = [],
      testCases = []
    } = body;

    // --- バリデーションを強化 ---
    if (!title || !description) {
      return NextResponse.json({ error: 'タイトルと問題文は必須です' }, { status: 400 });
    }
    const difficultyNum = parseInt(difficulty, 10);
    const timeLimitNum = parseInt(timeLimit, 10);
    if (isNaN(difficultyNum) || isNaN(timeLimitNum)) {
        return NextResponse.json({ error: '難易度または制限時間が無効な数値です' }, { status: 400 });
    }

    // --- データベースへの書き込み ---
    const problem = await prisma.programmingProblem.create({
      data: {
        title,
        problemType,
        difficulty: difficultyNum,
        timeLimit: timeLimitNum,
        category,
        topic,
        tags, // フロントでstringify済みなのでそのまま保存
        description,
        codeTemplate,
        isPublic: Boolean(isPublic),
        allowTestCaseView: Boolean(allowTestCaseView),
        isDraft: Boolean(isDraft),
        isPublished: !Boolean(isDraft),
        // 関連データのネストした作成
        sampleCases: {
          create: sampleCases.map((sc: any, index: number) => ({
            input: sc.input,
            expectedOutput: sc.expectedOutput,
            description: sc.description || '',
            order: index
          }))
        },
        testCases: {
          create: testCases.map((tc: any, index: number) => ({
            name: tc.name || `ケース${index + 1}`,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            description: tc.description || '',
            order: index
          }))
        }
      },
      include: {
        sampleCases: true,
        testCases: true,
      }
    });

    return NextResponse.json(problem, { status: 201 });

  } catch (error: unknown) {
    // --- エラーハンドリングを強化 ---
    console.error('❌ [API] Error creating problem:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Prismaが返す既知のエラー（制約違反など）
        console.error('Prisma Error Code:', error.code);
        return NextResponse.json({ error: `データベースエラー: ${error.code}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'サーバー内部で問題の作成に失敗しました' }, { status: 500 });
  }
}