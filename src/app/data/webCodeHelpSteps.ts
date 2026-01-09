import { HelpStep } from "../../types/help";

/**
 * Web版コードページのチュートリアルステップ
 * Web版コード画面のヘルプデータを定義します。
 */
export const webCodeHelpSteps: HelpStep[] = [
    {
        id: "web_code_overview",
        title: "Web版コードの概要",
        description: "このページでは、自由にコードを記述して実行することができます。学習や実験の場として活用してください。",
        imagePath: "/images/help/programing1-1.png",
        targetSelector: ".h-full.p-4.overflow-hidden.bg-gray-50",
        order: 1,
        page: "web_code",
    },
    {
        id: "web_code_settings",
        title: "言語とテーマの設定",
        description: "画面上部のドロップダウンメニューから、プログラミング言語（Python, Java, JavaScriptなど）とエディタの配色テーマを変更できます。",
        imagePath: "/images/help/programing2.png",
        targetSelector: ".p-4.border-b.flex.justify-between.items-center",
        order: 2,
        page: "web_code",
    },
    {
        id: "web_code_editor",
        title: "コードエディタ",
        description: "中央のエリアにプログラムコードを記述します。オートコンプリートやシンタックスハイライト機能が利用可能です。",
        imagePath: "/images/help/programing1-1.png",
        targetSelector: ".flex-grow.flex.min-h-0.relative",
        order: 3,
        page: "web_code",
    },
    {
        id: "web_code_panel",
        title: "入出力とチャット",
        description: "画面下部のパネルでは、タブを切り替えることで「標準入力」の設定、「実行結果」の確認、そして「コハク（AI）」への質問が行えます。",
        imagePath: "/images/help/programing1-1.png",
        targetSelector: ".flex.border.border-gray-300.rounded-md.p-0\\.5",
        order: 4,
        page: "web_code",
    },
    {
        id: "web_code_execute",
        title: "プログラムの実行",
        description: "「実行」ボタンを押すと、記述したコードが実行されます。実行結果は下のパネルに表示されます。また、実行すると学習時間や連続ログイン日数が更新されます。",
        imagePath: "/images/help/programing1-1.png",
        targetSelector: ".flex.items-center.gap-2.px-4.py-2.bg-cyan-500",
        order: 5,
        page: "web_code",
    },
];
