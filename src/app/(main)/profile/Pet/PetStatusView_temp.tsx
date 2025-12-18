'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lightbulb, Edit3, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updatePetName } from '@/lib/actions'; // 👈 後で作成するサーバーアクション
import { getEvolvedImageSrc, SubjectProgress } from '@/components/kohakuUtils';


// Props に adviceText を追加
interface PetStatusViewProps {
  initialHunger: number; // 画像表示のために残す
  userLevel: number; // 進化判定用に追加
  subjectProgress: SubjectProgress[]; // 進化分岐判定用に追加
  evolutionType?: string | null; // DB保存された進化タイプ
  adviceText?: string | null; // AIアドバイスを受け取る (オプショナル)
  maxHunger: number; // Props としては受け取るが今回は表示に使わない
  petname: string; // ペットの名前を受け取る
  petBirthdate: string | null; // ペットの誕生日 
}

// 空腹度に応じた設定を返すヘルパー関数
const getStatusConfig = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return {
      suffix: 'smile',
      legacyImage: '/images/Kohaku/kohaku-full.png', // 進化前の画像
      statusText: '満腹',
      colorClass: 'bg-gradient-to-r from-green-400 to-lime-500', // 緑色
    };
  } else if (hungerLevel >= 100) {
    return {
      suffix: 'base',
      legacyImage: '/images/Kohaku/kohaku-normal.png',
      statusText: '普通',
      colorClass: 'bg-gradient-to-r from-sky-400 to-cyan-500',   // 水色
    };
  } else if (hungerLevel >= 50) {
    return {
      suffix: 'cry',
      legacyImage: '/images/Kohaku/kohaku-hungry.png',
      statusText: '空腹',
      colorClass: 'bg-gradient-to-r from-amber-400 to-orange-500', // オレンジ色
    };
  } else {
    return {
      suffix: 'death',
      legacyImage: '/images/Kohaku/kohaku-starving.png',
      statusText: '死にかけ…',
      colorClass: 'bg-gradient-to-r from-red-500 to-rose-600', // 赤色
    };
  }
};

// 満腹度、ユーザーレベル、学習進捗に応じた画像パスを返すヘルパー関数
const getPetDisplayInfo = (hungerLevel: number, userLevel: number, subjectProgress: SubjectProgress[], evolutionType?: string | null) => {
  // 1. 設定を取得
  const config = getStatusConfig(hungerLevel);

  // 2. DBに保存された進化タイプがある場合は、それを優先して表示
  if (evolutionType) {
    return { image: `/images/evolution/${evolutionType}-${config.suffix}.png` };
  }

  // 3. ユーザーレベルが30以上の場合は、進化ロジックを適用し続ける（引き継ぎ表示 - フォールバック）
  if (userLevel >= 30) {
    // 進化後のベース画像パスを取得 (例: /images/evolution/A-A-base.png)
    let evolvedBaseSrc = getEvolvedImageSrc(subjectProgress);

    // 学習データがない場合でも、レベル30以上ならデフォルトの進化画像(A-A)を適用して状態を維持する
    if (!evolvedBaseSrc.includes('/images/evolution/')) {
      evolvedBaseSrc = '/images/evolution/A-A-base.png';
    }

    // 進化画像 (/images/evolution/...) が返ってきた場合のみ、表情差分を適用
    // (学習データ不足などでデフォルトのコハク画像が返ってきた場合は、下の通常処理へ流す)
    if (evolvedBaseSrc.includes('/images/evolution/')) {
      // 'base.png' を suffix (smile, base, cry, death) に置換して表情差分を適用
      // 例: /images/evolution/A-A-base.png -> /images/evolution/A-A-smile.png
      return { image: evolvedBaseSrc.replace('base.png', `${config.suffix}.png`) };
    }
  }

  // 4. 通常画像 (Lv29以下、または進化データ不足時)
  return { image: config.legacyImage };
};

export default function PetStatusView({ initialHunger, userLevel, subjectProgress = [], evolutionType, maxHunger, adviceText, petname, petBirthdate }: PetStatusViewProps) {
  const router = useRouter();
  const petInfo = getPetDisplayInfo(initialHunger, userLevel, subjectProgress, evolutionType);

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

    // XSS対策: 入力値をサニタイズ
    const sanitizedName = trimmedName;

    // サニタイズ後に空になった場合もキャンセル (すべてタグだった場合など)
    if (sanitizedName === '') {
      toast.error('無効な名前です。');
      setIsEditing(false);
      setNewName(petname);
      return;
    }

    startTransition(async () => {
      try {
        const result = await updatePetName(sanitizedName); // サーバーアクション呼び出し
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