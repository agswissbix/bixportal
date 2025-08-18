import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          responseExampleValue: string;
        }

export default function ExampleComponentWithData({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                responseExampleValue: "Default"
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
              responseExampleValue: "Example"
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

    // PER DEVELLOPMENT 
    useEffect(() => {
        const interval = setInterval(() => {
            // forza un setState con lo stesso valore, quindi re-render inutile
            setResponseData({ responseExampleValue: 'Example' }); // stesso valore di prima

        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const uselessMemo = useMemo(() => {
        return Math.random(); // valore che cambia sempre
      }, [responseData]);
      

    console.log('[DEBUG] Rendering ExampleComponentWithData', { propExampleValue, responseData });
      
    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div>
                    <b>propExampleValue:</b> {devPropExampleValue}<br/>
                    <b>responseExampleValue:</b> {response.responseExampleValue} <br/>
                    <b>Utente loggato</b> (da context): {user ?? 'Nessun utente'} <br/>
                    <b>Server:</b> {API_BASE_URL}
                </div>
            )}
        </GenericComponent>
    );
};


