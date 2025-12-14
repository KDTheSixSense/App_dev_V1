import React from 'react';
import { prisma } from '@/lib/prisma';
import ProblemDetailClient from './ProblemDetailClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAppSession } from '@/lib/auth'; // セッション取得用

// ページに渡されるパラメータの型
interface ProblemDetailPageProps {
  params: { problemId?: string; problemid?: string };
}

export default async function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const problemIdStr = params.problemId || params.problemid;
  const id = parseInt(problemIdStr, 10);

  if (isNaN(id)) {
    notFound();
  }

  // 1. 問題データの取得
  const problem = await prisma.selectProblem.findUnique({
    where: { id },
  });

  if (!problem) {
    notFound();
  }

  // 2. ユーザーのクレジット情報の取得
  const session = await getAppSession();
  let initialCredits = 0;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as any },
      select: { aiAdviceCredits: true },
    });
    initialCredits = user?.aiAdviceCredits ?? 0;
  }

  // ※ 選択問題の画像パスに関する補足
  // SelectProblemモデルにimagePathがない場合、seedの段階でdescriptionに入れている可能性がありますが、
  // もしPrismaスキーマを更新してimagePathを追加している、あるいは擬似的に扱う場合はここで調整します。
  // ここでは description から画像パスを抽出するロジックを入れるか、
  // そのままオブジェクトを渡します。

  // シリアライズ可能なオブジェクトに変換（Date型対策など）
  const plainProblem = JSON.parse(JSON.stringify(problem));

  // 画像パスの調整（もしモデルにないが、特定の命名規則で画像がある場合など）
  // 例: 問題IDに対応する画像が存在するかチェックするロジックなどがここに入り得ます。
  // 今回は seed 側で description に Markdown として入れているか、
  // 問題データ自体に画像パスを持たせる前提で Client に渡します。
  // もし description から抽出が必要なら:
  // const imageMatch = plainProblem.description.match(/!\[.*?\]\((.*?)\)/);
  // if (imageMatch) plainProblem.imagePath = imageMatch[1];

  // Client Component に imagePath プロパティが存在することを保証するために追加
  // (SelectProblemモデルにimagePathがない場合でも型エラーを防ぐため)
  if (!plainProblem.imagePath) {
    // 命名規則に基づくデフォルトパス (例: /images/select_problems/select-problem-50.png)
    // ファイルが存在するかどうかはクライアント側のimgタグで判断（エラーなら非表示）させても良いですが
    // ここでは seed.ts のロジックに合わせて description から抽出する簡易実装をしておきます。
    const desc = plainProblem.description || "";
    const match = desc.match(/\((.*\/images\/.*)\)/); // Markdownリンクの抽出
    if (match) {
      plainProblem.imagePath = match[1];
      // 画像パスを抽出したらdescriptionからは削除して渡すのがUI的には綺麗です
      plainProblem.description = desc.replace(/!\[.*?\]\(.*?\)/g, "").trim();
    }
    // もしくは、以前のseedのようにファイル名が固定なら強制的に付与
    // plainProblem.imagePath = `/images/select_problems/select-problem-${id}.png`;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* 応用情報と同じようにヘッダーなどはレイアウトファイルで管理されている前提 */}
      <div className="container mx-auto">
        <div className="mb-4">
          <Link href="/issue_list/selects_problems" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </Link>
        </div>
        <ProblemDetailClient problem={plainProblem} initialCredits={initialCredits} />
      </div>
    </div>
  );
}