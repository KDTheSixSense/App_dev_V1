import Image from 'next/image';
import React from 'react';

interface IssueCardProps {
  title: string;
  description: string;
  image: string;
  onClick: () => void;
  isPriority?: boolean;
}

const IssueCard: React.FC<IssueCardProps> = ({ title, description, image, onClick, isPriority = false }) => {
  return (
    // カード全体を相対位置の基準とし、角を丸くし、はみ出した内容を隠す
    <div onClick={onClick} className="relative h-full w-full rounded-lg shadow-lg cursor-pointer overflow-hidden group">
      {/* 背景画像：Next.jsのImageコンポーネントを使用し、カード全体を覆う */}
      <Image
        src={image}
        alt={`${title}のイメージ画像`}
        fill // `layout="fill"`の新しい書き方
        priority={isPriority} // LCP(Largest Contentful Paint)を条件付きで最適化
        className="absolute z-0 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110" // `objectFit`の代わりに`object-cover`を使用
      />
      {/* 半透明のオーバーレイ：テキストの可読性を上げるため */}
      {/*<div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300 z-10"></div>*/}
      
      {/* テキストコンテンツ：オーバーレイの上に配置 */}
      <div className="h-full flex flex-col justify-center items-center p-6 text-center text-white pb-10">
        <h3 className="text-6xl font-extrabold drop-shadow-lg [-webkit-text-stroke:2px_#000000] [paint-order:stroke_fill]">{title}</h3>
        <div className="w-24 h-2 bg-gradient-to-r from-sky-400 to-cyan-500 my-6 rounded-full"></div> {/* 区切り線 */}
        <p className="mt-2 text-2xl whitespace-pre-line font-bold drop-shadow-md [-webkit-text-stroke:1px_#000000] [paint-order:stroke_fill]">{description}</p>
      </div>
    </div>
  );
};

export default IssueCard;
