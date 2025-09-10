'use client';

import React from 'react';
// Link, Image, useRouter はNext.js固有のため削除
import type { User } from '@prisma/client';

type HeaderProps = {
  user: User | null; // ユーザー情報を受け取る
};

export default function Header({ user }: HeaderProps) {
  // useRouterは使わないため削除

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
    { href: '/home', icon: '/images/home.png', label: 'ホーム' },
    { href: '/issue_list', icon: '/images/question_list.png', label: '問題一覧' },
    { href: '/CreateProgrammingQuestion', icon: '/images/question_create.png', label: '問題作成' },
    { href: '/group', icon: '/images/group.png', label: 'グループ' },
    { href: '/', icon: '/images/assignment.png', label: '提出' },
    { href: '/', icon: '/images/event.png', label: 'イベント' },
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
              <button onClick={() => window.location.href = item.href} className="w-20 h-20 flex flex-col items-center justify-center rounded-lg hover:bg-[#B9E2E2] transition-colors">
                <img src={item.icon} alt={item.label} width={40} height={40} />
                <span className='text-gray-800 text-sm mt-1'>{item.label}</span>
              </button>
            </li>
          ))}
          <li>
            <button onClick={handleLogout} className="w-24 h-20 flex flex-col items-center justify-center rounded-lg hover:bg-[#B9E2E2] transition-colors">
              <img src="/images/logout.png" alt="ログアウト" width={40} height={40} />
              <span className='text-gray-800 text-sm mt-1'>ログアウト</span>
            </button>
          </li>
        </ul>
      </nav>
      
      {/*ここにペット譲歩を表示したい*/}
      <div>
      </div>
      
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
