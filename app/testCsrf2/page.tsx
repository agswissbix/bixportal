'use client';
// CsrfTest.tsx
import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const PORTAL_BASE_URL = process.env.NEXT_PUBLIC_PORTAL_BASE_URL;

// Interfaccia per la risposta dell'API
interface ApiResponse {
  message: string;
  csrftoken?: string;     // aggiungiamo il campo csrftoken
  [key: string]: any;
}

const CsrfTest: React.FC = () => {
  const [getResponse, setGetResponse] = useState<ApiResponse | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');  // token da usare nelle POST
  const [postResponse, setPostResponse] = useState<ApiResponse | null>(null);

  useEffect(() => {
    // 1) Esegui la GET per ottenere cookie e token
    fetch(`${API_BASE_URL}/csrf-test/`, {
      method: 'GET',
      credentials: 'include', // importante per inviare/ricevere i cookie
    })
      .then((response) => response.json())
      .then((data: ApiResponse) => {
        setGetResponse(data);

        // Se il server ci manda il token nel JSON, salviamolo nello state
        if (data.csrftoken) {
          setCsrfToken(data.csrftoken);
        }
      })
      .catch((error) => console.error('Errore GET:', error));
  }, []);

  const handlePost = () => {
    // 2) Usiamo il token salvato in state anziché cercarlo nel cookie
    fetch(`${API_BASE_URL}/csrf-test/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken, // usiamo il token recuperato dalla GET
      },
      body: JSON.stringify({ test: 'dati di esempio' }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('POST fallita con status ' + response.status);
        }
      })
      .then((data: ApiResponse) => setPostResponse(data))
      .catch((error) => console.error('Errore POST:', error));
  };

  return (
    <div>
      <h1>Test CSRF</h1>
      <p>Server: {API_BASE_URL}</p>
      <section>
        <h2>Risposta GET</h2>
        <pre>{JSON.stringify(getResponse, null, 2)}</pre>
      </section>
      <section>
        <h2>Risposta POST</h2>
        <button onClick={handlePost}>Invia richiesta POST</button>
        <pre>{JSON.stringify(postResponse, null, 2)}</pre>
      </section>
      <section>
        <h2>CSRF Token salvato in state</h2>
        <p>{csrfToken || 'Nessun token disponibile'}</p>
      </section>
    </div>
  );
};

export default CsrfTest;
