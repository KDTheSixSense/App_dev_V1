"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
// /app/api/problems/[problemId]/files/route.ts
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const prisma = new client_1.PrismaClient();
const getUploadDir = () => {
    return path_1.default.join(process.cwd(), 'public', 'uploads');
};
async function POST(request, { params }) {
    const problemId = parseInt(params.problemId);
    if (isNaN(problemId)) {
        return server_1.NextResponse.json({ message: '無効な問題IDです' }, { status: 400 });
    }
    try {
        const formData = await request.formData();
        const files = formData.getAll('files');
        if (!files || files.length === 0) {
            return server_1.NextResponse.json({ message: 'ファイルがアップロードされていません' }, { status: 400 });
        }
        const uploadDir = getUploadDir();
        await promises_1.default.mkdir(uploadDir, { recursive: true });
        const uploadedFileMetadata = [];
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = path_1.default.join(uploadDir, fileName);
            await promises_1.default.writeFile(filePath, buffer);
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
        return server_1.NextResponse.json({ message: 'ファイルが正常にアップロードされました！', files: uploadedFileMetadata }, { status: 200 });
    }
    catch (error) {
        console.error('ファイルのアップロード中にエラーが発生しました:', error);
        return server_1.NextResponse.json({ message: 'ファイルのアップロードに失敗しました', error: error.message }, { status: 500 });
    }
    finally {
        await prisma.$disconnect();
    }
}
