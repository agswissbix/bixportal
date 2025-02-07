'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, logoutUser } from '@/utils/auth';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/navbar';
import ExampleComponent from '@/components/exampleComponent';
import ExampleComponentWithData from '@/components/exampleComponentWithData';
import { getCsrfToken } from '@/utils/auth';
import { AppProvider } from '@/context/appContext';

export default function Test() {



  return (    
    <div>
      
      <AppProvider>
        <ExampleComponentWithData  />
      </AppProvider>

    </div>
  );
}
