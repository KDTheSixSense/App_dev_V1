'use client';

import Header from '@/components/Header';
import MobileFooter from '@/components/MobileFooter';
import type { UserWithPetStatus } from './layout';
import React, { useState } from 'react';

export default function MainLayout({
  children,
  userWithPet,
}: {
  children: React.ReactNode;
  userWithPet: UserWithPetStatus | null;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header userWithPet={userWithPet} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <main className="flex-1 w-full mt-0 md:mt-20 overflow-y-auto transition-all duration-300 ease-out relative">
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
    </div>
  );
}
