'use client';

import React, { useState, useEffect } from "react";
import { toast, Toaster } from 'sonner';
import axiosInstanceClient from "@/utils/axiosInstanceClient";

// Interfaccia per la risposta dell'API
interface ApiResponse {
  message: string;
  csrftoken?: string;
  [key: string]: any;
}

export default function TestConnection() {
  // Stati per memorizzare le risposte e lo stato dell'applicazione
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');
  const [postResponse, setPostResponse] = useState<ApiResponse | null>(null);
  const [cookies, setCookies] = useState<{ [key: string]: string }>({});

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'URL non configurato';

  // Funzione per estrarre i cookie
  useEffect(() => {
    const extractCookies = () => {
      const cookieArray = document.cookie.split(';');
      const cookieObj: { [key: string]: string } = {};

      cookieArray.forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          cookieObj[key] = value;
        }
      });

      setCookies(cookieObj);
    };

    extractCookies();
    window.addEventListener('cookieChanged', extractCookies);

    return () => {
      window.removeEventListener('cookieChanged', extractCookies);
    };
  }, []);

  // Funzione helper per le richieste API
  const makeApiRequest = async (apiRoute: string, method: string = 'POST') => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstanceClient.post("/postApi", {
        apiRoute: apiRoute,
      });

      if (response.status !== 200) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const data = response.data;

      // Aggiorna i cookie dopo la risposta
      const event = new Event('cookieChanged');
      window.dispatchEvent(event);

      return data;
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Si è verificato un errore sconosciuto");
      }
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    const data = await makeApiRequest("test_connection");
    if (data) {
      setResponseData(data);
    }
  };

  const test_connection_get_csrf = async () => {
    const data = await makeApiRequest("test_connection_get_csrf");
    if (data) {
      toast.success('CSRF ottenuto con successo');
      console.log('CSRF Response:', data);
    }
  };

  const handleTestPost = async () => {
    const data = await makeApiRequest("test_connection_post");
    if (data) {
      setPostResponse(data);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-6">
      <Toaster position="top-center" richColors />
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Test Connessione API</h1>

        {/* Informazioni connessione */}
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Informazioni Connessione</h2>
          <p className="text-lg">Server da contattare: <span className="font-medium text-blue-700">{apiBaseUrl}</span></p>
        </div>

        {/* Azioni disponibili */}
        <div className="mb-8 p-4 bg-gray-100 rounded-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Azioni</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Test Connessione Base</h3>
              <button
                onClick={handleTestConnection}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-300"
              >
                {loading ? "Caricamento..." : "Testa Connessione"}
              </button>
            </div>

            <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Recupero CSRF Token</h3>
              <button
                onClick={test_connection_get_csrf}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 disabled:bg-green-300"
              >
                Ottieni CSRF
              </button>
            </div>

            <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Test Richiesta POST</h3>
              <button
                onClick={handleTestPost}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 disabled:bg-purple-300"
              >
                Invia POST
              </button>
            </div>
          </div>
        </div>

        {/* Display error if any */}
        {error && (
          <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-6 rounded-md">
            <p className="font-medium">Errore:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Risultati */}
        <div className="grid grid-cols-1 gap-6">
          {responseData && (
            <div className="p-4 bg-blue-50 rounded-md">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Risposta Test Connessione:</h3>
              <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
                <pre className="text-green-400">{JSON.stringify(responseData, null, 2)}</pre>
              </div>
            </div>
          )}

          {postResponse && (
            <div className="p-4 bg-purple-50 rounded-md">
              <h3 className="text-lg font-medium text-purple-800 mb-2">Risposta Richiesta POST:</h3>
              <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
                <pre className="text-green-400">{JSON.stringify(postResponse, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
