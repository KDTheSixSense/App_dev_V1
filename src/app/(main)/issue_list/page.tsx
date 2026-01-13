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

// --- カルーセルライブラリ ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Swiperのスタイルをインポートします
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * @constant questionCategories
 * @description
 * 画面に表示する問題カテゴリのデータを定義した配列です。
 * タイトル、説明、そしてカードがクリックされたときに遷移する先のパス（URL）を保持します。
 * 新しいカテゴリを追加する場合は、この配列に新しいオブジェクトを追加するだけで済みます。
 */
const questionCategories = [
  { title: '基本情報 科目A', description: '基本情報技術者試験の午前問題です\nIT単語の知識について学習しましょう', path: '/issue_list/basic_info_a_problem/problems', image: '/images/issue_list/basic_info_a_problems1.png' },
  { title: '基本情報 科目B', description: '基本情報技術者試験の午後問題です\n実践的なアルゴリズムとプログラミング能力を試します', path: '/issue_list/basic_info_b_problem/problems', image: '/images/issue_list/basic_info_b_problem.png' },
  { title: '応用情報 午前', description: '応用情報技術者試験の午前問題です\nより応用的な知識と技術に関する\n幅広い分野からの出題です', path: '/issue_list/applied_info_morning_problem/problems', image: '/images/issue_list/applied-info_morning_problem.png' },
  // { 
  //   title: '応用情報 午後', description: 'Title\nDescription', 
  //   path: '/issue_list/applied_info_afternoon_problem/problems', image: '/images/placeholder.jpg' 
  // },
  { title: 'プログラミング', description: '様々な言語を活用できる\n実践的なコーディング問題です', path: '/issue_list/programming_problem/problems', image: '/images/issue_list/programming_problem.png' },
  { title: '選択問題', description: '様々なジャンルの4択問題を\n手軽に解くことができます', path: '/issue_list/selects_problems', image: '/images/issue_list/selects_problems.png' },
  { title: '作成した問題', description: 'あなたが作成したオリジナルの\n問題に挑戦できます', path: '/issue_list/mine_issue_list/problems', image: '/images/issue_list/mine_issue_list.png' },
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Swiperの矢印とページネーションのスタイルを強制的に上書き */}
      <style>{`
        .swiper-button-next, .swiper-button-prev {
          color: white !important; /* 矢印の色を白に */
          background-color: transparent !important; /* 通常時は背景透明 */
          opacity: 0 !important; /* 通常時は矢印自体を透明にする */
          height: 100% !important; /* 高さは親要素いっぱい */
          top: 0 !important; /* 上端に配置 */
          margin-top: 0 !important; /* マージンリセット */
          width: 120px !important; /* 幅をさらに広げて選択しやすく */
          transition: opacity 0.3s ease, background-color 0.3s ease !important; /* 透明度と背景色の変化をアニメーション */
        }
        /* ホバー時のスタイル：不透明度を1にし、背景を黒の半透明にする */
        .swiper-button-next:hover, .swiper-button-prev:hover {
          opacity: 1 !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
        .swiper-button-next::after, .swiper-button-prev::after {
          font-size: 30px !important; /* 矢印のサイズを小さく */
          font-weight: bold !important;
        }
        .swiper-pagination-bullet-active {
          background: #06b6d4 !important;
        }
      `}</style>

      {/* メインコンテンツエリア */}
      <div className="w-full p-4 flex-1 flex flex-col justify-center">

        {/* 左側の出題項目（9つのカード）エリア */}
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-md overflow-hidden flex flex-col h-full">


          {/* カードをカルーセルで表示。画面サイズに応じて表示数が変わるレスポンシブ対応。 */}
          <Swiper
            // ナビゲーション（矢印）やページネーション（ドット）などのモジュールを有効化
            modules={[Navigation, Pagination]}
            // スライド間の余白
            spaceBetween={30}
            // デフォルトで表示するスライド数
            slidesPerView={1}
            // ナビゲーション（左右の矢印）を表示
            navigation
            // ページネーション（下部のドット）を表示し、クリックで移動可能に
            pagination={{ clickable: true }}
            // ループモードを有効にする
            loop={true}
            className="w-full px-12 h-full" // Swiperコンテナの幅と高さを親要素に合わせる
          >
            {questionCategories.map((category, index) => (
              // 各カードをSwiperSlideでラップします
              <SwiperSlide key={index} className="h-full">
                <IssueCard
                  title={category.title}
                  description={category.description}
                  image={category.image}
                  isPriority={index === 0}
                  onClick={() => handleCardClick(category.path)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

    </div>
  );
};

// このコンポーネントを他のファイルからインポートして使用できるようにします。
export default QuestionsPage;