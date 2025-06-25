// app/page.tsx
import React from "react";
import Image from 'next/image'; // Imageコンポーネントをインポート
import UserDetail from "./user/UserDetail";
import RankingPage from "./ranking/RankingPage"
import Pet from "./Pet/PetStatus"

export default function Body() {
  return (
    <div className='bg-white'>
      <main className="flex w-full min-h-screen text-center pt-6 ml-20 mr-20 gap-10">
        <div className="flex flex-col w-full max-w-150 min-h-screen">
          <UserDetail />
          <RankingPage />
        </div>
        <div className="flex flex-col w-full max-w-150 min-h-screen">
          <Pet />
        </div>
      </main>
    </div>
  );
}