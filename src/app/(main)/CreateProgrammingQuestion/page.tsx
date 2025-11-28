import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateProgrammingQuestionClient from "./CreateProgrammingQuestionClient";

interface Case {
  id: number | null;
  input: string;
  expectedOutput: string;
  description: string;
}

interface TestCase extends Case {
  name: string;
}

interface FormData {
  title: string;
  problemType: string;
  difficulty: number;
  timeLimit: number;
  category: string;
  topic: string;
  tags: string[];
  description: string;
  codeTemplate: string;
  isPublic: boolean;
  allowTestCaseView: boolean;
}

interface AnswerOption {
  id: string;
  text: string;
}

interface InitialProblemData {
  problemId: number | null;
  isEditMode: boolean;
  formData: FormData;
  sampleCases: Case[];
  testCases: TestCase[];
  answerOptions: AnswerOption[];
  correctAnswer: string;
  explanation: string;
  selectedCategory: string;
}

interface PageProps {
  searchParams: Promise<{ id?: string; type?: string }>;
}

export default async function CreateProgrammingQuestionPage({ searchParams: searchParamsPromise }: PageProps) {
  const searchParams = await searchParamsPromise;
  const idFromQuery = searchParams?.id;
  const typeFromQuery = searchParams?.type;

  let initialData: InitialProblemData | null = null;
  let problemId: number | null = null;
  let isEditMode = false;
  let selectedCategory: string = typeFromQuery === "select" ? "itpassport" : "programming";

  if (idFromQuery) {
    const parsedId = parseInt(idFromQuery);
    if (!isNaN(parsedId) && parsedId > 0) {
      problemId = parsedId;
      isEditMode = true;

      const isSelectProblem = selectedCategory === "itpassport";

      try {
        let data: any;
        if (isSelectProblem) {
          data = await prisma.selectProblem.findUnique({
            where: { id: problemId },
            // 必要に応じて include を追加
          });
          if (data) {
            const optionsWithId = (data.answerOptions as string[]).map((text, index) => ({
              id: String.fromCharCode(97 + index), // a, b, c, d
              text: text,
            }));
            const correctIndex = data.answerOptions.indexOf(data.correctAnswer);
            initialData = {
              problemId: problemId,
              isEditMode: true,
              selectedCategory: "itpassport",
              formData: {
                title: data.title || "",
                problemType: "選択問題",
                difficulty: data.difficultyId || 1,
                timeLimit: 10, // ダミー値
                category: "4択問題",
                topic: "", // 選択問題には不要
                tags: [], // 選択問題には不要
                description: data.description || "",
                codeTemplate: "", // 選択問題には不要
                isPublic: false, // 選択問題には不要
                allowTestCaseView: false, // 選択問題には不要
              },
              sampleCases: [], // 選択問題には不要
              testCases: [], // 選択問題には不要
              answerOptions: optionsWithId,
              correctAnswer: correctIndex !== -1 ? String.fromCharCode(97 + correctIndex) : "a",
              explanation: data.explanation || "",
            };
          }
        } else {
          data = await prisma.programmingProblem.findUnique({
            where: { id: problemId },
            include: { sampleCases: true, testCases: true },
          });
          if (data) {
            initialData = {
              problemId: problemId,
              isEditMode: true,
              selectedCategory: "programming",
              formData: {
                title: data.title || "",
                problemType: data.problemType || "コーディング問題",
                difficulty: data.difficulty || 4,
                timeLimit: data.timeLimit || 10,
                category: data.category || "プログラミング基礎",
                topic: data.topic || "標準入力",
                tags: JSON.parse(data.tags || "[]"),
                description: data.description || "",
                codeTemplate: data.codeTemplate || "",
                isPublic: data.isPublic || false,
                allowTestCaseView: data.allowTestCaseView || false,
              },
              sampleCases: data.sampleCases || [],
              testCases: data.testCases || [],
              answerOptions: [], // プログラミング問題には不要
              correctAnswer: "", // プログラミング問題には不要
              explanation: "", // プログラミング問題には不要
            };
          }
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
        // エラー時はリダイレクトまたはエラーメッセージ表示
        redirect('/issue_list/mine_issue_list/problems');
      }
    } else {
      // 無効なIDの場合
      redirect('/issue_list/mine_issue_list/problems');
    }
  }

  // 新規作成の場合の初期データ
  if (!initialData) {
    initialData = {
      problemId: null,
      isEditMode: false,
      selectedCategory: typeFromQuery === "select" ? "itpassport" : "programming",
      formData: {
        title: "",
        problemType: typeFromQuery === "select" ? "選択問題" : "コーディング問題",
        difficulty: 4,
        timeLimit: 10,
        category: typeFromQuery === "select" ? "4択問題" : "プログラミング基礎",
        topic: "標準入力",
        tags: [],
        description: "",
        codeTemplate: "",
        isPublic: false,
        allowTestCaseView: false,
      },
      sampleCases: [{ id: null, input: "", expectedOutput: "", description: "" }],
      testCases: [{ id: null, name: "ケース1", input: "", expectedOutput: "", description: "" }],
      answerOptions: [
        { id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }
      ],
      correctAnswer: "a",
      explanation: "",
    };
  }

  return (
    <CreateProgrammingQuestionClient initialData={initialData} />
  );
}
