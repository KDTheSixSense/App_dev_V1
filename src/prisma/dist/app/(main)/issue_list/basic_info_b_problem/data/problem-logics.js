"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.problemLogicsMap = void 0;
// 各ロジックの定義
const variableSwapLogic = {
    traceLogic: [
        (vars) => (Object.assign(Object.assign({}, vars), { x: 1 })),
        (vars) => (Object.assign(Object.assign({}, vars), { y: 2 })),
        (vars) => (Object.assign(Object.assign({}, vars), { z: 3 })),
        (vars) => (Object.assign(Object.assign({}, vars), { x: vars.y })),
        (vars) => (Object.assign(Object.assign({}, vars), { y: vars.z })),
        (vars) => (Object.assign(Object.assign({}, vars), { z: vars.x })),
        (vars) => vars,
    ],
};
const fizzBuzzLogic = {
    traceLogic: [
        (vars) => vars,
        (vars) => (Object.assign(Object.assign({}, vars), { result: null })),
        (vars) => vars,
        (vars) => (Object.assign(Object.assign({}, vars), { result: "3と5で割り切れる" })),
        (vars) => vars,
        (vars) => (Object.assign(Object.assign({}, vars), { result: "3で割り切れる" })),
        (vars) => vars,
        (vars) => (Object.assign(Object.assign({}, vars), { result: "5で割り切れる" })),
        (vars) => vars,
        (vars) => (Object.assign(Object.assign({}, vars), { result: "3でも5でも割り切れない" })),
        (vars) => vars,
        (vars) => vars,
    ],
    calculateNextLine: (currentLine, vars) => {
        const num = vars.num;
        if (num === null)
            return currentLine;
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
const arraySumLogic = {
    traceLogic: [
        (vars) => (Object.assign(Object.assign({}, vars), { in: [3, 2, 1, 6, 5, 4] })),
        (vars) => (Object.assign(Object.assign({}, vars), { out: [] })),
        (vars) => (Object.assign(Object.assign({}, vars), { i: null, tail: null })),
        (vars) => {
            const newOut = [...vars.out];
            newOut.push(vars.in[0]);
            return Object.assign(Object.assign({}, vars), { out: newOut });
        },
        (vars) => {
            const i = vars.i;
            return i === null ? Object.assign(Object.assign({}, vars), { i: 2 }) : vars;
        },
        (vars) => {
            const out = vars.out;
            return Object.assign(Object.assign({}, vars), { tail: out[out.length - 1] });
        },
        (vars) => {
            const newOut = [...vars.out];
            const i = vars.i;
            const valueToAdd = vars.tail + vars.in[i - 1];
            newOut.push(valueToAdd);
            return Object.assign(Object.assign({}, vars), { out: newOut });
        },
        (vars) => {
            const i = vars.i;
            return Object.assign(Object.assign({}, vars), { i: i + 1 });
        },
        (vars) => vars,
    ],
    calculateNextLine: (currentLine, vars) => {
        const i = vars.i;
        const inArray = vars.in;
        switch (currentLine + 1) {
            case 5: return i <= inArray.length ? 5 : 8;
            case 6: return 6;
            case 7: return 7;
            case 8: return i <= inArray.length ? 5 : 8;
            default: return currentLine + 1;
        }
    },
};
const gcdSubtractionLogic = {
    traceLogic: [
        (vars) => vars, // 1: ○整数型: gcd(整数型: num1, 整数型: num2)
        (vars) => (Object.assign(Object.assign({}, vars), { x: vars.num1 })), // 2: 整数型: x ← num1
        (vars) => (Object.assign(Object.assign({}, vars), { y: vars.num2 })), // 3: 整数型: y ← num2
        (vars) => vars, // 4: [ a ] (while)
        (vars) => vars, // 5: if ( [ b ] )
        (vars) => (Object.assign(Object.assign({}, vars), { x: vars.x - vars.y })), // 6: x ← x - y
        (vars) => vars, // 7: else
        (vars) => (Object.assign(Object.assign({}, vars), { y: vars.y - vars.x })), // 8: y ← y - x
        (vars) => vars, // 9: endif
        (vars) => vars, // 10: [ c ] (endwhile)
        (vars) => vars, // 11: return x
    ],
    calculateNextLine: (currentLine, vars) => {
        const x = vars.x;
        const y = vars.y;
        switch (currentLine) {
            // 初期化フェーズ
            case 0: return 1; // 1 -> 2
            case 1: return 2; // 2 -> 3
            case 2: return 3; // 3 -> 4 (while)
            // ループと分岐
            case 3: // 4行目(while)評価後
                if (x === null || y === null)
                    return 3; // 初期化が終わるまで待機
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
const expressionEvalLogic = {
    traceLogic: [
        // 1行目: ○実数型: calc(実数型: x, 実数型: y)
        // この行では変数の変化はない
        (vars) => vars,
        // 2行目: return [ ... ]
        // ここで計算を実行し、結果を result 変数に格納する
        (vars) => {
            const x = vars.x;
            const y = vars.y;
            // 正解の式 pow(pow(x, 2) + pow(y, 2), 0.5) を計算
            // Math.pow(base, exponent) は累乗を計算
            // Math.sqrt(number) は平方根を計算
            const result = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            return Object.assign(Object.assign({}, vars), { result: result });
        },
    ],
};
const bitReverseLogic = {
    // トレースの各ステップ（行）に対応する処理を定義
    traceLogic: [
        (vars) => vars, // 1: ○8ビット型: rev(...) - 関数定義行、変数の変化なし
        (vars) => (Object.assign(Object.assign({}, vars), { rbyte: vars.byte })), // 2: rbyte ← byte
        (vars) => (Object.assign(Object.assign({}, vars), { r: '00000000' })), // 3: r ← 00000000
        (vars) => vars, // 4: 整数型: i - 変数宣言のみ
        (vars) => {
            // 初回のみiを1に設定
            if (vars.i === null)
                return Object.assign(Object.assign({}, vars), { i: 1 });
            return vars;
        },
        (vars) => {
            // 現在の変数の値を文字列から数値に変換
            const rNum = parseInt(vars.r, 2);
            const rbyteNum = parseInt(vars.rbyte, 2);
            // 正解ロジック: r ← (r << 1) v (rbyte ^ 00000001)
            // 1. rbyteの最下位ビットを取得 (rbyte & 1)
            // 2. rを1ビット左にシフト (rNum << 1)
            // 3. 上記2つの結果の論理和をとる
            const newRNum = (rNum << 1) | (rbyteNum & 1);
            // 正解ロジック: rbyte ← rbyte >> 1
            const newRbyteNum = rbyteNum >> 1;
            // 計算結果を8桁のバイナリ文字列に戻して状態を更新
            return Object.assign(Object.assign({}, vars), { r: newRNum.toString(2).padStart(8, '0'), rbyte: newRbyteNum.toString(2).padStart(8, '0') });
        },
        (vars) => {
            const currentI = vars.i;
            return Object.assign(Object.assign({}, vars), { i: currentI + 1 });
        },
        (vars) => vars, // 8: return r - 変数の変化なし
    ],
    // 次に実行すべき行を計算するロジック (forループの制御)
    calculateNextLine: (currentLine, vars) => {
        const i = vars.i;
        if (i === null)
            return currentLine + 1; // 初期化が終わるまで待機
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
const recursiveFactorialLogic = {
    traceLogic: [
        (vars) => vars, // 1: ○整数型: factorial(整数型: n)
        (vars) => vars, // 2: if (n = 0)
        (vars) => vars, // 3: return 1
        (vars) => vars, // 4: endif
        (vars) => {
            const currentN = vars.current_n;
            const result = vars.result;
            // 再帰の1ステップをシミュレート
            return Object.assign(Object.assign({}, vars), { result: result * currentN, current_n: currentN - 1 });
        },
    ],
    calculateNextLine: (currentLine, vars) => {
        const currentN = vars.current_n;
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
const _dequeue = (queue) => {
    if (queue.length === 0)
        return { newQueue: [], dequeuedValue: null };
    const highestPrio = Math.min(...queue.map(item => item.prio));
    const indexToRemove = queue.findIndex(item => item.prio === highestPrio);
    const dequeuedValue = queue[indexToRemove].value;
    const newQueue = queue.filter((_, index) => index !== indexToRemove);
    return { newQueue, dequeuedValue };
};
const priorityQueueLogic = {
    traceLogic: Array(17).fill((vars) => vars),
    calculateNextLine: (currentLine, vars) => {
        const lineNum = currentLine + 1; // Convert 0-indexed to 1-indexed line number
        switch (lineNum) {
            case 2:
                vars.queue = [];
                vars.output = [];
                break;
            case 3:
                vars.queue.push({ value: 'A', prio: 1 });
                break;
            case 4:
                vars.queue.push({ value: 'B', prio: 2 });
                break;
            case 5:
                vars.queue.push({ value: 'C', prio: 2 });
                break;
            case 6:
                vars.queue.push({ value: 'D', prio: 3 });
                break;
            case 7:
                vars.queue = _dequeue(vars.queue).newQueue;
                break;
            case 8:
                vars.queue = _dequeue(vars.queue).newQueue;
                break;
            case 9:
                vars.queue.push({ value: 'D', prio: 3 });
                break;
            case 10:
                vars.queue.push({ value: 'B', prio: 2 });
                break;
            case 11:
                vars.queue = _dequeue(vars.queue).newQueue;
                break;
            case 12:
                vars.queue = _dequeue(vars.queue).newQueue;
                break;
            case 13:
                vars.queue.push({ value: 'C', prio: 2 });
                break;
            case 14:
                vars.queue.push({ value: 'A', prio: 1 });
                break;
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
const binaryTreeTraversalLogic = {
    // traceLogicは各行の実行に対応する変数の更新のみを行う
    traceLogic: [
        /* 0-3 */ (vars) => vars, (vars) => vars, (vars) => vars, (vars) => vars,
        /* 4: ○order(n) */
        (vars) => {
            const stack = vars.callStack;
            const frame = stack.length > 0 ? stack[stack.length - 1] : null;
            return frame ? Object.assign(Object.assign({}, vars), { currentNode: frame.n }) : vars;
        },
        /* 5: if */ (vars) => vars,
        /* 6: order(left) */ (vars) => vars,
        /* 7: nを出力 */
        (vars) => {
            const frame = vars.callStack[vars.callStack.length - 1];
            return Object.assign(Object.assign({}, vars), { output: [...vars.output, frame.n] });
        },
        /* 8: order(right) */ (vars) => vars,
        /* 9: elseif */ (vars) => vars,
        /* 10: order(left) */ (vars) => vars,
        /* 11: nを出力 */
        (vars) => {
            const frame = vars.callStack[vars.callStack.length - 1];
            return Object.assign(Object.assign({}, vars), { output: [...vars.output, frame.n] });
        },
        /* 12: else */ (vars) => vars,
        /* 13: nを出力 */
        (vars) => {
            const frame = vars.callStack[vars.callStack.length - 1];
            return Object.assign(Object.assign({}, vars), { output: [...vars.output, frame.n] });
        },
        /* 14: endif */ (vars) => vars,
    ],
    // calculateNextLineが実行フローの全てを制御する
    calculateNextLine(currentLine, vars) {
        let stack = (vars.callStack || []);
        const tree = vars.tree;
        // --- 初期化 ---
        if (currentLine === 0 && stack.length === 0) {
            vars.callStack = [{ n: 1, pc: 5 }]; // 最初の呼び出し order(1)
            vars.output = [];
            return 4; // 最初の実行行 (5行目) のインデックス
        }
        if (stack.length === 0)
            return 99; // トレース終了
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
                }
                else {
                    nextLine = 99; // 全ての処理が終了
                }
                break;
            default:
                nextLine = 99;
        }
        vars.callStack = stack;
        return nextLine - 1; // 0-indexedに変換して返す
    },
};
// リンクリストの削除ロジック 未完成なので後で修正入れる
const linkedListDeleteLogic = {
    traceLogic: Array(15).fill((vars) => vars), // traceLogicは使いません
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
        const pos = vars.pos;
        const listData = vars.listData;
        switch (executedLine) {
            case 4: // ○delNode
                return 5; // -> if文へ
            case 6: // if (pos == 1)
                return pos === 1 ? 6 : 8; // -> line 7 or 9
            case 7: // listHead ← listHead.next
                vars.listHead = listData[vars.listHead].next;
                return 14; // -> endif
            case 9: // prev ← listHead
                vars.prev = vars.listHead;
                vars.i = 2;
                return 10; // -> for
            case 11: // for
                return vars.i < pos ? 11 : 13; // -> loop body or after
            case 12: // prev ← prev.next
                vars.prev = listData[vars.prev].next;
                vars.i = vars.i + 1;
                return 10; // -> back to for
            case 14: {
                const prevNodeIndex = vars.prev;
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
const binSortLogic = {
    traceLogic: [
        /* 1 */ (vars) => vars,
        /* 2 */ (vars) => (Object.assign(Object.assign({}, vars), { n: vars.data.length })),
        // ✅【修正点】binsのサイズをハードコードせず、nの値から動的に生成する
        /* 3 */ (vars) => (Object.assign(Object.assign({}, vars), { bins: new Array(vars.n).fill(null) })),
        /* 4 */ (vars) => (Object.assign(Object.assign({}, vars), { i: 1 })),
        /* 5 */ (vars) => vars, // for ループの条件判定 (変数変更なし)
        /* 6 */ (vars) => {
            const newBins = [...vars.bins];
            const data = vars.data;
            const i = vars.i;
            const value = data[i - 1]; // 配列のインデックスは0から
            // 値がbins配列の範囲内にあるかチェック（安全対策）
            if (value > 0 && value <= newBins.length) {
                newBins[value - 1] = value; // 配列のインデックスは0から
            }
            return Object.assign(Object.assign({}, vars), { bins: newBins });
        },
        /* 7 */ (vars) => (Object.assign(Object.assign({}, vars), { i: vars.i + 1 })), // endfor (iのインクリメント)
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
                return vars.i <= vars.n ? 5 : 7; // -> 6 (本体) or 8 (終了後)
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
const fiveNumberSummaryLogic = {
    traceLogic: [
        /* 1: findRank Def */ (vars) => vars,
        /* 2: findRank i Dec */ (vars) => vars,
        /* 3: i ← ... */ (vars) => {
            const sortedData = vars.sortedData;
            const p = vars.current_p;
            const i = Math.ceil((sortedData.length - 1) * p);
            return Object.assign(Object.assign({}, vars), { findRank_i: i });
        },
        /* 4: return ... */ (vars) => vars,
        /* 5: Space */ (vars) => vars,
        /* 6: summarize Def */ (vars) => vars,
        /* 7: rankData ← {} */ (vars) => (Object.assign(Object.assign({}, vars), { rankData: [] })),
        /* 8: p ← {...} */ (vars) => (Object.assign(Object.assign({}, vars), { p_values: [0, 0.25, 0.5, 0.75, 1] })),
        /* 9: i Dec */ (vars) => {
            // ループ開始時にiを初期化
            if (vars.i === null)
                return Object.assign(Object.assign({}, vars), { i: 1 });
            return vars;
        },
        /* 10: for loop */ (vars) => vars,
        /* 11: rankData.append */ (vars) => {
            const sortedData = vars.sortedData;
            const findRank_i = vars.findRank_i;
            const valueToAdd = sortedData[findRank_i]; // 1-based to 0-based index
            return Object.assign(Object.assign({}, vars), { rankData: [...vars.rankData, valueToAdd] });
        },
        /* 12: endfor */ (vars) => (Object.assign(Object.assign({}, vars), { i: vars.i + 1 })),
        /* 13: return rankData */ (vars) => vars,
    ],
    calculateNextLine(currentLine, vars) {
        const lineNum = currentLine + 1;
        const callStack = (vars.callStack || []);
        // --- summarize ループ制御 ---
        if (lineNum === 10) { // for文の評価
            const i = vars.i;
            const p_values = vars.p_values;
            if (i <= p_values.length) {
                // findRank呼び出し準備
                vars.current_p = p_values[i - 1]; // iは1-based
                callStack.push({ name: 'findRank', return_to: 12 }); // 戻り先はendfor
                return 2; // findRankの3行目にジャンプ
            }
            else {
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
const similarityRatioLogic = {
    traceLogic: Array(11).fill((vars) => vars), // traceLogicは使いません
    calculateNextLine(currentLine, vars) {
        // トレースの最初のステップで変数を初期化
        if (!vars.initialized) {
            vars.i = 1;
            vars.cnt = 0;
            vars.result = null;
            vars.initialized = true;
        }
        const lineNum = currentLine + 1;
        const s1 = vars.s1;
        const s2 = vars.s2;
        let i = vars.i;
        let cnt = vars.cnt;
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
                }
                else {
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
const binarySearchLogic = {
    // 各行の実行に対応する変数更新ロジック
    traceLogic: [
        /* 1 */ (vars) => vars,
        /* 2 */ (vars) => vars,
        /* 3 */ (vars) => vars,
        /* 4 */ (vars) => (Object.assign(Object.assign({}, vars), { low: 1 })),
        /* 5 */ (vars) => (Object.assign(Object.assign({}, vars), { high: vars.data.length })),
        /* 6 */ (vars) => vars,
        /* 7 */ (vars) => vars, // while の評価は calculateNextLine で行う
        /* 8 */ (vars) => (Object.assign(Object.assign({}, vars), { middle: Math.floor((vars.low + vars.high) / 2) })),
        /* 9 */ (vars) => vars, // if の評価は calculateNextLine で行う
        /* 10 */ (vars) => (Object.assign(Object.assign({}, vars), { low: vars.middle })), // 問題文のバグを再現
        /* 11 */ (vars) => vars, // elseif の評価は calculateNextLine で行う
        /* 12 */ (vars) => (Object.assign(Object.assign({}, vars), { high: vars.middle })), // 問題文のバグを再現
        /* 13 */ (vars) => vars, // else
        /* 14 */ (vars) => (Object.assign(Object.assign({}, vars), { result: vars.middle })),
        /* 15 */ (vars) => vars, // endif
        /* 16 */ (vars) => vars, // endwhile
        /* 17 */ (vars) => vars,
        /* 18 */ (vars) => (Object.assign(Object.assign({}, vars), { result: -1 })),
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
                return low <= high ? 7 : 17; // -> 8行目 or 18行目
            case 7: // 8行目: middle計算後 -> 9行目へ
                return 8;
            case 8: // 9行目: if の評価
                const middleValue = data[middle - 1];
                if (middleValue < target) {
                    return 9; // -> 10行目
                }
                else if (middleValue > target) {
                    return 10; // -> 11行目
                }
                else {
                    return 12; // -> 13行目
                }
            case 9: // 10行目: low更新後 -> 16行目(endwhile)へ
                return 15;
            case 10: // 11行目: elseif の評価
                const middleValueElse = data[middle - 1];
                return (middleValueElse > target) ? 11 : 12; // -> 12行目 or 13行目
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
const minimaxLogic = {
    traceLogic: [
        // ステップ0: 初期状態
        (vars) => vars,
        // ステップ1: Aの評価値を計算
        (vars) => (Object.assign(Object.assign({}, vars), { "a (Aの子の評価値)": 0 })),
        // ステップ2: Bの評価値を計算
        (vars) => (Object.assign(Object.assign({}, vars), { "b (Bの子の評価値)": -10 })),
        // ステップ3: 完了
        (vars) => vars,
    ],
};
const utf8EncodeLogic = {
    traceLogic: [
        /* 0: 1行目 */ (vars) => vars,
        /* 1: 2行目 */ (vars) => vars,
        /* 2: 3行目 */ (vars) => vars,
        /* 3: 4行目 */ (vars) => (Object.assign(Object.assign({}, vars), { utf8Bytes: [224, 128, 128] })),
        /* 4: 5行目 */ (vars) => (Object.assign(Object.assign({}, vars), { cp: vars.codePoint })),
        /* 5: 6行目 */ (vars) => (Object.assign(Object.assign({}, vars), { i: 3 })), // ループ変数iを3で初期化
        /* 6: 7行目 */ (vars) => vars, // for ループの条件評価 (calculateNextLineで処理)
        /* 7: 8行目 */ (vars) => {
            const i = vars.i;
            const cp = vars.cp;
            const currentBytes = vars.utf8Bytes;
            const newBytes = [...currentBytes];
            // cpを64で割った余りを加算
            newBytes[i - 1] += cp % 64; // iは1-basedなので-1
            return Object.assign(Object.assign({}, vars), { utf8Bytes: newBytes });
        },
        /* 8: 9行目 */ (vars) => {
            // cpを64で割った商で更新
            return Object.assign(Object.assign({}, vars), { cp: Math.floor(vars.cp / 64) });
        },
        /* 9: 10行目*/ (vars) => (Object.assign(Object.assign({}, vars), { i: vars.i - 1 })), // endforでiをデクリメント
        /* 10: 11行目*/ (vars) => vars,
    ],
    calculateNextLine(currentLine, vars) {
        // iが初期化されるまで(6行目まで)は単純に次に進む
        if (vars.i === null && currentLine < 5) {
            return currentLine + 1;
        }
        switch (currentLine) {
            case 6: // for文の条件評価
                return vars.i >= 1 ? 7 : 10; // ループ継続なら8行目へ、終了なら11行目へ
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
const staticQaLogic = {
    traceLogic: [], // トレース処理は不要
};
const admissionFeeLogic = {
    traceLogic: [
        (vars) => vars, // 1: ○整数型: fee(整数型: num)
        (vars) => (Object.assign(Object.assign({}, vars), { ret: null })), // 2: 整数型: ret
        (vars) => vars, // 3: if (num が 3 以下)
        (vars) => (Object.assign(Object.assign({}, vars), { ret: 100 })), // 4: ret ← 100
        (vars) => vars, // 5: elseif (num が 9 以下)
        (vars) => (Object.assign(Object.assign({}, vars), { ret: 300 })), // 6: ret ← 300
        (vars) => vars, // 7: else
        (vars) => (Object.assign(Object.assign({}, vars), { ret: 500 })), // 8: ret ← 500
        (vars) => vars, // 9: endif
        (vars) => vars, // 10: return ret
    ],
    calculateNextLine: (currentLine, vars) => {
        const num = vars.num; // 変数名を age から num に変更
        if (num === null)
            return currentLine;
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
const arrayReverseLogic = {
    traceLogic: [
        /* 1 */ (vars) => (Object.assign(Object.assign({}, vars), { array: [1, 2, 3, 4, 5] })),
        /* 2 */ (vars) => (Object.assign(Object.assign({}, vars), { right: null, left: null })),
        /* 3 */ (vars) => (Object.assign(Object.assign({}, vars), { tmp: null })),
        /* 4 */ (vars) => vars, // 空行
        /* 5 */ (vars) => {
            if (vars.left === null) {
                return Object.assign(Object.assign({}, vars), { left: 1 });
            }
            return vars;
        },
        /* 6 */ (vars) => {
            const array = vars.array;
            const left = vars.left;
            return Object.assign(Object.assign({}, vars), { right: array.length - left + 1 });
        },
        /* 7 */ (vars) => {
            const array = vars.array;
            const right = vars.right;
            return Object.assign(Object.assign({}, vars), { tmp: array[right - 1] }); // 1-based index to 0-based
        },
        /* 8 */ (vars) => {
            const newArray = [...vars.array];
            const left = vars.left;
            const right = vars.right;
            newArray[right - 1] = newArray[left - 1];
            return Object.assign(Object.assign({}, vars), { array: newArray });
        },
        /* 9 */ (vars) => {
            const newArray = [...vars.array];
            const left = vars.left;
            const tmp = vars.tmp;
            newArray[left - 1] = tmp;
            return Object.assign(Object.assign({}, vars), { array: newArray });
        },
        /* 10 */ (vars) => {
            return Object.assign(Object.assign({}, vars), { left: vars.left + 1 });
        },
    ],
    calculateNextLine(currentLine, vars) {
        // 初期化が終わるまで待機
        if (vars.array === null)
            return currentLine;
        const lineNum = currentLine + 1; // 1-indexedの行番号
        const array = vars.array;
        const left = vars.left;
        switch (lineNum) {
            case 5: // for ループの条件判定
                // (要素数 / 2) の商までループ
                return left <= Math.floor(array.length / 2) ? 5 : 10; // -> 6 (本体) or 11(終了)
            case 6: return 6; // -> 7
            case 7: return 7; // -> 8
            case 8: return 8; // -> 9
            case 9: return 9; // -> 10 (endfor)
            case 10: return 4; // -> 5 (forループの先頭へ戻る)
            default:
                return lineNum;
        }
    },
};
// =================================================================================
// --- 【★ここから修正】問23: 単方向リストのロジックを全面的に改善 ---
// =================================================================================
const linkedListAppendLogic = {
    // ★★★ traceLogicは状態を更新するだけのシンプルな関数群に戻す ★★★
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => vars,
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => (Object.assign(Object.assign({}, vars), { prev: null, curr: null })),
        /* 4: Line 5 */ (vars) => {
            const newNode = { val: vars.qVal, next: null };
            const newListData = [...vars.listData];
            const newNodeIndex = newListData.length;
            newListData.push(newNode);
            return Object.assign(Object.assign({}, vars), { listData: newListData, curr: newNodeIndex });
        },
        /* 5: Line 6 */ (vars) => vars,
        /* 6: Line 7 */ (vars) => (Object.assign(Object.assign({}, vars), { listHead: vars.curr })),
        /* 7: Line 8 */ (vars) => vars,
        /* 8: Line 9 */ (vars) => (Object.assign(Object.assign({}, vars), { prev: vars.listHead })),
        /* 9: Line 10 */ (vars) => vars,
        /* 10: Line 11 */ (vars) => {
            const listData = vars.listData;
            const prevIndex = vars.prev;
            return Object.assign(Object.assign({}, vars), { prev: listData[prevIndex].next });
        },
        /* 11: Line 12 */ (vars) => vars,
        /* 12: Line 13 */ (vars) => {
            const newListData = JSON.parse(JSON.stringify(vars.listData));
            if (vars.prev !== null) {
                newListData[vars.prev].next = vars.curr;
            }
            return Object.assign(Object.assign({}, vars), { listData: newListData });
        },
        /* 13: Line 14 */ (vars) => vars,
    ],
    // ★★★ calculateNextLineは次にどの行へ進むかだけを決定する ★★★
    calculateNextLine(currentLine, vars) {
        var _a;
        // 最初のクリック(currentLine=0)で3行目(index 2)に飛ぶ
        if (currentLine === 0)
            return 2;
        const executedLine = currentLine;
        switch (executedLine) {
            case 2: return 3;
            case 3: return 4;
            case 4: return 5;
            case 5: return vars.listHead === null ? 6 : 8;
            case 6: return 13;
            case 8: return 9;
            case 9:
                const listData = vars.listData;
                const prevIndex = vars.prev;
                return (vars.prev !== null && ((_a = listData[prevIndex]) === null || _a === void 0 ? void 0 : _a.next) !== null) ? 10 : 11;
            case 10: return 9;
            case 11: return 12;
            case 12: return 13;
            case 13: return 99;
            default: return 99;
        }
    },
};
// =================================================================================
// --- 【★ここから追加】問24: スパースマトリックス変換のロジック ---
// =================================================================================
const sparseMatrixLogic = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => (Object.assign(Object.assign({}, vars), { i: null, j: null })),
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => (Object.assign(Object.assign({}, vars), { sparseMatrix: [[], [], []] })),
        /* 4: Line 5 */ (vars) => {
            // iの初期化
            if (vars.i === null)
                return Object.assign(Object.assign({}, vars), { i: 1 });
            return vars;
        },
        /* 5: Line 6 */ (vars) => {
            // jの初期化
            if (vars.j === null)
                return Object.assign(Object.assign({}, vars), { j: 1 });
            return vars;
        },
        /* 6: Line 7 */ (vars) => vars, // if
        /* 7: Line 8 */ (vars) => {
            const newSparseMatrix = JSON.parse(JSON.stringify(vars.sparseMatrix));
            newSparseMatrix[0].push(vars.i);
            return Object.assign(Object.assign({}, vars), { sparseMatrix: newSparseMatrix });
        },
        /* 8: Line 9 */ (vars) => {
            const newSparseMatrix = JSON.parse(JSON.stringify(vars.sparseMatrix));
            newSparseMatrix[1].push(vars.j);
            return Object.assign(Object.assign({}, vars), { sparseMatrix: newSparseMatrix });
        },
        /* 9: Line 10 */ (vars) => {
            const newSparseMatrix = JSON.parse(JSON.stringify(vars.sparseMatrix));
            const matrix = vars.matrix;
            const i = vars.i;
            const j = vars.j;
            newSparseMatrix[2].push(matrix[i - 1][j - 1]);
            return Object.assign(Object.assign({}, vars), { sparseMatrix: newSparseMatrix });
        },
        /* 10: Line 11 */ (vars) => vars, // endif
        /* 11: Line 12 */ (vars) => (Object.assign(Object.assign({}, vars), { j: vars.j + 1 })), // endfor (inner)
        /* 12: Line 13 */ (vars) => (Object.assign(Object.assign({}, vars), { i: vars.i + 1, j: null })), // endfor (outer)
        /* 13: Line 14 */ (vars) => vars, // return
    ],
    calculateNextLine(currentLine, vars) {
        const executedLine = currentLine; // 0-indexed
        const matrix = vars.matrix;
        const i = vars.i;
        const j = vars.j;
        switch (executedLine) {
            case 3: return 4; // Line 4 -> 5
            case 4: // for i
                if (i === null)
                    return 4; // for a first time
                return i <= matrix.length ? 5 : 13; // -> inner loop or return
            case 5: // for j
                if (j === null)
                    return 5; // for a first time
                return j <= matrix[0].length ? 6 : 12; // -> if or outer endfor
            case 6: // if
                return matrix[i - 1][j - 1] !== 0 ? 7 : 11; // -> block or inner endfor
            case 7: return 8; // -> Line 9
            case 8: return 9; // -> Line 10
            case 9: return 10; // -> Line 11
            case 10: return 11; // endif -> inner endfor
            case 11: return 5; // inner endfor -> inner loop check
            case 12: return 4; // outer endfor -> outer loop check
            default: return currentLine + 1;
        }
    },
};
// =================================================================================
// --- 【★ここから追加】問25: 条件付き確率計算のロジック ---
// =================================================================================
// 問題文の単語群と`freq`, `freqE`メソッドをシミュレートするヘルパーオブジェクト
const corpusData = {
    words: ["importance", "inflation", "information", "innovation"],
    freq: (str) => {
        let count = 0;
        for (const word of corpusData.words) {
            // 単純な非重複出現回数をカウント
            if (word.includes(str)) {
                count += (word.match(new RegExp(str, "g")) || []).length;
            }
        }
        return count;
    },
    freqE: (str) => {
        let count = 0;
        for (const word of corpusData.words) {
            if (word.endsWith(str)) {
                count++;
            }
        }
        return count;
    }
};
const conditionalProbabilityLogic = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => vars, // prob()
        /* 2: Line 3 */ (vars) => (Object.assign(Object.assign({}, vars), { s1: vars.c1 })), // s1 ← c1
        /* 3: Line 4 */ (vars) => (Object.assign(Object.assign({}, vars), { s2: vars.c2 })), // s2 ← c2
        /* 4: Line 5 */ (vars) => {
            const freq_s1_s2 = corpusData.freq(vars.s1 + vars.s2);
            return Object.assign(Object.assign({}, vars), { freq_s1_s2 });
        },
        /* 5: Line 6 */ (vars) => {
            const freq_s1 = corpusData.freq(vars.s1);
            const freqE_s1 = corpusData.freqE(vars.s1);
            const denominator = freq_s1 - freqE_s1;
            const result = denominator > 0 ? vars.freq_s1_s2 / denominator : 0;
            return Object.assign(Object.assign({}, vars), { freq_s1, freqE_s1, denominator, result });
        },
        /* 6: Line 7 */ (vars) => vars, // else
        /* 7: Line 8 */ (vars) => (Object.assign(Object.assign({}, vars), { result: 0 })), // return 0
        /* 8: Line 9 */ (vars) => vars, // endif
    ],
    calculateNextLine(currentLine, vars) {
        if (vars.c1 === null)
            return currentLine; // プリセット選択待ち
        const executedLine = currentLine;
        switch (executedLine) {
            case 2: return 3; // -> Line 4
            case 3: return 4; // -> Line 5
            case 4: // if
                return vars.freq_s1_s2 > 0 ? 5 : 7; // -> Line 6 or 8
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
// --- 【★ここから追加】問27: 素数探索のロジック ---
// =================================================================================
const primeNumberLogic = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => (Object.assign(Object.assign({}, vars), { pnList: null, i: null, j: null, divideFlag: null, sqrt_i: null })),
        /* 1: Line 2 */ (vars) => (Object.assign(Object.assign({}, vars), { pnList: [] })),
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => vars,
        /* 4: Line 5 */ (vars) => {
            if (vars.i === null)
                return Object.assign(Object.assign({}, vars), { i: 2 });
            return Object.assign(Object.assign({}, vars), { i: vars.i + 1 });
        },
        /* 5: Line 6 */ (vars) => (Object.assign(Object.assign({}, vars), { divideFlag: true })),
        /* 6: Line 7 */ (vars) => vars,
        /* 7: Line 8 */ (vars) => {
            const i = vars.i;
            const sqrt_i = Math.floor(Math.sqrt(i));
            if (vars.j === null || vars.j < 2)
                return Object.assign(Object.assign({}, vars), { j: 2, sqrt_i });
            return Object.assign(Object.assign({}, vars), { j: vars.j + 1, sqrt_i });
        },
        /* 8: Line 9 */ (vars) => vars,
        /* 9: Line 10 */ (vars) => (Object.assign(Object.assign({}, vars), { divideFlag: false })),
        /* 10: Line 11 */ (vars) => vars,
        /* 11: Line 12 */ (vars) => vars,
        /* 12: Line 13 */ (vars) => vars,
        /* 13: Line 14 */ (vars) => vars,
        /* 14: Line 15 */ (vars) => {
            const newPnList = [...vars.pnList];
            newPnList.push(vars.i);
            return Object.assign(Object.assign({}, vars), { pnList: newPnList });
        },
        /* 15: Line 16 */ (vars) => vars,
        /* 16: Line 17 */ (vars) => (Object.assign(Object.assign({}, vars), { j: null })),
        /* 17: Line 18 */ (vars) => vars,
    ],
    calculateNextLine(currentLine, vars) {
        // ★変更: maxNum を num に
        if (vars.num === null)
            return currentLine;
        const executedLine = currentLine;
        const i = vars.i;
        const j = vars.j;
        switch (executedLine) {
            case 1: return 4;
            case 4: // for i
                // ★変更: maxNum を num に
                return i <= vars.num ? 5 : 17;
            case 5: return 7;
            case 7: // for j
                return (j <= vars.sqrt_i) ? 8 : 13;
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
const callStackLogic = {
    // traceLogicはダミーとし、全ての処理をcalculateNextLineに集約する
    traceLogic: Array(12).fill((vars) => vars),
    calculateNextLine(currentLine, vars) {
        // --- Step 1: 初期化 ---
        // トレースの最初のステップで、コールスタックと出力を初期化
        if (!vars.initialized) {
            vars.output = [];
            // callStackに最初のフレームとしてproc2を積む
            vars.callStack = [{ func: 'proc2', pc: 0 }];
            vars.initialized = true;
            return 4; // proc2の定義行 (Line 5) へ移動
        }
        const stack = vars.callStack;
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
                        const callerFrame = stack[stack.length - 1];
                        if (callerFrame.func === 'proc2')
                            nextLine = 5;
                        if (callerFrame.func === 'proc1')
                            nextLine = 2;
                        break;
                }
                break;
        }
        return nextLine;
    },
};
// =================================================================================
// --- 【★ここから追加】問29: クイックソートのトレースロジック ---
// =================================================================================
const quicksortTraceLogic = {
    traceLogic: Array(30).fill((vars) => vars), // ダミーの配列
    calculateNextLine(currentLine, vars) {
        const stack = vars.callStack;
        // --- Step 1: 初期化 ---
        if (!vars.initialized) {
            vars.callStack = [{ first: 1, last: 5, pc: 0 }];
            vars.initialized = true;
            // 最初の実行なので、変数をリセット
            vars.pivot = null;
            vars.i = null;
            vars.j = null;
            vars.output = null;
            return 0; // proc1の定義(Line 1)へ移動
        }
        if (vars.initialized && vars.callStack.length === 0) {
            vars.callStack = [{ first: 1, last: 5, pc: 0 }];
            vars.initialized = true;
            // 最初の実行なので、変数をリセット
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
                vars.pivot = vars.data[Math.floor((frame.first + frame.last) / 2) - 1];
                frame.pc++;
                nextLine = 2;
                break;
            case 1: // Line 4: iの初期化
                vars.i = frame.first;
                frame.pc++;
                nextLine = 3;
                break;
            case 2: // Line 5: jの初期化
                vars.j = frame.last;
                frame.pc++;
                nextLine = 6; // while(true)へ
                break;
            case 3: // Line 8: while (data[i] < pivot)
                if (vars.data[vars.i - 1] < vars.pivot) {
                    vars.i = vars.i + 1;
                    nextLine = 7; // ループ継続
                }
                else {
                    frame.pc++;
                    nextLine = 10; // 次のwhileへ
                }
                break;
            case 4: // Line 11: while (pivot < data[j])
                if (vars.pivot < vars.data[vars.j - 1]) {
                    vars.j = vars.j - 1;
                    nextLine = 10; // ループ継続
                }
                else {
                    frame.pc++;
                    nextLine = 13; // if (i >= j)へ
                }
                break;
            case 5: // Line 14: if (i >= j)
                if (vars.i >= vars.j) {
                    frame.pc = 99; // ループを抜けるフラグ
                    nextLine = 19; // endwhileへ
                }
                else {
                    frame.pc++;
                    nextLine = 16; // swapへ
                }
                break;
            case 6: // Line 17: swap
                const new_data = [...vars.data];
                const temp = new_data[vars.i - 1];
                new_data[vars.i - 1] = new_data[vars.j - 1];
                new_data[vars.j - 1] = temp;
                vars.data = new_data;
                frame.pc++;
                nextLine = 17;
                break;
            case 7: // Line 18: i++
                vars.i = vars.i + 1;
                frame.pc++;
                nextLine = 18;
                break;
            case 8: // Line 19: j--
                vars.j = vars.j - 1;
                frame.pc = 3; // while(true)の先頭に戻る
                nextLine = 6;
                break;
            case 99: // Line 22: output
                vars.output = vars.data.join(' ');
                frame.pc = 100;
                nextLine = 23;
                break;
            case 100: // Line 24: if (first < i - 1)
                if (frame.first < vars.i - 1) {
                    frame.pc++;
                    stack.push({ first: frame.first, last: vars.i - 1, pc: 0 });
                    nextLine = 0; // 新しいsortの呼び出し
                }
                else {
                    frame.pc++;
                    nextLine = 26; // 次のifへ
                }
                break;
            case 101: // Line 27: if (j + 1 < last)
                if (vars.j + 1 < frame.last) {
                    frame.pc++;
                    stack.push({ first: vars.j + 1, last: frame.last, pc: 0 });
                    nextLine = 0; // 新しいsortの呼び出し
                }
                else {
                    frame.pc++;
                    nextLine = 28; // endifへ
                }
                break;
            default: // 関数の終わり
                stack.pop();
                // 呼び出し元に戻る
                if (stack.length === 0) {
                    nextLine = 99;
                }
                else {
                    // 最後に実行した行に戻ることで、次のpcから再開
                    const prevFrame = stack[stack.length - 1];
                    if (prevFrame.pc === 101)
                        nextLine = 23;
                    else
                        nextLine = 26;
                }
                break;
        }
        return nextLine;
    },
};
// =================================================================================
// --- 【★ここから追加】問31: コサイン類似度のロジック ---
// =================================================================================
const cosineSimilarityLogic = {
    traceLogic: Array(23).fill((vars) => vars), // ダミー配列
    calculateNextLine(currentLine, vars) {
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
        const pc = vars.pc;
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
                if (vars.i <= vars.vector1.length) {
                    vars.numerator += vars.vector1[vars.i - 1] * vars.vector2[vars.i - 1];
                    vars.i++;
                    return 6;
                }
                else {
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
                if (vars.i <= vars.vector1.length) {
                    vars.temp += Math.pow(vars.vector1[vars.i - 1], 2);
                    vars.i++;
                    return 10;
                }
                else {
                    vars.pc++;
                    return 12;
                }
            case 5: // Line 13: denominator(v1)計算
                vars.denominator = Math.sqrt(vars.temp);
                vars.pc++;
                return 14;
            case 6: // Line 15: denominator(v2)計算ループの準備
                vars.loop_target = 'denominator_v2_loop';
                vars.temp = 0;
                vars.i = 1;
                vars.pc++;
                return 15;
            case 7: // Line 16-18: denominator(v2)計算ループ
                if (vars.i <= vars.vector2.length) {
                    vars.temp += Math.pow(vars.vector2[vars.i - 1], 2);
                    vars.i++;
                    return 16;
                }
                else {
                    vars.pc++;
                    return 18;
                }
            case 8: // Line 19: denominator最終計算
                vars.denominator *= Math.sqrt(vars.temp);
                vars.pc++;
                return 20;
            case 9: // Line 21: similarity計算
                if (vars.denominator !== 0) {
                    vars.similarity = vars.numerator / vars.denominator;
                }
                else {
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
// --- 【★ここから追加】問33: 3つの数の最大値のロジック ---
// =================================================================================
const maxOfThreeLogic = {
    traceLogic: [
        /* 0: Line 1: maximum def */ (vars) => (Object.assign(Object.assign({}, vars), { result: null })),
        /* 1: Line 2: if (...) */ (vars) => vars,
        /* 2: Line 3: return x */ (vars) => (Object.assign(Object.assign({}, vars), { result: vars.x })),
        /* 3: Line 4: elseif (y > z) */ (vars) => vars,
        /* 4: Line 5: return y */ (vars) => (Object.assign(Object.assign({}, vars), { result: vars.y })),
        /* 5: Line 6: else */ (vars) => vars,
        /* 6: Line 7: return z */ (vars) => (Object.assign(Object.assign({}, vars), { result: vars.z })),
        /* 7: Line 8: endif */ (vars) => vars,
    ],
    calculateNextLine(currentLine, vars) {
        // プリセットが選択されるまで待機
        if (vars.x === null)
            return currentLine;
        const x = vars.x;
        const y = vars.y;
        const z = vars.z;
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
// --- 【★ここから追加】問34: 2進数から10進数への変換ロジック ---
// =================================================================================
const binaryToDecimalLogic = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => (Object.assign(Object.assign({}, vars), { i: null, length: 0, result: 0 })),
        /* 2: Line 3 */ (vars) => (Object.assign(Object.assign({}, vars), { length: vars.binary.length })),
        /* 3: Line 4 */ (vars) => {
            // iの更新。初回は1、それ以降はインクリメント
            const newI = vars.i === null ? 1 : vars.i + 1;
            return Object.assign(Object.assign({}, vars), { i: newI });
        },
        /* 4: Line 5 */ (vars) => {
            const binaryStr = vars.binary;
            const i = vars.i;
            // 1-basedのiを0-basedのインデックスに変換
            const digit = parseInt(binaryStr.charAt(i - 1));
            const newResult = vars.result * 2 + digit;
            return Object.assign(Object.assign({}, vars), { result: newResult });
        },
        /* 5: Line 6 */ (vars) => vars, // endfor
        /* 6: Line 7 */ (vars) => vars, // return
    ],
    calculateNextLine(currentLine, vars) {
        // プリセットが選択されるまで待機
        if (vars.binary === null)
            return currentLine;
        switch (currentLine) {
            case 1: return 2; // Line 2 -> Line 3
            case 2: return 3; // Line 3 -> Line 4 (for)
            // forループのカウンタ更新と条件判定
            case 3:
                return vars.i + 1 <= vars.length ? 4 : 6; // -> Line 5 or Line 7
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
// --- 【★ここから追加】問35: 辺リストから隣接行列への変換ロジック ---
// =================================================================================
const edgesToMatrixLogic = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => {
            const edgeList = vars.edgeList;
            return Object.assign(Object.assign({}, vars), { edgeList, nodeNum: edgeList ? edgeList.length : 0, adjMatrix: null, i: null, u: null, v: null });
        },
        /* 1: Line 2 */ (vars) => {
            const nodeNum = vars.nodeNum;
            // nodeNum x nodeNum の2次元配列を0で初期化
            const newMatrix = Array.from({ length: nodeNum }, () => Array(nodeNum).fill(0));
            return Object.assign(Object.assign({}, vars), { adjMatrix: newMatrix, i: null, u: null, v: null });
        },
        /* 2: Line 3 */ (vars) => vars,
        /* 3: Line 4 */ (vars) => (Object.assign(Object.assign({}, vars), { i: (vars.i === null) ? 1 : vars.i + 1 })),
        /* 4: Line 5 */ (vars) => {
            const i = vars.i;
            const edgeList = vars.edgeList;
            if (i > edgeList.length)
                return vars; // ループ終了後の不正なアクセスを防止
            const edge = edgeList[i - 1];
            return Object.assign(Object.assign({}, vars), { u: edge[0] });
        },
        /* 5: Line 6 */ (vars) => {
            const i = vars.i;
            const edgeList = vars.edgeList;
            if (i > edgeList.length)
                return vars;
            const edge = edgeList[i - 1];
            return Object.assign(Object.assign({}, vars), { v: edge[1] });
        },
        /* 6: Line 7 */ (vars) => {
            const u = vars.u;
            const v = vars.v;
            const newMatrix = vars.adjMatrix.map(row => [...row]); // ディープコピー
            // 1-basedの頂点番号を0-basedのインデックスに変換
            newMatrix[u - 1][v - 1] = 1;
            newMatrix[v - 1][u - 1] = 1;
            return Object.assign(Object.assign({}, vars), { adjMatrix: newMatrix });
        },
        /* 7: Line 8 */ (vars) => vars, // endfor
        /* 8: Line 9 */ (vars) => vars, // return
    ],
    calculateNextLine(currentLine, vars) {
        if (vars.edgeList === null)
            return currentLine;
        switch (currentLine) {
            case 1: return 2;
            case 2: return 3;
            case 3: // for ループの条件判定
                return vars.i <= vars.edgeList.length ? 4 : 8;
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
// --- 【★ここから追加】問36: マージアルゴリズムのロジック ---
// =================================================================================
const mergeAlgorithmLogic = {
    traceLogic: [
        /* 0: Line 1 */ (vars) => vars,
        /* 1: Line 2 */ (vars) => (Object.assign(Object.assign({}, vars), { n1: vars.data1.length })),
        /* 2: Line 3 */ (vars) => (Object.assign(Object.assign({}, vars), { n2: vars.data2.length })),
        /* 3: Line 4 */ (vars) => (Object.assign(Object.assign({}, vars), { work: new Array(vars.n1 + vars.n2).fill(null) })),
        /* 4: Line 5 */ (vars) => (Object.assign(Object.assign({}, vars), { i: 1 })),
        /* 5: Line 6 */ (vars) => (Object.assign(Object.assign({}, vars), { j: 1 })),
        /* 6: Line 7 */ (vars) => (Object.assign(Object.assign({}, vars), { k: 1, alpha_executed: 0 })),
        /* 7: Line 8 */ (vars) => vars, // blank
        /* 8: Line 9 */ (vars) => vars, // while
        /* 9: Line 10 */ (vars) => vars, // if
        /* 10: Line 11 */ (vars) => {
            const newWork = [...vars.work];
            newWork[vars.k - 1] = vars.data1[vars.i - 1];
            return Object.assign(Object.assign({}, vars), { work: newWork });
        },
        /* 11: Line 12 */ (vars) => (Object.assign(Object.assign({}, vars), { i: vars.i + 1 })),
        /* 12: Line 13 */ (vars) => vars, // else
        /* 13: Line 14 */ (vars) => {
            const newWork = [...vars.work];
            newWork[vars.k - 1] = vars.data2[vars.j - 1];
            return Object.assign(Object.assign({}, vars), { work: newWork });
        },
        /* 14: Line 15 */ (vars) => (Object.assign(Object.assign({}, vars), { j: vars.j + 1 })),
        /* 15: Line 16 */ (vars) => vars, // endif
        /* 16: Line 17 */ (vars) => (Object.assign(Object.assign({}, vars), { k: vars.k + 1 })),
        /* 17: Line 18 */ (vars) => vars, // endwhile
        /* 18: Line 19 */ (vars) => vars, // blank
        /* 19: Line 20 */ (vars) => vars, // while
        /* 20: Line 21 */ (vars) => {
            const newWork = [...vars.work];
            newWork[vars.k - 1] = vars.data1[vars.i - 1];
            return Object.assign(Object.assign({}, vars), { work: newWork });
        },
        /* 21: Line 22 */ (vars) => (Object.assign(Object.assign({}, vars), { i: vars.i + 1 })),
        /* 22: Line 23 */ (vars) => (Object.assign(Object.assign({}, vars), { k: vars.k + 1 })),
        /* 23: Line 24 */ (vars) => vars, // endwhile
        /* 24: Line 25 */ (vars) => vars, // blank
        /* 25: Line 26 */ (vars) => vars, // while
        /* 26: Line 27 */ (vars) => {
            const newWork = [...vars.work];
            newWork[vars.k - 1] = vars.data2[vars.j - 1];
            return Object.assign(Object.assign({}, vars), { work: newWork, alpha_executed: vars.alpha_executed + 1 });
        },
        /* 27: Line 28 */ (vars) => (Object.assign(Object.assign({}, vars), { j: vars.j + 1 })),
        /* 28: Line 29 */ (vars) => (Object.assign(Object.assign({}, vars), { k: vars.k + 1 })),
        /* 29: Line 30 */ (vars) => vars, // endwhile
        /* 30: Line 31 */ (vars) => vars, // blank
        /* 31: Line 32 */ (vars) => vars, // return
    ],
    calculateNextLine(currentLine, vars) {
        const { i, j, n1, n2, data1, data2 } = vars;
        switch (currentLine) {
            case 8: // while ((i <= n1) and (j <= n2))
                return (i <= n1 && j <= n2) ? 9 : 19;
            case 9: // if (data1[i] <= data2[j])
                return data1[i - 1] <= data2[j - 1] ? 10 : 13;
            case 10:
            case 13: return currentLine + 1;
            case 11:
            case 14: return 16;
            case 16: return 8; // end of first while loop body
            case 19: // while (i <= n1)
                return i <= n1 ? 20 : 25;
            case 20:
            case 21:
            case 22: return currentLine + 1;
            case 23: return 19; // end of second while loop body
            case 25: // while (j <= n2)
                return j <= n2 ? 26 : 31;
            case 26:
            case 27:
            case 28: return currentLine + 1;
            case 29: return 25; // end of third while loop body
            case 31: return 99; // return
            default: return currentLine + 1;
        }
    },
};
// =================================================================================
// --- 【★ここから追加】問37: 商品関連度分析のロジック ---
// =================================================================================
const associationAnalysisLogic = {
    traceLogic: Array(42).fill((vars) => vars), // ダミー配列
    calculateNextLine(currentLine, vars) {
        // --- 初期化 ---
        if (!vars.initialized) {
            vars.pc = 'start';
            vars.initialized = true;
            return 3; // putRelatedItemの定義へ
        }
        const pc = vars.pc;
        const orders = vars.orders;
        const item = vars.item;
        let otherItems = vars.otherItems;
        // --- 実行ロジック ---
        switch (pc) {
            case 'start': // Line 5, 7: allItems, otherItems の準備
                const all = [...new Set(orders.flat())].sort();
                vars.allItems = all;
                vars.otherItems = all.filter(it => it !== item);
                otherItems = vars.otherItems;
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
                if (vars.order_idx < orders.length) {
                    vars.pc = 'check_order_contains_item';
                    return 15;
                }
                else {
                    vars.i = 1;
                    vars.pc = 'final_loop_check';
                    return 31;
                }
            case 'check_order_contains_item': // Line 16: if (order contains item)
                const currentOrder = orders[vars.order_idx];
                if (currentOrder.includes(item)) {
                    vars.itemCount++;
                    vars.i = 1; // 内側ループの初期化
                    vars.pc = 'inner_loop_M_check';
                    return 16;
                }
                else {
                    vars.i = 1; // 内側ループの初期化
                    vars.pc = 'inner_loop_K_check';
                    return 23;
                }
            case 'inner_loop_M_check': // Line 18: for (i in otherItems)
                if (vars.i <= otherItems.length) {
                    const currentOrderM = orders[vars.order_idx];
                    if (currentOrderM.includes(otherItems[vars.i - 1])) {
                        vars.arrayM[vars.i - 1]++;
                    }
                    vars.i++;
                    return 18;
                }
                else {
                    vars.order_idx++;
                    vars.pc = 'outer_loop_check';
                    return 29;
                }
            case 'inner_loop_K_check': // Line 24: for (i in otherItems)
                if (vars.i <= otherItems.length) {
                    const currentOrderK = orders[vars.order_idx];
                    if (currentOrderK.includes(otherItems[vars.i - 1])) {
                        vars.arrayK[vars.i - 1]++;
                    }
                    vars.i++;
                    return 24;
                }
                else {
                    vars.order_idx++;
                    vars.pc = 'outer_loop_check';
                    return 29;
                }
            case 'final_loop_check': // Line 32: for (i in otherItems)
                if (vars.i <= otherItems.length) {
                    const Mxy = vars.arrayM[vars.i - 1];
                    const Kx = vars.itemCount;
                    const Ky = vars.arrayK[vars.i - 1] + Mxy; // K_y = K_y(b) + M_xy(a)
                    const totalOrders = orders.length;
                    if (Kx > 0 && Ky > 0) {
                        vars.valueL = (Mxy * totalOrders) / (Kx * Ky);
                    }
                    else {
                        vars.valueL = 0;
                    }
                    vars.pc = 'check_maxL';
                    return 32;
                }
                else {
                    vars.pc = 'end_of_program';
                    return 40;
                }
            case 'check_maxL': // Line 35: if (valueL > maxL)
                if (vars.valueL > vars.maxL) {
                    vars.maxL = vars.valueL;
                    vars.relatedItem = otherItems[vars.i - 1];
                    vars.pc = 'final_loop_increment';
                    return 35;
                }
                else {
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
// logicTypeをキーとして、対応するロジックを返すマップ
exports.problemLogicsMap = {
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
    'BIN_SORT': binSortLogic,
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
};
