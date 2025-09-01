import Image from 'next/image';
import type { User,Title } from '@prisma/client';

// Userオブジェクトに、関連するTitleも含まれるように型を拡張
type UserWithTitle = User & {
  selectedTitle: Title | null;
};

// 親コンポーネントからuser情報を受け取るためのPropsを定義
interface UserDetailProps {
  user: UserWithTitle | null;
}

export default async function UserDetail({ user }: UserDetailProps) {

 

  // 5. DBから取得したユーザーが見つからない場合も、ここで処理を中断します
  if (!user) {
    return <div>ユーザーが見つかりません。</div>;
  }   
  
    const requiredXpForNextLevel = 1000;
    // 総経験値(user.xp)を1000で割った余り = 現在のレベルでの経験値
    const currentXpInLevel = (user.xp ?? 0) % requiredXpForNextLevel;
    // バーの幅をパーセンテージで計算
    const progressPercentage = (currentXpInLevel / requiredXpForNextLevel) * 100;

    return (
        <div className="flex flex-col w-full max-w-150 h-100 rounded-lg shadow-lg p-4">
            <div className="flex items-center w-full h-50 gap-10 pl-10">
                <div className="w-30 h-30">
                    <Image src={user?.icon || "/images/test_icon.webp"} alt="Test Icon" width={120} height={120} className="rounded-full"/>
                </div>
                <div className="flex flex-col justify-center items-center h-30 gap-2">
                    {user ? (
                        <p className="text-2xl font-bold truncate max-w-70">{user.username}</p>
                    ):(
                        <p className="text-2xl font-bold">ゲスト</p>
                    )
                    }
                    <p className="text-lg">{user.selectedTitle?.name || '称号なし'}</p>
                </div>
            </div>
            <div className="flex flex-col w-full h-20 mt-2 px-6">
                <div className="flex items-center h-16">
                    <p className="text-xl">ランク：</p>
                    {user ? (
                        <p className="text-2xl font-bold ml-2">{user?.level ?? 1}</p>
                    ):(
                        <p className="text-2xl font-bold ml-2">1</p>
                    )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-5 relative overflow-hidden mt-2">
                    <div className="bg-lime-400 rounded-full h-full absolute top-0 left-0" style={{ width: `${progressPercentage}%`}}>
                    </div>
                </div>
                <div className="text-right text-sm font-mono text-gray-500 mt-1">
                    {currentXpInLevel} / {requiredXpForNextLevel}
                </div>
            </div>
            <div className="flex justify-center items-center w-full h-50 gap-10 mt-4">
                <div className="inline-flex bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="flex flex-col justify-center items-center px-4 py-2 border-r border-gray-300 w-35 h-25 gap-2">
                        <span className="text-sm text-gray-600">連続ログイン</span>
                        <span className="text-2xl font-bold text-gray-800">{user?.continuouslogin ?? 0}日</span>
                    </div>
                    <div className="flex flex-col justify-center items-center px-4 py-2 border-r border-gray-300 w-35 h-25 gap-2">
                        <span className="text-sm text-gray-600">総ログイン日数</span>
                        <span className="text-2xl font-bold text-gray-800">{user?.totallogin ?? 0}日</span>
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