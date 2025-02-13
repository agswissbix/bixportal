'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, logoutUser } from '@/utils/auth';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/navbar';
import { getCsrfToken } from '@/utils/auth';
import Sidebar from '@/components/sidebar';

export default function Home() {
  const [selectedMenu, setSelectedMenu] = useState<string>('Home');
  const router = useRouter();

  const handleMenuClick = (menuName: string): void => {
    setSelectedMenu(menuName);
  };
  

  return (    
    <div className="w-full h-full flex flex-col">
      <Toaster richColors />
      <Navbar />
      <div className="w-full flex-1 flex">
        <Sidebar setSelectedMenu={(item) => setSelectedMenu(item)} />
      </div>

    </div>
  );
}
