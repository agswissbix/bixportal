// utils/axiosInstance.client.ts
'use client'; // Importante se lo userai in un componente Client nell'App Router

import axios from 'axios';

const axiosInstanceClient = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_PORTAL_BASE_URL,
  withCredentials: true,
});

// Interceptor per loggare l'URL della richiesta e apiRoute se presente
axiosInstanceClient.interceptors.request.use((config) => {
  const apiRoute = config.data?.apiRoute ? ` | apiRoute: ${config.data.apiRoute}` : "";

  const tenantId = typeof window !== 'undefined'
    ? (window as any).__TENANT_ID__ || window.localStorage.getItem('tenant_id')
    : null;

    
    if (tenantId) {
      config.headers = config.headers;
      config.headers['X-Tenant-ID'] = tenantId;
      console.log(`[AxiosInstanceClient] Tenant ID: ${tenantId}`);
  }

  console.log(`[AxiosInstanceClient Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}${apiRoute}`);
  return config;
}, (error) => {
  console.error("[AxiosInstanceClient Request Error]", error);
  return Promise.reject(error);
});

// Interceptor di risposta per gestire eventuali errori di autenticazione (401)
axiosInstanceClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && window.location.pathname !== '/login') {
      console.log('AxiosInstanceClient: Sessione non valida o scaduta. Redirect al login...');
      // "window" esiste, perché saremo in un Client Component o in un contesto browser
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstanceClient;
