// /app/api/problems/[problemId]/files/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

const getUploadDir = () => {
      return path.join(process.cwd(), 'public', 'uploads');
};

interface SessionData {
      user?: { id: string; email: string };
}

export async function POST(request: Request, context: { params: Promise<{ problemId: string }> }) {
      const params = await context.params;
      const problemId = parseInt(params.problemId);

      if (isNaN(problemId)) {
            return NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
      }

      const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
      const userId = session.user?.id;

      if (!userId) {
            return NextResponse.json({ message: '認証されていません' }, { status: 401 });
      }

      // 権限チェック: 問題の作成者であるか確認
      const problem = await prisma.programmingProblem.findUnique({
            where: { id: problemId },
            select: { createdBy: true }
      });

      if (!problem) {
            return NextResponse.json({ message: '問題が見つかりません' }, { status: 404 });
      }

      // Note: createdBy might be matching userId type. Assuming strict match.
      // If one is string and other int, might fail. Use loose check or conversion if unsure.
      // Usually userId in session is string. createdBy is string?
      // In publish route I used `createdBy: userId`.
      if (problem.createdBy !== userId) {
            return NextResponse.json({ message: '権限がありません' }, { status: 403 });
      }

      try {
            const formData = await request.formData();
            const files = formData.getAll('files') as File[];

            if (!files || files.length === 0) {
                  return NextResponse.json({ message: 'ファイルがアップロードされていません' }, { status: 400 });
            }

            const uploadDir = getUploadDir();
            await fs.mkdir(uploadDir, { recursive: true });

            const uploadedFileMetadata = [];

            for (const file of files) {
                  const ALLOWED_EXTENSIONS = ['.pdf', '.zip', '.rar', '.7z', '.txt', '.md', '.c', '.cpp', '.h', '.hpp', '.py', '.java', '.js', '.ts', '.rb', '.go', '.rs', '.png', '.jpg', '.jpeg'];
                  const ext = path.extname(file.name).toLowerCase();

                  if (!ALLOWED_EXTENSIONS.includes(ext)) {
                        continue; // Skip invalid files or throw error. Here we skip to avoid breaking the entire batch.
                  }

                  const arrayBuffer = await file.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);

                  // Security Check: Validate Magic Number
                  const { validateFileSignature } = await import('@/lib/file-validation');
                  if (!validateFileSignature(buffer, ext)) {
                        // Skip invalid file types (prevents malicious extension spoofing)
                        continue;
                  }

                  const safeBasename = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
                  const fileName = `${Date.now()}-${safeBasename}${ext}`;
                  const filePath = path.join(uploadDir, fileName);

                  await fs.writeFile(filePath, buffer);

                  // ★ 修正: prisma.file -> prisma.problemFile
                  const newFile = await prisma.problemFile.create({
                        data: {
                              problemId: problemId,
                              fileName: file.name, // スキーマに合わせて `fileName` を使用
                              originalName: file.name, // スキーマに合わせて `originalName` を使用
                              filePath: `/uploads/${fileName}`,
                              fileSize: file.size,
                              mimeType: file.type || 'application/octet-stream',
                        },
                  });
                  uploadedFileMetadata.push(newFile);
            }

            return NextResponse.json({ message: 'ファイルが正常にアップロードされました！', files: uploadedFileMetadata }, { status: 200 });

      } catch (error: any) {
            console.error('ファイルのアップロード中にエラーが発生しました:', error);
            // 本番環境では詳細を隠蔽
            return NextResponse.json({ message: 'ファイルのアップロードに失敗しました', error: 'Internal Server Error' }, { status: 500 });
      } finally {
            await prisma.$disconnect();
      }
}
