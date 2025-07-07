import React from "react";
import ProfileForm from "./ProfileForm/ProfileForm";
import Pet from "./Pet/PetStatus";
import Advice from "./Advice/Advice";
import { getAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { subject?: string };
}) {
  const session = await getAppSession();
  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(session.user.id, 10),
    },
  });
  
  return (
    <div className='bg-white'>
      <main className="flex w-full min-h-screen text-center pt-6 ml-20 mr-20 gap-10">
        <div className="flex flex-col w-full max-w-lg gap-8">
          <ProfileForm user={user} />
        </div>
        <div className="flex flex-col w-full max-w-lg">
          <Pet />
          <Advice />
        </div>
      </main>
    </div>
  );
}