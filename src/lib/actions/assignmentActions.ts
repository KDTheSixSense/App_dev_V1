import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

export async function submitAssignment(
  userId: string,
  assignmentId: string,
  formData: FormData
): Promise<{ success: true; message: string } | { success: false; message: string; status: number }> {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, message: 'ファイルがアップロードされていません。', status: 400 };
    }

    const ALLOWED_EXTENSIONS = ['.pdf', '.zip', '.rar', '.7z', '.txt', '.md', '.c', '.cpp', '.h', '.hpp', '.py', '.java', '.js', '.ts', '.rb', '.go', '.rs', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.name).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { success: false, message: '許可されていないファイル形式です。(pdf, zip, txt, ソースコード, 画像のみ)', status: 400 };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Sanitize filename: remove bad chars, stick to alphanumeric + _ -
    const safeBasename = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const newFilename = `${Date.now()}-${safeBasename}${ext}`;
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
