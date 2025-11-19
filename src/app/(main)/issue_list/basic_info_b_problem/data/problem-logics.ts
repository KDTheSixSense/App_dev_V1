/**
 * @file DBのlogicTypeと、対応するトレース関数をマッピングします。
 */
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

const expressionEvalLogic: { traceLogic: TraceStep[] } = {
  traceLogic: [
    // 1行目: ○実数型: calc(実数型: x, 実数型: y)
    // この行では変数の変化はない
    (vars) => vars,
    // 2行目: return [ ... ]
    // ここで計算を実行し、結果を result 変数に格納する
    (vars) => {
      const x = vars.x as number;
      const y = vars.y as number;
      // 正解の式 pow(pow(x, 2) + pow(y, 2), 0.5) を計算
      // Math.pow(base, exponent) は累乗を計算
      // Math.sqrt(number) は平方根を計算
      const result = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
      return { ...vars, result: result };
    },
  ],
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

const recursiveFactorialLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
  traceLogic: [
    (vars) => vars, // 1: ○整数型: factorial(整数型: n)
    (vars) => vars, // 2: if (n = 0)
    (vars) => vars, // 3: return 1
    (vars) => vars, // 4: endif
    (vars) => { // 5: return n * factorial(n - 1)
        const currentN = vars.current_n as number;
        const result = vars.result as number;
        // 再帰の1ステップをシミュレート
        return {
            ...vars,
            result: result * currentN, // これまでの結果に現在のnを掛ける
            current_n: currentN - 1,   // 次の呼び出しのためにnを1減らす
        };
    },
  ],
  calculateNextLine: (currentLine, vars) => {
      const currentN = vars.current_n as number;
      // 0-indexedの行番号で分岐
      switch (currentLine) {
          case 0: return 1; // 1行目 -> 2行目
          case 1: // 2行目 if (n = 0) の評価
              return currentN === 0 ? 2 : 4; // 条件が真なら3行目へ、偽なら5行目へ
          case 2: // 3行目 return 1 の実行後
              return 5; // トレース完了（配列の長さを超えたインデックスを指定）
          case 3: // 4行目 endif (ここには直接来ないが念のため)
              return 4;
          case 4: // 5行目 return n * ... の実行後
              return 1; // 2行目のif文の評価にループバック
          default:
              return 5; // 想定外の場合はトレースを終了
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

const fiveNumberSummaryLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 1: findRank Def */ (vars) => vars,
        /* 2: findRank i Dec */ (vars) => vars,
        /* 3: i ← ... */ (vars) => {
            const sortedData = vars.sortedData as number[];
            const p = vars.current_p as number;
            const i = Math.ceil((sortedData.length - 1) * p);
            return { ...vars, findRank_i: i };
        },
        /* 4: return ... */ (vars) => vars,
        /* 5: Space */ (vars) => vars,
        /* 6: summarize Def */ (vars) => vars,
        /* 7: rankData ← {} */ (vars) => ({ ...vars, rankData: [] }),
        /* 8: p ← {...} */ (vars) => ({ ...vars, p_values: [0, 0.25, 0.5, 0.75, 1] }),
        /* 9: i Dec */ (vars) => {
             // ループ開始時にiを初期化
            if (vars.i === null) return { ...vars, i: 1 };
            return vars;
        },
        /* 10: for loop */ (vars) => vars,
        /* 11: rankData.append */ (vars) => {
            const sortedData = vars.sortedData as number[];
            const findRank_i = vars.findRank_i as number;
            const valueToAdd = sortedData[findRank_i]; // 1-based to 0-based index
            return {
                ...vars,
                rankData: [...(vars.rankData as number[]), valueToAdd],
            };
        },
        /* 12: endfor */ (vars) => ({ ...vars, i: (vars.i as number) + 1 }),
        /* 13: return rankData */ (vars) => vars,
    ],
    calculateNextLine(currentLine, vars) {
        const lineNum = currentLine + 1;
        const callStack = (vars.callStack || []) as { name: string, return_to: number }[];

        // --- summarize ループ制御 ---
        if (lineNum === 10) { // for文の評価
            const i = vars.i as number;
            const p_values = vars.p_values as number[];
            if (i <= p_values.length) {
                // findRank呼び出し準備
                vars.current_p = p_values[i - 1]; // iは1-based
                callStack.push({ name: 'findRank', return_to: 12 }); // 戻り先はendfor
                return 2; // findRankの3行目にジャンプ
            } else {
                return 12; // ループ終了、return rankDataへ
            }
        }

        // --- findRank 実行後 ---
        if (lineNum === 4) { // findRankのreturn後
            const lastCall = callStack.pop();
            if (lastCall) {
                return 10; // rankData.append(11行目)へ
            }
        }
        
        // --- endfor後 ---
        if (lineNum === 12) {
             return 9; // forの条件評価に戻る
        }

        // デフォルトは次の行へ
        return currentLine + 1;
    },
};

const similarityRatioLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: Array(11).fill((vars: VariablesState) => vars), // traceLogicは使いません
    calculateNextLine(currentLine, vars) {
        // トレースの最初のステップで変数を初期化
        if (!vars.initialized) {
            vars.i = 1;
            vars.cnt = 0;
            vars.result = null;
            vars.initialized = true;
        }

        const lineNum = currentLine + 1;
        const s1 = vars.s1 as string[];
        const s2 = vars.s2 as string[];
        let i = vars.i as number;
        let cnt = vars.cnt as number;

        switch (lineNum) {
            case 2: // cnt ← 0 (初期化ステップで実行済み)
                return 2; // -> 3行目へ
            case 3: // if (s1の要素数 ≠ s2の要素数)
                return s1.length !== s2.length ? 3 : 5; // -> 4行目 or 6行目
            case 4: // return -1
                vars.result = -1;
                return 99; // トレース終了
            case 6: // for (i を 1 から s1の要素数 まで)
                return i <= s1.length ? 6 : 10; // -> 7行目 or 11行目
            case 7: // if (s1[i] = s2[i])
                if (s1[i - 1] === s2[i - 1]) {
                    return 7; // -> 8行目
                } else {
                    return 8; // -> 9行目
                }
            case 8: // cnt ← cnt + 1
                vars.cnt = cnt + 1;
                return 8; // -> 9行目
            case 9: // endif
                vars.i = i + 1; // forループのインクリメント
                return 5; // forループの条件判定(6行目)に戻る
            case 11: // return cnt ÷ s1の要素数
                vars.result = cnt / s1.length;
                return 99; // トレース終了
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

const minimaxLogic: { traceLogic: TraceStep[] } = {
    traceLogic: [
        // ステップ0: 初期状態
        (vars) => vars,
        // ステップ1: Aの評価値を計算
        (vars) => ({ ...vars, "a (Aの子の評価値)": 0 }),
        // ステップ2: Bの評価値を計算
        (vars) => ({ ...vars, "b (Bの子の評価値)": -10 }),
        // ステップ3: 完了
        (vars) => vars,
    ],
};

const utf8EncodeLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: 1行目 */ (vars) => vars,
        /* 1: 2行目 */ (vars) => vars,
        /* 2: 3行目 */ (vars) => vars,
        /* 3: 4行目 */ (vars) => ({ ...vars, utf8Bytes: [224, 128, 128] }),
        /* 4: 5行目 */ (vars) => ({ ...vars, cp: vars.codePoint }),
        /* 5: 6行目 */ (vars) => ({ ...vars, i: 3 }), // ループ変数iを3で初期化
        /* 6: 7行目 */ (vars) => vars, // for ループの条件評価 (calculateNextLineで処理)
        /* 7: 8行目 */ (vars) => {
            const i = vars.i as number;
            const cp = vars.cp as number;
            const currentBytes = vars.utf8Bytes as number[];
            const newBytes = [...currentBytes];
            // cpを64で割った余りを加算
            newBytes[i - 1] += cp % 64; // iは1-basedなので-1
            return { ...vars, utf8Bytes: newBytes };
        },
        /* 8: 9行目 */ (vars) => {
            // cpを64で割った商で更新
            return { ...vars, cp: Math.floor((vars.cp as number) / 64) };
        },
        /* 9: 10行目*/ (vars) => ({ ...vars, i: (vars.i as number) - 1 }), // endforでiをデクリメント
        /* 10: 11行目*/ (vars) => vars,
    ],
    calculateNextLine(currentLine, vars) {
        // iが初期化されるまで(6行目まで)は単純に次に進む
        if (vars.i === null && currentLine < 5) {
            return currentLine + 1;
        }

        switch(currentLine) {
            case 6: // for文の条件評価
                return (vars.i as number) >= 1 ? 7 : 10; // ループ継続なら8行目へ、終了なら11行目へ
            case 7: // 8行目実行後
                return 8; // 9行目へ
            case 8: // 9行目実行後
                return 9; // 10行目(endfor)へ
            case 9: // 10行目実行後 (iがデクリメントされる)
                return 6; // 再びループの条件評価(7行目)へ
            default:
                return currentLine + 1;
        }
    },
};

const staticQaLogic: { traceLogic: TraceStep[] } = {
    traceLogic: [], // トレース処理は不要
};

const admissionFeeLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
  traceLogic: [
    (vars) => vars,                      // 1: ○整数型: fee(整数型: num)
    (vars) => ({...vars, ret: null}),    // 2: 整数型: ret
    (vars) => vars,                      // 3: if (num が 3 以下)
    (vars) => ({...vars, ret: 100}),     // 4: ret ← 100
    (vars) => vars,                      // 5: elseif (num が 9 以下)
    (vars) => ({...vars, ret: 300}),     // 6: ret ← 300
    (vars) => vars,                      // 7: else
    (vars) => ({...vars, ret: 500}),     // 8: ret ← 500
    (vars) => vars,                      // 9: endif
    (vars) => vars,                      // 10: return ret
  ],
  calculateNextLine: (currentLine, vars) => {
    const num = vars.num as number; // 変数名を age から num に変更
    if (num === null) return currentLine;

    // 0-indexedの行番号で分岐
    switch (currentLine) {
      case 2: // if (num が 3 以下)
        return num <= 3 ? 3 : 4;
      case 3: // ret ← 100
        return 8;
      case 4: // elseif (num が 9 以下)
        return num <= 9 ? 5 : 6;
      case 5: // ret ← 300
        return 8;
      case 6: // else
        return 7;
      case 7: // ret ← 500
        return 8;
      case 8: // endif
        return 9;
      case 9: // return ret
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

// 問22のロジック本体
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
                return loopVar <= Math.floor(array.length / 2) ? 5 : 9; // -> 6 (body) or 10 (endfor)
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
const linkedListAppendLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    // traceLogicは状態を更新するだけのシンプルな関数群に戻す
    traceLogic: [
        /* 0: Line 1 */ (vars: VariablesState) => vars,
        /* 1: Line 2 */ (vars: VariablesState) => vars,
        /* 2: Line 3 */ (vars: VariablesState) => vars,
        /* 3: Line 4 */ (vars: VariablesState) => ({ ...vars, prev: null, curr: null }),
        /* 4: Line 5 */ (vars: VariablesState) => {
            const newNode = { val: vars.qVal as string, next: null };
            const newListData = Array.isArray(vars.listData) ? [...vars.listData] : [];
            const newNodeIndex = newListData.length;
            newListData.push(newNode);
            return { ...vars, listData: newListData, curr: newNodeIndex };
        },
        /* 5: Line 6 */ (vars: VariablesState) => vars,
        /* 6: Line 7 */ (vars: VariablesState) => ({ ...vars, listHead: vars.curr }),
        /* 7: Line 8 */ (vars: VariablesState) => vars,
        /* 8: Line 9 */ (vars: VariablesState) => ({ ...vars, prev: vars.listHead }),
        /* 9: Line 10 */ (vars: VariablesState) => vars,
        /* 10: Line 11 */ (vars: VariablesState) => {
            const listData = vars.listData as any[];
            const prevIndex = vars.prev as number;
            return { ...vars, prev: listData[prevIndex].next };
        },
        /* 11: Line 12 */ (vars: VariablesState) => vars,
        /* 12: Line 13 */ (vars: VariablesState) => {
            const newListData = JSON.parse(JSON.stringify(vars.listData));
            if (vars.prev !== null) {
                newListData[vars.prev as number].next = vars.curr;
            }
            return { ...vars, listData: newListData };
        },
        /* 13: Line 14 */ (vars: VariablesState) => vars,
    ],
    // calculateNextLineは次にどの行へ進むかだけを決定する
    calculateNextLine(currentLine: number, vars: VariablesState): number {
        // 最初のクリック(currentLine=0)で3行目(index 2)に飛ぶ
        if (currentLine === 0) return 2;

        const executedLine = currentLine;
        switch (executedLine) {
            case 2: return 3;
            case 3: return 4;
            case 4: return 5;
            case 5: return vars.listHead === null ? 6 : 8;
            case 6: return 13;
            case 8: return 9;
            case 9:
                const listData = vars.listData as any[];
                const prevIndex = vars.prev as number;
                return (vars.prev !== null && listData[prevIndex]?.next !== null) ? 10 : 11;
            case 10: return 9;
            case 11: return 12;
            case 12: return 13;
            case 13: return 99;
            default: return 99;
        }
    },
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

// 問題文の単語群と`freq`, `freqE`メソッドをシミュレートするヘルパーオブジェクト
const corpusData = {
    words: ["importance", "inflation", "information", "innovation"],
    freq: (str: string): number => {
        let count = 0;
        for (const word of corpusData.words) {
            // 単純な非重複出現回数をカウント
            if (word.includes(str)) {
                count += (word.match(new RegExp(str, "g")) || []).length;
            }
        }
        return count;
    },
    freqE: (str: string): number => {
        let count = 0;
        for (const word of corpusData.words) {
            if (word.endsWith(str)) {
                count++;
            }
        }
        return count;
    }
};

const conditionalProbabilityLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars: VariablesState) => vars,
        /* 1: Line 2 */ (vars: VariablesState) => vars, // prob()
        /* 2: Line 3 */ (vars: VariablesState) => ({ ...vars, s1: vars.c1 }), // s1 ← c1
        /* 3: Line 4 */ (vars: VariablesState) => ({ ...vars, s2: vars.c2 }), // s2 ← c2
        /* 4: Line 5 */ (vars: VariablesState) => { // if
            const freq_s1_s2 = corpusData.freq(vars.s1 + vars.s2);
            return { ...vars, freq_s1_s2 };
        },
        /* 5: Line 6 */ (vars: VariablesState) => { // return
            const freq_s1 = corpusData.freq(vars.s1 as string);
            const freqE_s1 = corpusData.freqE(vars.s1 as string);
            const denominator = freq_s1 - freqE_s1;
            const result = denominator > 0 ? (vars.freq_s1_s2 as number) / denominator : 0;
            return { ...vars, freq_s1, freqE_s1, denominator, result };
        },
        /* 6: Line 7 */ (vars: VariablesState) => vars, // else
        /* 7: Line 8 */ (vars: VariablesState) => ({ ...vars, result: 0 }), // return 0
        /* 8: Line 9 */ (vars: VariablesState) => vars, // endif
    ],
    calculateNextLine(currentLine: number, vars: VariablesState): number {
        if (vars.c1 === null) return currentLine; // プリセット選択待ち

        const executedLine = currentLine;
        switch (executedLine) {
            case 2: return 3; // -> Line 4
            case 3: return 4; // -> Line 5
            case 4: // if
                return (vars.freq_s1_s2 as number) > 0 ? 5 : 7; // -> Line 6 or 8
            case 5: // return
            case 7: // return 0
                return 8; // -> endif
            case 8: // endif
                return 99; // 終了
            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問27: 素数探索のロジック ---
// =================================================================================
const primeNumberLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars: VariablesState) => ({...vars, pnList: null, i: null, j: null, divideFlag: null, sqrt_i: null }),
        /* 1: Line 2 */ (vars: VariablesState) => ({ ...vars, pnList: [] }),
        /* 2: Line 3 */ (vars: VariablesState) => vars,
        /* 3: Line 4 */ (vars: VariablesState) => vars,
        /* 4: Line 5 */ (vars: VariablesState) => {
            if (vars.i === null) return { ...vars, i: 2 };
            return { ...vars, i: (vars.i as number) + 1 };
        },
        /* 5: Line 6 */ (vars: VariablesState) => ({ ...vars, divideFlag: true }),
        /* 6: Line 7 */ (vars: VariablesState) => vars,
        /* 7: Line 8 */ (vars: VariablesState) => {
            const i = vars.i as number;
            const sqrt_i = Math.floor(Math.sqrt(i));
            if (vars.j === null || vars.j < 2) return { ...vars, j: 2, sqrt_i };
            return { ...vars, j: (vars.j as number) + 1, sqrt_i };
        },
        /* 8: Line 9 */ (vars: VariablesState) => vars,
        /* 9: Line 10 */ (vars: VariablesState) => ({ ...vars, divideFlag: false }),
        /* 10: Line 11 */ (vars: VariablesState) => vars,
        /* 11: Line 12 */ (vars: VariablesState) => vars,
        /* 12: Line 13 */ (vars: VariablesState) => vars,
        /* 13: Line 14 */ (vars: VariablesState) => vars,
        /* 14: Line 15 */ (vars: VariablesState) => {
            const newPnList = [...(vars.pnList as number[])];
            newPnList.push(vars.i as number);
            return { ...vars, pnList: newPnList };
        },
        /* 15: Line 16 */ (vars: VariablesState) => vars,
        /* 16: Line 17 */ (vars: VariablesState) => ({ ...vars, j: null }),
        /* 17: Line 18 */ (vars: VariablesState) => vars,
    ],
    calculateNextLine(currentLine: number, vars: VariablesState): number {
        // ★変更: maxNum を num に
        if (vars.num === null) return currentLine;

        const executedLine = currentLine;
        const i = vars.i as number;
        const j = vars.j as number;
        
        switch (executedLine) {
            case 1: return 4;
            case 4: // for i
                // ★変更: maxNum を num に
                return i <= (vars.num as number) ? 5 : 17;
            case 5: return 7;
            case 7: // for j
                return (j <= (vars.sqrt_i as number)) ? 8 : 13;
            case 8: // if
                return i % j === 0 ? 9 : 12;
            case 9: return 10;
            case 10: // break
                return 13;
            case 12: // inner endfor
                return 7;
            case 13: // if
                return vars.divideFlag ? 14 : 16;
            case 14: return 15;
            case 15: return 16;
            case 16: // outer endfor
                return 4;
            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 【★最終修正】問28: UIの動作に完全に同期させたコールスタックのロジック ---
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
// --- 問29: クイックソートのトレースロジック ---
// =================================================================================
const quicksortTraceLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: Array(30).fill((vars: VariablesState) => vars), // ダミーの配列

    calculateNextLine(currentLine: number, vars: VariablesState): number {
        const stack = vars.callStack as { first: number, last: number, pc: number }[];

        // --- Step 1: 初期化 ---
        if (!vars.initialized) {
            // プリセットで data が設定されたことを前提とする
            // 最初の呼び出しフレームをスタックに積む
            vars.callStack = [{ 
                first: 1, 
                last: (vars.data as number[]).length, // data の長さを正しく使う
                pc: 0 
            }];
            vars.initialized = true;
            // 変数をリセット
            vars.pivot = null;
            vars.i = null;
            vars.j = null;
            vars.output = null;
            return 0; // proc1の定義(Line 1)へ移動
        }

        // --- Step 2: トレース終了判定 ---
        if (stack.length === 0) {
            return 99;
        }

        // --- Step 3: 現在の実行フレームを取得 ---
        let frame = stack[stack.length - 1];
        let nextLine = -1;

        // --- Step 4: プログラムカウンタ(pc)に基づいて処理を実行 ---
        switch (frame.pc) {
            case 0: // Line 3: pivotの計算
                vars.pivot = (vars.data as number[])[Math.floor((frame.first + frame.last) / 2) - 1];
                frame.pc++;
                nextLine = 2; // Line 3
                break;
            case 1: // Line 4: iの初期化
                vars.i = frame.first;
                frame.pc++;
                nextLine = 3; // Line 4
                break;
            case 2: // Line 5: jの初期化
                vars.j = frame.last;
                frame.pc++;
                nextLine = 6; // while(true)へ (Line 7)
                break;
            case 3: // Line 8: while (data[i] < pivot)
                if ((vars.data as number[])[(vars.i as number) - 1] < (vars.pivot as number)) {
                    vars.i = (vars.i as number) + 1;
                    nextLine = 7; // ループ継続 (Line 8)
                } else {
                    frame.pc++;
                    nextLine = 10; // 次のwhileへ (Line 11)
                }
                break;
            case 4: // Line 11: while (pivot < data[j])
                if ((vars.pivot as number) < (vars.data as number[])[(vars.j as number) - 1]) {
                    vars.j = (vars.j as number) - 1;
                    nextLine = 10; // ループ継続 (Line 11)
                } else {
                    frame.pc++;
                    nextLine = 13; // if (i >= j)へ (Line 14)
                }
                break;
            case 5: // Line 14: if (i >= j)
                if ((vars.i as number) >= (vars.j as number)) {
                    frame.pc = 99; // ループを抜けるフラグ
                    nextLine = 19; // endwhileへ (Line 20)
                } else {
                    frame.pc++;
                    nextLine = 16; // swapへ (Line 17)
                }
                break;
            case 6: // Line 17: swap
                const new_data = [...(vars.data as number[])];
                const temp = new_data[(vars.i as number) - 1];
                new_data[(vars.i as number) - 1] = new_data[(vars.j as number) - 1];
                new_data[(vars.j as number) - 1] = temp;
                vars.data = new_data;
                frame.pc++;
                nextLine = 17; // Line 18
                break;
            case 7: // Line 18: i++
                vars.i = (vars.i as number) + 1;
                frame.pc++;
                nextLine = 18; // Line 19
                break;
            case 8: // Line 19: j--
                vars.j = (vars.j as number) - 1;
                frame.pc = 3; // while(true)の先頭(Line 7)に戻る
                nextLine = 6; // Line 7
                break;
            case 99: // Line 20 (endwhile) -> Line 22: output
                vars.output = (vars.data as number[]).join(' ');
                frame.pc = 100;
                nextLine = 21; // Line 22
                break;
            case 100: // Line 24: if (first < i - 1)
                if (frame.first < (vars.i as number) - 1) {
                    frame.pc = 101; // 次のステップを 101 に設定
                    stack.push({ first: frame.first, last: (vars.i as number) - 1, pc: 0 });
                    nextLine = 0; // 新しいsortの呼び出し (Line 1)
                } else {
                    frame.pc = 101; // 次のステップを 101 に設定
                    nextLine = 26; // 次のifへ (Line 27)
                }
                break;
            case 101: // Line 27: if (j + 1 < last)
                if ((vars.j as number) + 1 < frame.last) {
                    frame.pc = 102; // 次のステップを 102 に設定
                    stack.push({ first: (vars.j as number) + 1, last: frame.last, pc: 0 });
                    nextLine = 0; // 新しいsortの呼び出し (Line 1)
                } else {
                    frame.pc = 102; // 次のステップを 102 に設定
                    nextLine = 28; // endifへ (Line 29)
                }
                break;
            
            default: // 関数の終わり (Line 29 or 26) または再帰呼び出しからの戻り
                stack.pop(); // 現在のフレームを終了
                if (stack.length === 0) {
                    nextLine = 99; // 最初の呼び出し元だったので終了
                } else {
                    // 呼び出し元のフレームに戻る
                    let parentFrame = stack[stack.length - 1];
                    if (parentFrame.pc === 101) {
                        // sort(first, i-1) [Line 25] から戻ってきた
                        nextLine = 26; // 次の Line 27 (if j+1 < last) へ
                    } else if (parentFrame.pc === 102) {
                        // sort(j+1, last) [Line 28] から戻ってきた
                        nextLine = 28; // 次の Line 29 (endif) へ
                    } else {
                        // 予期しない状態
                        nextLine = 99;
                    }
                }
                break;
        }

        return nextLine;
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
const maxOfThreeLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: Line 1: maximum def */ (vars: VariablesState) => ({...vars, result: null}),
        /* 1: Line 2: if (...) */ (vars: VariablesState) => vars,
        /* 2: Line 3: return x */ (vars: VariablesState) => ({...vars, result: vars.x}),
        /* 3: Line 4: elseif (y > z) */ (vars: VariablesState) => vars,
        /* 4: Line 5: return y */ (vars: VariablesState) => ({...vars, result: vars.y}),
        /* 5: Line 6: else */ (vars: VariablesState) => vars,
        /* 6: Line 7: return z */ (vars: VariablesState) => ({...vars, result: vars.z}),
        /* 7: Line 8: endif */ (vars: VariablesState) => vars,
    ],
    calculateNextLine(currentLine: number, vars: VariablesState): number {
        // プリセットが選択されるまで待機
        if (vars.x === null) return currentLine;

        const x = vars.x as number;
        const y = vars.y as number;
        const z = vars.z as number;

        switch (currentLine) {
            case 1: // if (x > y and x > z)
                return (x > y && x > z) ? 2 : 3;
            case 2: // return x
                return 99; // 終了
            case 3: // elseif (y > z)
                return (y > z) ? 4 : 6;
            case 4: // return y
                return 99; // 終了
            case 6: // return z
                return 99; // 終了
            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問34: 2進数から10進数への変換ロジック ---
// =================================================================================
const binaryToDecimalLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars: VariablesState) => vars,
        /* 1: Line 2 */ (vars: VariablesState) => ({ ...vars, i: null, length: 0, result: 0 }),
        /* 2: Line 3 */ (vars: VariablesState) => ({ ...vars, length: (vars.binary as string).length }),
        /* 3: Line 4 */ (vars: VariablesState) => {
            // iの更新。初回は1、それ以降はインクリメント
            const newI = vars.i === null ? 1 : (vars.i as number) + 1;
            return { ...vars, i: newI };
        },
        /* 4: Line 5 */ (vars: VariablesState) => {
            const binaryStr = vars.binary as string;
            const i = vars.i as number;
            // 1-basedのiを0-basedのインデックスに変換
            const digit = parseInt(binaryStr.charAt(i - 1)); 
            const newResult = (vars.result as number) * 2 + digit;
            return { ...vars, result: newResult };
        },
        /* 5: Line 6 */ (vars: VariablesState) => vars, // endfor
        /* 6: Line 7 */ (vars: VariablesState) => vars, // return
    ],
    calculateNextLine(currentLine: number, vars: VariablesState): number {
        // プリセットが選択されるまで待機
        if (vars.binary === null) return currentLine;

        switch (currentLine) {
            case 1: return 2; // Line 2 -> Line 3
            case 2: return 3; // Line 3 -> Line 4 (for)
            
            // forループのカウンタ更新と条件判定
            case 3:
                return (vars.i + 1 as number) <= (vars.length as number) ? 4 : 6; // -> Line 5 or Line 7
            
            // ループ本体実行後
            case 4:
                // 次のループの準備のため、カウンタ更新(Line 4)に戻る
                return 3; 
            
            // ループ終了後
            case 5: // endforに到達した場合もreturnへ
            case 6: // return
                return 99; // 終了

            default:
                return currentLine + 1;
        }
    },
};

// =================================================================================
// --- 問35: 辺リストから隣接行列への変換ロジック ---
// =================================================================================
const edgesToMatrixLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: [
        /* 0: Line 1 */ (vars: VariablesState) => {
            const edgeList = vars.edgeList as number[][] | null;
            return { ...vars, edgeList, nodeNum: edgeList ? edgeList.length : 0, adjMatrix: null, i: null, u: null, v: null };
        },
        /* 1: Line 2 */ (vars: VariablesState) => {
            const nodeNum = vars.nodeNum as number;
            // nodeNum x nodeNum の2次元配列を0で初期化
            const newMatrix = Array.from({ length: nodeNum }, () => Array(nodeNum).fill(0));
            return { ...vars, adjMatrix: newMatrix, i: null, u: null, v: null };
        },
        /* 2: Line 3 */ (vars: VariablesState) => vars,
        /* 3: Line 4 */ (vars: VariablesState) => ({ ...vars, i: (vars.i === null) ? 1 : (vars.i as number) + 1 }),
        /* 4: Line 5 */ (vars: VariablesState) => {
            const i = vars.i as number;
            const edgeList = vars.edgeList as number[][];
            if (i > edgeList.length) return vars; // ループ終了後の不正なアクセスを防止
            const edge = edgeList[i - 1];
            return { ...vars, u: edge[0] };
        },
        /* 5: Line 6 */ (vars: VariablesState) => {
            const i = vars.i as number;
            const edgeList = vars.edgeList as number[][];
            if (i > edgeList.length) return vars;
            const edge = edgeList[i - 1];
            return { ...vars, v: edge[1] };
        },
        /* 6: Line 7 */ (vars: VariablesState) => {
            const u = vars.u as number;
            const v = vars.v as number;
            const newMatrix = (vars.adjMatrix as number[][]).map(row => [...row]); // ディープコピー
            // 1-basedの頂点番号を0-basedのインデックスに変換
            newMatrix[u - 1][v - 1] = 1;
            newMatrix[v - 1][u - 1] = 1;
            return { ...vars, adjMatrix: newMatrix };
        },
        /* 7: Line 8 */ (vars: VariablesState) => vars, // endfor
        /* 8: Line 9 */ (vars: VariablesState) => vars, // return
    ],
    calculateNextLine(currentLine: number, vars: VariablesState): number {
        if (vars.edgeList === null) return currentLine;

        switch (currentLine) {
            case 1: return 2;
            case 2: return 3;
            case 3: // for ループの条件判定
                return (vars.i as number) <= (vars.edgeList as number[][]).length ? 4 : 8;
            case 4: return 5;
            case 5: return 6;
            case 6: return 7;
            case 7: return 3; // endfor -> forの先頭へ
            case 8: return 99; // return -> 終了
            default: return currentLine + 1;
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
// --- 問37: 商品関連度分析のロジック ---
// =================================================================================
const associationAnalysisLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: Array(42).fill((vars: VariablesState) => vars), // ダミー配列

    calculateNextLine(currentLine: number, vars: VariablesState): number {
        // --- 初期化 ---
        if (!vars.initialized) {
            vars.pc = 'start';
            vars.initialized = true;
            return 3; // putRelatedItemの定義へ
        }

        const pc = vars.pc as string;
        const orders = vars.orders as string[][];
        const item = vars.item as string;
        let otherItems = vars.otherItems as string[];

        // --- 実行ロジック ---
        switch (pc) {
            case 'start': // Line 5, 7: allItems, otherItems の準備
                const all = [...new Set(orders.flat())].sort();
                vars.allItems = all;
                vars.otherItems = all.filter(it => it !== item);
                otherItems = vars.otherItems as string[];
                vars.pc = 'init_vars';
                return 4;

            case 'init_vars': // Line 9-13: 変数の初期化
                vars.itemCount = 0;
                vars.arrayK = new Array(otherItems.length).fill(0);
                vars.arrayM = new Array(otherItems.length).fill(0);
                vars.maxL = -Infinity;
                vars.relatedItem = '';
                vars.order_idx = 0;
                vars.pc = 'outer_loop_check';
                return 8;

            case 'outer_loop_check': // Line 15: for (order in orders)
                if ((vars.order_idx as number) < orders.length) {
                    vars.pc = 'check_order_contains_item';
                    return 15;
                } else {
                    vars.i = 1;
                    vars.pc = 'final_loop_check';
                    return 31;
                }
            
            case 'check_order_contains_item': // Line 16: if (order contains item)
                const currentOrder = orders[vars.order_idx as number];
                if (currentOrder.includes(item)) {
                    vars.itemCount++;
                    vars.i = 1; // 内側ループの初期化
                    vars.pc = 'inner_loop_M_check';
                    return 16;
                } else {
                    vars.i = 1; // 内側ループの初期化
                    vars.pc = 'inner_loop_K_check';
                    return 23;
                }

            case 'inner_loop_M_check': // Line 18: for (i in otherItems)
                if ((vars.i as number) <= otherItems.length) {
                    const currentOrderM = orders[vars.order_idx as number];
                    if (currentOrderM.includes(otherItems[(vars.i as number) - 1])) {
                        (vars.arrayM as number[])[(vars.i as number) - 1]++;
                    }
                    vars.i++;
                    return 18;
                } else {
                    vars.order_idx++;
                    vars.pc = 'outer_loop_check';
                    return 29;
                }
            
            case 'inner_loop_K_check': // Line 24: for (i in otherItems)
                 if ((vars.i as number) <= otherItems.length) {
                    const currentOrderK = orders[vars.order_idx as number];
                    if (currentOrderK.includes(otherItems[(vars.i as number) - 1])) {
                        (vars.arrayK as number[])[(vars.i as number) - 1]++;
                    }
                    vars.i++;
                    return 24;
                } else {
                    vars.order_idx++;
                    vars.pc = 'outer_loop_check';
                    return 29;
                }

            case 'final_loop_check': // Line 32: for (i in otherItems)
                if ((vars.i as number) <= otherItems.length) {
                    const Mxy = (vars.arrayM as number[])[(vars.i as number) - 1];
                    const Kx = vars.itemCount as number;
                    const Ky = (vars.arrayK as number[])[(vars.i as number) - 1] + Mxy; // K_y = K_y(b) + M_xy(a)
                    const totalOrders = orders.length;
                    
                    if (Kx > 0 && Ky > 0) {
                        vars.valueL = (Mxy * totalOrders) / (Kx * Ky);
                    } else {
                        vars.valueL = 0;
                    }
                    vars.pc = 'check_maxL';
                    return 32;
                } else {
                    vars.pc = 'end_of_program';
                    return 40;
                }

            case 'check_maxL': // Line 35: if (valueL > maxL)
                if ((vars.valueL as number) > (vars.maxL as number)) {
                    vars.maxL = vars.valueL;
                    vars.relatedItem = otherItems[(vars.i as number) - 1];
                    vars.pc = 'final_loop_increment';
                    return 35;
                } else {
                    vars.pc = 'final_loop_increment';
                    return 37;
                }

            case 'final_loop_increment': // after endif
                vars.i++;
                vars.pc = 'final_loop_check';
                return 38;

            case 'end_of_program':
            default:
                return 99; // 終了
        }
    },
};


// 共通の型定義
type LogicDef = {
  traceLogic: TraceStep[];
  calculateNextLine: (currentLine: number, vars: VariablesState) => number;
};

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
    /* 0: 1行目 (関数定義) */ 
    (vars) => vars, 
    
    /* 1: 2行目 (len_x の計算) */
    (vars) => {
        // ▼▼▼ ガード節を追加 ▼▼▼
        if (!vars.x) return vars; 
        // ▲▲▲
        return ({...vars, len_x: vars.x.length});
    },
    
    /* 2: 3行目 (len_y の計算) */
    (vars) => {
        if (!vars.y) return vars; // ガード節
        return ({...vars, len_y: vars.y.length});
    },
    
    /* 3: 4行目 (配列 z の初期化) */
    (vars) => {
        if (vars.len_x === undefined || vars.len_y === undefined) return vars; // ガード節
        return ({...vars, z: new Array(vars.len_x + vars.len_y).fill(null)});
    },

    /* 4: 5行目 (k の宣言) */
    (vars) => vars,

    /* 5: 6行目 (for 1) */ 
    (vars) => ({ ...vars, k: vars.k === null ? 1 : vars.k }),
    
    /* 6: (a) */   
    (vars) => {
        if (!vars.z || !vars.x || vars.k === null) return vars; // ガード節
        const newZ = [...vars.z];
        newZ[(vars.k as number)-1] = vars.x[(vars.k as number)-1];
        return { ...vars, z: newZ };
    },
    
    /* 7: endfor 1 */ 
    (vars) => ({ ...vars, k: (vars.k as number) + 1 }),
    
    /* 8: for 2 */    
    (vars) => {
        if (vars.len_x === undefined) return vars;
        // 2つ目のループ用にkをリセット
        if (vars.k > vars.len_x && !vars.loop2_active) return { ...vars, k: 1, loop2_active: true };
        return vars;
    },
    
    /* 9: (b) */   
    (vars) => {
        if (!vars.z || !vars.y || vars.k === null || vars.len_x === undefined) return vars;
        const newZ = [...vars.z];
        // z[len_x + k] <- y[k]
        newZ[(vars.len_x as number) + (vars.k as number) - 1] = vars.y[(vars.k as number) - 1];
        return { ...vars, z: newZ };
    },
    
    /* 10: endfor 2 */ 
    (vars) => ({ ...vars, k: (vars.k as number) + 1 }),
    
    /* 11: return */   
    (vars) => vars
  ],
  calculateNextLine: (line, vars) => {
    // ▼▼▼ データ未選択時は進まない ▼▼▼
    if(!vars.x || !vars.y) return line;

    switch(line) {
        case 5: // loop 1 check
            return (vars.k as number) <= (vars.len_x as number) ? 6 : 8;
        case 7: return 5;
        case 8: // loop 2 check
            return (vars.k as number) <= (vars.len_y as number) ? 9 : 11;
        case 10: return 8;
        case 11: return 99;
        default: return line + 1;
    }
  }
};

// ID: 43 (配列逆順 - While) のロジック
const logic_43: LogicDef = {
  traceLogic: [
    (vars) => vars, // 0
    (vars) => vars, // 1
    (vars) => vars, // 2
    (vars) => ({...vars, left: 1}), // 3
    (vars) => ({...vars, right: (vars.array as number[]).length}), // 4
    (vars) => vars, // 5: while
    (vars) => ({...vars, tmp: vars.array[(vars.right as number) - 1]}), // 6
    (vars) => { // 7: array[right] = array[left]
        const newArr = [...vars.array];
        newArr[(vars.right as number) - 1] = newArr[(vars.left as number) - 1];
        return {...vars, array: newArr};
    },
    (vars) => { // 8: array[left] = tmp
        const newArr = [...vars.array];
        newArr[(vars.left as number) - 1] = vars.tmp;
        return {...vars, array: newArr};
    },
    (vars) => ({...vars, left: (vars.left as number) + 1}), // 9
    (vars) => ({...vars, right: (vars.right as number) - 1}), // 10
    (vars) => vars, // 11: endwhile
  ],
  calculateNextLine: (line, vars) => {
      if(!vars.array) return line;
      if (line === 5) {
          return (vars.left as number) < (vars.right as number) ? 6 : 11; // while check
      }
      if (line === 10) return 5; // loop back
      if (line === 11) return 99;
      return line + 1;
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

// ID: 45 (InsertSortStep)
const logic_45: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => vars,
        (vars) => ({...vars, temp: vars.nums[(vars.pos as number) - 1]}),
        (vars) => ({...vars, j: (vars.pos as number) - 1}),
        (vars) => vars, // while check
        (vars) => { // nums[j+1] <- nums[j]
            const newNums = [...vars.nums];
            newNums[vars.j] = newNums[(vars.j as number) - 1];
            return {...vars, nums: newNums};
        },
        (vars) => ({...vars, j: (vars.j as number) - 1}),
        (vars) => vars, // endwhile
        (vars) => { // nums[j+1] <- temp
            const newNums = [...vars.nums];
            newNums[vars.j] = vars.temp; // jは0-basedのインデックスとして使用(j+1の位置)
            return {...vars, nums: newNums};
        }
    ],
    calculateNextLine: (line, vars) => {
        if(!vars.nums) return line;
        if (line === 4) { // while (j >= 1 and nums[j] > temp)
            const j = vars.j as number;
            // JavaScript配列は0-basedなので j-1 を参照。かつ j>=1 (プログラム上は配列範囲内)
            if (j >= 1 && vars.nums[j - 1] > vars.temp) return 5;
            return 8;
        }
        if (line === 7) return 4;
        if (line === 8) return 99;
        return line + 1;
    }
}

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
        if(vars.m === null) return line;
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

// ID: 47 (strToInt)
const logic_47: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => vars,
        (vars) => ({...vars, val: 0}),
        (vars) => ({...vars, i: 1}),
        (vars) => vars, // while
        (vars) => ({...vars, tmp: parseInt(vars.str[(vars.i as number) - 1])}),
        (vars) => ({...vars, val: (vars.val as number) * 10 + (vars.tmp as number)}),
        (vars) => ({...vars, i: (vars.i as number) + 1}),
        (vars) => vars, // endwhile
        (vars) => vars  // return
    ],
    calculateNextLine: (line, vars) => {
        if(!vars.str) return line;
        if(line === 4) {
            // 配列外参照防止 && 終端文字チェック
            if ((vars.i as number) <= vars.str.length && vars.str[(vars.i as number) - 1] !== "$") {
                return 5;
            }
            return 9;
        }
        if(line === 8) return 4;
        if(line === 9) return 99;
        return line + 1;
    }
}

// ID: 48 (decToBin)
const logic_48: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({...vars, bin: Array(6).fill(null)}),
        (vars) => ({...vars, j: vars.n}),
        (vars) => vars,
        (vars) => { if(vars.k === null) return {...vars, k: 6}; return vars; }, // for
        (vars) => {
            const newBin = [...vars.bin];
            newBin[(vars.k as number) - 1] = (vars.j as number) % 2;
            return {...vars, bin: newBin};
        },
        (vars) => ({...vars, j: Math.floor((vars.j as number) / 2)}),
        (vars) => ({...vars, k: (vars.k as number) - 1}), // endfor
        (vars) => vars,
    ],
    calculateNextLine: (line, vars) => {
        if(vars.n === null) return line;
        if(line === 4) return (vars.k as number) >= 1 ? 5 : 8;
        if(line === 7) return 4;
        if(line === 8) return 99;
        return line + 1;
    }
}

// ID: 49 (bitOR - 簡易出力シミュレーション)
const logic_49: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({...vars, result: null, flag: 128, output: []}),
        (vars) => ({...vars, result: vars.x | vars.y}),
        (vars) => { if(vars.i === null) return {...vars, i: 1}; return vars; }, // for
        (vars) => vars, // if ((result & flag) == 0)
        (vars) => ({...vars, output: [...vars.output, 0]}),
        (vars) => vars, // else
        (vars) => ({...vars, output: [...vars.output, 1]}),
        (vars) => vars, // endif
        (vars) => ({...vars, flag: (vars.flag as number) >> 1}),
        (vars) => ({...vars, i: (vars.i as number) + 1}), // endfor
    ],
    calculateNextLine: (line, vars) => {
        if(vars.x === null) return line;
        if(line === 3) return (vars.i as number) <= 8 ? 4 : 11;
        if(line === 4) return ((vars.result & vars.flag) === 0) ? 5 : 7;
        if(line === 5) return 8; // -> endif
        if(line === 7) return 8; // -> endif
        if(line === 10) return 3;
        return line + 1;
    }
}

// ID: 50 (再帰G - 簡易シミュレーション)
const logic_50: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => vars, // if x<=1
        (vars) => ({...vars, ret: 1}),
        (vars) => vars, // else
        (vars) => {
             // 実際には再帰だが、トレース用に値を更新して見せる
             const currentX = vars.x as number;
             if (!vars.history) vars.history = [];
             vars.history.push(`G(${currentX}) call`);
             return vars;
        },
        (vars) => vars
    ],
    calculateNextLine: (line, vars) => {
        if(vars.x === null) return line;
        if(line === 1) return (vars.x <= 1) ? 2 : 4;
        if(line === 2) return 99;
        if(line === 4) return 99; // 再帰の中身までは深追いしない簡易実装
        return line + 1;
    }
}

// ID: 51 (Display Recursion)
const logic_51: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => vars, // if x=0
        (vars) => vars, // return
        (vars) => vars, // endif
        (vars) => ({...vars, output: [...(vars.output||[]), vars.x]}), // print x (前)
        (vars) => ({...vars, x: vars.x - 1}), // display(x-1) シミュレート
        (vars) => ({...vars, output: [...(vars.output||[]), vars.x + 1]}) // print x (後) - 復帰時の値を推測
    ],
    calculateNextLine: (line, vars) => {
        if(vars.x === null) return line;
        if(line === 1) return (vars.x === 0) ? 2 : 4;
        if(line === 2) return 99;
        // 再帰呼び出し(line 5)後の挙動を正確にシミュレートするのは複雑なため、
        // 簡易的に「呼び出し->戻り」を1ステップで表現
        return line + 1;
    }
}

// ID: 54 (Game Score - prev check)
const logic_54: LogicDef = {
    traceLogic: [
        (vars) => vars,
        (vars) => ({...vars, score: 0}),
        (vars) => ({...vars, i: null, curr: 0}),
        (vars) => { if(vars.i === null) return {...vars, i: 1}; return vars; }, // for
        (vars) => {
            const char = vars.mark[(vars.i as number)-1];
            // "_" の場合は数値変換できないので 0 扱いなど、問題の仕様に合わせる
            const val = (char === "_") ? 0 : parseInt(char);
            return {...vars, curr: isNaN(val) ? 0 : val};
        },
        (vars) => ({...vars, score: (vars.score as number) + (vars.curr as number)}),
        (vars) => vars, // if mark == "_"
        (vars) => {
            // 前の値を加算
             const prevChar = vars.mark[(vars.i as number)-2];
             const prevVal = parseInt(prevChar);
             return {...vars, score: (vars.score as number) + (isNaN(prevVal) ? 0 : prevVal)};
        },
        (vars) => vars, // endif
        (vars) => ({...vars, i: (vars.i as number) + 1}), // endfor
        (vars) => vars // return
    ],
    calculateNextLine: (line, vars) => {
        if(!vars.mark) return line;
        if(line === 3) return (vars.i as number) <= vars.mark.length ? 4 : 10;
        if(line === 6) return (vars.mark[(vars.i as number)-1] === "_") ? 7 : 8;
        if(line === 7) return 8;
        if(line === 9) return 3;
        if(line === 10) return 99;
        return line + 1;
    }
}

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
    '54': logic_54,
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
  'MINIMAX': minimaxLogic,
  'UTF8_ENCODE': utf8EncodeLogic,
  'STATIC_QA': staticQaLogic,
  'ADMISSION_FEE': admissionFeeLogic,
  'ARRAY_REVERSE': arrayReverseLogic,
  'LINKED_LIST_APPEND': linkedListAppendLogic,
  'SPARSE_MATRIX': sparseMatrixLogic,
  'CONDITIONAL_PROBABILITY': conditionalProbabilityLogic,
  'PRIME_NUMBER': primeNumberLogic,
  'CALL_STACK': callStackLogic,
  'QUICKSORT_TRACE': quicksortTraceLogic,
  'COSINE_SIMILARITY': cosineSimilarityLogic,
  'MAX_OF_THREE': maxOfThreeLogic,
  'BINARY_TO_DECIMAL': binaryToDecimalLogic,
  'EDGES_TO_MATRIX': edgesToMatrixLogic,
  'MERGE_ALGORITHM': mergeAlgorithmLogic,
  'ASSOCIATION_ANALYSIS': associationAnalysisLogic,
  'PSEUDO_CODE': pseudoCodeLogic,
};