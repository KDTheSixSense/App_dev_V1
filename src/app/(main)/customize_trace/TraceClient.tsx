'use client';

import React, { useState, useCallback, useEffect } from 'react'; //  useEffect を追加
// AIコード生成をサーバー側で安全に行うための関数をインポートします
import { generateTraceCodeFromAI } from '@/lib/actions/traceActions';

// --- サンプルコード ---
const sampleCode = `整数型: counter
counter ← 3

while (counter > 0)
  出力する counter
  counter ← counter - 1
endwhile

出力する "ループが終了しました"
`;

// --- 初期変数のサンプル ---
const sampleInitialVars = `{
  "counter": 3
}`;

// --- 型定義 ---
interface ForLoopInfo {
  type: 'for';
  loopVar: string;
  startVal: number; //  開始値も保持
  endVal: number;
  step: number;
  startLine: number; // for文自体の行インデックス
  endLine: number;   // endforの行インデックス
}

interface WhileLoopInfo {
    type: 'while';
    condition: string; //  条件式を保持
    startLine: number; // while文自体の行インデックス
    endLine: number;   // endwhileの行インデックス
}

//  Ifブロックの情報もスタックで管理（else/endifへのジャンプのため）
interface IfBlockInfo {
    type: 'if';
    startLine: number; // if文自体の行インデックス
    elseLine: number;  // 対応するelseの行インデックス (-1なら存在しない)
    endLine: number;   // 対応するendifの行インデックス
}

type ControlFlowInfo = ForLoopInfo | WhileLoopInfo | IfBlockInfo;


/**
 * トレース機能のUIとロジック全体を管理するクライアントコンポーネント
 */
const TraceClient = () => {
  // --- 状態管理 ---
  const [code, setCode] = useState(sampleCode);
  const [initialVarsString, setInitialVarsString] = useState(sampleInitialVars);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [programLines, setProgramLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(-1); // -1: 未開始, N: N行目を次に実行
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTraceStarted, setIsTraceStarted] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('カウンターが0になるまでデクリメントする');
  const [isGenerating, setIsGenerating] = useState(false);
  const [controlFlowStack, setControlFlowStack] = useState<ControlFlowInfo[]>([]); //  制御フロー用のスタック


  // --- ヘルパー関数 ---

  // evaluateExpression を修正
  const evaluateExpression = (expression: string, currentVars: Record<string, any>): any => {
    expression = expression.trim();

    expression = expression.replace(/[０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });

    // 1. 数値リテラル
    if (!isNaN(Number(expression))) return Number(expression);

    // 2. 文字列リテラル
    if ((expression.startsWith('"') && expression.endsWith('"')) || (expression.startsWith("'") && expression.endsWith("'"))) {
        return expression.slice(1, -1);
    }

    // 3. 配列要素アクセス (例: arr1[j], arr1[j+1])
    const arrayAccessMatch = expression.match(/^([a-zA-Z_]\w*)\s*\[\s*(.+)\s*\]$/);
    if (arrayAccessMatch) {
        const arrayName = arrayAccessMatch[1];
        const indexExpr = arrayAccessMatch[2];
        if (currentVars.hasOwnProperty(arrayName)) {
            const arr = currentVars[arrayName];
            if (!Array.isArray(arr)) {
                throw new Error(`変数 "${arrayName}" は配列ではありません。`);
            }
            // インデックス部分も式として評価する
            const index = evaluateExpression(indexExpr, currentVars);
            if (typeof index !== 'number' || !Number.isInteger(index)) {
                 throw new Error(`配列 "${arrayName}" のインデックス "${indexExpr}" が整数に評価されません。`);
            }
            if (index < 0 || index >= arr.length) {
                throw new Error(`配列 "${arrayName}" のインデックス ${index} が範囲外です (0 から ${arr.length - 1} まで)。`);
            }
            return arr[index];
        } else {
            throw new Error(`配列変数 "${arrayName}" が見つかりません。`);
        }
    }

    // 4. 単純な変数
    if (currentVars.hasOwnProperty(expression)) return currentVars[expression];

    // 5. 簡単な算術演算 (括弧や優先順位は未対応)
    const operators = ['+', '-', '*', '/'];
    for (let i = operators.length - 1; i >= 0; i--) {
        const op = operators[i];
        const lastOpIndex = expression.lastIndexOf(op);
        if (lastOpIndex > 0 && lastOpIndex < expression.length - 1) { // 演算子が先頭や末尾でないことを確認
            const lhsStr = expression.substring(0, lastOpIndex);
            const rhsStr = expression.substring(lastOpIndex + 1);
            try {
                const lhs = evaluateExpression(lhsStr, currentVars);
                const rhs = evaluateExpression(rhsStr, currentVars);
                if (typeof lhs === 'number' && typeof rhs === 'number') {
                    switch(op) {
                        case '+': return lhs + rhs;
                        case '-': return lhs - rhs;
                        case '*': return lhs * rhs;
                        case '/':
                            if (rhs === 0) throw new Error("ゼロ除算です。");
                            return Math.floor(lhs / rhs); // 整数除算
                    }
                } else if (op === '+') {
                    return String(lhs) + String(rhs);
                } else {
                    throw new Error(`数値以外の値 (${typeof lhs}, ${typeof rhs}) に演算子'${op}'は使えません。`);
                }
            } catch (e: any) {
                throw new Error(`式 "${expression}" の評価中にエラー: ${e.message}`);
            }
        }
    }

    throw new Error(`式 "${expression}" (変数、リテラル、または簡単な演算) を評価できません。`);
  };

  // 条件式を評価する関数 (既存のものを流用、エラーハンドリングを少し追加)
  const evaluateCondition = (condition: string, currentVars: Record<string, any>): boolean => {
      condition = condition.trim();
      const operators = ['>=', '<=', '>', '<', '==', '!=']; // ==, != を追加
      for (const op of operators) {
          const parts = condition.split(op);
          if (parts.length === 2) {
              try {
                  const lhs = evaluateExpression(parts[0], currentVars);
                  const rhs = evaluateExpression(parts[1], currentVars);
                  switch(op) {
                      case '>': return lhs > rhs;
                      case '<': return lhs < rhs;
                      case '>=': return lhs >= rhs;
                      case '<=': return lhs <= rhs;
                      case '==': return lhs == rhs; // 値の比較
                      case '!=': return lhs != rhs; // 値の比較
                  }
              } catch (e: any) {
                    throw new Error(`条件式 "${condition}" の評価中にエラー: ${e.message}`);
              }
          }
      }
      // 単一の変数やリテラルも評価できるようにする (例: while (trueFlag) )
      try {
            const result = evaluateExpression(condition, currentVars);
            // JavaScriptの truthy/falsy に従う
            return Boolean(result);
      } catch (e) {
            // ignore, try next
      }

      throw new Error(`条件式 "${condition}" を評価できません。比較演算子(>, <, >=, <=, ==, !=)が必要です。`);
  };

  // 対応するブロック終端('endfor', 'endwhile', 'endif', 'else')を見つける関数
  // findBlockEnd を useCallback の外に出して定義
  const findBlockEnd = useCallback((startLine: number, blockStartKeyword: string, blockEndKeyword: string, alternateEndKeyword?: string): number => {
    let depth = 1;
    for (let i = startLine + 1; i < programLines.length; i++) {
        const line = programLines[i].trim();
        //  正規表現ではなく startsWith で判定
        if (line.startsWith(blockStartKeyword) && line.includes('(')) { // ネスト開始をより確実に判定
            depth++;
        } else if (line.startsWith(blockEndKeyword)) {
            depth--;
            if (depth === 0) {
                return i; // 対応する終端を発見
            }
        } else if (alternateEndKeyword && depth === 1 && line.startsWith(alternateEndKeyword)) {
             // if に対する else を発見 (ネストの深さが1の場合のみ)
             return i;
        }
    }
    return -1; // 見つからなかった
  }, [programLines]); //  依存配列に programLines を追加

  // --- トレース実行エンジン ( 大幅に修正) ---
  const handleNextStep = useCallback(() => {
    if (!isTraceStarted || currentLine < 0 || currentLine >= programLines.length) {
        if (currentLine >= programLines.length) {
             setError('トレースが終了しました。');
             setIsTraceStarted(false);
        }
        return;
    }

    const lineIndex = currentLine; // 現在実行する行のインデックス
    const line = programLines[lineIndex].trim();
    let nextLine = lineIndex + 1; // デフォルトは次の行
    let tempVariables = { ...variables };
    let tempOutput = [...output];
    let tempControlFlowStack = [...controlFlowStack];
    let jumped = false; // 分岐やループでジャンプしたか

    try {
      setError(null);

      // --- 現在行(lineIndex)の実行 ---
      const declarationMatch = line.match(/^(整数型|文字列型|配列型):\s*(.+)/);
      const assignmentMatch = line.match(/^(.+?)\s*←\s*(.+)/);
      const outputMatch = line.match(/^出力する\s+(.+)/);
      const specificOutputMatch = line.match(/^(\w+)の値\s+と\s+(\w+)の値\s+をこの順にコンマ区切りで出力する$/);
      const ifMatch = line.match(/^if\s*\((.+)\)/);
      const elseMatch = line.match(/^else$/);
      const endifMatch = line.match(/^endif$/);
      const whileMatch = line.match(/^while\s*\((.+)\)/);
      const endwhileMatch = line.match(/^endwhile$/);
       //  forループの正規表現を修正 (開始値、終了値、ステップを捉える)
      const forMatch = line.match(/^for\s*\((.+)\s*を\s*(.+)\s*から\s*(.+)\s*まで\s*(?:(\d+)\s*ずつ増やす)?\)/); // ステップはオプショナル
      const endforMatch = line.match(/^endfor$/);
      const commentMatch = line.match(/^\s*\/\//); // コメント行

      if (commentMatch || line === '') {
        // コメント行や空行は何もしない
        jumped = false; // 次の行へ
      } else if (declarationMatch) {
          const varType = declarationMatch[1];
        const declarationPart = declarationMatch[2];
        const declaredItems = declarationPart.split(',').map(item => item.trim());

        declaredItems.forEach(item => {
            // "x ← 1" のような代入部分を分離
            const assignmentParts = item.split('←');
            let varName = assignmentParts[0].trim(); // 変数名部分を取得
            let isArray = varType.startsWith('配列型');
            let initialValue = null; // デフォルト初期値

            // 配列サイズ指定 (例: arr[5]) があっても変数名だけを取得
            if (isArray) {
                 const nameMatch = varName.match(/^([a-zA-Z_]\w*)/);
                 if (nameMatch) varName = nameMatch[1];
                 initialValue = []; // 配列は空で初期化
            }

            // 宣言行で代入が行われている場合 (例: "整数型: x ← 1")
            if (assignmentParts.length > 1) {
                const valueExpr = assignmentParts[1].trim();
                // 宣言行での初期値を評価して設定
                initialValue = evaluateExpression(valueExpr, tempVariables);
            }

            // 変数テーブル (tempVariables) を更新
            // - まだ存在しない変数なら初期化
            // - または、宣言行で値が代入されていればその値で更新
            // - ただし、配列が既に存在する場合に null で上書きしないようにする
            if (!(varName in tempVariables) || assignmentParts.length > 1) {
                 if(!(isArray && assignmentParts.length == 1 && Array.isArray(tempVariables[varName]))) {
                    tempVariables[varName] = initialValue;
                 }
            }
        });
        // 宣言行自体の実行はこれで完了。次の行へ。
        jumped = false;
      } else if (assignmentMatch) {
          const target = assignmentMatch[1].trim();
          const expression = assignmentMatch[2].trim();
          const value = evaluateExpression(expression, tempVariables);

          // 代入ターゲットが配列要素か確認
          const arrayTargetMatch = target.match(/^([a-zA-Z_]\w*)\s*\[\s*(.+)\s*\]$/);
          if (arrayTargetMatch) {
              const arrayName = arrayTargetMatch[1];
              const indexExpr = arrayTargetMatch[2];
              if (!tempVariables.hasOwnProperty(arrayName) || !Array.isArray(tempVariables[arrayName])) {
                  throw new Error(`代入先 "${arrayName}" は配列ではありません。`);
              }
              const index = evaluateExpression(indexExpr, tempVariables);
              if (typeof index !== 'number' || !Number.isInteger(index)) {
                  throw new Error(`配列 "${arrayName}" のインデックス "${indexExpr}" が整数に評価されません。`);
              }
              // 配列の範囲チェック（必要に応じて拡張も検討）
              if (index < 0 ) { // index >= tempVariables[arrayName].length のチェックは緩める（代入による拡張を許す場合）
                 throw new Error(`配列 "${arrayName}" のインデックス ${index} が範囲外です。`);
              }
               // 配列をコピーして変更 (Immutability)
              const newArray = [...tempVariables[arrayName]];
              newArray[index] = value;
              tempVariables[arrayName] = newArray;

          } else {
              // 単純な変数への代入
              tempVariables[target] = value;
          }
          jumped = false;
      } else if (specificOutputMatch) {
          const varName1 = specificOutputMatch[1]; // 例: "y"
          const varName2 = specificOutputMatch[2]; // 例: "z"
          // 変数が存在するかチェック
          if (!(varName1 in tempVariables)) throw new Error(`変数 "${varName1}" が見つかりません。`);
          if (!(varName2 in tempVariables)) throw new Error(`変数 "${varName2}" が見つかりません。`);
          // カンマ区切りで出力
          const outputValue = `${tempVariables[varName1]},${tempVariables[varName2]}`;
          tempOutput.push(outputValue);
          jumped = false; // 次の行へ
      } else if (outputMatch) {
          const expression = outputMatch[1].trim();
          const value = evaluateExpression(expression, tempVariables);
          tempOutput.push(String(value));
          jumped = false;
      } else if (ifMatch) {
          const condition = ifMatch[1];
          const elseLine = findBlockEnd(lineIndex, 'if', 'endif', 'else');
          const endLine = findBlockEnd(lineIndex, 'if', 'endif');
          if (endLine === -1) throw new Error(`行 ${lineIndex + 1}: ifに対応するendifが見つかりません。`);
          //  elseLine が endif だった場合（elseがない場合）は -1 とする
          const actualElseLine = (elseLine !== -1 && programLines[elseLine].trim() === 'else') ? elseLine : -1;

          tempControlFlowStack.push({ type: 'if', startLine: lineIndex, elseLine: actualElseLine, endLine: endLine });

          if (evaluateCondition(condition, tempVariables)) {
              // 条件が真 -> 次の行へ
              nextLine = lineIndex + 1;
              jumped = true; // ジャンプ扱いにして endif での自動インクリメントを防ぐ
          } else {
              // 条件が偽 -> else または endif の次の行へジャンプ
              nextLine = actualElseLine !== -1 ? actualElseLine + 1 : endLine + 1;
              jumped = true;
          }
      } else if (elseMatch) {
          const currentIf = tempControlFlowStack.length > 0 ? tempControlFlowStack[tempControlFlowStack.length - 1] : null;
          if (currentIf?.type === 'if' && currentIf.elseLine === lineIndex) {
              // ifブロックの実行後、elseに来たらendifの次へジャンプ
              nextLine = currentIf.endLine + 1;
              jumped = true;
          } else {
               throw new Error(`行 ${lineIndex + 1}: 対応するifがないelseです。`);
          }
      } else if (endifMatch) {
          const currentIf = tempControlFlowStack.length > 0 ? tempControlFlowStack[tempControlFlowStack.length - 1] : null;
          if (currentIf?.type === 'if' && currentIf.endLine === lineIndex) {
              // if または else ブロックの終端
              tempControlFlowStack.pop(); // ifブロック情報をスタックから除去
              nextLine = lineIndex + 1; // endifの次の行へ
              jumped = true;
          } else {
             // 'if'ブロックの外にある 'endif' またはネストが不正
             // throw new Error(`行 ${lineIndex + 1}: 対応するifがないendif、またはネストが不正です。`);
             //  エラーにせず、単に次に進む（ループ内のifなど、スタック管理外の場合があるため）
             jumped = false;
          }
      } else if (whileMatch) {
          const condition = whileMatch[1];
          const endLine = findBlockEnd(lineIndex, 'while', 'endwhile');
          if (endLine === -1) throw new Error(`行 ${lineIndex + 1}: whileに対応するendwhileが見つかりません。`);

          // スタックに追加（まだなければ）
          const currentWhile = tempControlFlowStack.length > 0 ? tempControlFlowStack[tempControlFlowStack.length - 1] : null;
          if (!currentWhile || currentWhile.type !== 'while' || currentWhile.startLine !== lineIndex) {
            tempControlFlowStack.push({ type: 'while', condition: condition, startLine: lineIndex, endLine: endLine });
          }

          if (evaluateCondition(condition, tempVariables)) {
              // 条件が真 -> ループ本体の最初の行へ
              nextLine = lineIndex + 1;
          } else {
              // 条件が偽 -> endwhile の次の行へジャンプ
              tempControlFlowStack.pop(); // ループ情報をスタックから除去
              nextLine = endLine + 1;
          }
          jumped = true;
      } else if (endwhileMatch) {
          const currentWhile = tempControlFlowStack.length > 0 ? tempControlFlowStack[tempControlFlowStack.length - 1] : null;
          if (currentWhile?.type === 'while' && currentWhile.endLine === lineIndex) {
              // ループの終端 -> while文の先頭に戻って条件を再評価
              nextLine = currentWhile.startLine;
              jumped = true;
          } else {
              throw new Error(`行 ${lineIndex + 1}: 対応するwhileがないendwhile、またはネストが不正です。`);
          }
      } else if (forMatch) {
            const loopVar = forMatch[1].trim();
            const startExpr = forMatch[2].trim();
            const endExpr = forMatch[3].trim();
            const step = forMatch[4] ? parseInt(forMatch[4], 10) : 1; // ステップ (デフォルト1)
            const endLine = findBlockEnd(lineIndex, 'for', 'endfor');
            if (endLine === -1) throw new Error(`行 ${lineIndex + 1}: forに対応するendforが見つかりません。`);

            const currentFor = tempControlFlowStack.length > 0 ? tempControlFlowStack[tempControlFlowStack.length - 1] : null;

            if (currentFor?.type === 'for' && currentFor.startLine === lineIndex) {
                // ループ継続判定 (endforから戻ってきた場合)
                if (tempVariables[loopVar] <= currentFor.endVal) {
                    nextLine = lineIndex + 1; // ループ本体へ
                } else {
                    tempControlFlowStack.pop(); // ループ終了
                    nextLine = endLine + 1;     // endforの次へ
                }
            } else {
                // 新規ループ開始
                const startVal = evaluateExpression(startExpr, tempVariables);
                const endVal = evaluateExpression(endExpr, tempVariables);
                tempVariables[loopVar] = startVal; // ループ変数初期化
                if (startVal <= endVal) {
                    tempControlFlowStack.push({ type: 'for', loopVar, startVal, endVal, step, startLine: lineIndex, endLine });
                    nextLine = lineIndex + 1; // ループ本体へ
                } else {
                    nextLine = endLine + 1; // ループ実行せず終了
                }
            }
            jumped = true;
      } else if (endforMatch) {
            const currentFor = tempControlFlowStack.length > 0 ? tempControlFlowStack[tempControlFlowStack.length - 1] : null;
            if (currentFor?.type === 'for' && currentFor.endLine === lineIndex) {
                // ループ変数をインクリメント
                tempVariables[currentFor.loopVar] += currentFor.step;
                nextLine = currentFor.startLine; // for文の先頭に戻って条件を再評価
                jumped = true;
            } else {
                throw new Error(`行 ${lineIndex + 1}: 対応するforがないendfor、またはネストが不正です。`);
            }
      } else {
          // 不明な命令
          throw new Error(`行 ${lineIndex + 1}: 不明な命令です: "${line}"`);
      }

      // 状態を更新
      setVariables(tempVariables);
      setOutput(tempOutput);
      setControlFlowStack(tempControlFlowStack);

      //  nextLineがプログラムの範囲外になったらトレース終了
      if (nextLine >= programLines.length) {
          setError('トレースが正常に終了しました。');
          setIsTraceStarted(false);
          setCurrentLine(nextLine); //  最後の行のハイライトのため >= length でもセット
      } else {
          setCurrentLine(nextLine); // 次に実行する行を設定
      }

    } catch (e: any) {
        setError(`エラー (行 ${lineIndex + 1}): ${e.message}`);
        setIsTraceStarted(false);
    }
  }, [isTraceStarted, currentLine, programLines, variables, controlFlowStack, findBlockEnd]); //  findBlockEnd を依存配列に追加

  // --- UIイベントハンドラ ---
  const handleStartTrace = () => {
    try {
      setError(null);
      const parsedVars = initialVarsString.trim() ? JSON.parse(initialVarsString) : {};

      // AIが生成したコード内の配列変数名を抽出 (例: arr1[5] -> arr1)
      const arrayVarNames = (code.match(/^(?:整数型|文字列型|配列型(?:\s*\[\s*\d+\s*\])?):\s*(.+)/gm) || [])
          .flatMap(line => line.split(':')[1].split(','))
          .map(v => v.trim().replace(/\[\d+\]$/, '')) // サイズ指定を除去
          .filter((v, i, self) => self.indexOf(v) === i); // 重複除去

      // JSONに存在しない配列変数を空配列で初期化（またはエラーにする）
      arrayVarNames.forEach(name => {
         if (code.includes(`配列型`) && code.includes(name) && (!parsedVars.hasOwnProperty(name) || !Array.isArray(parsedVars[name]))) {
            console.warn(`初期変数JSONに配列 "${name}" が見つからないため、空配列 [] で初期化します。`);
            parsedVars[name] = []; // またはエラーを出す: throw new Error(`初期変数JSONに配列 "${name}" が定義されていません。`)
         }
      });
      setVariables(parsedVars);
      const lines = code.split('\n');
      setProgramLines(lines);
      //  最初の空でない行 or コメントでない行を探す
      let firstExecutableLine = 0;
      while (firstExecutableLine < lines.length && (lines[firstExecutableLine].trim() === '' || lines[firstExecutableLine].trim().startsWith('//'))) {
        firstExecutableLine++;
      }

      setCurrentLine(firstExecutableLine); // 最初の実行可能行を設定
      setOutput([]);
      setControlFlowStack([]); //  スタックをリセット
      setIsTraceStarted(true);
      } catch (e) {
      // エラーハンドリングを修正
      if (e instanceof SyntaxError) {
         setError(`初期変数のJSON形式が正しくありません: ${e.message}。コメントが含まれていないか、括弧やカンマが正しいか確認してください。`);
      } else {
         // 配列初期化のエラーなどもここでキャッチ
         setError(`初期変数の処理中にエラーが発生しました: ${e instanceof Error ? e.message : String(e)}`);
         console.error("Error parsing initial variables:", e); // 詳細をコンソールに出力
      }
      setIsTraceStarted(false);
    }
  };

  const handleReset = () => {
    setIsTraceStarted(false);
    setCurrentLine(-1);
    setProgramLines([]);
    setVariables({});
    setOutput([]);
    setError(null);
    setControlFlowStack([]); // スタックをリセット
    // オプション: コードと初期変数もリセットする場合
    // setCode(sampleCode);
    setInitialVarsString(sampleInitialVars);
  };

  const handleGenerateCode = async () => {
     if (!aiPrompt) {
       setError("AIへの指示を入力してください。");
       return;
     }
     setIsGenerating(true);
     setError(null);
     try {
       const generatedText = await generateTraceCodeFromAI(aiPrompt);
       setCode(generatedText);
       // AI生成時にサンプル初期変数もリセット（必要に応じて）
       setInitialVarsString('{\n\n}');
     } catch (error: any) {
       setError(`AIコード生成エラー: ${error.message}`);
     } finally {
       setIsGenerating(false);
     }
  };

  // currentLine が範囲外になった場合に備えて状態をチェック
  const isTraceFinished = currentLine >= programLines.length;
  const nextStepButtonText = isTraceFinished ? 'トレース完了' : '次のステップ';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左パネル: 設定 */}
      <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col">
        {/* AIコード生成 */}
        <div className="mb-6">
            <label htmlFor="ai-prompt" className="block text-lg font-semibold mb-2 text-gray-700">
                AIでコードを生成
            </label>
            <div className="flex space-x-2">
                <input
                    id="ai-prompt"
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-grow p-3 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 1から10までの合計を計算する"
                    disabled={isGenerating || isTraceStarted}
                />
                <button
                    onClick={handleGenerateCode}
                    disabled={isGenerating || isTraceStarted}
                    className="py-3 px-5 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition"
                >
                    {isGenerating ? '生成中...' : '生成'}
                </button>
            </div>
        </div>

        {/* コード入力 */}
        <div className="flex-grow">
          <label htmlFor="code-input" className="block text-lg font-semibold mb-2 text-gray-700">
            1. 疑似言語コード
          </label>
          <textarea
            id="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-80 p-3 font-mono text-sm border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500"
            placeholder="ここにトレースしたいコードを入力します..."
            disabled={isTraceStarted}
            spellCheck="false" // スペルチェック無効化
          />
        </div>
        {/* 初期変数入力 */}
        <div className="mt-6">
          <label htmlFor="vars-input" className="block text-lg font-semibold mb-2 text-gray-700">
            2. 初期変数 (JSON形式)
          </label>
          <textarea
            id="vars-input"
            value={initialVarsString}
            onChange={(e) => setInitialVarsString(e.target.value)}
            className="w-full h-24 p-3 font-mono text-sm border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500"
            placeholder='例: { "a": 10, "b": "hello" }'
            disabled={isTraceStarted}
            spellCheck="false" // スペルチェック無効化
          />
        </div>
        {/* ボタン */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleStartTrace}
            disabled={isTraceStarted}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            トレース開始
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-3 px-4 bg-gray-600 text-white font-bold rounded-md hover:bg-gray-700 transition"
          >
            リセット
          </button>
        </div>
      </div>

      {/* 右パネル: 実行結果 */}
      <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col">
        {/* 次のステップボタン */}
        <button
          onClick={handleNextStep}
          disabled={!isTraceStarted || isTraceFinished} //  終了判定を修正
          className="w-full mb-6 py-3 px-4 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          {nextStepButtonText} {/*  ボタンテキストを動的に */}
        </button>

        {/* エラー表示 */}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{error}</div>}

        {/* トレース画面 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">トレース画面</h3>
          <div className="bg-gray-800 text-white font-mono text-sm p-4 rounded-md h-72 overflow-y-auto">
            {programLines.map((line, index) => (
              <div key={index} className={`whitespace-pre ${index === currentLine ? 'bg-blue-500 text-white' : ''}`}> {/*  ハイライト時の文字色 */}
                {/*  行番号を右寄せ + padding */}
                <span className="text-gray-500 select-none inline-block text-right w-8 pr-2">{index + 1}</span>
                {/*  空行でもスペースを確保 */}
                <span>{line || ' '}</span>
              </div>
            ))}
            {/*  最終行の後に空行を追加してスクロールしやすくする */}
            {programLines.length > 0 && <div className="h-4"></div>}
          </div>
        </div>

        {/* 変数表示 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">変数</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 p-4 bg-gray-50 border rounded-md min-h-[96px]">
            {Object.keys(variables).length > 0 ? (
                // Object.entries を使用 
                Object.entries(variables).map(([name, value]) => ( // nameとvalueを正しく取得
                <div key={name} className="flex items-center text-sm">
                    {/* name (変数名) を表示 */}
                    <span className="font-semibold mr-2">{name}:</span>
                    {/* value (変数値) を表示 */}
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 break-all">
                        {Array.isArray(value) ? `[${value.map(v => JSON.stringify(v)).join(', ')}]` : JSON.stringify(value)}
                    </span>
                </div>
                ))
            ) : (
                <p className="text-gray-500 text-sm col-span-1 md:col-span-2">トレースが開始されていません。</p> // col-span 調整
            )}
          </div>
        </div>

        {/* 出力表示 */}
        <div className="flex-grow flex flex-col">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">出力</h3>
          <div className="flex-grow p-4 bg-gray-900 text-green-400 font-mono text-sm border rounded-md min-h-[96px]">
            {output.length > 0 ? (
                output.map((line, index) => (
                <div key={index}>{`> ${line}`}</div>
                ))
            ) : (
                <p className="text-gray-500 text-sm">まだ出力はありません。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceClient;