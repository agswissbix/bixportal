'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, logoutUser } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import LoadingComp from '@/components/loading';
import { set } from 'lodash';

interface AppContextType {
  user: string | null;
  setUser: React.Dispatch<React.SetStateAction<string | null>>;
  role: string | null;
  setRole: React.Dispatch<React.SetStateAction<string | null>>;
  chat: string | null;
  setChat: React.Dispatch<React.SetStateAction<string | null>>;
  telefono: string | null;
  setTelefono: React.Dispatch<React.SetStateAction<string | null>>;
  userName: string | null;
  setUserName: React.Dispatch<React.SetStateAction<string | null>>;
  handleLogout: () => void;
  activeServer: string | null;
  setActiveServer: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  role: null,
  setRole: () => {},
  chat: null,
  setChat: () => {},
  telefono: null,
  setTelefono: () => {},
  userName: '',
  setUserName: () => {},
  handleLogout: () => {},
  activeServer: '',
  setActiveServer: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [chat, setChat] = useState<string | null>(null);
  const [telefono, setTelefono] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // <--- stato di caricamento

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/testConnection') {
      setLoadingAuth(false);
      return; // Evita il controllo se siamo in /testConnection
    }

    async function verifyAuth() {
      console.info('Verifica autenticazione...verifyAuth');
      const result = await checkAuth(pathname);
      console.info(result)
      if (!result.isAuthenticated || !result.username) {
        if (pathname === '/login') {
          setLoadingAuth(false); 
          return; 
        }
        router.push('/login');
        return
      } else {
        setUser(result.username);
        setRole(result.role.toLowerCase() || null);
        //TODO CUSTOM TELEFONO AMICO
        setChat(result.chat || null);
        setTelefono(result.telefono || null);
        setUserName(result.name ?? null);
        var activeServer=result.activeServer ?? null
        setActiveServer(activeServer);
        if (pathname === '/login') {
          //TODO CUSTOM TELEFONO AMICO
          if (activeServer!=='telefonoamico') {
            router.push('/home');
            return            
          }
        
           
        }
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
      setActiveServer(null);
      router.push('/login');
    } else {
      console.error('Logout fallito:', result.detail);
    }
  };

  // Se sto ancora verificando l'autenticazione, mostro un caricamento
  if (loadingAuth) {
    return <LoadingComp />;
  }

  return (
    <AppContext.Provider 
      value={{ user, setUser, role, setRole, chat, setChat, telefono, setTelefono, userName, setUserName, handleLogout, activeServer, setActiveServer }}
    >
      {children}
    </AppContext.Provider>
  );
}
