import Image from 'next/image';
import Link from 'next/link';
import type { User, Title } from '@prisma/client';

// Userオブジェクトに、関連するTitleも含まれるように型を拡張
type UserWithTitle = User & {
    selectedTitle: Title | null;
};

// 親コンポーネントからuser情報を受け取るためのPropsを定義
interface UserDetailProps {
    user: UserWithTitle | null;
    unsubmittedAssignmentCount: number;
}

export default async function UserDetail({ user, unsubmittedAssignmentCount }: UserDetailProps) {

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
        <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm shadow-sky-100">
            {/* Top Section: Blue Gradient - Now completely clickable */}
            {/* Background adjusted to be 'lighter' while keeping white text readable - used slightly softer gradient */}
            <Link href="/profile" className="block relative group cursor-pointer !no-underline decoration-0">
                <div className="bg-gradient-to-r from-sky-100 to-cyan-100 p-6 text-white relative transition-opacity hover:opacity-95">
                    <div className="flex items-start gap-4 pointer-events-none">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-full border-2 border-white/50 shadow-md overflow-hidden bg-slate-200 transition-transform group-hover:scale-105">
                                <Image src={user?.icon || "/images/test_icon.webp"} alt="Icon" width={80} height={80} className="w-full h-full object-cover" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1 text-cyan-800">
                                <span className="text-sm font-bold opacity-90 font-mono">RANK</span>
                                <span className="text-3xl font-bold">{user?.level ?? 1}</span>
                            </div>

                            <h2 className="text-xl font-bold truncate leading-tight mb-2 text-black !no-underline border-none outline-none">
                                {user?.username || 'ゲスト'}
                            </h2>

                            {/* Progress Bar - Blue Gradient */}
                            <div className="w-full bg-blue-500 h-2.5 rounded-full mb-1">
                                <div
                                    className="bg-gradient-to-r from-[#00BCD4] to-[#0288D1] h-full rounded-full shadow-sm"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                            <div className="text-right text-[10px] opacity-80 font-mono text-black">
                                {currentXpInLevel}/{requiredXpForNextLevel}
                            </div>
                        </div>
                    </div>

                    {/* Title Badge (Absolute or placed) - pointer-events-none to let click pass through */}
                    <div className="mt-2 pointer-events-none">
                        <span className="inline-block bg-[#00B4D8] text-black text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-white/20">
                            {user?.selectedTitle?.name || '称号なし'}
                        </span>
                    </div>
                </div>
            </Link>

            {/* Bottom Section: Stats Cards */}
            {/* Stats text colors updated to match Blue theme */}
            <div className="p-4 grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-2 py-3 flex flex-col items-center justify-center shadow-sm text-center">
                    <span className="text-[10px] text-blue-500 font-bold mb-1">連続ログイン</span>
                    <span className="text-xl font-bold text-black block leading-none">
                        {user?.continuouslogin ?? 0}<span className="text-xs ml-0.5 font-normal">日</span>
                    </span>
                </div>
                <div className="bg-white rounded-xl p-2 py-3 flex flex-col items-center justify-center shadow-sm text-center">
                    <span className="text-[10px] text-blue-500 font-bold mb-1">総ログイン</span>
                    <span className="text-xl font-bold text-black block leading-none">
                        {user?.totallogin ?? 0}<span className="text-xs ml-0.5 font-normal">日</span>
                    </span>
                </div>
                <div className="bg-white rounded-xl p-2 py-3 flex flex-col items-center justify-center shadow-sm text-center">
                    <span className="text-[10px] text-blue-500 font-bold mb-1">課題</span>
                    <span className="text-xl font-bold text-black block leading-none">
                        {unsubmittedAssignmentCount}
                    </span>
                </div>
            </div>
        </div>
    );
}