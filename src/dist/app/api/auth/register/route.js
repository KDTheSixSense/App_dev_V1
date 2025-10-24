"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
// src/app/api/auth/register/route.ts
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function POST(req) {
    try {
        const { email, password, birth } = await req.json();
        if (!email || !password || !birth) {
            return server_1.NextResponse.json({ message: 'email, password, birthは必須です' }, { status: 400 });
        }
        const birthDate = new Date(birth);
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return server_1.NextResponse.json({ message: 'このメールはすでに登録されています' }, { status: 400 });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                birth: birthDate,
            },
        });
        return server_1.NextResponse.json({
            message: '登録完了',
            user: { id: user.id, email: user.email },
        });
    }
    catch (error) {
        console.error('登録処理エラー:', error);
        return server_1.NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
