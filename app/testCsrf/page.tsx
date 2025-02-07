'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function CsrfInitializer() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsrf = async () => {
      try {
        // Esegui la GET verso il tuo endpoint Django per impostare il cookie csrftoken
        await axios.get('http://localhost:8002/auth/csrf/', {
          withCredentials: true, // Assicura che il cookie venga inviato/ricevuto se cross-site
        });

        // Recupera il cookie 'csrftoken' da document.cookie
        // (Se gira in contesto browser e il cookie è disponibile)
        const matches = document.cookie.match(/(^|; )csrftoken=([^;]+)/);
        if (matches) {
          const tokenFromCookie = matches[2];
          setCsrfToken(tokenFromCookie);
        }
      } catch (error) {
        console.error('Errore durante il recupero del CSRF token:', error);
      }
    };

    fetchCsrf();
  }, []);

  return (
    <div>
      {csrfToken 
        ? <p>CSRF token: <strong>{csrfToken}</strong></p>
        : <p>In attesa del token CSRF...</p>
      }
    </div>
  );
}
