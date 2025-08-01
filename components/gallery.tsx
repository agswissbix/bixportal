import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import { ArrowUp, ArrowDown } from 'lucide-react';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'sonner';
import { set } from 'lodash';
import GalleryCard from './galleryCard';

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
          pagination?: {
            page: number;
            limit: number;
          }
          level?: number;
          masterTableid?: string;
          masterRecordid?: string;
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
                    fieldid: string;
                }>
            }>;
            columns: Array<{    
                fieldtypeid: string;
                desc: string;
            }>;
        }

// TIPO DI ORDINAMENTO
type SortDirection = 'asc' | 'desc' | null;

export default function GalleryView({ tableid, searchTerm, filters, view, order, context, pagination = { page: 1, limit: 50 }, level, masterTableid, masterRecordid }: PropsInterface) {
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
                                value: "macbook",
                                fieldid: "1"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "nero",
                                fieldid: "2"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Laptop",
                                fieldid: "3"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "2k",
                                fieldid: "4"
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
                                fieldid: "1"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "bianco",
                                fieldid: "2"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "Laptop",
                                fieldid: "3"
                            },
                            {
                                recordid: "",
                                css: "",
                                type: "standard",
                                value: "1k",
                                fieldid: "4"
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
    const [cardLevel, setCardLevel] = useState<number>(0);

    // STATO PER L'ORDINAMENTO (solo parte grafica)
    const [sortConfig, setSortConfig] = useState<{
        columnDesc: string | null;
        direction: SortDirection;
    }>({
        columnDesc: null,
        direction: null
    });

    const {refreshTable, setRefreshTable, handleRowClick, setCurrentPage} = useRecordsStore();

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_table_records', // riferimento api per il backend
            tableid: tableid,
            searchTerm: searchTerm,
            view: view,
            currentPage: pagination.page,
            masterTableid: masterTableid,
            masterRecordid: masterRecordid
        };
    }, [refreshTable, tableid,]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null, elapsedTime:null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non toccare)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
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
        
    }

    const setTablePage = async (page: number) => {
        if (page < 1) {
            page = 1;
        }
        if (page > pagination.limit) {
            page = pagination.limit;
        }
        setCurrentPage(page);       
        setRefreshTable(v => v + 1) 
    }

    return (
        <GenericComponent response={responseData} loading={loading} error={error} title='recordsTable' elapsedTime={elapsedTime}> 
            {(response: ResponseInterface) => (
                <div className="h-full w-full ">
                    
                    <div className="w-full h-full relative rounded-lg drop-shadow-md ">

                    <div className='h-5/6 w-full flex flex-wrap overflow-y-scroll  '>
                        {response.rows.map((row) => (
                                <GalleryCard key={row.recordid} tableid={tableid} recordid={row.recordid} />
                        ))}
                    </div>
               

                        <nav aria-label="Page navigation example" className="h-1/6 text-center mt-4">
                            <ul className="inline-flex text-sm">
                                {/* Pulsante Previous */}
                                <li>
                                    <button 
                                        onClick={() => setTablePage(pagination.page - 1)} 
                                        disabled={pagination.page === 1} 
                                        className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight border border-e-0 rounded-s-lg 
                                            ${pagination.page === 1 ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700'} 
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                                    >Previous</button>
                                </li>
                                {/* Prima pagina */}
                                <li>
                                    <button 
                                        onClick={() => setTablePage(1)} 
                                        className={`flex items-center justify-center px-3 h-8 border 
                                            ${pagination.page === 1 ? 'text-white bg-blue-600' : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700'} 
                                            dark:border-gray-700 ${pagination.page === 1 ? 'dark:bg-blue-600' : 'dark:bg-gray-800'} dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                                    >1</button>
                                </li>
                                
                                {/* Puntini di sospensione (se necessario) */}
                                {pagination.page > 3 && (
                                    <li>
                                        <span className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">...</span>
                                    </li>
                                )}
                                
                                {/* Pagina corrente (se non è la prima o l'ultima) */}
                                {pagination.page !== 1 && pagination.page !== pagination.limit && (
                                    <li>
                                        <button 
                                            className="flex items-center justify-center px-3 h-8 border text-white bg-blue-600 
                                                dark:border-gray-700 dark:bg-blue-600 dark:text-white"
                                        >{pagination.page}</button>
                                    </li>
                                )}
                                
                                {/* Puntini di sospensione (se necessario) */}
                                {pagination.page < pagination.limit - 2 && (
                                    <li>
                                        <span className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">...</span>
                                    </li>
                                )}
                                
                                {/* Ultima pagina (se diversa dalla prima) */}
                                {pagination.limit > 1 && (
                                    <li>
                                        <button 
                                            onClick={() => setTablePage(pagination.limit)} 
                                            className={`flex items-center justify-center px-3 h-8 border 
                                                ${pagination.page === pagination.limit ? 'text-white bg-blue-600' : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700'} 
                                                dark:border-gray-700 ${pagination.page === pagination.limit ? 'dark:bg-blue-600' : 'dark:bg-gray-800'} dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                                        >{pagination.limit}</button>
                                    </li>
                                )}
                                
                                {/* Pulsante Next */}
                                <li>
                                    <button 
                                        onClick={() => setTablePage(pagination.page + 1)} 
                                        disabled={pagination.page === pagination.limit} 
                                        className={`flex items-center justify-center px-3 h-8 leading-tight border rounded-e-lg 
                                            ${pagination.page === pagination.limit ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700'} 
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                                    >Next</button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    {tableid}
                </div>
            )}
        </GenericComponent>
    );
};