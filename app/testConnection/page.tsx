'use client';

import React, { useState } from "react";
import axios from "axios";
// Interfaccia per la risposta dell'API
interface ApiResponse {
  message: string;
  csrftoken?: string;     // aggiungiamo il campo csrftoken
  [key: string]: any;
}

export default function TestConnection() {
  // Stato per memorizzare la risposta
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');
  const [postResponse, setPostResponse] = useState<ApiResponse | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleTestConnection = async () => {
    setLoading(true); 
    setError(null);

    try {
      // Invio di una richiesta POST verso la route interna di Next.js
      const response = await axios.post("/postApi", {
        apiRoute: "test_connection",
        // ... qui si possono aggiungere eventuali altri dati ...
      });

      setResponseData(response.data); 
      console.log(response);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCsrf = async () => {
    try {
      const resp = await axios.get('/getCsrf');
      setMsg(JSON.stringify(resp.data));
    } catch (error) {
      setMsg('Errore nel recupero CSRF');
      console.error(error);
    }
  };

  const handleTestPost = async () => {
    setLoading(true); 
    setError(null);

    try {
      // Invio di una richiesta POST verso la route interna di Next.js
      const response = await axios.post("/postApi", {
        apiRoute: "checkCsrf",
        // ... qui si possono aggiungere eventuali altri dati ...
      });

      setResponseData(response.data); 
      console.log(response);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


 

  return (
    <div>
      <button onClick={handleTestConnection} disabled={loading}>
        {loading ? "Caricamento..." : "Testa la Connessione"}
      </button>
      <br/>
      <p>Server da contattare: {apiBaseUrl}</p>
      <button onClick={fetchCsrf}>Ottieni CSRF</button>
      <p>{msg}</p>
      <section>
        <h2>Risposta POST</h2>
        <button onClick={handleTestPost}>Invia richiesta POST</button>
        <pre>{JSON.stringify(postResponse, null, 2)}</pre>
      </section>
      {error && <p style={{ color: "red" }}>Errore: {error}</p>}
      {responseData && (
        <div>
          <h3>Risposta del server:</h3>
          <pre>{JSON.stringify(responseData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
