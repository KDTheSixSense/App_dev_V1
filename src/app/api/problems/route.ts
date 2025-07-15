// /app/api/problems/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getAppSession } from '@/lib/auth';

const prisma = new PrismaClient();

// グローバルオブジェクトにPrismaClientの型を拡張
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * 問題一覧を取得するAPI (GET)
 */
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
          creator: {
            select: {
              id: true,
              username: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
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


/**
 * 新しい問題を作成するAPI (POST)
 */
export async function POST(request: NextRequest) {
  try {
    // --- 手順1: セッションを取得し、認証を行う ---
    const session = await getAppSession();
    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json({ error: '認証情報が見つかりません。再度ログインしてください。' }, { status: 401 });
    }

    // --- 手順2: リクエストのbodyを取得 ---
    const body = await request.json();

    // --- 手順3: バリデーション ---
    if (!body.title || !body.description) {
      return NextResponse.json({ error: 'タイトルと問題文は必須です' }, { status: 400 });
    }
    const difficultyNum = parseInt(body.difficulty, 10);
    const timeLimitNum = parseInt(body.timeLimit, 10);
    if (isNaN(difficultyNum) || isNaN(timeLimitNum)) {
      return NextResponse.json({ error: '難易度または制限時間が無効な数値です' }, { status: 400 });
    }

    // ★★★ 修正の核心: データベースに渡すデータを明示的に構築（ホワイトリスト方式） ★★★
    const dataToCreate: Prisma.ProgrammingProblemCreateInput = {
      title: body.title,
      problemType: body.problemType,
      difficulty: difficultyNum,
      timeLimit: timeLimitNum,
      category: body.category,
      topic: body.topic,
      tags: body.tags,
      description: body.description,
      codeTemplate: body.codeTemplate,
      isPublic: Boolean(body.isPublic),
      allowTestCaseView: Boolean(body.allowTestCaseView),
      isDraft: Boolean(body.isDraft),
      isPublished: !Boolean(body.isDraft),
      creator: {
        connect: {
          id: Number(userId),
        },
      },
      // ネストされたデータも、必要なプロパティだけを選んで新しいオブジェクトを作成
      sampleCases: {
        create: (body.sampleCases || []).map((sc: any) => ({
          input: sc.input,
          expectedOutput: sc.expectedOutput,
          description: sc.description || '',
          order: sc.order,
        }))
      },
      testCases: {
        create: (body.testCases || []).map((tc: any) => ({
          name: tc.name || 'ケース',
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          description: tc.description || '',
          order: tc.order,
        }))
      }
    };

    // --- 手順4: データベースに問題を保存 ---
    const problem = await prisma.programmingProblem.create({
      data: dataToCreate, // 安全に構築したデータのみを渡す
      include: {
        sampleCases: true,
        testCases: true,
        creator: true,
      }
    });

    return NextResponse.json(problem, { status: 201 });

  } catch (error: unknown) {
    console.error('❌ [API] Error creating problem:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Code:', error.code);
      if (error.code === 'P2002') {
        const target = (error.meta as any)?.target;
        return NextResponse.json({ error: `ユニーク制約違反です。対象: ${target}` }, { status: 400 });
      }
      return NextResponse.json({ error: `データベースエラー: ${error.code}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'サーバー内部で問題の作成に失敗しました' }, { status: 500 });
  }
}
