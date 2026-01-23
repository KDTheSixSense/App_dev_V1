// /workspaces/my-next-app/src/app/(main)/home/user/UserDetail.tsx

import Image from 'next/image';
import Link from 'next/link';
import type { User, Title } from '@prisma/client';

// 型定義の拡張
// Prismaの標準User型にはリレーション（selectedTitle）が含まれないため、
// ここで手動で型を交差(intersection)させて定義しています。
type UserWithTitle = User & {
    selectedTitle: Title | null;
};

// 親コンポーネントからuser情報を受け取るためのPropsを定義
interface UserDetailProps {
    user: UserWithTitle | null; // ログインしていない場合はnullが来る可能性を考慮
    unsubmittedAssignmentCount: number; // 未提出課題の数
}

export default async function UserDetail({ user, unsubmittedAssignmentCount }: UserDetailProps) {

    // 1. ガード節: ユーザーデータがない場合
    // ゲストアクセスやデータ取得エラー時のためのフォールバック表示
    if (!user) {
        return <div>ユーザーが見つかりません。</div>;
    }

    // 2. レベルアップ進捗バーの計算ロジック
    // ここでは「次のレベルまで一律1000XP」という仕様で計算しています
    const requiredXpForNextLevel = 1000;
    
    // 総経験値(user.xp)を1000で割った余り = 現在のレベルにおける獲得済みXP
    // (例: 総経験値 2500xp -> レベル2, 余り500xp -> バーは50%進む)
    const currentXpInLevel = (user.xp ?? 0) % requiredXpForNextLevel;
    
    // バーの幅をパーセンテージで計算 (CSSの width: % に使用)
    const progressPercentage = (currentXpInLevel / requiredXpForNextLevel) * 100;

    return (
        <div className="w-full bg-gradient-to-r from-[#e0f4f9] to-cyan-100 rounded-2xl overflow-hidden shadow-sm shadow-sky-100">
            
            {/* 3. 上部セクション: プロフィールリンクエリア */}
            {/* カードの上半分全体をクリック可能なリンクにしています */}
            <Link href="/profile" className="block relative group cursor-pointer !no-underline decoration-0">
                <div className="bg-gradient-to-r from-sky-100 to-cyan-100 px-6 py-4 text-white relative transition-opacity hover:opacity-95">
                    
                    {/* pointer-events-none: テキスト選択などを無効化し、クリック判定を親のLinkに委譲させています */}
                    <div className="flex items-start gap-4 pointer-events-none">
                        
                        {/* アバター画像 */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-full border-2 border-white/50 shadow-md overflow-hidden bg-slate-200 transition-transform group-hover:scale-105">
                                <Image 
                                    src={user?.icon || "/images/test_icon.webp"} 
                                    alt="Icon" 
                                    width={80} 
                                    height={80} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        </div>

                        {/* ユーザー情報詳細 (右側) */}
                        <div className="flex-1 min-w-0">
                            {/* RANK / Level 表示 */}
                            <div className="flex items-baseline gap-2 mb-1 text-cyan-800">
                                <span className="text-3xl font-bold opacity-90 font-mono">RANK</span>
                                <span className="text-3xl font-bold">{user?.level ?? 1}</span>
                            </div>

                            {/* ユーザー名 (長い場合は truncate で省略) */}
                            <h2 className="text-xl font-bold truncate leading-tight mb-2 text-black !no-underline border-none outline-none">
                                {user?.username || 'ゲスト'}
                            </h2>

                            {/* 進捗バー (Visual Progress Bar) */}
                            <div className="w-full bg-white h-2.5 rounded-full mb-1">
                                <div
                                    className="bg-gradient-to-r from-[#00BCD4] to-[#0288D1] h-full rounded-full shadow-sm"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                            
                            {/* 進捗数値テキスト (例: 500/1000) */}
                            <div className="text-right text-[12px] opacity-80 font-mono text-black">
                                {currentXpInLevel}/{requiredXpForNextLevel}
                            </div>
                        </div>
                    </div>

                    {/* 称号バッジ & Adminバッジエリア */}
                    <div className="mt-2 pointer-events-none flex gap-2">
                        {/* 選択中の称号 */}
                        <span className="inline-block bg-[#00B4D8] text-black text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-white/20">
                            {user?.selectedTitle?.name || '称号なし'}
                        </span>
                        {/* 管理者のみ表示 */}
                        {user?.isAdmin && (
                            <span className="inline-block bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-white/20">
                                Admin
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* 4. 下部セクション: スタッツカード (連続ログインなど) */}
            <div className="p-4 grid grid-cols-3 gap-3">
                {/* 連続ログイン日数 */}
                <div className="bg-white rounded-xl p-2 py-5 flex flex-col items-center justify-center shadow-sm text-center">
                    <span className="text-[12px] text-slate-500 font-bold mb-1">連続ログイン</span>
                    <span className="text-xl font-bold text-slate-700 block leading-none">
                        {user?.continuouslogin ?? 0}<span className="text-xs ml-0.5 font-normal">日</span>
                    </span>
                </div>
                
                {/* 総ログイン日数 */}
                <div className="bg-white rounded-xl p-2 py-5 flex flex-col items-center justify-center shadow-sm text-center">
                    <span className="text-[14px] text-slate-500 font-bold mb-1">総ログイン</span>
                    <span className="text-xl font-bold text-slate-700 block leading-none">
                        {user?.totallogin ?? 0}<span className="text-xs ml-0.5 font-normal">日</span>
                    </span>
                </div>
                
                {/* 残課題数 (Propsから受け取った値を表示) */}
                <div className="bg-white rounded-xl p-2 py-5 flex flex-col items-center justify-center shadow-sm text-center">
                    <span className="text-[14px] text-slate-500 font-bold mb-1">残課題</span>
                    <span className="text-xl font-bold text-slate-700 block leading-none">
                        {unsubmittedAssignmentCount}
                    </span>
                </div>
            </div>
        </div>
    );
}