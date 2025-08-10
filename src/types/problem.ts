// /src/types/problem.ts (新規作成)

export interface Case {
  id: number | null;
  input: string;
  expectedOutput: string;
  description: string;
}

export interface TestCase extends Case {
  name: string;
}

export interface FormData {
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

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  url: string;
}