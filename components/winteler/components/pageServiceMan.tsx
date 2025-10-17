import React, { useMemo, useContext, useState, useEffect, useRef } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from "../../genericComponent";
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { forEach } from 'lodash';
import GeneralButton from './generalButton';
import FloatingLabelInput from './floatingLabelInput';
import Image from 'next/image';
import BarcodeScanner from './barcodeScanner';
import FloatingLabelSelect from './floatingLabelSelect';
import CondizioniNoleggio from './condizioni_noleggio';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        interface ServiceMan {
            id: string;
            cliente: string;
            data: Date;
            highlight: boolean;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            serviceMen: ServiceMan[];
        }

export default function PageServiceMan({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                serviceMen: []
            };

            // DATI RESPONSE PER LO SVILUPPO
            const responseDataDEV: ResponseInterface = {
                serviceMen: [
                    {
                        id: "1",
                        cliente: "Mario Rossi",
                        data: new Date("2025-10-20T10:00:00.000Z"),
                        highlight: false,
                    },
                    {
                        id: "2",
                        cliente: "Giulia Esposito",
                        data: new Date("2025-10-20T14:30:00.000Z"),
                        highlight: false,
                    },
                    {
                        id: "3",
                        cliente: "Alessandro Conti",
                        data: new Date("2025-10-21T11:00:00.000Z"),
                        highlight: false,
                    },
                    {
                        id: "4",
                        cliente: "",
                        data: new Date("2025-10-22T09:00:00.000Z"),
                        highlight: false,
                    },
                    {
                        id: "5",
                        cliente: "Francesco Ferrari",
                        data: new Date("2025-10-22T16:00:00.000Z"),
                        highlight: false,
                    },
                    {
                        id: "6",
                        cliente: "",
                        data: new Date("2025-10-23T15:00:00.000Z"),
                        highlight: false,
                    },
                    {
                        id: "7",
                        cliente: "Lorenzo De Luca",
                        data: new Date("2025-10-24T10:30:00.000Z"),
                        highlight: false,
                    },
                    {
                        id: "8",
                        cliente: "Martina Rizzo",
                        data: new Date("2025-10-25T12:00:00.000Z"),
                        highlight: false,
                    },
                    {
                        id: "9",
                        cliente: "Simone Santoro",
                        data: new Date("2025-10-27T17:00:00.000Z"),
                        highlight: false,
                    },
                    {
                        id: "10",
                        cliente: "Beatrice Colombo",
                        data: new Date("2025-10-28T09:30:00.000Z"),
                        highlight: false,
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
            apiRoute: 'get_service_man',
        };
    }, []);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    useEffect(() => {
        if (!isDev && response) {
            const parsedEvents = response.serviceMen.map(event => ({
                ...event,
                data: new Date(event.data)
            }));
            setResponseData({ ...response, serviceMen: parsedEvents });
        }
    }, [response]);

    // PER DEVELOPMENT
    useEffect(() => {
        isDev ? setResponseData({ ...responseDataDEV }) : '';
    }, []);

    const openPage = (route) => {
        
    };

    return (
        <GenericComponent response={responseData} loading={loading} error={error}>
            {(response: ResponseInterface) => (
                <div className="flex items-start justify-center p-0 sm:p-4 overflow-y-auto max-h-screen">
                    <div className="overflow-x-auto bg-white shadow-md border border-gray-200">
                        <div className="w-full flex flex-col justify-center items-center p-4">
                            <Image
                                src="/bixdata/logos/winteler.png"
                                alt="Logo Winteler"
                                width={400}
                                height={200}
                            />
                        </div>

                        <div className="w-full flex flex-col justify-center p-5 mb-8">    
                            <div className="overflow-auto w-full text-sm text-gray-900 border-t border-gray-200 p-4">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 font-bold text-gray-900 border-b border-gray-300">Cliente</th>
                                            <th className="px-4 py-3 font-bold text-gray-900 border-b border-gray-300">Data</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            response.serviceMen.map((serviceMan) => (
                                                <tr key={`${serviceMan.cliente}-${serviceMan.data}`}
                                                    className={serviceMan.highlight ? "bg-green-200" : ""}>
                                                    <td className="px-4 py-3 border-b border-gray-200">{serviceMan.cliente}</td>
                                                    <td className="px-4 py-3 border-b border-gray-200">
                                                        {
                                                            new Date(serviceMan.data).toLocaleDateString('it-IT')
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>

                            <GeneralButton
                                text='menu'
                                action={() => openPage("/menu")}
                                />
                        </div>
                    </div>
                </div>
            )}
        </GenericComponent>
    );
};
