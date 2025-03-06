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
            groups: {
                rows: {
                    recordid: string;
                    css: string;
                    fields: {
                        recordid: string;
                        css: string;
                        type: string;
                        value: string;
                    }[];
                }[];
                fields: {
                    fieldid: string;
                    value: string;
                    css: string;
                }[];
            }[];
            columns: {
                fieldtypeid: string;
                desc: string;
            }[];
        }

export default function RecordsTable({ tableid,searchTerm,filters,context }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid + ' ' + searchTerm + ' ' + filters + ' ' + context;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                groups: [],
                columns: []
            };
            

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                groups: [
                    {
                        rows: [
                            {
                                recordid: "1",
                                css: "#",
                                fields: [
                                    { recordid: "", css: "bg-blue-200", type: "standard", value: "Casa Sirio Via Giuseppe Stabile 3" },
                                    { recordid: "", css: "", type: "standard", value: "2025" },
                                    { recordid: "", css: "", type: "standard", value: "2025" },
                                    { recordid: "", css: "", type: "standard", value: "2025" }
                                ]
                            },
                            {
                                recordid: "2",
                                css: "#",
                                fields: [
                                    { recordid: "", css: "", type: "standard", value: "Condominio San Giorgio" },
                                    { recordid: "", css: "", type: "standard", value: "2025" },
                                    { recordid: "", css: "", type: "standard", value: "2025" },
                                    { recordid: "", css: "", type: "standard", value: "2025" }
                                ]
                            }
                        ],

                        fields: [
                            { fieldid: "1", value: "Marvel Gestioni e Immobili Sagl",  css:"" },
                            { fieldid: "2", value: "indirizzo 1", css:"bg-green-500" }

                        ],
                    },
                    {
                        rows: [
                            {
                                recordid: "3",
                                css: "#",
                                fields: [
                                    { recordid: "", css: "", type: "standard", value: "Agenzia Immobiliare Ceresio SA" }
                                ]
                            },
                            {
                                recordid: "4",
                                css: "#",
                                fields: [
                                    { recordid: "", css: "", type: "standard", value: "Residenza Salice Via Frontini 8" },
                                    { recordid: "", css: "", type: "standard", value: "2025" },
                                    { recordid: "", css: "", type: "standard", value: "2025" },
                                    { recordid: "", css: "", type: "standard", value: "4050" }
                                ]
                            }
                        ],
                        fields: [
                            { fieldid: "1", value: "Agenzia Immobiliare Ceresio SA", css: ""},
                            { fieldid: "2", value: "indirizzo2", css:""  }

                        ]
                    },
                    {
                        rows: [
                            {
                                recordid: "5",
                                css: "#",
                                fields: [
                                    { recordid: "", css: "", type: "standard", value: "Aggestioni Sagl" }
                                ]
                            },
                            {
                                recordid: "6",
                                css: "#",
                                fields: [
                                    { recordid: "", css: "", type: "standard", value: "Condominio Liberty Via Domenico Fontana 6" },
                                    { recordid: "", css: "", type: "standard", value: "2025" },
                                    { recordid: "", css: "", type: "standard", value: "4050" },
                                    { recordid: "", css: "", type: "standard", value: "12150" }
                                ]
                            }
                        ],
                        fields: [
                            { fieldid: "1", value: "Aggestioni Sagl", css:"" },
                            { fieldid: "2", value: "indirizzo3", css:""  }

                        ]
                    }
                ],
                columns: [
                    { fieldtypeid: "Parola", desc: "Nome" },
                    { fieldtypeid: "Parola", desc: "Totale" },
                    { fieldtypeid: "Parola", desc: "Gennaio" },
                    { fieldtypeid: "Parola", desc: "Febbraio" },
                    { fieldtypeid: "Parola", desc: "Totale Complessivo" }
                ]
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
                                    {response.columns.map((column, index) => (
                                        <th scope="" className="px-6 py-3" key={`${column.desc}-${index}`}>
                                            {column.desc}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                            {response.groups.map((group, groupIndex) => (
                                <React.Fragment key={groupIndex}>
                                    {/* Main group row */}
                                    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        {group.fields.map((field, fieldIndex) => (
                                            <td className={`px-6 py-4 font-bold ${field.css}`} key={`${field.value}-${fieldIndex}`}>
                                                {field.value}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Child rows with different styling */}
                                    {group.rows.map((row, rowIndex) => (
                                        <tr className="bg-red-50 dark:bg-red-900/20" key={`${rowIndex}`}>
                                            {row.fields.map((field, fieldIndex) => (
                                                <td className={`px-6 py-4 pl-10 ${field.css}`} key={`${field.value}-${fieldIndex}`}>
                                                    {field.value}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </React.Fragment>
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
