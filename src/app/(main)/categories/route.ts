import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// カテゴリ一覧取得
export async function GET() {
  try {
    // 問題から使用されているカテゴリを取得
    const categories = await prisma.programmingProblem.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    })

    // デフォルトカテゴリを追加
    const defaultCategories = [
      'プログラミング',
      'ITパスポート',
      '基本情報 A',
      '基本情報 B',
      '応用情報 午前',
      '応用情報 午後',
      '情報検定'
    ]

    const allCategories = [
      ...defaultCategories.map(name => ({
        category: name,
        _count: { category: categories.find(c => c.category === name)?._count.category || 0 }
      })),
      ...categories.filter(c => !defaultCategories.includes(c.category))
    ]

    return NextResponse.json({
      categories: allCategories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

