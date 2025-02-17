import axiosInstance from '@/utils/axiosInstance';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCsrfToken, getCookie } from '@/utils/auth';

// 1. Import del modulo https
import https from 'https';

export async function POST(request: Request) {
  // Recupera il CSRF token dai cookie della richiesta (lato server)
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrftoken')?.value;
  console.log('csrfToken:', csrfToken);
  const sessionId = cookieStore.get('sessionid')?.value;
  console.log('sessionId:', sessionId);
  const postData = await request.json();

  // Controlla che ci sia 'apiRoute' nel payload
  const { apiRoute, ...rest } = postData;
  if (!apiRoute) {
    return NextResponse.json(
      { error: 'apiRoute è obbligatorio nel body della richiesta.' },
      { status: 400 }
    );
  }

  try {


    // Prepara la configurazione di Axios includendo l’header X-CSRFToken
    const axiosConfig = {
      headers: {
        'X-CSRFToken': csrfToken,
        // Imposta manualmente il cookie
        'Cookie': `sessionid=${sessionId ?? ''}; csrftoken=${csrfToken ?? ''}`,
      },
      withCredentials: true,
      // 3. Assegna l'agent ad Axios
    };

    try {
      let response;
      let djangoUrl = '';

      // In base all'apiRoute, colpisci un endpoint diverso del backend Django
      switch (apiRoute) {
        case 'examplepost':
          djangoUrl = '/commonapp/examplepost/';
          break;
        case 'get_sidebarmenu_items':
          djangoUrl = '/commonapp/get_sidebarmenu_items/';
          break;
        case 'test_connection':
          // Se vuoi mappare la stessa rotta del test_connection in Django
          djangoUrl = '/commonapp/test_connection/';
          break;
          case 'checkCsrf':
          // Se vuoi mappare la stessa rotta del test_connection in Django
          djangoUrl = '/csrf-test/';
          break;
        case 'login':
          // Nuovo caso per il login
          djangoUrl = '/auth/login/';
          break;
    default:
          return NextResponse.json(
            { error: `apiRoute ${apiRoute} non gestito.` },
            { status: 400 }
          );
      }

      response = await axiosInstance.post(djangoUrl, rest, axiosConfig);
      return NextResponse.json(response.data, { status: 200 });

    } catch (error: any) {
      console.error('Errore durante il proxy:', error);
      const status = error.response?.status || 500;
      const detail = error.response?.data?.detail || error.message || 'Errore generico.';
      return NextResponse.json(
        { error: detail },
        { status }
      );
    }

  } catch (error: any) {
    console.error('Errore durante il fetch:', error);
    return NextResponse.json(
      { error: 'Errore durante il recupero dei dati.' },
      { status: 500 }
    );
  }
}
