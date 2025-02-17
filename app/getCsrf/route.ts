import https from 'https';
import { NextResponse } from 'next/server';

export async function GET() {
  // 1. Verifichiamo se siamo in ambiente di sviluppo
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 2. Creiamo un httpsAgent se e solo se siamo in dev
  let agent;
  if (isDevelopment) {
    agent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  // 3. Prepara l'URL di Django (usiamo la variabile d’ambiente come base)
  const djangoUrl = process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/csrf/';
  console.log('Django URL:', djangoUrl);

  // 4. Opzioni per la fetch (method + credenziali)
  const fetchOptions: RequestInit = {
    method: 'GET',
    credentials: 'include',
  };

  // 5. Se l'agent esiste, lo inseriamo nel fetchOptions
  // (il casting a any è necessario perché l’API fetch standard 
  //  non include ufficialmente la proprietà “agent”)
  if (agent) {
    (fetchOptions as any).agent = agent;
  }

  // 6. Effettuiamo la richiesta a Django
  const djangoResponse = await fetch(djangoUrl, fetchOptions);

  // 7. Leggiamo il cookie inviato da Django (csrftoken)
  const setCookieHeader = djangoResponse.headers.get('set-cookie');

  // In caso di errore lato backend Django, restituiamo un messaggio
  if (!djangoResponse.ok) {
    return NextResponse.json(
      { error: 'Errore durante la richiesta del CSRF al backend Django' },
      { status: djangoResponse.status }
    );
  }

  // Se Django risponde con successo, leggiamo il body
  const responseBody = await djangoResponse.json();

  // Creiamo la risposta per Next
  const nextResponse = NextResponse.json(responseBody);

  // Se abbiamo il Set-Cookie, lo reimpostiamo verso il browser
  if (setCookieHeader) {
    nextResponse.headers.set('Set-Cookie', setCookieHeader);
  }

  return nextResponse;
}
