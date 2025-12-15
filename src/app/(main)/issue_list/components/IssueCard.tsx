import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

interface IssueCardProps {
  title: string;
  description: string;
  image: string;
  path?: string;
  onClick?: () => void;
  isPriority?: boolean;
}

const IssueCard: React.FC<IssueCardProps> = ({ title, description, image, path, onClick, isPriority = false }) => {
  const CardContent = (
    <>
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
    </>
  );

  if (path) {
    return (
      <Link href={path} className="block relative h-full w-full rounded-lg shadow-lg overflow-hidden group cursor-pointer z-20">
        {CardContent}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className="relative h-full w-full rounded-lg shadow-lg overflow-hidden group cursor-pointer z-20" role="button" tabIndex={0}>
      {CardContent}
    </div>
  );
};


export default IssueCard;
