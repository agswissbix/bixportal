'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, logoutUser } from '@/utils/auth';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/navbar';
import { getCsrfToken } from '@/utils/auth';
import Sidebar from '@/components/sidebar';
import StandardContent from '@/components/standardContent';
import { useRecordsStore } from '@/components/records/recordsStore';

export default function Home() {
  const {selectedMenu} = useRecordsStore();
  const router = useRouter();

  

  return (    
    <div className="w-full h-full flex flex-col">
      <Toaster richColors />
      <Navbar />
      <div className="w-full flex-1 flex">
        <Sidebar />
        <div className="relative h-full w-11/12 bg-gray-100">
          {<StandardContent tableid={selectedMenu} />}

        </div>
      </div>

    </div>
  );
}
