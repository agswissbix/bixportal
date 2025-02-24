// utils/axiosInstance.ts
import axios from 'axios';
import Cookies from 'js-cookie';
import Router from 'next/router';

// Crea un'istanza axios preconfigurata
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // Base URL del backend Django
    withCredentials: true, // Invia automaticamente i cookie di sessione con ogni richiesta
});


  

// Interceptor per loggare l'URL della richiesta
axiosInstance.interceptors.request.use((config) => {
    console.log(`[AxiosInstanceServer Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
}, (error) => {
    console.error("[AxiosInstanceServer Request Error]", error);
    return Promise.reject(error);
});

export default axiosInstance;
