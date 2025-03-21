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

export default function Pivot({ tableid, searchTerm, filters, context }: PropsInterface) {
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
                                    { recordid: "", css: "bg-gray-200", type: "standard", value: "Casa Sirio Via Giuseppe Stabile 3" },
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
                                recordid: "00000000000000000000000000001618",
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
    
    // Stato per tenere traccia dei gruppi espansi/collassati
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

    // Funzione per gestire il toggle dei gruppi
    const toggleGroup = (groupIndex: number) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupIndex]: !prev[groupIndex]
        }));
    };

    const {refreshTable, handleRowClick} = useRecordsStore();

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'getPitservicePivotLavanderie', // riferimento api per il backend
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

    // Inizializza tutti i gruppi come espansi all'inizio
    useEffect(() => {
        if (responseData.groups.length > 0) {
            const initialExpandedState: Record<number, boolean> = {};
            responseData.groups.forEach((_, index) => {
                initialExpandedState[index] = true; // true significa espanso
            });
            setExpandedGroups(initialExpandedState);
        }
    }, [responseData.groups.length]);

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="h-full flex flex-col space-y-4">
                    <div className="w-full flex-grow relative overflow-auto rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300 table-fixed">
                            <thead className="text-xs sticky top-0 z-10">
                                <tr className="bg-gray-100 dark:from-gray-700 dark:to-gray-800">
                                    {response.columns.map((column, index) => (
                                        <th
                                            scope="col"
                                            className={`px-4 py-3 font-semibold tracking-wider text-gray-700 dark:text-gray-300 ${index === 0 ? 'w-1/3' : ''}`} // Add conditional class for the first column
                                            key={`${column.desc}-${index}`}
                                        >
                                            {column.desc}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                            {response.groups.map((group, groupIndex) => (
                                <React.Fragment key={groupIndex}>
                                    {/* Main group row */}
                                    <tr 
                                        className={`border-b border-gray-100 dark:border-gray-700 transition-all duration-200 ease-in-out  hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                                            expandedGroups[groupIndex] 
                                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
                                                : 'bg-white dark:bg-gray-800'
                                        }`}
                                        onClick={() => toggleGroup(groupIndex)}
                                    >
                                        {group.fields.map((field, fieldIndex) => (
                                            <td 
                                                className={`px-4 py-3 ${
                                                    fieldIndex === 0 ? 'flex items-center' : ''
                                                } ${field.css}`} 
                                                key={`${field.value}-${fieldIndex}`}
                                            >
                                                {fieldIndex === 0 ? (
                                                    <>
                                                        <span className={`mr-2 inline-flex items-center justify-center ${
                                                            expandedGroups[groupIndex] 
                                                                ? 'text-gray-600 dark:text-gray-400' 
                                                                : 'text-gray-400 dark:text-gray-500'
                                                        }`}>
                                                            <svg className={`w-4 h-4 transition-transform duration-300 ${
                                                                expandedGroups[groupIndex] ? 'transform rotate-90' : ''
                                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                                            </svg>
                                                        </span>
                                                        <span className="truncate font-semibold">{field.value}</span>
                                                    </>
                                                ) : (
                                                    <span className="truncate">{field.value}</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Child rows */}
                                    {expandedGroups[groupIndex] && group.rows.map((row, rowIndex) => (
                                        <tr 
                                            className={`w-full border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 ${
                                                rowIndex % 2 === 0 
                                                    ? 'bg-white dark:bg-gray-800' 
                                                    : 'bg-white dark:bg-gray-750'
                                            } hover:bg-blue-50/50 dark:hover:bg-gray-700/80 transition-all duration-200 ease-in-out`} 
                                            key={`${rowIndex}`}
                                            onClick={() => handleRowClick(row.recordid, 'task', '')}
                                        >
                                            {row.fields.map((field, fieldIndex) => (
                                                <td 
                                                    className={`px-4 py-2.5 ${
                                                        fieldIndex === 0 
                                                            ? 'pl-10 border-l-2 border-gray-300 dark:border-gray-600' 
                                                            : ''
                                                    } ${field.css}`} 
                                                    key={`${field.value}-${fieldIndex}`}
                                                >
                                                    <div className="truncate">{field.value}</div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <nav aria-label="Page navigation" className="flex justify-center">
                        <ul className="inline-flex text-xs rounded-lg shadow-sm overflow-hidden">
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-e-0 border-gray-200 rounded-s-lg hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                Prev
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">1</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">2</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 text-white border border-gray-200 bg-blue-500 hover:bg-blue-600 transition-colors duration-150 dark:border-gray-700 dark:bg-blue-600 dark:hover:bg-blue-700">3</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">4</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">5</a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-200 rounded-e-lg hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                                Next
                                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </a>
                        </li>
                        </ul>
                    </nav>
                </div>
            )}
        </GenericComponent>
    );
};