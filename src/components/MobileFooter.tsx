'use client';

import Link from 'next/link';
import React from 'react';
import { FaHome, FaList, FaTasks, FaUsers, FaCalendarAlt, FaBars, FaTimes, FaUser, FaEdit, FaHistory, FaCode, FaSearch, FaGamepad, FaShieldAlt, FaFileContract, FaUserShield } from 'react-icons/fa'; // Importing icons
import Image from 'next/image';
import { UserWithPetStatus } from '@/app/(main)/layout';
import type { User, Status_Kohaku } from '@prisma/client';


const MAX_HUNGER = 200; // 満腹度の最大値

const getPetDisplayState = (hungerLevel: number) => {
  if (hungerLevel >= 150) {
    return {
      icon: '/images/Kohaku/kohaku-full.png',      // 満腹の画像
      suffix: 'smile',
      colorClass: 'bg-gradient-to-r from-green-400 to-lime-500', // 緑色
    };
  } else if (hungerLevel >= 100) {
    return {
      icon: '/images/Kohaku/kohaku-normal.png',    // 普通の画像
      suffix: 'base',
      colorClass: 'bg-gradient-to-r from-sky-400 to-cyan-500',   // 水色
    };
  } else if (hungerLevel >= 50) {
    return {
      icon: '/images/Kohaku/kohaku-hungry.png',    // 空腹の画像
      suffix: 'cry',
      colorClass: 'bg-gradient-to-r from-amber-400 to-orange-500', // オレンジ色
    };
  } else {
    return {
      icon: '/images/Kohaku/kohaku-starving.png',  // 死にかけの画像
      suffix: 'death',
      colorClass: 'bg-gradient-to-r from-red-500 to-rose-600', // 赤色
    };
  }
};

type MobileFooterProps = {
  userWithPet: UserWithPetStatus | null; // Adjust the type as necessary
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
};

const MobileFooter = ({ isMenuOpen, setIsMenuOpen, userWithPet }: MobileFooterProps) => {
  const userImage = userWithPet?.icon;

  // ペットの表示状態を計算 (進化対応)
  let petIcon = '/images/Kohaku/kohaku-normal.png'; // デフォルト
  let petColorClass = 'bg-gradient-to-r from-sky-400 to-cyan-500';

  if (userWithPet?.status_Kohaku) {
    const { hungerlevel } = userWithPet.status_Kohaku;
    const displayState = getPetDisplayState(hungerlevel);

    petIcon = displayState.icon;
    petColorClass = displayState.colorClass;

    // 進化タイプのチェック
    const evolutionType = (userWithPet.status_Kohaku as any).evolutionType;
    if (evolutionType) {
      petIcon = `/images/evolution/${evolutionType}-${displayState.suffix}.png`;
    }
  }

  // ナビゲーションボタンのデータを配列で管理 (PC版Header.tsxと統一)
  const navItems = [
    { href: '/home', icon: '/images/home.png', label: 'ホーム' },
    { href: '/issue_list', icon: '/images/question_list.png', label: '問題一覧' },
    { href: '/CreateProgrammingQuestion', icon: '/images/question_create.png', label: '問題作成' },
    { href: '/group', icon: '/images/group.png', label: 'グループ' },
    { href: '/unsubmitted-assignments', icon: '/images/assignment.png', label: '課題' },
    { href: '/event/event_list', icon: '/images/event.png', label: 'イベント' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#D3F7FF] text-black border-t border-gray-200 md:hidden z-50 h-20 flex items-center px-4">
      <nav className="flex justify-around items-center flex-grow">
        {navItems.slice(0, 5).map((item) => ( // Show first 5 items to fit, or adjust as needed. PC has 6 items. Mobile typically fits 4-5. Let's try to fit closely or pick most important.
          // Wait, user request implies "fundamentally insufficient quantity". So I should probably show what fits or scroll.
          // PC Header has: Home, Issue List, Problem Create, Group, Assignment, Event (6 items).
          // Mobile usually fits 5 comfortably. Let's try to show them all or use the new icons for them.
          // Note: Previous code had Profile, Tasks, List, Home, Group, Event (6 items).
          // Let's stick to the new list order but maybe we need to be careful about width.
          <Link key={item.label} href={item.href} className="flex flex-col items-center text-xs text-[#546E7A] hover:bg-[#b2ebf2] transition-colors p-1 rounded-lg min-w-[3.5rem]">
            <Image src={item.icon} alt={item.label} width={24} height={24} unoptimized className="mb-1" />
            <span className="scale-90 origin-top">{item.label}</span>
          </Link>
        ))}
        <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center text-xs text-[#546E7A] hover:bg-[#b2ebf2] transition-colors p-1 rounded-lg min-w-[3.5rem]">
          <FaBars className="text-2xl mb-1 p-0.5" />
          <span className="scale-90 origin-top">メニュー</span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40" onClick={() => setIsMenuOpen(false)}></div>
      )}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform ease-out duration-300 flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-[#D3F7FF] shrink-0">
          <h2 className="text-lg font-bold">メニュー</h2>
          <button onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600">
            <FaTimes className="text-2xl" />
          </button>
        </div>
        <nav className="flex flex-col p-4 flex-grow overflow-y-auto">
          {userWithPet && (
            <div className="p-3 mb-4 bg-gray-50 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <Image src="/images/rank.png" alt="レベル" width={24} height={24} className="w-6 h-6 mr-3" />
                <span className="font-bold text-gray-800">レベル: {userWithPet.level}</span>
              </div>
              <div className="flex items-center mb-2">
                <Image src="/images/login_icon.png" alt="連続ログイン日数" width={24} height={24} className="w-6 h-6 mr-3" />
                <span className="font-bold text-gray-800">連続ログイン日数: {userWithPet.continuouslogin ?? 0}</span>
              </div>
              {userWithPet.status_Kohaku && (
                <div className="flex items-center">
                  <Image src={petIcon} alt="コハク" width={24} height={24} className="w-6 h-6 mr-3" unoptimized />
                  <span className="font-bold text-gray-800">コハク満腹度: {userWithPet.status_Kohaku.hungerlevel}/{MAX_HUNGER}</span>
                </div>
              )}
            </div>
          )}
          {/* メインナビゲーション */}
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">メイン</h3>
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center text-base text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                <Image src={item.icon} alt={item.label} width={20} height={20} className="mr-3 w-5 h-5 object-contain" unoptimized />
                {item.label}
              </Link>
            ))}
            <Link href="/CreateProgrammingQuestion" className="flex items-center text-base text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <FaEdit className="text-lg mr-3 w-5 text-gray-500" />
              問題作成
            </Link>
          </div>

          <div className="border-t border-gray-100 my-2"></div>

          {/* 学習ツール */}
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">学習ツール</h3>
            <Link href="/web_code" className="flex items-center text-base text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <FaCode className="text-lg mr-3 w-5 text-gray-500" />
              Web版コード
            </Link>
            <Link href="/customize_trace" className="flex items-center text-base text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <FaSearch className="text-lg mr-3 w-5 text-gray-500" />
              疑似言語トレース
            </Link>
            <Link href="/simulator" className="flex items-center text-base text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <FaGamepad className="text-lg mr-3 w-5 text-gray-500" />
              ノーコード
            </Link>
            <Link href="/profile/history" className="flex items-center text-base text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <FaHistory className="text-lg mr-3 w-5 text-gray-500" />
              問題解答履歴
            </Link>
          </div>

          <div className="border-t border-gray-100 my-2"></div>

          {/* 管理者メニュー (条件付き) */}
          {userWithPet?.isAdmin && (
            <>
              <div className="space-y-1">
                <h3 className="px-3 text-xs font-bold text-red-500 uppercase tracking-wider">管理者</h3>
                <Link href="/admin-audit" className="flex items-center text-base text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-bold" onClick={() => setIsMenuOpen(false)}>
                  <FaShieldAlt className="text-lg mr-3 w-5" />
                  監査ログ
                </Link>
              </div>
              <div className="border-t border-gray-100 my-2"></div>
            </>
          )}

          {/* その他 */}
          <div className="space-y-1 pb-20">
            <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">情報</h3>
            <Link href="/terms_account" className="flex items-center text-base text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <FaFileContract className="text-lg mr-3 w-5 text-gray-400" />
              利用規約
            </Link>
            <Link href="/privacypolicy_account" className="flex items-center text-base text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg" onClick={() => setIsMenuOpen(false)}>
              <FaUserShield className="text-lg mr-3 w-5 text-gray-400" />
              プライバシーポリシー
            </Link>
          </div>
        </nav>
      </div>
    </footer>
  );
};

export default MobileFooter;