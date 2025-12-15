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
    // Linkコンポーネントを使用して、Swiperのイベント干渉を回避し、アクセシビリティを向上
    // pathが存在する場合はLinkでラップし、そうでない場合はdivとしてレンダリング
    <div className="relative h-full w-full rounded-lg shadow-lg overflow-hidden group">
      {/* リンク全体を覆う絶対配置のLink */}
      {/* react-swipableなどの干渉を避けるため、z-indexを高く設定 */}
      <div
        onClick={onClick}
        className="absolute inset-0 z-20 cursor-pointer"
        role="button"
        tabIndex={0}
      />

      {/* 背景画像 */}
      <Image
        src={image}
        alt={`${title}のイメージ画像`}
        fill
        priority={isPriority}
        className="absolute z-0 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
      />

      {/* テキストコンテンツ */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center p-6 text-center text-white pb-10 pointer-events-none">
        <h3 className="text-6xl font-extrabold drop-shadow-lg [-webkit-text-stroke:2px_#000000] [paint-order:stroke_fill]">{title}</h3>
        <div className="w-24 h-2 bg-gradient-to-r from-sky-400 to-cyan-500 my-6 rounded-full"></div>
        <p className="mt-2 text-2xl whitespace-pre-line font-bold drop-shadow-md [-webkit-text-stroke:1px_#000000] [paint-order:stroke_fill]">{description}</p>
      </div>
    </div>
  );
};

export default IssueCard;
