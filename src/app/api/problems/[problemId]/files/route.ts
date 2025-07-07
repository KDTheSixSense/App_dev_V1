// /app/api/problems/[problemId]/files/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

const getUploadDir = () => {
  return path.join(process.cwd(), 'public', 'uploads');
};

export async function POST(request: Request, { params }: { params: { problemId: string } }) {
  const problemId = parseInt(params.problemId);

  if (isNaN(problemId)) {
    return NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
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
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${Date.now()}-${file.name}`;
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
    return NextResponse.json({ message: 'ファイルのアップロードに失敗しました', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
