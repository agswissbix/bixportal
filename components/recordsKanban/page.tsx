"use client"

import { KanbanBoard } from "@/components/recordsKanban/kanbanBoard"
import type { KanbanBoard as ResponseInterface } from "./types/kanban";
import { useState, useEffect, useMemo } from "react"
import { useApi } from "@/utils/useApi"
import { useRecordsStore } from "@/components/records/recordsStore"
import GenericComponent from "@/components/genericComponent"
import { KanbanProvider } from "@/context/recordsKanban/kanbanContext"
import { useKanbanContext } from "@/hooks/useKanban";
import type { KanbanBoard as KanbanBoardType } from "./types/kanban";

const isDev = true
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

const responseDataDEFAULT: KanbanBoardType = {
id: "1",
isDraggable: false,
columns: [],
}

const responseDataDEV: KanbanBoardType = {
id: "1",
isDraggable: true,
columns: [
    {
    id: "todo",
    title: "Da Fare",
    color: "bg-gray-300",
    order: 0,
    editable: true,
    tasks: [
      {
        recordid: "1",
        css: "border-l-4 border-red-500",
        fields: {
            "Product name": "Macbook",
            Color: "nero",
            Price: "2k",
        },
      },
      {
        recordid: "2",
        css: "border-l-4 border-yellow-500",
        fields: {
            "Product name": "iPhone",
            Color: "bianco",
            Price: "1k",
        },
      }
    ],
    },
    {
    id: "in-progress",
    title: "In Corso",
    color: "bg-blue-100",
    order: 1,
    editable: true,
    tasks: [
        {
        recordid: "3",
        css: "border-l-4 border-blue-500",
        fields: {
            "Product name": "iPad",
            Color: "grigio",
            Price: "1.5k",
        }
        },
    ],
    },
    {
    id: "review",
    title: "In Revisione",
    color: "bg-yellow-100",
    order: 2,
    editable: true,
    tasks: [
        {
        recordid: "4",
        css: "border-l-4 border-purple-500",
        },
    ],
    },
    {
    id: "done",
    title: "Completato",
    color: "bg-green-100",
    order: 3,
    editable: true,
    tasks: [
        {
        recordid: "5",
        css: "border-l-4 border-green-500",
        fields: {
            "Product name": "Apple Watch",
            Color: "nero",
            Price: "500",
        }
        },
    ],
    },
],
}

export default function KanbanPage({ tableid, searchTerm, filters, view, context, pagination, order, masterTableid, masterRecordid }: PropsInterface) {
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
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
          <div className="h-full">
            <KanbanBoard boardProp={response} />
          </div>
        </KanbanProvider>
      )}
      
    </GenericComponent>
  )
}