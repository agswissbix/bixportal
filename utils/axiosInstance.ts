// utils/axiosInstance.ts
import axios from 'axios';
import https from 'https';
import Cookies from 'js-cookie';
import Router from 'next/router';

// Controlla se siamo in ambiente di sviluppo
const isDevelopment = process.env.NODE_ENV === 'development';

// Se in sviluppo, crea un agent che disabilita la verifica del certificato
let httpsAgent;
if (isDevelopment) {
  httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });
}

// Crea un'istanza axios preconfigurata
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, 
  withCredentials: true, // Invia automaticamente i cookie di sessione con ogni richiesta
  // Usa l'httpsAgent in development
  ...(isDevelopment && { httpsAgent }),
});

export default axiosInstance;
