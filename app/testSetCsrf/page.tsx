'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { loginUser, getCsrfToken } from '@/utils/auth';
import axiosInstance from '@/utils/axiosInstance';

// Recupera la base URL dall'ambiente
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TestSetCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  useEffect(() => {
      const fetchCsrfToken = async () => {
        try {
          const response = await axiosInstance.get('/auth/csrf/');
          // Se lo status è 200, assumiamo che il token CSRF sia stato impostato
          return response.status === 200;
        } catch (error) {
          console.error('Errore durante il recupero del CSRF token', error);
          return false;
        }
      };
      fetchCsrfToken();
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
