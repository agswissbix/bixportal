import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          tableid?: string;
          recordid?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            badgeItems: Array<{
                fieldid: string;
                value: string;
            }>
        }

export default function ExampleComponentWithData({ tableid,recordid }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO 
            const devPropExampleValue = isDev ? "Example prop" : tableid + '' + recordid;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                badgeItems: []
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                badgeItems: [
                    {
                        fieldid: "test1",
                        value: "test1"
                    },
                    {
                        fieldid: "test2",
                        value: "test2"
                    },
                    {
                        fieldid: "test3",
                        value: "test3"
                    },
                    {
                        fieldid: "test4",
                        value: "test4"
                    },
                    {
                        fieldid: "test5",
                        value: "test5"
                    },
                    {
                        fieldid: "test6",
                        value: "test6"
                    }
                ]
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_record_badge', // riferimento api per il backend
            tableid: tableid,
            recordid: recordid
        };
    }, [tableid, recordid]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non toccare)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="h-full w-full flex justify-center items-center">
                    <div className="flex flex-wrap justify-center w-full h-5/6 bg-secondary rounded-xl p-3">
                        {response.badgeItems.map((item) => (
                            <p key={item.fieldid} className="w-1/3 text-center text-white">
                                {item.value}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </GenericComponent>
    );
};
