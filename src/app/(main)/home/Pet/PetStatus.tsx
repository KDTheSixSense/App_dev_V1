import Image from 'next/image';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import PetStatusView from './PetStatusView'; // すぐ下に作成するクライアントコンポーネントをインポート

// セッションデータの型を定義
interface SessionData {
  user?: {
    id: string;
    email: string;
  };
}

// --- 1. 親コンポーネントはサーバーコンポーネントのまま ---
// 'use client' や useRouter は使わない
export default async function PetStatus() {
  // --- サーバーサイドで全てのデータ準備を行う ---
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const userId = session.user?.id ? Number(session.user.id) : null;

  const petStatus = userId ? await prisma.status_Kohaku.findFirst({
    where: { user_id: userId },
  }) : null;

  const MAX_HUNGER = 1500; // 満腹度の最大値を1500に設定
  const currentHunger = petStatus?.hungerlevel ?? 1000; // ペットの現在の満腹度を取得、なければデフォルト値1000を使用
  const safeHunger = Math.max(0, Math.min(currentHunger, MAX_HUNGER));

  // --- 取得したデータを、表示用のクライアントコンポーネントにPropsとして渡す ---
  return (
    <PetStatusView 
      initialHunger={safeHunger} 
      maxHunger={MAX_HUNGER} 
    />
  );
}

