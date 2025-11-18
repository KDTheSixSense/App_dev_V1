'use client';

import Link from 'next/link';
import React from 'react';
import { FaHome, FaList, FaTasks, FaUsers, FaCalendarAlt, FaBars, FaTimes, FaUser } from 'react-icons/fa'; // Importing icons
import Image from 'next/image';

import type { User, Status_Kohaku } from '@prisma/client';


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

type UserWithPetStatus = User & {
  status_Kohaku: Status_Kohaku | null;
};
type MobileFooterProps = {
  userWithPet: UserWithPetStatus | null; // Adjust the type as necessary
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
};

const MobileFooter = ({ isMenuOpen, setIsMenuOpen, userWithPet }: MobileFooterProps) => {
  const userImage = userWithPet?.icon;

  const navItems = [
    { href: '/profile', icon: FaUser, label: 'プロフィール' },
    { href: '/unsubmitted-assignments', icon: FaTasks, label: '課題' },
    { href: '/issue_list', icon: FaList, label: '問題一覧' },
    { href: '/home', icon: FaHome, label: 'ホーム' },
    { href: '/group', icon: FaUsers, label: 'グループ' },
    { href: '/event/event_list', icon: FaCalendarAlt, label: 'イベント' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#D3F7FF] text-black border-t border-gray-200 md:hidden z-50 h-20 flex items-center px-4">
      <nav className="flex justify-around items-center flex-grow">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} className="flex flex-col items-center text-xs text-[#546E7A] hover:bg-[#b2ebf2] transition-colors p-2 rounded-lg">
            {item.href === '/profile' && userImage ? (
              <Image src={userImage} alt={item.label} width={20} height={20} className="rounded-full mb-1" />
            ) : (
              <item.icon className="text-xl mb-1" />
            )}
            {item.label}
          </Link>
        ))}
        <button onClick={() => setIsMenuOpen(true)} className="flex flex-col items-center text-xs text-[#546E7A] hover:bg-[#b2ebf2] transition-colors p-2 rounded-lg">
          <FaBars className="text-xl mb-1" />
          メニュー
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm z-40" onClick={() => setIsMenuOpen(false)}></div>
      )}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform ease-out duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-[#D3F7FF]">
            <h2 className="text-lg font-bold">メニュー</h2>
            <button onClick={() => setIsMenuOpen(false)} className="text-gray-700 hover:text-blue-600">
              <FaTimes className="text-2xl" />
            </button>
          </div>
          <nav className="flex flex-col p-4 space-y-4 flex-grow">
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
                    <Image src={getPetDisplayState(userWithPet.status_Kohaku.hungerlevel).icon} alt="コハク" width={24} height={24} className="w-6 h-6 mr-3" />
                    <span className="font-bold text-gray-800">コハク満腹度: {userWithPet.status_Kohaku.hungerlevel}/{MAX_HUNGER}</span>
                  </div>
                )}
              </div>
            )}
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center text-lg text-gray-800 hover:bg-gray-100 p-3 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                {item.href === '/profile' && userImage ? (
                  <Image src={userImage} alt={item.label} width={24} height={24} className="rounded-full mr-3" />
                ) : (
                  <item.icon className="text-2xl mr-3" />
                )}
                {item.label}
              </Link>
            ))}
            {/* Add logout or other menu items here if needed */}
          </nav>
        </div>
    </footer>
  );
};

export default MobileFooter;