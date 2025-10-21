// /app/api/groups/[hashedId]/assignments/programming/route.ts
// The file path should be /app/api/groups/[hashedId]/assignments/programming/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

interface SessionData {
  user?: { id: number | string; email: string };
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }
  const userId = Number(sessionUserId);

  try {
    // const { hashedId } = req.params as { hashedId: string };
    const body = await req.json();
    // フロントエンドから送られてくるデータ構造に合わせて修正
    const { assignmentTitle, assignmentDescription, dueDate, problemData, groupId } = body;

    // 必須項目のバリデーション
    if (!assignmentTitle || !dueDate || !problemData || !groupId) {
      return NextResponse.json({ success: false, message: '必須項目が不足しています。' }, { status: 400 });
    }

    const newAssignment = await prisma.$transaction(async (tx) => {
      // グループの存在と管理者の権限をチェック
      const group = await tx.groups.findUnique({ where: { id: Number(groupId) } });
      if (!group) {
        throw new Error('グループが見つかりません');
      }

      const membership = await tx.groups_User.findFirst({
        where: {
          group_id: group.id,
          user_id: userId,
          admin_flg: true,
        },
      });

      if (!membership) {
        throw new Error('この操作を行う権限がありません');
      }

      // 1. プログラミング問題を作成
      const newProblem = await tx.programmingProblem.create({
        data: {
          title: problemData.title,
          description: problemData.description,
          difficulty: problemData.difficulty,
          timeLimit: problemData.timeLimit,
          tags: problemData.tags, // JSON文字列になっていることを確認
          createdBy: userId,
          isPublic: false, // グループ課題なので非公開に設定
          sampleCases: {
            create: problemData.sampleCases.map((c: any) => ({
              input: c.input,
              expectedOutput: c.expectedOutput,
              description: c.description,
            })),
          },
          testCases: {
            create: problemData.testCases.map((c: any) => ({
              name: c.name,
              input: c.input,
              expectedOutput: c.expectedOutput,
              description: c.description,
            })),
          },
        },
      });

      // 2. 課題を作成し、プログラミング問題と紐付ける
      const createdAssignment = await tx.assignment.create({
        data: {
          title: assignmentTitle,
          description: assignmentDescription,
          due_date: new Date(dueDate), // due_dateをDateオブジェクトに変換
          group: { connect: { id: group.id } },
          programmingProblem: { connect: { id: newProblem.id } }, // 作成した問題に接続
        },
      });

      // グループの全メンバーを取得
      const members = await tx.groups_User.findMany({
        where: { group_id: group.id },
        select: { user_id: true },
      });

      // 全メンバーに対して「未提出」の提出レコードを作成
      const submissionData = members.map(member => ({
        assignment_id: createdAssignment.id,
        userid: member.user_id,
        status: '未提出',
        description: '', // 初期値は空
        codingid: 0,     // 初期値は0
      }));

      if (submissionData.length > 0) {
        await tx.submissions.createMany({
          data: submissionData,
        });
      }

      return createdAssignment;
    });

    return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });
  } catch (error) {
    console.error('プログラミング課題作成APIエラー:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      if (error.message === 'グループが見つかりません') {
        return NextResponse.json({ success: false, message: error.message }, { status: 404 });
      }
      if (error.message === 'この操作を行う権限がありません') {
        return NextResponse.json({ success: false, message: error.message }, { status: 403 });
      }
    }
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}