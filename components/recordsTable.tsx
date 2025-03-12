import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import { ArrowUp, ArrowDown } from 'lucide-react';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          tableid?: string;
          searchTerm?: string;
          filters?: string;
          view?: string;
          order?: string[];
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

// TIPO DI ORDINAMENTO
type SortDirection = 'asc' | 'desc' | null;

export default function RecordsTable({ tableid, searchTerm, filters, view, context }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid + ' ' + searchTerm + ' ' + filters + ' ' + context;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                rows: [],
                columns: []
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
                                value: "macbook"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "nero"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Laptop"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "2k"
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
                                value: "surface",
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "bianco",
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Laptop",
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "1k",
                            },
                        ]
                    },
                ],
                columns: [
                    {
                        fieldtypeid: "Numero",
                        desc: 'Product name'
                    },
                    {
                        fieldtypeid: "Numero",
                        desc: 'Color'
                    },
                    {
                        fieldtypeid: "Numero",
                        desc: 'Type'
                    },
                    {
                        fieldtypeid: "Numero",
                        desc: 'Price'
                    },
                ],
              };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    // STATO PER L'ORDINAMENTO (solo parte grafica)
    const [sortConfig, setSortConfig] = useState<{
        columnDesc: string | null;
        direction: SortDirection;
    }>({
        columnDesc: null,
        direction: null
    });

    const {refreshTable, handleRowClick} = useRecordsStore();

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_table_records', // riferimento api per il backend
            tableid: tableid,
            searchTerm: searchTerm,
            view: view,
        };
    }, [refreshTable, tableid]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non toccare)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response.data);
        }
    }, [response, responseData]);

    // FUNZIONE PER GESTIRE IL CLICK SULL'INTESTAZIONE DELLA COLONNA (solo parte grafica)
    const handleSort = (columnDesc: string) => {
        let direction: SortDirection = 'asc';
        
        if (sortConfig.columnDesc === columnDesc) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction === 'desc') {
                direction = null;
            }
        }
        
        setSortConfig({
            columnDesc: direction === null ? null : columnDesc,
            direction
        });
        
        // Qui in futuro potresti aggiungere la chiamata al backend per il vero ordinamento
        console.log(`Ordinamento colonna ${columnDesc} in direzione ${direction}`);
        setOrderColumn(columnDesc, direction);
    };


    const setOrderColumn = async (columnDesc: string, direction: SortDirection ) => {
        try {
            await axiosInstance.post('/commonapp/set_column_order/', { columnDesc, direction});
            toast.success('ordinamento cambiato');
        } catch (error) {
            console.error('Errore durante l\'eliminazione del record', error);
            toast.error('Errore durante l\'eliminazione del record');
        }
    }

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="h-full">
                    <div className="w-full h-full relative overflow-auto rounded-lg drop-shadow-sm ">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    {response.columns.map((column) => (
                                        <th 
                                            scope="" 
                                            className="px-6 py-3 cursor-pointer select-none" 
                                            key={column.desc}
                                            onClick={() => handleSort(column.desc)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{column.desc}</span>
                                                <div className="w-4 h-4 ml-1">
                                                    {sortConfig.columnDesc === column.desc && sortConfig.direction === 'asc' && (
                                                        <ArrowUp className="h-4 w-4" />
                                                    )}
                                                    {sortConfig.columnDesc === column.desc && sortConfig.direction === 'desc' && (
                                                        <ArrowDown className="h-4 w-4" />
                                                    )}
                                                    {/* Placeholder invisibile per mantenere lo spazio costante */}
                                                    {(sortConfig.columnDesc !== column.desc || sortConfig.direction === null) && (
                                                        <span className="invisible h-4 w-4">
                                                            <ArrowUp className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {response.rows.map((row) => (
                                    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" key={row.recordid} onClick={() => handleRowClick && tableid && context && handleRowClick(row.recordid, tableid, context)}>
                                        {row.fields.map((field) => (
                                            <td className="px-6 py-4" key={field.value}>
                                                {field.value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <nav aria-label="Page navigation example" className="text-center mt-4">
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
                </div>
            )}
        </GenericComponent>
    );
};