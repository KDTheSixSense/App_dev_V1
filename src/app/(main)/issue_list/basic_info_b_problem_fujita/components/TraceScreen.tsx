// Reactライブラリをインポートします。
import React from 'react';

// --- プロップスの型定義 ---

/**
 * TraceScreen コンポーネントが受け取るプロップスの型を定義するインターフェース。
 */
interface TraceScreenProps {
  programLines: string[]; // 表示する疑似言語の各行を要素とする文字列の配列
  currentLine: number;    // 現在トレースしている行番号（0-indexed, 配列のインデックスに対応）
  language: 'ja' | 'en';  // 現在の表示言語（日本語 'ja' または英語 'en'）
  textResources: any;     // 親コンポーネントから渡される、現在の言語に応じたUIテキスト集
}

// TraceScreen コンポーネントの定義
// このコンポーネントは、疑似言語のプログラムコードを表示し、
// 現在実行中の行を赤い矢印と背景色でハイライトしてトレースを視覚化します。
const TraceScreen: React.FC<TraceScreenProps> = ({ programLines, currentLine, language, textResources: t }) => {
  return (
    // コンポーネントの最上位コンテナ。相対位置指定で内部の絶対位置指定要素（矢印）を制御。
    // 背景色、角丸、パディングを設定し、内容が溢れた場合は縦スクロール可能にする。
    <div className="relative p-4 bg-gray-50 rounded-lg h-full overflow-y-auto">
      {/* トレース画面のタイトル（言語対応） */}
      <h3 className="text-lg font-bold mb-4 text-gray-700">{t.traceScreenTitle}</h3>
      
      {/* 疑似言語コードの表示エリア
          `pre`タグで整形済みテキストとして表示し、`font-mono`で等幅フォント、`text-base`で基本の文字サイズに設定。 */}
      <pre className="font-mono text-base">
        {/* `programLines`配列をマップして、各行を表示 */}
        {programLines.map((line, index) => (
          // 各行のコンテナ。`relative`で内部の矢印の絶対位置指定を基準にする。
          // 現在実行中の行（`currentLine - 1` は、矢印が次の実行行を指すため、
          // 実際には現在完了した行の次の行に表示されるように調整）に応じて背景色を変更。
          <div
            key={index} // Reactのリストレンダリングには一意の`key`が必要
            className={`relative py-1 ${
              // `currentLine - 1` は、1-indexedのプログラム行番号と0-indexedの配列インデックスのずれを調整。
              // 例えば、`currentLine`が1（プログラムの1行目実行中）の場合、`index`が0の行がハイライトされる。
              index === currentLine - 1 ? 'bg-yellow-100' : ''
            }`}
          >
            {/* 赤い矢印の表示ロジック */}
            {/* `index === currentLine` の場合、つまり次に実行される行に矢印を表示 */}
            {index === currentLine ? (
              // 矢印のスタイル設定
              // `absolute`: 親要素に対する絶対位置指定
              // `left-[-35px]`: 左端から-35pxの位置に配置（コードの行番号のさらに左）
              // `top-1/2 -translate-y-1/2`: 親要素の高さの中央に垂直方向を揃える
              // `text-red-500 text-xl`: 赤色で大きな文字サイズ
              <span className="absolute left-[-25px] top-1/2 -translate-y-1/2 text-red-500 text-xl">
                → {/* 矢印記号 */}
              </span>
            ) : null /* 現在の行でなければ何も表示しない */}
            {line} {/* 疑似言語の各行のテキスト */}
          </div>
        ))}
      </pre>
    </div>
  );
};

export default TraceScreen;