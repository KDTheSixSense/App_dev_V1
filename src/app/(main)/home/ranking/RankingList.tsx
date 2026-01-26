// /workspaces/my-next-app/src/app/(main)/home/ranking/RankingList.tsx

import RankingListItem from "./RankingListItem";
import type { UserForRanking } from "@/lib/types/ranking"; // 型定義をインポート

// 型定義
type Props = {
  users: UserForRanking[];      // ランキング表示するユーザーのリスト
  myRankInfo: UserForRanking | null; // 自分のランク情報（リスト内で自分を強調表示するために使用）
};

export default function RankingList({ users, myRankInfo }: Props) {
  return (
    // 外側のコンテナ:
    // flex-1: 親要素(flex column)の残りの高さを埋める
    // overflow-hidden: ここでスクロール領域を制限し、はみ出した部分を隠す（内側のulでスクロールさせるため）
    <div className="mt-4 flex-1 overflow-hidden bg-[#fff] rounded-2xl">
      
      {/* リスト本体: 
          h-full: 親の高ささいっぱいに広げる
          overflow-y-auto: 縦方向のスクロールを有効にする
          custom-scrollbar: 下のstyleタグで定義したカスタムスクロールバーを適用
      */}
      <ul className="space-y-2 h-full overflow-y-auto custom-scrollbar">
        {users.map((user) => (
          <RankingListItem
            key={user.id} // Reactのリストレンダリングには一意なkeyが必須
            user={user}
            // 自分のIDと一致するか判定し、結果(true/false)を渡す
            // これにより、RankingListItem側で「自分だけ背景色を変える」などの処理が可能になる
            isCurrentUser={user.id === myRankInfo?.id}
          />
        ))}
      </ul>

      {/* スクロールバーのカスタマイズ (Styled JSX)
        Tailwindの標準クラスだけではWebkitスクロールバーの細かい調整が難しいため、CSSを直接記述しています。
        global属性がついているため、アプリ全体で .custom-scrollbar クラスが使えるようになります。
      */}
      <style jsx global>{`
        /* スクロールバー全体の幅 */
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        /* スクロールバーの軌道（背景） */
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        /* スクロールバーのつまみ部分 */
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 20px;
        }
        /* つまみにホバーした時のスタイル */
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}