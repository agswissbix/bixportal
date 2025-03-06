import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          tableid?: string;
          searchTerm?: string;
          filters?: string;
          context?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            rows: Array<{
                recordid: string;
                css: string;
                fields: Array<{
                    recordid?: string;
                    css: string;
                    type: string;
                    value: string;
                }>
            }>;
            columns: Array<{
                fieldtypeid: string;
                desc: string;
            }>;
        }

export default function RecordsTable({ tableid,searchTerm,filters,context }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid + ' ' + searchTerm + ' ' + filters + ' ' + context;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                rows: [],
                columns: [],
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                rows: [
                    {
                        recordid: "1",
                        css: "#",
                        fields: [
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Res. sole"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Pregassona"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Cofis"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "x"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "x"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: ""
                            },
                        ]
                    },
                    {
                        recordid: "2",
                        css: "#",
                        fields: [
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Via rava 11"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Viganello"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Cofis"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "x"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "x"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "x"
                            },
                        ]
                    },
                ],
                columns: [
                    {
                        fieldtypeid: "Parola",
                        desc: ''
                    },
                    {
                        fieldtypeid: "Parola",
                        desc: '  '
                    },
                    {
                        fieldtypeid: "Parola",
                        desc: '   '
                    },
                    {
                        fieldtypeid: "Parola",
                        desc: 'Gennaio'
                    },
                    {
                        fieldtypeid: "Parola",
                        desc: 'Febbraio'
                    },
                    {
                        fieldtypeid: "Parola",
                        desc: 'Marzo'
                    },
                ],
              };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    const {refreshTable,handleRowClick} = useRecordsStore();


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_table_records', // riferimento api per il backend
            tableid: tableid,
            searchTerm: searchTerm,


        };
    }, [refreshTable, tableid]);

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
                <div className="h-full">
                    <div className="w-full h-full relative overflow-auto">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    {response.columns.map((column) => (
                                        <th scope="" className="px-6 py-3" key={column.desc}>
                                            {column.desc}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {response.rows.map((row) => (
                                    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer" key={row.recordid} onClick={() => handleRowClick && tableid && context && handleRowClick(row.recordid, tableid, context)}>
                                        {row.fields.map((field) => (
                                            <td className="px-6 py-4" key={field.value}>
                                                {field.value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <nav aria-label="Page navigation example" className="text-center">
                        <ul className="inline-flex text-sm">
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">Previous</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">1</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">2</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 text-blue-600 border border-gray-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white">3</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">4</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">5</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">Next</a>
                        </li>
                        </ul>
                    </nav>
            </div>
            )}
        </GenericComponent>
    );
};
