import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userCode, language } = body;

    // Expected output ( 2-30)
    const expectedOutput = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
    const expectedOutputText = expectedOutput.join('\n');

    // Validasi user code あるかどうか
    if (!userCode || !userCode.trim()) {
      return NextResponse.json({
        success: false,
        message: 'コードを入力してから提出してください。',
        error: 'コードが空です',
        validation_message: 'コードが入力されていません。'
      }, { status: 400 });
    }

    // EXECUTE USER CODE TO GET ACTUAL OUTPUT
    let actualOutput = '';
    let executionSuccess = false;
    
    try {
      // Call execute_code API to get real output
      const executeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/execute_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: language,
          source_code: userCode,
        }),
      });

      if (executeResponse.ok) {
        const executeData = await executeResponse.json();
        
        if (executeData.program_output && executeData.program_output.stdout) {
          actualOutput = executeData.program_output.stdout.trim();
          executionSuccess = true;
        } else if (executeData.program_output && executeData.program_output.stderr) {
          actualOutput = `実行時エラー: ${executeData.program_output.stderr}`;
          executionSuccess = false;
        } else if (executeData.build_result && executeData.build_result.stderr) {
          actualOutput = `ビルドエラー: ${executeData.build_result.stderr}`;
          executionSuccess = false;
        } else {
          actualOutput = 'コードの実行に失敗しました';
          executionSuccess = false;
        }
      } else {
        actualOutput = 'コード実行APIエラー';
        executionSuccess = false;
      }
    } catch (executeError) {
      console.error('Execute API Error:', executeError);
      actualOutput = 'コードの実行中にエラーが発生しました';
      executionSuccess = false;
    }

    // If execution failed, return failure immediately
    if (!executionSuccess) {
      return NextResponse.json({
        success: false,
        message: '不正解です。コードの実行でエラーが発生しました。',
        expected_output: expectedOutput,
        user_output: [],
        output_text: actualOutput,
        expected_output_text: expectedOutputText,
        // FIXED: Only show error in result, not expected output
        result: `実行結果:\n${actualOutput}`,
        submitted_code: userCode,
        language: language || 'unknown',
        is_correct: false,
        validation_message: 'コードの実行でエラーが発生しました。構文やロジックを確認してください。',
        error: 'コード実行エラー'
      }, { status: 200 });
    }

    // Compare actual output with expected output
    const normalizedActualOutput = actualOutput.trim().replace(/\r\n/g, '\n');
    const normalizedExpectedOutput = expectedOutputText.trim();
    
    console.log('Actual Output:', JSON.stringify(normalizedActualOutput));
    console.log('Expected Output:', JSON.stringify(normalizedExpectedOutput));
    console.log('Are Equal:', normalizedActualOutput === normalizedExpectedOutput);
    
    const isCorrect = normalizedActualOutput === normalizedExpectedOutput;

    if (isCorrect) {
      return NextResponse.json({
        success: true,
        message: '正解です！コードが正しく提出されました！',
        expected_output: expectedOutput,
        user_output: actualOutput.split('\n').map(n => parseInt(n)).filter(n => !isNaN(n)),
        output_text: expectedOutputText,
        expected_output_text: expectedOutputText,
        result: `実行結果:\n${expectedOutputText}`,
        submitted_code: userCode,
        language: language || 'unknown',
        is_correct: true,
        validation_message: '期待する出力と完全に一致しています。素晴らしいです！'
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: '不正解です。出力が期待値と異なります。',
        expected_output: expectedOutput,
        user_output: actualOutput.split('\n').map(n => parseInt(n)).filter(n => !isNaN(n)),
        output_text: actualOutput,
        expected_output_text: expectedOutputText,
        // FIXED: Only show actual output in result, expected output will be shown in submit result section
        result: `実行結果:\n${actualOutput}`,
        submitted_code: userCode,
        language: language || 'unknown',
        is_correct: false,
        validation_message: `出力が期待値と一致しません。\n\nあなたの出力:\n${actualOutput}\n\n期待する出力:\n${expectedOutputText}`,
        error: '出力が正しくありません'
      }, { status: 200 });
    }
    
  } catch (error) {
    console.error('Submit API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'サーバーエラーが発生しました。',
      error: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
      validation_message: 'サーバー内部エラーが発生しました。'
    }, { status: 500 });
  }
}

