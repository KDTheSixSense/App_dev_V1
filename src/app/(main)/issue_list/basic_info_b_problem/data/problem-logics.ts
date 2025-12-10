/**
 * @file DBのlogicTypeと、対応するトレース関数をマッピングします。
 */
import { validateHeaderName } from 'http';
import type { VariablesState, TraceStep} from './problems'; // 修正: QueueItem をインポート

// 各ロジックの定義
const variableSwapLogic: { traceLogic: TraceStep[] } = {
  traceLogic: [
    (vars) => ({ ...vars, x: 1 }),
    (vars) => ({ ...vars, y: 2 }),
    (vars) => ({ ...vars, z: 3 }),
    (vars) => ({ ...vars, x: vars.y }),
    (vars) => ({ ...vars, y: vars.z }),
    (vars) => ({ ...vars, z: vars.x }),
    (vars) => vars,
  ],
};

const fizzBuzzLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
  traceLogic: [
    (vars) => vars,
    (vars) => ({ ...vars, result: null }),
    (vars) => vars,
    (vars) => ({ ...vars, result: "3と5で割り切れる" }),
    (vars) => vars,
    (vars) => ({ ...vars, result: "3で割り切れる" }),
    (vars) => vars,
    (vars) => ({ ...vars, result: "5で割り切れる" }),
    (vars) => vars,
    (vars) => ({ ...vars, result: "3でも5でも割り切れない" }),
    (vars) => vars,
    (vars) => vars,
  ],
  calculateNextLine: (currentLine, vars) => {
    const num = vars.num as number;
    if (num === null) return currentLine;
    switch (currentLine + 1) {
      case 3: return num % 15 === 0 ? 3 : 4;
      case 4: return 11;
      case 5: return num % 3 === 0 ? 5 : 6;
      case 6: return 11;
      case 7: return num % 5 === 0 ? 7 : 8;
      case 8: return 11;
      case 9: return 9;
      case 10: return 11;
      default: return currentLine + 1;
    }
  },
};

const arraySumLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        (vars) => ({ ...vars, in: [3, 2, 1, 6, 5, 4] }),
        (vars) => ({ ...vars, out: [] }),
        (vars) => ({ ...vars, i: null, tail: null }),
        (vars) => {
            const newOut = [...(vars.out as number[])];
            newOut.push((vars.in as number[])[0]);
            return { ...vars, out: newOut };
        },
        (vars) => {
            const i = vars.i as number | null;
            return i === null ? { ...vars, i: 2 } : vars;
        },
        (vars) => {
            const out = vars.out as number[];
            return { ...vars, tail: out[out.length - 1] };
        },
        (vars) => {
            const newOut = [...(vars.out as number[])];
            const i = vars.i as number;
            const valueToAdd = (vars.tail as number) + (vars.in as number[])[i - 1];
            newOut.push(valueToAdd);
            return { ...vars, out: newOut };
        },
        (vars) => {
            const i = vars.i as number;
            return { ...vars, i: i + 1 };
        },
        (vars) => vars,
    ],
    calculateNextLine: (currentLine, vars) => {
        const i = vars.i as number;
        const inArray = vars.in as number[];
        switch (currentLine + 1) {
            case 5: return i <= inArray.length ? 5 : 8;
            case 6: return 6;
            case 7: return 7;
            case 8: return i <= inArray.length ? 5 : 8;
            default: return currentLine + 1;
        }
    },
};

const gcdSubtractionLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState,variant: string | null) => number } = {
  traceLogic: [
    (vars) => vars, // 1: ○整数型: gcd(整数型: num1, 整数型: num2)
    (vars) => ({ ...vars, x: vars.num1 }), // 2: 整数型: x ← num1
    (vars) => ({ ...vars, y: vars.num2 }), // 3: 整数型: y ← num2
    (vars) => vars, // 4: [ a ] (while)
    (vars) => vars, // 5: if ( [ b ] )
    (vars) => ({ ...vars, x: (vars.x as number) - (vars.y as number) }), // 6: x ← x - y
    (vars) => vars, // 7: else
    (vars) => ({ ...vars, y: (vars.y as number) - (vars.x as number) }), // 8: y ← y - x
    (vars) => vars, // 9: endif
    (vars) => vars, // 10: [ c ] (endwhile)
    (vars) => vars, // 11: return x
  ],
  calculateNextLine: (currentLine, vars, variant) => {
    const x = vars.x as number;
    const y = vars.y as number;

    // variantが選択されていない場合は、トレースを進めない
    if (variant === null) {
      // num1, num2の初期化だけは許可する
      if (currentLine < 2) return currentLine + 1;
      return currentLine; // ロジックが選択されるまで待機
    }
    
    // -----------------------------------------------------------------
    // 選択肢「ア」のロジック: a: if, b: x < y, c: endif
    // -----------------------------------------------------------------
    if (variant === 'ア') {
      switch (currentLine) {
        case 0: return 1; // 1 -> 2
        case 1: return 2; // 2 -> 3
        case 2: return 3; // 3 -> 4 (if)
        case 3: // 4: if (x ≠ y)
          if (x === null || y === null) return 3;
          return (x !== y) ? 4 : 9; // -> 5 (if) or 10 (c: endif)
        case 4: // 5: if (x < y)
          return (x < y) ? 5 : 6; // -> 6 (x=x-y) or 7 (else)
        case 5: // 6: x ← x - y
          return 8; // -> 9 (endif)
        case 6: // 7: else
          return 7; // -> 8 (y=y-x)
        case 7: // 8: y ← y - x
          return 8; // -> 9 (endif)
        case 8: // 9: endif (inner)
          return 9; // -> 10 (c: endif)
        case 9: // 10: endif (outer)
          return 10; // -> 11 (return)
        default:
          return 99; // 終了
      }
    }

    // -----------------------------------------------------------------
    // 選択肢「イ」のロジック: a: if, b: x > y, c: endif
    // -----------------------------------------------------------------
    if (variant === 'イ') {
      switch (currentLine) {
        case 0: return 1;
        case 1: return 2;
        case 2: return 3;
        case 3: // 4: if (x ≠ y)
          if (x === null || y === null) return 3;
          return (x !== y) ? 4 : 9; // -> 5 (if) or 10 (c: endif)
        case 4: // 5: if (x > y)
          return (x > y) ? 5 : 6; // 「イ」のロジック
        case 5: return 8;
        case 6: return 7;
        case 7: return 8;
        case 8: return 9;
        case 9: return 10;
        default:
          return 99;
      }
    }

    // -----------------------------------------------------------------
    // 選択肢「ウ」のロジック: a: while, b: x < y, c: endwhile
    // -----------------------------------------------------------------
    if (variant === 'ウ') {
      switch (currentLine) {
        case 0: return 1;
        case 1: return 2;
        case 2: return 3;
        case 3: // 4: while (x ≠ y)
          if (x === null || y === null) return 3;
          return (x !== y) ? 4 : 10; // -> 5 (if) or 11 (return)
        case 4: // 5: if (x < y)
          return (x < y) ? 5 : 6; // 「ウ」のロジック
        case 5: return 8;
        case 6: return 7;
        case 7: return 8;
        case 8: return 9;
        case 9: // 10: endwhile
          return 3; // 4 (while) に戻る
        default:
          return 99;
      }
    }

    // -----------------------------------------------------------------
    // 選択肢「エ」のロジック (元のロジック)
    // -----------------------------------------------------------------
    if (variant === 'エ') {
      switch (currentLine) {
        case 0: return 1;
        case 1: return 2;
        case 2: return 3;
        case 3: // 4: while (x ≠ y)
          if (x === null || y === null) return 3;
          return (x !== y) ? 4 : 10;
        case 4: // 5: if (x > y)
          return (x > y) ? 5 : 6; // 「エ」のロジック
        case 5: return 8;
        case 6: return 7;
        case 7: return 8;
        case 8: return 9;
        case 9: // 10: endwhile
          return 3; // 4 (while) に戻る
        default:
          return 99;
      }
    }
    // デフォルト (variantが不明な場合)
    return currentLine;
  },
};

// =================================================================================
// --- 問5: 計算式の評価ロジック ---
// =================================================================================

// 選択肢ごとの計算ロジック定義
const expressionEvalStepLogics: Record<string, TraceStep> = {
    // ア: (x^2 + y^2) / √2
    'ア': (vars) => {
        const x = vars.x as number;
        const y = vars.y as number;
        const result = (Math.pow(x, 2) + Math.pow(y, 2)) / Math.pow(2, 0.5);
        return { ...vars, result };
    },
    // イ: (x^2 + y^2) / x^y
    'イ': (vars) => {
        const x = vars.x as number;
        const y = vars.y as number;
        // 0除算回避などを考慮しても良いが、ここでは単純実装
        const result = (Math.pow(x, 2) + Math.pow(y, 2)) / Math.pow(x, y);
        return { ...vars, result };
    },
    // ウ: 2^(√x) + 2^(√y)
    'ウ': (vars) => {
        const x = vars.x as number;
        const y = vars.y as number;
        const result = Math.pow(2, Math.pow(x, 0.5)) + Math.pow(2, Math.pow(y, 0.5));
        return { ...vars, result };
    },
    // エ: √((2^x)^y)
    'エ': (vars) => {
        const x = vars.x as number;
        const y = vars.y as number;
        const result = Math.pow(Math.pow(Math.pow(2, x), y), 0.5);
        return { ...vars, result };
    },
    // オ: √(x^2 + y^2)  ★正解
    'オ': (vars) => {
        const x = vars.x as number;
        const y = vars.y as number;
        const result = Math.pow(Math.pow(x, 2) + Math.pow(y, 2), 0.5);
        return { ...vars, result };
    },
    // カ: (x^2 * y^2) / x^y
    'カ': (vars) => {
        const x = vars.x as number;
        const y = vars.y as number;
        const result = (Math.pow(x, 2) * Math.pow(y, 2)) / Math.pow(x, y);
        return { ...vars, result };
    },
    // キ: (x^y) / √2
    'キ': (vars) => {
        const x = vars.x as number;
        const y = vars.y as number;
        const result = Math.pow(x, y) / Math.pow(2, 0.5);
        return { ...vars, result };
    },
    // デフォルト（正解と同じ挙動にしておく）
    'default': (vars) => {
        const x = vars.x as number;
        const y = vars.y as number;
        const result = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        return { ...vars, result };
    },
};

const expressionEvalLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
  traceLogic: [
    // 1行目: ○実数型: calc(実数型: x, 実数型: y)
    (vars) => vars,

    // 2行目: return [ ... ]
    (vars) => {
      // x, y がセットされていない場合は計算しない
      if (vars.x === null || vars.y === null) return vars;

      // 選択されたバリアントを取得 (ア〜キ)
      // ProblemClientでセットした _variant を参照
      const variant = (vars._variant as string) || 'オ'; 

      const stepFunc = expressionEvalStepLogics[variant] || expressionEvalStepLogics['default'];
      return stepFunc(vars);
    },
  ],
  
  // 行制御: データがなければ進まない、計算したら終了
  calculateNextLine: (currentLine, vars) => {
      if (vars.x === null || vars.y === null) return currentLine;
      
      switch (currentLine) {
          case 0: return 1;  // 1行目 -> 2行目
          case 1: return 99; // 2行目(計算) -> 終了
          default: return 99;
      }
  }
};

// 8ビットの2進数文字列に変換
const toBin8 = (num: number): string => num.toString(2).padStart(8, '0');
// 8ビットの2進数文字列を数値に変換 (符号なし)
const fromBin = (bin: string): number => parseInt(bin, 2);

// 各選択肢のロジック (6行目/インデックス5)
const bitReverseStepLogics: Record<string, TraceStep> = {
    'ア': (vars) => {
        const rNum = fromBin(vars.r as string);
        const rbyteNum = fromBin(vars.rbyte as string);
        const newRNum = (rNum << 1) | (rbyteNum & 1);
        const newRbyteNum = rbyteNum >> 1;
        return {
            ...vars,
            r: toBin8(newRNum & 0xFF), // 8ビットマスク
            rbyte: toBin8(newRbyteNum),
        };
    },
    'イ': (vars) => {
        const rNum = fromBin(vars.r as string);
        const rbyteNum = fromBin(vars.rbyte as string);
        const newRNum = (rNum << 7) | (rbyteNum & 1); // << 7
        const newRbyteNum = rbyteNum >> 7; // >> 7
        return {
            ...vars,
            r: toBin8(newRNum & 0xFF), 
            rbyte: toBin8(newRbyteNum),
        };
    },
    'ウ': (vars) => {
        const rbyteNum = fromBin(vars.rbyte as string);
        const newRNum = ((rbyteNum << 1) & 0xFF) | (rbyteNum >> 7); // (rbyte << 1) ∨ (rbyte >> 7)
        const newRbyte = newRNum; // rbyte ← r
        return {
            ...vars,
            r: toBin8(newRNum),
            rbyte: toBin8(newRbyte),
        };
    },
    'エ': (vars) => {
        const rbyteNum = fromBin(vars.rbyte as string);
        const newRNum = (rbyteNum >> 1) | ((rbyteNum << 7) & 0xFF); // (rbyte >> 1) ∨ (rbyte << 7)
        const newRbyte = newRNum; // rbyte ← r
        return {
            ...vars,
            r: toBin8(newRNum),
            rbyte: toBin8(newRbyte),
        };
    },
    'default': (vars) => vars, // ロジックが選択されていない場合
};

// 固定のトレースステップ
const staticBitReverseTraceLogic: TraceStep[] = [
    (vars) => vars, // 1: ○8ビット型: rev(...)
    (vars) => ({ ...vars, rbyte: vars.byte }), // 2: rbyte ← byte
    (vars) => ({ ...vars, r: '00000000' }), // 3: r ← 00000000
    (vars) => vars, // 4: 整数型: i
    (vars) => { // 5: for (i を 1 から 8 まで...)
        if (vars.i === null) return { ...vars, i: 1 };
        return vars;
    },
    (vars) => vars, // 6: [ ] (ここは動的ステップで上書き)
    (vars) => { // 7: endfor
        const currentI = vars.i as number;
        return { ...vars, i: currentI + 1 };
    },
    (vars) => vars, // 8: return r
];

const bitReverseLogic: { 
    getTraceStep: (line: number, variant: string | null) => TraceStep;
    calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number 
} = {
    // getTraceStep: variantに応じて、実行するべき関数(TraceStep)を返す
    getTraceStep: (line, variant) => {
        if (line === 5) { // 6行目 (インデックス5) の処理を要求された場合
            // variant（'ア'など）に応じた関数を返す
            return bitReverseStepLogics[variant || 'default'] || bitReverseStepLogics['default'];
        }
        // それ以外の行は、静的な定義から関数を返す
        return staticBitReverseTraceLogic[line] || ((vars) => vars);
    },
    // calculateNextLine: 次にジャンプすべき行番号を返す
    calculateNextLine: (currentLine, vars, variant) => {
        // variantが選択されていない場合は、トレースを進めない
        if (variant === null) {
            if (currentLine < 4) return currentLine + 1; // 5行目(for)の手前までは許可
            return currentLine; // ロジックが選択されるまで待機
        }

        const i = vars.i as number | null;
        if (i === null && currentLine < 4) return currentLine + 1; // 初期化が終わるまで待機
        if (i === null && currentLine >= 4) return currentLine; // iが初期化されるのを待つ (5行目)

        switch (currentLine) {
            case 4: // for文(5行目)の評価
                return i! <= 8 ? 5 : 7; // ループ継続なら6行目(本体)へ、終了なら8行目(return)へ
            case 5: // ループ本体(6行目)の実行後
                return 6; // 7行目(endfor)へ
            case 6: // endfor(7行目)の実行後
                return 4; // 5行目(for)の評価に戻る
            case 7: // 8行目(return)
                return 99; // 終了
            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問7: 再帰階乗ロジック ---
// =================================================================================

// 5行目: return [ ... ] の詳細ロジック
const recursiveFactorialStepLogics: Record<string, TraceStep> = {
    // ア: (n - 1) * factorial(n) -> nが変わらないので無限ループ
    'ア': (vars) => {
        const currentN = vars.current_n as number;
        const result = vars.result as number;
        return {
            ...vars,
            // 係数(n-1)を掛けるが、再帰引数(n)は減らない
            result: result * (currentN - 1), 
            current_n: currentN // nはそのまま（無限再帰）
        };
    },
    // イ: factorial(n - 1) -> nを掛けていない
    'イ': (vars) => {
        const currentN = vars.current_n as number;
        return {
            ...vars,
            // resultには何も掛けない
            current_n: currentN - 1 
        };
    },
    // ウ: n -> 再帰しない
    'ウ': (vars) => {
        return { ...vars, result: vars.current_n }; // 現在のnを返すだけ
    },
    // エ: n * (n - 1) -> 再帰しない
    'エ': (vars) => {
        const n = vars.current_n as number;
        return { ...vars, result: n * (n - 1) };
    },
    // オ: n * factorial(1) -> 次のnがいきなり1になる
    'オ': (vars) => {
        const currentN = vars.current_n as number;
        const result = vars.result as number;
        return {
            ...vars,
            result: result * currentN,
            current_n: 1 // 次の呼び出し引数は固定で 1
        };
    },
    // カ: n * factorial(n - 1) -> 正解
    'カ': (vars) => {
        const currentN = vars.current_n as number;
        const result = vars.result as number;
        return {
            ...vars,
            result: result * currentN, // n を掛ける
            current_n: currentN - 1    // 次は n-1
        };
    },
    'default': (vars) => vars,
};

const recursiveFactorialLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
  traceLogic: [
    (vars) => vars, // 1: ○整数型: factorial(整数型: n)
    (vars) => vars, // 2: if (n = 0)
    (vars) => vars, // 3: return 1
    (vars) => vars, // 4: endif
    
    // 5: return [ ... ]
    (vars) => { 
        if (vars.current_n === null) return vars;
        const variant = (vars._variant as string) || 'カ'; // デフォルトは正解
        const stepFunc = recursiveFactorialStepLogics[variant] || recursiveFactorialStepLogics['default'];
        return stepFunc(vars);
    },
  ],

  calculateNextLine: (currentLine, vars, variant) => {
      // 初期化待ち
      if (vars.current_n === null) return currentLine;

      const currentN = vars.current_n as number;
      const selectedVariant = variant || 'カ';

      // 0-indexedの行番号で分岐
      switch (currentLine) {
          case 0: return 1; // 1行目 -> 2行目
          
          case 1: // 2行目 if (n = 0) の評価
              // n=0 ならベースケース(Line 3)へ。そうでなければ Line 5へ（Line 4のendifはスキップ扱いで5へ）
              return currentN === 0 ? 2 : 4; 
          
          case 2: // 3行目 return 1
              return 99; // 終了
          
          case 3: // 4行目 endif
              return 4;

          case 4: // 5行目 return [ ... ] の実行後
              // ここで再帰するか、終了するかをVariantによって変える
              
              // ウ(n) と エ(n*(n-1)) は再帰呼び出しがないため、ここで終了
              if (['ウ', 'エ'].includes(selectedVariant)) {
                  return 99;
              }
              
              // それ以外（ア, イ, オ, カ）は再帰呼び出しがあるので、
              // 関数頭（Line 2: if文の判定）に戻る
              // ※実際にはスタックに積まれるが、この簡易シミュレータではループで表現
              return 1; 

          default:
              return 99;
      }
  },
};
// 優先度付きキューの要素の型定義
type QueueItem = { value: string; prio: number };

const _dequeue = (queue: QueueItem[]) => {
    if (queue.length === 0) return { newQueue: [], dequeuedValue: null };
    const highestPrio = Math.min(...queue.map(item => item.prio));
    const indexToRemove = queue.findIndex(item => item.prio === highestPrio);
    const dequeuedValue = queue[indexToRemove].value;
    const newQueue = queue.filter((_, index) => index !== indexToRemove);
    return { newQueue, dequeuedValue };
};

const priorityQueueLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: Array(17).fill((vars:VariablesState) => vars),
    calculateNextLine: (currentLine, vars) => {
        const lineNum = currentLine + 1; // Convert 0-indexed to 1-indexed line number
        
        switch(lineNum) {
            case 2: vars.queue = []; vars.output = []; break;
            case 3: vars.queue.push({ value: 'A', prio: 1 }); break;
            case 4: vars.queue.push({ value: 'B', prio: 2 }); break;
            case 5: vars.queue.push({ value: 'C', prio: 2 }); break;
            case 6: vars.queue.push({ value: 'D', prio: 3 }); break;
            case 7: vars.queue = _dequeue(vars.queue).newQueue; break;
            case 8: vars.queue = _dequeue(vars.queue).newQueue; break;
            case 9: vars.queue.push({ value: 'D', prio: 3 }); break;
            case 10: vars.queue.push({ value: 'B', prio: 2 }); break;
            case 11: vars.queue = _dequeue(vars.queue).newQueue; break;
            case 12: vars.queue = _dequeue(vars.queue).newQueue; break;
            case 13: vars.queue.push({ value: 'C', prio: 2 }); break;
            case 14: vars.queue.push({ value: 'A', prio: 1 }); break;
            case 15: // while
                return vars.queue.length > 0 ? 15 : 17; // -> 16 or 18 (end)
            case 16: { // dequeue and output
                const { newQueue, dequeuedValue } = _dequeue(vars.queue);
                vars.queue = newQueue;
                vars.output.push(dequeuedValue);
                return 14; // loop back to while
            }
            case 17: // endwhile
                return 99; // end
        }
        return currentLine + 1;
    },
};

const binaryTreeTraversalLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    // traceLogicは各行の実行に対応する変数の更新のみを行う
    traceLogic: [
      /* 0-3 */ (vars) => vars, (vars) => vars, (vars) => vars, (vars) => vars,
      /* 4: ○order(n) */
      (vars) => {
        const stack = vars.callStack as any[];
        const frame = stack.length > 0 ? stack[stack.length - 1] : null;
        return frame ? { ...vars, currentNode: frame.n } : vars;
      },
      /* 5: if */ (vars) => vars,
      /* 6: order(left) */ (vars) => vars,
      /* 7: nを出力 */ 
      (vars) => {
        const frame = (vars.callStack as any[])[vars.callStack.length - 1];
        return { ...vars, output: [...vars.output, frame.n] };
      },
      /* 8: order(right) */ (vars) => vars,
      /* 9: elseif */ (vars) => vars,
      /* 10: order(left) */ (vars) => vars,
      /* 11: nを出力 */ 
      (vars) => {
        const frame = (vars.callStack as any[])[vars.callStack.length - 1];
        return { ...vars, output: [...vars.output, frame.n] };
      },
      /* 12: else */ (vars) => vars,
      /* 13: nを出力 */ 
      (vars) => {
        const frame = (vars.callStack as any[])[vars.callStack.length - 1];
        return { ...vars, output: [...vars.output, frame.n] };
      },
      /* 14: endif */ (vars) => vars,
    ],

    // calculateNextLineが実行フローの全てを制御する
    calculateNextLine(currentLine, vars) {
      let stack = (vars.callStack || []) as { n: number, pc: number }[];
      const tree = vars.tree as number[][];
  
      // --- 初期化 ---
      if (currentLine === 0 && stack.length === 0) {
        vars.callStack = [{ n: 1, pc: 5 }]; // 最初の呼び出し order(1)
        vars.output = [];
        return 4; // 最初の実行行 (5行目) のインデックス
      }
  
      if (stack.length === 0) return 99; // トレース終了
  
      let frame = stack[stack.length - 1];
      const children = tree[frame.n - 1] || [];
      let nextLine = frame.pc;
  
      switch (frame.pc) {
        case 5: // 5: ○order(整数型: n)
          frame.pc = 6;
          nextLine = 6;
          break;
        case 6: // 6: if (tree[n]の要素数 が 2 と等しい)
          nextLine = (children.length === 2) ? 7 : 10;
          frame.pc = nextLine;
          break;
        case 7: // 7: order(tree[n][1])
          frame.pc = 8; // この関数に戻ってきたら、次は8行目
          stack.push({ n: children[0], pc: 5 }); // 左の子を呼び出す
          nextLine = 5; // 新しい呼び出しの開始行(5行目)
          break;
        case 8: // 8: nを出力
          frame.pc = 9;
          nextLine = 9;
          break;
        case 9: // 9: order(tree[n][2])
          frame.pc = 15; // 戻り先は15行目
          stack.push({ n: children[1], pc: 5 }); // 右の子を呼び出す
          nextLine = 5;
          break;
        case 10: // 10: elseif (tree[n]の要素数 が 1 と等しい)
          nextLine = (children.length === 1) ? 11 : 13;
          frame.pc = nextLine;
          break;
        case 11: // 11: order(tree[n][1])
          frame.pc = 12; // 戻り先
          stack.push({ n: children[0], pc: 5 }); // 左の子を呼び出し
          nextLine = 5;
          break;
        case 12: // 12: nを出力
          frame.pc = 15;
          nextLine = 15;
          break;
        case 13: // 13: else
          frame.pc = 14;
          nextLine = 14;
          break;
        case 14: // 14: nを出力
          frame.pc = 15;
          nextLine = 15;
          break;
        case 15: // 15: endif (関数の終わり)
          stack.pop(); // 現在の関数呼び出しを終了
          if (stack.length > 0) {
            let parentFrame = stack[stack.length - 1];
            nextLine = parentFrame.pc; // 親の処理に戻る
          } else {
            nextLine = 99; // 全ての処理が終了
          }
          break;
        default:
          nextLine = 99;
      }
  
      vars.callStack = stack;
      return nextLine -1; // 0-indexedに変換して返す
    },
};

// リンクリストの削除ロジック 未完成なので後で修正入れる
const linkedListDeleteStepLogics: Record<string, TraceStep> = {
    'ア': (vars) => { // prev.next ← listHead
        const newListData = (vars.listData as any[]).map(item => ({...item})); // ディープコピー
        if (vars.prev !== null) newListData[vars.prev as number].next = vars.listHead;
        return { ...vars, listData: newListData };
    },
    'イ': (vars) => { // prev.next ← listHead.next
        const newListData = (vars.listData as any[]).map(item => ({...item}));
        const listHeadNode = newListData[vars.listHead as number];
        if (vars.prev !== null) newListData[vars.prev as number].next = listHeadNode.next;
        return { ...vars, listData: newListData };
    },
    'ウ': (vars) => { // prev.next ← listHead.next.next
        const newListData = (vars.listData as any[]).map(item => ({...item}));
        const listHeadNode = newListData[vars.listHead as number];
        const listHeadNextNode = listHeadNode.next !== null ? newListData[listHeadNode.next] : null;
        if (vars.prev !== null) newListData[vars.prev as number].next = listHeadNextNode ? listHeadNextNode.next : null;
        return { ...vars, listData: newListData };
    },
    'エ': (vars) => { // prev.next ← prev
        const newListData = (vars.listData as any[]).map(item => ({...item}));
        if (vars.prev !== null) newListData[vars.prev as number].next = vars.prev; // 自己参照
        return { ...vars, listData: newListData };
    },
    'オ': (vars) => { // prev.next ← prev.next
        // 何もしない (prev.next は prev.next のまま)
        return vars;
    },
    'カ': (vars) => { // prev.next ← prev.next.next (正解)
        const newListData = (vars.listData as any[]).map(item => ({...item})); // ディープコピー
        if (vars.prev === null) return vars;
        const prevNode = newListData[vars.prev as number];
        const nodeToDelete = prevNode.next !== null ? newListData[prevNode.next] : null;
        if (nodeToDelete) {
            prevNode.next = nodeToDelete.next; // 削除対象の次を指す
        }
        return { ...vars, listData: newListData };
    },
    'default': (vars) => vars, // ロジック未選択
};

// 静的なトレースステップ (line 14 / index 13 以外)
const staticLinkedListDeleteTraceLogic: TraceStep[] = [
    /* 0: Line 1 */ (vars) => vars,
    /* 1: Line 2 */ (vars) => vars,
    /* 2: Line 3 */ (vars) => vars, // ○delNode
    /* 3: Line 4 */ (vars) => ({ ...vars, prev: null }),
    /* 4: Line 5 */ (vars) => ({ ...vars, i: null }),
    /* 5: Line 6 */ (vars) => vars, // if (pos == 1)
    /* 6: Line 7 */ (vars) => { // listHead ← listHead.next
        const listData = vars.listData as any[];
        const listHead = vars.listHead as number;
        return { ...vars, listHead: listData[listHead].next };
    },
    /* 7: Line 8 */ (vars) => vars, // else
    /* 8: Line 9 */ (vars) => ({ ...vars, prev: vars.listHead }),
    /* 9: Line 10 */ (vars) => vars, // comment
    /* 10: Line 11 */ (vars) => { // for
        if (vars.i === null) return { ...vars, i: 2 }; // iの初期化
        return { ...vars, i: (vars.i as number) + 1 }; // iのインクリメント
    },
    /* 11: Line 12 */ (vars) => { // prev <- prev.next
        const listData = vars.listData as any[];
        const prev = vars.prev as number;
        return { ...vars, prev: listData[prev].next };
    },
    /* 12: Line 13 */ (vars) => vars, // endfor
    /* 13: Line 14 */ (vars) => vars, // [ ] (動的ステップで上書き)
    /* 14: Line 15 */ (vars) => vars, // endif
];

// 問10のロジック本体
const linkedListDeleteLogic: { 
    getTraceStep: (line: number, variant: string | null) => TraceStep;
    calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number 
} = {
    getTraceStep: (line, variant) => {
        if (line === 13) { // 14行目 [ ] の処理
            return linkedListDeleteStepLogics[variant || 'default'] || linkedListDeleteStepLogics['default'];
        }
        return staticLinkedListDeleteTraceLogic[line] || ((vars) => vars);
    },

    calculateNextLine: (currentLine, vars, variant) => {
        // プリセットが選択されるまで待機
        if (vars.listData === null || vars.pos === null) {
            if (currentLine < 2) return currentLine + 1; // 3行目(○delNode)の手前までは許可
            return currentLine;
        }
        
        // 14行目 [ ] を実行する場合は、ロジックが選択されているかチェック
        // (line 12 -> 13 -> 14 の流れなので、line 12 (endfor) の時点でチェック)
        if (currentLine === 12 && !variant) {
            return currentLine; // ロジックが選択されるまで待機
        }
        // 14行目(index 13)の実行後
        if (currentLine === 13) {
            return 14; // -> 15 (endif)
        }

        const pos = vars.pos as number;
        const i = vars.i as number;

        switch (currentLine) {
            case 0: return 1;
            case 1: return 2;
            case 2: return 3; // Line 3 -> 4
            case 3: return 4; // Line 4 -> 5
            case 4: return 5; // Line 5 -> 6 (if)
            case 5: // Line 6: if (pos == 1)
                return (pos === 1) ? 6 : 7; // -> 7 (listHead=) or 8 (else)
            case 6: // Line 7: listHead <- ...
                return 14; // -> 15 (endif)
            case 7: // Line 8: else
                return 8; // -> 9 (prev=)
            case 8: // Line 9: prev <- listHead
                return 9; // -> 10 (comment)
            case 9: // Line 10: comment
                return 10; // -> 11 (for)
            case 10: // Line 11: for
                const loopVar = (i === null) ? 2 : i; // iの初期化(i=2)
                return (loopVar <= pos - 1) ? 11 : 12; // -> 12 (loop body) or 13 (endfor)
            case 11: // Line 12: prev <- prev.next
                return 10; // -> 11 (for - iのインクリメント)
            case 12: // Line 13: endfor
                // ロジックが選択されているか、ここで最終チェック
                if (!variant) return 12; // 待機
                return 13; // -> 14 ([ ])
            case 14: // Line 15: endif
                return 99; // 終了
            default:
                return currentLine + 1;
        }
    },
};

const binSortLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 1 */ (vars) => vars,
        /* 2 */ (vars) => ({ ...vars, n: (vars.data as any[]).length }),
        // ✅【修正点】binsのサイズをハードコードせず、nの値から動的に生成する
        /* 3 */ (vars) => ({ ...vars, bins: new Array(vars.n as number).fill(null) }),
        /* 4 */ (vars) => ({ ...vars, i: 1 }),
        /* 5 */ (vars) => vars, // for ループの条件判定 (変数変更なし)
        /* 6 */ (vars) => {
            const newBins = [...(vars.bins as any[])];
            const data = vars.data as number[];
            const i = vars.i as number;
            const value = data[i - 1]; // 配列のインデックスは0から
            // 値がbins配列の範囲内にあるかチェック（安全対策）
            if (value > 0 && value <= newBins.length) {
              newBins[value - 1] = value; // 配列のインデックスは0から
            }
            return { ...vars, bins: newBins };
        },
        /* 7 */ (vars) => ({ ...vars, i: (vars.i as number) + 1 }), // endfor (iのインクリメント)
        /* 8 */ (vars) => vars, // return
    ],
    calculateNextLine(currentLine, vars) {
        // ✅【追加点】データが選択されるまでトレースを開始しない
        if (vars.data === null) {
            return currentLine;
        }

        const lineNum = currentLine + 1; // 1-indexedの行番号
        
        switch (lineNum) {
            case 1: return 1; // -> 2
            case 2: return 2; // -> 3
            case 3: return 3; // -> 4
            case 4: return 4; // -> 5 (forループ条件へ)
            case 5: // forループ条件
                return (vars.i as number) <= (vars.n as number) ? 5 : 7; // -> 6 (本体) or 8 (終了後)
            case 6: // ループ本体実行後
                return 6; // -> 7 (endfor)
            case 7: // endfor (i++が実行される)
                return 4; // -> 5 (ループ条件へ戻る)
            case 8: // return
                return 99; // 終了
            default:
                return 99;
        }
    },
};


// =================================================================================
// --- 問12: 類似度計算ロジック ---
// =================================================================================
const similarityRatioLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
    // traceLogicは変数の更新のみを担当
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => ({ ...vars, i: 1, cnt: 0, result: null }), // 初期化
        /* 2: Line 3 */ (vars) => vars, // if
        /* 3: Line 4 */ (vars) => ({ ...vars, result: -1 }), // return -1
        /* 4: Line 5 */ (vars) => vars, // endif
        /* 5: Line 6 */ (vars) => vars, // for (条件判定のみ)
        /* 6: Line 7 */ (vars) => vars, // if (条件判定のみ)
        /* 7: Line 8 */ (vars) => ({ ...vars, cnt: (vars.cnt as number) + 1 }), // cnt++
        /* 8: Line 9 */ (vars) => vars, // endif
        /* 9: Line 10 */(vars) => ({ ...vars, i: (vars.i as number) + 1 }), // endfor (i++)
        /* 10: Line 11*/(vars) => {
            const s1 = vars.s1 as string[];
            const cnt = vars.cnt as number;
            return { ...vars, result: cnt / s1.length };
        },
    ],

    // calculateNextLineでフロー制御と条件分岐を行う
    calculateNextLine(currentLine, vars, variant) {
        // データ未選択時は待機
        if (vars.s1 === null || vars.s2 === null) {
             if (currentLine < 1) return currentLine + 1;
             return currentLine;
        }

        const lineNum = currentLine + 1; // 1-based line number for switch
        const s1 = vars.s1 as string[];
        const s2 = vars.s2 as string[];
        const i = vars.i as number;
        const cnt = vars.cnt as number;
        // デフォルトは正解のエ
        const selectedVariant = variant || 'エ'; 

        switch (lineNum) {
            case 2: // Line 2: 初期化完了後 -> Line 3
                return 2; 
            
            case 3: // Line 3: if (s1の要素数 ≠ s2の要素数)
                return s1.length !== s2.length ? 3 : 5; // -> Line 4 (return -1) or Line 6 (for)
            
            case 4: // Line 4: return -1
                return 99; // 終了
            
            case 5: // Line 5: endif (ここには来ないはずだが念のため)
                return 5; // -> Line 6

            case 6: // Line 6: for (i を 1 から s1の要素数 まで)
                // iが初期化前(null)なら初期化ステップ(Line 2)に戻すか、ここで判定
                // ※traceLogicでLine 2で初期化済みのはず
                return (i <= s1.length) ? 6 : 10; // -> Line 7 (body) or Line 11 (return result)

            case 7: // Line 7: if ([ ? ])
                let isMatch = false;
                // 配列は0-basedなのでインデックスを調整
                const idx1 = i - 1; 
                const idx2_i = i - 1; 
                // cntは個数(0〜)だが、ウ・アの選択肢ではインデックスとして使われているため
                // そのまま使う (ただし範囲外アクセスの可能性あり)
                const idx2_cnt = cnt; 

                if (selectedVariant === 'ア') { // s1[i] ≠ s2[cnt]
                    // cntがs2の範囲外の場合はundefinedとの比較になる(JSの挙動)
                    isMatch = s1[idx1] !== s2[idx2_cnt];
                } else if (selectedVariant === 'イ') { // s1[i] ≠ s2[i]
                    isMatch = s1[idx1] !== s2[idx2_i];
                } else if (selectedVariant === 'ウ') { // s1[i] = s2[cnt]
                    isMatch = s1[idx1] === s2[idx2_cnt];
                } else { // エ (正解): s1[i] = s2[i]
                    isMatch = s1[idx1] === s2[idx2_i];
                }

                return isMatch ? 7 : 8; // True: Line 8 (cnt++), False: Line 9 (endif)

            case 8: // Line 8: cnt++ 完了後
                return 8; // -> Line 9

            case 9: // Line 9: endif
                return 9; // -> Line 10 (endfor)

            case 10: // Line 10: endfor (i++)
                return 5; // -> Line 6 (loop check)

            case 11: // Line 11: return result
                return 99; // 終了

            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問14: 5数要約 (summarize -> findRank 順) ---
// =================================================================================
const fiveNumberSummaryLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: Line 1 (summarize def) */ (vars) => vars,
        /* 1: Line 2 (rankData init) */ (vars) => ({ ...vars, rankData: [] }),
        /* 2: Line 3 (p init) */        (vars) => ({ ...vars, p: [0, 0.25, 0.5, 0.75, 1] }),
        /* 3: Line 4 (i decl) */        (vars) => vars,
        /* 4: Line 5 (for loop) */      (vars) => {
            if (vars.i === null) return { ...vars, i: 1 };
            return vars;
        },
        
        /* 5: Line 6 (call & append) */ (vars) => {
            // ▼ 戻り時 (isReturning=true) の処理
            if (vars.isReturning) {
                const val = vars.findRank_ret as number;
                return {
                    ...vars,
                    // rankDataに値を追加
                    rankData: [...(vars.rankData as number[]), val],
                    isReturning: false, // フラグを戻す
                    findRank_ret: null,
                    // UI上の findRank (i) をクリアして見やすくする
                    findRank: null,
                    current_p: null
                };
            }
            // ▼ 呼び出し時 (isReturning=false) の処理
            else {
                const i = vars.i as number;
                const p = vars.p as number[];
                const val = p[i - 1];
                return { 
                    ...vars, 
                    current_p: val,
                    // ★修正: 関数呼び出し時に引数 p の値を表示する
                    findRank: `p: ${val}` 
                };
            }
        },
        
        /* 6: Line 7 (endfor) */        (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
        /* 7: Line 8 (return) */        (vars) => vars,
        /* 8: Line 9 (blank) */         (vars) => vars,
        
        /* 9: Line 10 (findRank def) */ (vars) => vars,
        /* 10: Line 11 (i decl) */      (vars) => vars,
        
        /* 11: Line 12 (calc i) */      (vars) => {
            const sortedData = vars.sortedData as number[];
            const p = vars.current_p as number;
            // i ← ceil((N - 1) * p)
            const idx = Math.ceil((sortedData.length - 1) * p);
            
            return { 
                ...vars, 
                // ★修正1: 表示用に "p: 値, i: 値" の形式の文字列をセット
                findRank: `p: ${p}, i: ${idx}`,
                
                // ★修正2: 次の行の計算用に、数値のインデックスを隠し変数に保存
                _calc_i: idx 
            };
        },        
        /* 12: Line 13 (return val) */  (vars) => {
            const sortedData = vars.sortedData as number[];

            const idx = vars._calc_i as number;
            
            return { 
                ...vars, 
                findRank_ret: sortedData[idx],
                isReturning: true 
            };
        },
    ],

    calculateNextLine(currentLine, vars) {
        if (vars.sortedData === null) return currentLine;

        const lineNum = currentLine + 1; // 1-based

        switch (lineNum) {
            // --- summarize ---
            case 5: // Line 5: for (i ...)
                const i = vars.i as number || 1;
                const p = vars.p as number[];
                // iが要素数以下ならループ継続(Line 6へ)、そうでなければ終了(Line 8へ)
                return (i <= p.length) ? 5 : 7; 

            case 6: // Line 6: rankData.append( findRank(...) )
                if (vars.isReturning) {
                    // 戻ってきた後 -> Line 7 (endfor)
                    return 6; 
                } else {
                    // これから呼び出す -> Line 10 (findRank def)
                    return 9; 
                }

            case 7: // Line 7: endfor
                return 4; // -> Line 5 (Loop check)

            case 8: // Line 8: return rankData
                return 99; // End

            // --- findRank ---
            case 10: return 10; // def -> decl
            case 11: return 11; // decl -> calc
            case 12: return 12; // calc -> return
            case 13: // Line 13: return ...
                // 呼び出し元に戻る (Line 6)
                return 5; 

            default:
                return currentLine + 1;
        }
    },
};


const binarySearchLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    // 各行の実行に対応する変数更新ロジック
    traceLogic: [
        /* 1 */ (vars) => vars,
        /* 2 */ (vars) => vars,
        /* 3 */ (vars) => vars,
        /* 4 */ (vars) => ({ ...vars, low: 1 }),
        /* 5 */ (vars) => ({ ...vars, high: (vars.data as number[]).length }),
        /* 6 */ (vars) => vars,
        /* 7 */ (vars) => vars, // while の評価は calculateNextLine で行う
        /* 8 */ (vars) => ({ ...vars, middle: Math.floor(((vars.low as number) + (vars.high as number)) / 2) }),
        /* 9 */ (vars) => vars, // if の評価は calculateNextLine で行う
        /* 10 */(vars) => ({ ...vars, low: vars.middle }), // 問題文のバグを再現
        /* 11 */(vars) => vars, // elseif の評価は calculateNextLine で行う
        /* 12 */(vars) => ({ ...vars, high: vars.middle }), // 問題文のバグを再現
        /* 13 */(vars) => vars, // else
        /* 14 */(vars) => ({ ...vars, result: vars.middle }),
        /* 15 */(vars) => vars, // endif
        /* 16 */(vars) => vars, // endwhile
        /* 17 */(vars) => vars,
        /* 18 */(vars) => ({ ...vars, result: -1 }),
    ],
    // 次に実行すべき行番号を計算するロジック
    calculateNextLine(currentLine, vars) {
        // データが選択されていない場合は進まない
        if (vars.data === null || vars.target === null) {
            return currentLine;
        }

        const { low, high, middle, data, target } = vars;

        // 0-indexedの行番号で処理
        switch (currentLine) {
            case 6: // 7行目: while の評価
                return (low as number) <= (high as number) ? 7 : 17; // -> 8行目 or 18行目

            case 7: // 8行目: middle計算後 -> 9行目へ
                return 8;

            case 8: // 9行目: if の評価
                const middleValue = (data as number[])[(middle as number) - 1];
                if (middleValue < (target as number)) {
                    return 9; // -> 10行目
                } else if (middleValue > (target as number)) {
                    return 10; // -> 11行目
                } else {
                    return 12; // -> 13行目
                }

            case 9: // 10行目: low更新後 -> 16行目(endwhile)へ
                return 15;

            case 10: // 11行目: elseif の評価
                const middleValueElse = (data as number[])[(middle as number) - 1];
                return (middleValueElse > (target as number)) ? 11 : 12; // -> 12行目 or 13行目

            case 11: // 12行目: high更新後 -> 16行目(endwhile)へ
                return 15;
            
            case 12: // 13行目: else の後 -> 14行目へ
                return 13;

            case 13: // 14行目: return 後 -> 終了
                return 99; // 99など大きな値を返してトレースを終了させる

            case 15: // 16行目: endwhile の後 -> ループ先頭(7行目)へ
                return 6;
            
            case 17: // 18行目: return -1 の後 -> 終了
                return 99;

            // 初期化フェーズやその他の行
            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問16: UTF-8エンコードロジック ---
// =================================================================================

// 除数を計算するヘルパー関数
const getUtf8Divisor = (variant: string | null, i: number): number => {
    const v = variant || 'ク'; // デフォルトは正解の'ク'
    switch (v) {
        case 'ア': return (4 - i) * 2;
        case 'イ': return Math.pow(2, 4 - i);
        case 'ウ': return Math.pow(2, i);
        case 'エ': return i * 2;
        case 'オ': return 2;
        case 'カ': return 6;
        case 'キ': return 16;
        case 'ク': return 64; // 正解
        case 'ケ': return 256;
        default: return 64;
    }
};

const utf8EncodeLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => vars,
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => ({ ...vars, utf8Bytes: [224, 128, 128] }),
        /* 4: Line 5 */ (vars) => ({ ...vars, cp: vars.codePoint }),
        /* 5: Line 6 */ (vars) => ({ ...vars, i: null }), // iの宣言
        /* 6: Line 7 */ (vars) => { // for loop init
            if (vars.i === null) return { ...vars, i: 3 }; // 初期値3 (utf8Bytesの要素数)
            return vars;
        },
        
        /* 7: Line 8: utf8Bytes[i] ← ... + (cp % divisor) */
        (vars) => {
            const i = vars.i as number;
            const cp = vars.cp as number;
            const variant = vars._variant as string;
            
            // 除数を計算
            let divisor = getUtf8Divisor(variant, i);
            if (divisor === 0) divisor = 1; // 0除算回避

            const currentBytes = [...(vars.utf8Bytes as number[])];
            // iは1-basedなので -1
            currentBytes[i - 1] += cp % divisor;
            
            return { ...vars, utf8Bytes: currentBytes };
        },
        
        /* 8: Line 9: cp ← cp / divisor */
        (vars) => {
            const i = vars.i as number;
            const cp = vars.cp as number;
            const variant = vars._variant as string;
            
            let divisor = getUtf8Divisor(variant, i);
            if (divisor === 0) divisor = 1;

            return { ...vars, cp: Math.floor(cp / divisor) };
        },
        
        /* 9: Line 10: endfor */
        (vars) => ({ ...vars, i: (vars.i as number) - 1 }), // iを減らす
        
        /* 10: Line 11: return */
        (vars) => vars,
    ],

    calculateNextLine(currentLine, vars, variant) {
        if (vars.codePoint === null) return currentLine;

        const lineNum = currentLine + 1; // 1-based

        switch(lineNum) {
            case 7: // Line 7: for (i from 3 down to 1)
                // iがnullなら初期化のため留まる
                if (vars.i === null) return 6; // index 6 (Line 7)
                // i >= 1 ならループ継続、そうでなければ終了
                return (vars.i as number) >= 1 ? 7 : 10; // -> Line 8 or Line 11
            
            case 8: // Line 8 done
                return 8; // -> Line 9
            
            case 9: // Line 9 done
                return 9; // -> Line 10
            
            case 10: // Line 10: endfor
                return 6; // -> Line 7 (loop check)
            
            case 11: // Line 11: return
                return 99; // End
            
            default:
                return currentLine + 1;
        }
    },
};

const staticQaLogic: { traceLogic: TraceStep[] } = {
    traceLogic: [], // トレース処理は不要
};

// =================================================================================
// --- 問21: 入場料計算ロジック ---
// =================================================================================
const admissionFeeLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
  traceLogic: [
    (vars) => vars,                      // 0: Line 1 (def)
    (vars) => ({...vars, ret: null}),    // 1: Line 2 (ret decl)
    (vars) => vars,                      // 2: Line 3 (if num <= 3)
    (vars) => ({...vars, ret: 100}),     // 3: Line 4 (ret = 100)
    (vars) => vars,                      // 4: Line 5 (elseif [?])
    (vars) => ({...vars, ret: 300}),     // 5: Line 6 (ret = 300)
    (vars) => vars,                      // 6: Line 7 (else)
    (vars) => ({...vars, ret: 500}),     // 7: Line 8 (ret = 500)
    (vars) => vars,                      // 8: Line 9 (endif)
    (vars) => vars,                      // 9: Line 10 (return)
  ],
  
  calculateNextLine: (currentLine, vars, variant) => {
    const num = vars.num as number;
    if (num === null) return currentLine;

    // 0-indexedの行番号で分岐
    switch (currentLine) {
      case 2: // Line 3: if (num が 3 以下)
        // 3歳以下なら Line 4(100円)へ、そうでなければ Line 5(elseif)へ
        return num <= 3 ? 3 : 4;
        
      case 3: // Line 4: ret ← 100
        return 8; // -> Line 9 (endif)

      case 4: // Line 5: elseif ( [ variant ] )
        let conditionMet = false;
        const v = variant || 'カ'; // デフォルトは正解のカ

        switch (v) {
            case 'ア': conditionMet = (num >= 4 && num < 9); break;
            case 'イ': conditionMet = (num === 4 || num === 9); break;
            case 'ウ': conditionMet = (num > 4 && num <= 9); break;
            case 'エ': conditionMet = (num >= 4); break;
            case 'オ': conditionMet = (num > 4); break;
            case 'カ': conditionMet = (num <= 9); break; // 正解
            case 'キ': conditionMet = (num < 9); break;
            default:   conditionMet = (num <= 9); break;
        }
        
        // 条件合致なら Line 6(300円)、そうでなければ Line 7(else)へ
        return conditionMet ? 5 : 6;

      case 5: // Line 6: ret ← 300
        return 8; // -> Line 9 (endif)

      case 6: // Line 7: else
        return 7; // -> Line 8 (500円)

      case 7: // Line 8: ret ← 500
        return 8; // -> Line 9 (endif)

      case 8: // Line 9: endif
        return 9; // -> Line 10 (return)

      case 9: // Line 10: return ret
        return 99; // 終了

      default:
        return currentLine + 1;
    }
  },
};

const arrayReverseStep_A: Record<string, TraceStep> = {
    'ア': (vars) => { // a: arrayの要素数 - left
        const array = vars.array as number[];
        const left = vars.left as number;
        return { ...vars, right: array.length - left };
    },
    'イ': (vars) => { // a: arrayの要素数 - left
        const array = vars.array as number[];
        const left = vars.left as number;
        return { ...vars, right: array.length - left };
    },
    'ウ': (vars) => { // a: arrayの要素数 - left + 1 (正解)
        const array = vars.array as number[];
        const left = vars.left as number;
        return { ...vars, right: array.length - left + 1 };
    },
    'エ': (vars) => { // a: arrayの要素数 - left + 1
        const array = vars.array as number[];
        const left = vars.left as number;
        return { ...vars, right: array.length - left + 1 };
    },
    'default': (vars) => vars,
};


// line 9 (index 8) の 'b' のロジック
const arrayReverseStep_B: Record<string, TraceStep> = {
    'ア': (vars) => { // b: array[left] ← tmp
        const newArray = [...(vars.array as number[])];
        const left = vars.left as number;
        const tmp = vars.tmp as number;
        newArray[left - 1] = tmp; // 1-based to 0-based
        return { ...vars, array: newArray };
    },
    'イ': (vars) => { // b: array[right] ← tmp
        const newArray = [...(vars.array as number[])];
        const right = vars.right as number;
        const tmp = vars.tmp as number;
        newArray[right - 1] = tmp; // 1-based to 0-based
        return { ...vars, array: newArray };
    },
    'ウ': (vars) => { // b: array[left] ← tmp (正解)
        const newArray = [...(vars.array as number[])];
        const left = vars.left as number;
        const tmp = vars.tmp as number;
        newArray[left - 1] = tmp; // 1-based to 0-based
        return { ...vars, array: newArray };
    },
    'エ': (vars) => { // b: array[right] ← tmp
        const newArray = [...(vars.array as number[])];
        const right = vars.right as number;
        const tmp = vars.tmp as number;
        newArray[right - 1] = tmp; // 1-based to 0-based
        return { ...vars, array: newArray };
    },
    'default': (vars) => vars,
};

// 静的なトレースステップ (line 6 と 9 以外)
const staticArrayReverseTraceLogic: TraceStep[] = [
    /* 0: Line 1 */ (vars) => ({ ...vars, array: [1, 2, 3, 4, 5] }), // プログラム通り初期化
    /* 1: Line 2 */ (vars) => ({ ...vars, right: null, left: null }),
    /* 2: Line 3 */ (vars) => ({ ...vars, tmp: null }),
    /* 3: Line 4 */ (vars) => vars, // 空行
    /* 4: Line 5 */ (vars) => { // forループ (iの更新)
        if (vars.left === null) {
            return { ...vars, left: 1 }; // 1回目
        }
        return { ...vars, left: (vars.left as number) + 1 }; // 2回目以降
    },
    /* 5: Line 6 */ (vars) => vars, // a (動的ステップで上書き)
    /* 6: Line 7 */ (vars) => { // tmp ← array[right]
        const array = vars.array as number[];
        const right = vars.right as number;
        return { ...vars, tmp: array[right - 1] }; // 1-based to 0-based
    },
    /* 7: Line 8 */ (vars) => { // array[right] ← array[left]
        const newArray = [...(vars.array as number[])];
        const left = vars.left as number;
        const right = vars.right as number;
        newArray[right - 1] = newArray[left - 1];
        return { ...vars, array: newArray };
    },
    /* 8: Line 9 */ (vars) => vars, // b (動的ステップで上書き)
    /* 9: Line 10 */ (vars) => vars, // endfor
];

// =================================================================================
// --- 問22: 配列の逆順化 ---
// =================================================================================
const arrayReverseLogic: { 
    getTraceStep: (line: number, variant: string | null) => TraceStep;
    calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number 
} = {
    getTraceStep: (line, variant) => {
        if (line === 5) { // Line 6 [a]
            return arrayReverseStep_A[variant || 'default'] || arrayReverseStep_A['default'];
        }
        if (line === 8) { // Line 9 [b]
            return arrayReverseStep_B[variant || 'default'] || arrayReverseStep_B['default'];
        }
        return staticArrayReverseTraceLogic[line] || ((vars) => vars);
    },

    calculateNextLine: (currentLine, vars, variant) => {
        // ロジックが選択されていない場合は、トレースを進めない
        if (variant === null) {
            if (currentLine < 4) return currentLine + 1; // 5行目(for)の手前までは許可
            return currentLine; // ロジックが選択されるまで待機
        }

        const array = vars.array as number[];
        const left = vars.left as number;

        switch (currentLine) {
            case 0: return 1;
            case 1: return 2;
            case 2: return 3;
            case 3: return 4; // -> 5 (for)
            case 4: // 5: for
                const loopVar = (left === null) ? 1 : left;
                // (要素数 / 2) の商までループ
                return loopVar <= Math.floor(array.length / 2) ? 5 : 99; // 
            case 5: return 6; // 6 -> 7
            case 6: return 7; // 7 -> 8
            case 7: return 8; // 8 -> 9
            case 8: return 9; // 9 -> 10
            case 9: // 10: endfor
                return 4; // -> 5 (forループの先頭へ戻る)
            default:
                return 99; // 終了
        }
    },
};

// =================================================================================
// --- 問23: 単方向リストのロジックを全面的に改善 ---
// =================================================================================
// Line 13: prev.next ← [ b ] のロジック
const linkedListAppendStepLogics: Record<string, TraceStep> = {
    // b: curr (正しい挙動)
    'ア': (vars) => { 
        const newListData = JSON.parse(JSON.stringify(vars.listData));
        const prevIndex = vars.prev as number;
        if (prevIndex !== null && newListData[prevIndex]) {
            newListData[prevIndex].next = vars.curr; // prev.next = curr
        }
        return { ...vars, listData: newListData };
    },
    // b: curr.next (curr.nextは通常nullなので、切断されるような挙動)
    'イ': (vars) => { 
        const newListData = JSON.parse(JSON.stringify(vars.listData));
        const prevIndex = vars.prev as number;
        if (prevIndex !== null && newListData[prevIndex]) {
            // 新規ノード(curr)のnextはnullなので、実質nullが入る
            newListData[prevIndex].next = null; 
        }
        return { ...vars, listData: newListData };
    },
    // b: listHead (循環参照になる)
    'ウ': (vars) => { 
        const newListData = JSON.parse(JSON.stringify(vars.listData));
        const prevIndex = vars.prev as number;
        if (prevIndex !== null && newListData[prevIndex]) {
            newListData[prevIndex].next = vars.listHead; 
        }
        return { ...vars, listData: newListData };
    },
    // エ、オ、カ はア、イ、ウと同じ代入ロジック(b)を持つため再利用
    'エ': (vars) => linkedListAppendStepLogics['ア'](vars),
    'オ': (vars) => linkedListAppendStepLogics['イ'](vars),
    'カ': (vars) => linkedListAppendStepLogics['ウ'](vars),
    
    'default': (vars) => vars,
};

const linkedListAppendLogic: { 
    traceLogic: TraceStep[]; 
    calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number 
} = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => vars,
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => ({ ...vars, prev: null, curr: null }),
        /* 4: Line 5 */ (vars) => { // curr ← ListElement(qVal)
            const newNode = { val: vars.qVal as string, next: null };
            // 現在のlistDataをコピー、なければ空配列作成
            const newListData = vars.listData ? JSON.parse(JSON.stringify(vars.listData)) : [];
            const newNodeIndex = newListData.length; // 末尾に追加されるのでindexはlengthと同じ
            newListData.push(newNode);
            return { ...vars, listData: newListData, curr: newNodeIndex };
        },
        /* 5: Line 6 */ (vars) => vars, // if (条件分岐のみ)
        /* 6: Line 7 */ (vars) => ({ ...vars, listHead: vars.curr }), // listHead ← curr
        /* 7: Line 8 */ (vars) => vars, // else
        /* 8: Line 9 */ (vars) => ({ ...vars, prev: vars.listHead }), // prev ← listHead
        /* 9: Line 10 */ (vars) => vars, // while
        /* 10: Line 11 */ (vars) => { // prev ← prev.next
            const listData = vars.listData as any[];
            const prevIndex = vars.prev as number;
            // 安全策: prevが存在し、nextがある場合のみ更新
            if (prevIndex !== null && listData[prevIndex]) {
                return { ...vars, prev: listData[prevIndex].next };
            }
            return vars;
        },
        /* 11: Line 12 */ (vars) => vars, // endwhile
        /* 12: Line 13: prev.next ← [ b ]  */
        (vars) => {
            // 1. データがない、またはprevがない場合は何もしない
            if (!vars.listData || vars.prev === null) return vars;

            // 2. 選択されたバリアントを取得 (ア〜カ)
            // もし未選択ならデフォルトで'ア'(正解)として振る舞うか、何もしない
            const variant = (vars._variant as string) || 'ア';

            // 3. データのディープコピーを作成
            const newListData = JSON.parse(JSON.stringify(vars.listData));
            const prevIndex = vars.prev as number;
            const prevNode = newListData[prevIndex];

            if (!prevNode) return vars;

            // 4. バリアントに応じて [ b ] の値を決定して代入
            // ア, エ => b: curr
            if (['ア', 'エ'].includes(variant)) {
                prevNode.next = vars.curr;
            }
            // イ, オ => b: curr.next
            else if (['イ', 'オ'].includes(variant)) {
                // currは新規ノードなので、curr.next は通常 null
                const currNode = newListData[vars.curr as number];
                prevNode.next = currNode ? currNode.next : null; 
            }
            // ウ, カ => b: listHead
            else if (['ウ', 'カ'].includes(variant)) {
                prevNode.next = vars.listHead;
            }

            return { ...vars, listData: newListData };
        },
        
        /* 13: Line 14 */ (vars) => vars, // endif
    ],

    calculateNextLine: (currentLine, vars, variant) => {
        // データ未選択時は待機
        if (vars.listData === null || vars.qVal === null) {
             if (currentLine < 2) return currentLine + 1;
             return currentLine;
        }

        const executedLine = currentLine;
        switch (executedLine) {
            case 0: return 1;
            case 1: return 2;
            case 2: return 3;
            case 3: return 4;
            case 4: return 5;
            
            case 5: // Line 6: if (listHead が [ a ])
                // Variantに応じた条件判定
                // ア, イ, ウ (a: 未定義): listHead === null
                // エ, オ, カ (a: 未定義でない): listHead !== null
                const isCheckNull = ['ア', 'イ', 'ウ', null].includes(variant);
                
                if (isCheckNull) {
                    // 「未定義」かチェック
                    return (vars.listHead === null) ? 6 : 8; // True: Line 7, False: Line 9 (else)
                } else {
                    // 「未定義でない」かチェック
                    return (vars.listHead !== null) ? 6 : 8; // True: Line 7, False: Line 9 (else)
                }

            case 6: // listHead ← curr 実行後
                return 13; // -> Line 14 (endif)
            
            case 8: // Line 9: prev ← listHead
                return 9; // -> Line 10 (while)

            case 9: // Line 10: while (prev.next が 未定義でない)
                const listData = vars.listData as any[];
                const prevIndex = vars.prev as number;
                // prevが存在し、そのnextがnullでないならループ継続
                if (prevIndex !== null && listData[prevIndex] && listData[prevIndex].next !== null) {
                    return 10; // -> Line 11 (body)
                }
                return 12; // -> Line 13 (loop end)

            case 10: // Line 11: prev ← prev.next
                return 9; // -> Loop check

            case 12: // Line 13: prev.next ← [ b ]
                if (!variant) return 12; // ロジック選択待ち
                return 13; // -> Line 14

            case 13: // Line 14: endif
                return 99; // 終了

            default: return currentLine + 1;
        }
    }
};

// ★重要: traceLogicを動的に切り替えるためのラッパー
// problem-logics.ts の `idToLogicMap` に登録するオブジェクトを調整します

const linkedListAppendLogicWrapper = {
    // 静的ステップと動的ステップを組み合わせる
    traceLogic: [
        ...linkedListAppendLogic.traceLogic.slice(0, 12), // 0~11行目は静的
        (vars: VariablesState) => { // 12行目 (Line 13) は動的             
             const variant = vars._variant as string || 'ア'; // _variantがあれば使う
             const stepFunc = linkedListAppendStepLogics[variant] || linkedListAppendStepLogics['default'];
             return stepFunc(vars);
        },
        ...linkedListAppendLogic.traceLogic.slice(13)
    ],
    calculateNextLine: linkedListAppendLogic.calculateNextLine
};

// =================================================================================
// --- 問24: スパースマトリックス変換のロジック ---
// =================================================================================
const sparseMatrixLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars: VariablesState) => vars,
        /* 1: Line 2 */ (vars: VariablesState) => ({ ...vars, i: null, j: null }),
        /* 2: Line 3 */ (vars: VariablesState) => vars,
        /* 3: Line 4 */ (vars: VariablesState) => ({ ...vars, sparseMatrix: [[], [], []] }),
        /* 4: Line 5 */ (vars: VariablesState) => {
            // iの初期化
            if (vars.i === null) return { ...vars, i: 1 };
            return vars;
        },
        /* 5: Line 6 */ (vars: VariablesState) => {
            // jの初期化
            if (vars.j === null) return { ...vars, j: 1 };
            return vars;
        },
        /* 6: Line 7 */ (vars: VariablesState) => vars, // if
        /* 7: Line 8 */ (vars: VariablesState) => {
            const newSparseMatrix = JSON.parse(JSON.stringify(vars.sparseMatrix));
            newSparseMatrix[0].push(vars.i);
            return { ...vars, sparseMatrix: newSparseMatrix };
        },
        /* 8: Line 9 */ (vars: VariablesState) => {
            const newSparseMatrix = JSON.parse(JSON.stringify(vars.sparseMatrix));
            newSparseMatrix[1].push(vars.j);
            return { ...vars, sparseMatrix: newSparseMatrix };
        },
        /* 9: Line 10 */ (vars: VariablesState) => {
            const newSparseMatrix = JSON.parse(JSON.stringify(vars.sparseMatrix));
            const matrix = vars.matrix as number[][];
            const i = vars.i as number;
            const j = vars.j as number;
            newSparseMatrix[2].push(matrix[i - 1][j - 1]);
            return { ...vars, sparseMatrix: newSparseMatrix };
        },
        /* 10: Line 11 */ (vars: VariablesState) => vars, // endif
        /* 11: Line 12 */ (vars: VariablesState) => ({ ...vars, j: (vars.j as number) + 1 }), // endfor (inner)
        /* 12: Line 13 */ (vars: VariablesState) => ({ ...vars, i: (vars.i as number) + 1, j: null }), // endfor (outer)
        /* 13: Line 14 */ (vars: VariablesState) => vars, // return
    ],
    calculateNextLine(currentLine: number, vars: VariablesState): number {
        const executedLine = currentLine; // 0-indexed
        const matrix = vars.matrix as number[][];
        const i = vars.i as number;
        const j = vars.j as number;

        switch (executedLine) {
            case 3: return 4;  // Line 4 -> 5
            case 4: // for i
                if (i === null) return 4; // for a first time
                return i <= matrix.length ? 5 : 13; // -> inner loop or return
            case 5: // for j
                if (j === null) return 5; // for a first time
                return j <= matrix[0].length ? 6 : 12; // -> if or outer endfor
            case 6: // if
                return matrix[i - 1][j - 1] !== 0 ? 7 : 11; // -> block or inner endfor
            case 7: return 8;  // -> Line 9
            case 8: return 9;  // -> Line 10
            case 9: return 10; // -> Line 11
            case 10: return 11; // endif -> inner endfor
            case 11: return 5;  // inner endfor -> inner loop check
            case 12: return 4;  // outer endfor -> outer loop check
            default: return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問25: 条件付き確率計算のロジック ---
// =================================================================================

// 問題文の単語データ (ヘルパーオブジェクト)
const corpusData = {
    words: ["importance", "inflation", "information", "innovation"],
    // 指定文字列が含まれる回数を返す
    freq: (str: string): number => {
        let count = 0;
        for (const word of corpusData.words) {
            // 文字列の重複カウントに対応 (例: "n" が "innovation" に3回ある)
            // RegExpでグローバルマッチさせる
            const matches = word.match(new RegExp(str, "g"));
            if (matches) count += matches.length;
        }
        return count;
    },
    // 指定文字列で終わる単語の数を返す
    freqE: (str: string): number => {
        let count = 0;
        for (const word of corpusData.words) {
            if (word.endsWith(str)) count++;
        }
        return count;
    }
};

const conditionalProbabilityLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
    traceLogic: [
        /* 0: Line 1 (comment) */ (vars) => vars,
        /* 1: Line 2 (def) */     (vars) => vars,
        /* 2: Line 3 (s1 <- c1) */(vars) => ({ ...vars, s1: vars.c1 }),
        /* 3: Line 4 (s2 <- c2) */(vars) => ({ ...vars, s2: vars.c2 }),
        
        /* 4: Line 5 (if freq(s1+s2) > 0) */
        (vars) => {
            const s1 = vars.s1 as string;
            const s2 = vars.s2 as string;
            const freq_s1_s2 = corpusData.freq(s1 + s2);
            return { ...vars, freq_s1_s2 };
        },

        /* 5: Line 6 (return [ calculation ]) */
        (vars) => {
            const s1 = vars.s1 as string;
            const s2 = vars.s2 as string;
            const variant = (vars._variant as string) || 'ウ'; 

            // ▼▼▼ 修正: 計算結果を明確に別名の変数に格納する ▼▼▼
            const val_freq_s1 = corpusData.freq(s1);
            const val_freqE_s1 = corpusData.freqE(s1); // s1の末尾出現数
            
            const val_freq_s2 = corpusData.freq(s2);
            const val_freqE_s2 = corpusData.freqE(s2); // s2の末尾出現数
            
            const val_freq_s1_s2 = vars.freq_s1_s2 as number;

            let numerator = 0;   
            let denominator = 0; 
            let result = 0;

            // 選択肢ごとの計算式 (変数名を新しいものに変更)
            if (variant === 'ア') { 
                numerator = val_freq_s1 - val_freqE_s1;
                denominator = val_freq_s1_s2;
            } else if (variant === 'イ') {
                numerator = val_freq_s2 - val_freqE_s2;
                denominator = val_freq_s1_s2;
            } else if (variant === 'ウ') { // 正解
                numerator = val_freq_s1_s2;
                denominator = val_freq_s1 - val_freqE_s1;
            } else if (variant === 'エ') {
                numerator = val_freq_s1_s2;
                denominator = val_freq_s2 - val_freqE_s2;
            }

            if (denominator !== 0) {
                result = numerator / denominator;
            } else {
                result = 0; 
            }

            return { 
                ...vars, 
                // ▼▼▼ 修正: キーと値を明示的に指定して代入ミスを防ぐ ▼▼▼
                freq_s1: val_freq_s1,
                freqE_s1: val_freqE_s1, // s1の結果 -> freqE_s1
                
                freq_s2: val_freq_s2,
                freqE_s2: val_freqE_s2, // s2の結果 -> freqE_s2
                
                numerator: numerator,
                denominator: denominator,
                result: result
            };
        },

        /* 6: Line 7 (else) */    (vars) => vars,
        /* 7: Line 8 (return 0) */(vars) => ({ ...vars, result: 0 }),
        /* 8: Line 9 (endif) */   (vars) => vars,
    ],

    // calculateNextLine は変更なし
    calculateNextLine(currentLine, vars, variant) {
        if (vars.c1 === null) return currentLine;
        const lineNum = currentLine + 1;
        switch (lineNum) {
            case 2: return 2;
            case 3: return 3;
            case 4: return 4;
            case 5: 
                const val = corpusData.freq((vars.c1 as string) + (vars.c2 as string));
                return val > 0 ? 5 : 7;
            case 6: return 99;
            case 8: return 99;
            default: return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問27: 素数探索ロジック (修正版) ---
// =================================================================================
const primeNumberLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => ({ ...vars, pnList: [], i: null, j: null, divideFlag: null, sqrt_i: null }),
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => vars,
        
        /* 4: Line 5 (for i) */ 
        (vars) => {
            if (vars.i === null) return { ...vars, i: 2 };
            return { ...vars, i: (vars.i as number) + 1 };
        },
        
        /* 5: Line 6 */ (vars) => ({ ...vars, divideFlag: true }),
        
        /* 6: Line 7 (j init) */ 
        (vars) => ({ ...vars, j: null }), 
        
        /* 7: Line 8 (for j) */ 
        (vars) => {
            const i = vars.i as number;
            const sqrt_i = Math.floor(Math.sqrt(i));
            // jがnullなら2(初期化)、それ以外なら+1(インクリメント)
            const newJ = (vars.j === null || vars.j < 2) ? 2 : (vars.j as number) + 1;
            return { ...vars, j: newJ, sqrt_i };
        },
        
        /* 8: Line 9 */ (vars) => vars, // if condition
        /* 9: Line 10 */(vars) => ({ ...vars, divideFlag: false }),
        /* 10: Line 11 */(vars) => vars, // break
        /* 11: Line 12 */(vars) => vars, // endif
        /* 12: Line 13 */(vars) => vars, // endfor inner
        
        /* 13: Line 14 */(vars) => vars, // if divideFlag
        /* 14: Line 15 */(vars) => {
            const newPnList = [...(vars.pnList as number[])];
            newPnList.push(vars.i as number);
            return { ...vars, pnList: newPnList };
        },
        /* 15: Line 16 */(vars) => vars, // endif
        /* 16: Line 17 */(vars) => ({ ...vars, j: null }), // endfor outer
        /* 17: Line 18 */(vars) => vars, // return
    ],

    calculateNextLine(currentLine, vars, variant) {
        if (vars.num === null) return currentLine;

        const executedLine = currentLine + 1; // 1-based
        const num = vars.num as number;
        const selectedVariant = variant || 'ア';

        switch (executedLine) {
            case 2: return 2; // Line 2 -> Line 3
            case 3: return 3; // Line 3 -> Line 4
            case 4: return 4; // Line 4 -> Line 5

            case 5: // Line 5: for (i ...)
                let maxI = num;
                if (['ウ', 'エ'].includes(selectedVariant)) {
                    maxI = num + 1; 
                }
                
                // ▼▼▼ 修正: nullなら初期値2、それ以外なら+1した値で判定する ▼▼▼
                // traceLogic実行後の値を予測して判定しないと、古い値で判定して意図しない挙動になる
                const nextI = (vars.i === null) ? 2 : (vars.i as number) + 1;
                
                // 次のiが範囲内ならLine 6へ、そうでなければLine 18へ
                return nextI <= maxI ? 5 : 17; 

            case 6: return 6; // -> Line 7
            case 7: return 7; // -> Line 8

            case 8: // Line 8: for (j ...)
                // iは既に更新済みなのでそのまま使う
                const currentI = vars.i as number;
                const sqrtI = Math.floor(Math.sqrt(currentI));
                
                // ▼▼▼ 修正: nullなら初期値2、それ以外なら+1した値で判定する ▼▼▼
                const nextJ = (vars.j === null) ? 2 : (vars.j as number) + 1;

                // 次のjが範囲内ならLine 9へ、範囲外ならループ終了(Line 14)へ
                return (nextJ <= sqrtI) ? 8 : 13; 

            case 9: // Line 9: if ([ b ])
                const iVal = vars.i as number;
                const jVal = vars.j as number; // ここでは既に値が入っているはず
                
                let isMatch = false;
                if (['ア', 'ウ'].includes(selectedVariant)) {
                    isMatch = (iVal % jVal === 0);
                } else {
                    isMatch = (Math.floor(iVal / jVal) !== 1);
                }
                return isMatch ? 9 : 11; // True: Line 10, False: Line 12

            case 10: // Line 10: divideFlag = false
                return 10; // -> Line 11

            case 11: // Line 11: break
                return 13; // -> Line 14 (Index 13)

            case 12: // Line 12: endif
                return 12; // -> Line 13

            case 13: // Line 13: endfor inner
                return 7; // -> Line 8 (loop check)

            case 14: // Line 14: if (divideFlag == true)
                return (vars.divideFlag === true) ? 14 : 15; // -> Line 15 or 16

            case 15: // Line 15: append
                return 15; // -> Line 16

            case 16: // Line 16: endif
                return 16; // -> Line 17

            case 17: // Line 17: endfor outer
                return 4; // -> Line 5 (loop check)

            case 18: // Line 18: return
                return 99;

            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 【修正版】問28: コールスタックのロジック ---
// =================================================================================
const callStackLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    // traceLogicはダミーとし、全ての処理をcalculateNextLineに集約する
    traceLogic: Array(12).fill((vars: VariablesState) => vars),

    calculateNextLine(currentLine: number, vars: VariablesState): number {
        // --- Step 1: 初期化 ---
        // トレースの最初のステップで、コールスタックと出力を初期化

        if (!vars.initialized) {
            vars.output = [];
            // callStackに最初のフレームとしてproc2を積む
            vars.callStack = [{ func: 'proc2', pc: 0 }];
            vars.initialized = true;
            return 4; // proc2の定義行 (Line 5) へ移動
        }

        const stack = vars.callStack as { func: string, pc: number }[];

        // --- Step 2: トレース終了判定 ---
        if (stack.length === 0) {
            return 1; // スタックが空になったらトレース終了
        }

        // --- Step 3: 現在の実行フレームを取得 ---
        let currentFrame = stack[stack.length - 1];
        let nextLine = -1;

        if (vars.initialized && vars.output.length === 4) {
                vars.initialized = false;
                vars.callStack = [];
                vars.output = [];
                nextLine = 0; // 初期化後、次の行へ進む
                return 1; // 初期化後、次の行へ進む
        }

        // --- Step 4: 現在のフレームに基づいて処理を実行し、次の行を決定 ---
        switch (currentFrame.func) {
            case 'proc2':
                switch (currentFrame.pc) {
                    case 0: // Line 6: proc3() を呼び出し
                        currentFrame.pc++; // proc2の次の実行位置を更新
                        stack.push({ func: 'proc3', pc: 0 }); // proc3をスタックに積む
                        nextLine = 9; // proc3の定義(Line 10)へジャンプ
                        break;
                    case 1: // Line 7: "B" を出力
                        vars.output.push("B");
                        currentFrame.pc++;
                        nextLine = 7; // 次の行(Line 8)へ
                        break;
                    case 2: // Line 8: proc1() を呼び出し
                        currentFrame.pc++;
                        stack.push({ func: 'proc1', pc: 0 });
                        nextLine = 0; // proc1の定義(Line 1)へジャンプ
                        break;
                    default: // proc2の終わり
                        stack.pop(); // proc2をスタックから降ろす
                        // 呼び出し元はないので、次のループで終了判定に引っかかる
                        nextLine = 8;
                        break;
                }
                break;

            case 'proc1':
                switch (currentFrame.pc) {
                    case 0: // Line 2: "A" を出力
                        vars.output.push("A");
                        currentFrame.pc++;
                        nextLine = 2; // 次の行(Line 3)へ
                        break;
                    case 1: // Line 3: proc3() を呼び出し
                        currentFrame.pc++;
                        stack.push({ func: 'proc3', pc: 0 });
                        nextLine = 9; // proc3の定義(Line 10)へジャンプ
                        break;
                    default: // proc1の終わり
                        stack.pop(); // proc1をスタックから降ろす
                        // 呼び出し元(proc2)に戻る。次のループでproc2のpcから再開。
                        nextLine = 7; // 見た目上、proc1を呼び出した8行目の手前に戻る
                        break;
                }
                break;

            case 'proc3':
                switch (currentFrame.pc) {
                    case 0: // Line 11: "C" を出力
                        vars.output.push("C");
                        currentFrame.pc++;
                        nextLine = 10; // 次の行(見えないがproc3の終わり)へ
                        break;
                    default: // proc3の終わり
                        stack.pop(); // proc3をスタックから降ろす
                        // 呼び出し元に戻る。
                        const callerFrame = stack[stack.length-1];
                        if(callerFrame.func === 'proc2') nextLine = 5;
                        if(callerFrame.func === 'proc1') nextLine = 2;
                        break;
                }
                break;
        }

        return nextLine;
    },
};

// =================================================================================
// --- 問29: クイックソート (画像準拠・完全版) ロジック ---
// =================================================================================
const quickSortLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => vars,
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => ({ ...vars, pivot: null, i: null, j: null }),
        
        /* 4: Line 5 (pivot) */
        (vars) => {
            const data = vars.data as number[];
            const first = vars.first as number;
            const last = vars.last as number;
            const midIndex = Math.floor((first + last) / 2) - 1;
            return { ...vars, pivot: data[midIndex] };
        },
        
        /* 5: Line 6 (i) */ (vars) => ({ ...vars, i: vars.first }),
        /* 6: Line 7 (j) */ (vars) => ({ ...vars, j: vars.last }),
        /* 7: Line 8 (while) */ (vars) => vars,
        
        /* 8: Line 9 (while data[i] < pivot) */ (vars) => vars,
        /* 9: Line 10 (i++) */ (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
        /* 10: Line 11 (endwhile) */ (vars) => vars,
        
        /* 11: Line 12 (while pivot < data[j]) */ (vars) => vars,
        /* 12: Line 13 (j--) */ (vars) => ({ ...vars, j: (vars.j as number) - 1 }),
        /* 13: Line 14 (endwhile) */ (vars) => vars,
        
        /* 14: Line 15 (if i >= j) */ (vars) => vars,
        /* 15: Line 16 (break) */ (vars) => vars,
        /* 16: Line 17 (endif) */ (vars) => vars,
        
        /* 17: Line 18 (swap) */
        (vars) => {
            const data = [...(vars.data as number[])];
            const i = (vars.i as number) - 1;
            const j = (vars.j as number) - 1;
            const tmp = data[i];
            data[i] = data[j];
            data[j] = tmp;
            return { ...vars, data };
        },
        
        /* 18: Line 19 (i++) */ (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
        /* 19: Line 20 (j--) */ (vars) => ({ ...vars, j: (vars.j as number) - 1 }),
        /* 20: Line 21 (endwhile) */ (vars) => vars,
        
        /* 21: Line 22 (Output) */
        (vars) => {
            const data = vars.data as number[];
            const currentOutput = (vars.output as string[]) || [];
            return { ...vars, output: [...currentOutput, data.join(' ')] };
        },
        
        /* 22: Line 23 (if first < i-1) */ (vars) => vars,
        
        /* 23: Line 24 (call sort left) */
        (vars) => {
            const stack = [...(vars.callStack as any[] || [])];
            // 現在の状態を保存 (戻り先は Line 25 / index 24)
            stack.push({
                first: vars.first, last: vars.last, pivot: vars.pivot, i: vars.i, j: vars.j,
                returnLine: 24 
            });
            const newLast = (vars.i as number) - 1;
            return { ...vars, callStack: stack, last: newLast, i: null, j: null, pivot: null };
        },
        
        /* 24: Line 25 (endif) */ (vars) => vars,
        
        /* 25: Line 26 (if j+1 < last) */ (vars) => vars,
        
        /* 26: Line 27 (call sort right) */
        (vars) => {
            const stack = [...(vars.callStack as any[] || [])];
            // 現在の状態を保存 (戻り先は Line 28 / index 27)
            stack.push({
                first: vars.first, last: vars.last, pivot: vars.pivot, i: vars.i, j: vars.j,
                returnLine: 27
            });
            const newFirst = (vars.j as number) + 1;
            return { ...vars, callStack: stack, first: newFirst, i: null, j: null, pivot: null };
        },
        
        /* 27: Line 28 (endif / return) */
        (vars) => {
            const stack = [...(vars.callStack as any[] || [])];
            if (stack.length > 0) {
                const savedState = stack.pop();
                return {
                    ...vars,
                    callStack: stack,
                    first: savedState.first,
                    last: savedState.last,
                    pivot: savedState.pivot,
                    i: savedState.i,
                    j: savedState.j,
                    // calculateNextLineのために returnLine を一時的にセットする（が、下のロジックでstackを見るのでなくても動く）
                    returnLine: savedState.returnLine 
                };
            }
            return { ...vars };
        },
    ],

    calculateNextLine(currentLine, vars) {
        if (vars.first === null) return currentLine;

        const executedLine = currentLine + 1; // 1-based
        const data = vars.data as number[];
        const pivot = vars.pivot as number;
        const i = (vars.i !== null) ? (vars.i as number) : 0;
        const j = (vars.j !== null) ? (vars.j as number) : 0;
        const first = vars.first as number;
        const last = vars.last as number;

        switch (executedLine) {
            case 3: return 3; 
            case 4: return 4;
            case 5: return 5;
            case 6: return 6;
            case 7: return 7;
            case 8: return 8;

            case 9: // while (data[i] < pivot)
                if (data[i - 1] < pivot) return 9;
                return 11;
            case 10: return 8;
            case 11: return 11;

            case 12: // while (pivot < data[j])
                if (pivot < data[j - 1]) return 12;
                return 14;
            case 13: return 11;
            case 14: return 14;

            case 15: // if (i >= j)
                return (i >= j) ? 15 : 17;

            case 16: return 21; // break -> Output

            case 17: return 17;
            case 18: return 18;
            case 19: return 19;
            case 20: return 20;
            case 21: return 7; // loop check

            case 22: return 22; // Output -> 23

            case 23: // if (first < i - 1)
                return (first < i - 1) ? 23 : 24; // -> 24(Call) or 25(Endif)

            case 24: // call sort(first, i-1)
                return 3; // -> Jump to Start (Line 4)

            case 25: return 25; // endif -> 26

            case 26: // if (j + 1 < last)
                return (j + 1 < last) ? 26 : 27; // -> 27(Call) or 28(Endif)

            case 27: // call sort(j+1, last)
                return 3; // -> Jump to Start (Line 4)

            case 28: // endif / return
                // ▼▼▼ 修正: スタックを覗き見て戻り先を決定する ▼▼▼
                const stack = vars.callStack as any[] || [];
                if (stack.length > 0) {
                    const savedState = stack[stack.length - 1]; // Peek
                    // 保存されていた戻り先の行番号へジャンプ
                    return savedState.returnLine as number;
                }
                return 99; // スタックが空なら終了

            default: return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問30: ハッシュ法 (オープンアドレス) ロジック ---
// =================================================================================
const hashOpenAddressingLogic: { 
    getTraceStep: (line: number, variant: string | null) => TraceStep;
    calculateNextLine: (currentLine: number, vars: VariablesState) => number 
} = {
    // -------------------------------------------------------
    // 1. 変数・スタックの更新ロジック (Execute current line)
    // -------------------------------------------------------
    getTraceStep: (line) => {
        return (vars) => {
            const stack = [...(vars.callStack as any[] || [])];
            // 配列操作用のヘルパー
            const getHashArray = () => [...(vars.hashArray as number[])];

            switch (line) {
                // --- test() ---
                case 23: // Line 24: hashArray ← {-1...}
                    return { ...vars, hashArray: [-1, -1, -1, -1, -1] };

                case 24: // Line 25: add(3)
                    // 戻ってきた場合
                    if (vars.tempRet !== null) {
                        // 戻り値(true/false)は捨てるが、tempRetを消費(クリア)する
                        return { ...vars, tempRet: null }; 
                    }
                    // 新規呼び出し
                    stack.push({ returnLine: 24, savedValue: vars.value, savedI: vars.i });
                    return { ...vars, callStack: stack, value: 3 };

                case 25: // Line 26: add(18)
                    if (vars.tempRet !== null) return { ...vars, tempRet: null };
                    stack.push({ returnLine: 25, savedValue: vars.value, savedI: vars.i });
                    return { ...vars, callStack: stack, value: 18 };

                case 26: // Line 27: add(11)
                    if (vars.tempRet !== null) return { ...vars, tempRet: null };
                    stack.push({ returnLine: 26, savedValue: vars.value, savedI: vars.i });
                    return { ...vars, callStack: stack, value: 11 };

                // --- add(value) ---
                case 2: // Line 3: def add
                    return vars;

                case 3: // Line 4: i ← calcHash1(value)
                    // 戻ってきた場合: i に代入
                    if (vars.tempRet !== null) {
                        return { ...vars, i: vars.tempRet, tempRet: null }; 
                    }
                    // 新規呼び出し
                    stack.push({ returnLine: 3, savedValue: vars.value, savedI: vars.i });
                    return { ...vars, callStack: stack };

                case 4: // Line 5: if (hashArray[i] = -1)
                    return vars;

                case 5: // Line 6: hashArray[i] ← value
                    {
                        const arr = getHashArray();
                        if (vars.i !== null) arr[(vars.i as number) - 1] = vars.value as number;
                        return { ...vars, hashArray: arr };
                    }

                case 6: // Line 7: return true
                    if (stack.length > 0) {
                        const saved = stack.pop();
                        return { 
                            ...vars, callStack: stack, tempRet: true, 
                            value: saved.savedValue, i: saved.savedI, targetLine: saved.returnLine 
                        };
                    }
                    return vars;

                case 7: // Line 8: else
                    return vars;

                case 8: // Line 9: i ← calcHash2(value)
                    if (vars.tempRet !== null) {
                        return { ...vars, i: vars.tempRet, tempRet: null };
                    }
                    stack.push({ returnLine: 8, savedValue: vars.value, savedI: vars.i });
                    return { ...vars, callStack: stack };

                case 9: // Line 10: if (hashArray[i] = -1)
                    return vars;

                case 10: // Line 11: hashArray[i] ← value
                    {
                        const arr = getHashArray();
                        if (vars.i !== null) arr[(vars.i as number) - 1] = vars.value as number;
                        return { ...vars, hashArray: arr };
                    }

                case 11: // Line 12: return true
                    if (stack.length > 0) {
                        const saved = stack.pop();
                        return { 
                            ...vars, callStack: stack, tempRet: true,
                            value: saved.savedValue, i: saved.savedI, targetLine: saved.returnLine 
                        };
                    }
                    return vars;

                case 14: // Line 15: return false
                    if (stack.length > 0) {
                        const saved = stack.pop();
                        return { 
                            ...vars, callStack: stack, tempRet: false,
                            value: saved.savedValue, i: saved.savedI, targetLine: saved.returnLine 
                        };
                    }
                    return vars;

                // --- calcHash1 ---
                case 16: // Line 17: def calcHash1
                    return vars;

                case 17: // Line 18: return (value mod size) + 1
                    {
                        const val = vars.value as number;
                        const len = (vars.hashArray as number[]).length;
                        const res = (val % len) + 1;
                        
                        if (stack.length > 0) {
                            const saved = stack.pop();
                            return { 
                                ...vars, callStack: stack, tempRet: res, 
                                value: saved.savedValue, i: saved.savedI, targetLine: saved.returnLine 
                            };
                        }
                        return vars;
                    }

                // --- calcHash2 ---
                case 19: // Line 20: def calcHash2
                    return vars;

                case 20: // Line 21: return ((value+3) mod size) + 1
                    {
                        const val = vars.value as number;
                        const len = (vars.hashArray as number[]).length;
                        const res = ((val + 3) % len) + 1;

                        if (stack.length > 0) {
                            const saved = stack.pop();
                            return { 
                                ...vars, callStack: stack, tempRet: res, 
                                value: saved.savedValue, i: saved.savedI, targetLine: saved.returnLine 
                            };
                        }
                        return vars;
                    }

                default:
                    return vars;
            }
        };
    },

    // -------------------------------------------------------
    // 2. 次の行番号を決定するロジック
    // -------------------------------------------------------
    calculateNextLine(currentLine, vars) {
        // 初期状態なら test() の中身(Line 24)へジャンプ
        // ただし Line 23, 24 にいるときは邪魔しない
        if (vars.hashArray === null && currentLine < 23) return 23;

        const hashArray = vars.hashArray as number[];
        const i = (vars.i !== null) ? (vars.i as number) : 0;

        // return文でセットされた targetLine があれば、そこへジャンプして復帰
        // (getTraceStep でセットされた直後にここが呼ばれる)
        if (vars.targetLine !== null && vars.targetLine !== undefined) {
            return vars.targetLine as number;
        }

        switch (currentLine) {
            // --- test() ---
            case 23: return 24; // Line 23 -> Line 24
            case 24: return 25; // Line 24 -> Line 25
            
            case 25: // Line 25: add(3)
                // 戻ってきた(tempRetがある)なら Line 26 へ
                // まだ(tempRetがない)なら Line 3 (add) へ
                return (vars.tempRet !== null) ? 26 : 2; 

            case 26: // Line 26: add(18)
                // 戻ってきたら Line 27 へ
                return (vars.tempRet !== null) ? 27 : 2;

            case 27: // Line 27: add(11)
                // 戻ってきたら終了
                return (vars.tempRet !== null) ? 99 : 2;

            // --- add(value) ---
            case 2: return 3; // Line 3 -> Line 4
            
            case 3: // Line 4: i ← calcHash1
                // 戻ってきた(tempRetあり)なら Line 5 へ
                // まだなら calcHash1 (Line 17) へ
                return (vars.tempRet !== null) ? 4 : 16; 

            case 4: // Line 5: if (hashArray[i] = -1)
                return (hashArray[i - 1] === -1) ? 5 : 7; // True -> 6, False -> 8

            case 5: return 6; // Line 6 -> Line 7
            case 6: return 6; // Line 7: return true (getTraceStepでtargetLineへ飛ぶのでここは維持でOK)

            case 7: return 8; // Line 8 -> Line 9

            case 8: // Line 9: i ← calcHash2
                return (vars.tempRet !== null) ? 9 : 19; // -> 10 or 20(calcHash2)

            case 9: // Line 10: if (hashArray[i] = -1)
                return (hashArray[i - 1] === -1) ? 10 : 13; // True -> 11, False -> 13(endif)

            case 10: return 11; // Line 11 -> Line 12
            case 11: return 11; // return true

            case 12: return 13; // endif
            case 13: return 14; // endif -> return false
            case 14: return 14; // return false

            // --- calcHash1 ---
            case 16: return 17; // Line 17 -> Line 18
            case 17: return 17; // return

            // --- calcHash2 ---
            case 19: return 20; // Line 20 -> Line 21
            case 20: return 20; // return

            default: return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問31: コサイン類似度のロジック ---
// =================================================================================
const cosineSimilarityLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: Array(23).fill((vars: VariablesState) => vars), // ダミー配列

    calculateNextLine(currentLine: number, vars: VariablesState): number {
        // --- 初期化 ---
        if (!vars.initialized) {
            vars.similarity = 0;
            vars.numerator = 0;
            vars.denominator = 0;
            vars.temp = 0;
            vars.i = 0;
            vars.pc = 0; // プログラムカウンタ
            vars.loop_target = ''; // どのループを実行中か
            vars.initialized = true;
            return 1; // 2行目から開始
        }

        const pc = vars.pc as number;

        // --- 実行ロジック ---
        switch (pc) {
            case 0: // Line 2, 3: 変数初期化
                vars.numerator = 0;
                vars.pc++;
                return 3;
            case 1: // Line 4: numerator初期化
                vars.loop_target = 'numerator_loop';
                vars.i = 1;
                vars.pc++;
                return 5;
            case 2: // Line 6-8: numerator計算ループ
                if (vars.i <= (vars.vector1 as number[]).length) {
                    vars.numerator += (vars.vector1 as number[])[vars.i - 1] * (vars.vector2 as number[])[vars.i - 1];
                    vars.i++;
                    return 6;
                } else {
                    vars.pc++;
                    return 9;
                }
            case 3: // Line 10: denominator(v1)計算ループの準備
                vars.loop_target = 'denominator_v1_loop';
                vars.temp = 0;
                vars.i = 1;
                vars.pc++;
                return 9;
            case 4: // Line 10-12: denominator(v1)計算ループ
                if (vars.i <= (vars.vector1 as number[]).length) {
                    vars.temp += Math.pow((vars.vector1 as number[])[vars.i - 1], 2);
                    vars.i++;
                    return 10;
                } else {
                    vars.pc++;
                    return 12;
                }
            case 5: // Line 13: denominator(v1)計算
                vars.denominator = Math.sqrt(vars.temp as number);
                vars.pc++;
                return 14;
            case 6: // Line 15: denominator(v2)計算ループの準備
                vars.loop_target = 'denominator_v2_loop';
                vars.temp = 0;
                vars.i = 1;
                vars.pc++;
                return 15;
            case 7: // Line 16-18: denominator(v2)計算ループ
                if (vars.i <= (vars.vector2 as number[]).length) {
                    vars.temp += Math.pow((vars.vector2 as number[])[vars.i - 1], 2);
                    vars.i++;
                    return 16;
                } else {
                    vars.pc++;
                    return 18;
                }
            case 8: // Line 19: denominator最終計算
                vars.denominator *= Math.sqrt(vars.temp as number);
                vars.pc++;
                return 20;
            case 9: // Line 21: similarity計算
                if(vars.denominator !== 0) {
                    vars.similarity = vars.numerator / vars.denominator;
                } else {
                    vars.similarity = 0;
                }
                vars.pc++;
                return 21;
            case 10: // Line 22: return
            default:
                return 99; // 終了
        }
    },
};

// =================================================================================
// --- 問33: 3つの数の最大値のロジック ---
// =================================================================================
const maxOfThreeLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
    traceLogic: [
        /* 0: Line 1: maximum def */ (vars) => ({...vars, result: null}),
        /* 1: Line 2: if (...) */ (vars) => vars,
        /* 2: Line 3: return x */ (vars) => ({...vars, result: vars.x}),
        /* 3: Line 4: elseif (y > z) */ (vars) => vars,
        /* 4: Line 5: return y */ (vars) => ({...vars, result: vars.y}),
        /* 5: Line 6: else */ (vars) => vars,
        /* 6: Line 7: return z */ (vars) => ({...vars, result: vars.z}),
        /* 7: Line 8: endif */ (vars) => vars,
    ],
    
    calculateNextLine(currentLine, vars, variant) {
        // プリセットが選択されるまで待機
        if (vars.x === null) return currentLine;

        const x = vars.x as number;
        const y = vars.y as number;
        const z = vars.z as number;
        const selectedVariant = variant || 'イ'; // デフォルトは正解のイ

        switch (currentLine) {
            case 0: return 1; // Line 1 -> Line 2

            case 1: // Line 2: if ( [ ? ] )
                let condition = false;
                switch (selectedVariant) {
                    case 'ア': condition = (x > y); break;
                    case 'イ': condition = (x > y && x > z); break; // 正解
                    case 'ウ': condition = (x > y && y > z); break;
                    case 'エ': condition = (x > z); break;
                    case 'オ': condition = (x > z && z > y); break;
                    case 'カ': condition = (z > y); break;
                    default: condition = (x > y && x > z); break;
                }
                
                // Trueなら Line 3 (return x) へ、Falseなら Line 4 (elseif) へ
                return condition ? 2 : 3;

            case 2: // Line 3: return x
                return 99; // 終了

            case 3: // Line 4: elseif (y > z)
                // ここはロジック固定
                return (y > z) ? 4 : 6; // True -> Line 5, False -> Line 6(else) -> Line 7

            case 4: // Line 5: return y
                return 99; // 終了

            case 5: // Line 6: else
                return 6; // -> Line 7

            case 6: // Line 7: return z
                return 99; // 終了

            case 7: // Line 8: endif
                return 99;

            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問34: 2進数から10進数への変換ロジック ---
// =================================================================================
// =================================================================================
// --- 問34: 2進数変換ロジック (選択肢対応版) ---
// =================================================================================
const binaryToDecimalLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => ({ ...vars, i: null, length: null, result: 0 }),
        /* 2: Line 3 */ (vars) => ({ ...vars, length: (vars.binary as string).length }),
        
        /* 3: Line 4 (for i) */ 
        (vars) => {
            // iの更新。初回(null)は1、それ以降はインクリメント
            const newI = vars.i === null ? 1 : (vars.i as number) + 1;
            return { ...vars, i: newI };
        },
        
        /* 4: Line 5 (result update) */ 
        (vars) => {
            const binaryStr = vars.binary as string;
            const i = vars.i as number;
            const length = vars.length as number;
            const currentResult = vars.result as number;
            const variant = vars._variant as string || 'エ'; // デフォルト正解

            // 選択肢に応じた計算
            let newResult = currentResult;

            // int(binary[...]) の部分
            // 1-based index なので charAt には -1 する必要がある
            const getBit = (index1Based: number) => parseInt(binaryStr.charAt(index1Based - 1));

            if (variant === 'ア') {
                // result + int(binary の (length - i + 1)文字目)
                // これは逆順に足しているだけなので、重み付けがない
                newResult = currentResult + getBit(length - i + 1);
            } 
            else if (variant === 'イ') {
                // result + int(binary の i文字目)
                // これも単にビットの数を数えるだけになる
                newResult = currentResult + getBit(i);
            } 
            else if (variant === 'ウ') {
                // result * 2 + int(binary の (length - i + 1)文字目)
                // 逆順のビットを使ってシフトしていく
                newResult = currentResult * 2 + getBit(length - i + 1);
            } 
            else if (variant === 'エ') { // 正解
                // result * 2 + int(binary の i文字目)
                newResult = currentResult * 2 + getBit(i);
            }

            return { ...vars, result: newResult };
        },
        
        /* 5: Line 6 (endfor) */ (vars) => vars, 
        /* 6: Line 7 (return) */ (vars) => vars, 
    ],

    calculateNextLine(currentLine, vars, variant) {
        if (vars.binary === null) return currentLine;

        const length = vars.length as number;
        // iがnullならまだループ前(0相当)
        const i = (vars.i !== null) ? (vars.i as number) : 0;

        switch (currentLine) {
            case 0: return 1; // -> Line 2
            case 1: return 2; // -> Line 3
            case 2: return 3; // -> Line 4 (for start)
            
            case 3: // Line 4: for (i ...)
                // 次の i が length 以下ならループ継続、そうでなければ終了
                // traceLogic実行前なので、今の i+1 が次の i
                return (i + 1 <= length) ? 4 : 6; // -> Line 5 or Line 7

            case 4: // Line 5: result update
                // 次のループへ (endfor相当)
                return 3; 
            
            case 5: // Line 6: endfor (到達しない想定だが念のため)
                return 3;

            case 6: // Line 7: return
                return 99; // 終了

            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問35: 辺リストから隣接行列への変換ロジック ---
// =================================================================================
const edgesToMatrixLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => {
            const nodeNum = vars.nodeNum as number;
            // nodeNum x nodeNum の2次元配列を0で初期化
            const newMatrix = Array.from({ length: nodeNum }, () => Array(nodeNum).fill(0));
            return { ...vars, adjMatrix: newMatrix, i: null, u: null, v: null };
        },
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => {
            // iの更新。初回(null)は1、それ以降はインクリメント
            const newI = vars.i === null ? 1 : (vars.i as number) + 1;
            return { ...vars, i: newI };
        },
        /* 4: Line 5 */ (vars) => {
            const i = vars.i as number;
            const edgeList = vars.edgeList as number[][];
            // 配列は0-basedなので i-1
            const edge = edgeList[i - 1];
            return { ...vars, u: edge[0] };
        },
        /* 5: Line 6 */ (vars) => {
            const i = vars.i as number;
            const edgeList = vars.edgeList as number[][];
            const edge = edgeList[i - 1];
            return { ...vars, v: edge[1] };
        },
        
        /* 6: Line 7 ([ ? ]) */ 
        (vars) => {
            const u = vars.u as number;
            const v = vars.v as number;
            const variant = vars._variant as string || 'エ'; // デフォルト正解
            
            // 行列のディープコピーを作成
            const newMatrix = (vars.adjMatrix as number[][]).map(row => [...row]);
            
            // 1-basedの頂点番号を0-basedのインデックスに変換してアクセス
            const idxU = u - 1;
            const idxV = v - 1;

            switch (variant) {
                case 'ア': // adjMatrix[u, u] <- 1
                    newMatrix[idxU][idxU] = 1;
                    break;
                case 'イ': // adjMatrix[u, u] <- 1, adjMatrix[v, v] <- 1
                    newMatrix[idxU][idxU] = 1;
                    newMatrix[idxV][idxV] = 1;
                    break;
                case 'ウ': // adjMatrix[u, v] <- 1
                    newMatrix[idxU][idxV] = 1;
                    break;
                case 'エ': // adjMatrix[u, v] <- 1, adjMatrix[v, u] <- 1 (正解)
                    newMatrix[idxU][idxV] = 1;
                    newMatrix[idxV][idxU] = 1;
                    break;
                case 'オ': // adjMatrix[v, u] <- 1
                    newMatrix[idxV][idxU] = 1;
                    break;
                case 'カ': // adjMatrix[v, v] <- 1
                    newMatrix[idxV][idxV] = 1;
                    break;
                default:
                    newMatrix[idxU][idxV] = 1;
                    newMatrix[idxV][idxU] = 1;
                    break;
            }
            
            return { ...vars, adjMatrix: newMatrix };
        },
        
        /* 7: Line 8 */ (vars) => vars, // endfor
        /* 8: Line 9 */ (vars) => vars, // return
    ],

    calculateNextLine(currentLine, vars, variant) {
        if (vars.edgeList === null) return currentLine;

        const edgeList = vars.edgeList as number[][];
        // iがnullならまだループ前(0相当)
        const i = (vars.i !== null) ? (vars.i as number) : 0;

        switch (currentLine) {
            case 0: return 1; // -> Line 2
            case 1: return 2; // -> Line 3
            case 2: return 3; // -> Line 4 (for start)
            
            case 3: // Line 4: for (i ...)
                // 次の i が edgeList.length 以下ならループ継続、そうでなければ終了
                // traceLogic実行前なので、今の i+1 が次の i
                return (i + 1 <= edgeList.length) ? 4 : 8; // -> Line 5 or Line 9

            case 4: return 5; // -> Line 6
            case 5: return 6; // -> Line 7
            case 6: return 7; // -> Line 8 (endfor)
            
            case 7: // Line 8: endfor
                return 3; // -> Line 4 (loop check)

            case 8: // Line 9: return
                return 99; // 終了

            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問36: マージアルゴリズムのロジック ---
// =================================================================================
const mergeAlgorithmLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars: VariablesState) => vars,
        /* 1: Line 2 */ (vars: VariablesState) => ({ ...vars, n1: (vars.data1 as number[]).length }),
        /* 2: Line 3 */ (vars: VariablesState) => ({ ...vars, n2: (vars.data2 as number[]).length }),
        /* 3: Line 4 */ (vars: VariablesState) => ({ ...vars, work: new Array((vars.n1 as number) + (vars.n2 as number)).fill(null) }),
        /* 4: Line 5 */ (vars: VariablesState) => ({ ...vars, i: 1 }),
        /* 5: Line 6 */ (vars: VariablesState) => ({ ...vars, j: 1 }),
        /* 6: Line 7 */ (vars: VariablesState) => ({ ...vars, k: 1, alpha_executed: 0 }),
        /* 7: Line 8 */ (vars: VariablesState) => vars, // blank
        /* 8: Line 9 */ (vars: VariablesState) => vars, // while
        /* 9: Line 10 */ (vars: VariablesState) => vars, // if
        /* 10: Line 11 */(vars: VariablesState) => {
            const newWork = [...(vars.work as any[])];
            newWork[(vars.k as number) - 1] = (vars.data1 as number[])[(vars.i as number) - 1];
            return { ...vars, work: newWork };
        },
        /* 11: Line 12 */ (vars: VariablesState) => ({ ...vars, i: (vars.i as number) + 1 }),
        /* 12: Line 13 */ (vars: VariablesState) => vars, // else
        /* 13: Line 14 */(vars: VariablesState) => {
            const newWork = [...(vars.work as any[])];
            newWork[(vars.k as number) - 1] = (vars.data2 as number[])[(vars.j as number) - 1];
            return { ...vars, work: newWork };
        },
        /* 14: Line 15 */ (vars: VariablesState) => ({ ...vars, j: (vars.j as number) + 1 }),
        /* 15: Line 16 */ (vars: VariablesState) => vars, // endif
        /* 16: Line 17 */ (vars: VariablesState) => ({ ...vars, k: (vars.k as number) + 1 }),
        /* 17: Line 18 */ (vars: VariablesState) => vars, // endwhile
        /* 18: Line 19 */ (vars: VariablesState) => vars, // blank
        /* 19: Line 20 */ (vars: VariablesState) => vars, // while
        /* 20: Line 21 */(vars: VariablesState) => {
            const newWork = [...(vars.work as any[])];
            newWork[(vars.k as number) - 1] = (vars.data1 as number[])[(vars.i as number) - 1];
            return { ...vars, work: newWork };
        },
        /* 21: Line 22 */ (vars: VariablesState) => ({ ...vars, i: (vars.i as number) + 1 }),
        /* 22: Line 23 */ (vars: VariablesState) => ({ ...vars, k: (vars.k as number) + 1 }),
        /* 23: Line 24 */ (vars: VariablesState) => vars, // endwhile
        /* 24: Line 25 */ (vars: VariablesState) => vars, // blank
        /* 25: Line 26 */ (vars: VariablesState) => vars, // while
        /* 26: Line 27 */(vars: VariablesState) => {
            const newWork = [...(vars.work as any[])];
            newWork[(vars.k as number) - 1] = (vars.data2 as number[])[(vars.j as number) - 1];
            return { ...vars, work: newWork, alpha_executed: (vars.alpha_executed as number) + 1 };
        },
        /* 27: Line 28 */ (vars: VariablesState) => ({ ...vars, j: (vars.j as number) + 1 }),
        /* 28: Line 29 */ (vars: VariablesState) => ({ ...vars, k: (vars.k as number) + 1 }),
        /* 29: Line 30 */ (vars: VariablesState) => vars, // endwhile
        /* 30: Line 31 */ (vars: VariablesState) => vars, // blank
        /* 31: Line 32 */ (vars: VariablesState) => vars, // return
    ],
    calculateNextLine(currentLine: number, vars: VariablesState): number {
        const { i, j, n1, n2, data1, data2 } = vars;
        switch (currentLine) {
            case 8: // while ((i <= n1) and (j <= n2))
                return (i <= n1 && j <= n2) ? 9 : 19;
            case 9: // if (data1[i] <= data2[j])
                return (data1 as number[])[i - 1] <= (data2 as number[])[j - 1] ? 10 : 13;
            case 10: case 13: return currentLine + 1;
            case 11: case 14: return 16;
            case 16: return 8; // end of first while loop body
            
            case 19: // while (i <= n1)
                return i <= n1 ? 20 : 25;
            case 20: case 21: case 22: return currentLine + 1;
            case 23: return 19; // end of second while loop body

            case 25: // while (j <= n2)
                return j <= n2 ? 26 : 31;
            case 26: case 27: case 28: return currentLine + 1;
            case 29: return 25; // end of third while loop body

            case 31: return 99; // return
            default: return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 【完全修正版】問37: 商品関連度分析ロジック ---
// =================================================================================
const associationAnalysisLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState, variant: string | null) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => vars,
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => vars,
        
        /* 4: Line 5 (allItems) */
        (vars) => {
            const orders = vars.orders as string[][];
            const set = new Set<string>();
            orders.forEach(o => o.forEach(item => set.add(item)));
            return { ...vars, allItems: Array.from(set).sort() };
        },
        
        /* 5: Line 6 */ (vars) => vars,
        
        /* 6: Line 7 (otherItems) */
        (vars) => {
            const all = (vars.allItems as string[]) || [];
            const target = vars.item as string;
            return { ...vars, otherItems: all.filter(x => x !== target) };
        },
        
        /* 7: Line 8 */ (vars) => vars,
        
        /* 8: Line 9 (init i, itemCount) */
        (vars) => ({ ...vars, i: null, itemCount: 0, order_idx: null }),
        
        /* 9: Line 10 (arrayK init) */
        (vars) => {
            const other = (vars.otherItems as string[]) || [];
            return { ...vars, arrayK: new Array(other.length).fill(0) };
        },
        
        /* 10: Line 11 (arrayM init) */
        (vars) => {
            const other = (vars.otherItems as string[]) || [];
            return { ...vars, arrayM: new Array(other.length).fill(0) };
        },
        
        /* 11: Line 12 (maxL init) */
        (vars) => ({ ...vars, valueL: null, maxL: -Infinity }),
        
        /* 12: Line 13 (relatedItem init) */ 
        (vars) => ({ ...vars, relatedItem: '' }),
        
        /* 13: Line 14 */ (vars) => vars,
        
        /* 14: Line 15 (for order in orders) */
        (vars) => {
            // 配列が未定義ならここで緊急初期化 (安全策)
            const other = (vars.otherItems as string[]) || [];
            let k = vars.arrayK;
            let m = vars.arrayM;
            if (!k) k = new Array(other.length).fill(0);
            if (!m) m = new Array(other.length).fill(0);

            const idx = vars.order_idx === null ? 0 : (vars.order_idx as number) + 1;
            return { ...vars, order_idx: idx, arrayK: k, arrayM: m };
        },
        
        /* 15: Line 16 (if order contains item) */ (vars) => vars,
        
        /* 16: Line 17 (itemCount++) */
        (vars) => ({ ...vars, itemCount: (vars.itemCount as number) + 1 }),
        
        /* 17: Line 18 (endif) */ (vars) => vars,
        
        /* 18: Line 19 (for i in otherItems) */
        (vars) => {
            const newI = vars.i === null ? 1 : (vars.i as number) + 1;
            return { ...vars, i: newI };
        },
        
        /* 19: Line 20 (if order contains otherItems[i]) */ (vars) => vars,
        /* 20: Line 21 (if order contains item) */ (vars) => vars,
        
        /* 21: Line 22 (update [a]) */
        (vars) => {
            const variant = vars._variant as string || 'オ';
            const i = (vars.i as number) - 1;
            
            // ★修正: 配列がnullの場合のガード
            const otherLen = (vars.otherItems as string[] || []).length;
            const arrayM = vars.arrayM ? [...(vars.arrayM as number[])] : new Array(otherLen).fill(0);
            const arrayK = vars.arrayK ? [...(vars.arrayK as number[])] : new Array(otherLen).fill(0);
            
            if (['エ', 'オ', 'カ'].includes(variant)) { // a = M
                arrayM[i]++;
            } else { // a = K
                arrayK[i]++;
            }
            return { ...vars, arrayM, arrayK };
        },
        
        /* 22: Line 23 (endif) */ (vars) => vars,
        
        /* 23: Line 24 (update [b]) */
        (vars) => {
            const variant = vars._variant as string || 'オ';
            const i = (vars.i as number) - 1;
            
            const otherLen = (vars.otherItems as string[] || []).length;
            const arrayM = vars.arrayM ? [...(vars.arrayM as number[])] : new Array(otherLen).fill(0);
            const arrayK = vars.arrayK ? [...(vars.arrayK as number[])] : new Array(otherLen).fill(0);
            
            if (['エ', 'オ', 'カ'].includes(variant)) { // b = K
                arrayK[i]++;
            } else { // b = M
                arrayM[i]++;
            }
            return { ...vars, arrayM, arrayK };
        },
        
        /* 24: Line 25 (endif) */ (vars) => vars,
        /* 25: Line 26 (endfor inner) */ (vars) => vars,
        
        /* 26: Line 27 (endfor outer) */ 
        (vars) => ({ ...vars, i: null }), // iリセット
        
        /* 27: Line 28 (for i in otherItems - calc loop) */
        (vars) => {
            const newI = vars.i === null ? 1 : (vars.i as number) + 1;
            return { ...vars, i: newI };
        },
        
        /* 28: Line 29 (valueL calc) */
        (vars) => {
            const variant = vars._variant as string || 'オ';
            const i = (vars.i as number) - 1;
            // ガード付きアクセス
            const M = vars.arrayM ? (vars.arrayM as number[])[i] : 0;
            const K = vars.arrayK ? (vars.arrayK as number[])[i] : 0;
            const itemCount = vars.itemCount as number;
            
            let c_val = 0;
            if (['ア', 'エ'].includes(variant)) c_val = (vars.allItems as string[] || []).length;
            else if (['イ', 'オ'].includes(variant)) c_val = (vars.orders as string[][]).length;
            else if (['ウ', 'カ'].includes(variant)) c_val = (vars.otherItems as string[] || []).length;
            
            let val = 0;
            if (itemCount * K !== 0) {
                val = (M * c_val) / (itemCount * K);
            }
            return { ...vars, valueL: val };
        },
        
        /* 29: Line 30 (comment) */ (vars) => vars,
        /* 30: Line 31 (if valueL > maxL) */ (vars) => vars,
        
        /* 31: Line 32 (maxL update) */
        (vars) => {
            const val = vars.valueL as number;
            const idx = (vars.i as number) - 1;
            const related = (vars.otherItems as string[])[idx];
            return { ...vars, maxL: val, relatedItem: related };
        },
        
        /* 32: Line 33 (relatedItem) */ (vars) => vars,
        /* 33: Line 34 (endif) */ (vars) => vars,
        /* 34: Line 35 (endfor) */ (vars) => vars,
        
        /* 35: Line 36 (output) */ 
        (vars) => ({ ...vars, output: [`${vars.relatedItem}, ${vars.maxL}`] }),
    ],

    calculateNextLine(currentLine, vars, variant) {
        if (vars.orders === null) return currentLine;

        const lineNum = currentLine + 1; // 1-based
        const orders = vars.orders as string[][];
        const otherItems = (vars.otherItems as string[]) || [];
        const item = vars.item as string;

        switch (lineNum) {
            case 1: return 2;
            case 2: return 3;
            case 3: return 4;
            case 4: return 5;
            case 5: return 6;
            case 6: return 7;
            case 7: return 8;
            case 8: return 9;
            case 9: return 10; // Line 9 -> 10 (arrayK init)
            case 10: return 11; // Line 10 -> 11 (arrayM init)
            case 11: return 12; // Line 11 -> 12 (maxL init)
            case 12: return 13;
            case 13: return 14;
            case 14: return 15; // Line 14 -> 15 (for start)

            case 15: // Line 15: for (order in orders)
                const nextOrderIdx = (vars.order_idx === null) ? 0 : vars.order_idx + 1; // traceLogicでの更新予測
                // 更新されたidxが length と等しくなる(==length)とき、ループは終了する
                if (nextOrderIdx > orders.length) return 27; // 安全策
                if (nextOrderIdx === orders.length) return 27; // 次で終わり -> Line 28 (index 27)
                return 15; // -> Line 16 (index 15)

            case 16: // Line 16: if (item in order)
                const currentOrder = orders[vars.order_idx as number];
                if (currentOrder.includes(item)) return 16; // -> Line 17
                return 18; // -> Line 19 (else/endif)

            case 17: return 17; // -> 18
            case 18: return 18; // -> 19

            case 19: // Line 19: for (i in otherItems)
                const nextI = (vars.i === null) ? 1 : vars.i + 1;
                if (nextI > otherItems.length) return 26; // -> Line 27 (endfor outer)
                return 19; // -> Line 20

            case 20: // Line 20: if (order contains otherItems[i])
                const ord = orders[vars.order_idx as number];
                const oth = otherItems[(vars.i as number) - 1];
                if (ord.includes(oth)) return 20; // -> Line 21
                return 25; // -> Line 26 (endfor inner)

            case 21: // Line 21: if (order contains item)
                const ord2 = orders[vars.order_idx as number];
                if (ord2.includes(item)) return 21; // -> Line 22
                return 23; // -> Line 24 ([b])

            case 22: return 22; // -> 23
            case 23: return 23; // -> 24
            case 24: return 24; // -> 25
            case 25: return 18; // endfor inner -> Line 19 (loop check)

            case 26: return 14; // endfor outer -> Line 15 (loop check)

            case 27: // Line 28: for (i in otherItems) - calc
                const nextCalcI = (vars.i === null) ? 1 : vars.i + 1;
                if (nextCalcI > otherItems.length) return 35; // -> Line 36 (output)
                return 28; // -> Line 29

            case 28: return 29; // -> 30
            case 29: return 29; // -> 30
            case 30: return 30; // -> 31
            case 31: // Line 31: if valueL > maxL
                return (vars.valueL > vars.maxL) ? 31 : 33; // -> 32 or 34

            case 32: return 32; // -> 33
            case 33: return 33; // -> 34
            case 34: return 27; // endfor calc -> Line 28

            case 35: return 99; // output -> finish

            default: return currentLine + 1;
        }
    },
};


// 共通の型定義
export interface LogicDef {
    traceLogic: TraceStep[];
    calculateNextLine: (
        currentLine: number, 
        vars: VariablesState, 
        variant?: string | null  // ★ここを追加（?をつけることで省略可能にする）
    ) => number;
}
// ID: 39 (成績評価) のロジック
const logic_39: LogicDef = {
  traceLogic: [
    /* 0: signature */ (vars) => vars,
    /* 1: var decl */  (vars) => ({ ...vars, eResult: null }),
    /* 2: if >= 90 */  (vars) => vars,
    /* 3: S */         (vars) => ({ ...vars, eResult: "評価S" }),
    /* 4: elif >= 70*/ (vars) => vars,
    /* 5: A */         (vars) => ({ ...vars, eResult: "評価A" }),
    /* 6: else */      (vars) => vars,
    /* 7: B */         (vars) => ({ ...vars, eResult: "評価B" }),
    /* 8: endif */     (vars) => vars,
    /* 9: return */    (vars) => vars,
  ],
  calculateNextLine: (line, vars) => {
    // 入力データがセットされていなければ進まない
    const inData = vars.inData;
    if (inData === null || inData === undefined) return line;

    const val = Number(inData);

    switch (line) {
      case 2: // if (inData >= 90)
        return (val >= 90) ? 3 : 4; // 真なら評価S(3)へ、偽ならelseif(4)へ
      
      case 3: // eResult <- "評価S" の実行後
        return 9; // return(9)へジャンプ (endifをスキップ)

      case 4: // elseif (inData >= 70)
        return (val >= 70) ? 5 : 6; // 真なら評価A(5)へ、偽ならelse(6)へ

      case 5: // eResult <- "評価A" の実行後
        return 9; // return(9)へジャンプ

      case 6: // else
        return 7; // 評価B(7)へ

      case 7: // eResult <- "評価B" の実行後
        return 9; // return(9)へジャンプ

      case 8: // endif
        return 9; // return(9)へ

      default:
        return line + 1;
    }
  }
};

// ID: 40 (総和計算 - バグあり) のロジック
const logic_40: LogicDef = {
  traceLogic: [
    /* 0: signature */ (vars) => vars,
    /* 1: x <- 10 */   (vars) => ({ ...vars, x: 10 }), // バグ: xの初期化
    /* 2: i decl */    (vars) => vars,
    /* 3: for */       (vars) => {
       // ループ開始時または継続時のiの更新
       if (vars.i === null) return { ...vars, i: 10 };
       return vars;
    },
    /* 4: x+=i */      (vars) => ({ ...vars, x: (vars.x as number) + (vars.i as number) }),
    /* 5: endfor */    (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
    /* 6: return */    (vars) => vars,
  ],
  calculateNextLine: (line, vars) => {
    if (vars.num === null) return line;
    switch (line) {
      case 3: // for判定
        return (vars.i as number) <= (vars.num as number) ? 4 : 6;
      case 4: return 5;
      case 5: return 3; // loop back
      case 6: return 99; // end
      default: return line + 1;
    }
  }
};

// ID: 41 (最大値探索) のロジック
const logic_41: LogicDef = {
  traceLogic: [
    /* 0: signature */ (vars) => vars,
    /* 1: n */         (vars) => ({ ...vars, n: (vars.data as number[]).length }),
    /* 2: a, i */      (vars) => vars,
    /* 3: a init */    (vars) => ({ ...vars, a: (vars.data as number[])[(vars.n as number) - 1] }),
    /* 4: for */       (vars) => {
       // 変数更新側でも初期化を行う
       if (vars.i === null) return { ...vars, i: (vars.n as number) - 1 };
       return vars;
    },
    /* 5: if */        (vars) => vars,
    /* 6: a update */  (vars) => ({ ...vars, a: (vars.data as number[])[(vars.i as number) - 1] }),
    /* 7: endif */     (vars) => vars,
    /* 8: endfor */    (vars) => ({ ...vars, i: (vars.i as number) - 1 }),
    /* 9: return */    (vars) => vars,
  ],
  calculateNextLine: (line, vars) => {
    if (vars.data === null) return line;
    
    switch (line) {
      case 4: // for (i を n - 1 から 1 まで...)
        // ▼▼▼【修正】i が null (初回) の場合は初期値 (n-1) を使用して判定する ▼▼▼
        const currentI = (vars.i === null) ? (vars.n as number) - 1 : (vars.i as number);
        return currentI >= 1 ? 5 : 9;

      case 5: // if (data[i] > a)
        // 安全策: iがnullなら初期値を使う
        const idx = (vars.i === null) ? (vars.n as number) - 1 : (vars.i as number);
        // 配列インデックスは 0-based なので idx - 1
        return (vars.data as number[])[idx - 1] > (vars.a as number) ? 6 : 7;
      
      case 6: return 7;
      case 7: return 8;
      case 8: return 4; // endfor -> for文の頭に戻る
      case 9: return 99;
      default: return line + 1;
    }
  }
};

// ID: 42 (配列連結) のロジック
const logic_42: LogicDef = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 (len_x) */ 
        (vars) => (!vars.x ? vars : { ...vars, len_x: vars.x.length }),
        
        /* 2: Line 3 (len_y) */
        (vars) => (!vars.y ? vars : { ...vars, len_y: vars.y.length }),
        
        /* 3: Line 4 (z init) */
        (vars) => {
            if (vars.len_x === undefined || vars.len_y === undefined) return vars;
            return { ...vars, z: new Array((vars.len_x as number) + (vars.len_y as number)).fill(null) };
        },
        
        /* 4: Line 5 (k decl) */ (vars) => vars,
        
        /* 5: Line 6 (for 1 start) */
        (vars) => ({ ...vars, k: vars.k === null ? 1 : vars.k }),
        
        /* 6: Line 7 ([a]) */
        (vars) => {
            if (!vars.z || vars.k === null) return vars;
            const newZ = [...vars.z];
            const k = vars.k as number;
            const variant = vars._variant as string || 'ア';
            
            // 選択肢による分岐: [a]
            if (['ア', 'イ'].includes(variant)) {
                // z[k] <- x[k]
                if (vars.x && vars.x[k-1] !== undefined) newZ[k-1] = vars.x[k-1];
            } else {
                // z[k] <- y[k] (ウ, エ)
                if (vars.y && vars.y[k-1] !== undefined) newZ[k-1] = vars.y[k-1];
            }
            return { ...vars, z: newZ };
        },
        
        /* 7: Line 8 (endfor 1) */
        (vars) => ({ ...vars, k: (vars.k as number) + 1 }),
        
        /* 8: Line 9 (for 2 start) */
        (vars) => {
            // ループ2の初期化: k=1
            // 既にループ2に入っているなら何もしない
            if (vars.loop2_active) return vars;
            // まだなら初期化
            return { ...vars, k: 1, loop2_active: true };
        },
        
        /* 9: Line 10 ([b]) */
        (vars) => {
            if (!vars.z || vars.k === null) return vars;
            const newZ = [...vars.z];
            const k = vars.k as number;
            const len_x = vars.len_x as number;
            const len_y = vars.len_y as number;
            const variant = vars._variant as string || 'ア';
            
            // 選択肢による分岐: [b]
            if (variant === 'ア' || variant === 'ウ') {
                // b: z[len_x + k] <- ...
                const idx = len_x + k - 1;
                if (idx < newZ.length) {
                    if (variant === 'ア') { // <- y[k]
                        if (vars.y) newZ[idx] = vars.y[k-1];
                    } else { // <- x[k] (ウ)
                        if (vars.x) newZ[idx] = vars.x[k-1];
                    }
                }
            } else {
                // b: z[len_y + k] <- ... (イ, エ)
                const idx = len_y + k - 1;
                // ※ len_y + k は、xとyの長さが違う場合、意図しない位置(または範囲外)になる可能性がある
                if (idx < newZ.length) {
                    if (variant === 'イ') { // <- y[k]
                        if (vars.y) newZ[idx] = vars.y[k-1];
                    } else { // <- x[k] (エ)
                        if (vars.x) newZ[idx] = vars.x[k-1];
                    }
                }
            }
            return { ...vars, z: newZ };
        },
        
        /* 10: Line 11 (endfor 2) */
        (vars) => ({ ...vars, k: (vars.k as number) + 1 }),
        
        /* 11: Line 12 (return) */ (vars) => vars,
    ],

    calculateNextLine(currentLine, vars, variant) {
        if (!vars.x || !vars.y) return currentLine;

        const lineNum = currentLine + 1; // 1-based
        const len_x = vars.len_x as number;
        const len_y = vars.len_y as number;
        
        // k は traceLogic で更新される前の値を見る必要があるケースがあるが、
        // ここでは traceLogic 適用後の値(次の k)を予測して判定する
        const k = (vars.k === null) ? 1 : vars.k;

        switch (lineNum) {
            case 6: // Line 6: for 1 (k <= len_x)
                // traceLogic[5]でkが設定/維持される。
                // k <= len_x なら Line 7 へ、そうでなければ Line 9 へ
                return (k <= len_x) ? 6 : 8; // -> index 6 or 8

            case 7: return 7; // Line 7 -> Line 8
            case 8: return 5; // Line 8 (endfor) -> Line 6 (loop check)

            case 9: // Line 9: for 2 (k <= len_y)
                // traceLogic[8]で k=1 にリセットされる(初回)。
                // k <= len_y なら Line 10 へ、そうでなければ Line 12 へ
                // ※ここで見る k は、直前のステップで更新されたもの(ループ中はk+1されている)
                
                // ただし、calculateNextLineは「現在の行(Line 9)」から「次」を決める。
                // Line 9 の traceLogic は「k初期化(初回のみ)」。
                // つまり、この時点での k (または初期化後の k) を使って判定。
                
                let checkK = k;
                if (!vars.loop2_active) checkK = 1; // 初回は1
                
                return (checkK <= len_y) ? 9 : 11; // -> index 9 or 11

            case 10: return 10; // Line 10 -> Line 11
            case 11: return 8; // Line 11 (endfor) -> Line 9 (loop check)

            case 12: return 99; // return

            default: return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問43: 配列の反転ロジック (選択肢対応版) ---
// =================================================================================
const logic_43: LogicDef = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => vars,
        /* 2: Line 3 (left=1) */ (vars) => ({...vars, left: 1}),
        /* 3: Line 4 (right=len) */ 
        (vars) => {
            if (!vars.array) return vars;
            return { ...vars, right: (vars.array as number[]).length };
        },
        
        /* 4: Line 5 (while check) */ (vars) => vars,
        
        /* 5: Line 6 (tmp = array[right]) */ 
        (vars) => {
            if (!vars.array || vars.right === null) return vars;
            // 配列は0-based、rightは1-based
            const val = (vars.array as number[])[(vars.right as number) - 1];
            return {...vars, tmp: val};
        },
        
        /* 6: Line 7 (array[right] = [?]) */ 
        (vars) => {
            if (!vars.array || vars.left === null || vars.right === null) return vars;
            const newArr = [...vars.array as number[]];
            const rightIdx = (vars.right as number) - 1;
            const left = vars.left as number;
            const variant = vars._variant as string || 'ア';
            
            // 選択肢に応じた代入元のインデックス計算
            let srcIdx = left - 1; // デフォルト(ア): left (0-based)
            
            if (variant === 'イ') { // left + 1
                srcIdx = left; // 1-basedで left+1 -> 0-basedで left
            } else if (variant === 'ウ') { // left - 1
                srcIdx = left - 2;
            } else if (variant === 'エ') { // array[tmp - left] (めちゃくちゃなインデックス)
                const tmp = vars.tmp as number;
                srcIdx = tmp - left - 1;
            }
            
            // 値の取得と代入
            if (srcIdx >= 0 && srcIdx < newArr.length) {
                newArr[rightIdx] = newArr[srcIdx];
            } else {
                // 範囲外なら undefined または null が入る挙動 (ここでは0を入れておくか、何もしない)
                // newArr[rightIdx] = undefined; 
            }
            return {...vars, array: newArr};
        },
        
        /* 7: Line 8 ([?] = tmp) */ 
        (vars) => {
            if (!vars.array || vars.left === null) return vars;
            const newArr = [...vars.array as number[]];
            const left = vars.left as number;
            const variant = vars._variant as string || 'ア';
            const tmp = vars.tmp as number;
            
            // 選択肢に応じた代入先のインデックス計算
            let destIdx = left - 1; // デフォルト(ア)
            
            if (variant === 'イ') destIdx = left;
            else if (variant === 'ウ') destIdx = left - 2;
            else if (variant === 'エ') destIdx = tmp - left - 1;
            
            if (destIdx >= 0 && destIdx < newArr.length) {
                newArr[destIdx] = tmp;
            }
            return {...vars, array: newArr};
        },
        
        /* 8: Line 9 (left++) */ 
        (vars) => ({...vars, left: (vars.left as number) + 1}),
        
        /* 9: Line 10 (right--) */ 
        (vars) => ({...vars, right: (vars.right as number) - 1}),
        
        /* 10: Line 11 (endwhile) */ (vars) => vars,
    ],

    calculateNextLine: (line, vars) => {
        if(!vars.array) return line;
        
        const lineNum = line + 1; // 1-based index
        
        switch (lineNum) {
            case 5: // while check
                const left = vars.left as number;
                const right = vars.right as number;
                return (left < right) ? 5 : 10; // -> Line 6 or Line 11
                
            case 10: // right-- done
                return 4; // -> Line 5 (loop check)
                
            case 11: // endwhile
                return 99; // finish
                
            default: return line + 1;
        }
    }
};

// ID: 44 (sumArray - 間接参照) のロジック
const logic_44: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({...vars, n: (vars.b as number[]).length}),
        (vars) => ({...vars, x: 0}),
        (vars) => { if(vars.i === null) return {...vars, i: 1}; return vars; }, // for
        (vars) => { // x += a[b[i]]
            const idx = (vars.b as number[])[(vars.i as number) - 1];
            const val = (vars.a as number[])[idx - 1]; // 1-based
            return {...vars, x: (vars.x as number) + val};
        },
        (vars) => ({...vars, i: (vars.i as number) + 1}), // endfor
        (vars) => vars // return
    ],
    calculateNextLine: (line, vars) => {
        if(!vars.a) return line;
        if(line === 3) return (vars.i as number) <= (vars.n as number) ? 4 : 6;
        if(line === 5) return 3;
        if(line === 6) return 99;
        return line + 1;
    }
}

// =================================================================================
// --- 問45: 挿入ソート (Step) ロジック (選択肢対応版) ---
// =================================================================================
const logic_45: LogicDef = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => vars,
        /* 2: Line 3 (temp set) */ 
        (vars) => {
            if (!vars.nums || vars.pos === null) return vars;
            return { ...vars, temp: (vars.nums as number[])[(vars.pos as number) - 1] };
        },
        /* 3: Line 4 (j set) */ 
        (vars) => {
            if (vars.pos === null) return vars;
            return { ...vars, j: (vars.pos as number) - 1 };
        },
        /* 4: Line 5 (while check) */ (vars) => vars,
        
        /* 5: Line 6 (nums[j+1] <- nums[j]) */ 
        (vars) => {
            if (!vars.nums || vars.j === null) return vars;
            const newNums = [...vars.nums as number[]];
            const j = vars.j as number; // 1-based index for logic, but array is 0-based
            // nums[j+1] (idx: j) <- nums[j] (idx: j-1)
            // 配列範囲チェック
            if (j >= 1 && j <= newNums.length) {
                newNums[j] = newNums[j - 1]; 
            }
            return { ...vars, nums: newNums };
        },
        
        /* 6: Line 7 (j--) */ 
        (vars) => ({ ...vars, j: (vars.j as number) - 1 }),
        
        /* 7: Line 8 (endwhile) */ (vars) => vars,
        
        /* 8: Line 9 (nums[j+1] <- temp) */ 
        (vars) => {
            if (!vars.nums || vars.j === null) return vars;
            const newNums = [...vars.nums as number[]];
            const j = vars.j as number;
            // nums[j+1] (idx: j) <- temp
            if (j >= 0 && j < newNums.length) {
                newNums[j] = vars.temp as number;
            }
            return { ...vars, nums: newNums };
        }
    ],

    calculateNextLine: (line, vars, variant) => {
        if (!vars.nums) return line;
        
        const lineNum = line + 1; // 1-based

        switch (lineNum) {
            case 5: // Line 5: while check
                const j = vars.j as number;
                const temp = vars.temp as number;
                const nums = vars.nums as number[];
                const selectedVariant = variant || 'エ'; // デフォルト正解

                // 範囲チェック (j >= 1) は必須前提
                if (j < 1) return 9; // -> Line 9 (end loop)

                const valJ = nums[j - 1]; // nums[j]
                let condition = false;

                switch (selectedVariant) {
                    case 'ア': condition = (valJ === temp); break;
                    case 'イ': condition = (valJ !== temp); break;
                    case 'ウ': condition = (valJ < temp); break;
                    case 'エ': condition = (valJ > temp); break; // 正解
                    default: condition = (valJ > temp); break;
                }

                // Trueならループ内(Line 6)へ、Falseならループ外(Line 9)へ
                return condition ? 5 : 8; // -> index 5 or 8

            case 6: return 6; // Line 6 -> Line 7
            case 7: return 7; // Line 7 -> Line 8
            case 8: return 4; // Line 8 (endwhile) -> Line 5 (check)

            case 9: return 99; // Line 9 (insert) -> end

            default: return line + 1;
        }
    }
};

// ID: 46 (GCD - While)
const logic_46: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({...vars, m: vars.a}),
        (vars) => ({...vars, n: vars.b}),
        (vars) => vars, // while
        (vars) => vars, // if m > n
        (vars) => ({...vars, m: (vars.m as number) - (vars.n as number)}),
        (vars) => vars, // else
        (vars) => ({...vars, n: (vars.n as number) - (vars.m as number)}),
        (vars) => vars, // endif
        (vars) => vars, // endwhile
        (vars) => vars, // return
    ],
    calculateNextLine: (line, vars) => {
        if (vars.m === null) {
            if (line < 3) return line + 1; // 初期化中は進む
            return line; // それ以外でnullなら待機（異常系）
        }

        switch(line) {
            case 3: return (vars.m !== vars.n) ? 4 : 10; // while
            case 4: return (vars.m > vars.n) ? 5 : 7; // if
            case 5: return 8;
            case 7: return 8;
            case 8: return 9;
            case 9: return 3; // loop back
            case 10: return 99;
            default: return line + 1;
        }
    }
}

// =================================================================================
// --- 問47: 数字文字列変換ロジック (選択肢対応版) ---
// =================================================================================
const logic_47: LogicDef = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => vars,
        /* 2: Line 3 (val=0) */ (vars) => ({ ...vars, val: 0 }),
        /* 3: Line 4 (i=1) */ (vars) => ({ ...vars, i: 1 }),
        
        /* 4: Line 5 (while [a]) */ (vars) => vars,
        
        /* 5: Line 6 (tmp = charToInt) */ 
        (vars) => {
            if (!vars.str || vars.i === null) return vars;
            const str = vars.str as string[];
            const i = vars.i as number;
            // 範囲チェック
            if (i > str.length) return vars;
            
            const char = str[i - 1];
            // $ なら数値化できないので 0 または null 扱いだが、
            // ループ条件によっては $ を読み込むこともあるのでガード
            const num = (char === '$') ? 0 : parseInt(char);
            return { ...vars, tmp: isNaN(num) ? 0 : num };
        },
        
        /* 6: Line 7 ([b]) */ 
        (vars) => {
            const variant = vars._variant as string || 'ウ';
            const val = vars.val as number;
            const tmp = vars.tmp as number;
            let newVal = val;

            if (variant === 'ア') {
                // b: val <- val + tmp
                newVal = val + tmp;
            } else if (variant === 'イ' || variant === 'ウ') {
                // b: val <- val * 10 + tmp (正解の式)
                newVal = val * 10 + tmp;
            } else if (variant === 'エ') {
                // b: val <- val + tmp * 10
                newVal = val + tmp * 10;
            }
            return { ...vars, val: newVal };
        },
        
        /* 7: Line 8 (i++) */ 
        (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
        
        /* 8: Line 9 (endwhile) */ (vars) => vars,
        /* 9: Line 10 (return) */ (vars) => vars,
    ],

    calculateNextLine: (line, vars, variant) => {
        if (!vars.str) return line;
        
        const lineNum = line + 1; // 1-based
        const str = vars.str as string[];
        const i = vars.i as number; // 1-based
        const selectedVariant = variant || 'ウ';

        switch (lineNum) {
            case 5: // Line 5: while [a]
                // インデックス範囲チェック (安全策)
                if (i > str.length) return 9; // -> endwhile

                const char = str[i - 1];
                let condition = false;

                if (selectedVariant === 'ア' || selectedVariant === 'イ') {
                    // a: str[i] = "$"
                    condition = (char === "$");
                } else {
                    // a: str[i] ≠ "$" (ウ, エ)
                    condition = (char !== "$");
                }

                // Trueならループ内(Line 6)へ、Falseならループ外(Line 10)へ
                // Line 9 (endwhile) はスキップして return へ行くのが自然だが
                // プログラム構造的には Line 9 を通るか、即 Line 10 か。
                // ここでは Line 6 or Line 10 (return) とする
                return condition ? 5 : 9; // -> index 5 or 9

            case 6: return 6; // -> Line 7
            case 7: return 7; // -> Line 8
            case 8: return 8; // -> Line 9
            case 9: return 4; // Line 9 (endwhile) -> Line 5 (check)

            case 10: return 99; // return

            default: return line + 1;
        }
    }
};

// =================================================================================
// --- 問48: 10進数から2進数変換ロジック (選択肢対応版) ---
// =================================================================================
const logic_48: LogicDef = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 (bin init) */ (vars) => ({...vars, bin: Array(6).fill(null)}),
        /* 2: Line 3 (j = n) */ (vars) => ({...vars, j: vars.n}),
        /* 3: Line 4 (k decl) */ (vars) => vars,
        
        /* 4: Line 5 (for k) */ 
        (vars) => {
            if(vars.k === null) return {...vars, k: 6}; // 初回 k=6
            return vars; 
        },
        
        /* 5: Line 6 ([a]) */ 
        (vars) => {
            const variant = vars._variant as string || 'エ';
            const j = vars.j as number;
            const k = vars.k as number;
            const newBin = [...(vars.bin as number[])];
            const idx = k - 1; // 0-based

            // 商と余り
            const quo = Math.floor(j / 2);
            const rem = j % 2;

            // ア: j ← j / 2 の商
            if (variant === 'ア') return { ...vars, j: quo };
            
            // イ: j ← j / 2 の余り
            if (variant === 'イ') return { ...vars, j: rem };
            
            // ウ: bin[k] ← j / 2 の商
            if (variant === 'ウ') {
                newBin[idx] = quo;
                return { ...vars, bin: newBin };
            }
            
            // エ: bin[k] ← j / 2 の余り (正解)
            if (variant === 'エ') {
                newBin[idx] = rem;
                return { ...vars, bin: newBin };
            }
            
            return vars;
        },
        
        /* 6: Line 7 ([b]) */ 
        (vars) => {
            const variant = vars._variant as string || 'エ';
            const j = vars.j as number;
            const k = vars.k as number;
            const newBin = [...(vars.bin as number[])];
            const idx = k - 1;

            // 注意: Line 6 で j が更新されている場合、ここでの j は更新後の値になる
            // しかし、問題の意図としては「元の j に対する計算」であるはずだが、
            // 手続き型言語では行ごとに順次実行されるため、
            // 選択肢アの場合、aでjが更新されてしまうと、bの計算(bin[k] <- j%2)は「更新後のj」を使うことになる。
            // これが誤答の理由の一つ（計算結果が狂う）。
            // そのため、ここでは素直に「現在の変数の値」を使って計算する。

            const quo = Math.floor(j / 2);
            const rem = j % 2;

            // ア: bin[k] ← j / 2 の余り
            if (variant === 'ア') {
                newBin[idx] = rem;
                return { ...vars, bin: newBin };
            }
            
            // イ: bin[k] ← j / 2 の商
            if (variant === 'イ') {
                newBin[idx] = quo;
                return { ...vars, bin: newBin };
            }
            
            // ウ: j ← j / 2 の余り
            if (variant === 'ウ') return { ...vars, j: rem };
            
            // エ: j ← j / 2 の商 (正解)
            if (variant === 'エ') return { ...vars, j: quo };
            
            return vars;
        },
        
        /* 7: Line 8 (endfor) */ 
        (vars) => ({...vars, k: (vars.k as number) - 1}),
        
        /* 8: Line 9 (return) */ (vars) => vars,
    ],

    calculateNextLine: (line, vars, variant) => {
        if(vars.n === null) return line; 
        
        switch(line) {
            case 4: // for loop check
                const currentK = (vars.k === null) ? 6 : (vars.k as number);
                return currentK >= 1 ? 5 : 8; // -> Line 6 or Line 9
                
            case 7: // endfor -> loop check
                return 4; 
                
            case 8: // return
                return 99; 
                
            default: 
                return line + 1;
        }
    }
};

// =================================================================================
// --- 問49: 8ビット論理和ロジック (選択肢対応版) ---
// =================================================================================
const logic_49: LogicDef = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 (init) */ (vars) => ({...vars, result: null, flag: 128, output: [], i: null}),
        /* 2: Line 3 (calc result) */ (vars) => ({...vars, result: (vars.x as number) | (vars.y as number)}),
        
        /* 3: Line 4 (for i) */ 
        (vars) => {
            if(vars.i === null) return {...vars, i: 1};
            return vars;
        },
        
        /* 4: Line 5 (if [a]) */ (vars) => vars,
        
        /* 5: Line 6 (print 0) */ 
        (vars) => ({...vars, output: [...(vars.output as number[]), 0]}),
        
        /* 6: Line 7 (else) */ (vars) => vars,
        
        /* 7: Line 8 (print 1) */ 
        (vars) => ({...vars, output: [...(vars.output as number[]), 1]}),
        
        /* 8: Line 9 (endif) */ (vars) => vars,
        
        /* 9: Line 10 ([b]) */ 
        (vars) => {
            const variant = vars._variant as string || 'イ';
            let flag = vars.flag as number;
            
            // [b] シフト処理
            if (variant === 'ア' || variant === 'ウ') {
                flag = (flag << 1) & 0xFF; // 左シフト
            } else {
                flag = flag >> 1; // 右シフト
            }
            return {...vars, flag};
        },
        
        /* 10: Line 11 (endfor) */ 
        (vars) => ({...vars, i: (vars.i as number) + 1}),
    ],

    calculateNextLine: (line, vars, variant) => {
        if(vars.x === null) return line;
        
        const lineNum = line + 1; // 1-based
        
        // ★修正: 引数 variant がなければ vars._variant を参照する (安全策)
        const selectedVariant = variant || vars._variant || 'イ';

        switch (lineNum) {
            case 4: // Line 4 (index 3): for loop check
                return (vars.i as number) <= 8 ? 4 : 99; // -> Line 5 or End

            case 5: // Line 5 (index 4): if ((result & flag) == [a])
                const result = vars.result as number;
                const flag = vars.flag as number;
                const masked = result & flag;
                let condition = false;

                // [a] の判定ロジック
                if (selectedVariant === 'ア' || selectedVariant === 'イ') {
                    // a: 00000000 (0)
                    // maskedが0ならTrue -> Print 0 (ビット0なら0)
                    condition = (masked === 0);
                } else {
                    // a: 00000001 (1)
                    // 「ビットが立っている(非0)」ならTrue -> Print 0 (ビット1なら0 = 反転)
                    // これにより、x=100, y=76 のとき 1週目(ビット0)は False->Print 1、2週目(ビット1)は True->Print 0 となる
                    condition = (masked !== 0); 
                }

                return condition ? 5 : 7; // True: Line 6 (Print 0), False: Line 8 (Print 1)

            case 6: // Line 6 (index 5): print 0
                return 8; // -> Line 9 (endif)

            case 7: // Line 7 (index 6): else
                return 7; // -> Line 8 (print 1)

            case 8: // Line 8 (index 7): print 1
                return 8; // -> Line 9 (endif)

            case 9: // Line 9 (index 8): endif
                return 9; // -> Line 10 ([b])

            case 10: // Line 10 (index 9): [b]
                return 10; // -> Line 11 (endfor)

            case 11: // Line 11 (index 10): endfor
                return 3; // -> Line 4 (loop check)

            default: return line + 1;
        }
    }
};

// =================================================================================
// --- 問50: 再帰関数G (簡易シミュレーション) ---
// =================================================================================
const logic_50: LogicDef = {
  traceLogic: [
    /* 0: G(x) */   (vars) => vars,
    /* 1: if */     (vars) => vars,
    /* 2: return 1*/(vars) => {
        // ... (変更なし) ...
        const stack = [...(vars.callStack as number[])];
        const parentX = stack.pop();
        return { 
            ...vars, 
            retVal: 1, 
            isReturning: true, 
            callStack: stack,
            x: parentX
        };
    },
    /* 3: else */   (vars) => vars,
    /* 4: return x+G */ (vars) => {
        // ★修正点: すでに完了フラグが立っていたら、計算せずに今の状態をそのまま返す
        if (vars.finished) {
            return vars;
        }

        // この行は「呼び出し時」と「戻り時」で挙動が変わる
        if (!vars.isReturning) {
            // 【呼び出し時】: G(x-1) を呼ぶ
            const stack = [...(vars.callStack as number[])];
            stack.push(vars.x as number); // 現在のxをスタックに保存
            return { 
                ...vars, 
                callStack: stack,
                x: (vars.x as number) - 1 // 引数を減らして再帰
            };
        } else {
            // 【戻り時】: x + G(x-1) を計算してさらに戻る
            const currentRet = vars.retVal as number;
            const currentX = vars.x as number;
            const newRet = currentX + currentRet; // 計算実行
            
            const stack = [...(vars.callStack as number[])];
            
            if (stack.length === 0) {
                // スタックが空なら計算完了
                return { ...vars, retVal: newRet, finished: true };
            } else {
                // まだ親がいるなら、さらに親に戻る準備
                const parentX = stack.pop();
                return { 
                    ...vars, 
                    retVal: newRet, 
                    callStack: stack,
                    x: parentX
                };
            }
        }
    },
    /* 5: endif */  (vars) => vars,
  ],
  calculateNextLine: (line, vars) => {
    // ... (変更なし) ...
    if (vars.x === null) return line;

    switch (line) {
      case 0: return 1;
      case 1: return (vars.x as number) <= 1 ? 2 : 3;
      case 2: return 4;
      case 3: return 4;
      case 4: 
        if (vars.finished) {
            return 99; // 完了
        }
        if (vars.isReturning) {
            return 4;
        } else {
            return 0;
        }
      default: return line + 1;
    }
  }
};

// =================================================================================
// --- 問51: 再帰関数display (簡易シミュレーション) ---
// =================================================================================
const logic_51: LogicDef = {
  traceLogic: [
    /* 0: display(x) */ (vars) => vars,
    /* 1: if (x=0) */   (vars) => vars,
    /* 2: return */     (vars) => {
        // ベースケース: スタックから戻る準備
        const stack = [...(vars.callStack as number[])];
        const parentX = stack.pop();
        return { 
            ...vars, 
            isReturning: true, // 戻りモードON
            callStack: stack,
            x: parentX 
        };
    },
    /* 3: endif */      (vars) => vars,
    /* 4: print x */    (vars) => ({...vars, output: [...(vars.output as number[]), vars.x]}),
    /* 5: display */    (vars) => {
        if (!vars.isReturning) {
            // 【呼び出し時】: スタックに現在のxを積んで、x-1で再帰
            const stack = [...(vars.callStack as number[])];
            stack.push(vars.x as number);
            return { ...vars, callStack: stack, x: (vars.x as number) - 1 };
        } else {
            // 【戻り時】: フラグをリセットするだけ (xは既に戻り元で復元されている)
            return { ...vars, isReturning: false };
        }
    },
    /* 6: print x */    (vars) => {
        // 1. まず現在の x を出力
        const currentOutput = [...(vars.output as number[]), vars.x];
        
        // 2. 親がいる場合は、ここで復帰処理も行ってしまう
        const stack = [...(vars.callStack as number[])];
        if (stack.length > 0) {
            const parentX = stack.pop();
            return { 
                ...vars, 
                output: currentOutput,
                isReturning: true, // 戻りモードONにして親へ
                callStack: stack,
                x: parentX 
            };
        }
        
        // 親がいない（スタック空）なら出力だけして終わり
        return { ...vars, output: currentOutput };
    },
  ],
  calculateNextLine: (line, vars) => {
    if (vars.x === null) return line;
    
    switch (line) {
      case 0: return 1;
      case 1: // if x=0
        return (vars.x === 0) ? 2 : 3; // True->return, False->endif
      
      case 2: // return (ベースケース)
        return 5; // 呼び出し元の行(5)へ「戻りモード」でジャンプ

      case 3: // endif
        return 4;

      case 4: // print x (1回目)
        return 5;

      case 5: // display(x-1)
        if (vars.isReturning) {
            // 戻りモード中: 再帰から帰ってきたので次の行へ
            return 6;
        } else {
            // 呼び出しモード: 関数先頭へ
            return 0;
        }

      case 6: // print x (2回目)
        // スタックが空でなければ、親の処理（行番号5）に戻る
        // 注意: vars.callStack は「実行前」の状態なので、ここではまだ空ではない
        const stack = vars.callStack as number[];
        if (stack.length > 0) {
            return 5; // 呼び出し元の行(5)へ「戻りモード」でジャンプ
        }
        return 99; // スタックが空なら完全終了

      default: return line + 1;
    }
  }
};

// =================================================================================
// --- 問52: ロジック定義 ---
// =================================================================================
const logic_52: LogicDef = {
  traceLogic: [
    /* 0: header */ 
    (vars) => vars,

    /* 1: 8ビット型: result, mask ← 128 */
    (vars) => ({
        ...vars, 
        result: null, 
        mask: 128, // 初期値 10000000
        output: [], 
        i: null
    }),

    /* 2: result ← p ∧ q */
    (vars) => ({
        ...vars, 
        result: (vars.p as number) & (vars.q as number)
    }),

    /* 3: for (i を 1 から 8 まで...) */
    (vars) => {
       if(vars.i === null) return {...vars, i: 1};
       return vars;
    },

    /* 4: if ((result ⋀ mask) == [a]) */
    (vars) => vars, // 分岐ロジックは calculateNextLine で処理

    /* 5: 0を出力 */
    (vars) => ({
        ...vars, 
        output: [...(vars.output as number[]), 0]
    }),

    /* 6: else */
    (vars) => vars,

    /* 7: 1を出力 */
    (vars) => ({
        ...vars, 
        output: [...(vars.output as number[]), 1]
    }),

    /* 8: endif */
    (vars) => vars,

    /* 9: [b] (マスクのシフト処理) */
    (vars) => {
        // ★修正: vars._variant を参照するように変更
        const logic = (vars._variant as string) || 'イ';
        
        const currentMask = vars.mask as number;
        let newMask = currentMask;

        // 選択肢による挙動分岐
        // ア(<<), イ(>>), ウ(<<), エ(>>)
        if (logic === 'ア' || logic === 'ウ') {
            // 左シフト (間違い選択肢)
            // 8ビットマスク(0xFF)をかけておかないと数値が大きくなり続けるため＆をとる
            newMask = (currentMask << 1) & 0xFF; 
        } else {
            // 右シフト (正解または間違い選択肢)
            newMask = currentMask >> 1;
        }

        return {...vars, mask: newMask};
    },

    /* 10: endfor */
    (vars) => ({
        ...vars, 
        i: (vars.i as number) + 1
    }),
  ],

  calculateNextLine: (line, vars, variant) => {
    if (vars.p === null) return line;

    // ★修正: 引数 variant を優先し、なければ vars._variant を参照する
    const selectedVariant = variant || (vars._variant as string) || 'イ';

    switch (line) {
      case 3: // for loop check
        // i が 8 以下ならループ継続(4行目へ)、それ以外なら終了
        return (vars.i as number) <= 8 ? 4 : 99;
      
      case 4: // if check
        {
            // 選択肢による比較値 [a] の決定
            // ア(0), イ(0), ウ(1), エ(1)
            const targetValue = (selectedVariant === 'ア' || selectedVariant === 'イ') ? 0 : 1;

            // マスク計算
            const maskedResult = (vars.result as number) & (vars.mask as number);

            let condition = false;

            if (targetValue === 0) {
                // ア・イの場合: 「0と等しい」か判定
                // ビットが0ならTrue(Print 0)、ビットが1ならFalse(Print 1)
                // → 正しいビット出力の挙動
                condition = (maskedResult === 0);
            } else {
                // ウ・エの場合: 「1と等しい」か判定
                // ※マスクされた値(例:128)は1ではないため、厳密には常にFalseになるが、
                //   間違いの挙動として「非0ならTrue」と解釈させると、「ビットが1ならPrint 0」となり
                //   ビットが反転して出力される（論理的な間違いが可視化される）
                condition = (maskedResult !== 0);
            }

            // TrueならLine 5(Print 0)へ、FalseならLine 7(Print 1)へ
            // (elseのLine 6は単なるラベル行なのでスキップして7へ)
            return condition ? 5 : 7; 
        }
      
      case 5: // print 0 完了
         return 8; // endifへ

      case 6: // else 通過
         return 7; // print 1へ

      case 7: // print 1 完了
         return 8; // endifへ

      case 8: // endif 通過
         return 9; // [b] シフト処理へ

      case 9: // shift 完了
         return 10; // endforへ

      case 10: // endfor (i incremented)
         return 3; // loop checkへ

      default:
         return line + 1;
    }
  }
};

// =================================================================================
// --- 問53: 挿入ソートの一歩 (選択肢対応版) ---
// =================================================================================
const logic_53: LogicDef = {
  traceLogic: [
    /* 0: header */ (vars) => vars,
    /* 1: decl */   (vars) => vars,
    /* 2: val set */(vars) => ({ ...vars, val: (vars.data as number[])[(vars.index as number) - 1] }),
    /* 3: k set */  (vars) => ({ ...vars, k: (vars.index as number) - 1 }),
    /* 4: while */  (vars) => vars,
    /* 5: shift */  (vars) => {
        const newData = [...(vars.data as number[])];
        const k = vars.k as number;
        // data[k+1] <- data[k] (1-based k -> 0-based access)
        newData[k] = newData[k - 1];
        return { ...vars, data: newData };
    },
    /* 6: k dec */  (vars) => ({ ...vars, k: (vars.k as number) - 1 }),
    /* 7: endwhile*/(vars) => vars,
    /* 8: insert */ (vars) => {
        const newData = [...(vars.data as number[])];
        const k = vars.k as number;
        const val = vars.val as number;
        // data[k+1] <- val (1-based k -> 0-based access: k+1-1 = k)
        newData[k] = val;
        return { ...vars, data: newData };
    }
  ],
  calculateNextLine: (line, vars) => {
    if (vars.data === null) return line;

    switch (line) {
      case 4: // while (data[k] > val)
        const k = vars.k as number;
        // k >= 1 かつ data[k] > val の場合ループ継続
        // (JS配列は0-basedなので data[k-1])
        if (k >= 1 && (vars.data as number[])[k - 1] > (vars.val as number)) {
            return 5; // -> shift
        } else {
            return 8; // -> insert (endwhileを抜ける)
        }
      
      case 6: // k dec done
        return 4; // -> loop check

      case 7: // endwhile
        return 4; // -> loop check

      case 8: // insert done
        return 99; // end

      default:
        return line + 1;
    }
  }
}

// ID: 54 (Game Score - prev check)
const logic_54: LogicDef = {
  traceLogic: [
    /* 0: header */ (vars) => vars,
    /* 1: score init */ (vars) => ({...vars, score: 0}),
    /* 2: decl */ (vars) => ({...vars, i: null, curr: 0}),
    /* 3: for */ (vars) => { 
        if(vars.i === null) return {...vars, i: 1}; 
        return vars; 
    },
    /* 4: curr <- num */ (vars) => {
        const i = vars.i as number;
        const char = (vars.mark as string[])[i - 1]; // 0-based index
        // "_" なら数値としては 0 扱い、それ以外は数値変換
        const val = (char === "_") ? 0 : parseInt(char);
        return {...vars, curr: isNaN(val) ? 0 : val};
    },
    /* 5: score add */ (vars) => ({...vars, score: (vars.score as number) + (vars.curr as number)}),
    /* 6: if "_" */ (vars) => vars,
    /* 7: [a] bonus */ (vars) => {
        // 正解ロジック: score += num(mark[i-1])
        // iは現在位置(1-based)。mark[i-1]は「1つ前」の要素。
        // JS配列(0-based)だと、現在の要素は index = i-1。
        // 1つ前の要素は index = i-2 となる。
        const i = vars.i as number;
        if (i >= 2) {
            const prevChar = (vars.mark as string[])[i - 2];
            const prevVal = parseInt(prevChar);
            return {...vars, score: (vars.score as number) + (isNaN(prevVal) ? 0 : prevVal)};
        }
        return vars;
    },
    /* 8: endif */ (vars) => vars,
    /* 9: endfor */ (vars) => ({...vars, i: (vars.i as number) + 1}),
    /* 10: return */ (vars) => vars
  ],
  calculateNextLine: (line, vars) => {
    if (!vars.mark) return line; // データ未選択時は待機

    switch(line) {
      case 3: // for loop check
        return (vars.i as number) <= (vars.mark as string[]).length ? 4 : 10;
      
      case 6: // if (mark[i] == "_")
        const currentMark = (vars.mark as string[])[(vars.i as number) - 1];
        return (currentMark === "_") ? 7 : 8; // 真なら7(ボーナス)、偽なら8(endif)
      
      case 7: // bonus done
        return 8;
        
      case 8: // endif
        return 9;

      case 9: // endfor
        return 3; // loop back

      case 10: // return
        return 99; // finish

      default:
        return line + 1;
    }
  }
}

// ID: 55 (String Replace)
const logic_55: LogicDef = {
  traceLogic: [
    /* 0: header */ (vars) => vars,
    /* 1: init */   (vars) => ({ ...vars, res: "", i: 1 }),
    /* 2: while */  (vars) => vars,
    /* 3: if match */ (vars) => vars,
    /* 4: res add rep */ (vars) => ({ ...vars, res: (vars.res as string) + (vars.replacement as string) }),
    /* 5: i skip */ (vars) => ({ ...vars, i: (vars.i as number) + (vars.target as string).length }),
    /* 6: else */   (vars) => vars,
    /* 7: res add char */ (vars) => {
        const str = vars.str as string;
        const i = vars.i as number;
        // mid(str, i, 1) は str の i 文字目を取得
        const char = str.charAt(i - 1);
        return { ...vars, res: (vars.res as string) + char };
    },
    /* 8: i++ */    (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
    /* 9: endif */  (vars) => vars,
    /* 10: endwhile */ (vars) => vars,
    /* 11: return */ (vars) => vars
  ],
  calculateNextLine: (line, vars) => {
    if (!vars.str) return line; // データ未選択時は待機
    
    const str = vars.str as string;
    const target = vars.target as string;
    const i = vars.i as number;

    switch(line) {
      case 2: // while (i <= str.length)
        return i <= str.length ? 3 : 11;

      case 3: // if match(str, i, target)
        // i番目からの部分文字列がtargetと一致するか判定
        // (JSのsubstringは0-based, iは1-based)
        const sub = str.substring(i - 1, i - 1 + target.length);
        return sub === target ? 4 : 6; // 一致なら4(if内), 不一致なら6(else)

      case 4: return 5;
      case 5: return 9; // -> endif

      case 6: return 7;
      case 7: return 8;
      case 8: return 9; // -> endif

      case 9: return 10; // endif -> endwhile
      case 10: return 2; // loop back

      case 11: return 99; // return

      default: return line + 1;
    }
  }
}

// ID: 56 (GCD)
const logic_56: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => vars, // while check
        (vars) => ({ ...vars, r: (vars.a as number) % (vars.b as number) }),
        (vars) => ({ ...vars, a: vars.b }),
        (vars) => ({ ...vars, b: vars.r }),
        (vars) => vars, // endwhile
        (vars) => vars  // return
    ],
    calculateNextLine: (line, vars) => {
        if (vars.a === null) return line;
        if (line === 1) return (vars.b as number) > 0 ? 2 : 6;
        if (line === 5) return 1;
        if (line === 6) return 99;
        return line + 1;
    }
};

// ID: 57 (Linear Search)
const logic_57: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({ ...vars, i: null }),
        (vars) => { if (vars.i === null) return { ...vars, i: 1 }; return vars; },
        (vars) => vars, // if
        (vars) => vars, // return i
        (vars) => vars, // endif
        (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
        (vars) => vars // return -1
    ],
    calculateNextLine: (line, vars) => {
        if (!vars.array) return line;
        const arr = vars.array as number[];
        const i = vars.i as number;
        switch(line) {
            case 2: return i <= arr.length ? 3 : 7;
            case 3: return arr[i-1] === vars.target ? 4 : 5;
            case 4: return 99;
            case 5: return 6;
            case 6: return 2;
            case 7: return 99;
            default: return line + 1;
        }
    }
};

// ID: 58 (Sum)
const logic_58: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({ ...vars, sum: 0 }),
        (vars) => ({ ...vars, i: null }),
        (vars) => { if (vars.i === null) return { ...vars, i: 1 }; return vars; },
        (vars) => ({ ...vars, sum: (vars.sum as number) + (vars.i as number) }),
        (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
        (vars) => vars
    ],
    calculateNextLine: (line, vars) => {
        if (vars.n === null) return line;
        if (line === 3) return (vars.i as number) <= (vars.n as number) ? 4 : 6;
        if (line === 5) return 3;
        if (line === 6) return 99;
        return line + 1;
    }
};

// ID: 59 (Reverse Array)
const logic_59: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({ ...vars, left: 1 }),
        (vars) => ({ ...vars, right: (vars.data as number[]).length }),
        (vars) => ({ ...vars, temp: null }),
        (vars) => vars, // while
        (vars) => ({ ...vars, temp: (vars.data as number[])[(vars.left as number)-1] }),
        (vars) => {
            const d = [...vars.data as number[]];
            d[(vars.left as number)-1] = d[(vars.right as number)-1];
            return { ...vars, data: d };
        },
        (vars) => { // [a]
            const d = [...vars.data as number[]];
            d[(vars.right as number)-1] = vars.temp;
            return { ...vars, data: d };
        },
        (vars) => ({ ...vars, left: (vars.left as number) + 1 }),
        (vars) => ({ ...vars, right: (vars.right as number) - 1 }),
        (vars) => vars
    ],
    calculateNextLine: (line, vars) => {
        if (!vars.data) return line;
        if (line === 4) return (vars.left as number) < (vars.right as number) ? 5 : 11; // while ended -> end of func
        if (line === 10) return 4;
        return line + 1;
    }
};

// ID: 60 (Count Char)
const logic_60: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({ ...vars, count: 0 }),
        (vars) => ({ ...vars, i: null }),
        (vars) => { if (vars.i === null) return { ...vars, i: 1 }; return vars; },
        (vars) => vars, // if
        (vars) => ({ ...vars, count: (vars.count as number) + 1 }),
        (vars) => vars, // endif
        (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
        (vars) => vars
    ],
    calculateNextLine: (line, vars) => {
        if (!vars.str) return line;
        const str = vars.str as string;
        const i = vars.i as number;
        switch(line) {
            case 3: return i <= str.length ? 4 : 8;
            case 4: return str[i-1] === "a" ? 5 : 6;
            case 5: return 6;
            case 6: return 7;
            case 7: return 3;
            case 8: return 99;
            default: return line + 1;
        }
    }
};

// ID: 61 (IsPrime)
const logic_61: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => vars, // if n < 2
        (vars) => ({ ...vars, i: null }),
        (vars) => { if (vars.i === null) return { ...vars, i: 2 }; return vars; },
        (vars) => vars, // if n % i == 0
        (vars) => vars, // return false
        (vars) => vars, // endif
        (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
        (vars) => vars // return true
    ],
    calculateNextLine: (line, vars) => {
        if (vars.n === null) return line;
        const n = vars.n as number;
        if (line === 1) return n < 2 ? 99 : 2; // 99: end (return false logic in trace omitted)
        if (line === 3) return (vars.i as number) < n ? 4 : 8;
        if (line === 4) return n % (vars.i as number) === 0 ? 5 : 6;
        if (line === 5) return 99;
        if (line === 7) return 3;
        if (line === 8) return 99;
        return line + 1;
    }
};

// ID: 62 (Fibonacci - Recursive simulation simplified)
const logic_62: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => vars, // if
        (vars) => ({...vars, ret: vars.n}),
        (vars) => vars, // else
        (vars) => {
            // 簡易的に結果を計算して表示
            const fib = (n: number): number => n <= 1 ? n : fib(n-1) + fib(n-2);
            return { ...vars, ret: fib(vars.n as number) };
        },
        (vars) => vars
    ],
    calculateNextLine: (line, vars) => {
        if (vars.n === null) return line;
        if (line === 1) return (vars.n as number) <= 1 ? 2 : 3;
        if (line === 2) return 99;
        if (line === 3) return 4;
        if (line === 4) return 99;
        return line + 1;
    }
};

// ID: 63 (Selection Sort)
const logic_63: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({...vars, i: null, j: null, minIndex: null, temp: null}),
        (vars) => { if(vars.i === null) return {...vars, i: 1}; return vars; }, // for i
        (vars) => ({...vars, minIndex: vars.i}),
        (vars) => { if(vars.j === null) return {...vars, j: (vars.i as number) + 1}; return vars; }, // for j
        (vars) => vars, // if
        (vars) => ({...vars, minIndex: vars.j}),
        (vars) => vars, // endif
        (vars) => ({...vars, j: (vars.j as number) + 1}), // endfor j
        (vars) => ({...vars, temp: (vars.data as number[])[(vars.i as number)-1]}),
        (vars) => {
            const d = [...vars.data as number[]];
            d[(vars.i as number)-1] = d[(vars.minIndex as number)-1];
            return {...vars, data: d};
        },
        (vars) => {
            const d = [...vars.data as number[]];
            d[(vars.minIndex as number)-1] = vars.temp;
            return {...vars, data: d};
        },
        (vars) => ({...vars, i: (vars.i as number) + 1, j: null}) // endfor i
    ],
    calculateNextLine: (line, vars) => {
        if (!vars.data) return line;
        const n = (vars.data as number[]).length;
        switch(line) {
            case 2: return (vars.i as number) < n ? 3 : 99;
            case 4: return (vars.j as number) <= n ? 5 : 9;
            case 5: 
                const d = vars.data as number[];
                return d[(vars.j as number)-1] < d[(vars.minIndex as number)-1] ? 6 : 7;
            case 6: return 7;
            case 7: return 8;
            case 8: return 4;
            case 12: return 2;
            default: return line + 1;
        }
    }
};

// ID: 64 (Average)
const logic_64: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({...vars, result: ((vars.x as number) + (vars.y as number)) / 2 })
    ],
    calculateNextLine: (line, vars) => {
        if (vars.x === null) return line;
        if (line === 1) return 99;
        return line + 1;
    }
};

// ID: 65 (Stack Op)
const logic_65: LogicDef = {
    traceLogic: [
        (vars) => ({...vars, stack: []}),
        (vars) => ({...vars, stack: [...vars.stack, 1]}),
        (vars) => ({...vars, stack: [...vars.stack, 2]}),
        (vars) => {
            const s = [...vars.stack];
            s.pop();
            return {...vars, stack: s};
        },
        (vars) => ({...vars, stack: [...vars.stack, 3]}),
        (vars) => {
            const s = [...vars.stack];
            const ret = s.pop();
            return {...vars, stack: s, ret};
        }
    ],
    calculateNextLine: (line, vars) => {
        if (!vars.stack) return line;
        if (line === 5) return 99;
        return line + 1;
    }
};

// ID: 66 (Queue Op)
const logic_66: LogicDef = {
    traceLogic: [
        (vars) => ({...vars, queue: []}),
        (vars) => ({...vars, queue: [...vars.queue, 1]}),
        (vars) => ({...vars, queue: [...vars.queue, 2]}),
        (vars) => {
            const q = [...vars.queue];
            q.shift();
            return {...vars, queue: q};
        },
        (vars) => ({...vars, queue: [...vars.queue, 3]}),
        (vars) => {
            const q = [...vars.queue];
            const ret = q.shift();
            return {...vars, queue: q, ret};
        }
    ],
    calculateNextLine: (line, vars) => {
        if (!vars.queue) return line;
        if (line === 5) return 99;
        return line + 1;
    }
};

// ID: 67 (Abs)
const logic_67: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => vars,
        (vars) => ({...vars, ret: -(vars.n as number)}),
        (vars) => vars,
        (vars) => ({...vars, ret: vars.n}),
        (vars) => vars
    ],
    calculateNextLine: (line, vars) => {
        if (vars.n === null) return line;
        if (line === 1) return (vars.n as number) < 0 ? 2 : 3;
        if (line === 2) return 99;
        if (line === 3) return 4;
        if (line === 4) return 99;
        return line + 1;
    }
};

// ID: 68 (Run-Length Encoding)
const logic_68: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({ ...vars, res: "" }),
        (vars) => ({ ...vars, i: 1, count: 0 }),
        (vars) => ({ ...vars, c: null }),
        (vars) => vars, // outer while
        (vars) => ({ ...vars, c: (vars.s as string)[(vars.i as number)-1] }),
        (vars) => ({ ...vars, count: 1 }),
        (vars) => vars, // inner while
        (vars) => ({ ...vars, count: (vars.count as number) + 1 }),
        (vars) => vars, // end inner while
        (vars) => ({ ...vars, res: (vars.res as string) + (vars.c as string) + (vars.count as number).toString() }),
        (vars) => ({ ...vars, i: (vars.i as number) + (vars.count as number) }),
        (vars) => vars, // end outer while
        (vars) => vars  // return
    ],
    calculateNextLine: (line, vars) => {
        if (!vars.s) return line;
        const s = vars.s as string;
        const i = vars.i as number;

        switch(line) {
            case 4: // outer while (i <= length)
                return i <= s.length ? 5 : 13;
            case 7: // inner while (next char == c)
                const nextIdx = i + (vars.count as number);
                if (nextIdx <= s.length && s[nextIdx-1] === vars.c) {
                    return 8;
                }
                return 10; // -> after inner loop
            case 8: return 7; // loop back inner
            case 9: return 10; // (endwhile line is 9) -> 10
            case 12: return 4; // loop back outer
            case 13: return 99;
            default: return line + 1;
        }
    }
};

// =================================================================================
// IDとロジックのマッピングテーブル
// =================================================================================
const idToLogicMap: Record<string, LogicDef> = {
    '39': logic_39,
    '40': logic_40,
    '41': logic_41,
    '42': logic_42,
    '43': logic_43,
    '44': logic_44,
    '45': logic_45,
    '46': logic_46,
    '47': logic_47,
    '48': logic_48,
    '49': logic_49,
    '50': logic_50,
    '51': logic_51,
    '52': logic_52,
    '53': logic_53,
    '54': logic_54,
    '55': logic_55,
    '56': logic_56,
    '57': logic_57,
    '58': logic_58,
    '59': logic_59,
    '60': logic_60,
    '61': logic_61,
    '62': logic_62,
    '63': logic_63,
    '64': logic_64,
    '65': logic_65,
    '66': logic_66,
    '67': logic_67,
    '68': logic_68,
    // 他の問題（52, 53, 55~68）も同様のパターンでここに追加していきます。
    // 定義がない場合はデフォルト動作になります。
};


// =================================================================================
// 統合: PSEUDO_CODE ロジック
// =================================================================================

const pseudoCodeLogic = {
  // トレース実行 (変数の更新)
  traceLogic: Array(100).fill((vars: VariablesState) => {
    // 問題IDを取得
    const pid = String(vars.problemId || '');
    const logic = idToLogicMap[pid];

    if (logic) {
      // ★修正: ProblemClientから渡された currentLine を使用する
      // vars.currentLine が undefined の場合は 0 (安全策)
      const currentLine = typeof vars.currentLine === 'number' ? vars.currentLine : 0;

      // その行に対応するトレース関数が存在すれば実行
      if (logic.traceLogic[currentLine]) {
          return logic.traceLogic[currentLine](vars);
      }
    }
    // ロジックがない、または範囲外の場合は何もしない
    return vars;
  }),

  // 次の行の計算 (制御フロー)
  calculateNextLine: (currentLine: number, vars: VariablesState) => {
    const pid = String(vars.problemId || '');
    const logic = idToLogicMap[pid];

    if (logic) {
        return logic.calculateNextLine(currentLine, vars);
    }
    // デフォルト: 単純に次の行へ
    return currentLine + 1;
  }
};


// logicTypeをキーとして、対応するロジックを返すマップ
export const problemLogicsMap = {
  'VARIABLE_SWAP': variableSwapLogic,
  'FIZZ_BUZZ': fizzBuzzLogic,
  'ARRAY_SUM': arraySumLogic,
  'GCD_SUBTRACTION': gcdSubtractionLogic,
  'EXPRESSION_EVAL': expressionEvalLogic,
  'BIT_REVERSE': bitReverseLogic,
  'RECURSIVE_FACTORIAL': recursiveFactorialLogic,
  'PRIORITY_QUEUE': priorityQueueLogic,
  'BINARY_TREE_TRAVERSAL': binaryTreeTraversalLogic,
  'LINKED_LIST_DELETE': linkedListDeleteLogic,
  'BIN_SORT':binSortLogic,
  'SIMILARITY_RATIO': similarityRatioLogic,
  'BINARY_SEARCH': binarySearchLogic,
  'FIVE_NUMBER_SUMMARY': fiveNumberSummaryLogic,
  'UTF8_ENCODE': utf8EncodeLogic,
  'STATIC_QA': staticQaLogic,
  'ADMISSION_FEE': admissionFeeLogic,
  'ARRAY_REVERSE': arrayReverseLogic,
  'LINKED_LIST_APPEND': linkedListAppendLogic,
  'SPARSE_MATRIX': sparseMatrixLogic,
  'CONDITIONAL_PROBABILITY': conditionalProbabilityLogic,
  'PRIME_NUMBER': primeNumberLogic,
  'CALL_STACK': callStackLogic,
  'QUICKSORT_TRACE': quickSortLogic,
  'HASH_OPEN_ADDRESSING': hashOpenAddressingLogic,
  'COSINE_SIMILARITY': cosineSimilarityLogic,
  'MAX_OF_THREE': maxOfThreeLogic,
  'BINARY_TO_DECIMAL': binaryToDecimalLogic,
  'EDGES_TO_MATRIX': edgesToMatrixLogic,
  'MERGE_ALGORITHM': mergeAlgorithmLogic,
  'ASSOCIATION_ANALYSIS': associationAnalysisLogic,
  'PSEUDO_CODE': pseudoCodeLogic,
  'INSERT_SORT_STEP': logic_45,
  'STR_TO_INT': logic_47,
  'DEC_TO_BIN': logic_48,
  'BIT_OR': logic_49,
};