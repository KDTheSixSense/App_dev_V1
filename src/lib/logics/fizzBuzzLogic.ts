// app/lib/traceLogics.ts

// コンポーネントでも使う型定義は、共通のtypes.tsなどに分けるとさらに良いです
type VariablesState = Record<string, any>;

/**
 * VARIABLE_SWAP問題のロジックセット
 */
const variableSwapLogic = {
    traceLogic: [
        (vars: VariablesState) => ({ ...vars }), // 初期状態
        (vars: VariablesState) => ({ ...vars, x: 10 }),
        (vars: VariablesState) => ({ ...vars, y: 20 }),
        (vars: VariablesState) => ({ ...vars, z: vars.x }),
        (vars: VariablesState) => ({ ...vars, x: vars.y }),
        (vars: VariablesState) => ({ ...vars, y: vars.z }),
    ],
    // この問題に分岐ロジックは不要なので calculateNextLine は undefined
};

/**
 * ARRAY_SUM問題のロジックセット
 * (スクリーンショットに見えるロジックを参考にしました)
 */
const arraySumLogic = {
    traceLogic: [
        // ...各ステップごとの変数を更新する関数の配列...
    ],
    /**
     * 次に実行すべき行を計算する関数 (for文やif文の分岐で必要)
     * @param currentLine 現在の行番号 (0-indexed)
     * @param vars 現在の変数の状態
     * @returns 次の行番号
     */
    calculateNextLine: (currentLine: number, vars: VariablesState): number => {
        const i = vars.i as number;
        const inArray = vars.inArray as number[];

        switch (currentLine + 1) { // 1-indexedに変換して比較
            case 5: // iのfor文の実行後
                return i < inArray.length ? 5 : 8; // ループ継続なら5行目へ、終了なら8行目へ
            case 8: // 9行目(endfor)の実行後
                return i < inArray.length ? 5 : 8; // ループ継続なら5行目へ、終了なら8行目へ
            default:
                return currentLine + 1; // それ以外は次の行へ
        }
    }
};

// すべてのロジックセットを `logicType` をキーにしてまとめる
export const LOGIC_MAP = {
    'VARIABLE_SWAP': variableSwapLogic,
    'ARRAY_SUM': arraySumLogic,
    // 'FIZZ_BUZZ': fizzBuzzLogic, // 他の問題もここに追加
};

// 型を定義しておくと、より安全になります
export type LogicType = keyof typeof LOGIC_MAP;