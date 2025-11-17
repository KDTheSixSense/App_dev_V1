'use client';

import Header from '@/components/Header';
import MobileFooter from '@/components/MobileFooter';
import { UserWithPetStatus } from './layout';
import React, 'react';
import { Toaster } from 'react-hot-toast';
import CustomCursor from '@/components/CustomCursor';

export default function MainLayout({
  children,
  userWithPet,
}: {
  children: React.ReactNode;
  userWithPet: UserWithPetStatus | null;
}) {

  return (
    <>
      <CustomCursor />
      <Header userWithPet={userWithPet} />
      <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out pb-20 md:pt-20`}>


        <Toaster position="bottom-right" />
        {children}
      </main>
      <MobileFooter userWithPet={userWithPet} />
    </>
  );
}
