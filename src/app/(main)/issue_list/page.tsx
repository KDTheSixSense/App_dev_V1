/**
 * @file 問題カテゴリ選択ページのメインコンポーネントです。
 * @description
 * このページは、ユーザーが学習したい問題のカテゴリ（ITパスポート、基本情報など）を
 * 選択するためのメニュー画面として機能します。
 * 各カテゴリはカード形式で表示され、クリックすると対応する問題ページへ遷移します。
 */

// 'use client' は、このコンポーネントがクライアントサイドで動作することを示すNext.jsの宣言です。
// これにより、useStateやuseEffect、useRouterなどのReactフックが使用可能になります。
'use client'; 

// --- React / Next.js のコア機能 ---
import React from 'react';
import { useRouter } from 'next/navigation'; // Next.jsのページ遷移（ナビゲーション）機能をインポート

// --- 自作コンポーネント ---
// 画面を構成する各UIパーツをインポートします。
import IssueCard from './components/IssueCard';     // 各問題カテゴリを表示するカードコンポーネント
import AdviceSection from './components/AdviceSection'; // 右側に表示されるアドバイスセクションのコンポーネント

/**
 * @constant questionCategories
 * @description
 * 画面に表示する問題カテゴリのデータを定義した配列です。
 * タイトル、説明、そしてカードがクリックされたときに遷移する先のパス（URL）を保持します。
 * 新しいカテゴリを追加する場合は、この配列に新しいオブジェクトを追加するだけで済みます。
 */
const questionCategories = [
  { title: '基本情報 科目A', description: 'Title\nDescription', path: '/issue_list/basic_info_a_problem/problems' },
  { title: '基本情報 科目B', description: 'Title\nDescription', path: '/issue_list/basic_info_b_problem/problems' }, // 科目Bは最初の問題(ID:1)に直接遷移
  { title: '応用情報 午前', description: 'Title\nDescription', path: '/issue_list/applied_info_morning_problem/problems' },
//{ title: '応用情報 午後', description: 'Title\nDescription', path: '/issue_list/applied_info_afternoon_problem/problems' },
  { title: 'プログラミング', description: 'Title\nDescription', path: '/issue_list/programming_problem/problems' },
  { title: '4択問題', description: 'Title\nDescription', path: '/issue_list/selects_problems' },
  { title: '作成した問題', description: 'Title\nDescription', path: '/issue_list/mine_issue_list/problems' },
];

/**
 * 問題カテゴリ選択ページコンポーネント
 */
const QuestionsPage: React.FC = () => {
  // --- Hooks ---
  // Next.jsのルーター機能を初期化し、プログラムによるページ遷移を可能にします。
  const router = useRouter();

  // --- Handlers ---
  // ユーザーのアクション（ボタンクリックなど）に応じて実行される関数です。

  /**
   * IssueCardコンポーネントがクリックされたときに呼び出される処理。
   * @param path - 遷移先のURLパス文字列。
   */
  const handleCardClick = (path: string) => {
    // pathが空や未定義でないことを確認
    if (path) {
      // 指定されたパスにページを遷移させる
      router.push(path);
    } else {
      // もしpathが設定されていないカードがクリックされた場合のフォールバック処理
      console.log('このカテゴリには遷移パスが設定されていません。');
      // ここで、ユーザーにアラートを表示するなどの対応も可能です。
    }
  };

  // --- Render (画面描画) ---
  // 画面の構造をJSX（HTMLに似た記法）で記述します。
  return (
    // ページ全体のコンテナ。背景色や最小の高さなどを設定。
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      
      {/* メインコンテンツエリア */}
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8">
        
        {/* 左側の出題項目（9つのカード）エリア */}
        <div className="flex-1 bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md">

          
          {/* カードをグリッドレイアウトで表示。画面サイズに応じて列数が変わるレスポンシブ対応。 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* `questionCategories` 配列の要素を一つずつ取り出し、IssueCardコンポーネントとして画面に表示します。 */}
            {questionCategories.map((category, index) => (
              <IssueCard
                // Reactがリスト内の各要素を効率的に管理するために必要な、一意の `key` を設定します。
                key={index}
                // カードに表示するタイトルを渡します。
                title={category.title}
                // カードに表示する説明文を渡します。
                description={category.description}
                // カードがクリックされたときに `handleCardClick` 関数を実行するように設定します。
                // その際、そのカテゴリに対応する `path` を引数として渡します。
                onClick={() => handleCardClick(category.path)}
              />
            ))}
          </div>
        </div>

        {/* 右側のコハクとアドバイスエリア */}
        {/* <div className="w-full lg:w-96">
          <AdviceSection />
        </div> */}
      </div>

    </div>
  );
};

// このコンポーネントを他のファイルからインポートして使用できるようにします。
export default QuestionsPage;