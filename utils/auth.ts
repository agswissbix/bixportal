import axiosInstance from '@/utils/axiosInstance';

// Funzione per leggere il valore di un cookie (ad es. "csrftoken")
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
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
  const csrfToken = getCookie('csrftoken');

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

export interface CheckAuthResponse {
  isAuthenticated: boolean;
  username?: string;
}

// Funzione per controllare se l'utente è autenticato (endpoint: /auth/user/)
export async function checkAuth(): Promise<CheckAuthResponse> {
  try {
    const response = await axiosInstance.get('/auth/user/');
    return {
      isAuthenticated: response.data.isAuthenticated,
      username: response.data.username,
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
