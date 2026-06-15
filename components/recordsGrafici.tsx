"use client"

import { useMemo, useContext, useState, useEffect, useRef } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import { AppContext } from "@/context/appContext"
import { useRecordsStore } from "./records/recordsStore"
import { useRecordActions } from "../hooks/useRecordActions"
import {
  ArrowUp,
  ArrowDown,
  ImageIcon,
  SquareArrowOutUpRight,
  Copy,
  Trash2,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  X,
  CirclePlus,
} from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import DynamicMenuItem, { CustomFunction } from './dynamicMenuItem';
import { TableSkeleton } from './tableSkeleton';
import ReadOnlyEditor from './ReadonlyEditor';
import MarkdownPreview from "./MarkdownPreview"
import GenericApexChart from "./charts/genericApexChart"
import Select from "react-select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
// FLAG PER LO SVILUPPO
const isDev = false

// INTERFACCE

// OGGETTO ORDINAMENTO (MODIFICATO)
interface SortOrder {
  fieldid: string | null
  direction: SortDirection
}

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string
  searchTerm?: string
  filters?: string
  view?: string
  order?: SortOrder
  context?: string
  pagination?: {
    page: number
  }
  level?: number
  limit?: number
  filtersList?: Array<{
    fieldid: string
    type: string
    label: string
    value: string
  }>
  masterTableid?: string
  masterRecordid?: string
  typepreference?: string
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  counter?: number
  rows: Array<{
    recordid: string
    css: string
    is_partial?: boolean
    linkedorder?: number // Added linkedorder field
    fields: Array<{
      recordid?: string
      css: string
      type: string
      value: string
      fieldid: string
      userid?: string
      linkedmaster_tableid?: string
      linkedmaster_recordid?: string
    }>
  }>
  columns: Array<{
    fieldtypeid: string
    desc: string
    fieldid: string
  }>
  totals?: {
    [fieldid: string]: number | null
  }
  pagination: {
    currentPage: number
    totalPages: number
  }
  order: SortOrder
}

interface TableSetting {
  tablesettings: Record<string, { type: string; value: string }>;
}

interface ResponseCustomFunction {
  fn: CustomFunction[];
}

// TIPO DI ORDINAMENTO
type SortDirection = "asc" | "desc" | null

export default function RecordsGrafici({
  tableid,
  searchTerm,
  filters,
  view,
  order,
  context,
  level,
  masterTableid,
  masterRecordid,
  filtersList,
  limit = 100,
  typepreference = "search_results_fields",
}: PropsInterface) {
  //DATI
  // DATI PROPS PER LO SVILUPPO
  const devPropExampleValue = isDev ? "Example prop" : tableid + " " + searchTerm + " " + filters + " " + context

  // DATI RESPONSE DI DEFAULT
  const responseDataDEFAULT: ResponseInterface = {
    counter: 0,
    rows: [],
    columns: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
    },
    order: {
      // <-- Aggiunto valore di default
      fieldid: null,
      direction: null,
    },
  }

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
            fieldid: "1",
          },
          {
            recordid: "",
            css: "",
            type: "standard",
            value: "nero",
            fieldid: "2",
          },
          {
            recordid: "",
            css: "",
            type: "standard",
            value: "Laptop",
            fieldid: "3",
          },
          {
            recordid: "",
            css: "",
            type: "standard",
            value: "2k",
            fieldid: "4",
          },
        ],
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
            fieldid: "1",
          },
          {
            recordid: "",
            css: "",
            type: "standard",
            value: "bianco",
            fieldid: "2",
          },
          {
            recordid: "",
            css: "",
            type: "standard",
            value: "Laptop",
            fieldid: "3",
          },
          {
            recordid: "",
            css: "",
            type: "standard",
            value: "1k",
            fieldid: "4",
          },
        ],
      },
    ],
    columns: [
      {
        fieldtypeid: "Numero",
        desc: "Product name",
        fieldid: "1",
      },
      {
        fieldtypeid: "Numero",
        desc: "Color",
        fieldid: "2",
      },
      {
        fieldtypeid: "Numero",
        desc: "Type",
        fieldid: "3",
      },
      {
        fieldtypeid: "Numero",
        desc: "Price",
        fieldid: "4",
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 5, // Esempio per lo sviluppo
    },
    order: {
      // <-- Aggiunto per lo sviluppo
      fieldid: "4", // Esempio: ordinato per Price
      direction: "desc",
    },
  }

  // DATI DEL CONTESTO
  const { user } = useContext(AppContext)

  // IMPOSTAZIONE DELLA RESPONSE (non toccare)
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT)

  // STATO PER L'ORDINAMENTO (MODIFICATO: ora usa fieldid)
  const [sortConfig, setSortConfig] = useState<SortOrder>(order || { fieldid: null, direction: null })

  const [currentPage, setCurrentPage] = useState(1)

  const [isDeleteAble, setIsDeleteAble] = useState(false);
  const [isDuplicateAble, setIsDuplicateAble] = useState(false);
  const [canView, setCanView] = useState(null);

  const [rowOpen, setRowOpen] = useState<string | null>(null)

  const [errorFile, setErrorFile] = useState<Record<string, boolean>>({})
  const [zoomImg, setZoomImg] = useState<string | null>(null)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    recordid: string | null
  } | null>(null)

  const [isReorderMode, setIsReorderMode] = useState(false)
  const [draggedRow, setDraggedRow] = useState<string | null>(null)
  const [dragOverRow, setDragOverRow] = useState<string | null>(null)

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [columnContextMenu, setColumnContextMenu] = useState<{
    x: number
    y: number
    columnId: string
  } | null>(null)


  const {
    isTableChanging,
    setTableChangeCompleted,
    refreshTable,
    setRefreshTable,
    handleRowClick,
    cardsList,
    addCard,
    setTableSettings,
    tableSettings,
    getIsSettingAllowed,
    setColumnOrder
  } = useRecordsStore()

  const { activeServer } = useContext(AppContext);

  const [chartsList, setChartsList] = useState<Array<{id: string, name: string, layout: string}>>([])
  const [selectedCharts, setSelectedCharts] = useState<string[]>([])

  const chartsPayload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_table_charts",
      tableid: tableid,
    }
  }, [tableid])

  const { response: chartsResponse } = useApi<{charts: Array<{id: string, name: string, layout: string}>}>(!isDev && chartsPayload ? chartsPayload : null)

  useEffect(() => {
    if (chartsResponse?.charts) {
      setChartsList(chartsResponse.charts)
      if (chartsResponse.charts.length > 0 && selectedCharts.length === 0) {
        setSelectedCharts([String(chartsResponse.charts[0].id)])
      }
    }
  }, [chartsResponse])

  const handleSelectChange = (selectedOptions: any) => {
    const options = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [];
    setSelectedCharts(options);
  }

  const reactSelectOptions = useMemo(() => {
    return chartsList.map(chart => ({ value: String(chart.id), label: chart.name }));
  }, [chartsList]);

  const currentSelectedOptions = useMemo(() => {
    return reactSelectOptions.filter(opt => selectedCharts.includes(opt.value));
  }, [selectedCharts, reactSelectOptions]);

  // Quando la tabella cambia (es. tableid), resetta la pagina a 1
  useEffect(() => {
    setCurrentPage(1)
  }, [tableid,responseData?.pagination?.totalPages])

  // useEffect(() => {
  //   console.log("total pages", responseData?.pagination?.totalPages, "current page", currentPage)
  //   if (responseData?.pagination?.totalPages !== 0 && responseData?.pagination?.totalPages < currentPage) {
  //     setCurrentPage(1)
  //   }
  // }, [responseData?.pagination?.totalPages])
  const [showContextMenuTip, setShowContextMenuTip] = useState(true)

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null)
      setColumnContextMenu(null)
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  useEffect(() => {
    const openCard = cardsList.find((card) => card.tableid === tableid && card.recordid)

    if (openCard) {
      setRowOpen(openCard.recordid)
    } else {
      setRowOpen(null)
    }
  }, [cardsList, tableid])

  // PAYLOAD (solo se non in sviluppo)
  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_table_records", // riferimento api per il backend
      tableid: tableid,
      searchTerm: searchTerm,
      view: view,
      pagination: {
        page: currentPage,
        limit: limit,
      },
      order: {
        // <-- MODIFICATO
        fieldid: sortConfig.fieldid,
        direction: sortConfig.direction,
      },
      filtersList: filtersList,
      masterTableid: masterTableid,
      masterRecordid: masterRecordid,
      typepreference: typepreference,
      _refreshTick: refreshTable[tableid] ?? 0,
    }
  }, [tableid, searchTerm, view, currentPage, sortConfig, filtersList, masterTableid, masterRecordid, typepreference, refreshTable[tableid]])

  // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
  const { response, loading, error, elapsedTime } = useApi<ResponseInterface>(!isDev && payload ? payload : null)

  // AGGIORNAMENTO RESPONSE (MODIFICATO per sincronizzare anche l'ordinamento)
  useEffect(() => {
    if (!isDev && payload) {
      // Aggiorna i dati della tabella
      if (JSON.stringify(response) !== JSON.stringify(responseData)) {
        setResponseData(response)
      }
    }
  }, [response])

  // const [tableSettings, setTableSettings] = useState<Record<string, { type: string; value: string }>>({})
  const payloadSettings = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'settings_table_settings',
      tableid,
    };
  }, [tableid]);

  const { response: responseSettings, loading: loadingSettings, error: errorSettings } = !isDev && payloadSettings ? useApi<TableSetting>(payloadSettings) : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!responseSettings || !tableid) return;

    setTableSettings(tableid, responseSettings.tablesettings ?? {});
  }, [responseSettings, tableid]);

  useEffect(() => {
    if (!tableSettings || tableSettings[tableid] === undefined) return;

    setCanView(getIsSettingAllowed(tableid, 'view'))
  }, [tableSettings?.[tableid]?.view, tableid]);

  const payloadFunctions = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_custom_functions',
      tableid,
      recordid: contextMenu?.recordid || null,
    };
  }, [tableid, contextMenu?.recordid]);

  const { response: responseFunc, loading: loadingFunc, error: errorFunc } = !isDev && payloadFunctions ? useApi<ResponseCustomFunction>(payloadFunctions) : { response: null, loading: false, error: null };

  const [visibleFunctions, setVisibleFunctions] = useState<ResponseCustomFunction>(null);
  const [functionsLoading, setFunctionsLoading] = useState(false)
  const requestIdRef = useRef(0);
  const [menuOpenId, setMenuOpenId] = useState(0);


  useEffect(() => {
    requestIdRef.current += 1;
  }, [menuOpenId]);

  useEffect(() => {
    if (!contextMenu?.recordid) return;

    setVisibleFunctions(null);
    setFunctionsLoading(true);
  }, [menuOpenId]);

  useEffect(() => {
    if (!responseFunc) return;

    const currentRequestId = requestIdRef.current;

    requestAnimationFrame(() => {
      if (currentRequestId !== requestIdRef.current) return;

      setVisibleFunctions({ fn: responseFunc.fn ?? [] });
      setFunctionsLoading(false);
    });
  }, [responseFunc]);

  const [localRows, setLocalRows] = useState<typeof response.rows>([])

  useEffect(() => {
    if (responseData?.rows) {
      const sortedRows = [...responseData.rows]
      if (!sortConfig.fieldid && context === 'linked' && sortedRows.some((row) => row.linkedorder !== undefined)) {
        sortedRows.sort((a, b) => (a.linkedorder || 0) - (b.linkedorder || 0))
      }
      setLocalRows(sortedRows)
    }
  }, [responseData?.rows, sortConfig.fieldid, context])

  // FUNZIONE PER GESTIRE L'ORDINAMENTO (MODIFICATA: ora usa fieldid)
  const handleSort = (fieldid: string) => {
    let direction: SortDirection = "asc"

    if (sortConfig.fieldid === fieldid) {
      if (sortConfig.direction === "asc") {
        direction = "desc"
      } else if (sortConfig.direction === "desc") {
        direction = null
      }
    }

    setSortConfig({
      fieldid: direction === null ? null : fieldid,
      direction,
    })
    setColumnOrder({
      fieldid: fieldid,
      direction: direction === null ? null : direction,
    })
  }

  const { duplicateRecordAction, deleteRecordAction } = useRecordActions();

  const duplicateRecord = async (recordid: string) => {
    await duplicateRecordAction(tableid, recordid, masterTableid, masterRecordid);
  }

  const handleTrashClick = (recordid: string) => {
    toast.warning("Sei sicuro di voler eliminare questo record?", {
      action: {
        label: "Conferma",
        onClick: async () => {
          await deleteRecordAction(tableid, recordid, masterTableid, masterRecordid);
        },
      },
    })
  }

  const setTablePage = async (page: number) => {
    setCurrentPage(page)
    setRefreshTable(tableid)
  }

  const handleDrop = async (recordid: string) => {
    if (isReorderMode && draggedRow && draggedRow !== recordid) {
      const newRows = [...localRows]
      const draggedIndex = newRows.findIndex((r) => r.recordid === draggedRow)
      const targetIndex = newRows.findIndex((r) => r.recordid === recordid)

      const existingOrders = newRows
        .map((r) => r.linkedorder)
        .filter((order) => order !== undefined)
        .sort((a, b) => a! - b!)

      const [draggedItem] = newRows.splice(draggedIndex, 1)
      newRows.splice(targetIndex, 0, draggedItem)

      const originalOrders = new Map(localRows.map((r) => [r.recordid, r.linkedorder]))

      const updatedRows = newRows.map((r, index) => ({
        ...r,
        linkedorder: existingOrders[index],
      }))

      setLocalRows(updatedRows)

      const loadingToastId = toast.loading("Riordinamento in corso...")

      try {
        const changedRows = updatedRows.filter(
          (row) =>
            row.linkedorder !== undefined && row.linkedorder !== originalOrders.get(row.recordid),
        )

        for (const row of changedRows) {
          await axiosInstanceClient.post(
            "/postApi",
            {
              apiRoute: "fieldsupdate",
              params: {
                tableid: tableid,
                linkedorder_: row.linkedorder,
                recordid: row.recordid,
              },
            },
            {
              responseType: "blob",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          )
        }
        toast.success("Ordine aggiornato con successo", { id: loadingToastId })
      } catch (error) {
        console.error("Errore durante l'aggiornamento dell'ordine:", error)
        toast.dismiss(loadingToastId)
        toast.error("Errore durante l'aggiornamento dell'ordine: " + error?.response?.data?.error)
      }
    }
    setDragOverRow(null)
  }

  console.log("[DEBUG] RecordsTable")
  useEffect(() => {
    console.log("[DEBUG] payload changed", payload)
  }, [payload])

  useEffect(() => {
    console.log("[DEBUG] RecordsTable rendered")
  })

  const syncJob = async () => {
    try {
      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: `get_${tableid}`,
          tableid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      toast.success("Records aggiornata con successo")
    } catch (err) {
      console.error("Errore durante l'eliminazione del record", err?.response?.data?.error)
      toast.error("Errore durante l'eliminazione del record: " + err?.response?.data?.error)
    } finally {
      setRefreshTable(tableid)
    }
  }

  const createPartial = async (recordid: string) => {
    const description = window.prompt("Inserisci la descrizione per questo parziale:", "Nuovo Parziale")
    if (description === null) {
      return // User cancelled
    }
    
    const loadingToastId = toast.loading("Creazione parziale in corso...")
    try {
      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "create_partial",
          tableid: tableid,
          mastertableid: masterTableid || "",
          recordid: recordid,
          description: description,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      toast.success("Parziale creato", { id: loadingToastId })
      setRefreshTable(tableid)
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      toast.error("Errore durante la creazione del parziale")
    }
  }

  const removePartial = async (recordid: string) => {
    const loadingToastId = toast.loading("Eliminazione parziale in corso...")
    try {
      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "delete_partial",
          tableid: tableid,
          mastertableid: masterTableid || "",
          recordid: recordid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      toast.success("Parziale eliminato", { id: loadingToastId })
      setRefreshTable(tableid)
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      toast.error("Errore durante l'eliminazione del parziale")
    }
  }

  return (
    <>
      <GenericComponent
        response={responseData}
        loading={false}
        error={error}
        title="recordsGrafici"
        elapsedTime={elapsedTime}
      >
        {(response: ResponseInterface) => {
          if (loading || loadingSettings) {
            return <TableSkeleton />;
          }

          if (canView === false) {
            return <div className="h-full w-full flex items-center justify-center">Non hai il permesso di visualizzare questa tabella</div>;
          }

          return (
            <div className="h-full w-full flex flex-col p-4 overflow-auto gap-4">
              {chartsList.length > 0 ? (
                <div>
                  <label htmlFor="chart-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seleziona Grafici</label>
                  <Select
                    isMulti
                    options={reactSelectOptions}
                    value={currentSelectedOptions}
                    onChange={handleSelectChange}
                    className="text-sm max-w-xl text-gray-900"
                    classNamePrefix="react-select"
                    placeholder="Seleziona uno o più grafici..."
                    noOptionsMessage={() => "Nessun grafico trovato"}
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">Nessun grafico configurato per questa tabella.</div>
              )}

              {selectedCharts.length > 0 ? (
                <div className="flex flex-col xl:flex-row flex-wrap gap-4">
                  {selectedCharts.map(chartId => (
                    <SingleChartWrapper
                       key={chartId}
                       chartId={chartId}
                       view={view}
                       filtersList={filtersList}
                       searchTerm={searchTerm}
                       refreshTick={refreshTable[tableid] ?? 0}
                       chartsList={chartsList}
                    />
                  ))}
                </div>
              ) : (
                <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto flex-1">
                  {JSON.stringify(response?.rows, null, 2)}
                </pre>
              )}
            </div>
          )
        }}
      </GenericComponent>
    </>
  )
}

function SingleChartWrapper({
  chartId,
  view,
  filtersList,
  searchTerm,
  refreshTick,
  chartsList
}: {
  chartId: string,
  view: string | undefined,
  filtersList: any,
  searchTerm: string | undefined,
  refreshTick: number,
  chartsList: Array<{id: string, name: string, layout: string}>
}) {
  const chartDataPayload = useMemo(() => {
    if (!chartId || isDev) return null;
    return {
      apiRoute: "get_chart_data",
      chart_id: chartId,
      viewid: view,
      filtersList: filtersList,
      searchTerm: searchTerm,
      _refreshTick: refreshTick
    };
  }, [chartId, view, filtersList, searchTerm, refreshTick]);

  const { response: chartDataResponse, loading: chartDataLoading, error: chartDataError } = useApi<any>(!isDev && chartDataPayload ? chartDataPayload : null);

  const parsedChartData = useMemo(() => {
    if (!chartDataResponse) return null;
    if (chartDataResponse.chart_data && typeof chartDataResponse.chart_data === 'string') {
        try {
            return JSON.parse(chartDataResponse.chart_data);
        } catch (e) {
            console.error("Errore durante il parsing di chartDataResponse.chart_data:", e);
            return null;
        }
    }
    if (chartDataResponse.labels) return chartDataResponse;
    return null;
  }, [chartDataResponse]);

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 min-w-[400px] min-h-[400px]">
        {chartDataLoading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
                Caricamento grafico {chartsList.find(c => String(c.id) === String(chartId))?.name || chartId}...
            </div>
        ) : chartDataError ? (
            <div className="w-full h-full flex items-center justify-center text-red-500">
                Errore: {chartDataError.message || "Impossibile caricare i dati del grafico"}
            </div>
        ) : parsedChartData ? (
            <GenericApexChart 
                chartType={chartsList.find(c => String(c.id) === String(chartId))?.layout || 'linechart'} 
                chartData={parsedChartData} 
                view="chart" 
                showDataLabels={true}
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
                Nessun dato disponibile
            </div>
        )}
    </div>
  )
}
