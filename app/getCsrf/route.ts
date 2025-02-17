import { NextResponse } from 'next/server';

export async function GET() {
  // Qui chiami l'endpoint Django che imposta il token CSRF
  const djangoUrl = process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/csrf/';
  console.log('Django URL:', djangoUrl);
  // Effettui una richiesta con fetch (oppure axios),
  // includendo le credenziali per far transitare eventuali cookie
  const djangoResponse = await fetch(djangoUrl, {
    method: 'GET',
    credentials: 'include',
  });

  // A questo punto Django ti restituirà un header "Set-Cookie"
  // che contiene il csrftoken. Devi leggerlo e rigirarlo al browser
  // così che il cookie venga effettivamente salvato su dominio di Next.
  const setCookieHeader = djangoResponse.headers.get('set-cookie');

  if (!djangoResponse.ok) {
    // Se Django risponde con un errore
    return NextResponse.json(
      { error: 'Errore durante la richiesta del CSRF al backend Django' },
      { status: djangoResponse.status },
    );
  }

  // Se Django ha inviato correttamente il cookie...
  // Costruiamo la risposta per il browser reimpostando il cookie
  // Tenendo presente che set-cookie potrebbe aver bisogno di alcune modifiche
  // (es. rimuovere il dominio se fosse diverso, settare `Path` ecc.)
  const responseBody = await djangoResponse.json();

  const nextResponse = NextResponse.json(responseBody);
  if (setCookieHeader) {
    // Reimpostiamo tale header in modo che arrivi fino al browser
    nextResponse.headers.set('Set-Cookie', setCookieHeader);
  }

  return nextResponse;
}
