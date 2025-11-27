'use client';

import Header from '@/components/Header';
import MobileFooter from '@/components/MobileFooter';
import type { UserWithPetStatus } from '@/lib/types';
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';


export default function MainLayout({
  children,
  userWithPet,
}: {
  children: React.ReactNode;
  userWithPet: UserWithPetStatus | null;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      
      <Header userWithPet={userWithPet} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <main className={`flex-grow w-full transition-all duration-300 ease-out pb-20 md:pt-20`}>


        <Toaster position="bottom-right" />
        <style jsx global>{`
          main a {
            color: #1a0dab;
            text-decoration: underline;
          }
          main a:hover {
            color: #60079f;
          }
        `}</style>
        {children}
      </main>
      <MobileFooter userWithPet={userWithPet} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </>
  );
}
