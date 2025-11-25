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

// コードを正規化する（改行を含む配列初期化などを1行にまとめる）
const normalizeCode = (code: string): string[] => {
    const lines: string[] = [];
    let buffer = "";
    let braceDepth = 0; // {}
    let parenDepth = 0; // ()

    code.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // コメント除去
        const cleanLine = trimmed.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');
        if (!cleanLine) return;

        for (const char of cleanLine) {
            if (char === '{') braceDepth++;
            else if (char === '}') braceDepth--;
            else if (char === '(') parenDepth++;
            else if (char === ')') parenDepth--;
        }

        buffer += (buffer ? " " : "") + cleanLine;

        // 括弧が閉じていて、かつ行末が継続を示唆する文字(,)でないなら行として確定
        if (braceDepth === 0 && parenDepth === 0 && !buffer.trim().endsWith(',')) {
            lines.push(buffer);
            buffer = "";
        }
    });

    if (buffer) lines.push(buffer);
    return lines;
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

    // 配列リテラル (ネスト対応)
    if ((expr.startsWith('[') && expr.endsWith(']')) || (expr.startsWith('{') && expr.endsWith('}'))) {
        const inner = expr.slice(1, -1).trim();
        if (inner === '') return [];
        
        // ネストされた配列の分割
        let parts = [];
        let depth = 0;
        let current = '';
        for (let i = 0; i < inner.length; i++) {
            const c = inner[i];
            if (c === '{' || c === '[') depth++;
            if (c === '}' || c === ']') depth--;
            if (c === ',' && depth === 0) {
                parts.push(current.trim());
                current = '';
            } else {
                current += c;
            }
        }
        if (current) parts.push(current.trim());
        
        return parts.map(p => evaluateExpression(p, currentVars));
    }

    if (!isNaN(Number(expr)) && !expr.startsWith('"') && !expr.startsWith("'")) {
         return Number(expr);
    }

    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
        return expr.slice(1, -1);
    }

    // メソッド呼び出し (obj.method(...))
    const methodCallMatch = expr.match(/^([a-zA-Z_]\w*)\s*\.\s*([a-zA-Z_]\w*)\s*\((.*)\)\s*$/);
    if (methodCallMatch) {
        const varName = methodCallMatch[1];
        const methodName = methodCallMatch[2];
        const argsStr = methodCallMatch[3];
        
        if (currentVars.hasOwnProperty(varName)) {
            const obj = currentVars[varName];
            if (obj && obj.type === 'PrioQueue') {
                const args = argsStr ? argsStr.split(',').map(a => evaluateExpression(a.trim(), currentVars)) : [];
                if (methodName === 'enqueue') {
                    const [val, prio] = args;
                    const newQ = prioQueueOps.enqueue(obj, val, prio);
                    currentVars[varName] = newQ; 
                    return null;
                } else if (methodName === 'dequeue') {
                    const { newQ, ret } = prioQueueOps.dequeue(obj);
                    currentVars[varName] = newQ; 
                    return ret;
                } else if (methodName === 'size') {
                    return prioQueueOps.size(obj);
                }
            }
        }
    }
    
    // プロパティアクセス
    const lengthMatch = expr.match(/^(.+?)(?:\.|の)要素数$/);
    if (lengthMatch) {
        const targetExpr = lengthMatch[1].trim();
        try {
            // 再帰的にターゲット式を評価する
            const targetVal = evaluateExpression(targetExpr, currentVars);
            if (Array.isArray(targetVal) || typeof targetVal === 'string') return targetVal.length;
            if (targetVal && targetVal.type === 'PrioQueue') return prioQueueOps.size(targetVal);
            return 0; // 要素数0の配列または未定義として扱う
        } catch (e) {
            // 評価エラー時は無視
        }
    }
    
    const strLenMatch = expr.match(/^(.+?)(?:\.|の)文字数$/);
    if (strLenMatch) {
        try {
            const targetVal = evaluateExpression(strLenMatch[1].trim(), currentVars);
            if (typeof targetVal === 'string') return targetVal.length;
        } catch (e) { /* 無視 */ }
    }

    // 配列要素アクセス (多次元対応)
    if (expr.endsWith(']')) {
        let depth = 0;
        let openBracketIndex = -1;
        for (let i = expr.length - 1; i >= 0; i--) {
            if (expr[i] === ']') depth++;
            else if (expr[i] === '[') depth--;
            if (depth === 0) {
                openBracketIndex = i;
                break;
            }
        }

        if (openBracketIndex > 0) {
            const arrayExpr = expr.substring(0, openBracketIndex).trim();
            const indexExpr = expr.substring(openBracketIndex + 1, expr.length - 1).trim();

            try {
                // 左側（配列部分）を再帰的に評価（これにより多次元配列に対応）
                const arr = evaluateExpression(arrayExpr, currentVars);
                
                if (Array.isArray(arr)) {
                    const index = evaluateExpression(indexExpr, currentVars);
                    if (typeof index === 'number') {
                        // 1-based index 優先 (疑似言語仕様)
                        if (index - 1 >= 0 && index - 1 < arr.length) {
                            return arr[index - 1];
                        }
                        // 0-based index フォールバック
                        if (index >= 0 && index < arr.length) {
                            return arr[index];
                        }
                        return undefined;
                    }
                }
            } catch (e) {}
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
      // 割り算の条件式
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

      // 日本語条件式のサポート
      const notEqualMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*(?:と|で)\s*等しくない$/);
      if (notEqualMatch) {
          try {
              const lhs = evaluateExpression(notEqualMatch[1], currentVars);
              const rhs = evaluateExpression(notEqualMatch[2], currentVars);
              return lhs !== rhs;
          } catch(e) { return false; }
      }
      const equalMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*(?:と|で)\s*等しい$/);
      if (equalMatch) {
          try {
              const lhs = evaluateExpression(equalMatch[1], currentVars);
              const rhs = evaluateExpression(equalMatch[2], currentVars);
              return lhs === rhs;
          } catch(e) { return false; }
      }
      const greaterMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*より大きい$/);
      if (greaterMatch) {
          try {
              const lhs = evaluateExpression(greaterMatch[1], currentVars);
              const rhs = evaluateExpression(greaterMatch[2], currentVars);
              return lhs > rhs;
          } catch(e) { return false; }
      }
      const lessMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*より小さい$/);
      if (lessMatch) {
           try {
               const lhs = evaluateExpression(lessMatch[1], currentVars);
               const rhs = evaluateExpression(lessMatch[2], currentVars);
               return lhs < rhs;
           } catch(e) { return false; }
      }
      const greaterEqualMatch = condition.match(/^(.+?)\s+が\s+(.+?)\s*以上$/);
      if (greaterEqualMatch) {
           try {
               const lhs = evaluateExpression(greaterEqualMatch[1], currentVars);
               const rhs = evaluateExpression(greaterEqualMatch[2], currentVars);
               return lhs >= rhs;
           } catch(e) { return false; }
      }
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

      // ★修正: 正規表現に「大域」を追加
      const declarationMatch = line.match(/^(?:大域\s*[:：]\s*)?(整数型|文字列型|配列型|論理型|実数型|8ビット型|整数型配列の配列|整数型の配列|文字列型の配列|実数型の配列)(?:\s*配列)?:\s*(.+)/);
      const typedDeclarationMatch = line.match(/^([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)\s*←\s*(.+)/);
      const assignmentMatch = line.match(/^(.+?)\s*←\s*(.+)/);
      const appendMatch = line.match(/^(.+?)(?:の末尾に)\s*(.+?)\s*(?:の(?:値|結果))?\s*(?:を)?追加する$/);
      const outputMatch = line.match(/^出力する\s+(.+)/);
      const suffixOutputMatch = line.match(/^(.+?)(?:\s*の(?:戻り値|値))?を(?:空白区切りで)?出力(?:する)?$/);
      const specificOutputMatch = line.match(/^(.+?)(?:の値)?\s*と\s*(.+?)(?:の値)?\s*をこの順にコンマ区切りで出力する$/);
      const specificOutputMatch2 = line.match(/^(.+?)の全要素の値を要素番号の順に空白区切りで出力する/);
      const methodCallMatch = line.match(/^([a-zA-Z_]\w*)\s*\.\s*([a-zA-Z_]\w*)\s*\((.*)\)\s*$/);
      const ifMatch = line.match(/^if\s*(?:(?:\((.+)\))|(.+))/);
      const elseifMatch = line.match(/^(?:else\s*if|elseif)\s*(?:(?:\((.+)\))|(.+))/);
      const elseMatch = line.match(/^else$/);
      const endifMatch = line.match(/^endif$/);
      const whileMatch = line.match(/^while\s*(?:(?:\((.+)\))|(.+))/);
      const endwhileMatch = line.match(/^endwhile$/);
      const forMatch = line.match(/^for\s*\((.+)\s*を\s*(.+)\s*から\s*(.+)\s*まで\s*(?:(\d+)\s*ずつ(?:増やす|減らす))?\)/);
      const endforMatch = line.match(/^endfor$/);
      const funcDefMatch = line.match(/^[\○\●]\s*(.+?)\((.+?)\)/);
      const returnMatch = line.match(/^return\s+(.+)/);
      const breakMatch = line.match(/繰返し処理を終了する|break/);
      const standaloneCallMatch = line.match(/^([a-zA-Z_]\w*)\s*\((.*)\)$/);

      if (line === '') {
        jumped = false;
      } 
      else if (funcDefMatch) {
          jumped = false;
      }
      else if (typedDeclarationMatch) {
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
          const declaredItems = [];
          let depth = 0;
          let current = '';
          for (let i = 0; i < declarationPart.length; i++) {
              const c = declarationPart[i];
              if (c === '{') depth++;
              if (c === '}') depth--;
              if (c === ',' && depth === 0) {
                  declaredItems.push(current.trim());
                  current = '';
              } else {
                  current += c;
              }
          }
          if (current) declaredItems.push(current.trim());
          declaredItems.forEach(item => {
              const parts = item.split('←');
              let varName = parts[0].trim();
              let initialValExpr = parts[1] ? parts[1].trim() : null;
              let initialValue = null;
              const arraySizeMatch = varName.match(/^([a-zA-Z_]\w*)\s*\[\s*(\d+)\s*\]$/);
              if (arraySizeMatch) {
                   varName = arraySizeMatch[1];
                   const size = parseInt(arraySizeMatch[2], 10);
                   initialValue = new Array(size).fill(null);
              }
              if (initialValExpr && !initialValue) {
                   let expr = initialValExpr;
                   if (expr.startsWith('{') && expr.endsWith('}')) {
                       expr = expr.replace(/{/g, '[').replace(/}/g, ']');
                       try {
                           initialValue = JSON.parse(expr); 
                       } catch(e) {
                           try { initialValue = evaluateExpression(expr, tempVariables); } catch(e2) { initialValue = []; }
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
          evaluateExpression(line.trim(), tempVariables);
          jumped = false;

      } 
      else if (standaloneCallMatch && !['if', 'while', 'for', 'elseif', 'return'].includes(standaloneCallMatch[1])) {
          const funcName = standaloneCallMatch[1];
          const argsExpr = standaloneCallMatch[2].split(',').map(s => s.trim());
          
          if (definedFunctions[funcName]) {
              const argValues = argsExpr.map(arg => evaluateExpression(arg, tempVariables));
              const funcInfo = definedFunctions[funcName];
              
              tempCallStack.push({
                  returnLine: lineIndex + 1,
                  variables: { ...tempVariables },
                  variableTypes: { ...tempVariableTypes },
                  pendingExpression: null 
              });

              // ★修正: グローバル変数を含む現在の変数をコピーして引き継ぐ
              const newVariables: Record<string, any> = { ...tempVariables };
              const newVariableTypes: Record<string, string> = { ...tempVariableTypes };
              
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
              nextLine = funcInfo.startLine + 1; 
              jumped = true;
          } else {
          }

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
          let expr = expression;
          if (expr.startsWith('{') && expr.endsWith('}')) {
              expr = expr.replace(/{/g, '[').replace(/}/g, ']');
          }
          value = evaluateExpression(expr, tempVariables);

          if (target.includes('[')) {
              const arrayTargetMatch = target.match(/^([a-zA-Z_]\w*)\s*\[\s*(.+)\s*\]$/);
              if (arrayTargetMatch) {
                  const arrayName = arrayTargetMatch[1];
                  const indexExpr = arrayTargetMatch[2];
                  if (!Array.isArray(tempVariables[arrayName])) {
                      throw new Error(`代入先 "${arrayName}" は配列ではありません。`);
                  }
                  let index = evaluateExpression(indexExpr, tempVariables);
                  if (typeof index === 'number') {
                       if (index > 0 && index - 1 < tempVariables[arrayName].length) {
                           index = index - 1; 
                       }
                  }
                  const newArray = [...tempVariables[arrayName]];
                  newArray[index] = value;
                  tempVariables[arrayName] = newArray;
              } else {
                  throw new Error(`複雑な配列代入はサポートされていません: ${target}`);
              }
          } else {
              tempVariables[target] = value;
          }
          jumped = false;

      } else if (specificOutputMatch2 || specificOutputMatch || outputMatch || suffixOutputMatch) {
          let expr = "";
          if (specificOutputMatch2) expr = specificOutputMatch2[1].trim();
          else if (specificOutputMatch) { /* 特殊処理 */ }
          else if (outputMatch) expr = outputMatch[1].trim();
          else if (suffixOutputMatch) expr = suffixOutputMatch[1].trim();

          if (specificOutputMatch2) {
              if (Array.isArray(tempVariables[expr])) tempOutput.push(tempVariables[expr].join(' '));
          } else if (specificOutputMatch) {
              const val1 = evaluateExpression(specificOutputMatch[1], tempVariables);
              const val2 = evaluateExpression(specificOutputMatch[2], tempVariables);
              tempOutput.push(`${val1}, ${val2}`);
          } else {
              const val = evaluateExpression(expr, tempVariables);
              tempOutput.push(String(val));
          }
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

      } else if (elseMatch || endifMatch) {
           if (endifMatch) tempControlFlowStack.pop();
           nextLine = lineIndex + 1;
           jumped = true;

      } else if (whileMatch || endwhileMatch || forMatch || endforMatch || breakMatch) {
          if (whileMatch) {
              const condition = whileMatch[1] || whileMatch[2];
              const endLine = findBlockEnd(lineIndex, 'while', 'endwhile');
              if (endLine === -1) throw new Error('endwhileが見つかりません');
              const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
              if (!currentTop || currentTop.type !== 'while' || currentTop.startLine !== lineIndex) {
                  tempControlFlowStack.push({ type: 'while', condition, startLine: lineIndex, endLine });
              }
              if (evaluateCondition(condition, tempVariables)) nextLine = lineIndex + 1;
              else { tempControlFlowStack.pop(); nextLine = endLine + 1; }
              jumped = true;
          } else if (endwhileMatch) {
              const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
              if (currentTop?.type === 'while') nextLine = currentTop.startLine;
              else throw new Error('対応するwhileが見つかりません');
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
                   const cond = step > 0 ? tempVariables[loopVar] <= currentTop.endVal : tempVariables[loopVar] >= currentTop.endVal;
                   if (cond) nextLine = lineIndex + 1;
                   else { tempControlFlowStack.pop(); nextLine = endLine + 1; }
               } else {
                   const startVal = evaluateExpression(startExpr, tempVariables);
                   const endVal = evaluateExpression(endExpr, tempVariables);
                   tempVariables[loopVar] = startVal;
                   const cond = step > 0 ? startVal <= endVal : startVal >= endVal;
                   if (cond) {
                       tempControlFlowStack.push({ type: 'for', loopVar, startVal, endVal, step, startLine: lineIndex, endLine });
                       nextLine = lineIndex + 1;
                   } else { nextLine = endLine + 1; }
               }
               jumped = true;
          } else if (endforMatch) {
               const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
               if (currentTop?.type === 'for') {
                   tempVariables[currentTop.loopVar] += currentTop.step;
                   nextLine = currentTop.startLine;
               } else throw new Error('対応するforが見つかりません');
               jumped = true;
          } else if (breakMatch) {
               let loopIndex = -1;
               for (let i = tempControlFlowStack.length - 1; i >= 0; i--) {
                   if (tempControlFlowStack[i].type === 'while' || tempControlFlowStack[i].type === 'for') { loopIndex = i; break; }
               }
               if (loopIndex !== -1) {
                   const loopInfo = tempControlFlowStack[loopIndex];
                   tempControlFlowStack = tempControlFlowStack.slice(0, loopIndex);
                   nextLine = loopInfo.endLine + 1;
                   jumped = true;
               } else throw new Error('breakするループがありません');
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

                     const newVariables: Record<string, any> = { ...tempVariables };
                     const newVariableTypes: Record<string, string> = { ...tempVariableTypes };
                     
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
                     nextLine = funcInfo.startLine + 1;
                     jumped = true;
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
           // throw new Error(`不明な構文です: ${line}`); 
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

      // ★機能改善: 暗黙的なリターン（関数の終わり）の処理
      const nextLineContent = programLines[nextLine]?.trim() || '';
      const isNextLineFuncDef = nextLineContent.match(/^[\○\●]/);
      
      if ((nextLine >= programLines.length || isNextLineFuncDef) && tempCallStack.length > 0) {
          const frame = tempCallStack.pop();
          if (frame) {
              tempVariables = frame.variables;
              tempVariableTypes = frame.variableTypes;
              nextLine = frame.returnLine;
              
              const nextL = programLines[nextLine]?.trim() || '';
              if (nextL.startsWith('else') || nextL.startsWith('elseif')) {
                 const parentIf = getParentIfBlock(tempControlFlowStack);
                 if (parentIf && nextLine > parentIf.startLine && nextLine < parentIf.endLine) {
                      nextLine = parentIf.endLine;
                 }
              }

              setVariables(tempVariables); 
              setVariableTypes(tempVariableTypes);
              setCallStack(tempCallStack);
              setCurrentLine(nextLine);
              return; 
          }
      }

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
      
      // ★機能改善: 正規化処理 (改行を含む配列定義などを1行に結合)
      const normalizedLines = normalizeCode(code);
      
      normalizedLines.forEach(line => {
          const typedMatch = line.match(/^([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)\s*←/);
          if (typedMatch) detectedTypes[typedMatch[1]] = typedMatch[2];
      });
      normalizedLines.forEach((line, index) => {
         const funcMatch = line.match(/^[\○\●](?:.+?:\s*)?([a-zA-Z_]\w*)\((.+)\)/);
         if (funcMatch) {
             const funcName = funcMatch[1];
             const argsPart = funcMatch[2];
             const args = argsPart.split(',').map(s => s.trim());
             functions[funcName] = { name: funcName, args, startLine: index };
             // ...
         }
         // ★修正: 大域変数の正規表現を修正 (大域: ... を許容)
         const declMatch = line.match(/^(?:大域\s*[:：]\s*)?(整数型|文字列型|配列型|8ビット型|整数型配列の配列|整数型の配列|文字列型の配列|実数型の配列)(?:\s*\[\s*\d+\s*\])?:\s*(.+)/);
         if (declMatch && !funcMatch) {
             const type = declMatch[1];
             const declaration = declMatch[2];
             const declaredItems = [];
             let depth = 0;
             let current = '';
             for (let i = 0; i < declaration.length; i++) {
                 const c = declaration[i];
                 if (c === '{') depth++;
                 if (c === '}') depth--;
                 if (c === ',' && depth === 0) {
                     declaredItems.push(current.trim());
                     current = '';
                 } else {
                     current += c;
                 }
             }
             if (current) declaredItems.push(current.trim());
             declaredItems.forEach(d => {
                  const parts = d.split('←');
                  let name = parts[0].trim();
                  let initialValExpr = parts[1] ? parts[1].trim() : null;
                  name = name.replace(/\[\d+\]$/, '');
                  detectedTypes[name] = type;
                  
                  if (initialValExpr && !parsedVars.hasOwnProperty(name)) {
                      let initialValue = null;
                      if (initialValExpr.startsWith('{') && initialValExpr.endsWith('}')) {
                           let expr = initialValExpr.replace(/{/g, '[').replace(/}/g, ']');
                           try { initialValue = JSON.parse(expr); } catch(e) { initialValue = []; }
                      } else {
                           if (!isNaN(Number(initialValExpr))) initialValue = Number(initialValExpr);
                      }
                      if (initialValue !== null) parsedVars[name] = initialValue;
                  }
             });
         }
      });
      
      setVariables(parsedVars);
      setVariableTypes(detectedTypes);
      setDefinedFunctions(functions); 

      setProgramLines(normalizedLines);

      let firstExecutableLine = 0;
      while (firstExecutableLine < normalizedLines.length) {
          const l = normalizedLines[firstExecutableLine].trim();
          // 関数定義もスキップ対象から外す？いや、メイン処理は関数の外にあるはず
          if (l === '' || l.match(/^[\○\●]/)) {
              firstExecutableLine++;
          } else {
              break;
          }
      }
      if (firstExecutableLine >= normalizedLines.length) firstExecutableLine = 0;

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
    setVariableTypes({}); 
    setOutput([]);
    setError(null);
    setControlFlowStack([]);
    setCallStack([]);
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