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

    // 1. 課題が存在し、どのグループに属しているか確認
    const assignment = await prisma.assignment.findUnique({
      where: { id: Number(assignmentId) },
      select: { groupid: true, programmingProblemId: true },
    });

    if (!assignment || !assignment.groupid) {
      return NextResponse.json({ success: false, message: '指定された課題が見つかりません。' }, { status: 404 });
    }

    // 2. ユーザーがそのグループのメンバーであるか確認
    const membership = await prisma.groups_User.findFirst({
      where: { group_id: assignment.groupid, user_id: userId },
    });

    if (!membership) {
      return NextResponse.json({ success: false, message: 'この課題に提出する権限がありません。' }, { status: 403 });
    }

    let testCaseResults = null;

    // 2.5 プログラミング課題の場合、サーバーサイドで検証を行う
    if (assignment.programmingProblemId) {
      // descriptionにコードが入っている前提
      const code = description;
      if (!code) {
        return NextResponse.json({ success: false, message: 'コードが提出されていません。' }, { status: 400 });
      }

      const execResult = await executeAgainstTestCases(
        language || 'python',
        code,
        assignment.programmingProblemId
      );

      testCaseResults = execResult.testCaseResults;
      const executionSuccess = execResult.success;

      // 不正解の場合はDB保存せず、結果だけ返す
      if (!executionSuccess) {
        return NextResponse.json({
          success: false,
          message: '不正解のテストケースがあります。',
          testCaseResults: testCaseResults,
        }, { status: 200 });
      }
    }

    // 3. DB更新 (正解した場合のみここに来る)
    const newSubmission = await prisma.$transaction(async (tx) => {
      // 既存の提出レコードを検索
      const existingSubmission = await tx.submissions.findUnique({
        where: {
          assignment_id_userid: {
            assignment_id: Number(assignmentId),
            userid: userId,
          },
        },
      });

      if (existingSubmission) {
        // 更新
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
        // 作成
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
    console.error('提出APIエラー:', errorMessage);
    return NextResponse.json({ success: false, message: errorMessage || 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
