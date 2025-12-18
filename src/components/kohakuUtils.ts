//components/kohakuUtils.ts

export type SubjectProgress = {
  subjectName: string;
  level: number;
};

// 科目名から画像ファイル用のコード（A, B, P, O）に変換する関数
export const getSubjectCode = (subjectName: string): string => {
  if (subjectName.includes('基本A') || subjectName.includes('基本情報A')) return 'A';
  if (subjectName.includes('基本B') || subjectName.includes('基本情報B') || subjectName.includes('アルゴリズム')) return 'B';
  if (subjectName.includes('プログラム') || subjectName.includes('プログラミング')) return 'P';
  if (subjectName.includes('応用午前') || subjectName.includes('応用情報')) return 'O';
  return 'A'; // デフォルト値
};

// 進化タイプ（例: "A-A", "P-O", "ALL"）を計算する関数
export const calculateEvolutionType = (subjectProgress: SubjectProgress[] | undefined): string | null => {
  if (!subjectProgress || subjectProgress.length === 0) {
    return null;
  }

  const allLevelsEqual = subjectProgress.every((s) => s.level === subjectProgress[0].level);
  if (subjectProgress.length > 1 && allLevelsEqual) {
    return 'ALL';
  }

  // 1. レベル降順でソート
  const sortedSubjects = [...subjectProgress].sort((a, b) => b.level - a.level);
  
  const top1 = sortedSubjects[0];
  const top2 = sortedSubjects[1];

  // 2. 科目名からコードを取得
  const code1 = getSubjectCode(top1.subjectName);
  let code2 = '';

  if (!top2) {
    code2 = code1;
  } else {
    // 3. 判定ロジック
    if (top1.level - 10 >= top2.level) {
      code2 = code1;
    } else {
      code2 = getSubjectCode(top2.subjectName);
    }
  }

  // 指定されたパターンのみに正規化 (順序をファイル名に合わせる)
  const validPatterns = [
    'A-A', 'A-O', 'A-P', 'A-B',
    'B-B', 'B-P', 'B-O',
    'O-O',
    'P-O', 'P-P'
  ];

  const pattern1 = `${code1}-${code2}`;
  const pattern2 = `${code2}-${code1}`;

  // pattern1 または pattern2 が有効なリストにあれば採用
  const finalPattern = validPatterns.includes(pattern1) ? pattern1 
                     : validPatterns.includes(pattern2) ? pattern2 
                     : 'A-A'; // どちらもなければデフォルト
  
  return finalPattern;
};

// 進化後の画像パスを取得する関数
export const getEvolvedImageSrc = (subjectProgress: SubjectProgress[] | undefined): string => {
  const type = calculateEvolutionType(subjectProgress);
  if (!type) return '/images/Kohaku/kohaku-normal.png';
  return `/images/evolution/${type}-base.png`;
};