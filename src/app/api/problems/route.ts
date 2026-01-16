// /app/api/problems/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getAppSession } from '@/lib/auth';
import { programmingProblemSchema } from '@/lib/validations';

const prisma = new PrismaClient();

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

    if (body.id) {
      delete body.id;
    }

    // --- 手順3: バリデーション ---
    const validationResult = programmingProblemSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: '入力データが無効です', details: validationResult.error.flatten() }, { status: 400 });
    }

    const {
      title,
      description,
      problemType,
      difficulty,
      timeLimit,
      category,
      topic,
      tags,
      codeTemplate,
      isPublic,
      allowTestCaseView,
      isDraft,
      sampleCases,
      testCases
    } = validationResult.data;

    // ★★★ 修正の核心: データベースに渡すデータを明示的に構築（ホワイトリスト方式） ★★★
    const dataToCreate: Prisma.ProgrammingProblemCreateInput = {
      title,
      problemType,
      difficulty,
      timeLimit,
      category: category || '',
      topic: topic || '',
      tags: JSON.stringify(tags || []),
      description,
      codeTemplate: codeTemplate || '',
      isPublic: Boolean(isPublic),
      allowTestCaseView: Boolean(allowTestCaseView),
      isDraft: Boolean(isDraft),
      isPublished: !Boolean(isDraft),
      creator: {
        connect: {
          id: userId,
        },
      },
      // ネストされたデータも、必要なプロパティだけを選んで新しいオブジェクトを作成
      sampleCases: {
        create: (sampleCases || []).map((sc: any) => ({
          input: sc.input,
          expectedOutput: sc.expectedOutput,
          description: sc.description || '',
          order: sc.order,
        }))
      },
      testCases: {
        create: (testCases || []).map((tc: any) => ({
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const isDraftParam = searchParams.get('isDraft'); // Restore this line

    // --- Improved Access Control ---
    const session = await getAppSession();
    const userId = session?.user?.id;

    // Default: Show only Public & Published problems
    let whereClause: Prisma.ProgrammingProblemWhereInput = {
      isPublic: true,
      isPublished: true,
    };

    if (isDraftParam !== null) {
      // If requesting drafts, user MUST be authenticated
      if (!userId) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
      }
      // AND user can only see THEIR OWN drafts (or all if admin - assuming owner here for safety)
      whereClause = {
        isDraft: isDraftParam === 'true',
        createdBy: userId // Restrict to own drafts
      };
    }

    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const problems = await prisma.programmingProblem.findMany({
      where: whereClause,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        creator: {
          select: {
            username: true,
          }
        }
      }
    });

    return NextResponse.json({ success: true, problems });
  } catch (error) {
    return NextResponse.json({ error: '問題の取得に失敗しました' }, { status: 500 });
  }
}
