// AppContext.tsx (o come l'hai chiamato)
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, logoutUser } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';


interface AppContextType {
  user: string | null;
  setUser: React.Dispatch<React.SetStateAction<string | null>>;
  role: string | null;  // <--- Aggiunto role
  setRole: React.Dispatch<React.SetStateAction<string | null>>;
  handleLogout: () => void;            // <--- aggiunto qui
}

export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  role: null, // <--- Default null
  setRole: () => {},
  handleLogout: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login') {
      return;  // Evita il controllo se siamo già in /login
    }
    if (pathname === '/testConnection') {
      return;  // Evita il controllo se siamo già in /login
    }
    async function verifyAuth() {
      console.info('Verifica autenticazione...verifyAuth');
      const result = await checkAuth();
      if (!result.isAuthenticated || !result.username) {
        router.push('/login');
      } else {
        setUser(result.username);
        setRole(result.role || null);
      }
    }
    verifyAuth();
  }, [router]);


  // --- Ecco la funzione di logout
  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);        // <--- Aggiornamento stato locale
      setRole(null);
      router.push('/login');
    } else {
      console.error('Logout fallito:', result.detail);
    }
  };

  return (
    <AppContext.Provider value={{ user, setUser, role, setRole, handleLogout }}>
      {children}
    </AppContext.Provider>
  );
}
