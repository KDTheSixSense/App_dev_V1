'use client';

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image'; // Imageコンポーネントをインポート
// Link, Image, useRouter はNext.js固有のため削除
import type { User, Status_Kohaku } from '@prisma/client';

type UserWithPetStatus = User & {
  status_Kohaku: Status_Kohaku | null;
};

type HeaderProps = {
  userWithPet: UserWithPetStatus | null; // ユーザー情報を受け取る
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
};

type PetDisplayStatus = {
  hungerlevel: number;
  icon: string; // undefinedの可能性を排除
  colorClass?: string;
};

const MAX_HUNGER = 200; // 満腹度の最大値

const getPetDisplayState = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return {
      icon: '/images/Kohaku/kohaku-full.png',      // 満腹の画像
      colorClass: 'bg-gradient-to-r from-green-400 to-lime-500', // 緑色
    };
  } else if (hungerLevel >= 100) {
    return {
      icon: '/images/Kohaku/kohaku-normal.png',    // 普通の画像
      colorClass: 'bg-gradient-to-r from-sky-400 to-cyan-500',   // 水色
    };
  } else if (hungerLevel >= 50) {
    return {
      icon: '/images/Kohaku/kohaku-hungry.png',    // 空腹の画像
      colorClass: 'bg-gradient-to-r from-amber-400 to-orange-500', // オレンジ色
    };
  } else {
    return {
      icon: '/images/Kohaku/kohaku-starving.png',  // 死にかけの画像
      colorClass: 'bg-gradient-to-r from-red-500 to-rose-600', // 赤色
    };
  }
};

export default function Header({ userWithPet, isMenuOpen, setIsMenuOpen }: HeaderProps) {
  const user = userWithPet; // 既存のコードとの互換性のため

  // 1. ランク(level)のstate
  const [rank, setRank] = useState(() => userWithPet?.level ?? 1);
  
  // 2. 連続ログイン日数のstate
  const [continuousLogin, setContinuousLogin] = useState(() => userWithPet?.continuouslogin ?? 0);

  // 3. ペット情報のstate
  const [petStatus, setPetStatus] = useState<PetDisplayStatus | null>(() => {
    const initialStatus = userWithPet?.status_Kohaku;
    if (initialStatus) {
      const displayState = getPetDisplayState(initialStatus.hungerlevel);
      return {
        hungerlevel: initialStatus.hungerlevel,
        ...displayState,
      };
    }
    // ユーザーはいるがペット情報がない場合 (フォールバック)
    if (userWithPet) {
        const displayState = getPetDisplayState(MAX_HUNGER);
        console.log("[Header Debug] Initial petStatus (fallback for no status_Kohaku):", { hungerlevel: MAX_HUNGER, ...displayState });
        return { hungerlevel: MAX_HUNGER, ...displayState };
    }
    console.log("[Header Debug] Initial petStatus (no userWithPet): null");
    return null;  });

    // 4. ペットのステータスをAPIから再取得して、Stateを更新する関数
  // (useCallbackでラップ)
  const refetchPetStatus = useCallback(async (isPeriodicCheck: boolean = false) => {
    console.log("[Header Debug] refetchPetStatus called.");
    try {
      const res = await fetch('/api/pet/status', { cache: 'no-store' }); // キャッシュを無効化
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          const displayState = getPetDisplayState(data.hungerlevel);
          
          let hungerLevelChanged = false;
          setPetStatus(prevStatus => {
            if (prevStatus?.hungerlevel !== data.hungerlevel) {
              hungerLevelChanged = true;
            }
            return {
              hungerlevel: data.hungerlevel,
              ...displayState,
            };
          });
          
          setRank(data.level);
          setContinuousLogin(data.continuouslogin);
          
          // 定期チェックで満腹度が変わっていたら、イベントを発火
          if (isPeriodicCheck && hungerLevelChanged) {
            console.log("[Header Debug] Hunger level changed on periodic check. Dispatching event.");
            window.dispatchEvent(new CustomEvent('petStatusUpdated'));
          }
        }
      } else {
        console.error("[Header Debug] Failed to fetch pet status. Response not OK:", res.status, await res.text());
      }
    } catch (error) {
      console.error("[Header Debug] ペット情報の再取得に失敗:", error);
    }
  }, []); // 空の依存配列

  // レンダリング直前にpetStatus.iconの値をログ出力
  console.log("[Header Debug] petStatus.icon before img tag:", petStatus?.icon);

  useEffect(() => {
      // ページ読み込み時にも最新の情報を取得
    if (userWithPet) { // ログインしている場合のみ
      const timerId = setTimeout(() => {
        refetchPetStatus();
      }, 500); // 500ms遅延実行

      // addEventListener 用のラッパー関数を定義
      const handlePetStatusUpdate = () => {
        refetchPetStatus(false); // isPeriodicCheck = false
      };

      // ラッパー関数をリスナーに登録
      window.addEventListener('petStatusUpdated', handlePetStatusUpdate);

      // 満腹度減少を同期間隔タイマー（1分ごと）
      const intervalId = setInterval(() => {
        if (userWithPet) {
          refetchPetStatus(true); // 定期チェックであることを示すフラグを立てる
        }
      }, 60000); // 60000ms = 1分

      // コンポーネントが不要になった時に、イベントリスナーとタイマーを解除
      return () => {
        clearTimeout(timerId); // 遅延実行タイマーを解除
        // ラッパー関数を解除
        window.removeEventListener('petStatusUpdated', handlePetStatusUpdate);
        clearInterval(intervalId); // 定期実行タイマーを解除
      };
    }
  }, [userWithPet, refetchPetStatus]); // 依存配列に refetchPetStatus を追加

  // ログアウト処理を行う非同期関数
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('ログアウトに失敗しました');
      }
      // router.pushの代わりに、標準の画面遷移を使用
      window.location.href = '/auth/login';
    } catch (error) { // ★★★ catchブロックの括弧{}を修正しました ★★★
      console.error(error);
      // alertは使用しない方が良いため、コンソールエラーに留めます
    }
  };

  // ナビゲーションボタンのデータを配列で管理
  const navItems = [
    { href: '/home', icon: '/images/home_slateblue.png', label: 'ホーム' },
    { href: '/issue_list', icon: '/images/question_list_slateblue.png', label: '問題一覧' },
    { href: '/CreateProgrammingQuestion', icon: '/images/question_create_slateblue.png', label: '問題作成' },
    { href: '/group', icon: '/images/group_slateblue.png', label: 'グループ' },
    //提出機能とイベント機能はまだ完成してないから一旦コメントアウトで隠しておく
    { href: '/unsubmitted-assignments', icon: '/images/assignment_slateblue.png', label: '課題' },
    { href: '/event/event_list', icon: '/images/event_slateblue.png', label: 'イベント' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full bg-[#D3F7FF] text-black border-b border-gray-200 hidden md:flex items-center px-4 h-20 z-50">
      
      {/* 左側：ロゴ */}
      <div className="flex-shrink-0 ml-3">
        {/* Linkをaタグに変更 */}
        <a href="/home" className="transition-opacity hover:opacity-80">
          {/* Imageをimgタグに変更 */}
          <Image
            src="/images/Infopia_logo.png"
            alt='Infopia'
            width={150}
            height={75}
          />
        </a>
      </div>

      {/* 中央：ナビゲーション */}
      <nav className="hidden md:flex ml-5">
        <ul className="flex items-center space-x-2">
          {navItems.map((item) => (
            <li key={item.label}>
              {/* router.pushをwindow.location.hrefに変更 */}
              <button onClick={() => window.location.href = item.href} className="w-20 h-20 flex flex-col items-center justify-center rounded-lg hover:bg-[#b2ebf2] transition-colors">
                <Image src={item.icon} alt={item.label} width={40} height={40} />
                <span className='text-[#546E7A] text-sm mt-1 font-bold'>{item.label}</span>
              </button>
            </li>
          ))}
          <li>
            <button onClick={handleLogout} className="w-24 h-20 flex flex-col items-center justify-center rounded-lg hover:bg-[#b2ebf2] transition-colors">
              <Image src="/images/logout_slateblue.png" alt="ログアウト" width={40} height={40} />
              <span className='text-[#546E7A] text-sm mt-1 font-bold'>ログアウト</span>
            </button>
          </li>
        </ul>
      </nav>
      
      {/*コハクの情報*/}
      {petStatus && (
        <div className="flex items-center gap-2 ml-auto">
            {/* アイコンをStateから動的に設定 */}
            <Image src={petStatus.icon} alt="ペットアイコン" width={70} height={70} />
            <div className="w-50">
                <div className="w-full bg-gray-300 rounded-full h-5 overflow-hidden">
                    <div
                        // ゲージの色をStateから動的に設定
                        className={`${petStatus.colorClass} h-full rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${(petStatus.hungerlevel / MAX_HUNGER) * 100}%` }}
                    />
                </div>
            </div>
        </div>
      )}

      {/* 右側：ユーザー情報 */}
      <div className="flex items-center gap-4 ml-6">
        {/* ランクとログイン日数 */}
        <div className="flex flex-col">
          <div className="relative group flex items-center gap-2">
            <Image src="/images/rank.png" alt="ランク" width={45} height={15} />
            <div className='flex ml-auto'>
              <p className="text-[#5FE943] text-2xl font-bold select-none">{rank}</p>
            </div>
            {/* ツールチップ */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-999">
              アカウントランク
             <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-gray-800"></div>
            </div>
          </div>
          <div className="relative group flex items-center gap-2">
            <div className='flex ml-3'>
              <Image src="/images/login_icon.png" alt="連続ログイン日数" width={24} height={24} />
            </div>
            <div className='flex ml-auto'>
              <p className="text-[#feb75c] text-2xl font-bold select-none">{continuousLogin}</p>
            </div>
            {/* ツールチップ */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-999">
              連続ログイン日数
             <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-gray-800"></div>
            </div>
          </div>
        </div>
        
        {/* プロフィールアイコン */}
        <div className="w-14 h-14">
          <a href="/profile">
            <Image
              src={user?.icon || "/images/test_icon.webp"}
              alt="ユーザーアイコン"
              width={56}
              height={56}
              className="rounded-full object-cover transition"
            />
          </a>
        </div>
      </div>
    </header>
  );
}
