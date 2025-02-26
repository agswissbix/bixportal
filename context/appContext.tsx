'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, logoutUser } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

interface AppContextType {
  user: string | null;
  setUser: React.Dispatch<React.SetStateAction<string | null>>;
  role: string | null;
  setRole: React.Dispatch<React.SetStateAction<string | null>>;
  userName: string | null;
  setUserName: React.Dispatch<React.SetStateAction<string | null>>;
  handleLogout: () => void;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  role: null,
  setRole: () => {},
  userName: '',
  setUserName: () => {},
  handleLogout: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // <--- stato di caricamento

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login') {
      setLoadingAuth(false); 
      return; // Evita il controllo se siamo già in /login
    }
    if (pathname === '/testConnection') {
      setLoadingAuth(false);
      return; // Evita il controllo se siamo in /testConnection
    }

    async function verifyAuth() {
      console.info('Verifica autenticazione...verifyAuth');
      const result = await checkAuth();
      if (!result.isAuthenticated || !result.username) {
        router.push('/login');
      } else {
        setUser(result.username);
        setRole(result.role || null);
        setUserName(result.name ?? null);
      }
      setLoadingAuth(false); // <--- Fine verifica
    }
    verifyAuth();
  }, [router, pathname]);

  // Funzione di logout
  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);
      setRole(null);
      setUserName(null);
      router.push('/login');
    } else {
      console.error('Logout fallito:', result.detail);
    }
  };

  // Se sto ancora verificando l'autenticazione, mostro un caricamento
  if (loadingAuth) {
    return <div>Caricamento in corso...</div>;
  }

  return (
    <AppContext.Provider 
      value={{ user, setUser, role, setRole, userName, setUserName, handleLogout }}
    >
      {children}
    </AppContext.Provider>
  );
}
