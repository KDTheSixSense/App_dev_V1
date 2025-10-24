"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProblemForClient = getProblemForClient;
exports.getUnsubmittedAssignments = getUnsubmittedAssignments;
// /workspaces/my-next-app/src/lib/data.ts
const problems_1 = require("@/app/(main)/issue_list/basic_info_b_problem/data/problems");
const prisma_1 = require("./prisma");
const headers_1 = require("next/headers");
const iron_session_1 = require("iron-session");
const session_1 = require("@/lib/session");
/**
 * DBから取得した静的な問題(Questions)をクライアント用の形式に変換します。
 * @param dbProblem - Prismaから取得したQuestionsオブジェクト
 * @returns クライアントで利用可能な SerializableProblem
 */
function transformStaticProblem(dbProblem) {
    var _a, _b;
    // DBにない詳細情報（プログラムのロジックなど）をローカルのデータから探して補完します
    const fullProblemData = problems_1.problems.find(p => p.id === dbProblem.id.toString());
    if (!fullProblemData) {
        console.error(`Local problem definition for ID ${dbProblem.id} not found.`);
        // fullProblemDataが見つからない場合、最低限の情報でフォールバックします
        return {
            id: dbProblem.id.toString(),
            title: { ja: dbProblem.title, en: dbProblem.title },
            description: { ja: dbProblem.question, en: dbProblem.question },
            explanationText: { ja: (_a = dbProblem.explain) !== null && _a !== void 0 ? _a : '', en: (_b = dbProblem.explain) !== null && _b !== void 0 ? _b : '' },
            programLines: { ja: [], en: [] },
            answerOptions: { ja: [], en: [] },
            correctAnswer: '', // 正解データはローカルに依存するため空文字
            initialVariables: {},
            logicType: 'STATIC_QA', // 静的な質疑応答形式として扱う
        };
    }
    // シリアライズできない関数を除外して返します
    const { traceLogic, calculateNextLine } = fullProblemData, serializableData = __rest(fullProblemData, ["traceLogic", "calculateNextLine"]);
    return serializableData;
}
/**
 * DBから取得したアルゴリズム問題(Questions_Algorithm)をクライアント用の形式に変換します。
 * @param dbProblem - Prismaから取得したQuestions_Algorithmオブジェクト
 * @returns クライアントで利用可能な SerializableProblem
 */
function transformAlgoProblem(dbProblem) {
    var _a, _b, _c, _d, _e, _f, _g;
    const parseJSON = (str, fallback) => {
        if (!str)
            return fallback;
        try {
            return JSON.parse(str);
        }
        catch (_a) {
            return fallback;
        }
    };
    const programLinesArray = ((_a = dbProblem.programLines) !== null && _a !== void 0 ? _a : '').split('\n');
    return {
        id: dbProblem.id.toString(),
        title: { ja: dbProblem.title, en: dbProblem.title },
        description: { ja: (_b = dbProblem.description) !== null && _b !== void 0 ? _b : '', en: (_c = dbProblem.description) !== null && _c !== void 0 ? _c : '' },
        explanationText: { ja: (_d = dbProblem.explanation) !== null && _d !== void 0 ? _d : '', en: (_e = dbProblem.explanation) !== null && _e !== void 0 ? _e : '' },
        programLines: { ja: programLinesArray, en: programLinesArray },
        answerOptions: {
            ja: parseJSON(dbProblem.answerOptions, []),
            en: parseJSON(dbProblem.answerOptions, [])
        },
        correctAnswer: (_f = dbProblem.correctAnswer) !== null && _f !== void 0 ? _f : '',
        initialVariables: (_g = dbProblem.initialVariable) !== null && _g !== void 0 ? _g : {},
        logicType: dbProblem.logictype,
        traceOptions: parseJSON(dbProblem.options, undefined),
    };
}
/**
 * 指定されたIDの問題データを取得するためのメイン関数。
 * この関数がページコンポーネントから呼び出されます。
 * @param id - 取得したい問題のID
 * @returns 見つかった問題データ、またはnull
 */
async function getProblemForClient(id) {
    try {
        // まず、静的な問題テーブル(Questions)を探します
        const staticProblem = await prisma_1.prisma.questions.findUnique({ where: { id } });
        if (staticProblem) {
            return transformStaticProblem(staticProblem);
        }
        // 見つからなければ、アルゴリズム問題テーブル(Questions_Algorithm)を探します
        const algoProblem = await prisma_1.prisma.questions_Algorithm.findUnique({ where: { id } });
        if (algoProblem) {
            return transformAlgoProblem(algoProblem);
        }
        // どちらのテーブルにもなければ、nullを返します
        return null;
    }
    catch (error) {
        console.error("Failed to fetch problem:", error);
        return null;
    }
}
/**
 * ログイン中のユーザーの、未提出の課題一覧を取得する
 */
async function getUnsubmittedAssignments() {
    var _a;
    // --- ▼▼▼ 認証ロジックを iron-session を使うように変更しました ▼▼▼ ---
    const session = await (0, iron_session_1.getIronSession)(await (0, headers_1.cookies)(), session_1.sessionOptions);
    // セッションにユーザーIDが存在しない場合は、エラーを投げて認証失敗とします
    if (!((_a = session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        throw new Error('認証トークンがありません');
    }
    // セッションから取得したIDを、データベース検索で使えるように数値に変換します
    const userId = Number(session.user.id);
    if (isNaN(userId)) {
        throw new Error('無効なユーザーIDです');
    }
    // Prismaで未提出の課題を検索するロジック
    const assignmentsFromDb = await prisma_1.prisma.assignment.findMany({
        where: {
            // ユーザーが所属しているグループの課題である、という条件はそのまま
            group: {
                groups_User: {
                    some: { user_id: userId },
                },
            },
            // かつ、そのユーザーからの提出記録(Submissions)が「存在し」、
            // そのステータスが「未提出」である課題に絞り込む
            Submissions: {
                some: {
                    userid: userId,
                    status: "未提出", // statusが"未提出"のものを探す
                },
            },
        },
        select: {
            id: true,
            title: true,
            due_date: true,
            programmingProblemId: true,
            selectProblemId: true,
            group: {
                select: {
                    groupname: true,
                    hashedId: true,
                },
            },
        },
        orderBy: {
            due_date: 'asc',
        },
    });
    const formattedAssignments = assignmentsFromDb.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.due_date.toISOString(),
        groupName: assignment.group.groupname,
        groupHashedId: assignment.group.hashedId,
        programmingProblemId: assignment.programmingProblemId,
        selectProblemId: assignment.selectProblemId,
    }));
    // --- ▼▼▼ ここからが新しい処理です ▼▼▼ ---
    // 取得した課題をグループ名でまとめる
    const groupedAssignments = formattedAssignments.reduce((acc, assignment) => {
        const groupName = assignment.groupName;
        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(assignment);
        return acc;
    }, {});
    return groupedAssignments;
}
