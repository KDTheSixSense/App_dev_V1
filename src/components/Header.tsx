'use client';

import React from 'react';
import { useState, useEffect } from 'react';
// Link, Image, useRouter はNext.js固有のため削除
import type { User, Status_Kohaku } from '@prisma/client';

type UserWithPetStatus = User & {
  status_Kohaku: Status_Kohaku | null;
};

type HeaderProps = {
  userWithPet: UserWithPetStatus | null; // ユーザー情報を受け取る
};

type PetDisplayStatus = {
  hungerlevel: number;
  icon?: string;
  colorClass?: string;
};

const MAX_HUNGER = 200; // 満腹度の最大値

const getPetDisplayState = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return {
      icon: '/images/kohaku/kohaku-full.png',      // 満腹の画像
      colorClass: 'bg-gradient-to-r from-green-400 to-lime-500', // 緑色
    };
  } else if (hungerLevel >= 100) {
    return {
      icon: '/images/kohaku/kohaku-normal.png',    // 普通の画像
      colorClass: 'bg-gradient-to-r from-sky-400 to-cyan-500',   // 水色
    };
  } else if (hungerLevel >= 50) {
    return {
      icon: '/images/kohaku/kohaku-hungry.png',    // 空腹の画像
      colorClass: 'bg-gradient-to-r from-amber-400 to-orange-500', // オレンジ色
    };
  } else {
    return {
      icon: '/images/kohaku/kohaku-starving.png',  // 死にかけの画像
      colorClass: 'bg-gradient-to-r from-red-500 to-rose-600', // 赤色
    };
  }
};

export default function Header({ userWithPet }: HeaderProps) {
  const user = userWithPet; // 既存のコードとの互換性のため

  const [petStatus, setPetStatus] = useState<PetDisplayStatus | null>(() => {
    const initialStatus = userWithPet?.status_Kohaku;
    if (initialStatus) {
      const displayState = getPetDisplayState(initialStatus.hungerlevel);
      return {
        hungerlevel: initialStatus.hungerlevel,
        ...displayState,
      };
    }
    return null;
  });

    // ペットのステータスをAPIから再取得して、Stateを更新する関数
  const refetchPetStatus = async () => {
    try {
      const res = await fetch('/api/pet/status');
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          const displayState = getPetDisplayState(data.hungerlevel);
          setPetStatus({
            hungerlevel: data.hungerlevel,
            ...displayState,
          });
          console.log('ヘッダーのペット情報を更新しました。');
        }
      }
    } catch (error) {
      console.error("ペット情報の再取得に失敗:", error);
    }
  };

  useEffect(() => {
    // 'petStatusUpdated' という名前のカスタムイベントをウィンドウで監視します
    window.addEventListener('petStatusUpdated', refetchPetStatus);

    // コンポーネントが不要になった時に、イベントリスナーを解除してメモリリークを防ぎます
    return () => {
      window.removeEventListener('petStatusUpdated', refetchPetStatus);
    };
  }, []); // 空の依存配列なので、この設定はコンポーネントのマウント時に一度だけ行われます

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
    { href: '/', icon: '/images/event_slateblue.png', label: 'イベント' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full bg-[#D3F7FF] text-black border-b border-gray-200 flex items-center px-4 h-20 z-50">
      
      {/* 左側：ロゴ */}
      <div className="flex-shrink-0">
        {/* Linkをaタグに変更 */}
        <a href="/" className="transition-opacity hover:opacity-80">
          {/* Imageをimgタグに変更 */}
          <img
            src="/images/infopia_logo.png"
            alt='Infopia'
            width={200}
            height={50}
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
                <img src={item.icon} alt={item.label} width={40} height={40} />
                <span className='text-[#546E7A] text-sm mt-1 font-bold'>{item.label}</span>
              </button>
            </li>
          ))}
          <li>
            <button onClick={handleLogout} className="w-24 h-20 flex flex-col items-center justify-center rounded-lg hover:bg-[#b2ebf2] transition-colors">
              <img src="/images/logout_slateblue.png" alt="ログアウト" width={40} height={40} />
              <span className='text-[#546E7A] text-sm mt-1 font-bold'>ログアウト</span>
            </button>
          </li>
        </ul>
      </nav>
      
      {/*コハクの情報*/}
      {petStatus && (
        <div className="flex items-center gap-2 ml-20">
            {/* アイコンをStateから動的に設定 */}
            <img src={petStatus.icon} alt="ペットアイコン" width={70} height={70} />
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
      <div className="flex items-center gap-4 ml-auto">
        {/* ランクとログイン日数 */}
        <div className="flex flex-col">
          <div className="relative group flex items-center gap-2">
            <img src="/images/Rank.png" alt="ランク" width={45} height={15} />
            <div className='frex ml-auto'>
              <p className="text-[#5FE943] text-2xl font-bold select-none">{user?.level ?? 1}</p>
            </div>
            {/* ツールチップ */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-999">
              アカウントランク
             <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-gray-800"></div>
            </div>
          </div>
          <div className="relative group flex items-center gap-2">
            <div className='flex ml-3'>
              <img src="/images/login_icon.png" alt="連続ログイン日数" width={24} height={24} />
            </div>
            <div className='frex ml-auto'>
              <p className="text-[#feb75c] text-2xl font-bold select-none">{user?.continuouslogin ?? 0}</p>
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
            <img
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
