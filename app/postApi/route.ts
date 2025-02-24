import axiosInstance from '@/utils/axiosInstance';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import https from 'https';

export async function POST(request: Request) {
  // Recupera i cookie attuali da Next (es. eventuale csrftoken/sessionid già noti)
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrftoken')?.value;
  console.log('csrftoken dal cookie:', csrfToken);
  const sessionId = cookieStore.get('sessionid')?.value;
  console.log('sessionId dal cookie:', sessionId);

  // Legge il body della richiesta
  const postData = await request.json();
  const { apiRoute, ...rest } = postData;

  // Se manca apiRoute, ritorna errore
  if (!apiRoute) {
    return NextResponse.json(
      { error: 'apiRoute è obbligatorio nel body della richiesta.' },
      { status: 400 }
    );
  }

  try {
    // Configurazione base per la richiesta verso il backend
    const axiosConfig = {
      headers: {
        'X-CSRFToken': csrfToken ?? '',
        'Cookie': `sessionid=${sessionId ?? ''}; csrftoken=${csrfToken ?? ''}`,
      },
      withCredentials: true,
      // httpsAgent: new https.Agent({...}) se serve
    };

    let djangoUrl = '';
    switch (apiRoute) {
      case 'examplepost':
        djangoUrl = '/commonapp/examplepost/';
        break;
      case 'get_sidebarmenu_items':
        djangoUrl = '/commonapp/get_sidebarmenu_items/';
        break;
      case 'test_connection':
        djangoUrl = '/commonapp/test_connection/';
        break;
      case 'checkCsrf':
        djangoUrl = '/csrf-test/';
        break;
      case 'login':
        // Nuovo caso per il login
        djangoUrl = '/auth/login/';
        break;
      case 'get_shifts_and_volunteers':
        // Nuovo caso per il login
        djangoUrl = '/customapp_telefonoamico/get_shifts_and_volunteers/';
        break;
      case 'get_volunteers_list':
          // Nuovo caso per il login
          djangoUrl = '/customapp_telefonoamico/get_volunteers_list/';
          break;
      case 'save_shift':
          // Nuovo caso per il login
          djangoUrl = '/customapp_telefonoamico/save_shift/';
          break;
      case 'delete_shift':
        // Nuovo caso per il login
        djangoUrl = '/customapp_telefonoamico/delete_shift/';
        break;
      case 'getCsrf':
        // In questo caso, facciamo una GET al backend Django su /auth/csrf/
        // (gli altri casi faranno POST)
        djangoUrl = '/auth/csrf/';
        break;
      case 'enable_2fa':
          // In questo caso, facciamo una GET al backend Django su /auth/csrf/
          // (gli altri casi faranno POST)
          djangoUrl = '/commonapp/enable_2fa/';
          break;
      default:
        return NextResponse.json(
          { error: `apiRoute ${apiRoute} non gestito.` },
          { status: 400 }
        );
    }

    let response;
    if (apiRoute === 'getCsrf') {
      // Se vogliamo fare una GET a /auth/csrf/
      response = await axiosInstance.get(djangoUrl, axiosConfig);
    } else {
      // Per tutti gli altri, facciamo POST (login, examplepost, etc.)
      response = await axiosInstance.post(djangoUrl, rest, axiosConfig);
    }

    // Estraiamo i cookie che il backend Django ci ha mandato
    const setCookieHeader = response.headers['set-cookie'] ?? [];

    // Creiamo la risposta Next.js con il body ottenuto da Django
    const nextResponse = NextResponse.json(response.data, { status: 200 });

    // Se il backend ha inviato uno o più cookie, li aggiungiamo all'header
    // Set-Cookie di nextResponse, così che il browser li salvi.
    if (Array.isArray(setCookieHeader)) {
      // Caso: più cookie
      setCookieHeader.forEach((cookieValue) => {
        nextResponse.headers.append('Set-Cookie', cookieValue);
      });
    } else if (typeof setCookieHeader === 'string' && (setCookieHeader as string).length > 0) {
      // Caso: singolo cookie
      nextResponse.headers.set('Set-Cookie', setCookieHeader);
    }

    // Restituiamo la risposta finale al client
    return nextResponse;
  } catch (error: any) {
    console.error('Errore durante il proxy:', error);
    const status = error.response?.status || 500;
    const detail = error.response?.data?.detail || error.message || 'Errore generico.';
    return NextResponse.json({ error: detail }, { status });
  }
}
