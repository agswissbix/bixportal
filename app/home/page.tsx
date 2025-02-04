'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, logoutUser } from '@/utils/services/auth';

export default function Home() {
  const [user, setUser] = useState<string | null>(null);
  const router = useRouter();

  // Funzione per effettuare il logout
  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      router.push('/login');
    } else {
      console.error('Logout fallito:', result.detail);
    }
  };

  useEffect(() => {
    async function verifyAuth() {
      const result = await checkAuth();
      if (result.isAuthenticated && result.username) {
        setUser(result.username);
      } else {
        router.push('/login');
      }
    }
    verifyAuth();
  }, [router]);

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ margin: '2rem' }}>
      <h1>Home Page Protetta</h1>
      <p>Benvenuto, {user}!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
