"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
// カテゴリ一覧取得
async function GET() {
    try {
        // 問題から使用されているカテゴリを取得
        const categories = await prisma_1.prisma.programmingProblem.groupBy({
            by: ['category'],
            _count: {
                category: true
            },
            orderBy: {
                _count: {
                    category: 'desc'
                }
            }
        });
        // デフォルトカテゴリを追加
        const defaultCategories = [
            'プログラミング',
            'ITパスポート',
            '基本情報 A',
            '基本情報 B',
            '応用情報 午前',
            '応用情報 午後',
            '情報検定'
        ];
        const allCategories = [
            ...defaultCategories.map(name => {
                var _a;
                return ({
                    category: name,
                    _count: { category: ((_a = categories.find(c => c.category === name)) === null || _a === void 0 ? void 0 : _a._count.category) || 0 }
                });
            }),
            ...categories.filter(c => !defaultCategories.includes(c.category))
        ];
        return server_1.NextResponse.json({
            categories: allCategories
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        return server_1.NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
