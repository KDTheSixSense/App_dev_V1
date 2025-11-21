'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateTraceCodeFromAI } from '@/lib/actions/traceActions';
import { recordStudyTimeAction } from '@/lib/actions';

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
  startVal: number;
  endVal: number;
  step: number;
  startLine: number;
  endLine: number;
}

interface WhileLoopInfo {
    type: 'while';
    condition: string;
    startLine: number;
    endLine: number;
}

interface IfBlockInfo {
    type: 'if';
    startLine: number;
    elseLine: number;
    endLine: number;
}

type ControlFlowInfo = ForLoopInfo | WhileLoopInfo | IfBlockInfo;

interface FunctionInfo {
    name: string;
    args: string[];
    startLine: number;
}

interface StackFrame {
    returnLine: number;
    variables: Record<string, any>;
    variableTypes: Record<string, string>;
    pendingExpression: string | null;
}

// --- PrioQueue ヘルパー ---
const prioQueueOps = {
    create: () => ({ type: 'PrioQueue', data: [] as {val: any, prio: number}[] }),
    enqueue: (q: any, val: any, prio: number) => {
        // q が初期化されていない場合のガード
        const currentData = (q && q.data) ? q.data : [];
        const newData = [...currentData, { val, prio }];
        return { type: 'PrioQueue', data: newData };
    },
    dequeue: (q: any) => {
        if (!q || !q.data || q.data.length === 0) return { newQ: q, ret: null };
        // 優先度(数値)が最も小さいものを探す。同じなら先頭(indexが小さいほう)
        let minPrio = q.data[0].prio;
        let targetIdx = 0;
        for (let i = 1; i < q.data.length; i++) {
            if (q.data[i].prio < minPrio) {
                minPrio = q.data[i].prio;
                targetIdx = i;
            }
        }
        const ret = q.data[targetIdx].val;
        const newData = [...q.data];
        newData.splice(targetIdx, 1);
        return { newQ: { ...q, data: newData }, ret };
    },
    size: (q: any) => (q && q.data) ? q.data.length : 0
};

// 括弧のネストを考慮して演算子の位置を探す関数
const findOperatorIndex = (expr: string, op: string): number => {
    let depth = 0;
    for (let i = expr.length - 1; i >= 0; i--) {
        const char = expr[i];
        if (char === ')') depth++;
        else if (char === '(') depth--;
        else if (depth === 0) {
            if (expr.substring(i - op.length + 1, i + 1) === op) {
                const index = i - op.length + 1;
                if (op === '<') {
                    if (expr[index - 1] === '<' || expr[index + 1] === '<') continue;
                }
                if (op === '>') {
                    if (expr[index - 1] === '>' || expr[index + 1] === '>') continue;
                }
                return index;
            }
        }
    }
    return -1;
};

const toInt = (val: any): number => {
    if (typeof val === 'number') return Math.floor(val);
    if (typeof val === 'string') {
        if (/^[01]+$/.test(val) && val.length > 0) {
            return parseInt(val, 2);
        }
        return isNaN(Number(val)) ? 0 : Math.floor(Number(val));
    }
    return 0;
};

const TraceClient = () => {
  const [code, setCode] = useState(sampleCode);
  const [initialVarsString, setInitialVarsString] = useState(sampleInitialVars);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [variableTypes, setVariableTypes] = useState<Record<string, string>>({}); 
  
  const [programLines, setProgramLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(-1);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTraceStarted, setIsTraceStarted] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('カウンターが0になるまでデクリメントする');
  const [isGenerating, setIsGenerating] = useState(false);
  const [controlFlowStack, setControlFlowStack] = useState<ControlFlowInfo[]>([]);
  
  const [definedFunctions, setDefinedFunctions] = useState<Record<string, FunctionInfo>>({});
  const [callStack, setCallStack] = useState<StackFrame[]>([]);

  const [traceStartedAt, setTraceStartedAt] = useState<number | null>(null);
  const hasRecordedTime = useRef(false);


  // --- ヘルパー関数 ---

  const evaluateExpression = (expression: string, currentVars: Record<string, any>): any => {
    if (!expression) return null;
    let expr = expression.trim();

    expr = expr.replace(/[０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });

    while (expr.startsWith('(') && expr.endsWith(')')) {
        let depth = 0;
        let isWrapped = true;
        for (let i = 0; i < expr.length - 1; i++) {
            if (expr[i] === '(') depth++;
            else if (expr[i] === ')') depth--;
            if (depth === 0) {
                isWrapped = false;
                break;
            }
        }
        if (isWrapped) {
            expr = expr.slice(1, -1).trim();
        } else {
            break;
        }
    }

    if ((expr.startsWith('[') && expr.endsWith(']')) || (expr.startsWith('{') && expr.endsWith('}'))) {
        const inner = expr.slice(1, -1).trim();
        if (inner === '') return [];
        const parts = inner.split(',').map(p => p.trim());
        return parts.map(p => evaluateExpression(p, currentVars));
    }

    if (!isNaN(Number(expr)) && !expr.startsWith('"') && !expr.startsWith("'")) {
         return Number(expr);
    }

    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
        return expr.slice(1, -1);
    }

    // メソッド呼び出し (obj.method(...))
    // 引数にカンマが含まれる場合（文字列内など）に対応するため、簡易的なsplitではなく正規表現で引数を取得
    const methodCallMatch = expr.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\((.*)\)$/);
    if (methodCallMatch) {
        const varName = methodCallMatch[1];
        const methodName = methodCallMatch[2];
        const argsStr = methodCallMatch[3];
        
        if (currentVars.hasOwnProperty(varName)) {
            const obj = currentVars[varName];
            // PrioQueue の処理
            if (obj && obj.type === 'PrioQueue') {
                // 引数の評価 (簡易的なカンマ分割。文字列内のカンマには弱いので注意が必要だが、"A", 1 ならOK)
                const args = argsStr ? argsStr.split(',').map(a => evaluateExpression(a.trim(), currentVars)) : [];

                if (methodName === 'enqueue') {
                    const [val, prio] = args;
                    const newQ = prioQueueOps.enqueue(obj, val, prio);
                    currentVars[varName] = newQ; // 副作用: 変数更新
                    return null;
                } else if (methodName === 'dequeue') {
                    const { newQ, ret } = prioQueueOps.dequeue(obj);
                    currentVars[varName] = newQ; // 副作用: 変数更新
                    return ret;
                } else if (methodName === 'size') {
                    return prioQueueOps.size(obj);
                }
            }
        }
    }
    
    const lengthMatch = expr.match(/^(.+?)(?:\.|の)要素数$/);
    if (lengthMatch) {
        const targetVar = lengthMatch[1].trim();
        let targetVal = currentVars[targetVar];
        if (targetVal === undefined) try { targetVal = evaluateExpression(targetVar, currentVars); } catch(e) {}
        if (Array.isArray(targetVal) || typeof targetVal === 'string') return targetVal.length;
        if (currentVars.hasOwnProperty(targetVar) && Array.isArray(currentVars[targetVar])) return currentVars[targetVar].length;
        // PrioQueueのsizeプロパティアクセス対応
        if (targetVal && targetVal.type === 'PrioQueue') return prioQueueOps.size(targetVal);
    }
    const strLenMatch = expr.match(/^(.+?)(?:\.|の)文字数$/);
    if (strLenMatch) {
        const targetVal = evaluateExpression(strLenMatch[1], currentVars);
        if (typeof targetVal === 'string') return targetVal.length;
    }
    const arrayAccessMatch = expr.match(/^([a-zA-Z_]\w*)\s*\[\s*(.+)\s*\]$/);
    if (arrayAccessMatch) {
        const arrayName = arrayAccessMatch[1];
        const indexExpr = arrayAccessMatch[2];
        if (currentVars.hasOwnProperty(arrayName)) {
            const arr = currentVars[arrayName];
            if (arr === null || arr === undefined) {
                throw new Error(`変数 "${arrayName}" は初期化されていません (null/undefined)。`);
            }
            if (!Array.isArray(arr) && typeof arr !== 'string') {
                throw new Error(`変数 "${arrayName}" (値: ${JSON.stringify(arr)}) は配列または文字列ではありません。`);
            }

            const index = evaluateExpression(indexExpr, currentVars);
            if (typeof index === 'number') {
                 if (index >= 0 && index < arr.length) return arr[index];
                 if (index - 1 >= 0 && index - 1 < arr.length) return arr[index - 1];
            }
            return undefined;
        }
    }

    if (currentVars.hasOwnProperty(expr)) return currentVars[expr];

    const operatorGroups = [
        [' or ', ' or', '||'],
        [' and ', ' and', '&&'],
        [' ∨ ', '|'],
        [' ⊕ ', ' xor ', '^'],
        [' ∧ ', '&'],
        ['==', '!=', '=', '≠'],
        ['<=', '>=', '<', '>', '≦', '≧'], 
        ['<<', '>>'],           
        ['+', '-'],
        ['*', '/', '%', '÷']
    ];

    for (const ops of operatorGroups) {
        for (const op of ops) {
            const idx = findOperatorIndex(expr, op);
            if (idx > 0) {
                const lhsStr = expr.substring(0, idx);
                const rhsStr = expr.substring(idx + op.length);
                
                const lhs = evaluateExpression(lhsStr, currentVars);
                const rhs = evaluateExpression(rhsStr, currentVars);

                if (lhs !== undefined && rhs !== undefined) {
                    const cleanOp = op.trim();
                    
                    if (cleanOp === 'or' || cleanOp === '||') return lhs || rhs;
                    if (cleanOp === 'and' || cleanOp === '&&') return lhs && rhs;

                    if (['==', '=', '!=' , '≠', '<', '>', '<=', '>=', '≦', '≧'].includes(cleanOp)) {
                        switch(cleanOp) {
                            case '==': case '=': return lhs == rhs;
                            case '!=': case '≠': return lhs != rhs;
                            case '>=': case '≧': return lhs >= rhs;
                            case '<=': case '≦': return lhs <= rhs;
                            case '>': return lhs > rhs;
                            case '<': return lhs < rhs;
                        }
                    }

                    if (cleanOp === '+' && (typeof lhs === 'string' || typeof rhs === 'string')) {
                         return String(lhs) + String(rhs);
                    }

                    const lNum = toInt(lhs);
                    const rNum = toInt(rhs);

                    switch (cleanOp) {
                        case '+': return lNum + rNum;
                        case '-': return lNum - rNum;
                        case '*': return lNum * rNum;
                        case '/': case '÷': return Math.floor(lNum / rNum);
                        case '%': return lNum % rNum;
                        case '<<': return lNum << rNum;
                        case '>>': return lNum >> rNum;
                        case '&': case '∧': return lNum & rNum;
                        case '|': case '∨': return lNum | rNum;
                        case '^': case '⊕': case 'xor': return lNum ^ rNum;
                    }
                }
            }
        }
    }
    return expr;
  };

  const evaluateCondition = (condition: string, currentVars: Record<string, any>): boolean => {
      condition = condition.trim();
      const divisibleByAndMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*と\s*(.+?)\s+で割り切れる$/);
      if (divisibleByAndMatch) {
          try {
              const varValue = evaluateExpression(divisibleByAndMatch[1], currentVars);
              const divisor1 = evaluateExpression(divisibleByAndMatch[2], currentVars);
              const divisor2 = evaluateExpression(divisibleByAndMatch[3], currentVars);
              if (typeof varValue !== 'number' || typeof divisor1 !== 'number' || typeof divisor2 !== 'number') return false;
              return (varValue % divisor1 === 0) && (varValue % divisor2 === 0);
          } catch (e) { return false; }
      }
      const divisibleByMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s+で割り切れる$/);
      if (divisibleByMatch) {
          try {
              const varValue = evaluateExpression(divisibleByMatch[1], currentVars);
              const divisor = evaluateExpression(divisibleByMatch[2], currentVars);
              if (typeof varValue !== 'number' || typeof divisor !== 'number') return false;
              return (varValue % divisor === 0);
          } catch (e) { return false; }
      }
      // "A が B (と|で) 等しくない"
      const notEqualMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*(?:と|で)\s*等しくない$/);
      if (notEqualMatch) {
          try {
              const lhs = evaluateExpression(notEqualMatch[1], currentVars);
              const rhs = evaluateExpression(notEqualMatch[2], currentVars);
              return lhs !== rhs;
          } catch(e) { return false; }
      }

      // "A が B (と|で) 等しい"
      const equalMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*(?:と|で)\s*等しい$/);
      if (equalMatch) {
          try {
              const lhs = evaluateExpression(equalMatch[1], currentVars);
              const rhs = evaluateExpression(equalMatch[2], currentVars);
              return lhs === rhs;
          } catch(e) { return false; }
      }
      
      // "A が B より大きい"
      const greaterMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*より大きい$/);
      if (greaterMatch) {
          try {
              const lhs = evaluateExpression(greaterMatch[1], currentVars);
              const rhs = evaluateExpression(greaterMatch[2], currentVars);
              return lhs > rhs;
          } catch(e) { return false; }
      }
      
      // "A が B より小さい"
      const lessMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*より小さい$/);
      if (lessMatch) {
           try {
               const lhs = evaluateExpression(lessMatch[1], currentVars);
               const rhs = evaluateExpression(lessMatch[2], currentVars);
               return lhs < rhs;
           } catch(e) { return false; }
      }
      
      // "A が B 以上"
      const greaterEqualMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*以上$/);
      if (greaterEqualMatch) {
           try {
               const lhs = evaluateExpression(greaterEqualMatch[1], currentVars);
               const rhs = evaluateExpression(greaterEqualMatch[2], currentVars);
               return lhs >= rhs;
           } catch(e) { return false; }
      }

      // "A が B 以下"
      const lessEqualMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*以下$/);
      if (lessEqualMatch) {
           try {
               const lhs = evaluateExpression(lessEqualMatch[1], currentVars);
               const rhs = evaluateExpression(lessEqualMatch[2], currentVars);
               return lhs <= rhs;
           } catch(e) { return false; }
      }

      try {
            const result = evaluateExpression(condition, currentVars);
            return Boolean(result);
      } catch (e) {
            throw new Error(`条件式 "${condition}" を評価できません。`);
      }
  };

  const findBlockEnd = useCallback((startLine: number, blockStartKeyword: string, blockEndKeyword: string, alternateEndKeywords?: string | string[]): number => {
    let depth = 1;
    const alternates = alternateEndKeywords ? (Array.isArray(alternateEndKeywords) ? alternateEndKeywords : [alternateEndKeywords]) : [];
    for (let i = startLine + 1; i < programLines.length; i++) {
        const line = programLines[i].trim();
        if (depth === 1 && alternates.length > 0) {
            if (alternates.some(alt => line.startsWith(alt))) return i;
        }
        const isStart = line.split(/[\s\(]/)[0] === blockStartKeyword;
        if (isStart) depth++;
        else if (line.startsWith(blockEndKeyword)) {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
  }, [programLines]);

    const recordStudyTime = useCallback(() => {
        if (traceStartedAt !== null && !hasRecordedTime.current) {
            const endTime = Date.now();
            const timeSpentMs = endTime - traceStartedAt;
            if (timeSpentMs > 3000) {
                recordStudyTimeAction(timeSpentMs);
                hasRecordedTime.current = true;
            }
        }
    }, [traceStartedAt]);

    useEffect(() => {
        return () => { recordStudyTime(); };
    }, [recordStudyTime]);
  
  const getParentIfBlock = (stack: ControlFlowInfo[]): IfBlockInfo | null => {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].type === 'if') return stack[i] as IfBlockInfo;
    }
    return null;
  };

  // --- トレース実行エンジン ---
  const handleNextStep = useCallback(() => {
    if (!isTraceStarted || currentLine < 0 || currentLine >= programLines.length) {
        if (currentLine >= programLines.length) {
             setError('トレースが終了しました。');
             setIsTraceStarted(false);
             recordStudyTime();
        }
        return;
    }

    const lineIndex = currentLine;
    const rawLine = programLines[lineIndex];
    const line = rawLine.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    let nextLine = lineIndex + 1;
    let tempVariables = { ...variables };
    let tempVariableTypes = { ...variableTypes };
    let tempOutput = [...output];
    let tempControlFlowStack = [...controlFlowStack];
    let tempCallStack = [...callStack];
    let jumped = false;
    const parentIfBlock = getParentIfBlock(tempControlFlowStack);

    try {
      setError(null);

      const declarationMatch = line.match(/^(整数型|文字列型|配列型|論理型|実数型|8ビット型|整数型の配列|文字列型の配列|実数型の配列)(?:\s*配列)?:\s*(.+)/);
      
      // 機能改善: 型注釈付き宣言 ("prioQueue: PrioQueue ← ...")
      const typedDeclarationMatch = line.match(/^([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)\s*←\s*(.+)/);

      const assignmentMatch = line.match(/^(.+?)\s*←\s*(.+)/);
      const appendMatch = line.match(/^(.+?)(?:の末尾に)\s*(.+?)\s*(?:の(?:値|結果))?\s*(?:を)?追加する$/);
      
      const outputMatch = line.match(/^出力する\s+(.+)/);
      // 機能改善: "...の戻り値を出力" などのパターン
      const suffixOutputMatch = line.match(/^(.+?)(?:\s*の(?:戻り値|値))?を(?:空白区切りで)?出力(?:する)?$/);

      const specificOutputMatch = line.match(/^(.+?)(?:の値)?\s*と\s*(.+?)(?:の値)?\s*をこの順にコンマ区切りで出力する$/);
      const specificOutputMatch2 = line.match(/^(.+?)の全要素の値を要素番号の順に空白区切りで出力する/);

      // 機能改善: 単独のメソッド呼び出し文 (例: prioQueue.enqueue(...))
      const methodCallMatch = line.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\((.*)\)$/);

      const ifMatch = line.match(/^if\s*(?:(?:\((.+)\))|(.+))/);
      const elseifMatch = line.match(/^(?:else\s*if|elseif)\s*(?:(?:\((.+)\))|(.+))/);
      const elseMatch = line.match(/^else$/);
      const endifMatch = line.match(/^endif$/);
      const whileMatch = line.match(/^while\s*(?:(?:\((.+)\))|(.+))/);
      const endwhileMatch = line.match(/^endwhile$/);
      const forMatch = line.match(/^for\s*\((.+)\s*を\s*(.+)\s*から\s*(.+)\s*まで\s*(?:(\d+)\s*ずつ(?:増やす|減らす))?\)/);
      const endforMatch = line.match(/^endfor$/);
      // const commentMatch = line.match(/^\s*\/\//) || line.match(/^\s*\/\*/);
      const funcDefMatch = line.match(/^[\○\●]\s*(.+?)\((.+?)\)/);
      const returnMatch = line.match(/^return\s+(.+)/);
      const breakMatch = line.match(/繰返し処理を終了する|break/);

      if (line === '') {
        jumped = false;
      } 
      else if (funcDefMatch) {
          jumped = false;
      }
      else if (typedDeclarationMatch) {
          // 型注釈付き宣言 (例: prioQueue: PrioQueue ← PrioQueue())
          const varName = typedDeclarationMatch[1].trim();
          const typeName = typedDeclarationMatch[2].trim();
          const initialExpr = typedDeclarationMatch[3].trim();
          
          let initialValue = null;
          if (initialExpr.includes('PrioQueue()')) {
              initialValue = prioQueueOps.create();
          } else {
              initialValue = evaluateExpression(initialExpr, tempVariables);
          }
          
          tempVariables[varName] = initialValue;
          tempVariableTypes[varName] = typeName;
          jumped = false;

      } else if (declarationMatch) {
          const type = declarationMatch[1];
          const declarationPart = declarationMatch[2];
          const declaredItems = declarationPart.split(',').map(item => item.trim());
          declaredItems.forEach(item => {
              const parts = item.split('←');
              let varName = parts[0].trim();
              let initialValExpr = parts[1] ? parts[1].trim() : null;
              let initialValue = null;
              
              if (initialValExpr && initialValExpr.includes('PrioQueue(')) {
                   initialValue = prioQueueOps.create();
              }

              const arraySizeMatch = varName.match(/^([a-zA-Z_]\w*)\s*\[\s*(\d+)\s*\]$/);
              if (arraySizeMatch) {
                   varName = arraySizeMatch[1];
                   const size = parseInt(arraySizeMatch[2], 10);
                   initialValue = new Array(size).fill(null);
              }
              if (initialValExpr && !initialValue) {
                  if (initialValExpr.startsWith('{') && initialValExpr.endsWith('}')) {
                      if (initialValExpr.includes('未定義の値')) {
                           initialValue = [];
                      } else {
                           const arrayContent = initialValExpr.substring(1, initialValExpr.length - 1);
                           if (arrayContent.trim()) {
                               const elements = arrayContent.split(',').map(e => evaluateExpression(e.trim(), tempVariables));
                               initialValue = elements;
                           } else {
                               initialValue = [];
                           }
                      }
                  } else {
                      initialValue = evaluateExpression(initialValExpr, tempVariables);
                  }
              } else if (!initialValue && (declarationMatch[1].includes('配列') || arraySizeMatch)) {
                   initialValue = [];
              }
              if (!(varName in tempVariables) || initialValExpr) {
                  tempVariables[varName] = initialValue;
                  tempVariableTypes[varName] = type;
              }
          });
          jumped = false;

      } else if (methodCallMatch) {
          // 単独メソッド呼び出し (副作用のみ)
          evaluateExpression(line.trim(), tempVariables);
          jumped = false;

      } else if (appendMatch) {
          const arrayName = appendMatch[1].trim();
          let valueExpr = appendMatch[2].trim();
          if (valueExpr.startsWith('(') && valueExpr.endsWith(')')) {
              valueExpr = valueExpr.slice(1, -1).trim();
          }
          if (Array.isArray(tempVariables[arrayName])) {
              const val = evaluateExpression(valueExpr, tempVariables);
              const newArr = [...tempVariables[arrayName]];
              newArr.push(val);
              tempVariables[arrayName] = newArr;
          } else {
              throw new Error(`変数 "${arrayName}" は配列ではありません。`);
          }
          jumped = false;

      } else if (assignmentMatch) {
          const target = assignmentMatch[1].trim();
          const expression = assignmentMatch[2].trim();
          let value;
          if (expression.startsWith('{') && expression.endsWith('}')) {
               const inner = expression.substring(1, expression.length - 1);
               value = inner ? inner.split(',').map(e => evaluateExpression(e.trim(), tempVariables)) : [];
          } else {
               value = evaluateExpression(expression, tempVariables);
          }
          const arrayTargetMatch = target.match(/^([a-zA-Z_]\w*)\s*\[\s*(.+)\s*\]$/);
          if (arrayTargetMatch) {
              const arrayName = arrayTargetMatch[1];
              const indexExpr = arrayTargetMatch[2];
              if (!Array.isArray(tempVariables[arrayName])) {
                  throw new Error(`代入先 "${arrayName}" は配列ではありません。`);
              }
              let index = evaluateExpression(indexExpr, tempVariables);
              if (typeof index === 'number') {
                   if (index > 0) index = index - 1; 
              }
              const newArray = [...tempVariables[arrayName]];
              newArray[index] = value;
              tempVariables[arrayName] = newArray;
          } else {
              tempVariables[target] = value;
          }
          jumped = false;

      } else if (specificOutputMatch2) {
          const varName = specificOutputMatch2[1].trim();
          if (Array.isArray(tempVariables[varName])) {
              tempOutput.push(tempVariables[varName].join(' '));
          }
          jumped = false;

      } else if (specificOutputMatch) {
          const val1 = evaluateExpression(specificOutputMatch[1], tempVariables);
          const val2 = evaluateExpression(specificOutputMatch[2], tempVariables);
          tempOutput.push(`${val1}, ${val2}`);
          jumped = false;

      } else if (outputMatch) {
          const expr = outputMatch[1].trim();
          const val = evaluateExpression(expr, tempVariables);
          tempOutput.push(String(val));
          jumped = false;

      } else if (suffixOutputMatch) {
          const expr = suffixOutputMatch[1].trim();
          const val = evaluateExpression(expr, tempVariables);
          tempOutput.push(String(val));
          jumped = false;

      } else if (ifMatch) {
          const condition = ifMatch[1] || ifMatch[2];
          const endLine = findBlockEnd(lineIndex, 'if', 'endif');
          if (endLine === -1) throw new Error('endifが見つかりません');
          const elseLine = findBlockEnd(lineIndex, 'if', 'endif', 'else');

          tempControlFlowStack.push({ type: 'if', startLine: lineIndex, elseLine: elseLine, endLine: endLine });
          
          if (evaluateCondition(condition, tempVariables)) {
              nextLine = lineIndex + 1;
          } else {
              const nextBranch = findBlockEnd(lineIndex, 'if', 'endif', ['elseif', 'else if', 'else']);
              if (nextBranch !== -1 && nextBranch < endLine) {
                  nextLine = nextBranch; 
              } else {
                  nextLine = endLine + 1;
              }
          }
          jumped = true;

      } else if (elseifMatch) {
           const condition = elseifMatch[1] || elseifMatch[2];
           if (evaluateCondition(condition, tempVariables)) {
               nextLine = lineIndex + 1;
           } else {
               const nextBranch = findBlockEnd(lineIndex, 'if', 'endif', ['elseif', 'else if', 'else']);
               const parentIf = getParentIfBlock(tempControlFlowStack);
               const endLine = parentIf ? parentIf.endLine : findBlockEnd(lineIndex, 'if', 'endif');
               if (nextBranch !== -1 && nextBranch < endLine) {
                   nextLine = nextBranch;
               } else {
                   nextLine = endLine + 1;
               }
           }
           jumped = true;

      } else if (elseMatch) {
           nextLine = lineIndex + 1;
           jumped = true;

      } else if (endifMatch) {
           tempControlFlowStack.pop();
           nextLine = lineIndex + 1;
           jumped = true;

      } else if (whileMatch) {
           const condition = whileMatch[1] || whileMatch[2];
           const endLine = findBlockEnd(lineIndex, 'while', 'endwhile');
           if (endLine === -1) throw new Error('endwhileが見つかりません');
           const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
           if (!currentTop || currentTop.type !== 'while' || currentTop.startLine !== lineIndex) {
               tempControlFlowStack.push({ type: 'while', condition, startLine: lineIndex, endLine });
           }
           if (evaluateCondition(condition, tempVariables)) {
               nextLine = lineIndex + 1;
           } else {
               tempControlFlowStack.pop();
               nextLine = endLine + 1;
           }
           jumped = true;

      } else if (endwhileMatch) {
           const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
           if (currentTop?.type === 'while') {
               nextLine = currentTop.startLine;
           } else {
               throw new Error('対応するwhileが見つかりません');
           }
           jumped = true;

      } else if (forMatch) {
           const loopVar = forMatch[1].trim();
           const startExpr = forMatch[2].trim();
           const endExpr = forMatch[3].trim();
           let step = forMatch[4] ? parseInt(forMatch[4], 10) : 1;
           if (line.includes('減らす')) step = -step;
           const endLine = findBlockEnd(lineIndex, 'for', 'endfor');
           if (endLine === -1) throw new Error('endforが見つかりません');
           const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
           if (currentTop?.type === 'for' && currentTop.startLine === lineIndex) {
               const cond = step > 0 
                  ? tempVariables[loopVar] <= currentTop.endVal 
                  : tempVariables[loopVar] >= currentTop.endVal;
               if (cond) {
                   nextLine = lineIndex + 1;
               } else {
                   tempControlFlowStack.pop();
                   nextLine = endLine + 1;
               }
           } else {
               const startVal = evaluateExpression(startExpr, tempVariables);
               const endVal = evaluateExpression(endExpr, tempVariables);
               tempVariables[loopVar] = startVal;
               const cond = step > 0 ? startVal <= endVal : startVal >= endVal;
               if (cond) {
                   tempControlFlowStack.push({ 
                       type: 'for', loopVar, startVal, endVal, step, startLine: lineIndex, endLine 
                   });
                   nextLine = lineIndex + 1;
               } else {
                   nextLine = endLine + 1;
               }
           }
           jumped = true;

      } else if (endforMatch) {
           const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
           if (currentTop?.type === 'for') {
               tempVariables[currentTop.loopVar] += currentTop.step;
               nextLine = currentTop.startLine;
           } else {
               throw new Error('対応するforが見つかりません');
           }
           jumped = true;
           
      } else if (breakMatch) {
           let loopIndex = -1;
           for (let i = tempControlFlowStack.length - 1; i >= 0; i--) {
               if (tempControlFlowStack[i].type === 'while' || tempControlFlowStack[i].type === 'for') {
                   loopIndex = i;
                   break;
               }
           }
           if (loopIndex !== -1) {
               const loopInfo = tempControlFlowStack[loopIndex];
               tempControlFlowStack = tempControlFlowStack.slice(0, loopIndex);
               nextLine = loopInfo.endLine + 1;
               jumped = true;
           } else {
               throw new Error('breakするループがありません');
           }

      } else if (returnMatch) {
           const expr = returnMatch[1].trim();
           const funcCallMatch = expr.match(/([a-zA-Z_]\w*)\s*\((.+)\)/);
           
           if (funcCallMatch) {
                const funcName = funcCallMatch[1];
                const argsExpr = funcCallMatch[2].split(',').map(s => s.trim());
                
                if (definedFunctions[funcName]) {
                     const argValues = argsExpr.map(arg => evaluateExpression(arg, tempVariables));
                     const funcInfo = definedFunctions[funcName];
                     
                     const placeholder = `<RESULT_${tempCallStack.length}>`; 
                     const pendingExpr = expr.replace(funcCallMatch[0], placeholder);

                     tempCallStack.push({
                         returnLine: lineIndex, 
                         variables: { ...tempVariables }, 
                         variableTypes: { ...tempVariableTypes },
                         pendingExpression: pendingExpr
                     });

                     const newVariables: Record<string, any> = {};
                     const newVariableTypes: Record<string, string> = {};
                     
                     funcInfo.args.forEach((argName, idx) => {
                         const parts = argName.split(':');
                         const name = parts.length > 1 ? parts[1].trim() : parts[0].trim();
                         const type = parts.length > 1 ? parts[0].trim() : '';
                         if (idx < argValues.length) {
                             newVariables[name] = argValues[idx];
                             newVariableTypes[name] = type;
                         }
                     });
                     
                     tempVariables = newVariables;
                     tempVariableTypes = newVariableTypes;
                     nextLine = funcInfo.startLine; 
                     jumped = true;
                     nextLine = nextLine + 1;

                } else {
                     const val = evaluateExpression(expr, tempVariables);
                     tempVariables['result'] = val;
                     tempOutput.push(`Return: ${val}`);
                     nextLine = programLines.length;
                     jumped = true;
                }

           } else {
                const retVal = evaluateExpression(expr, tempVariables);
                if (tempCallStack.length > 0) {
                    const frame = tempCallStack.pop();
                    if (frame) {
                        tempVariables = frame.variables;
                        tempVariableTypes = frame.variableTypes;
                        nextLine = frame.returnLine; 
                        if (frame.pendingExpression) {
                            const placeholder = `<RESULT_${tempCallStack.length}>`; 
                            const nextExpr = frame.pendingExpression.replace(placeholder, String(retVal));
                            let currentExpr = nextExpr;

                            while (true) {
                                const calculatedVal = evaluateExpression(currentExpr, tempVariables);
                                
                                if (tempCallStack.length === 0) {
                                    tempVariables['result'] = calculatedVal;
                                    tempOutput.push(`Return: ${calculatedVal}`);
                                    nextLine = programLines.length;
                                    jumped = true;
                                    break;
                                } else {
                                    const nextFrame = tempCallStack.pop();
                                    if (!nextFrame) break;
                                    
                                    tempVariables = nextFrame.variables;
                                    tempVariableTypes = nextFrame.variableTypes;
                                    nextLine = nextFrame.returnLine;
                                    
                                    const nextPlaceholder = `<RESULT_${tempCallStack.length}>`;
                                    if (nextFrame.pendingExpression) {
                                        currentExpr = nextFrame.pendingExpression.replace(nextPlaceholder, String(calculatedVal));
                                        // loop continue
                                    } else {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    tempVariables['result'] = retVal;
                    tempOutput.push(`Return: ${retVal}`);
                    nextLine = programLines.length;
                    jumped = true;
                }
           }
      } else {
           throw new Error(`不明な構文です: ${line}`);
      }

      if (!jumped && parentIfBlock && lineIndex > parentIfBlock.startLine && lineIndex < parentIfBlock.endLine) {
          if (lineIndex + 1 < programLines.length) {
              const nextL = programLines[lineIndex + 1].trim();
              if (nextL.startsWith('else') || nextL.startsWith('elseif')) {
                  nextLine = parentIfBlock.endLine;
              }
          }
      }

      setVariables(tempVariables);
      setVariableTypes(tempVariableTypes);
      setOutput(tempOutput);
      setControlFlowStack(tempControlFlowStack);
      setCallStack(tempCallStack);

      if (nextLine >= programLines.length) {
           setError('トレースが正常に終了しました。');
           setIsTraceStarted(false);
           recordStudyTime();
           setCurrentLine(nextLine);
      } else {
           setCurrentLine(nextLine);
      }

    } catch (e: any) {
       setError(`エラー (行 ${lineIndex + 1}): ${e.message}`);
       setIsTraceStarted(false);
    }
  }, [isTraceStarted, currentLine, programLines, variables, controlFlowStack, findBlockEnd, callStack, definedFunctions, variableTypes, output]);

  // --- UIイベントハンドラ ---
  const handleStartTrace = () => {
    try {
      setError(null);
      
      const fixedInitialVars = initialVarsString.replace(/:\s*(0\d+)/g, ': "$1"');
      const parsedVars = fixedInitialVars.trim() ? JSON.parse(fixedInitialVars) : {};
      
      const detectedTypes: Record<string, string> = {};
      const functions: Record<string, FunctionInfo> = {};
      
      const lines = code.split('\n');
      
      // 型注釈付き宣言を事前にスキャンして型情報を登録
      lines.forEach(line => {
          const typedMatch = line.match(/^([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)\s*←/);
          if (typedMatch) {
              detectedTypes[typedMatch[1]] = typedMatch[2];
          }
      });

      lines.forEach((line, index) => {
          const funcMatch = line.match(/^[\○\●](?:.+?:\s*)?([a-zA-Z_]\w*)\((.+)\)/);
          if (funcMatch) {
              const funcName = funcMatch[1];
              const argsPart = funcMatch[2];
              const args = argsPart.split(',').map(s => s.trim());
              functions[funcName] = {
                  name: funcName,
                  args: args,
                  startLine: index
              };
              args.forEach(arg => {
                  const parts = arg.split(':');
                  if (parts.length === 2) {
                      const type = parts[0].trim();
                      const name = parts[1].trim();
                      detectedTypes[name] = type;
                  }
              });
          }

          const declMatch = line.match(/^(整数型|文字列型|配列型|8ビット型|整数型の配列|文字列型の配列|実数型の配列)(?:\s*\[\s*\d+\s*\])?:\s*(.+)/);
          if (declMatch && !funcMatch) { 
               const type = declMatch[1];
               const declaration = declMatch[2];
               declaration.split(',').forEach(d => {
                  let name = d.split('←')[0].trim();
                  name = name.replace(/\[\d+\]$/, '');
                  detectedTypes[name] = type;
               });
          }
      });
      
      setVariables(parsedVars);
      setVariableTypes(detectedTypes);
      setDefinedFunctions(functions); 

      setProgramLines(lines);

      let firstExecutableLine = 0;
      while (firstExecutableLine < lines.length) {
          const l = lines[firstExecutableLine].trim();
          if (l === '' || l.startsWith('//') || l.startsWith('/*') || l.match(/^[\○\●]/)) {
              firstExecutableLine++;
          } else {
              break;
          }
      }
      if (firstExecutableLine >= lines.length) firstExecutableLine = 0;

      setCurrentLine(firstExecutableLine);
      setOutput([]);
      setControlFlowStack([]);
      setCallStack([]); 
      setIsTraceStarted(true);
      setTraceStartedAt(Date.now());
      hasRecordedTime.current = false;

      } catch (e) {
      if (e instanceof SyntaxError) {
          setError(`初期変数のJSON形式が正しくありません: ${e.message}`);
      } else {
          setError(`初期変数の処理中にエラーが発生しました: ${e instanceof Error ? e.message : String(e)}`);
      }
      setIsTraceStarted(false);
    }
  };

  const handleReset = () => {
    recordStudyTime();
    setTraceStartedAt(null);
    setIsTraceStarted(false);
    setCurrentLine(-1);
    setProgramLines([]);
    setVariables({});
    setVariableTypes({}); // Reset types
    setOutput([]);
    setError(null);
    setControlFlowStack([]);
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
     } catch (error: any) {
       setError(`AIコード生成エラー: ${error.message}`);
     } finally {
       setIsGenerating(false);
     }
  };

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
            spellCheck="false"
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
            placeholder='例: { "a": 10, "b": "hello", "arr": [1, 2, 3] }'
            disabled={isTraceStarted}
            spellCheck="false"
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
          disabled={!isTraceStarted || isTraceFinished}
          className="w-full mb-6 py-3 px-4 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          {nextStepButtonText}
        </button>

        {/* エラー表示 */}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{error}</div>}

        {/* トレース画面 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">トレース画面</h3>
          <div className="bg-gray-800 text-white font-mono text-sm p-4 rounded-md h-72 overflow-y-auto">
            {programLines.map((line, index) => (
              <div key={index} className={`whitespace-pre ${index === currentLine ? 'bg-blue-500 text-white' : ''}`}>
                <span className="text-gray-500 select-none inline-block text-right w-8 pr-2">{index + 1}</span>
                <span>{line || ' '}</span>
              </div>
            ))}
            {programLines.length > 0 && <div className="h-4"></div>}
          </div>
        </div>

        {/* 変数表示 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">変数</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 p-4 bg-gray-50 border rounded-md min-h-[96px]">
            {Object.keys(variables).length > 0 ? (
                Object.entries(variables).map(([name, value]) => (
                <div key={name} className="flex items-center text-sm">
                    <span className="font-semibold mr-2">{name}:</span>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 break-all">
                        {(() => {
                            if (variableTypes[name] === '8ビット型' && typeof value === 'number') {
                                return value.toString(2).padStart(8, '0');
                            }
                            // 機能改善: PrioQueueの表示
                            if (variableTypes[name] === 'PrioQueue' || (value && value.type === 'PrioQueue')) {
                                const qData = (value && value.data) ? value.data : [];
                                return `[${qData.map((item: any) => `${JSON.stringify(item.val)}(${item.prio})`).join(', ')}]`;
                            }
                            return Array.isArray(value) ? `[${value.map(v => JSON.stringify(v)).join(', ')}]` : JSON.stringify(value);
                        })()}
                    </span>
                </div>
                ))
            ) : (
                <p className="text-gray-500 text-sm col-span-1 md:col-span-2">トレースが開始されていません。</p>
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