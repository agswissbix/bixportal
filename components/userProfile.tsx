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

function UserSettings({ propExampleValue }: PropsInterface) {
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
            const { user, userName } = useContext(AppContext);

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
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

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
                <div className="flex justify-center mb-10">
                    <div className="flex items-center gap-2">
                        <img
                        src={`/api/media-proxy?url=userProfilePic/${user}.png`}
                        alt="ciao"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-400"
                        onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes("default.jpg")) {
                            target.src = "/api/media-proxy?url=userProfilePic/default.jpg";
                            }
                        }}
                        />
                        <div className="flex flex-col items-center">
                        <span className="font-semibold">{userName}</span>
                        <span className="text-sm text-gray-500">{user}</span>
                        </div>
                        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => alert('Settings clicked!')}>
                            Modifica immagine
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    // Logica per caricare l'immagine
                                    console.log('File selected:', file);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </GenericComponent>
    );
};


export default UserSettings;

