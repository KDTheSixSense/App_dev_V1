'use client';

import { useMemo } from 'react';
import PetStatusView from './PetStatusView';
import { SubjectProgress } from '@/components/kohakuUtils';
import type { User, Status_Kohaku } from '@prisma/client';

type UserWithPetStatus = User & {
  status_Kohaku: Status_Kohaku | null;
  progresses?: {
    level: number;
    subject: {
      name: string;
    };
  }[];
};

// Propsの型定義を更新
interface PetStatusProps {
  user: UserWithPetStatus | null;
  subjectProgress?: SubjectProgress[]; // ★ subjectProgressを受け取れるように追加
}

export default function Pet({ user, subjectProgress }: PetStatusProps) {
  // user.progresses から subjectProgress を生成するロジックを追加
  // これにより、Petが表示するユーザーごとの進化状態を正しく反映できる
  const effectiveSubjectProgress = useMemo(() => {
    if (user?.progresses && user.progresses.length > 0) {
      return user.progresses.map((p) => ({
        subjectName: p.subject.name,
        level: p.level,
      }));
    }
    return subjectProgress;
  }, [user, subjectProgress]);

  if (!user || !user.status_Kohaku) {
    // ユーザー情報やペット情報がない場合のフォールバック表示
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-[#E0F7FA] rounded-3xl shadow-sm w-full relative overflow-hidden min-h-[400px]">
            <p>ペット情報を読み込んでいます...</p>
        </div>
    );
  }

  return (
    <PetStatusView
      initialHunger={user.status_Kohaku.hungerlevel}
      maxHunger={200} // 仮の最大値
      petname={user.status_Kohaku.name}
      subjectProgress={effectiveSubjectProgress} // ★ PetStatusViewに渡す
      userLevel={user.level} // レベルを渡す
    />
  );
}