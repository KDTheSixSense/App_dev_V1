import { HelpStep } from "../../types/help";

/**
 * ノーコード（シミュレーター）のヘルプステップ
 */
export const noCodeHelpSteps: HelpStep[] = [
    {
        id: "nocode_overview",
        title: "ノーコード機能の概要",
        description: "ノーコードシミュレーターへようこそ！\nプログラミングコードを書かずに、直感的な操作でロジックを組み立てて実行できます。",
        imagePath: "/images/help/nocode_overview.png", // 仮の画像パス
        targetSelector: "body",
        order: 1,
        page: "simulator",
    },
    {
        id: "nocode_execution",
        title: "シミュレーションの実行",
        description: "ブロックを配置してプログラムを作成し、実行結果をすぐに確認できます。\nプログラミングの基礎ロジックを学ぶのに最適です。",
        imagePath: "/images/help/nocode_execution.png", // 仮の画像パス
        targetSelector: ".simulator-controls", // 仮のセレクタ
        order: 2,
        page: "simulator",
    },
];
