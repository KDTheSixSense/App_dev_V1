import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 名前付きインポートを使用

export async function GET(
  req: Request,
  { params }: { params: Promise<{ currentId: string }> }
) {
  try {
    const { currentId: currentIdStr } = await params;
    const currentId = parseInt(currentIdStr, 10);
    if (isNaN(currentId)) {
      return NextResponse.json({ message: '無効なIDです' }, { status: 400 });
    }

    // 現在のIDより大きいIDを持つ、同じ科目の問題をID順で検索し、最初の1件を取得する
    const nextProblem = await prisma.selectProblem.findFirst({
      where: {
        id: {
          gt: currentId, // gt = greater than (より大きい)
        },
        subjectId: 4, // "プログラミング選択問題"の科目に限定
      },
      orderBy: {
        id: 'asc', // IDの昇順
      },
      select: {
        id: true, // IDのみ取得
      },
    });

    // 見つかればそのIDを、見つからなければnullを返す
    return NextResponse.json({ nextProblemId: nextProblem?.id || null });

  } catch (error) {
    console.error('Error fetching next problem ID:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}