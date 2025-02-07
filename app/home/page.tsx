'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, logoutUser } from '@/utils/auth';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/navbar';
import { getCsrfToken } from '@/utils/auth';

export default function Home() {
  const router = useRouter();
 

  return (    
    <div className="w-full h-full flex flex-col">
      <Toaster richColors />
      <Navbar />

    </div>
  );
}
