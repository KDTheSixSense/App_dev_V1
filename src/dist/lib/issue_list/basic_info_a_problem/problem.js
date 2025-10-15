"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextAProblemId = exports.getProblemAById = exports.basicInfoAProblems = void 0;
exports.basicInfoAProblems = [
    // 基本情報A問題令和5年度版
    {
        id: 'A1',
        logicType: 'TYPE_A',
        title: {
            ja: "第1問: 標準偏差",
            en: "Question 1: Standard Deviation"
        },
        description: {
            ja: "標準偏差に関する記述のうち、適切なものはどれか。",
            en: "Which of the following statements about standard deviation is correct?"
        },
        // この問題にはプログラムコードがないため、programLinesは空配列にします
        programLines: {
            ja: [],
            en: []
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '全てのデータに定数aを加えたものの標準偏差は、元の標準偏差にaを加えたものになる。' },
                { label: 'イ', value: '全てのデータに定数aを加えたものの標準偏差は、元の標準偏差のa倍になる。' },
                { label: 'ウ', value: '全てのデータを2倍したものの標準偏差は、元の標準偏差の1/2倍になる。' },
                { label: 'エ', value: '全てのデータを2倍したものの標準偏差は、元の標準偏差の2倍になる。' }
            ],
            en: [
                { label: 'A', value: 'The standard deviation of a dataset after adding a constant \'a\' to every value is the original standard deviation plus \'a\'.' },
                { label: 'B', value: 'The standard deviation of a dataset after adding a constant \'a\' to every value is \'a\' times the original standard deviation.' },
                { label: 'C', value: 'The standard deviation of a dataset after multiplying every value by 2 is 1/2 of the original standard deviation.' },
                { label: 'D', value: 'The standard deviation of a dataset after multiplying every value by 2 is 2 times the original standard deviation.' }
            ]
        },
        // 正解の選択肢の `value` を正確に指定します
        correctAnswer: '全てのデータを2倍したものの標準偏差は、元の標準偏差の2倍になる。',
        explanationText: {
            ja: "標準偏差はデータのばらつきを示す指標です。\n\n- **性質1**: データの各値に同じ定数を足したり引いたりしても、標準偏差は変わりません。データ全体が平行移動するだけで、ばらつき度合いは同じだからです。これにより、選択肢アとイは誤りです。\n\n- **性質2**: データの各値をc倍すると、標準偏差は元の標準偏差の|c|（cの絶対値）倍になります。したがって、データを2倍すると標準偏差も2倍になります。よって、選択肢ウは誤りで、エが正解です。",
            en: "Standard deviation is a measure of data dispersion.\n\n- **Property 1**: Adding or subtracting a constant value to/from every data point does not change the standard deviation. The dataset as a whole just shifts, but its spread remains the same. Therefore, options A and B are incorrect.\n\n- **Property 2**: Multiplying every data point by a constant 'c' multiplies the standard deviation by the absolute value of 'c' (|c|). Therefore, multiplying the data by 2 also doubles the standard deviation. This makes option C incorrect and option D correct."
        },
        initialVariables: {}, // トレースがないので空でOK
        traceLogic: [] // トレースがないので空でOK
    },
    {
        id: 'A2',
        logicType: 'TYPE_A',
        title: {
            ja: '第2問: CPUスケジューリング',
            en: 'Question 2: CPU Scheduling'
        },
        description: {
            ja: '処理はすべてCPU処理である三つのジョブA, B, Cがある。それらを単独で実行したときの処理時間は，ジョブAが5分，ジョブBが10分，ジョブCが15分である。この三つのジョブを次のスケジューリング方式に基づいて同時に実行すると，ジョブBが終了するまでの経過時間はおよそ何分か。',
            en: 'There are three jobs, A, B, and C, which consist entirely of CPU processing. When executed individually, their processing times are 5 minutes for Job A, 10 minutes for Job B, and 15 minutes for Job C. If these three jobs are executed concurrently based on the following scheduling method, approximately how many minutes will it take until Job B is completed?'
        },
        // programLinesにスケジューリング方式を記述
        programLines: {
            ja: [
                '〔スケジューリング方式〕',
                '(1) 一定時間(これをタイムクウォンタムと呼ぶ)内に処理が終了しなければ，処理を中断させて，待ち行列の最後尾へ回す。',
                '(2) 待ち行列に並んだ順に実行する。',
                '(3) タイムクウォンタムは，ジョブの処理時間に比べて十分に小さい値とする。',
                '(4) ジョブの切替え時間は考慮しないものとする。'
            ],
            en: [
                '[Scheduling Method]',
                '(1) If a process does not finish within a fixed time (called a time quantum), it is interrupted and moved to the end of the queue.',
                '(2) Jobs are executed in the order they are in the queue.',
                '(3) The time quantum is assumed to be sufficiently small compared to the job processing times.',
                '(4) Job switching time is not considered.'
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: '15' },
                { label: 'イ', value: '20' },
                { label: 'ウ', value: '25' },
                { label: 'エ', value: '30' }
            ],
            en: [
                { label: 'A', value: '15' },
                { label: 'B', value: '20' },
                { label: 'C', value: '25' },
                { label: 'D', 'value': '30' }
            ]
        },
        correctAnswer: '25',
        explanationText: {
            ja: `スケジューリング方式(3)より、タイムクウォンタムが十分に小さいため、CPU時間は常に実行中のジョブに均等に割り当てられると考えることができます。これを**ラウンドロビン方式**と呼びます。\n\n### ステップ1: 3つのジョブが同時に実行される期間 (A, B, C)\n- 最初は3つのジョブ(A, B, C)が同時に実行されるため、CPU時間は3つのジョブに1/3ずつ割り当てられます。\n- 最も処理時間が短いジョブA (5分) が完了するまでを考えます。\n- ジョブAが5分間のCPU時間を使い切るには、実際の経過時間で **5分 × 3 = 15分** がかかります。\n- この15分が経過した時点で、ジョブBとCもそれぞれ5分間の処理が完了しています。\n\n### ステップ2: 2つのジョブが同時に実行される期間 (B, C)\n- ジョブAの完了後、残っているジョブBとCの2つでCPU時間を分け合います。CPU時間は1/2ずつ割り当てられます。\n- ジョブBの残り処理時間は **10分 - 5分 = 5分** です。\n- ジョブBが残りの5分間のCPU時間を使い切るには、実際の経過時間で **5分 × 2 = 10分** がかかります。\n\n### 合計経過時間\n- したがって、ジョブBが終了するまでの総経過時間は、ステップ1の時間とステップ2の時間を合計したものになります。\n- **15分 + 10分 = 25分**\n\nよって、正解は「ウ」の25分です。`,
            en: `From scheduling rule (3), since the time quantum is sufficiently small, we can consider that the CPU time is always allocated equally among the running jobs. This is known as the **Round-Robin scheduling** method.\n\n### Step 1: Period when three jobs run concurrently (A, B, C)\n- Initially, three jobs (A, B, C) run concurrently, so the CPU time is allocated 1/3 to each job.\n- Let's consider the time until the shortest job, Job A (5 minutes), completes.\n- For Job A to use its full 5 minutes of CPU time, an elapsed time of **5 minutes × 3 = 15 minutes** is required.\n- At this 15-minute mark, Job B and Job C have also completed 5 minutes of processing each.\n\n### Step 2: Period when two jobs run concurrently (B, C)\n- After Job A completes, the remaining two jobs, B and C, share the CPU time, receiving 1/2 each.\n- Job B's remaining processing time is **10 minutes - 5 minutes = 5 minutes**.\n- For Job B to use its remaining 5 minutes of CPU time, an elapsed time of **5 minutes × 2 = 10 minutes** is required.\n\n### Total Elapsed Time\n- Therefore, the total elapsed time until Job B is completed is the sum of the time from Step 1 and Step 2.\n- **15 minutes + 10 minutes = 25 minutes**.\n\nThus, the correct answer is "C" (25 minutes).`
        },
        initialVariables: {},
        traceLogic: []
    },
    {
        id: 'A3',
        logicType: 'TYPE_A',
        title: {
            ja: '第3問: SQL WHERE句の論理演算',
            en: 'Question 3: SQL WHERE Clause Logical Operations'
        },
        description: {
            ja: '国語と数学の試験を実施し，2教科の成績は氏名とともに"得点"表に記録されている。1教科は平均点以上で，残りの1教科は平均点未満の生徒氏名を"得点"表から抽出するSQL文はどれか。ここで，条件文Aと条件文Bには，それぞれ次の条件が与えられているものとする。',
            en: 'A test was conducted for Japanese and Mathematics, and the scores for both subjects are recorded in the "Scores" table along with the student names. Which SQL statement extracts the names of students who scored at or above the average in one subject, and below the average in the other, from the "Scores" table? Assume that conditional statements A and B are given as follows.'
        },
        // programLinesに条件文を記述
        programLines: {
            ja: [
                '〔条件文〕',
                'A 国語の点数が国語の平均点以上',
                'B 数学の点数が数学の平均点以上'
            ],
            en: [
                '[Conditions]',
                'A: The Japanese score is at or above the average for Japanese.',
                'B: The Mathematics score is at or above the average for Mathematics.'
            ]
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'SELECT 生徒氏名 FROM 得点 WHERE (A AND B) AND NOT (A AND B)' },
                { label: 'イ', value: 'SELECT 生徒氏名 FROM 得点 WHERE (A AND B) AND NOT (A OR B)' },
                { label: 'ウ', value: 'SELECT 生徒氏名 FROM 得点 WHERE (A OR B) AND NOT (A AND B)' },
                { label: 'エ', value: 'SELECT 生徒氏名 FROM 得点 WHERE (A OR B) AND NOT (A OR B)' }
            ],
            en: [
                { label: 'A', value: 'SELECT StudentName FROM Scores WHERE (A AND B) AND NOT (A AND B)' },
                { label: 'B', value: 'SELECT StudentName FROM Scores WHERE (A AND B) AND NOT (A OR B)' },
                { label: 'C', value: 'SELECT StudentName FROM Scores WHERE (A OR B) AND NOT (A AND B)' },
                { label: 'D', value: 'SELECT StudentName FROM Scores WHERE (A OR B) AND NOT (A OR B)' }
            ]
        },
        correctAnswer: 'SELECT 生徒氏名 FROM 得点 WHERE (A OR B) AND NOT (A AND B)',
        explanationText: {
            ja: `選択肢はWHERE句以降の条件式のみが異なります。問題の条件である「1教科は平均点以上で，残りの1教科は平均点未満」を満たす論理式を考えます。\n\n- **AND**は論理積（～かつ～）、**OR**は論理和（～または～）を表します。\n\n- 条件を分解すると、これは「(国語が平均以上 **または** 数学が平均以上) **かつ** (国語と数学の両方が平均以上 **ではない**)」と言い換えられます。\n\n- ベン図で考えると、これは「条件Aまたは条件Bを満たす集合（和集合）」から「条件Aと条件Bを両方満たす集合（積集合）」を除いた部分に相当します。\n\n- この論理を条件文AとBで表すと、\`(A OR B) AND NOT (A AND B)\` となります。\n\n- この論理式に一致するのは選択肢**ウ**です。`,
            en: `The options only differ in the conditional expression after the WHERE clause. Let's find the logical expression that satisfies the condition "at or above the average in one subject, and below the average in the other."\n\n- **AND** represents a logical conjunction (A and B), while **OR** represents a logical disjunction (A or B).\n\n- The condition can be rephrased as: "(The Japanese score is at or above average **OR** the Math score is at or above average) **AND** (it is **NOT** the case that both the Japanese and Math scores are at or above average)."\n\n- In terms of a Venn diagram, this corresponds to the area of the union of sets A and B, excluding the intersection of A and B.\n\n- Expressing this logic with conditions A and B gives us: \`(A OR B) AND NOT (A AND B)\`.\n\n- Option **C** matches this logical expression.`
        },
        initialVariables: {},
        traceLogic: []
    },
    {
        id: 'A4',
        logicType: 'TYPE_A',
        title: {
            ja: '第4問: 3次元グラフィックス処理',
            en: 'Question 4: 3D Graphics Processing'
        },
        description: {
            ja: '3次元グラフィックス処理におけるクリッピングの説明はどれか。',
            en: 'Which of the following is the description of clipping in 3D graphics processing?'
        },
        // この問題にはコードや追加の条件文がないため空にします
        programLines: {
            ja: [],
            en: []
        },
        answerOptions: {
            ja: [
                { label: 'ア', value: 'CG映像作成における最終段階として，物体のデータをディスプレイに描画できるように映像化する処理である。' },
                { label: 'イ', value: '画像表示領域にウィンドウを定義し，ウィンドウの外側を除去し，内側の見える部分だけを取り出す処理である。' },
                { label: 'ウ', value: 'スクリーンの画素数が有限であるために図形の境界近くに生じる，階段状のギザギザを目立たなくする処理である。' },
                { label: 'エ', value: '立体感を生じさせるために，物体の表面に陰影を付ける処理である。' }
            ],
            en: [
                { label: 'A', value: 'The process of converting object data into an image that can be drawn on a display, as the final stage of CG image creation.' },
                { label: 'B', value: 'The process of defining a window in the image display area, removing the outside of the window, and extracting only the visible part inside.' },
                { label: 'C', value: 'The process of reducing the appearance of jagged, step-like edges that occur near the boundaries of shapes due to the finite number of pixels on a screen.' },
                { label: 'D', value: 'The process of adding shadows to the surface of an object to create a sense of three-dimensionality.' }
            ]
        },
        correctAnswer: '画像表示領域にウィンドウを定義し，ウィンドウの外側を除去し，内側の見える部分だけを取り出す処理である。',
        explanationText: {
            ja: '**クリッピング**は、最終的な表示画面の範囲外（視点からみて可視できない部分）にあるデータを、CGの描画対象から除外する処理です。最終的な仕上がりに影響を与えない余分なデータをカットすることで、後工程で必要となる計算量を減らし、作業効率を高めるために行われます。\n\n- **ア**: **レンダリング**の説明です。\n- **イ**: **正しい。**クリッピングの説明です。\n- **ウ**: **アンチエイリアシング**の説明です。\n- **エ**: **シェーディング（陰影処理）**の説明です。',
            en: '**Clipping** is the process of removing data that is outside the final display area (parts not visible from the viewpoint) from the CG rendering target. By cutting this extra data that doesn\'t affect the final output, it reduces the computational load required in later stages and improves efficiency.\n\n- **A**: This describes **Rendering**.\n- **B**: **Correct.** This describes **Clipping**.\n- **C**: This describes **Anti-aliasing**.\n- **D**: This describes **Shading**.'
        },
        initialVariables: {},
        traceLogic: []
    },
    // 必要に応じて科目Aの問題を追加
];
const getProblemAById = (id) => {
    return exports.basicInfoAProblems.find(p => p.id === id);
};
exports.getProblemAById = getProblemAById;
// ▼▼▼【ここから追加】▼▼▼
/**
 * 現在のA問題IDを受け取り、次の問題のIDを返すクライアントサイド関数
 * @param currentId 現在の問題ID (例: 'A1')
 * @returns 次の問題ID (例: 'A2')、最後の問題の場合は null
 */
const getNextAProblemId = (currentId) => {
    // basicInfoAProblems 配列から現在の問題のインデックスを探す
    const currentIndex = exports.basicInfoAProblems.findIndex(p => p.id === currentId);
    // インデックスが見つからないか、または最後の問題だった場合
    if (currentIndex === -1 || currentIndex >= exports.basicInfoAProblems.length - 1) {
        return null; // 次の問題はない
    }
    // 次の問題のIDを返す
    return exports.basicInfoAProblems[currentIndex + 1].id;
};
exports.getNextAProblemId = getNextAProblemId;
// ▲▲▲【ここまで追加】▲▲▲
