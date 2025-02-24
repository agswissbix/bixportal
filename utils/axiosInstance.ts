// utils/axiosInstance.ts
import axios from 'axios';
import Cookies from 'js-cookie';
import Router from 'next/router';

// Crea un'istanza axios preconfigurata
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // Base URL del backend Django
    withCredentials: true, // Invia automaticamente i cookie di sessione con ogni richiesta
});


  

export default axiosInstance;
