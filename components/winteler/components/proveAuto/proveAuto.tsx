import React, { useMemo, useContext, useState, useEffect, useRef } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';
import GeneralButton from '../generalButton';
import { AppContext } from '@/context/appContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface Filter {
          filter?: string;
        }

        interface ProvaAuto {
            id: string;
            cliente: string;
            data: Date;
            venditore: string;
            highlight: boolean;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            proveAuto: ProvaAuto[];
        }

export default function ProveAuto({ onChangeView, data }) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const filter = isDev ? "Example prop" : data.filter;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                proveAuto: []
            };

            // DATI RESPONSE PER LO SVILUPPO
            const responseDataDEV: ResponseInterface = {
                "proveAuto": [
                    {
                        id: "1",
                        cliente: "Mario Rossi",
                        data: new Date("2025-10-20T10:00:00.000Z"),
                        venditore: "Luca Bianchi",
                        highlight: true,
                    },
                    {
                        id: "2",
                        cliente: "Giulia Esposito",
                        data: new Date("2025-10-20T14:30:00.000Z"),
                        venditore: "Marco Russo",
                        highlight: true,
                    },
                    {
                        id: "3",
                        cliente: "Alessandro Conti",
                        data: new Date("2025-10-21T11:00:00.000Z"),
                        venditore: "Luca Bianchi",
                        highlight: false,
                    },
                    {
                        id: "4",
                        cliente: "Sofia Romano",
                        data: new Date("2025-10-22T09:00:00.000Z"),
                        venditore: "Anna Galli",
                        highlight: false,
                    },
                    {
                        id: "5",
                        cliente: "Francesco Ferrari",
                        data: new Date("2025-10-22T16:00:00.000Z"),
                        venditore: "Marco Russo",
                        highlight: false,
                    },
                    {
                        id: "6",
                        cliente: "Chiara Greco",
                        data: new Date("2025-10-23T15:00:00.000Z"),
                        venditore: "Luca Bianchi",
                        highlight: false,
                    },
                    {
                        id: "7",
                        cliente: "Lorenzo De Luca",
                        data: new Date("2025-10-24T10:30:00.000Z"),
                        venditore: "Anna Galli",
                        highlight: false,
                    },
                    {
                        id: "8",
                        cliente: "Martina Rizzo",
                        data: new Date("2025-10-25T12:00:00.000Z"),
                        venditore: "Paolo Moretti",
                        highlight: true,
                    },
                    {
                        id: "9",
                        cliente: "Simone Santoro",
                        data: new Date("2025-10-27T17:00:00.000Z"),
                        venditore: "Marco Russo",
                        highlight: false,
                    },
                    {
                        id: "10",
                        cliente: "Beatrice Colombo",
                        data: new Date("2025-10-28T09:30:00.000Z"),
                        venditore: "Paolo Moretti",
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
            apiRoute: 'get_prove_auto', // riferimento api per il backend
            filter: filter
        };
    }, [filter]);

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
        setResponseData({ ...responseDataDEV });
    }, []);

    const openPage = (route) => {
        onChangeView(route);
    };

    return (
        <GenericComponent response={responseData} loading={loading} error={error}>
            {(response: ResponseInterface) => (
                <div className="w-full flex flex-col justify-center p-5 mb-8">    
                    <div className="overflow-auto w-full text-sm text-gray-900 border-t border-gray-200 p-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 font-bold text-gray-900 border-b border-gray-300">Cliente</th>
                                    <th className="px-4 py-3 font-bold text-gray-900 border-b border-gray-300">Data e Ora</th>
                                    <th className="px-4 py-3 font-bold text-gray-900 border-b border-gray-300">Venditore</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    response.proveAuto.map((prova) => (
                                        <tr key={`${prova.cliente}-${prova.data}`}
                                            className={prova.highlight ? "bg-green-200" : ""}>
                                            <td className="px-4 py-3 border-b border-gray-200">{prova.cliente}</td>
                                            <td className="px-4 py-3 border-b border-gray-200">
                                                {
                                                    new Date(prova.data).toLocaleDateString('it-IT')
                                                }
                                            </td>
                                            <td className="px-4 py-3 border-b border-gray-200">{prova.venditore}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
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
