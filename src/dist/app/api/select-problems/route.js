"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
// Redirect to the correct API endpoint
async function POST(request) {
    console.warn('DEPRECATED: /api/select-problems is deprecated. Use /api/selects_problems instead.');
    // Redirect to the correct endpoint
    const body = await request.text();
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/selects_problems`, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, Object.fromEntries(Array.from(request.headers.entries()).filter(([key]) => key.toLowerCase().includes('auth') || key.toLowerCase().includes('cookie')))),
        body: body
    });
    return response;
}
// 選択問題の一覧を取得するGETハンドラ (こちらも念のため記載)
async function GET(request) {
    console.warn('DEPRECATED: /api/select-problems is deprecated. Use /api/selects_problems instead.');
    // Redirect to the correct endpoint
    const url = new URL(request.url);
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/selects_problems${url.search}`, {
        method: 'GET',
        headers: Object.assign({}, Object.fromEntries(Array.from(request.headers.entries()).filter(([key]) => key.toLowerCase().includes('auth') || key.toLowerCase().includes('cookie'))))
    });
    return response;
}
