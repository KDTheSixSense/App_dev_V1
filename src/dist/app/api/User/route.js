"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PATCH = PATCH;
// src/app/api/user/route.ts
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
const auth_1 = require("@/lib/auth");
async function GET() {
    const users = await prisma_1.prisma.user.findMany();
    return server_1.NextResponse.json(users);
}
async function POST(req) {
    const data = await req.json();
    const newUser = await prisma_1.prisma.user.create({
        data: {
            password: data.password,
            email: data.email,
            birth: data.birth
        },
    });
    return server_1.NextResponse.json(newUser);
}
async function PATCH(req) {
    var _a;
    const session = await (0, auth_1.getAppSession)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return server_1.NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    try {
        const data = await req.json();
        // Don't allow updating certain fields this way
        delete data.id;
        delete data.email;
        delete data.password;
        delete data.hash;
        // If a title is being selected, verify the user has unlocked it
        if (data.selectedTitleId) {
            const userId = session.user.id;
            const titleId = parseInt(data.selectedTitleId, 10);
            const unlockedTitle = await prisma_1.prisma.userUnlockedTitle.findUnique({
                where: {
                    userId_titleId: {
                        userId: userId,
                        titleId: titleId,
                    },
                },
            });
            if (!unlockedTitle) {
                return server_1.NextResponse.json({ error: 'Cannot select a title that has not been unlocked.' }, { status: 403 });
            }
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: {
                id: session.user.id,
            },
            data: {
                username: data.username,
                birth: data.birth ? new Date(data.birth) : null,
                icon: data.icon,
                selectedTitleId: data.selectedTitleId ? parseInt(data.selectedTitleId, 10) : null,
            },
        });
        return server_1.NextResponse.json(updatedUser);
    }
    catch (error) {
        console.error('Failed to update user:', error);
        return server_1.NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
