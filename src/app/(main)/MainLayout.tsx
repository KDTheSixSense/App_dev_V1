'use client';

import Header from '@/components/Header';
import MobileFooter from '@/components/MobileFooter';
import { UserWithPetStatus } from './layout';
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
      <main className={`flex-grow container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-out pb-20 md:pt-20 ${isMenuOpen ? 'scale-95 blur-sm' : ''}`}>


        <Toaster position="bottom-right" />
        {children}
      </main>
      <MobileFooter userWithPet={userWithPet} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </>
  );
}
