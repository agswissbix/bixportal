import axiosInstance from '@/utils/axiosInstance';
import axios from 'axios';

// Funzione per leggere il valore di un cookie (ad es. "csrftoken")
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}


export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await axiosInstance.get('/auth/csrf/');
    // Se il backend risponde col token, lo recuperiamo
    if (response.status === 200 && response.data?.csrftoken) {
      return response.data.csrftoken;
    }
    return null;
  } catch (error) {
    console.error('Errore durante il recupero del CSRF token', error);
    return null;
  }
}

// Richiede il CSRF token dal backend (endpoint: /auth/csrf/)
export async function getCsrfToken(): Promise<boolean> {
  try {
    const response = await axiosInstance.get('/auth/csrf/');
    // Se lo status è 200, assumiamo che il token CSRF sia stato impostato
    return response.status === 200;
  } catch (error) {
    console.error('Errore durante il recupero del CSRF token', error);
    return false;
  }
}

export interface LoginResponse {
  success: boolean;
  detail?: string;
}

// Effettua il login inviando i dati come form data (endpoint: /auth/login/)
export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  // Ottieni il CSRF token dal cookie
  //const csrfToken = getCookie('csrftoken');
  const csrfToken = (await fetchCsrfToken()) ?? '';
  // Crea i form data
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  try {
    const response = await axiosInstance.post('/auth/login/', formData, {
      headers: {
        'X-CSRFToken': csrfToken || '',
      },
    });
    return response.data;
  } catch (error: any) {
    // Se il server restituisce 401 (credenziali errate), restituisce il dettaglio del messaggio
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        detail: error.response.data.detail || 'Invalid credentials',
      };
    }
    console.error('Errore durante il login', error);
    return { success: false, detail: 'Errore di rete' };
  }
}

async function getCsrf() {
  try {
    const resp = await axios.post('/postApi', {
      apiRoute: 'getCsrf',
    });
    console.log('CSRF Response:', resp.data);
  } catch (error) {
    console.error('Errore nel recupero CSRF', error);
  }
}

// Nuova funzione per login
// Usando fetch o axios, basta puntare a /postApi e passare { apiRoute: 'login', ... }
export async function loginUserApi(
  username: string,
  password: string
): Promise<LoginResponse> {
  try {
    await getCsrf();

    const response = await axios.post('/postApi', {
      apiRoute: 'login',
      username,
      password,
    });
    return response.data; // Deve ritornare { success: boolean, detail?: string }
  } catch (error: any) {
    // Se il server restituisce 401 (credenziali errate) o altri errori
    const detail = error.response?.data?.error || 'Errore di rete';
    return {
      success: false,
      detail,
    };
  }
}

export interface GetActiveServerResponse {
  activeServer: string;
}

export async function getActiveServer(): Promise<GetActiveServerResponse> {
  try {
    const response = await axios.post('/postApi', {
      apiRoute: 'getActiveServer',
    });
    const activeServer = response.data.activeServer;
    return { activeServer };
  } catch (error: any) {
    console.error('Errore durante il recupero del server attivo', error);
    return { activeServer: '' };
  }
}


export interface CheckAuthResponse {
  isAuthenticated: boolean;
  username?: string;
  name?: string;
  role?: string | null; // Add the role property
  chat?: string | null;
  telefono?: string | null;
  activeServer?: string;
}

// Funzione per controllare se l'utente è autenticato (endpoint: /auth/user/)
export async function checkAuth(): Promise<CheckAuthResponse> {
  try {
    console.info('Verifica autenticazione...checkAuth');
    const response = await axios.post('/postApi', {
      apiRoute: 'checkAuth',
    });
    console.info(response);
    const { activeServer } = await getActiveServer();

    return {
      isAuthenticated: response.data.isAuthenticated,
      username: response.data.username,
      name: response.data.name,
      role: response.data.role,
      chat: response.data.chat,
      telefono: response.data.telefono,
      activeServer: activeServer,
    };
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      return { isAuthenticated: false };
    }
    console.error('Errore durante il controllo di autenticazione', error);
    return { isAuthenticated: false };
  }
}

export interface LogoutResponse {
  success: boolean;
  detail?: string;
}

// Funzione per effettuare il logout (endpoint: /auth/logout/)
// Include l'header 'X-CSRFToken' ottenuto da getCookie se il backend lo richiede.
export async function logoutUser(): Promise<LogoutResponse> {
  try {
    const csrfToken = getCookie('csrftoken');
    const response = await axiosInstance.post('/auth/logout/', null, {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Errore durante il logout', error);
    return { success: false, detail: 'Errore di rete' };
  }
}
