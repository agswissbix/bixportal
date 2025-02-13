'use client';
// CsrfTest.tsx
import React, { useEffect, useState } from 'react';

// Interfaccia per la risposta dell'API
interface ApiResponse {
  message: string;
  [key: string]: any;
}

// Funzione per leggere il valore di un cookie
function getCookie(name: string): string | null {
  let cookieValue: string | null = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const CsrfTest: React.FC = () => {
  const [getResponse, setGetResponse] = useState<ApiResponse | null>(null);
  const [postResponse, setPostResponse] = useState<ApiResponse | null>(null);

  useEffect(() => {
    // Effettua la GET per ottenere il cookie CSRF
    fetch('http://localhost:8000//csrf-test/', {
      method: 'GET',
      credentials: 'include', // importante per inviare/ricevere i cookie
    })
      .then((response) => response.json())
      .then((data: ApiResponse) => setGetResponse(data))
      .catch((error) => console.error('Errore GET:', error));
  }, []);

  const handlePost = () => {
    const csrftoken = getCookie('csrftoken'); // Assicurarsi che il nome corrisponda a quello usato da Django

    fetch('http://localhost:8000/csrf-test/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || '', // Se il token non è presente, invia una stringa vuota (la richiesta probabilmente fallirà)
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
      <section>
        <h2>Risposta GET</h2>
        <pre>{JSON.stringify(getResponse, null, 2)}</pre>
      </section>
      <section>
        <h2>Risposta POST</h2>
        <button onClick={handlePost}>Invia richiesta POST</button>
        <pre>{JSON.stringify(postResponse, null, 2)}</pre>
      </section>
    </div>
  );
};

export default CsrfTest;
