import { prisma } from '@/lib/prisma';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Imageコンポーネントをインポート


export default async function Account() {

    const user = await prisma.user.findUnique({
        where: {
            id: "9999", // IDが40のユーザーを検索
        },
    });

    return (
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
                        <span className="text-[#5FE943] text-[20px] font-bold ml-2">{user.level}</span>
                    ) : (
                        <span className='text-[#5FE943] text-[20px] font-bold ml-2'>1</span>
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
            <div className='flex items-center justify-end rounded-full h-24 w-24 bg-white overflow-hidden relative'>
                <Link href="/" className="">
                    <Image
                        src="/images/test_icon.webp"
                        alt="ユーザーアイコン"
                        width={96}
                        height={96}
                        className="w-full h-full rounded-full object-cover"
                    />
                </Link>
            </div>
        </div>
    );
}