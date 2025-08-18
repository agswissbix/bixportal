import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import RecordPreviewCard from './recordPreviewCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = true;
const devApiDelay = 1500;

// --- INTERFACCE AGGIORNATE PER KANBAN ---

// Singolo record con campi come oggetto chiave-valore
interface RecordData {
    recordid: string;
    css?: string;
    fields: { [key: string]: string };
}

// Gruppo Kanban che contiene un titolo e un array di record
interface KanbanGroup {
    groupTitle: string;
    records: RecordData[];
}

// Interfaccia della risposta API aggiornata
interface ResponseInterface {
    totalRecords: number;
    groups: KanbanGroup[];
}

interface PropsInterface {
    tableid?: string;
    searchTerm?: string;
    filters?: string;
    view?: string;
    context?: string;
    masterTableid?: string;
    masterRecordid?: string;
    // La paginazione e l'ordinamento vengono mantenuti per la logica di fetching
    pagination?: { page: number; limit: number; };
    order?: { columnDesc: string | null; direction: 'asc' | 'desc' | null; };
}

export default function RecordsKanban({ tableid, searchTerm, filters, view, context, pagination, order, masterTableid, masterRecordid }: PropsInterface) {

    // --- DATI DI ESEMPIO AGGIORNATI PER KANBAN ---

    const responseDataDEFAULT: ResponseInterface = {
        totalRecords: 0,
        groups: [],
    };

    const responseDataDEV: ResponseInterface = {
        totalRecords: 3,
        groups: [
            {
                groupTitle: "Laptop Windows",
                records: [
                    {
                        recordid: "2",
                        css: "border-l-4 border-blue-500",
                        fields: {
                            "Product name": "Surface",
                            "Color": "bianco",
                            "Price": "1k",
                        },
                    },
                    {
                        recordid: "3",
                        css: "border-l-4 border-blue-500",
                        fields: {
                            "Product name": "Lenovo",
                            "Color": "nero",
                            "Price": "1k",
                        },
                    },
                ],
            },
            {
                groupTitle: "Laptop Apple",
                records: [
                    {
                        recordid: "1",
                        css: "border-l-4 border-green-500",
                        fields: {
                            "Product name": "Macbook",
                            "Color": "nero",
                            "Price": "2k",
                        },
                    },
                ],
            },
        ],
    };

    const [responseData, setResponseData] = useState<ResponseInterface>(responseDataDEFAULT);
    const [devLoading, setDevLoading] = useState(isDev);

    const { refreshTable, handleRowClick } = useRecordsStore();

    // La logica di fetch rimane simile, ma si aspetta la nuova struttura dati
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_table_records_kanban', // Potrebbe puntare a una route diversa
            tableid, searchTerm, view, pagination, order,
            masterTableid, masterRecordid,
            _refreshTick: refreshTable
        };
    }, [tableid, searchTerm, view, pagination, order, masterTableid, masterRecordid, refreshTable]);

    const { response, loading: apiLoading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null, elapsedTime: 0 };

    useEffect(() => {
        if (isDev) {
            setDevLoading(true);
            const timer = setTimeout(() => {
                setResponseData(responseDataDEV);
                setDevLoading(false);
            }, devApiDelay);
            return () => clearTimeout(timer);
        }
    }, [refreshTable]);

    useEffect(() => {
        if (!isDev && response) {
            setResponseData(response);
        }
    }, [response]);

    const loading = isDev ? devLoading : apiLoading;

    return (
        <GenericComponent response={responseData} loading={loading} error={error} title='recordsKanban' elapsedTime={elapsedTime}>
            {(response: ResponseInterface) => (
                <div className="h-full w-full flex flex-col">
                    {/* Header con conteggio totale */}
                    <div className="p-2 mb-4">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Totale Record: </span>
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{response.totalRecords}</span>
                    </div>

                    {/* Container principale del Kanban con scroll orizzontale */}
                    <div className="flex-grow overflow-x-auto pb-4">
                        <div className="inline-flex h-full space-x-4">
                            
                            {/* Mappatura dei gruppi per creare le colonne */}
                            {response.groups.map((group) => (
                                <div key={group.groupTitle} className="flex-shrink-0 w-80 h-full bg-gray-100 dark:bg-gray-900 rounded-xl p-3">
                                    {/* Titolo della colonna */}
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="font-bold text-lg text-gray-800 dark:text-gray-200">{group.groupTitle}</h2>
                                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                            {group.records.length}
                                        </span>
                                    </div>

                                    {/* Container per le card con scroll verticale */}
                                    <div className="h-[calc(100%-4rem)] overflow-y-auto pr-1">
                                        {group.records.map((record) => (
                                            <RecordPreviewCard
                                                key={record.recordid}
                                                recordid={record.recordid}
                                                fields={record.fields}
                                                css={record.css}
                                                onClick={() => handleRowClick && tableid && context && handleRowClick(context, record.recordid, tableid, masterTableid, masterRecordid)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            )}
        </GenericComponent>
    );
};