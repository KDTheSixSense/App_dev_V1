// /app/api/groups/[hashedId]/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client'; // Prismaの型をインポート

interface SessionData {
  user?: { id: number; email: string };
}

// 課題一覧を取得 (GET)
export async function GET(req: NextRequest, { params }: { params: { hashedId: string } }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }

    const hashedId = params.hashedId;

    if (!hashedId) {
        return NextResponse.json({ success: false, message: 'Invalid group ID format.' }, { status: 400 });
    }

    try {
      const group = await prisma.groups.findUnique({
        where: { hashedId },
        select: {
          id: true,
          hashedId: true,
          groupname: true,
          body: true,
          invite_code: true, 
          _count: {
              select: { groups_User: true }
          }
        }
      });

    if (!group) {
      return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
    }

    const formattedGroup = {
      id: group.id,
      hashedId: group.hashedId,
      name: group.groupname,
      description: group.body,
      memberCount: group._count.groups_User,
      invite_code: group.invite_code, // ★ 招待コードをレスポンスに含める
    };
      
    const assignments = await prisma.assignment.findMany({
      where: { groupid: group.id },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error('課題取得エラー:', error);
    return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// 課題を作成 (POST)
export async function POST(req: NextRequest, { params }: { params: { hashedId: string } }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const sessionUserId = session.user?.id;

  if (!sessionUserId) {
    return NextResponse.json({ success: false, message: '認証されていません' }, { status: 401 });
  }
  
  const userId = Number(sessionUserId);

  try {
        const { hashedId } = params; // Next.js 13 App Routerの正しい書き方
        const body = await req.json();
        
        // selectProblemIdも受け取るようにする
        const { title, description, dueDate, programmingProblemId, selectProblemId } = body;

        if (!title || !description || !dueDate) {
            return NextResponse.json({ success: false, message: '必須項目が不足しています' }, { status: 400 });
        }

        const group = await prisma.groups.findUnique({
            where: { hashedId: hashedId },
            select: { id: true },
        });

        if (!group) {
            return NextResponse.json({ success: false, message: 'グループが見つかりません' }, { status: 404 });
        }

        // ユーザーが管理者かどうかのチェックを簡略化
        const membership = await prisma.groups_User.findFirst({
            where: {
                group_id: group.id,
                user_id: userId,
                admin_flg: true,
            },
        });

        if (!membership) {
            return NextResponse.json({ success: false, message: 'この操作を行う権限がありません' }, { status: 403 });
        }
        
        // Prismaに渡すデータオブジェクトを構築
        const dataToCreate: any = {
            title,
            description,
            due_date: new Date(dueDate),
            groupid: group.id, // groupidを直接指定
        };

        // programmingProblemIdがあれば、それを設定
        if (programmingProblemId) {
            dataToCreate.programmingProblemId = Number(programmingProblemId);
        // selectProblemIdがあれば、それを設定
        } else if (selectProblemId) {
            dataToCreate.selectProblemId = Number(selectProblemId);
        }

        const newAssignment = await prisma.assignment.create({
            data: dataToCreate,
        });

          // 1. 課題が割り当てられるべきメンバー（管理者以外）を取得します
          const membersToAssign = await prisma.groups_User.findMany({
            where: {
              group_id: group.id,
              admin_flg: false, // 管理者ではないユーザー
            },
            select: {
              user_id: true,
            },
          });
        
          // 2. メンバーが存在する場合、各メンバーの「提出状況」レコードを作成します
          if (membersToAssign.length > 0) {
            const submissionsData = membersToAssign.map(member => ({
              assignment_id: newAssignment.id,
              userid: member.user_id,
              status: '未提出', // 初期ステータスを「未提出」に設定
              description: '',   // 提出時に解答内容などを保存するためのフィールド。初期値は空文字。
              codingid: 0,       // 提出されたコードIDなどを保存するフィールド。初期値は0など。
          }));
        
          // 3. Submissionsテーブルに複数レコードを一括で作成します
          await prisma.submissions.createMany({
            data: submissionsData,
          });
          console.log(`✅ ${membersToAssign.length}人のメンバーに課題 (ID: ${newAssignment.id}) を配布しました。`);
        }

        return NextResponse.json({ success: true, data: newAssignment }, { status: 201 });

    } catch (error) {
        console.error('課題作成エラー:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             return NextResponse.json({ success: false, message: `データベースエラー: ${error.message}` }, { status: 500 });
        }
        return NextResponse.json({ success: false, message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}