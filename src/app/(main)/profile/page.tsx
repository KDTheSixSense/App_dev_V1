import React from "react";
import ProfileForm from "./ProfileForm/ProfileForm";
import Pet from "./Pet/PetStatus";
import Advice from "./Advice/Advice";
import { getAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";


export default async function HomePage({ searchParams }: any) {
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

  // birthプロパティを文字列に変換
  const serializedUser = user ? {
    ...user,
    birth: user.birth ? user.birth.toISOString() : null,
  } : null;
  
  return (
    <div className='bg-white'>
      <main className="flex w-full min-h-screen text-center pt-6 ml-20 mr-20 gap-10">
        <div className="flex flex-col w-full max-w-lg gap-8">
          <ProfileForm user={serializedUser} />
        </div>
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