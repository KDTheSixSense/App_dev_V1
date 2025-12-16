export type SubjectProgress = {
  subjectName: string;
  level: number;
};

// 科目名から画像ファイル用のコード（A, B, P, O）に変換する関数
export const getSubjectCode = (subjectName: string): string => {
  if (subjectName.includes('基本A')) return 'A';
  if (subjectName.includes('基本B')) return 'B';
  if (subjectName.includes('プログラム')) return 'P';
  if (subjectName.includes('応用午前')) return 'O';
  return 'A'; // デフォルト値
};

// 進化後の画像パスを取得する関数
export const getEvolvedImageSrc = (subjectProgress: SubjectProgress[] | undefined): string => {
  // 学習データがない場合はデフォルト（通常）画像を返す
  if (!subjectProgress || subjectProgress.length === 0) {
    return '/images/Kohaku/kohaku-normal.png';
  }

  // すべての科目のレベルが均等で等しい場合
  const allLevelsEqual = subjectProgress.every((s) => s.level === subjectProgress[0].level);
  if (subjectProgress.length > 1 && allLevelsEqual) {
    return '/images/evolution/ALL-base.png';
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

  // 画像ファイル名を生成
  return `/images/evolution/${code1}-${code2}-base.png`;
};