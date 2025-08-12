import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import { ArrowUp, ArrowDown } from 'lucide-react';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'sonner';
import { set } from 'lodash';




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
          order?: {
            columnDesc: string | null;
            direction: 'asc' | 'desc' | null;
          };
          context?: string;
          pagination?: {
            page: number;
            limit: number;
          };
          level?: number;
          filtersList?: Array<{
            fieldid: string;
            type: string;   
            label: string;
            value: string;
            }>;
          masterTableid?: string;
          masterRecordid?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            counter?: number;
            rows: Array<{
                recordid: string;
                css: string;
                fields: Array<{
                    recordid?: string;
                    css: string;
                    type: string;
                    value: string;
                    fieldid: string;
                    userid?: string;
                    linkedmaster_tableid?: string;
                    linkedmaster_recordid?: string;
                }>
            }>;
            columns: Array<{    
                fieldtypeid: string;
                desc: string;
            }>;
        }

// TIPO DI ORDINAMENTO
type SortDirection = 'asc' | 'desc' | null;

export default function RecordsTable({ tableid, searchTerm, filters, view, order, context, pagination, level, masterTableid, masterRecordid }: PropsInterface) {

    useEffect(() => {
        const unsub = useRecordsStore.subscribe((state, prevState) => {
          console.log('[zustand]', { prev: prevState, next: state });
        });
        return unsub;   // pulizia
      }, []);

    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid + ' ' + searchTerm + ' ' + filters + ' ' + context;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                counter: 0,
                rows: [],
                columns: []
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                counter: 2,
                rows: [
                    {
                        recordid: "1",
                        css: "bg-green-500",
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

    // STATO PER L'ORDINAMENTO (solo parte grafica)
    const [sortConfig, setSortConfig] = useState<{
        columnDesc: string | null;
        direction: SortDirection;
    }>({
        columnDesc: null,
        direction: null
    });

    // ✅ un selector per chiave

        const {
        isTableChanging,
        setTableChangeCompleted,
        refreshTable,
        setRefreshTable,
        handleRowClick,
        setCurrentPage,
        columnOrder,
        setColumnOrder,
    } = useRecordsStore();
    
    


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_table_records', // riferimento api per il backend
            tableid: tableid,
            searchTerm: searchTerm,
            view: view,
            pagination: {
                page: pagination?.page || 1,
                limit: pagination?.limit || 10
            },
            order: {
                columnDesc: columnOrder.columnDesc,
                direction: columnOrder.direction
            },
            filtersList: filters,
            masterTableid: masterTableid,
            masterRecordid: masterRecordid
        };
    }, [tableid, refreshTable, pagination, masterTableid, masterRecordid, columnOrder.columnDesc, columnOrder.direction, filters]);


   // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: true, error: null };

  
    
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
        setColumnOrder({ columnDesc, direction });
    };
    const setTablePage = async (page: number) => {
        if (page < 1) {
            page = 1;
        }
        if (pagination && page > pagination.limit) {
            page = pagination.limit;
        }
        setCurrentPage(page);       
        setRefreshTable(v => v + 1)
    }

    console.log('[DEBUG] RecordsTable');
    useEffect(() => {
        console.log('[DEBUG] payload changed', payload);
      }, [payload]);
      
      useEffect(() => {
        console.log('[DEBUG] RecordsTable rendered');
      });
    return (
        <GenericComponent response={responseData} loading={loading} error={error} title='recordsTable' elapsedTime={elapsedTime}> 
            {(response: ResponseInterface) => (
                <div className="h-full w-full ">
                    
                    <div className="w-full h-full relative rounded-lg">
                        <table className="max-h-full block w-full h-11/12 text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 bg-table-background border-table-border rounded-t-2xl rounded-b-xl ">
                            <thead className="text-xs text-gray-700 uppercase bg-table-header  dark:text-gray-400 table table-fixed w-full rounded-t-xl">
                                <tr>
                                    {response.columns.map((column) => (
                                        <th
                                        scope=""
                                        className="px-4 py-3 cursor-pointer select-none whitespace-nowrap text-ellipsis overflow-hidden min-w-[120px] max-w-[200px]"
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
                            <tbody className="max-h-full h-11/12 overflow-y-auto overflow-x-hidden block w-full rounded-b-xl">
                                {response.rows.map((row) => (
                                    <tr className={`table table-fixed w-full  border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${row.css}`} key={row.recordid} onClick={() => handleRowClick && tableid && context && handleRowClick(context, row.recordid, tableid, masterTableid, masterRecordid)}>
                                        {row.fields.map((field, index) => {
                                            const column = response.columns[index]; // Prende la colonna corrispondente
                                            return (
                                                <td
                                                className={`px-4 py-3 whitespace-nowrap text-ellipsis overflow-hidden min-w-[120px] max-w-[200px] ${field.css}`}
                                                key={`${row.recordid}-${field.fieldid}`}
                                                >
                                                    {column?.fieldtypeid === 'Utente' && (
                                                        <img
                                                        src={`/api/media-proxy?url=userProfilePic/${field.userid}.png`}
                                                        alt="Utente"
                                                        className="w-6 h-6 rounded-full"
                                                        onError={(e) => {
                                                            const img = e.target as HTMLImageElement;
                                                            //img.onerror = null; // evita loop infinito
                                                            img.src = '/api/media-proxy?url=userProfilePic/default.jpg';
                                                        }}
                                                        />
                                                    )}
                                                    <span dangerouslySetInnerHTML={{ __html: field.value }} />
                                                </td>
                                            );
                                             })}
                                    </tr>
                                ))}

                            </tbody>
                            <tfoot className=" table table-fixed w-full rounded-b-xl bg-table-header dark:bg-gray-700">
                                <tr>
                                    <td colSpan={response.columns.length} className="px-4 py-3 text-right rounded-b-xl float-start">
                                        <span className="font-medium">Totale:</span> {response.counter}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                        

                        <nav aria-label="Page navigation example" className="h-min text-center">
                            <ul className="inline-flex text-sm">
                                {/* Pulsante Previous */}
                                <li>
                                    <button 
                                        onClick={() => pagination && setTablePage(pagination.page - 1)} 
                                        disabled={!pagination || pagination.page === 1} 
                                        className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight border border-e-0 rounded-s-lg     
                                            ${!pagination || pagination.page === 1 ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700'} 
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                                    >Previous</button>
                                </li>
                                
                                {/* Prima pagina */}
                                <li>
                                    <button 
                                        onClick={() => setTablePage(1)} 
                                        className={`flex items-center justify-center px-3 h-8 border 
                                            ${pagination && pagination.page === 1 ? 'text-white bg-blue-600' : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700'} 
                                            dark:border-gray-700 ${pagination && pagination.page === 1 ? 'dark:bg-blue-600' : 'dark:bg-gray-800'} dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                                    >1</button>
                                </li>
                                
                                {/* Puntini di sospensione (se necessario) */}
                                {pagination && pagination.page > 3 && (
                                    <li>
                                        <span className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">...</span>
                                    </li>
                                )}
                                
                                {/* Pagina corrente (se non è la prima o l'ultima) */}
                                {pagination && pagination.page !== 1 && pagination.page !== pagination.limit && (
                                    <li>
                                        <button 
                                            className="flex items-center justify-center px-3 h-8 border text-white bg-blue-600 
                                                dark:border-gray-700 dark:bg-blue-600 dark:text-white"
                                        >{pagination.page}</button>
                                    </li>
                                )}
                                
                                {/* Puntini di sospensione (se necessario) */}
                                {pagination && pagination.page < pagination.limit - 2 && (
                                    <li>
                                        <span className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">...</span>
                                    </li>
                                )}
                                
                                {/* Ultima pagina (se diversa dalla prima) */}
                                {pagination && pagination.limit > 1 && (
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
                                        onClick={() => pagination && setTablePage(pagination.page + 1)} 
                                        disabled={!pagination || pagination.page === pagination.limit} 
                                        className={`flex items-center justify-center px-3 h-8 leading-tight border rounded-e-lg 
                                            ${!pagination || pagination.page === pagination.limit ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700'} 
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white`}
                                    >Next</button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}
        </GenericComponent>
    );
};