// utils/axiosInstance.ts
import axios from 'axios';
import Cookies from 'js-cookie';
import Router from 'next/router';

// Crea un'istanza axios preconfigurata
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // Base URL del backend Django
    withCredentials: true, // Invia automaticamente i cookie di sessione con ogni richiesta
});


  

// Interceptor per loggare l'URL della richiesta e apiRoute se presente
axiosInstance.interceptors.request.use((config) => {
    const apiRoute = config.data?.apiRoute ? ` | apiRoute: ${config.data.apiRoute}` : "";
    console.log(`[AxiosInstanceClient Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}${apiRoute}`);
    return config;
}, (error) => {
    console.error("[AxiosInstanceClient Request Error]", error);
    return Promise.reject(error);
});

export default axiosInstance;
