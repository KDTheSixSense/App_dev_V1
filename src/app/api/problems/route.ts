// /app/api/problems/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getAppSession } from '@/lib/auth';
import { programmingProblemSchema } from '@/lib/validations';

const prisma = new PrismaClient();

/**
 * プログラミング問題作成API
 * 
 * 新しいプログラミング問題を作成します。
 * テストケースやサンプルケースも含めて保存します。
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

/**
 * プログラミング問題一覧取得API
 * 
 * 公開されているプログラミング問題の一覧を取得します。
 * 下書き状態の問題は作成者本人のみが取得可能です。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const isDraftParam = searchParams.get('isDraft'); // Restore this line

    // --- Improved Access Control ---
    const session = await getAppSession();
    const userId = session?.user?.id;

    // Default: Show only Public & Published problems (base condition)
    let whereClause: Prisma.ProgrammingProblemWhereInput = {
      isPublished: true,
    };

    if (userId) {
      // If logged in: (Public) OR (Created by Accessing User)
      whereClause.OR = [
        { isPublic: true },
        { createdBy: userId }
      ];
    } else {
      // If not logged in: Public only
      whereClause.isPublic = true;
    }

    if (isDraftParam !== null) {
      const isDraftRequested = isDraftParam === 'true';

      if (isDraftRequested) {
        // If requesting DRAFTS:
        // User MUST be authenticated and can ONLY see their own drafts.
        if (!userId) {
          return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }
        whereClause = {
          isDraft: true,
          createdBy: userId
        };
      } else {
        // If requesting PUBLISHED (non-drafts):
        // Ensure we filter by isDraft: false
        whereClause.isDraft = false;

        // Note: The base `whereClause` constructed above already handles 
        // "Public OR CreatedByMe" visibility logic. 
        // e.g. 
        // whereClause = { isPublished: true, OR: [{isPublic:true}, {createdBy:me}] }
        // adding isDraft: false -> { isPublished: true, isDraft: false, OR: [...] }
        // This is correct. We do NOT want to overwrite it with { createdBy: userId }.
      }
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
