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

const gcdSubtractionLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
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
  calculateNextLine: (currentLine, vars) => {
    const x = vars.x as number;
    const y = vars.y as number;

    switch (currentLine) {
      // 初期化フェーズ
      case 0: return 1; // 1 -> 2
      case 1: return 2; // 2 -> 3
      case 2: return 3; // 3 -> 4 (while)

      // ループと分岐
      case 3: // 4行目(while)評価後
        if (x === null || y === null) return 3; // 初期化が終わるまで待機
        return (x !== y) ? 4 : 10; // 条件がtrueなら5行目(if)へ、falseなら11行目(return)へ

      case 4: // 5行目(if)評価後
        return (x > y) ? 5 : 6; // 条件がtrueなら6行目(x-=y)へ、falseなら7行目(else)へ

      case 5: // 6行目(x-=y)実行後
        return 8; // 9行目(endif)へ

      case 6: // 7行目(else)実行後
        return 7; // 8行目(y-=x)へ

      case 7: // 8行目(y-=x)実行後
        return 8; // 9行目(endif)へ

      case 8: // 9行目(endif)実行後
        return 9; // 10行目(endwhile)へ

      case 9: // 10行目(endwhile)実行後
        return 3; // 4行目(while)の条件評価に戻る

      default:
        return currentLine + 1; // それ以外の行は単純に次の行へ
    }
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
const bitReverseLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
  // トレースの各ステップ（行）に対応する処理を定義
  traceLogic: [
    (vars) => vars, // 1: ○8ビット型: rev(...) - 関数定義行、変数の変化なし
    (vars) => ({ ...vars, rbyte: vars.byte }), // 2: rbyte ← byte
    (vars) => ({ ...vars, r: '00000000' }), // 3: r ← 00000000
    (vars) => vars, // 4: 整数型: i - 変数宣言のみ
    (vars) => { // 5: for (i を 1 から 8 まで...) - ループ開始、iを初期化
        // 初回のみiを1に設定
        if (vars.i === null) return { ...vars, i: 1 };
        return vars;
    },
    (vars) => { // 6: ループ本体の処理
        // 現在の変数の値を文字列から数値に変換
        const rNum = parseInt(vars.r as string, 2);
        const rbyteNum = parseInt(vars.rbyte as string, 2);

        // 正解ロジック: r ← (r << 1) v (rbyte ^ 00000001)
        // 1. rbyteの最下位ビットを取得 (rbyte & 1)
        // 2. rを1ビット左にシフト (rNum << 1)
        // 3. 上記2つの結果の論理和をとる
        const newRNum = (rNum << 1) | (rbyteNum & 1);

        // 正解ロジック: rbyte ← rbyte >> 1
        const newRbyteNum = rbyteNum >> 1;

        // 計算結果を8桁のバイナリ文字列に戻して状態を更新
        return {
            ...vars,
            r: newRNum.toString(2).padStart(8, '0'),
            rbyte: newRbyteNum.toString(2).padStart(8, '0'),
        };
    },
    (vars) => { // 7: endfor - ループカウンタiをインクリメント
        const currentI = vars.i as number;
        return { ...vars, i: currentI + 1 };
    },
    (vars) => vars, // 8: return r - 変数の変化なし
  ],
  // 次に実行すべき行を計算するロジック (forループの制御)
  calculateNextLine: (currentLine, vars) => {
      const i = vars.i as number | null;
      if (i === null) return currentLine + 1; // 初期化が終わるまで待機

      switch (currentLine) {
          case 4: // for文の評価
              return i <= 8 ? 5 : 7; // ループ継続なら6行目(本体)へ、終了なら8行目(return)へ
          case 5: // ループ本体の実行後
              return 6; // endforへ
          case 6: // endforの実行後
              return 4; // for文の評価に戻る
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
const linkedListDeleteLogic: { traceLogic: TraceStep[]; calculateNextLine: (currentLine: number, vars: VariablesState) => number } = {
    traceLogic: Array(15).fill((vars: VariablesState) => vars), // traceLogicは使いません
    calculateNextLine(currentLine, vars) {
        // ステップの最初に変数を確実に初期化/リセットする
        if (!vars.initialized) {
            vars.listData = [
                { val: 'A', next: 1 }, { val: 'B', next: 2 },
                { val: 'C', next: 3 }, { val: 'D', next: null },
            ];
            vars.listHead = 0;
            vars.i = null;
            vars.prev = null;
            vars.initialized = true; // 初期化済みフラグ
        }

        const executedLine = currentLine + 1;
        const pos = vars.pos as number;
        const listData = vars.listData as { val: string; next: number | null }[];

        switch (executedLine) {
            case 4: // ○delNode
                return 5; // -> if文へ
            case 6: // if (pos == 1)
                return pos === 1 ? 6 : 8; // -> line 7 or 9
            case 7: // listHead ← listHead.next
                vars.listHead = listData[vars.listHead as number].next;
                return 14; // -> endif
            case 9: // prev ← listHead
                vars.prev = vars.listHead;
                vars.i = 2;
                return 10; // -> for
            case 11: // for
                return (vars.i as number) < pos ? 11 : 13; // -> loop body or after
            case 12: // prev ← prev.next
                vars.prev = listData[vars.prev as number].next;
                vars.i = (vars.i as number) + 1;
                return 10; // -> back to for
            case 14: {
                const prevNodeIndex = vars.prev as number;
                const nodeToDeleteIndex = listData[prevNodeIndex].next;
                if (nodeToDeleteIndex !== null) {
                    const nodeAfterDeletedIndex = listData[nodeToDeleteIndex].next;
                    listData[prevNodeIndex].next = nodeAfterDeletedIndex;
                }
                return 14; // -> endif
            }
            case 15: // endif
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
        /* 3 */ (vars) => ({ ...vars, bins: new Array(vars.n).fill(null) }),
        /* 4 */ (vars) => ({ ...vars, i: 1 }),
        /* 5 */ (vars) => vars, // for ループの条件判定 (変数変更なし)
        /* 6 */ (vars) => {
            const newBins = [...vars.bins];
            const data = vars.data as number[];
            const i = vars.i as number;
            const value = data[i - 1]; // 配列のインデックスは0から
            if (value > 0 && value <= newBins.length) {
              newBins[value - 1] = value; // 配列のインデックスは0から
            }
            return { ...vars, bins: newBins };
        },
        /* 7 */ (vars) => ({ ...vars, i: (vars.i as number) + 1 }), // endfor (iのインクリメント)
        /* 8 */ (vars) => vars, // return
    ],
    calculateNextLine(currentLine, vars) {
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
};