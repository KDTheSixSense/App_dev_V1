export const beginnerProblems = [
    {
        title: '【初級】 変数と計算 (乗算)',
        description: `【問題1】
以下の作業を行い、正しい出力結果となるようにプログラムを作成しなさい。

（１）整数型の変数 a, b を宣言しなさい。
（２）変数 a に指定した数値を代入しなさい。
（３）変数 b に指定した数値を代入しなさい。
（４）変数 a * b の値を出力しなさい。
`,
        problemType: 'コーディング問題',
        difficulty: 1,
        timeLimit: 10,
        category: 'C言語基礎',
        topic: '演算',
        tags: '["C言語", "イベント", "初級", "変数", "演算"]',
        codeTemplate: `#include <stdio.h>

int main(void) {
    // ここにプログラムを記述してください
    return 0;
}`,
        isPublic: false,
        isPublished: true,
        sampleCases: [
            {
                input: 'a = 10, b = 5',
                expectedOutput: '50',
                description: '例として示された値の場合',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: '701060205',
                name: 'テストケース1',
                description: '12345 * 56789 = 701060205',
                order: 1
            }
        ]
    },
    {
        title: '【初級】 四則演算と余り',
        description: `【問題2】
以下の作業を行い、正しい出力結果となるようにプログラムを作成しなさい。

（１）整数型の変数 a を指定した数値で初期化しなさい。
（２）整数型の変数 b を指定した数値で初期化しなさい。
（３）変数 a と b の値を出力しなさい。
（４）以下の演算を行い、計算式と共に計算結果を出力しなさい。
  a % b
  b - a
  b / a
  b % a
`,
        problemType: 'コーディング問題',
        difficulty: 1,
        timeLimit: 10,
        category: 'C言語基礎',
        topic: '演算',
        tags: '["C言語", "イベント", "初級", "四則演算", "剰余"]',
        codeTemplate: `#include <stdio.h>

int main(void) {
    long a = 12345678;
    long b = 123;
    // ここにプログラムを記述してください
    return 0;
}`,
        isPublic: false,
        isPublished: true,
        sampleCases: [
            {
                input: 'a = 11, b = 3',
                expectedOutput: `a = 11
b = 3
a % b = 2
b - a = -8
b / a = 0
b % a = 3`,
                description: '例として示された値の場合',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: `a = 12345678
b = 123
a % b = 45
b - a = -12345555
b / a = 0
b % a = 123`,
                name: 'テストケース1',
                description: '指定された変数の演算結果',
                order: 1
            }
        ]
    },
    {
        title: '【初級】 書式指定出力',
        description: `【問題3】
（１）（２）の作業を行った後、以下の処理を行いなさい。

（１）整数型の変数 yen を指定した数値で初期化しなさい。
（２）整数型の変数 number を指定した数値で初期化しなさい。

作成した変数 yen と number を使用し、正しい出力結果となるようにプログラムを作成しなさい。
ただし、標準出力(printf)の処理は1度しか使用しないこと。
`,
        problemType: 'コーディング問題',
        difficulty: 1,
        timeLimit: 10,
        category: 'C言語基礎',
        topic: '入出力',
        tags: '["C言語", "イベント", "初級", "printf"]',
        codeTemplate: `#include <stdio.h>

int main(void) {
    int yen = 19800;
    int number = 12;
    // ここにプログラムを記述してください
    return 0;
}`,
        isPublic: false,
        isPublished: true,
        sampleCases: [
            {
                input: 'a = 2000, b = 10',
                expectedOutput: `¥2000の商品を10個買いました。
合計金額は¥20000です。`,
                description: '例として示された値の場合',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: `\\19800の商品を12個買いました。
合計金額は\\237600です。`,
                name: 'テストケース1',
                description: 'printfを1回だけ使用して出力',
                order: 1
            }
        ]
    },
    {
        title: '【初級】 文字コードと演算',
        description: `【問題4】
以下のプログラムを実行した結果、「Co., Ltd.」と出力したかったが、
正しい結果が得られなかった。
正しい結果を出力できるようにプログラムを修正しなさい。
ただし、必ず変数 a b c d e f g h iを使用し、値は変更しないこと。

\`\`\`c
int main(void)
{
char a='C';
char b='o';
char c='.';
char d=',';
char e=' ';
char f='L';
char g='t';
char h='d';
char i='.';

printf("%s",a+b+c+d+e+f+g+h+i);
return 0;
}
\`\`\``,
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 10,
        category: 'C言語基礎',
        topic: '文字',
        tags: '["C言語", "イベント", "初級", "char", "デバッグ"]',
        codeTemplate: `#include <stdio.h>

int main(void)
{
char a='C';
char b='o';
char c='.';
char d=',';
char e=' ';
char f='L';
char g='t';
char h='d';
char i='.';

// 以下を修正して正しい出力を得てください
printf("%s",a+b+c+d+e+f+g+h+i);
return 0;
}`,
        isPublic: false,
        isPublished: true,
        testCases: [
            {
                input: '',
                expectedOutput: 'Co., Ltd.',
                name: 'テストケース1',
                description: '文字ここの出力',
                order: 1
            }
        ]
    },
    {
        title: '【初級】 多重ループ (星形出力)',
        description: `【問題5】
for文を使用し、以下の出力結果となるようにプログラムを作成しなさい。
`,
        problemType: 'コーディング問題',
        difficulty: 2,
        timeLimit: 15,
        category: 'C言語基礎',
        topic: 'ループ',
        tags: '["C言語", "イベント", "初級", "for文", "多重ループ"]',
        codeTemplate: `#include <stdio.h>

int main(void)
{
    // ここにプログラムを記述してください
    return 0;
}`,
        isPublic: false,
        isPublished: true,
        sampleCases: [
            {
                input: '(なし)',
                expectedOutput: `
*
**
***
****
*****
****
***
**
*`,
                description: '出力結果',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: `
*
**
***
****
*****
****
***
**
*`,
                name: 'テストケース1',
                description: '指定された図形の出力',
                order: 1
            }
        ]
    }
];
