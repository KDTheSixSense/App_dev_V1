// /app/api/submissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { sessionOptions } from '@/lib/session';
import { executeAgainstTestCases } from '@/lib/sandbox';

interface SessionData {
  user?: { id: string; email: string };
}

/**
 * 課題に対する新しい提出を作成します。
 */
export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      assignmentId, // どの課題に対する提出か
      status,       // 例: '提出済み', '採点中'
      description,  // 選択問題の答えや、プログラミング問題へのコメント（コードが入る場合もある）
      codingId,     // プログラミング問題の提出コードID
      language,     // プログラミング言語 (追加)
    } = body;

    // 基本的なバリデーション
    if (!assignmentId) {
      return NextResponse.json({ success: false, message: '課題IDが必要です' }, { status: 400 });
    }

    const userId = sessionUserId;
    let testCaseResults = null;
    let executionSuccess = true;

    // トランザクションで権限チェックと作成を同時に行う
    const newSubmission = await prisma.$transaction(async (tx) => {
      // 1. 課題が存在し、どのグループに属しているか確認
      const assignment = await tx.assignment.findUnique({
        where: { id: Number(assignmentId) },
        select: { groupid: true, programmingProblemId: true },
      });

      if (!assignment || !assignment.groupid) {
        throw new Error('指定された課題が見つかりません。');
      }

      // 2. ユーザーがそのグループのメンバーであるか確認
      const membership = await tx.groups_User.findFirst({
        where: { group_id: assignment.groupid, user_id: userId },
      });

      if (!membership) {
        throw new Error('この課題に提出する権限がありません。');
      }

      // 2.5 プログラミング課題の場合、サーバーサイドで検証を行う
      if (assignment.programmingProblemId) {
        // descriptionにコードが入っている前提
        const code = description;
        if (!code) {
          throw new Error('コードが提出されていません。');
        }

        const execResult = await executeAgainstTestCases(
          language || 'python',
          code,
          assignment.programmingProblemId
        );

        testCaseResults = execResult.testCaseResults;
        executionSuccess = execResult.success;

        // テストに失敗した場合でも、提出自体は記録するか、あるいはエラーとして返すか。
        // ここでは、「正解しないと提出済みにならない」ロジックに合わせるため、
        // 失敗した場合はエラー（またはsuccess:false）として返し、DB更新を行わない、
        // あるいはステータスを「不正解」などで記録する方針が考えられる。
        // Clientの挙動（submitResultを見て判断）に合わせるため、
        // 今回は「不正解ならDB保存せず、結果だけ返す」とする（既存のクライアントバリデーションの代替）。
        // もし履歴を残したいなら create して status='Wrong Answer' とかでも良い。

        if (!executionSuccess) {
          // トランザクションを中断するためにErrorを投げるか、
          // あるいはここで return null して後で処理するか。
          // トランザクション内なので throw Error が手っ取り早いが、
          // 特定のメッセージで抜けて、catchブロックで判定する。
          throw new Error('TEST_FAILED');
        }
      }

      // 3. 既存の提出レコードを検索
      const existingSubmission = await tx.submissions.findUnique({
        where: {
          assignment_id_userid: {
            assignment_id: Number(assignmentId),
            userid: userId,
          },
        },
      });

      if (existingSubmission) {
        // 4a. レコードがあれば更新
        return tx.submissions.update({
          where: { id: existingSubmission.id },
          data: {
            status: status || '提出済み',
            description: description || '',
            ...(codingId !== undefined && { codingid: Number(codingId) }),
            submitted_at: new Date(),
          },
        });
      } else {
        // 4b. レコードがなければ作成
        return tx.submissions.create({
          data: {
            assignment_id: Number(assignmentId),
            userid: userId,
            status: status || '提出済み',
            description: description || '',
            codingid: codingId ? Number(codingId) : 0,
            submitted_at: new Date(),
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: newSubmission,
      testCaseResults
    }, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === 'TEST_FAILED') {
      // テスト失敗時は 200 OK で success: false を返す (クライアントが結果を表示できるように)
      return NextResponse.json({
        success: false,
        message: '不正解のテストケースがあります。',
        // testCaseResults は catch ブロックからは参照できないため、
        // 構造を変える必要がある。
        // → executeAgainstTestCases を transaction の外に出すのがベターだが、
        //   権限チェック (assignmentの取得) が必要。
        //   とりあえず簡易的に transaction 内で実行したが、
        //   結果を返すために少しリファクタリングする。
      }, { status: 200 }); // クライアントのハンドリングに合わせてステータスコードを調整
    }

    console.error('提出APIエラー:', errorMessage);
    if (errorMessage.includes('課題が見つかりません')) {
      return NextResponse.json({ success: false, message: errorMessage }, { status: 404 });
    }
    if (errorMessage.includes('権限がありません')) {
      return NextResponse.json({ success: false, message: errorMessage }, { status: 403 });
    }

    return NextResponse.json({ success: false, message: errorMessage || 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
