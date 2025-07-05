'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Imageコンポーネントをインポート
import { useRouter } from 'next/navigation'; // next/navigationからインポート
import { User } from '@prisma/client';

type HeaderProps = {
  user: User | null; // ユーザー情報を受け取る
};

export default function Header({user}: HeaderProps) {

  const router = useRouter();

  // ログアウト処理を行う非同期関数
  const handleLogout = async () => {
    try {
      // ステップ1で作成したログアウトAPIを呼び出す
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('ログアウトに失敗しました');
      }
      
      // API呼び出しが成功したら、ログインページに遷移する
      router.push('/auth/login');

    } catch (error) {
      console.error(error);
      alert('ログアウト処理に失敗しました。');
    }
  };

  return (
    <header className="bg-[#fff] text-white border-b border-gray-200 flex w-full">
      <div className="flex items-center w-50 h-20 mx-4">
        <Link href={"/"} className="text-2xl font-bold transition-colors">
          <Image
            src="/images/infopia_logo.png"
            alt='Infopia'
            width={200}
            height={50}
          />
        </Link>
      </div>


      <div className='flex items-center'>
        <nav>
          <ul className="flex space-x-6">
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <button onClick={() => router.push('/home')} className="hover:bg-[#ddd] flex flex-col transition-colors justify-center items-center rounded">
                <Image
                  src="/images/home.png"
                  alt="ホーム"
                  width={40}
                  height={40}
                />
                <span className='text-gray-800'>ホーム</span>
              </button>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              {/* ここが既に /issue_list にリンクしています */}
              <button onClick={() => router.push('/issue_list')} className="hover:bg-[#ddd] flex flex-col transition-colors justify-center items-center rounded">
                <Image
                  src="/images/question_list.png"
                  alt="問題一覧"
                  width={40}
                  height={40}
                />
                <span className='text-gray-800'>問題一覧</span>
              </button>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <button onClick={() => router.push('/')} className="hover:bg-[#ddd] flex flex-col transition-colors justify-center items-center rounded">
                <Image
                  src="/images/question_create.png"
                  alt="問題作成"
                  width={40}
                  height={40}
                />
                <span className='text-gray-800'>問題作成</span>
              </button>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <button onClick={() => router.push('/')} className="hover:bg-[#ddd] flex flex-col transition-colors justify-center items-center rounded">
                <Image
                  src="/images/group.png"
                  alt="グループ"
                  width={40}
                  height={40}
                />
                <span className='text-gray-800'>グループ</span>
              </button>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <button onClick={() => router.push('/')} className="hover:bg-[#ddd] flex flex-col transition-colors justify-center items-center rounded">
                <Image
                  src="/images/assignment.png"
                  alt="提出"
                  width={40}
                  height={40}
                />
                <span className='text-gray-800'>提出</span>
              </button>
            </div>
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <button onClick={() => router.push('/')} className="hover:bg-[#ddd] flex flex-col transition-colors justify-center items-center rounded">
                <Image
                  src="/images/event.png"
                  alt="イベント"
                  width={40}
                  height={40}
                />
                <span className='text-gray-800'>イベント</span>
              </button>
            </div>

            {/* ログアウト */}
            <div className='flex w-20 h-20 items-center justify-center m-0'>
              <button onClick={handleLogout} className="hover:bg-[#ddd] flex flex-col transition-colors justify-center items-center rounded">
                <Image
                  src="/images/logout.png"
                  alt="ログアウト"
                  width={40}
                  height={40}
                />
                <span className='text-gray-800'>ログアウト</span>
              </button>
            </div>


          </ul>
        </nav>
      </div>
      <div className='flex items-center ml-auto mr-2 w-40 h-20'>
        <div className='flex flex-col items-center justify-center w-25 h-20'>
          <div className='flex w-full h-8 justify-center items-center'>
            <Image
              src="/images/Rank.png"
              alt="ランク"
              width={40}
              height={20}
            />
            {user ? (
              <span className="text-[#5FE943] text-[24px] font-bold ml-2">{user.level}</span>
            ):(
              <span className='text-[#5FE943] text-[24px] font-bold ml-2'>1</span>
            )}
          </div>
          <div className='flex w-full h-8 justify-center'>
            <Image
              src="/images/test_login.png"
              alt="連続ログイン日数"
              width={60}
              height={30}
            />
          </div>
        </div>
        <div className='flex items-center justify-end rounded-full h-15 w-15 bg-white'>
          <Link href="/" className="">
            <Image
              src="/images/test_icon.webp"
              alt="ユーザーアイコン"
              width={60}
              height={60}
              className="rounded-full"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
