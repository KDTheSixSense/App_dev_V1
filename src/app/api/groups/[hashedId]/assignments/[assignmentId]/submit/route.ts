import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import type { Session } from 'next-auth';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';

const prisma = new PrismaClient();

// next-authのSession型を拡張してidを含める
interface CustomSession extends Session {
  user?: { id?: number | string; email: string };
}

// アップロードされたファイルを保存するディレクトリ
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

export async function POST(
  request: NextRequest,
  { params }: { params: { hashedId: string, assignmentId: string } }
) {
  // App Routerでは getIronSession をこのように使用します
  const session = await getIronSession<CustomSession>(await cookies(), sessionOptions);
  if (!session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = Number(session.user.id);

  const { assignmentId } = params;

  try {
    // アップロードディレクトリが存在しない場合は作成
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // NextRequestからFormDataを取得
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'ファイルがアップロードされていません。' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // ファイル名を一意にする (例: 1681363362095-original_filename.pdf)
    const newFilename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const savePath = path.join(UPLOAD_DIR, newFilename);
    await fs.writeFile(savePath, buffer);

    // publicディレクトリからの相対パスを生成
    const filePath = path.join('/uploads', newFilename);

    // データベースに提出記録を作成または更新
    await prisma.submissions.upsert({
      where: {
        assignment_id_userid: {
          assignment_id: Number(assignmentId),
          userid: userId,
        },
      },
      update: {
        status: '提出済み',
        file_path: filePath,
        description: 'ファイルが再提出されました。', // 説明を更新
        codingid: 0, // ファイル提出の場合、codingidは0などデフォルト値に
        submitted_at: new Date(),
      },
      create: {
        assignment_id: Number(assignmentId),
        userid: userId,
        status: '提出済み',
        description: 'ファイルが提出されました。',
        codingid: 0,
        file_path: filePath,
      },
    });

    return NextResponse.json({ success: true, message: '課題を提出しました！' });
  } catch (error) {
    console.error('課題提出エラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
