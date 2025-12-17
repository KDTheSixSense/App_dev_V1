import { HelpStep } from "../../types/help";

/**
 * 疑似言語トレースのヘルプステップ
 */
export const traceHelpSteps: HelpStep[] = [
    {
        id: "trace_overview",
        title: "疑似言語トレースの概要",
        description: "疑似言語トレース機能へようこそ！この機能では、作成したプログラムがどのように動作するかをステップごとに確認できます。",
        imagePath: "/images/help/trace_overview.png", // 仮の画像パス
        targetSelector: "body", // 全体を示すためbody、または特定のコンテナID
        order: 1,
        page: "customize_trace",
    },
    {
        id: "trace_execution",
        title: "トレースの実行",
        description: "画面上のコントロールを使って、プログラムを1行ずつ実行したり、変数の変化を追跡したりすることができます。",
        imagePath: "/images/help/trace_execution.png", // 仮の画像パス
        targetSelector: ".trace-controls", // 仮のセレクタ
        order: 2,
        page: "customize_trace",
    },
];
