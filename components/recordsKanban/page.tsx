"use client"

import { KanbanBoard } from "@/components/recordsKanban/kanbanBoard"
import type { KanbanBoard as ResponseInterface } from "./types/kanban";
import { useState, useEffect, useMemo } from "react"
import { useApi } from "@/utils/useApi"
import { useRecordsStore } from "@/components/records/recordsStore"
import GenericComponent from "@/components/genericComponent"
import { KanbanProvider } from "@/context/recordsKanban/kanbanContext"
import { useKanbanContext } from "@/hooks/useKanban";

const isDev = false
const devApiDelay = 1500

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

export default function KanbanPage({ tableid, searchTerm, filters, view, context, pagination, order, masterTableid, masterRecordid }: PropsInterface) {
  const [responseData, setResponseData] = useState<ResponseInterface>();
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
              setResponseData(undefined);
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
        <KanbanProvider>
          <div className="h-screen">
            <KanbanBoard boardProp={response} />
          </div>
        </KanbanProvider>
      )}
      
    </GenericComponent>
  )
}