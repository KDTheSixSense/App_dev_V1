import React from "react";
import Pet from "./Pet/PetStatus";      // 正しいパスに注意
import ProfileForm from "./ProfileForm/ProfileForm";

// 1. page.tsxのコンポーネントが props として searchParams を受け取るようにする
//    また、子コンポーネントがasyncなので、このコンポーネントもasyncにする
export default async function HomePage({
  searchParams,
}: {
  searchParams: { subject?: string };
}) {
  
  return (
    <div className='bg-white'>
      <main className="flex w-full min-h-screen text-center pt-6 ml-20 mr-20 gap-10">
        <div className="flex flex-col w-full max-w-lg gap-8"> {/* max-w-150は存在しないためlgに変更 */}
          <ProfileForm user={null} />
        </div>
        <div className="flex flex-col w-full max-w-lg"> {/* max-w-150は存在しないためlgに変更 */}
          <Pet />
        </div>
      </main>
    </div>
  );
}