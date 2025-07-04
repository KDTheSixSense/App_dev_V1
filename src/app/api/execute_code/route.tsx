import { NextResponse } from 'next/server';

// Paiza.IO APIを使用してコードを実行するための設定
// 開発中は'guest'キーを使用できますが、レート制限があります。
const PAIZA_IO_API_KEY = process.env.PAIZA_IO_API_KEY || 'guest';
const PAIZA_IO_API_BASE_URL = 'https://api.paiza.io/runners'; 


export async function POST(request: Request ) {
  try {
    const { language, source_code } = await request.json();
    console.log('Received request for language:', language);

    if (!language || !source_code) {
      return NextResponse.json({ error: 'Language and source_code are required.' }, { status: 400 });
    }

    // Step 1: Create a new runner (code execution request)
    console.log('Attempting to connect to Paiza.IO API for create...');
    const createResponse = await fetch(`${PAIZA_IO_API_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: language,
        source_code: source_code,
        api_key: PAIZA_IO_API_KEY,
      }),
    });
    console.log('Received response from Paiza.IO create. Status:', createResponse.status);
    const createData = await createResponse.json();

    // ここからが、前回のコードで try ブロックの外に出てしまっていた部分です。
    // 正しく try ブロック内に配置します。
    if (!createResponse.ok || createData.error) {
      console.error('Paiza.IO create error:', createData.error || createData);
      return NextResponse.json(
        { error: createData.error || 'Failed to create runner on Paiza.IO' },
        { status: createResponse.status }
      );
    }

    const sessionId = createData.id;
    let status = createData.status;
    let attempts = 0;
    const MAX_ATTEMPTS = 20; // 最大ステータスチェック回数
    const POLL_INTERVAL_MS = 1000; // 1秒ごとにポーリング

    // Step 2: Poll for status until completed
    while (status !== 'completed' && attempts < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      const statusResponse = await fetch(`${PAIZA_IO_API_BASE_URL}/get_status?id=${sessionId}&api_key=${PAIZA_IO_API_KEY}`);
      const statusData = await statusResponse.json();

      if (!statusResponse.ok || statusData.error) {
        console.error('Paiza.IO get_status error:', statusData.error || statusData);
        return NextResponse.json(
          { error: statusData.error || 'Failed to get status from Paiza.IO' },
          { status: statusResponse.status }
        );
      }
      status = statusData.status;
      attempts++;
    }

    if (status !== 'completed') {
      return NextResponse.json({ error: 'Code execution timed out on Paiza.IO' }, { status: 500 });
    }

    // Step 3: Get execution details
    const detailResponse = await fetch(`${PAIZA_IO_API_BASE_URL}/get_details?id=${sessionId}&api_key=${PAIZA_IO_API_KEY}`);
    const detailData = await detailResponse.json();

    if (!detailResponse.ok || detailData.error) {
      console.error('Paiza.IO get_details error:', detailData.error || detailData);
      return NextResponse.json(
        { error: detailData.error || 'Failed to get details from Paiza.IO' },
        { status: detailResponse.status }
      );
    }

    // Format the response to match the frontend's expectation
    const formattedResult = {
      build_result: {
        stdout: detailData.build_stdout || '',
        stderr: detailData.build_stderr || '',
      },
      program_output: {
        stdout: detailData.stdout || '',
        stderr: detailData.stderr || '',
      },
      // 必要に応じて、time, memory, result などの詳細も追加できます
      // time: detailData.time,
      // memory: detailData.memory,
      // result: detailData.result, // 'success' or 'failure'
    };

    return NextResponse.json(formattedResult, { status: 200 });

  } catch (error) {
    // ここが、POST 関数全体の try ブロックに対応する catch ブロックです。
    console.error('Backend execution error:', error);
    return NextResponse.json({ error: 'Internal server error during code execution.' }, { status: 500 });
  }
}
