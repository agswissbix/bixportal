import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';

// Styling & Icons
import { TrophyIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
// INTERFACCIA PROPS
interface PropsInterface {
  propExampleValue?: string;
}

interface Stats {
  title: string;
  description: string;
  value: number;
  value_measure: string;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  stats: Stats
}

export default function WidgetHighlightCard({ propExampleValue }: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        stats: null
    };

    const responseDataDEV: ResponseInterface = {
      stats :{
        title: 'Title',
        description: 'This is a description of the value',
        value: 3.5,
        value_measure: '%'
      }
    };

    // DATI DEL CONTESTO
    const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'examplepost', // riferimento api per il backend
            example1: propExampleValue
        };
    }, [propExampleValue]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    // PER DEVELOPMENT
    useEffect(() => {
      setResponseData({ ...responseDataDEV });
    }, []);


    return (
      <GenericComponent response={responseData} loading={loading} error={error}>
        {(response: ResponseInterface) => {
          if (!response || !response.stats) {
            return (
              <div className="flex items-center justify-center p-4">
                <div className="flex h-48 w-48 items-center justify-center">
                  <span className="text-sm text-gray-500">Caricamento...</span>
                </div>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center p-4">
              <div className="min-w-64 overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
                <div className="w-full flex flex-col justify-center items-center p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                    <TrophyIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mt-2 flex items-center">
                    {response.stats.title}
                  </div>
                  <div className="text-4xl font-bold text-blue-500 mt-2 flex items-center">
                    {response.stats.value}{response.stats.value_measure}
                  </div>
                </div>
                <div className='bg-white p-5 border-t border-gray-200 text-sm'>
                  <span>
                    {response.stats.description}
                  </span>
                </div>
              </div>
            </div>
          );
        }}
      </GenericComponent>
    );
};