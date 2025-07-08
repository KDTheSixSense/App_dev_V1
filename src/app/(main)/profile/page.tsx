import React from "react";
import ProfileForm from "./ProfileForm/ProfileForm";
import Pet from "./Pet/PetStatus";
import Advice from "./Advice/Advice";
import Chart from "./Chart/Chart";
import { getAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * プロフィールページコンポーネント
 * ユーザーのプロフィール情報表示、編集、ペットのステータス、AIアドバイスを表示します。
 */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { subject?: string };
}) {
  // ユーザーセッションの取得と認証チェック
  // セッションがない、またはユーザー情報がない場合はログインページにリダイレクト
  const session = await getAppSession();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // データベースからユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(session.user.id, 10),
    },
  });
  
  return (
    <div className='bg-white'>
      <main className="flex w-full min-h-screen text-center pt-6 ml-20 mr-20 gap-10">
        <div className="flex flex-col w-full max-w-lg gap-8">
          {/* プロフィール編集フォームコンポーネント */}
          <ProfileForm user={user} />
        </div>
          {/* 自己分析チャートコンポーネント */}
          <Chart />
        <div className="flex flex-col w-full max-w-lg">
          {/* ペットのステータス表示コンポーネント */}
          <Pet />
          {/* AIからのアドバイス表示コンポーネント */}
          <Advice />
        </div>
      </main>
    </div>
  );
}