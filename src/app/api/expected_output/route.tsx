import { NextResponse } from 'next/server';

export async function GET() {
  try {
    //2から30までの偶数を生成する
    const evenNumbers: number[] = [];
    for (let i = 2; i <= 30; i += 2) {
      evenNumbers.push(i);
    }
    
    return NextResponse.json({
      expected_output: evenNumbers,
      output_text: evenNumbers.join('\n'),
      description: 'for文とif文を組み合わせて、1から30までの範囲の偶数のみをひとつずつ出力してください。'
    });
    
  } catch (error) {
    console.error('Expected Output API Error:', error);
    return NextResponse.json({
      error: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}