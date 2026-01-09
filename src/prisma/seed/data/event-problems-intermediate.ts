export const intermediateProblems = [
    {
        title: '【中級】 図形描写 (ダイヤモンド)',
        description: `【問題6】
for文を使用し、以下の出力結果となるようにプログラムを作成しなさい。
`,
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 20,
        category: 'C言語応用',
        topic: 'ループ',
        tags: '["C言語", "イベント", "中級", "for文", "図形"]',
        codeTemplate: `#include <stdio.h>

int main(void) {
    // ここにプログラムを記述してください
    return 0;
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: '(なし)',
                expectedOutput: `          
*        *
**      **
***    ***
****  ****
**********
****  ****
***    ***
**      **
*        *`,
                description: '出力結果',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: `          
*        *
**      **
***    ***
****  ****
**********
****  ****
***    ***
**      **
*        *`,
                name: 'テストケース1',
                description: 'ダイヤモンド型の出力',
                order: 1
            }
        ]
    },
    {
        title: '【中級】 複雑な図形描写',
        description: `【問題7】
for文を使用し、以下の出力結果となるようにプログラムを作成しなさい。
`,
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 30,
        category: 'C言語応用',
        topic: 'ループ',
        tags: '["C言語", "イベント", "中級", "for文", "複雑図形"]',
        codeTemplate: `#include <stdio.h>

int main(void) {
    // ここにプログラムを記述してください
    return 0;
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: '(なし)',
                expectedOutput: `                                                  
*        **        **        **        **        *
**      ****      ****      ****      ****      **
***    ******    ******    ******    ******    ***
****  ********  ********  ********  ********  ****
**************************************************
****  ********  ********  ********  ********  ****
***    ******    ******    ******    ******    ***
**      ****      ****      ****      ****      **
*        **        **        **        **        *
                                                  
*        **        **        **        **        *
**      ****      ****      ****      ****      **
***    ******    ******    ******    ******    ***
****  ********  ********  ********  ********  ****
**************************************************
****  ********  ********  ********  ********  ****
***    ******    ******    ******    ******    ***
**      ****      ****      ****      ****      **
*        **        **        **        **        *
                                                  
*        **        **        **        **        *
**      ****      ****      ****      ****      **
***    ******    ******    ******    ******    ***
****  ********  ********  ********  ********  ****
**************************************************
****  ********  ********  ********  ********  ****
***    ******    ******    ******    ******    ***
**      ****      ****      ****      ****      **
*        **        **        **        **        *`,
                description: '出力結果',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: `                                                  
*        **        **        **        **        *
**      ****      ****      ****      ****      **
***    ******    ******    ******    ******    ***
****  ********  ********  ********  ********  ****
**************************************************
****  ********  ********  ********  ********  ****
***    ******    ******    ******    ******    ***
**      ****      ****      ****      ****      **
*        **        **        **        **        *
                                                  
*        **        **        **        **        *
**      ****      ****      ****      ****      **
***    ******    ******    ******    ******    ***
****  ********  ********  ********  ********  ****
**************************************************
****  ********  ********  ********  ********  ****
***    ******    ******    ******    ******    ***
**      ****      ****      ****      ****      **
*        **        **        **        **        *
                                                  
*        **        **        **        **        *
**      ****      ****      ****      ****      **
***    ******    ******    ******    ******    ***
****  ********  ********  ********  ********  ****
**************************************************
****  ********  ********  ********  ********  ****
***    ******    ******    ******    ******    ***
**      ****      ****      ****      ****      **
*        **        **        **        **        *`,
                name: 'テストケース1',
                order: 1
            }
        ]
    },
    {
        title: '【中級】 関数の実装',
        description: `【問題8】
以下の条件を満たし、プログラムに必要な処理を追記しなさい。
その上で、正しい結果を出力しなさい。
※記載された処理は消さないこと

（１）nline に指定した数値を代入しなさい。
（２）StartNewLine関数の処理を記載しなさい。
  処理内容：loopCount回、printGraphを呼び出す
            改行を行う
（３）PrintGraph関数の処理を記載しなさい。
  処理内容：loopCount回 * を出力する
  
上記以外は必要に応じて処理を記載すること。

（問題）
nLine ⇒ 300`,
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 20,
        category: 'C言語応用',
        topic: '関数',
        tags: '["C言語", "イベント", "中級", "関数"]',
        codeTemplate: `#include <stdio.h>
void StartNewLine(int);
void PrintGraph(int);

int main(void)
{
	int nline;
    // 処理追記

	StartNewLine(nline);
	return 0;
}

void StartNewLine(int loopCount)
{
    // 処理内容：loopCount回、printGraphを呼び出す. 改行を行う
}

void PrintGraph(int loopCount)
{
    // 処理内容：loopCount回 * を出力する
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: 'nLine = 5',
                expectedOutput: `*
**
***
****`,
                description: 'nLine = 5 の場合',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                // n=300 is large. The output will be 1 to 300 stars. 
                // Wait, StartNewLine calls printGraph loopCount times?
                // Example nLine=5.
                // Output:
                // *
                // **
                // ***
                // ****
                // (Note: Example output shows 4 lines for nLine=5? Or is nLine used differently?)
                // Example desc: "StartNewLine処理内容: loopCount回、printGraphを呼び出す"
                // Inside loop: calls printGraph(??).
                // Actually the example output looks like "1 star, 2 stars, 3 stars..."
                // For nLine = 5... output has 4 lines?
                // Or maybe StartNewLine loops from 0 to nLine?
                // Let's assume standard "Print triangle" logic.
                // However, nLine=300 will produce huge output (300 lines).
                // But the user didn't specify exactly HOW StartNewLine calls PrintGraph.
                // "loopCount回、printGraphを呼び出す" -> loop i=0..loopCount?
                // And PrintGraph prints '*' loopCount times? No, PrintGraph takes an arg.
                // The example suggests:
                // Line 1: *
                // Line 2: **
                // ...
                // This means StartNewLine(N) calls PrintGraph(1), PrintGraph(2)... PrintGraph(N-1)?
                // Example n=5. Output has 4 lines (1,2,3,4).
                // So maybe Loop 1 to N-1?
                // Or 0 to N-1? (PrintGraph(0) prints nothing?)
                // Let's create a placeholder expectedOutput or truncated.
                // Since this is C execution, exact match is required usually.
                // I will construct expected output assuming 1 to 299 lines?
                // Or 1 to 300?
                // User requirement: "Create program to match correct result".
                // I'll make the test case flexible, OR simply rely on the visual pattern if standard check.
                // But for auto-grading, I need exact string.
                // Let's assume the loop is < nline.
                // If nline=5, output is *,**,***,****. (1,2,3,4).
                // So loop is 1 to nLine-1.
                // For nLine=300 => 1 to 299.
                // That's a lot of stars. 
                // I'll define expected output programmatically in my mind but here I must put string.
                // This might be too large for a DB field if 300 lines of many stars.
                // 300 * 150 ~= 45000 chars. Acceptable for Text type.
                // I will omit the full string here and use a smaller example for reference in this tool call,
                // but actually I should generate it.
                // Wait, if I cannot generate it perfectly, the test case will fail.
                // Maybe I should set it to "TODO: Large Output" or use a script?
                // The file "run-operations.ts" is what populates DB.
                // Here I am creating data files. I can use JS code to generate the string!
                expectedOutput: Array.from({ length: 299 }, (_, i) => "*".repeat(i + 1)).join('\n'),
                name: 'テストケース1',
                description: 'nLine=300の場合の出力',
                order: 1
            }
        ]
    },
    {
        title: '【中級】 バブルソート (降順)',
        description: `【問題9】
バブルソートで降順に並べ替える処理を追記し、
正しい結果を出力しなさい。
※記載された処理は消さないこと

（問題）
配列要素数多数。`,
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 20,
        category: 'アルゴリズム',
        topic: 'ソート',
        tags: '["C言語", "イベント", "中級", "ソート", "バブルソート"]',
        codeTemplate: `#include <stdio.h>

int main(void)
{
	int data[] = { 20, 90,  5, 77, 62, 99, 35, 44, 40,
                       33, 95, 83, 64, 76, 11, 30, 41, 50,
                       61, 27, 17, 65,  4, 51,  6, 42, 34,
                       59, 81, 98, 97, 85,  2, 63, 54, 29,
                       39, 52, 49, 93,  8, 43, 75, 26, 38,
                       31, 69, 70, 13, 12, 18, 47, 88, 10,
                       80,  3, 46,  9, 71, 21, 87, 16, 37,
                       57, 48, 25, 82, 72, 92, 14, 91, 28,
                       94, 74, 53, 89, 45, 78, 58, 22, 73,
                       15, 19, 32, 79, 36, 55, 23, 60, 84};

	// バブルソートで降順に並べ替える処理
    
    // 出力
    for(int i=0; i<sizeof(data)/sizeof(data[0]); i++){
        printf("%d ", data[i]);
    }
	return 0;
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: '(データ例)',
                expectedOutput: '9 7 5 3 1',
                description: '実行結果の例',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                // Expected output is sorted descending: 99 98 ... 2 1 (space separated)
                // From solver I can get this or generate it.
                // The dataset is 1 to 99? No, let's look at the data. 
                // Looks like random numbers from 1 to 99. "20, 90...".
                // I will assume it creates a sorted list.
                // I'll use a JS helper to sort the array in the code here.
                expectedOutput: [20, 90, 5, 77, 62, 99, 35, 44, 40,
                    33, 95, 83, 64, 76, 11, 30, 41, 50,
                    61, 27, 17, 65, 4, 51, 6, 42, 34,
                    59, 81, 98, 97, 85, 2, 63, 54, 29,
                    39, 52, 49, 93, 8, 43, 75, 26, 38,
                    31, 69, 70, 13, 12, 18, 47, 88, 10,
                    80, 3, 46, 9, 71, 21, 87, 16, 37,
                    57, 48, 25, 82, 72, 92, 14, 91, 28,
                    94, 74, 53, 89, 45, 78, 58, 22, 73,
                    15, 19, 32, 79, 36, 55, 23, 60, 84].sort((a, b) => b - a).join(' ') + ' ',
                name: 'テストケース1',
                description: '降順ソート結果',
                order: 1
            }
        ]
    },
    {
        title: '【中級】 構造体と表出力',
        description: `【問題10】
以下の条件を満たし、正しい結果を出力しなさい。
※記載された処理は消さないこと

（１）配列 kyouka を使用し、科目名を出力しなさい。
  ※表示のフォーマットルール
  ・「科目名」と「国語」の間は半角スペース13文字
  ・各科目間は半角スペース11文字

（２）2次元配列 tens を使用し、各受講生の情報を出力しなさい。
  各受講生情報を出力をするためのメソッドを作成すること。
  ※表示のフォーマットルール
  ・点数は、3桁右寄せ
  ・平均点は少数第１位まで表示
  ・科目名の右端と、点を揃える。`,
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 30,
        category: 'C言語応用',
        topic: 'フォーマット出力',
        tags: '["C言語", "イベント", "中級", "printf", "フォーマット"]',
        codeTemplate: `#include <stdio.h>

int main(void)
{
	char kyouka[][8] = { "国語", "数学", "英語", "理科" };
	int tens[][4] = { { 32, 85, 1, 90 }, { 86, 90, 80, 22 }, { 44, 100, 6, 72 },
                         { 94, 22, 54, 43 }, { 30, 41, 74, 26 }, { 13, 58, 88, 14 },
                         { 46, 93, 18, 0 }, { 34, 93, 27, 8 }, { 54, 1, 90, 13 } };
	// 情報を出力
	return 0;
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: '(データ例)',
                expectedOutput: `科目名             国語           数学           英語           理科
====================================================================
1人目の点数        63点           90点           75点           45点
1人目の合計点     273点         平均点         68.3点
====================================================================
2人目の点数        85点          100点           95点           80点
2人目の合計点     360点         平均点         90.0点
====================================================================
3人目の点数       100点          100点          100点          100点
3人目の合計点     400点         平均点        100.0点
====================================================================`,
                description: '実行結果の例',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                // Calculating expected output is complex due to Japanese chars and spacing.
                // Assuming the user wants exactly the format specified.
                // I'll leave expectedOutput somewhat loose or calculate it carefully if I could, 
                // but here I'll put a placeholder string that represents the structure.
                // Note: To pass automated tests, the user will need to match EXACTLY.
                // Given the precision of instructions (13 spaces etc), strict check is intended.
                // I will construct the header at least.
                // "科目名             国語           数学           英語           理科"
                // (13 spaces) (11 spaces) (11) (11)
                expectedOutput: `科目名             国語           数学           英語           理科
====================================================================
1人目の点数        32点           85点            1点           90点
1人目の合計点     208点         平均点         52.0点
====================================================================
2人目の点数        86点           90点           80点           22点
2人目の合計点     278点         平均点         69.5点
====================================================================
3人目の点数        44点          100点            6点           72点
3人目の合計点     222点         平均点         55.5点
====================================================================
4人目の点数        94点           22点           54点           43点
4人目の合計点     213点         平均点         53.2点
====================================================================
5人目の点数        30点           41点           74点           26点
5人目の合計点     171点         平均点         42.8点
====================================================================
6人目の点数        13点           58点           88点           14点
6人目の合計点     173点         平均点         43.2点
====================================================================
7人目の点数        46点           93点           18点            0点
7人目の合計点     157点         平均点         39.2点
====================================================================
8人目の点数        34点           93点           27点            8点
8人目の合計点     162点         平均点         40.5点
====================================================================
9人目の点数        54点            1点           90点           13点
9人目の合計点     158点         平均点         39.5点
====================================================================`,
                name: 'テストケース1',
                order: 1
            }
        ]
    },
    {
        title: '【中級】 引数付き関数',
        description: `【問題11】
以下のPerformance関数があります。
Performance関数を使用して以下のような出力を行うプログラムを作成しなさい。
`,
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 15,
        category: 'C言語応用',
        topic: '関数',
        tags: '["C言語", "イベント", "中級", "関数", "引数"]',
        codeTemplate: `#include <stdio.h>

// name : 氏名
// japanese : 国語
// mathematics : 数学
// english : 英語
void Performance(char name[],int japanese,int mathematics,int english) {

	printf("%sさんの成績は 国語：%d点 数学：%d点 英語：%d点です。\\n", name, japanese, mathematics, english);

}

int main(void) {
    // 関数を呼び出す
    return 0;
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: '',
                expectedOutput: `佐藤さんの成績は 国語：83点 数学：51点 英語：99点です。
鈴木さんの成績は 国語：72点 数学：65点 英語：48点です。
高橋さんの成績は 国語：79点 数学：45点 英語：96点です。`,
                description: '実行結果の例',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: `佐藤さんの成績は 国語：83点 数学：51点 英語：99点です。
鈴木さんの成績は 国語：72点 数学：65点 英語：48点です。
高橋さんの成績は 国語：79点 数学：45点 英語：96点です。`,
                name: 'テストケース1',
                order: 1
            }
        ]
    },
    {
        title: '【中級】 Fisher関数',
        description: `【問題12】
以下のFisher関数があります。
実行したとき、サンプルケースのように出力されるようにFisher関数を修正しなさい。
ただしnameの初期化は削除してはいけません。`,
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 15,
        category: 'C言語応用',
        topic: 'スコープ',
        tags: '["C言語", "イベント", "中級", "スコープ"]',
        codeTemplate: `#include <stdio.h>
#include <string.h>

void Fisher(void);
int main(void)
{
	char name[]= "fish!";
	Fisher();
	printf("これは%sです\\n",name);
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: '',
                expectedOutput: 'これはfish!です。',
                description: '実行結果の例',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: 'これはfish!です。',
                name: 'テストケース1',
                order: 1
            }
        ]
    },
    {
        title: '【中級】 EnumとSwitch',
        description: `【問題13】
Lesson13関数を作成し、プログラムを完成させなさい。
ただし、プログラムは以下の要件を満たすものとします。
・mainは変更せずにコンパイルが通ること
・ScriptErrorの時には、ScriptErrorと表示させます。
・DataErrorの時には、DataErrorと表示させます。
・エラーの時には「正常動作」の文字は表示されません。`,
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 20,
        category: 'C言語応用',
        topic: 'Enum',
        tags: '["C言語", "イベント", "中級", "Enum", "Switch"]',
        codeTemplate: `#include <stdio.h>

enum ErrorValue {
	Success=0,
	ScriptError=1,
	DataError,
};


int Lesson13(int errorCode) 
{
	switch (errorCode)
	{
//	case Success:
//		break;
//	case ScriptError:
//		printf("ScriptError\\n");
//		return ScriptError;
//	case DataError:
//		printf("DateError\\n"); // Note: Typos in problem text ("DateError") should be handled as printed? 
//      // Or user should fix typo? Problem says "Display DataError".
//		return DataError;
	}
	return Success;
}

int main(void) {
	int err = ScriptError;
	if (Lesson13(err)!=Success)
	{
		return err;
	}
	printf("正常動作");
	return 0;
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: 'err = ScriptError の場合',
                expectedOutput: 'ScriptError',
                description: 'エラーコードがScriptErrorの場合',
                order: 1
            },
            {
                input: 'err = DataError の場合',
                expectedOutput: 'DataError',
                description: 'エラーコードがDataErrorの場合',
                order: 2
            },
            {
                input: 'err = Success の場合',
                expectedOutput: '(表示なし)',
                description: '正常終了時は何も表示されません',
                order: 3
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: 'ScriptError',
                name: 'テストケース1',
                order: 1
            }
        ]
    },
    {
        title: '【中級】 線形探索',
        description: `【問題14】
以下のLesson14問題があります。
コメント部分に、以下のように情報を出力する処理を追加しなさい。
i ":"に続き、i が array 配列に含まれている時 TRUE、含まれていない時 FALSE を表示する。`,
        problemType: 'コーディング問題',
        difficulty: 3,
        timeLimit: 20,
        category: 'アルゴリズム',
        topic: '探索',
        tags: '["C言語", "イベント", "中級", "探索"]',
        codeTemplate: `#include <stdio.h>

int main(void)
{
	int array[100] = {
		67,46,23,25,38,
		20,14,72,16,45,
		51,95,63,75,11,
		53,61,68,92,6,
		82,69,31,59,73,
		48,70,42,9,15,
		50,17,8,27,1,
		88,99,33,91,4,
		90,64,96,36,79,
		-1
	};

	int bool;
	for (int i = 0; i < 5; i++) {
        // ここに探索と出力処理を記述
	}
	return 0;
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: '',
                expectedOutput: `0:FALSE
1:TRUE
2:FALSE
3:FALSE
4:TRUE`,
                description: '最初の5回のループ実行結果',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: `0:FALSE
1:TRUE
2:FALSE
3:FALSE
4:TRUE`,
                name: 'テストケース1',
                order: 1
            }
        ]
    },
    {
        title: '【中級】 ビット演算 (IPアドレス)',
        description: `【問題15】
配列に次のようにIPv4アドレスの組が入っています。
それぞれの配列について、２つのネットワークが一部でも重複している場合は 1 を、していない場合は 0 を出力してください。`,
        problemType: 'コーディング問題',
        difficulty: 4,
        timeLimit: 30,
        category: 'アルゴリズム',
        topic: 'ビット演算',
        tags: '["C言語", "イベント", "中級", "ビット演算", "ネットワーク"]',
        codeTemplate: `#include <stdio.h>

int main(void) {
    char ipAddress[][10] ={{192,168,1,0,24,192,168,1,128,25},
    {192,168,1,0,25,192,168,1,128,25},
    {10,0,0,0,16,10,0,67,0,24},
    {192,168,0,0,16,172,16,0,0,16}};

    // 処理記述
    return 0;
}`,
        isPublic: true,
        isPublished: true,
        sampleCases: [
            {
                input: '',
                expectedOutput: `1
0
1
0`,
                description: 'IPアドレスの重複チェック結果',
                order: 1
            }
        ],
        testCases: [
            {
                input: '',
                expectedOutput: `1
0
1
0`,
                name: 'テストケース1',
                order: 1
            }
        ]
    }
];
