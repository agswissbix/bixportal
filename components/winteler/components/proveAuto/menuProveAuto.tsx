import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import { AppContext } from '@/context/appContext';
import Image from 'next/image';
import GenericComponent from '@/components/genericComponent';
import GeneralButton from '../generalButton';
import { filter } from 'lodash';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          responseExampleValue: string;
        }

export default function MenuProveAuto({onChangeView}) {
    //DATI
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
        };
    }, []);

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

    const openPage = (route) => {
        onChangeView(route, {filter: filter})
    };

    const buttonsList = [
        { text: "nuova", route: "nuova-prova-auto", filter: "" },
        { text: "precompilate", route: "prove-auto", filter: "precompilate" },
        { text: "in corso", route: "prove-auto", filter: "in corso" },
    ];

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="w-full flex flex-col justify-center p-5 mb-8">
                    <div className='pl-4 pr-4'> 
                        {buttonsList.map((link) => (
                            <GeneralButton
                                key={link.text}
                                text={link.text}
                                action={() => openPage(link.route)}
                                className='mb-4'
                            />
                            ))}
                    </div>

                    <GeneralButton
                        text='menu'
                        action={() => openPage("menu")}
                        />
                </div>
            )}
        </GenericComponent>
    );
};


