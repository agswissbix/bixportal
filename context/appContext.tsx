// AppContext.tsx (o come l'hai chiamato)
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, logoutUser } from '@/utils/auth';
import { useRouter } from 'next/navigation';

interface AppContextType {
  user: string | null;
  setUser: React.Dispatch<React.SetStateAction<string | null>>;
  handleLogout: () => void;            // <--- aggiunto qui
}

export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  handleLogout: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const router = useRouter();

  /*
  useEffect(() => {
    async function verifyAuth() {
      const result = await checkAuth();
      if (!result.isAuthenticated || !result.username) {
        router.push('/login');
      } else {
        setUser(result.username);
      }
    }
    verifyAuth();
  }, [router]);*/


  // --- Ecco la funzione di logout
  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);        // <--- Aggiornamento stato locale
      router.push('/login');
    } else {
      console.error('Logout fallito:', result.detail);
    }
  };

  return (
    <AppContext.Provider value={{ user, setUser, handleLogout }}>
      {children}
    </AppContext.Provider>
  );
}
