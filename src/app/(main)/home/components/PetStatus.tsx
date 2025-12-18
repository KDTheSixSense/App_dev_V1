import { prisma } from '@/lib/prisma';
import PetStatusView from '../Pet/PetStatusView';
import { SubjectProgress } from '@/components/kohakuUtils';
import type { User, Status_Kohaku } from '@prisma/client';

const MAX_HUNGER = 200; // 満腹度の最大値をここで一元管理

import { UnsubmittedAssignment } from '@/lib/data';

interface PetStatusProps {
  user: User | null;
  assignmentCount: number;
  nextAssignment: UnsubmittedAssignment | null;
  subjectProgress?: SubjectProgress[];
}

export default async function PetStatus({ user, assignmentCount, nextAssignment, subjectProgress }: PetStatusProps) {

  // ログインしていない場合は、デフォルトの満タン状態で表示
  if (!user) {
    return <PetStatusView initialHunger={MAX_HUNGER} maxHunger={MAX_HUNGER} petname='コハク' assignmentCount={assignmentCount} nextAssignment={nextAssignment} userLevel={1} />;
  }

  // --- ここからが時間経過の計算ロジックです ---
  const now = new Date();
  let petStatus = await prisma.status_Kohaku.findFirst({
    where: { user_id: user.id },
  });

  // もしペット情報がなければ、ここで処理を中断（表示はデフォルト）
  if (!petStatus) {
    console.error(`User ID: ${user.id} のペット情報が見つかりません。`);
    return <PetStatusView initialHunger={MAX_HUNGER} maxHunger={MAX_HUNGER} petname='コハク' assignmentCount={assignmentCount} nextAssignment={nextAssignment} userLevel={user.level} subjectProgress={subjectProgress} />;
  }

  // 1. 最後に更新されてからの経過時間（分）を計算
  const lastUpdate = petStatus.hungerLastUpdatedAt; // この値はnullの可能性がある
  let minutesPassed = 0; // 経過時間のデフォルトは0分
  let finalHungerLevel = petStatus.hungerlevel;
  let evolutionType = petStatus.evolutionType; // 進化タイプを取得
  // 1. lastUpdateがnullでない（タイマーが開始されている）場合のみ、経過時間を計算
  if (lastUpdate) {
    minutesPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
    // 10分ごとに1ポイント減少するので、経過分数を10で割って切り捨て
    const hungerPointsToDecrease = Math.floor(minutesPassed / 10);

    // 10分以上経過していれば（＝1ポイント以上減少する場合）、DBを更新
    if (hungerPointsToDecrease > 0) {
      const newHungerLevel = Math.max(0, petStatus.hungerlevel - hungerPointsToDecrease);

      // 最後に更新した時刻から、経過した「10分の倍数」の時間を加算して新しい更新時刻を計算
      // これにより、9分などの端数が切り捨てられず、次回の計算に引き継がれる
      const newLastUpdate = new Date(lastUpdate.getTime() + hungerPointsToDecrease * 10 * 60 * 1000);

      const updatedPetStatus = await prisma.status_Kohaku.update({
        where: { id: petStatus.id },
        data: {
          hungerlevel: newHungerLevel,
          hungerLastUpdatedAt: newLastUpdate,
        },
      });
      finalHungerLevel = updatedPetStatus.hungerlevel;
      evolutionType = updatedPetStatus.evolutionType; // 更新後の値を使用
      console.log(`${minutesPassed}分経過したため、満腹度を${hungerPointsToDecrease}ポイント減少させました。`);
    }
  }
  // --- 計算ロジックここまで ---

  return (
    <PetStatusView
      initialHunger={finalHungerLevel}
      maxHunger={MAX_HUNGER}
      petname={petStatus.name}
      assignmentCount={assignmentCount}
      nextAssignment={nextAssignment}
      userLevel={user.level}
      subjectProgress={subjectProgress}
      evolutionType={evolutionType}
    />
  );
}