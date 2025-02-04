'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, getCsrfToken } from '@/utils/services/auth';

export default function Login() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Richiedi il cookie CSRF dal backend
    const csrfOk = await getCsrfToken();
    if (!csrfOk) {
      setError('Impossibile ottenere il token CSRF');
      return;
    }

    // Effettua la chiamata per il login
    const result = await loginUser(username, password);
    if (result.success) {
      router.push('/home');
    } else {
      setError(result.detail || 'Errore durante il login');
    }
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Accedi</button>
      </form>
    </div>
  );
}
