import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from "../../genericComponent";
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { forEach } from 'lodash';
import GeneralButton from './generalButton';
import Image from 'next/image';

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

export default function PageMenu({ propExampleValue }: PropsInterface) {
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

    const openPage = (route) => {
        
    };

    const buttonsList = [
        { text: 'SCHEDA AUTO', route: '/scheda-auto' },
        { text: 'NOTE SPESE', route: '/note-spese' },
        { text: 'PROVE AUTO', route: '/prove-auto' },
        { text: 'SERVICE MAN', route: '/service-man' },
        { text: 'PREVENTIVO CARROZZERIA', route: '/preventivo-carrozzeria' },
        { text: 'AUTO NUOVE', route: '/auto-nuove' },
        { text: 'CHECK LIST', route: '/check-list' },
        { text: 'LOGOUT', route: '/logout' }
    ]

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="flex items-start justify-center p-0 sm:p-4 overflow-y-auto max-h-screen">
                    <div className="overflow-hidden bg-white shadow-md border border-gray-200">
                        <div className="w-full flex flex-col justify-center items-center p-4">
                            <Image
                                src="/bixdata/logos/winteler.png"
                                alt="Logo Winteler"
                                width={400}
                                height={200}
                                className="w-full h-auto" 
                            />
                        </div>

                        <div className="w-full flex flex-col justify-center p-5 mb-8">
                        {buttonsList.map((link) => (
                            <GeneralButton
                                key={link.route}
                                text={link.text}
                                action={() => openPage(link.route)}
                                className='mb-4'
                            />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </GenericComponent>
    );
};


