// /workspaces/my-next-app/src/lib/data.ts
import { problems as localProblems, Problem as AppProblem } from '@/app/(main)/issue_list/basic_info_b_problem/data/problems';
import { prisma } from './prisma';
import type { 
  Questions as DbStaticProblem,
  Questions_Algorithm as DbAlgoProblem,
  Basic_Info_A_Question as DbBasicInfoAProblem ,
  Applied_am_Question as DbAppliedInfoAmProblem
} from '@prisma/client';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

export interface AnswerOption {
  label: string; // 解答の表示ラベル（例: 'ア'）
  value: string; // 解答の実際の値（正誤判定用）
}

// クライアントに渡すことができる、シリアライズ可能な問題の型
export type SerializableProblem = Omit<AppProblem, 'traceLogic' | 'calculateNextLine'> & {
  answerOptions?: { ja: AnswerOption[]; en: AnswerOption[] }; // answerOptions をオプションに修正
  sourceYear?: string;
  sourceNumber?: string;
  imagePath?: string; // Optional image path
  difficultyId: number;
};

interface SessionData {
  // iron-sessionに保存されているユーザーIDは文字列の可能性があるため、string型で定義します
  user?: { id: string; email: string; };
}

// フロントエンドで使う課題データの型
export interface UnsubmittedAssignment {
  id: number;
  title: string;
  dueDate: string;
  groupName: string;
  groupHashedId: string;
  programmingProblemId?: number | null;
  selectProblemId?: number | null;
}

/**
 * DBから取得した静的な問題(Questions)をクライアント用の形式に変換します。
 * @param dbProblem - Prismaから取得したQuestionsオブジェクト
 * @returns クライアントで利用可能な SerializableProblem
 */
function transformStaticProblem(dbProblem: DbStaticProblem): SerializableProblem | null {
  // DBにない詳細情報（プログラムのロジックなど）をローカルのデータから探して補完します
  const fullProblemData = localProblems.find(p => p.id === dbProblem.id.toString());
  if (!fullProblemData) {
    console.error(`Local problem definition for ID ${dbProblem.id} not found.`);
    // fullProblemDataが見つからない場合、最低限の情報でフォールバックします
    return {
      id: dbProblem.id.toString(),
      title: { ja: dbProblem.title, en: dbProblem.title },
      description: { ja: dbProblem.question, en: dbProblem.question },
      explanationText: { ja: dbProblem.explain ?? '', en: dbProblem.explain ?? '' },
      programLines: { ja: [], en: [] },
      answerOptions: { ja: [], en: [] },
      correctAnswer: '', // 正解データはローカルに依存するため空文字
      initialVariables: {},
      logicType: 'STATIC_QA', // 静的な質疑応答形式として扱う
      difficultyId: 7
    };
  }
  // シリアライズできない関数を除外して返します
  const { traceLogic, calculateNextLine, ...serializableData } = fullProblemData;
  return serializableData;
}

/**
 * DBから取得したアルゴリズム問題(Questions_Algorithm)をクライアント用の形式に変換します。
 * @param dbProblem - Prismaから取得したQuestions_Algorithmオブジェクト
 * @returns クライアントで利用可能な SerializableProblem
 */
function transformAlgoProblem(dbProblem: DbAlgoProblem): SerializableProblem {
  const parseJSON = (str: string | null, fallback: any) => {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
  };
  const programLinesArray = (dbProblem.programLines ?? '').split('\n');
  return {
    id: dbProblem.id.toString(),
    title: { ja: dbProblem.title, en: dbProblem.title },
    description: { ja: dbProblem.description ?? '', en: dbProblem.description ?? '' },
    explanationText: { ja: dbProblem.explanation ?? '', en: dbProblem.explanation ?? '' },
    programLines: { ja: programLinesArray, en: programLinesArray },
    answerOptions: { 
      ja: parseJSON(dbProblem.answerOptions, []), 
      en: parseJSON(dbProblem.answerOptions, []) 
    },
    correctAnswer: dbProblem.correctAnswer ?? '',
    initialVariables: dbProblem.initialVariable as AppProblem['initialVariables'] ?? {},
    logicType: dbProblem.logictype,
    traceOptions: parseJSON(dbProblem.options as string | null, undefined),
    difficultyId: dbProblem.difficultyId ?? 7,
  };
}

/**
 * 指定されたIDの問題データを取得するためのメイン関数。
 * この関数がページコンポーネントから呼び出されます。
 * @param id - 取得したい問題のID
 * @returns 見つかった問題データ、またはnull
 */
export async function getProblemForClient(id: number): Promise<SerializableProblem | null> {
  try {
    // まず、静的な問題テーブル(Questions)を探します
    const staticProblem = await prisma.questions.findUnique({ where: { id } });
    if (staticProblem) {
      return transformStaticProblem(staticProblem);
    }

    // 見つからなければ、アルゴリズム問題テーブル(Questions_Algorithm)を探します
    const algoProblem = await prisma.questions_Algorithm.findUnique({ where: { id } });
    if (algoProblem) {
      return transformAlgoProblem(algoProblem);
    }

    // どちらのテーブルにもなければ、nullを返します
    return null;
  } catch (error) {
    console.error("Failed to fetch problem:", error);
    return null;
  }
}

/**
 * ログイン中のユーザーの、未提出の課題一覧を取得する
 */
export async function getUnsubmittedAssignments() {
  
  // --- ▼▼▼ 認証ロジックを iron-session を使うように変更しました ▼▼▼ ---
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  
  // セッションにユーザーIDが存在しない場合は、エラーを投げて認証失敗とします
  if (!session.user?.id) {
    throw new Error('認証トークンがありません');
  }
  
  // セッションから取得したIDを、データベース検索で使えるように数値に変換します
  const userId = Number(session.user.id);
  if (isNaN(userId)) {
    throw new Error('無効なユーザーIDです');
  }

  // Prismaで未提出の課題を検索するロジック
  const assignmentsFromDb = await prisma.assignment.findMany({
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

  const formattedAssignments: UnsubmittedAssignment[] = assignmentsFromDb.map(assignment => ({
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
  }, {} as Record<string, UnsubmittedAssignment[]>);

  return groupedAssignments;
}

/**
 * DBから取得した基本情報A問題(Basc_Info_A_Question)をクライアント用の形式に変換します。
 * [修正版] 全てのフィールドを SerializableProblem 形式にマッピング
 * @param dbProblem - Prismaから取得したBasc_Info_A_Questionオブジェクト
 * @returns クライアントで利用可能な SerializableProblem
 */
function transformBasicInfoAProblem(dbProblem: DbBasicInfoAProblem): SerializableProblem {
  const answerLabels = ['ア', 'イ', 'ウ', 'エ'];

  // DBの answerOptions (例: ["説明A", "説明B", ...]) を
  // { label: "ア", value: "説明A" } の形式に変換
  // Ensure dbProblem.answerOptions is treated as an array
  const dbOptionsArray = Array.isArray(dbProblem.answerOptions) ? dbProblem.answerOptions : [];
  const transformedOptions = dbOptionsArray.map((optionText, index) => ({
    label: answerLabels[index] || '?',
    // Ensure value is a string
    value: String(optionText),
  })).slice(0, 4); // Ensure only 4 options are included

  // DBの correctAnswer (例: 0) から、正解の「テキスト」 (例: "説明A") を取得
  const correctOptionText = dbOptionsArray[dbProblem.correctAnswer]
                           ? String(dbOptionsArray[dbProblem.correctAnswer])
                           : ''; // Handle potential index out of bounds

  // Only include imagePath if the property actually exists on the DB object.
  // This avoids TypeScript errors when the Prisma model does not define imagePath.
  const imagePath = 'imagePath' in dbProblem ? (dbProblem as any).imagePath : undefined;

  return {
    id: String(dbProblem.id),
    // ★ Wrap text fields in language objects
    title: { ja: dbProblem.title || '', en: dbProblem.title || '' },
    description: { ja: dbProblem.description || '', en: dbProblem.description || '' },
    explanationText: { ja: dbProblem.explanation || '', en: dbProblem.explanation || '' },
    programLines: { ja: [], en: [] }, // A問題はプログラムがない
    answerOptions: {
      ja: transformedOptions,
      en: transformedOptions // Assuming same options for EN for now
    },
    // ★ Use the correct answer text
    correctAnswer: correctOptionText,
    initialVariables: {},
    logicType: 'STATIC_QA', // Or a more specific type if needed
    imagePath: imagePath,
    sourceYear: dbProblem.sourceYear ?? undefined,
    sourceNumber: dbProblem.sourceNumber ?? undefined,
    difficultyId: dbProblem.difficultyId ?? 7,
    // Add other optional fields if necessary, like traceOptions
    // traceOptions: undefined,
  };
}

/**
 * 【新設】基本情報A問題用のデータ取得関数
 * 指定されたIDの基本情報A問題データを取得します。
 * [修正版] デバッグログを追加
 * @param id - 取得したい問題のID (数値型)
 * @returns 見つかった問題データ、またはnull
 */
export async function getBasicInfoAProblem(id: number): Promise<SerializableProblem | null> {
  console.log(`[getBasicInfoAProblem] Attempting to fetch problem with ID: ${id}`);
  try {
    const basicInfoAProblem = await prisma.basic_Info_A_Question.findUnique({
      where: { id }
    });

    if (basicInfoAProblem) {
      console.log(`[getBasicInfoAProblem] Found problem data for ID: ${id}. Transforming...`);
      // ここで transformBasicInfoAProblem がエラーを投げる可能性も考慮
      try {
          const transformed = transformBasicInfoAProblem(basicInfoAProblem);
          console.log(`[getBasicInfoAProblem] Transformation successful for ID: ${id}.`);
          return transformed;
      } catch (transformError) {
          console.error(`[getBasicInfoAProblem] Error during transformation for ID: ${id}`, transformError);
          return null; // 変換エラー時も null を返す
      }
    } else {
      console.log(`[getBasicInfoAProblem] No problem data found for ID: ${id}. Returning null.`);
      return null;
    }

  } catch (error) {
    console.error(`[getBasicInfoAProblem] Database error fetching ID: ${id}:`, error);
    return null;
  }
}

/**
 * DBから取得した応用情報AM問題(Applied_am_Question)をクライアント用の形式に変換します。
 * (transformBasicInfoAProblem をコピーして作成)
 */
function transformAppliedInfoAmProblem(dbProblem: DbAppliedInfoAmProblem): SerializableProblem {
  const answerLabels = ['ア', 'イ', 'ウ', 'エ'];

  const dbOptionsArray = Array.isArray(dbProblem.answerOptions) ? dbProblem.answerOptions : [];
  const transformedOptions = dbOptionsArray.map((optionText, index) => ({
    label: answerLabels[index] || '?',
    value: String(optionText),
  })).slice(0, 4); 

  const correctOptionText = dbOptionsArray[dbProblem.correctAnswer]
                           ? String(dbOptionsArray[dbProblem.correctAnswer])
                           : ''; 

  const imagePath = 'imagePath' in dbProblem ? (dbProblem as any).imagePath : undefined;

  return {
    id: String(dbProblem.id),
    title: { ja: dbProblem.title || '', en: dbProblem.title || '' },
    description: { ja: dbProblem.description || '', en: dbProblem.description || '' },
    explanationText: { ja: dbProblem.explanation || '', en: dbProblem.explanation || '' },
    programLines: { ja: [], en: [] }, // A問題と同様にプログラムはない
    answerOptions: {
      ja: transformedOptions,
      en: transformedOptions // ひとまず 'ja' と同じ
    },
    correctAnswer: correctOptionText,
    initialVariables: {},
    logicType: 'STATIC_QA', // 静的な選択問題
    imagePath: imagePath,
    sourceYear: dbProblem.sourceYear ?? undefined,
    sourceNumber: dbProblem.sourceNumber ?? undefined,
    difficultyId: dbProblem.difficultyId ?? 9, // 9 = 応用資格午前問題
  };
}

/**
 * 【新設】応用情報AM問題用のデータ取得関数
 * (getBasicInfoAProblem をコピーして作成)
 */
export async function getAppliedInfoAmProblem(id: number): Promise<SerializableProblem | null> {
  console.log(`[getAppliedInfoAmProblem] Attempting to fetch problem with ID: ${id}`);
  try {
    // ★ モデルを Applied_am_Question に変更
    const appliedAmProblem = await prisma.applied_am_Question.findUnique({
      where: { id }
    });

    if (appliedAmProblem) {
      console.log(`[getAppliedInfoAmProblem] Found problem data for ID: ${id}. Transforming...`);
      // ★ 変換関数を変更
      const transformed = transformAppliedInfoAmProblem(appliedAmProblem);
      console.log(`[getAppliedInfoAmProblem] Transformation successful for ID: ${id}.`);
      return transformed;
    } else {
      console.log(`[getAppliedInfoAmProblem] No problem data found for ID: ${id}. Returning null.`);
      return null;
    }

  } catch (error) {
    console.error(`[getAppliedInfoAmProblem] Database error fetching ID: ${id}:`, error);
    return null;
  }
}