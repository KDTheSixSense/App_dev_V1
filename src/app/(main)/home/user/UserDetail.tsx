import Image from 'next/image';
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
        <div className="w-full bg-[#e0f4f9] rounded-2xl overflow-hidden shadow-sm shadow-sky-100">
            {/* Top Section: Blue Gradient */}
            <div className="bg-gradient-to-r from-sky-400 to-cyan-500 p-6 text-white relative">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full border-2 border-white/50 shadow-md overflow-hidden flex-shrink-0 bg-slate-200">
                        <Image src={user?.icon || "/images/test_icon.webp"} alt="Icon" width={80} height={80} className="w-full h-full object-cover" />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-bold opacity-90 font-mono">RANK</span>
                            <span className="text-3xl font-bold">{user?.level ?? 1}</span>
                        </div>
                        <h2 className="text-xl font-bold truncate leading-tight mb-2">
                            {user?.username || 'ゲスト'}
                        </h2>

                        {/* Progress Bar */}
                        <div className="w-full bg-black/20 h-1.5 rounded-full mb-1">
                            <div
                                className="bg-white h-full rounded-full opacity-90"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        <div className="text-right text-[12px] opacity-80 font-mono">
                            {currentXpInLevel}/{requiredXpForNextLevel}
                        </div>
                    </div>
                </div>

                {/* Title Badge (Absolute or placed) */}
                <div className="mt-2">
                    <span className="inline-block bg-[#00B4D8] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-white/20">
                        {user?.selectedTitle?.name || '称号なし'}
                    </span>
                </div>
            </div>

            {/* Bottom Section: Stats Cards */}
            <div className="p-4 grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-2 py-3 flex flex-col items-center justify-center shadow-sm text-center">
                    <span className="text-[12px] text-slate-500 font-bold mb-1">連続ログイン</span>
                    <span className="text-xl font-bold text-slate-700 block leading-none">
                        {user?.continuouslogin ?? 0}<span className="text-xs ml-0.5 font-normal">日</span>
                    </span>
                </div>
                <div className="bg-white rounded-xl p-2 py-3 flex flex-col items-center justify-center shadow-sm text-center">
                    <span className="text-[12px] text-slate-500 font-bold mb-1">総ログイン</span>
                    <span className="text-xl font-bold text-slate-700 block leading-none">
                        {user?.totallogin ?? 0}<span className="text-xs ml-0.5 font-normal">日</span>
                    </span>
                </div>
                <div className="bg-white rounded-xl p-2 py-3 flex flex-col items-center justify-center shadow-sm text-center">
                    <span className="text-[12px] text-slate-500 font-bold mb-1">課題</span>
                    <span className="text-xl font-bold text-slate-700 block leading-none">
                        {unsubmittedAssignmentCount}
                    </span>
                </div>
            </div>
        </div>
    );
}