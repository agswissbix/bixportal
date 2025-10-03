import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memo } from 'react'; // Usiamo memo standard di React

// --- SPOSTATO FUORI DAL COMPONENTE ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev =  'development'; // Modo standard per controllare l'ambiente

// INTERFACCE
interface PropsInterface {
  propExampleValue?: string;
}

interface ResponseInterface {
  responseExampleValue: string;
}

// DATI STATICI DI DEFAULT E SVILUPPO
const responseDataDEFAULT: ResponseInterface = {
  responseExampleValue: "Default"
};

const responseDataDEV: ResponseInterface = {
  responseExampleValue: "Example"
};

// --- CUSTOM HOOK PER LA GESTIONE DEI DATI ---

const useExampleData = (propExampleValue?: string) => {
  // Se siamo in sviluppo, ritorniamo dati finti e usciamo subito.
  if (isDev) {
    // Logica di re-render forzato per debug (ora è isolata qui)
    const [mockData, setMockData] = useState(responseDataDEV);
    useEffect(() => {
      const interval = setInterval(() => {
        // Forza re-render con un nuovo oggetto per simulare un aggiornamento
        setMockData({ ...responseDataDEV });
      }, 3000);
      return () => clearInterval(interval);
    }, []);

    return { data: mockData, loading: false, error: null, devPropValue: "Example prop" };
  }

  // --- Logica di produzione ---
  const payload = useMemo(() => ({
    apiRoute: 'examplepost',
    example1: propExampleValue
  }), [propExampleValue]);

  // La chiamata API ora è incondizionata (all'interno della logica di produzione)
  const { response, loading, error } = useApi<ResponseInterface>(payload);

  return { data: response ?? responseDataDEFAULT, loading, error, devPropValue: propExampleValue };
};


// --- COMPONENTE PRINCIPALE (ORA MOLTO PIÙ PULITO) ---

function ExampleComponentWithData({ propExampleValue }: PropsInterface) {
  const { user } = useContext(AppContext);
  
  // Tutta la complessità è nascosta nel custom hook
  const { data, loading, error, devPropValue } = useExampleData(propExampleValue);

  return (
    <GenericComponent response={data} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <div>
          <b>propExampleValue:</b> {devPropValue}<br />
          <b>responseExampleValue:</b> {response.responseExampleValue} <br />
          <b>Utente loggato</b> (da context): {user ?? 'Nessun utente'} <br />
          <b>Server:</b> {API_BASE_URL}
        </div>
      )}
    </GenericComponent>
  );
}

// Esporta il componente avvolto in React.memo per ottimizzare i re-render
export default memo(ExampleComponentWithData);