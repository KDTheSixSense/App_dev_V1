"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const prisma_1 = require("@/lib/prisma");
const path_1 = __importDefault(require("path"));
const promises_1 = require("fs/promises");
async function POST(req) {
    var _a;
    const session = await (0, auth_1.getAppSession)();
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return server_1.NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    try {
        const formData = await req.formData();
        const file = formData.get('icon');
        if (!file) {
            return server_1.NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${session.user.id}-${Date.now()}-${file.name}`;
        const filePath = path_1.default.join(process.cwd(), 'public', 'uploads', 'icons', filename);
        console.log(`Attempting to write file to: ${filePath}`);
        await (0, promises_1.writeFile)(filePath, buffer);
        console.log(`File written successfully: ${filePath}`);
        console.log(`Attempting to update user ${session.user.id} with icon path: /uploads/icons/${filename}`);
        const user = await prisma_1.prisma.user.update({
            where: { id: session.user.id },
            data: { icon: `/uploads/icons/${filename}` },
        });
        console.log(`User updated successfully: ${user.id}`);
        return server_1.NextResponse.json({ message: 'Icon uploaded successfully', iconPath: user.icon });
    }
    catch (error) {
        console.error('Error uploading icon:', error);
        if (error instanceof Error) {
            return server_1.NextResponse.json({ error: 'Failed to upload icon', details: error.message }, { status: 500 });
        }
        else {
            return server_1.NextResponse.json({ error: 'Failed to upload icon', details: 'Unknown error' }, { status: 500 });
        }
    }
}
