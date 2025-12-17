"use client"

import { useMemo, useContext, useState, useEffect } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import { AppContext } from "@/context/appContext"
import { useRecordsStore } from "./records/recordsStore"
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
} from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import axiosInstanceClient from "@/utils/axiosInstanceClient"

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
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  counter?: number
  rows: Array<{
    recordid: string
    css: string
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

// TIPO DI ORDINAMENTO
type SortDirection = "asc" | "desc" | null

export default function RecordsTable({
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

  const [rowOpen, setRowOpen] = useState<string | null>(null)

  const [errorFile, setErrorFile] = useState<Record<string, boolean>>({})

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    recordid: string | null
  } | null>(null)

  const [isReorderMode, setIsReorderMode] = useState(false)
  const [draggedRow, setDraggedRow] = useState<string | null>(null)
  const [dragOverRow, setDragOverRow] = useState<string | null>(null)

  const {
    isTableChanging,
    setTableChangeCompleted,
    refreshTable,
    setRefreshTable,
    handleRowClick,
    cardsList,
    addCard,
    activeServer,
    setTableSettings,
    tableSettings,
    getIsSettingAllowed
  } = useRecordsStore()

  // Quando la tabella cambia (es. tableid), resetta la pagina a 1
  useEffect(() => {
    setCurrentPage(1)
  }, [tableid])
  const [showContextMenuTip, setShowContextMenuTip] = useState(true)

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
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
      _refreshTick: refreshTable,
    }
  }, [tableid, searchTerm, view, currentPage, sortConfig, filtersList, masterTableid, masterRecordid, refreshTable])

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

    const payloadFunctions = useMemo(() => {
        if (isDev) return null;
        return {
          apiRoute: 'get_custom_functions',
          tableid,
        };
      }, [tableid]);

      const { response: responseFunc, loading: loadingFunc, error: errorFunc } = !isDev && payloadFunctions ? useApi<ResponseCustomFunction>(payloadFunctions) : { response: null, loading: false, error: null };

      const [ customFunctions, setCustomFunctions ] = useState<ResponseCustomFunction>(null);
      useEffect(() => {
        if (!isDev && responseFunc) {
          setCustomFunctions(responseFunc);
        }
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
    // NON è più necessario chiamare setColumnOrder da zustand
  }

  const duplicateRecord = async (recordid: string) => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "duplicate_record",
          tableid,
          recordid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      if (response?.data.success == true) {
        toast.success("Record duplicato con successo")
        // handleRowClick('standard', response?.data.new_recordid, tableid);
      }
    } catch (err) {
      console.error("Errore durante la duplicazione del record", err)
      toast.error("Errore durante la duplicazione del record")
    } finally {
      setRefreshTable((v) => v + 1)
    }
  }

  const deleteRecord = async (recordid: string) => {
    try {
      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "delete_record",
          tableid,
          recordid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      toast.success("Record eliminato con successo")
    } catch (err) {
      console.error("Errore durante l'eliminazione del record", err)
      toast.error("Errore durante l'eliminazione del record")
    } finally {
      setRefreshTable((v) => v + 1)
    }
  }

  const handleTrashClick = (recordid: string) => {
    toast.warning("Sei sicuro di voler eliminare questo record?", {
      action: {
        label: "Conferma",
        onClick: async () => {
          await deleteRecord(recordid)
        },
      },
    })
  }

  const setTablePage = async (page: number) => {
    setCurrentPage(page)
    setRefreshTable((v) => v + 1)
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
        toast.success("Ordine aggiornato con successo", {id: loadingToastId})
      } catch (error) {
        console.error("Errore durante l'aggiornamento dell'ordine:", error)
        toast.dismiss(loadingToastId)
        toast.error("Errore durante l'aggiornamento dell'ordine")
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
      console.error("Errore durante l'eliminazione del record", err)
      toast.error("Errore durante l'eliminazione del record")
    } finally {
      setRefreshTable((v) => v + 1)
    }
  }
  return (
    <GenericComponent
      response={responseData}
      loading={loading}
      error={error}
      title="recordsTable"
      elapsedTime={elapsedTime}
    >
      {(response: ResponseInterface) => (
        <div className="h-full w-full flex flex-col">
          {((tableid == "job_status" && activeServer != "swissbix") ||
            (tableid == "monitoring" && activeServer == "swissbix")) && (
            <button className="bg-accent text-accent-foreground rounded-md p-2 hover:bg-accent-hover" onClick={syncJob}>
              Sincronizza
            </button>
          )}

          <div className="w-full h-full relative rounded-lg overflow-auto">
            <table className="min-w-full table-fixed text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 bg-table-background border-table-border rounded-t-2xl rounded-b-xl">
              <thead className="sticky top-0 z-20 text-xs text-gray-700 uppercase bg-table-header dark:text-gray-400 rounded-t-xl">
                <tr>
                  {isReorderMode && (
                    <th scope="col" className="px-2 py-3 w-4 min-w-[10px] max-w-[10px]">
                      <div className="flex items-center">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                  )}
                  {response?.columns.map((column, index) => {
                    const isCurrentSortField = responseData.order.fieldid === column.fieldid
                    const sortDirection = isCurrentSortField ? responseData.order.direction : null
                    const shouldShowIcon = isCurrentSortField && (sortDirection === "asc" || sortDirection === "desc")
                    const iconComponent =
                      sortDirection === "asc" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : sortDirection === "desc" ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : null

                    return (
                      <th
                        key={column.fieldid}
                        scope="col"
                        onClick={() => handleSort(column.fieldid)}
                        className={`
              px-2 py-3 cursor-pointer select-none truncate
              ${
                column.fieldtypeid === "Numero"
                  ? "min-w-[60px] max-w-[80px] text-right"
                  : "min-w-[80px] max-w-[300px] text-left"
              }
              ${
                // sticky only first column
                index === 0 ? "sticky left-0 bg-table-header" : ""
              }
            `}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-between">
                              <span className="w-full truncate">{column.desc}</span>
                              {shouldShowIcon && <div className="w-4 h-4 ml-1">{iconComponent}</div>}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{column.desc}</TooltipContent>
                        </Tooltip>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              {/* TBODY */}
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(localRows?.length > 0 ? localRows : response?.rows)?.map((row, rowIndex) => (
                  <tr
                    key={row.recordid}
                    draggable={isReorderMode}
                    onDragStart={(e) => {
                      if (isReorderMode) {
                        setDraggedRow(row.recordid)
                        e.currentTarget.style.opacity = "0.5"
                      }
                    }}
                    onDragEnd={(e) => {
                      if (isReorderMode) {
                        e.currentTarget.style.opacity = "1"
                        setDraggedRow(null)
                        setDragOverRow(null)
                      }
                    }}
                    onDragOver={(e) => {
                      if (isReorderMode) {
                        e.preventDefault()
                        setDragOverRow(row.recordid)
                      }
                    }}
                    onDrop={async (e) => {
                      e.preventDefault()
                      handleDrop(row.recordid)
                    }}
                    className={`
                      group theme-table border-b
                      ${row.css === "red" ? "bg-red-50 dark:bg-red-950/20" : ""}
                      ${row.css === "green" ? "bg-green-50 dark:bg-green-950/20" : ""}
                      ${row.css === "blue" ? "bg-blue-50 dark:bg-blue-950/20" : ""}
                      ${isReorderMode ? "cursor-move" : "cursor-pointer"}
                      ${dragOverRow === row.recordid ? "border-t-2 border-blue-500" : ""}
                      hover:bg-records-background transition-colors
                    `}
                    onClick={() =>
                      !isReorderMode &&
                      handleRowClick &&
                      tableid &&
                      context &&
                      handleRowClick(context, row.recordid, tableid, masterTableid, masterRecordid) &&
                      setRowOpen(String(row.recordid))
                    }
                    onContextMenu={(e) => {
                      e.preventDefault()
                      const container = e.currentTarget.closest(".overflow-auto")
                      const rect = container?.getBoundingClientRect()
                      const scrollX = container?.scrollLeft || 0
                      const scrollY = container?.scrollTop || 0

                      const x = e.clientX - (rect?.left || 0) + scrollX
                      const y = e.clientY - (rect?.top || 0) + scrollY
                  
                      setIsDeleteAble(getIsSettingAllowed('delete', row.recordid))

                      setContextMenu({
                        x,
                        y,
                        recordid: row.recordid,
                      })
                      setRowOpen(String(row.recordid))
                    }}
                  >
                    {isReorderMode && (
                      <td className="px-2 py-2.5 w-10 min-w- max-w-[10px] truncate">
                        <div className="flex items-center">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>
                      </td>
                    )}
                    {row.fields.map((field, index) => {
                      const column = response?.columns[index]
                      const isNumberField = column?.fieldtypeid === "Numero"
                      const isFileField = column?.fieldtypeid === "file"
                      const isLinked = field.linkedmaster_tableid && field.linkedmaster_recordid
                      console.log("[DEBUG] Rendering field", { field, column, fieldtypeid: column?.fieldtypeid })
                      return (
                        <td
                          key={`${row.recordid}-${field.fieldid}`}
                          className={`
                  px-4 py-3 align-middle
                  ${field.css}
                  ${isNumberField ? "min-w-[60px] max-w-[80px] text-right" : "min-w-[80px] max-w-[300px] text-left"}
                  ${isLinked ? "font-bold" : ""}
                  ${
                    field.css && field.css.includes("bg-")
                      ? " group-hover:bg-records-background"
                      : String(rowOpen) === String(row.recordid)
                        ? "bg-records-background group-hover:bg-records-background"
                        : " bg-table-background group-hover:bg-records-background"
                  }
                  ${
                    // sticky only first column
                    index === 0 ? "sticky left-0 z-10" : ""
                  }
                `}
                        >
                          <div className="flex items-center gap-x-2">
                            {column?.fieldtypeid === "Utente" && (
                              <img
                                src={`/api/media-proxy?url=userProfilePic/${field.userid}.png`}
                                alt="Utente"
                                className="w-6 h-6 rounded-full flex-shrink-0"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement
                                  img.src = "/api/media-proxy?url=userProfilePic/default.jpg"
                                }}
                              />
                            )}
                            {isFileField ? (
                              errorFile[field.recordid] ? (
                                <>
                                  <ImageIcon className="w-8 h-8 flex items-center justify-center text-gray-400" />
                                </>
                              ) : (
                                <img
                                  src={`/api/media-proxy?url=${field.value}`}
                                  alt="File field"
                                  className="w-8 h-8 rounded flex-shrink-0"
                                  onError={(e) => {
                                    setErrorFile((prev) => ({ ...prev, [field.recordid]: true }))
                                  }}
                                />
                              )
                            ) : isNumberField ? (
                              <span className="block truncate w-full max-h-[40px] text-right">
                                {field.value && !isNaN(Number(field.value))
                                  ? Number(field.value).toLocaleString("de-CH")
                                  : field.value}
                              </span>
                            ) : (
                              <span
                                className={`block truncate w-full max-h-[40px]`}
                                dangerouslySetInnerHTML={{ __html: field.value }}
                              />
                            )}
                            {isLinked && (
                              <button
                                type="button"
                                className="z-10 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded focus:outline-none"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addCard && addCard(field.linkedmaster_tableid!, field.linkedmaster_recordid!, "card")
                                }}
                              >
                                <SquareArrowOutUpRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>

              <tfoot className="z-20 sticky bottom-0 bg-table-header dark:bg-gray-700">
                <tr>
                  {response?.columns.map((column, index) => {
                    const isNumber = column.fieldtypeid === "Numero"
                    const totalValue = response?.totals?.[column.fieldid] ?? null

                    return (
                      <td
                        key={`total-${column.fieldid}`}
                        className={`
                          px-2 py-3 align-right font-bold text-gray-900 dark:text-white border-t border-table-border
                          ${isNumber ? "min-w-[60px] max-w-[80px] text-right whitespace-nowrap overflow-hidden text-ellipsis" : "min-w-[80px] max-w-[300px] text-left"}
                          ${index === 0 ? "sticky left-0 bg-table-header rounded-bl-xl" : ""}
                        `}
                        title={isNumber ? Number(totalValue).toLocaleString("de-CH") : ""} // Tooltip per vedere il valore intero
                      >
                        {index === 0
                          ? "Totali"
                          : isNumber
                            ? totalValue !== null
                              ? Number(totalValue).toLocaleString("de-CH")
                              : ""
                            : ""}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
            <AnimatePresence>
              {contextMenu && (
                <motion.div
                  key="context-menu"
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={{
                    type: "spring",
                    stiffness: 250,
                    damping: 25,
                    mass: 0.8,
                  }}
                  className="
                    absolute p-1 z-50
                    bg-white dark:bg-gray-800
                    border border-gray-200 dark:border-gray-600
                    rounded-lg shadow-xl
                    flex flex-col
                    min-w-[160px] overflow-hidden
                  "
                  style={{
                    top: contextMenu.y,
                    left: contextMenu.x,
                    transformOrigin: "top left",
                  }}
                >
                  <button
                    onClick={() => {
                      duplicateRecord(contextMenu.recordid)
                      setContextMenu(null)
                    }}
                    className="w-full text-left rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Duplica
                  </button>

                  {isDeleteAble && (
                    <button
                      onClick={() => {
                        handleTrashClick(contextMenu.recordid)
                        setContextMenu(null)
                      }}
                      className="w-full text-left rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                      <Trash2 className="w-4 h-4" />
                      Elimina
                    </button>
                  )}

                  {context === "linked" && (
                    <>
                      <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

                      <button
                        onClick={() => {
                          setIsReorderMode(!isReorderMode)
                          setContextMenu(null)
                        }}
                        className="w-full text-left rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <GripVertical className="w-4 h-4" />
                        {isReorderMode ? "Disattiva riordinamento" : "Riordina righe"}
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SEZIONE PAGINAZIONE AGGIORNATA */}
          <nav
            aria-label="Page navigation"
            className="mt-4 flex flex-col sm:flex-row justify-between items-center space-x-2 space-y-2 sm:space-y-0"
          >
            {/* 1. Conteggio Totale Record a Sinistra (per schermi larghi) */}
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Totale Record:</span>
              <span className="font-medium">{response?.counter}</span>
            </div>

            {/* 2. Bottoni di Paginazione al Centro */}
            <div className="flex items-center space-x-1 bg-card border border-border rounded-lg p-1 shadow-sm order-1 sm:order-2">
              {/* Previous Button */}
              <button
                onClick={() => setTablePage(response?.pagination.currentPage - 1)}
                title="Previous"
                disabled={response?.pagination.currentPage === 1}
                className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  response?.pagination.currentPage === 1
                    ? "text-muted-foreground bg-transparent cursor-not-allowed opacity-50"
                    : "text-foreground bg-transparent hover:bg-muted hover:text-primary"
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {/* First Page */}
                <button
                  onClick={() => setTablePage(1)}
                  className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 ${
                    response?.pagination.currentPage === 1
                      ? "text-primary-foreground bg-primary shadow-sm"
                      : "text-foreground bg-transparent hover:bg-muted"
                  }`}
                >
                  1
                </button>

                {/* Ellipsis */}
                {response?.pagination.currentPage > 3 && (
                  <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">...</span>
                )}

                {/* Current Page (if not first or last) */}
                {response?.pagination.currentPage !== 1 &&
                  response?.pagination.currentPage !== response?.pagination.totalPages && (
                    <button className="flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md text-primary-foreground bg-primary shadow-sm">
                      {response?.pagination.currentPage}
                    </button>
                  )}

                {/* Ellipsis */}
                {response?.pagination.currentPage < response?.pagination.totalPages - 2 && (
                  <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">...</span>
                )}

                {/* Last Page */}
                {response?.pagination.totalPages > 1 && (
                  <button
                    onClick={() => setTablePage(response?.pagination.totalPages)}
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 ${
                      response?.pagination.currentPage === response?.pagination.totalPages
                        ? "text-primary-foreground bg-primary shadow-sm"
                        : "text-foreground bg-transparent hover:bg-muted"
                    }`}
                  >
                    {response?.pagination.totalPages}
                  </button>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setTablePage(response?.pagination.currentPage + 1)}
                disabled={response?.pagination.currentPage === response?.pagination.totalPages}
                title="Next"
                className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  response?.pagination.currentPage === response?.pagination.totalPages
                    ? "text-muted-foreground bg-transparent cursor-not-allowed opacity-50"
                    : "text-foreground bg-transparent hover:bg-muted hover:text-primary"
                }`}
              >
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* 3. Dettaglio Pagina a Destra (per schermi larghi) */}
            {limit && (
              <span className="text-xs text-gray-500 dark:text-gray-400 order-3 text-center sm:text-right">
                Visualizzati: {response?.rows.length} (Pagina {response?.pagination.currentPage} di{" "}
                {response?.pagination.totalPages})
              </span>
            )}
          </nav>
        </div>
      )}
    </GenericComponent>
  )
}
