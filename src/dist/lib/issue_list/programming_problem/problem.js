"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProgrammingProblems = exports.getProgrammingProblemById = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Prismaのモデルからフロントエンドで使うProblem型に変換する関数
function convertToSerializableProblem(dbProblem) {
    var _a, _b;
    if (!dbProblem)
        return undefined;
    // DBのデータ構造を既存の `Problem` 型に合わせる
    // 注意：この変換は、DBスキーマとProblem型が異なる場合に必要です。
    // 今回は簡易的に主要なプロパティのみをマッピングします。
    return {
        id: String(dbProblem.id),
        logicType: 'CODING_PROBLEM', // 固定値、またはDBに保存
        title: { ja: dbProblem.title, en: dbProblem.title }, // 暫定的に同じタイトルを設定
        description: { ja: dbProblem.description, en: dbProblem.description },
        // サンプルケースなどをDBから取得して設定
        programLines: { ja: [], en: [] }, // 必要に応じてDBから取得
        answerOptions: { ja: [], en: [] }, // コーディング問題では空の場合が多い
        correctAnswer: ((_b = (_a = dbProblem.sampleCases) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.expectedOutput) || '', // 最初のサンプルケースの出力を正解とする（仮）
        explanationText: { ja: dbProblem.description, en: dbProblem.description }, // 解説をDBに追加することも可能
        initialVariables: {},
        traceLogic: [],
    };
}
/**
 * IDに基づいて単一のプログラミング問題を取得します。
 * (問題詳細ページで使用)
 */
const getProgrammingProblemById = async (id) => {
    const problemId = parseInt(id, 10);
    if (isNaN(problemId)) {
        return undefined;
    }
    const problemFromDb = await prisma.programmingProblem.findUnique({
        where: { id: problemId },
        include: {
            sampleCases: true, // サンプルケースも一緒に取得
        },
    });
    return convertToSerializableProblem(problemFromDb);
};
exports.getProgrammingProblemById = getProgrammingProblemById;
/**
 * すべてのプログラミング問題のリストを取得します。
 * (問題一覧ページでサーバーコンポーネントを使わない場合)
 */
const getAllProgrammingProblems = async () => {
    const problemsFromDb = await prisma.programmingProblem.findMany({
        where: { isPublished: true },
        orderBy: { id: 'asc' },
        include: {
            sampleCases: true,
        },
    });
    return problemsFromDb.map(p => convertToSerializableProblem(p)).filter(p => p !== undefined);
};
exports.getAllProgrammingProblems = getAllProgrammingProblems;
