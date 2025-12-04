// Ace Editor用のアノテーション型定義
export type Annotation = {
  row: number;
  column: number;
  text: string;
  type: 'error' | 'warning' | 'info';
};

/**
 * コードの構文チェックを行うAPIを呼び出します
 * @param code チェック対象のソースコード
 * @param language 言語ID (例: 'python')
 */
export async function lintCode(code: string, language: string): Promise<Annotation[]> {
  try {
    const response = await fetch('/api/lint_code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
    });

    if (!response.ok) {
      console.error('Lint API error:', await response.text());
      return [];
    }

    const data = await response.json();
    // APIから返ってきた annotations 配列を返す
    return data.annotations || [];
  } catch (error) {
    console.error('Lint API call failed:', error);
    return [];
  }
}