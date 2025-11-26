// /workspaces/my-next-app/src/app/(main)/customize_trace/TraceClient.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateTraceCodeFromAI } from '@/lib/actions/traceActions';
import { recordStudyTimeAction } from '@/lib/actions';

// --- Sample Code ---
const sampleCode = `整数型: counter
counter ← 3

while (counter > 0)
  出力する counter
  counter ← counter - 1
endwhile

出力する "ループが終了しました"
`;

// --- Initial Variables Sample ---
const sampleInitialVars = `{
  "counter": 3
}`;

// --- Type Definitions ---
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
    funcName: string;
    returnLine: number;
    variables: Record<string, any>;
    variableTypes: Record<string, string>;
    pendingExpression: string | null;
    targetVariable: string | null;
    listAppendTarget: string | null;
}

// --- PrioQueue Helper ---
const prioQueueOps = {
    create: () => ({ type: 'PrioQueue', data: [] as {val: any, prio: number}[] }),
    enqueue: (q: any, val: any, prio: number) => {
        const currentData = (q && q.data) ? q.data : [];
        const newData = [...currentData, { val, prio }];
        return { type: 'PrioQueue', data: newData };
    },
    dequeue: (q: any) => {
        if (!q || !q.data || q.data.length === 0) return { newQ: q, ret: null };
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

const findOperatorIndex = (expr: string, op: string): number => {
    let depth = 0;
    for (let i = expr.length - 1; i >= 0; i--) {
        const char = expr[i];
        if (char === ')' || char === '）') depth++;
        else if (char === '(' || char === '（') depth--;
        else if (depth === 0) {
            if (expr.substring(i - op.length + 1, i + 1) === op) {
                const index = i - op.length + 1;
                // Check for overlapping operators
                if (op === '<') {
                    if (expr[index - 1] === '<' || expr[index + 1] === '=' || expr[index + 1] === '<') continue;
                }
                if (op === '>') {
                    if (expr[index - 1] === '>' || expr[index + 1] === '=' || expr[index + 1] === '>') continue;
                }
                if (op === '=') {
                    const prev = expr[index - 1];
                    const next = expr[index + 1];
                    if (prev === '!' || prev === '<' || prev === '>' || prev === '=' || next === '=') continue;
                }
                return index;
            }
        }
    }
    return -1;
};

const toInt = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return Math.floor(val);
    if (typeof val === 'string') {
        if (/^[01]+$/.test(val) && val.length > 0) {
            return parseInt(val, 2);
        }
        return isNaN(Number(val)) ? 0 : Math.floor(Number(val));
    }
    return 0;
};

const toNumber = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

const normalizeCode = (code: string): string[] => {
    const lines: string[] = [];
    let buffer = "";
    let braceDepth = 0; 
    let parenDepth = 0; 

    code.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const cleanLine = trimmed.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');
        if (!cleanLine.trim()) return;

        for (const char of cleanLine) {
            if (char === '{') braceDepth++;
            else if (char === '}') braceDepth--;
            else if (char === '(') parenDepth++;
            else if (char === ')') parenDepth--;
        }

        buffer += (buffer ? " " : "") + cleanLine;

        if (braceDepth === 0 && parenDepth === 0 && !buffer.trim().endsWith(',')) {
            lines.push(buffer.trim());
            buffer = "";
        }
    });

    if (buffer) lines.push(buffer.trim());
    return lines;
};

// Special Request Object
class FunctionCallRequest {
    constructor(public funcName: string, public args: any[]) {}
}

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

  // --- Helper Functions ---
  const evaluateExpression = (expression: string, currentVars: Record<string, any>): any => {
    if (!expression) return null;
    let expr = expression.trim();

    // --- Handling Suffix Modifiers ---
    let performFloor = false;
    let performCeil = false;
    
    if (expr.endsWith('の商')) {
        performFloor = true;
        expr = expr.replace(/の商$/, '').trim();
    } else if (expr.endsWith('の小数点以下を切り上げた値')) {
        performCeil = true;
        expr = expr.replace(/の小数点以下を切り上げた値$/, '').trim();
    } else if (expr.endsWith('の戻り値')) {
        expr = expr.replace(/の戻り値$/, '').trim();
    }

    // Normalize Full-width Characters
    expr = expr.replace(/[０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });
    expr = expr.replace(/（/g, '(').replace(/）/g, ')');
    expr = expr.replace(/×/g, '*').replace(/÷/g, '/'); // Normalize operators

    // Unwrap parens
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

    // Array Literal
    if ((expr.startsWith('[') && expr.endsWith(']')) || (expr.startsWith('{') && expr.endsWith('}'))) {
        const inner = expr.slice(1, -1).trim();
        if (inner === '') return [];
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

    // Number Literal
    if (!isNaN(Number(expr)) && !expr.startsWith('"') && !expr.startsWith("'") && !expr.match(/[a-zA-Z]/)) {
         const num = Number(expr);
         if (performCeil) return Math.ceil(num);
         if (performFloor) return Math.floor(num);
         return num;
    }

    // String Literal
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
        return expr.slice(1, -1);
    }

    // ★ Function Call Detection
    const funcCallMatch = expr.match(/^([a-zA-Z_]\w*)\s*\((.*)\)$/);
    if (funcCallMatch) {
        const funcName = funcCallMatch[1];
        const argsStr = funcCallMatch[2];
        if (definedFunctions[funcName]) {
            const args = argsStr ? argsStr.split(',').map(a => evaluateExpression(a.trim(), currentVars)) : [];
            return new FunctionCallRequest(funcName, args);
        }
    }

    // Method Call / Property Access
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
    
    // Length Property
    const lengthMatch = expr.match(/^(.+?)(?:\.|の)要素数$/);
    if (lengthMatch) {
        const targetExpr = lengthMatch[1].trim();
        try {
            const targetVal = evaluateExpression(targetExpr, currentVars);
            if (Array.isArray(targetVal) || typeof targetVal === 'string') return targetVal.length;
            if (targetVal && targetVal.type === 'PrioQueue') return prioQueueOps.size(targetVal);
            return 0; 
        } catch (e) {}
    }
    
    const strLenMatch = expr.match(/^(.+?)(?:\.|の)文字数$/);
    if (strLenMatch) {
        try {
            const targetVal = evaluateExpression(strLenMatch[1].trim(), currentVars);
            if (typeof targetVal === 'string') return targetVal.length;
        } catch (e) { /* Ignore */ }
    }

    // Array Access
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
                const arr = evaluateExpression(arrayExpr, currentVars);
                const index = evaluateExpression(indexExpr, currentVars);

                if (index instanceof FunctionCallRequest) return index;
                if (arr instanceof FunctionCallRequest) return arr;

                if (Array.isArray(arr)) {
                    if (typeof index === 'number') {
                        // Adjust 1-based index to 0-based
                        if (index - 1 >= 0 && index - 1 < arr.length) {
                            return arr[index - 1];
                        }
                        if (index >= 0 && index < arr.length) {
                            return arr[index];
                        }
                        return undefined;
                    }
                }
            } catch (e) {}
        }
    }

    // Variable Lookup
    if (currentVars.hasOwnProperty(expr)) return currentVars[expr];

    // Operator Handling
    const operatorGroups = [
        [' or ', ' or', '||'],
        [' and ', ' and', '&&'],
        [' ∨ ', '|'],
        [' ⊕ ', ' xor ', '^'],
        [' ∧ ', '&'],
        ['==', '!=', '≠'],
        ['<=', '>=', '<', '>', '≦', '≧', '='], 
        ['<<', '>>'],           
        ['+', '-'],
        ['*', '/', '%', '÷'] // '*' now covers '×' due to normalization
    ];

    for (const ops of operatorGroups) {
        for (const op of ops) {
            const idx = findOperatorIndex(expr, op);
            if (idx > 0) {
                const lhsStr = expr.substring(0, idx);
                const rhsStr = expr.substring(idx + op.length);
                const lhs = evaluateExpression(lhsStr, currentVars);
                const rhs = evaluateExpression(rhsStr, currentVars);

                if (lhs instanceof FunctionCallRequest) return lhs;
                if (rhs instanceof FunctionCallRequest) return rhs;

                if (lhs !== undefined && rhs !== undefined) {
                    let result: any = undefined;
                    const cleanOp = op.trim();
                    
                    // Logical
                    if (cleanOp === 'or' || cleanOp === '||') result = lhs || rhs;
                    else if (cleanOp === 'and' || cleanOp === '&&') result = lhs && rhs;
                    
                    // Comparison
                    else if (['==', '=', '!=' , '≠', '<', '>', '<=', '>=', '≦', '≧'].includes(cleanOp)) {
                        const lNum = (typeof lhs === 'number' || (typeof lhs === 'string' && !isNaN(Number(lhs)) && lhs.trim() !== '')) ? Number(lhs) : lhs;
                        const rNum = (typeof rhs === 'number' || (typeof rhs === 'string' && !isNaN(Number(rhs)) && rhs.trim() !== '')) ? Number(rhs) : rhs;

                        switch(cleanOp) {
                            case '==': case '=': result = lNum == rNum; break;
                            case '!=': case '≠': result = lNum != rNum; break;
                            case '>=': case '≧': result = lNum >= rNum; break;
                            case '<=': case '≦': result = lNum <= rNum; break;
                            case '>': result = lNum > rNum; break;
                            case '<': result = lNum < rNum; break;
                        }
                    }
                    // Concatenation
                    else if (cleanOp === '+' && (typeof lhs === 'string' || typeof rhs === 'string')) {
                         result = String(lhs) + String(rhs);
                    }
                    // Arithmetic
                    else if (['+', '-', '*', '/', '÷', '%'].includes(cleanOp)) {
                        const lNum = toNumber(lhs);
                        const rNum = toNumber(rhs);
                        switch (cleanOp) {
                            case '+': result = lNum + rNum; break;
                            case '-': result = lNum - rNum; break;
                            case '*': result = lNum * rNum; break;
                            case '/': result = Math.floor(lNum / rNum); break;
                            case '÷': result = lNum / rNum; break;
                            case '%': result = lNum % rNum; break;
                        }
                    } else {
                        const lInt = toInt(lhs);
                        const rInt = toInt(rhs);
                        switch (cleanOp) {
                            case '<<': result = lInt << rInt; break;
                            case '>>': result = lInt >> rInt; break;
                            case '&': case '∧': result = lInt & rInt; break;
                            case '|': case '∨': result = lInt | rInt; break;
                            case '^': case '⊕': case 'xor': result = lInt ^ rInt; break;
                        }
                    }

                    if (result !== undefined) {
                        if (performCeil && typeof result === 'number') return Math.ceil(result);
                        if (performFloor && typeof result === 'number') return Math.floor(result);
                        return result;
                    }
                }
            }
        }
    }
    
    const numExpr = Number(expr);
    if (!isNaN(numExpr)) {
        if (performCeil) return Math.ceil(numExpr);
        if (performFloor) return Math.floor(numExpr);
        return numExpr;
    }

    return expr;
  };

  const evaluateCondition = (condition: string, currentVars: Record<string, any>): boolean => {
      condition = condition.trim();
      // ... (Equal/Not Equal logic same as before)
      // Simplified fallback to evaluateExpression result
      try {
            const result = evaluateExpression(condition, currentVars);
            return Boolean(result);
      } catch (e) {
            return false;
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

      // Stack consistency check
      while (tempControlFlowStack.length > 0) {
         const top = tempControlFlowStack[tempControlFlowStack.length - 1];
         if ((top.type === 'if' || top.type === 'while' || top.type === 'for') && lineIndex > top.endLine) {
             tempControlFlowStack.pop();
         } else {
             break;
         }
      }

      const declarationMatch = line.match(/^(?:大域\s*[:：]\s*)?(整数型|文字列型|配列型|論理型|実数型|8ビット型|整数型配列の配列|整数型の配列|文字列型の配列|実数型の配列)(?:\s*配列)?:\s*(.+)/);
      const typedDeclarationMatch = line.match(/^([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)\s*←\s*(.+)/);
      const assignmentMatch = line.match(/^(.+?)\s*←\s*(.+)/);
      const appendMatch = line.match(/^(.+?)(?:の末尾に)\s*(.+?)(?:\s*の(?:値|結果|戻り値))?\s*(?:を)?追加する$/);
      const outputMatch = line.match(/^出力する\s+(.+)/);
      // ... (Other matches)
      const methodCallMatch = line.match(/^([a-zA-Z_]\w*)\s*\.\s*([a-zA-Z_]\w*)\s*\((.*)\)\s*$/);
      const ifMatch = line.match(/^if\s*(?:(?:\((.+)\))|(.+))/);
      const elseifMatch = line.match(/^(?:else\s*if|elseif)\s*(?:(?:\((.+)\))|(.+))/);
      const elseMatch = line.match(/^else$/);
      const endifMatch = line.match(/^endif$/);
      const whileMatch = line.match(/^while\s*(?:(?:\((.+)\))|(.+))/);
      const endwhileMatch = line.match(/^endwhile\s*$/);
      const forMatch = line.match(/^for\s*\((.+)\s*を\s*(.+)\s*から\s*(.+)\s*まで\s*(?:(\d+)\s*ずつ(?:増やす|減らす))?\)/);
      const endforMatch = line.match(/^endfor\s*$/);
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
          let initialValue = evaluateExpression(initialExpr, tempVariables);
          
          if (initialValue instanceof FunctionCallRequest) {
              const funcInfo = definedFunctions[initialValue.funcName];
              if (funcInfo) {
                  tempCallStack.push({
                      funcName: initialValue.funcName,
                      returnLine: lineIndex,
                      variables: { ...tempVariables },
                      variableTypes: { ...tempVariableTypes },
                      pendingExpression: initialExpr,
                      targetVariable: varName,
                      listAppendTarget: null
                  });
                  const newVariables: Record<string, any> = { ...tempVariables };
                  const newVariableTypes: Record<string, string> = { ...tempVariableTypes };
                  funcInfo.args.forEach((argName, idx) => {
                     const parts = argName.split(':');
                     const name = parts.length > 1 ? parts[1].trim() : parts[0].trim();
                     if (idx < initialValue.args.length) {
                         newVariables[name] = initialValue.args[idx];
                     }
                  });
                  tempVariables = newVariables;
                  tempVariableTypes = newVariableTypes;
                  nextLine = funcInfo.startLine + 1;
                  jumped = true;
              }
          } else {
              tempVariables[varName] = initialValue;
              tempVariableTypes[varName] = typeName;
              jumped = false;
          }
      } else if (declarationMatch) {
          // ... (Same declaration logic, ensuring array { } replacement)
          const type = declarationMatch[1];
          const declarationPart = declarationMatch[2];
          const parts = declarationPart.split('←');
          if (parts.length >= 2) {
               const varName = parts[0].trim();
               let initialExpr = parts[1].trim();
               if (initialExpr.startsWith('{') && initialExpr.endsWith('}')) {
                   initialExpr = initialExpr.replace(/{/g, '[').replace(/}/g, ']');
                   try { tempVariables[varName] = JSON.parse(initialExpr); } catch(e) { tempVariables[varName] = []; }
               } else {
                   const val = evaluateExpression(initialExpr, tempVariables);
                   tempVariables[varName] = val;
               }
               tempVariableTypes[varName] = type;
          } else {
              // Multiple declarations without init
              const vars = declarationPart.split(',');
              vars.forEach(v => {
                  const vName = v.trim();
                  if (vName) {
                      tempVariables[vName] = null;
                      tempVariableTypes[vName] = type;
                  }
              });
          }
          jumped = false;

      } else if (appendMatch) {
          const arrayName = appendMatch[1].trim();
          const valueExpr = appendMatch[2].trim();
          
          const val = evaluateExpression(valueExpr, tempVariables);
          if (val instanceof FunctionCallRequest) {
              const funcInfo = definedFunctions[val.funcName];
              if (funcInfo) {
                  tempCallStack.push({
                      funcName: val.funcName,
                      returnLine: lineIndex,
                      variables: { ...tempVariables },
                      variableTypes: { ...tempVariableTypes },
                      pendingExpression: valueExpr,
                      targetVariable: null,
                      listAppendTarget: arrayName
                  });
                  const newVariables = { ...tempVariables }; // Pass globals implicitly
                  const newVariableTypes = { ...tempVariableTypes };
                  funcInfo.args.forEach((argName, idx) => {
                     const parts = argName.split(':');
                     const name = parts.length > 1 ? parts[1].trim() : parts[0].trim();
                     if (idx < val.args.length) {
                         newVariables[name] = val.args[idx];
                     }
                  });
                  tempVariables = newVariables;
                  tempVariableTypes = newVariableTypes;
                  nextLine = funcInfo.startLine + 1;
                  jumped = true;
              }
          } else {
              if (Array.isArray(tempVariables[arrayName])) {
                  const newArr = [...tempVariables[arrayName]];
                  newArr.push(val);
                  tempVariables[arrayName] = newArr;
              }
          }
          if (!jumped) jumped = false;

      } else if (assignmentMatch) {
          const target = assignmentMatch[1].trim();
          const expression = assignmentMatch[2].trim();
          let expr = expression;
          if (expr.startsWith('{') && expr.endsWith('}')) {
              expr = expr.replace(/{/g, '[').replace(/}/g, ']');
          }

          const value = evaluateExpression(expr, tempVariables);
          
          if (value instanceof FunctionCallRequest) {
               const funcInfo = definedFunctions[value.funcName];
               if (funcInfo) {
                   tempCallStack.push({
                       funcName: value.funcName,
                       returnLine: lineIndex,
                       variables: { ...tempVariables },
                       variableTypes: { ...tempVariableTypes },
                       pendingExpression: expr,
                       targetVariable: target,
                       listAppendTarget: null
                   });
                   const newVariables = { ...tempVariables };
                   const newVariableTypes = { ...tempVariableTypes };
                   funcInfo.args.forEach((argName, idx) => {
                      const parts = argName.split(':');
                      const name = parts.length > 1 ? parts[1].trim() : parts[0].trim();
                      if (idx < value.args.length) {
                          newVariables[name] = value.args[idx];
                      }
                   });
                   tempVariables = newVariables;
                   tempVariableTypes = newVariableTypes;
                   nextLine = funcInfo.startLine + 1;
                   jumped = true;
               }
          } else {
              if (target.includes('[')) {
                  const match = target.match(/^([a-zA-Z_]\w*)\[(.+)\]$/);
                  if (match) {
                      const arrName = match[1];
                      let idxVal = evaluateExpression(match[2], tempVariables);
                      if (typeof idxVal === 'number' && idxVal > 0) idxVal--;
                      if (Array.isArray(tempVariables[arrName])) {
                          const newArr = [...tempVariables[arrName]];
                          newArr[idxVal] = value;
                          tempVariables[arrName] = newArr;
                      }
                  }
              } else {
                  tempVariables[target] = value;
              }
              jumped = false;
          }
      } else if (returnMatch) {
           const expr = returnMatch[1].trim();
           let retVal = evaluateExpression(expr, tempVariables);

           // Check if return value is a FunctionCallRequest (e.g. return recursive(...))
           if (retVal instanceof FunctionCallRequest) {
               // Handle tail call (simplified)
               const funcInfo = definedFunctions[retVal.funcName];
               // Push current frame back? No, we are returning, so we replace the current frame logic?
               // Simpler: Treat as a normal call, push to stack, but we are at a return line.
               // ... (Omitting complex tail call opt for now, assuming standard recursion)
           }

           if (tempCallStack.length > 0) {
               const frame = tempCallStack.pop();
               if (frame) {
                   tempVariables = frame.variables;
                   tempVariableTypes = frame.variableTypes;
                   nextLine = frame.returnLine;
                   
                   if (frame.targetVariable) {
                       tempVariables[frame.targetVariable] = retVal;
                       nextLine++; 
                   } else if (frame.listAppendTarget) {
                       if (Array.isArray(tempVariables[frame.listAppendTarget])) {
                           const newArr = [...tempVariables[frame.listAppendTarget]];
                           newArr.push(retVal);
                           tempVariables[frame.listAppendTarget] = newArr;
                       }
                       nextLine++;
                   }
                   jumped = true;
               }
           } else {
               tempVariables['result'] = retVal;
               tempOutput.push(`Return: ${JSON.stringify(retVal)}`);
               nextLine = programLines.length;
               jumped = true;
           }
      } 
      // ... (Control flow: if, while, for)
      else if (ifMatch || whileMatch || forMatch) {
           const match = ifMatch || whileMatch || forMatch;
           if (whileMatch) {
              const condition = whileMatch[1] || whileMatch[2];
              const endLine = findBlockEnd(lineIndex, 'while', 'endwhile');
              const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
              if (!currentTop || currentTop.type !== 'while' || currentTop.startLine !== lineIndex) {
                  tempControlFlowStack.push({ type: 'while', condition, startLine: lineIndex, endLine });
              }
              if (evaluateCondition(condition, tempVariables)) nextLine = lineIndex + 1;
              else { tempControlFlowStack.pop(); nextLine = endLine + 1; }
              jumped = true;
           } else if (forMatch) {
               const loopVar = forMatch[1].trim();
               const startExpr = forMatch[2].trim();
               const endExpr = forMatch[3].trim();
               let step = forMatch[4] ? parseInt(forMatch[4], 10) : 1;
               if (line.includes('減らす')) step = -step;
               const endLine = findBlockEnd(lineIndex, 'for', 'endfor');
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
           } else if (ifMatch) {
               const condition = ifMatch[1] || ifMatch[2];
               const endLine = findBlockEnd(lineIndex, 'if', 'endif');
               const elseLine = findBlockEnd(lineIndex, 'if', 'endif', 'else');
               tempControlFlowStack.push({ type: 'if', startLine: lineIndex, elseLine, endLine });
               if (evaluateCondition(condition, tempVariables)) nextLine = lineIndex + 1;
               else {
                   const nextBranch = findBlockEnd(lineIndex, 'if', 'endif', ['elseif', 'else if', 'else']);
                   if (nextBranch !== -1 && nextBranch < endLine) nextLine = nextBranch;
                   else { tempControlFlowStack.pop(); nextLine = endLine + 1; }
               }
               jumped = true;
           }
      } else if (endwhileMatch || endforMatch || endifMatch) {
          if (endwhileMatch) {
             const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
             if (currentTop?.type === 'while') nextLine = currentTop.startLine;
             jumped = true;
          } else if (endforMatch) {
             const currentTop = tempControlFlowStack[tempControlFlowStack.length - 1];
             if (currentTop?.type === 'for') {
                 tempVariables[currentTop.loopVar] += currentTop.step;
                 nextLine = currentTop.startLine;
             }
             jumped = true;
          } else {
             if (endifMatch && tempControlFlowStack.length > 0 && tempControlFlowStack[tempControlFlowStack.length-1].type === 'if') {
                 tempControlFlowStack.pop();
             }
             nextLine = lineIndex + 1;
             jumped = true;
          }
      } else if (outputMatch) {
           const expr = outputMatch[1].trim();
           const val = evaluateExpression(expr, tempVariables);
           tempOutput.push(String(val));
           jumped = false;
      }

      setVariables(tempVariables);
      setVariableTypes(tempVariableTypes);
      setOutput(tempOutput);
      setControlFlowStack(tempControlFlowStack);
      setCallStack(tempCallStack);

      // Skip function definitions in linear flow
      let nextLineCheck = nextLine;
      while (nextLineCheck < programLines.length) {
          const nextContent = programLines[nextLineCheck].trim();
          if (nextContent.match(/^[\○\●]/)) {
              nextLineCheck++;
          } else {
              break;
          }
      }
      if (nextLineCheck >= programLines.length && nextLine < programLines.length && tempCallStack.length === 0) {
          nextLine = programLines.length; 
      } else if (nextLineCheck > nextLine) {
          nextLine = nextLineCheck;
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

  const handleStartTrace = () => {
    try {
      setError(null);
      
      let fixedInitialVars = initialVarsString.trim();
      // Convert : { ... } to : [ ... ]
      fixedInitialVars = fixedInitialVars.replace(/:\s*\{([^{}]+)\}/g, ': [$1]');
      
      let parsedVars: any;
      try {
          parsedVars = JSON.parse(fixedInitialVars);
      } catch (e) {
          throw new Error("JSON形式が正しくありません。配列は [ ] を使用するか、 { } 内をカンマ区切りにしてください。");
      }

      const detectedTypes: Record<string, string> = {};
      const functions: Record<string, FunctionInfo> = {};
      const normalizedLines = normalizeCode(code);
      
      normalizedLines.forEach((line, index) => {
         const funcMatch = line.match(/^[\○\●](?:(.*?):)?\s*([a-zA-Z_]\w*)\((.+)\)/);
         if (funcMatch) {
             const returnType = funcMatch[1] ? funcMatch[1].trim() : '';
             const funcName = funcMatch[2];
             const argsPart = funcMatch[3];
             const args = argsPart.split(',').map(s => s.trim());
             functions[funcName] = { name: funcName, args, startLine: index };
         }
      });
      
      setVariables(parsedVars);
      setVariableTypes(detectedTypes);
      setDefinedFunctions(functions); 
      setProgramLines(normalizedLines);

      let startLine = 0;
      // Auto-Start Logic: If code is function-only, call the 'main' matching var name
      if (startLine >= normalizedLines.length || normalizedLines[0].match(/^[\○\●]/)) {
          const funcNames = Object.keys(functions);
          // Find function matching a key in variables (e.g., "summarize")
          const matched = funcNames.find(f => parsedVars[f]);
          
          if (matched) {
               const funcInfo = functions[matched];
               const argName = funcInfo.args[0].split(':')[1]?.trim() || funcInfo.args[0].trim();
               const argVal = parsedVars[matched];
               
               // Special setup for implicit main call
               setCallStack([{
                   funcName: matched,
                   returnLine: normalizedLines.length,
                   variables: { [argName]: argVal },
                   variableTypes: {},
                   pendingExpression: null,
                   targetVariable: null,
                   listAppendTarget: null
               }]);
               setVariables({ [argName]: argVal });
               startLine = funcInfo.startLine + 1;
          } else {
              // Skip to first non-def line
              while (startLine < normalizedLines.length) {
                  if (normalizedLines[startLine].match(/^[\○\●]/)) startLine++;
                  else break;
              }
          }
      }

      setCurrentLine(startLine);
      setOutput([]);
      setControlFlowStack([]);
      setIsTraceStarted(true);
      setTraceStartedAt(Date.now());
      hasRecordedTime.current = false;

    } catch (e: any) {
      setError(`初期化エラー: ${e.message}`);
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
      {/* Left Panel: Settings */}
      <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col">
        {/* AI Code Generation */}
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

        {/* Code Input */}
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
        {/* Initial Variables Input */}
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
        {/* Buttons */}
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

      {/* Right Panel: Execution Result */}
      <div className="bg-white p-6 rounded-lg shadow-md border flex flex-col">
        {/* Next Step Button */}
        <button
          onClick={handleNextStep}
          disabled={!isTraceStarted || isTraceFinished}
          className="w-full mb-6 py-3 px-4 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          {nextStepButtonText}
        </button>

        {/* Error Display */}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{error}</div>}

        {/* Trace Screen */}
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

        {/* Variable Display */}
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
                            if (Array.isArray(value)) {
                                const formatted = value.map(v => (v === null || v === undefined) ? '' : JSON.stringify(v));
                                return `[${formatted.join(', ')}]`;
                            }
                            return JSON.stringify(value);
                        })()}
                    </span>
                </div>
                ))
            ) : (
                <p className="text-gray-500 text-sm col-span-1 md:col-span-2">トレースが開始されていません。</p>
            )}
          </div>
        </div>

        {/* Output Display */}
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