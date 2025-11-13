'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lightbulb, Edit3, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updatePetName } from '@/lib/actions'; // 👈 後で作成するサーバーアクション

// Props に adviceText を追加
interface PetStatusViewProps {
  initialHunger: number; // 画像表示のために残す
  adviceText?: string | null; // AIアドバイスを受け取る (オプショナル)
  maxHunger: number; // Props としては受け取るが今回は表示に使わない
  petname: string; // ペットの名前を受け取る
  petBirthdate: string | null; // ペットの誕生日 
}

// 満腹度に応じた画像パスを返すヘルパー関数 (変更なし)
const getPetDisplayInfo = (hungerLevel: number) => {
    if (hungerLevel >= 150) {
    return { image: '/images/Kohaku/kohaku-full.png' };
  } else if (hungerLevel >= 100) {
    return { image: '/images/Kohaku/kohaku-normal.png' };
  } else if (hungerLevel >= 50) {
    return { image: '/images/Kohaku/kohaku-hungry.png' };
  } else {
    return { image: '/images/Kohaku/kohaku-starving.png' };
  }
};

export default function PetStatusView({ initialHunger, maxHunger, adviceText, petname, petBirthdate }: PetStatusViewProps) {
  const router = useRouter();
  const petInfo = getPetDisplayInfo(initialHunger);

  // --- [追加] 編集モードと名前を管理する State ---
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(petname);
  const [isPending, startTransition] = useTransition();

  // 外部から渡される petName が変わったら、入力欄のStateもリセットする
  useEffect(() => {
    setNewName(petname);
  }, [petname]);

  // --- [追加] 名前を保存するハンドラ ---
  const handleSaveName = () => {
    const trimmedName = newName.trim();

    // 名前が空か、変更されていない場合はキャンセル
    if (trimmedName === '' || trimmedName === petname) {
      setIsEditing(false);
      setNewName(petname);
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePetName(trimmedName); // サーバーアクション呼び出し
        if (result.success) {
          toast.success('名前を変更しました！');
          setIsEditing(false);
          router.refresh(); // サーバーから最新のpropsを再取得してUIを更新
        } else {
          toast.error(result.error || '名前の変更に失敗しました。');
          setNewName(petname); // 失敗したら元の名前に戻す
        }
      } catch (err) {
        toast.error('エラーが発生しました。');
        setNewName(petname);
      }
    });
  };

  // --- [追加] 編集をキャンセルするハンドラ ---
  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewName(petname);
  };

  return (
    <div className="flex flex-col h-full justify-between items-center p-6 bg-white rounded-lg shadow-lg">

      {/* 1. キャラクター画像 (変更なし) */}
      <div className="w-60 h-60 relative">
        <Image
          src={petInfo.image}
          alt={petname} // altテキストを動的に変更
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain"
        />
      </div>

      {/* 2. [追加] ペットの名前 (編集機能付き) */}
      <div className="w-full text-center my-4">
        {isEditing ? (
          // --- 編集中のUI ---
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-3 py-2 border border-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
              maxLength={20} // 20文字制限 (例)
            />
            <button
              onClick={handleSaveName}
              disabled={isPending}
              className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50"
              aria-label="保存"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isPending}
              className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50"
              aria-label="キャンセル"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          // --- 表示中のUI ---
          <div className="flex items-center justify-center gap-2 h-[46px]"> {/* 高さを編集時と合わせる */}
            <p className="text-xl font-bold text-gray-800">
              {petname}
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
              aria-label="名前を編集"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* 誕生日 (お迎え日) */}
        {petBirthdate && (
          <div className="flex items-center justify-center text-sm text-gray-500 mt-2">
            <span>お迎え日: {petBirthdate}</span>
          </div>
        )}
      </div>

      {/* 3. AIアドバイス欄 (変更なし) */}
      <div className="w-full bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md text-base text-gray-700 h-24 overflow-y-auto">
        <div className="flex items-start">
          <Lightbulb className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
          <p>{adviceText}</p>
        </div>
      </div>
    </div>
  );
}