import Image from 'next/image';
import { prisma } from '@/lib/prisma';

export default async function UserDetail() {

    const user = await prisma.user.findUnique({
        where: {
            id: 9999, // 神のIDを検索
        },
    });
   
    let progressPercentage = 0;
    let currentXpInLevel = 0;
    const requiredXpForLevelUp = 1000;

    if (user) {
        // 1. 現在のレベルでの経験値を取得
        currentXpInLevel = user.xp % requiredXpForLevelUp;

        // 2. パーセンテージを計算
        progressPercentage = (currentXpInLevel / requiredXpForLevelUp) * 100;
    }

    return (
        <div className="flex flex-col w-full max-w-150 h-100 rounded-lg shadow-lg p-4">
            <div className="flex items-center w-full h-50 gap-10 pl-10">
                <div className="w-30 h-30">
                    <Image src="/images/test_icon.webp" alt="Test Icon" width={120} height={120} className="rounded-full"/>
                </div>
                <div className="flex flex-col justify-center items-center h-30 gap-2">
                    {user ? (
                        <p className="text-2xl font-bold">{user.username}</p>
                    ):(
                        <p className="text-2xl font-bold">ゲスト</p>
                    )
                    }
                    <p className="text-lg">称号</p>
                </div>
            </div>
            <div className="flex flex-col w-full h-20 mt-2 px-6">
                <div className="flex items-center h-16">
                    <p className="text-xl">ランク：</p>
                    {user ? (
                        <p className="text-2xl font-bold ml-2">{user.level}</p>
                    ):(
                        <p className="text-2xl font-bold ml-2">1</p>
                    )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-5 relative overflow-hidden mt-2">
                    <div className="bg-lime-400 rounded-full h-full absolute top-0 left-0" style={{ width: `${progressPercentage}%`}}>
                    </div>
                </div>
            </div>
            <div className="flex justify-center items-center w-full h-50 gap-10 mt-4">
                <div className="inline-flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="flex flex-col justify-center items-center px-4 py-2 border-r border-gray-300 w-35 h-25 gap-2">
                        <span className="text-sm text-gray-600">連続ログイン</span>
                        <span className="text-2xl font-bold text-gray-800">{user?.continuouslogin ?? 1}日</span>
                    </div>
                    <div className="flex flex-col justify-center items-center px-4 py-2 border-r border-gray-300 w-35 h-25 gap-2">
                        <span className="text-sm text-gray-600">総ログイン日数</span>
                        <span className="text-2xl font-bold text-gray-800">{user?.totallogin ?? 1}日</span>
                    </div>
                    <div className="flex flex-col justify-center items-center px-4 py-2 w-30 h-25 gap-2">
                        <span className="text-sm text-gray-600">残課題</span>
                        <span className="text-2xl font-bold text-gray-800">0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}