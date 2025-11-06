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
// logicTypeをキーとして、対応するロジックを返すマップ
exports.problemLogicsMap = {
    'VARIABLE_SWAP': variableSwapLogic,
    'FIZZ_BUZZ': fizzBuzzLogic,
    'ARRAY_SUM': arraySumLogic,
};
