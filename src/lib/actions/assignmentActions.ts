import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

export async function submitAssignment(
  userId: number,
  assignmentId: string,
  formData: FormData
): Promise<{ success: true; message: string } | { success: false; message: string; status: number }> {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, message: 'ファイルがアップロードされていません。', status: 400 };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const newFilename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const savePath = path.join(UPLOAD_DIR, newFilename);
    await fs.writeFile(savePath, buffer);

    const filePath = path.join('/uploads', newFilename);

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
        description: 'ファイルが再提出されました。',
        codingid: 0,
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

    return { success: true, message: '課題を提出しました！' };
  } catch (error) {
    console.error('課題提出エラー:', error);
    return { success: false, message: 'サーバーエラーが発生しました。', status: 500 };
  }
}
