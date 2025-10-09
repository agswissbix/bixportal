import React, { useMemo, useContext, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "./genericComponent";
import { AppContext } from "@/context/appContext";
import { useRecordsStore } from "./records/recordsStore";
import { ArrowUp, ArrowDown } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from "sonner";
import { set } from "lodash";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE



// OGGETTO ORDINAMENTO (MODIFICATO)
interface SortOrder {
  fieldid: string | null;
  direction: SortDirection;
}

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
  filters?: string;
  view?: string;
  order?: SortOrder;
  context?: string;
  pagination?: {
    page: number;
  };
  level?: number;
  limit?: number;
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
    }>;
  }>;
  columns: Array<{
    fieldtypeid: string;
    desc: string;
    fieldid: string;
  }>;
  pagination: {
    currentPage: number; // La pagina attualmente visualizzata
    totalPages: number;  // Il numero totale di pagine disponibili
  };
  order: SortOrder;
}

// TIPO DI ORDINAMENTO
type SortDirection = "asc" | "desc" | null;

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
  useEffect(() => {
    const unsub = useRecordsStore.subscribe((state, prevState) => {
      console.log("[zustand]", { prev: prevState, next: state });
    });
    return unsub; // pulizia
  }, []);

  //DATI
  // DATI PROPS PER LO SVILUPPO
  const devPropExampleValue = isDev
    ? "Example prop"
    : tableid + " " + searchTerm + " " + filters + " " + context;

  // DATI RESPONSE DI DEFAULT
  const responseDataDEFAULT: ResponseInterface = {
    counter: 0,
    rows: [],
    columns: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
    },
    order: { // <-- Aggiunto valore di default
        fieldid: null,
        direction: null
    }
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
    order: { // <-- Aggiunto per lo sviluppo
        fieldid: "4", // Esempio: ordinato per Price
        direction: "desc"
    }
  };

  // DATI DEL CONTESTO
  const { user } = useContext(AppContext);

  // IMPOSTAZIONE DELLA RESPONSE (non toccare)
  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

   // STATO PER L'ORDINAMENTO (MODIFICATO: ora usa fieldid)
  const [sortConfig, setSortConfig] = useState<SortOrder>(
    order || { fieldid: null, direction: null }
  );

  const [currentPage, setCurrentPage] = useState(1);

  // ✅ un selector per chiave

  const {
    isTableChanging,
    setTableChangeCompleted,
    refreshTable,
    setRefreshTable,
    handleRowClick,
  } = useRecordsStore();

  // Quando la tabella cambia (es. tableid), resetta la pagina a 1
    useEffect(() => {
        setCurrentPage(1);
    }, [tableid]);

  // PAYLOAD (solo se non in sviluppo)
  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: "get_table_records", // riferimento api per il backend
      tableid: tableid,
      searchTerm: searchTerm,
      view: view,
      pagination: {
        page: currentPage,
        limit: limit,
      },
      order: { // <-- MODIFICATO
        fieldid: sortConfig.fieldid,
        direction: sortConfig.direction,
      },
      filtersList: filtersList,
      masterTableid: masterTableid,
      masterRecordid: masterRecordid,
      _refreshTick: refreshTable,
    };
  }, [
    tableid,
    searchTerm,
    view,
    currentPage,
    sortConfig, 
    filtersList,
    masterTableid,
    masterRecordid,
    refreshTable,
  ]);

  // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
  const { response, loading, error, elapsedTime } =
    !isDev && payload
      ? useApi<ResponseInterface>(payload)
      : { response: null, loading: true, error: null };

  // AGGIORNAMENTO RESPONSE (MODIFICATO per sincronizzare anche l'ordinamento)
  useEffect(() => {
    if (!isDev && response) {
      // Aggiorna i dati della tabella
      if (JSON.stringify(response) !== JSON.stringify(responseData)) {
        setResponseData(response);
      }
    }
  }, [response]);

  // FUNZIONE PER GESTIRE L'ORDINAMENTO (MODIFICATA: ora usa fieldid)
  const handleSort = (fieldid: string) => {
    let direction: SortDirection = "asc";

    if (sortConfig.fieldid === fieldid) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }

    setSortConfig({
      fieldid: direction === null ? null : fieldid,
      direction,
    });
    // NON è più necessario chiamare setColumnOrder da zustand
  };



  const setTablePage = async (page: number) => {
    setCurrentPage(page);
    setRefreshTable((v) => v + 1);
  };

  console.log("[DEBUG] RecordsTable");
  useEffect(() => {
    console.log("[DEBUG] payload changed", payload);
  }, [payload]);

  useEffect(() => {
    console.log("[DEBUG] RecordsTable rendered");
  });
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
           <div className="w-full h-full relative rounded-lg overflow-auto">
            <table className="min-w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 bg-table-background border-table-border rounded-t-2xl rounded-b-xl">
              <thead className="sticky top-0 z-20 text-xs text-gray-700 uppercase bg-table-header dark:text-gray-400 rounded-t-xl">
                <tr>
                  {response.columns.map((column, index) => (
                    <th
                      key={column.fieldid}
                      scope="col"
                      onClick={() => handleSort(column.fieldid)}
                      className={`
              px-4 py-3 cursor-pointer select-none truncate
              ${
                column.fieldtypeid === "Numero"
                  ? "min-w-[60px] max-w-[80px] text-right"
                  : "min-w-[80px] max-w-[300px] text-left"
              }
              ${
                  // sticky only first column
                  index === 0
                    ? "sticky left-0 bg-table-header"
                    : ""
                }
            `}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-between">
                            <span className="truncate">{column.desc}</span>
                            <div className="w-4 h-4 ml-1">
                                {/* MODIFICA: usa responseData.order invece di sortConfig */}
                                {responseData.order.fieldid === column.fieldid &&
                                  responseData.order.direction === "asc" && (
                                    <ArrowUp className="h-4 w-4" />
                                )}
                                {responseData.order.fieldid === column.fieldid &&
                                  responseData.order.direction === "desc" && (
                                    <ArrowDown className="h-4 w-4" />
                                )}
                                {/* Questa logica di fallback può rimanere per le colonne non ordinate */}
                                {(responseData.order.fieldid !== column.fieldid ||
                                  responseData.order.direction === null) && (
                                    <span className="invisible h-4 w-4">
                                      <ArrowUp className="h-4 w-4" />
                                    </span>
                                )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{column.desc}</TooltipContent>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {response.rows.map((row) => (
                  <tr
                    key={row.recordid}
                    className={`theme-table border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer group hover:bg-records-background dark:hover:bg-secondary-hover ${row.css}`}
                    onClick={() =>
                      handleRowClick &&
                      tableid &&
                      context &&
                      handleRowClick(
                        context,
                        row.recordid,
                        tableid,
                        masterTableid,
                        masterRecordid
                      )
                    }
                  >
                    {row.fields.map((field, index) => {
                      const column = response.columns[index];
                      return (
                        <td
                          key={`${row.recordid}-${field.fieldid}`}
                          className={`
                  px-4 py-3 align-middle
                  ${field.css}
                  ${
                    column?.fieldtypeid === "Numero"
                      ? "min-w-[60px] max-w-[80px] text-right"
                      : "min-w-[80px] max-w-[300px] text-left"
                  }
                  ${
                  field.css && field.css.includes("bg-")
                    ? " group-hover:bg-records-background"
                    : " bg-table-background group-hover:bg-records-background"
                  }
                  ${
                    // sticky only first column
                    index === 0
                      ? "sticky left-0 z-10"
                      : ""
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
                                  const img = e.target as HTMLImageElement;
                                  img.src =
                                    "/api/media-proxy?url=userProfilePic/default.jpg";
                                }}
                              />
                            )}
                            <span
                              className="block truncate"
                              dangerouslySetInnerHTML={{ __html: field.value }}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              <tfoot className="z-20 sticky bottom-0 bg-table-header dark:bg-gray-700">
                <tr>
                  {response.columns.map((column, index) => (
                    <td
                      key={`total-${column.fieldid}`}
                      className={`
                        px-4 py-3 align-middle font-bold text-gray-900 dark:text-white border-t border-table-border
                        ${
                          column.fieldtypeid === "Numero"
                            ? "min-w-[60px] max-w-[80px] text-right"
                            : "min-w-[80px] max-w-[300px] text-left"
                        }
                        ${
                          index === 0 ? "sticky left-0 bg-table-header rounded-bl-xl" : ""
                        }
                      `}
                    >
                      {index === 0 && "Totali"}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          
          {/* SEZIONE PAGINAZIONE AGGIORNATA */}
          <nav
            aria-label="Page navigation"
            className="mt-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0"
          >
            {/* 1. Conteggio Totale Record a Sinistra (per schermi larghi) */}
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                Totale Record:
              </span>
              <span className="font-medium">
                {response.counter}
              </span>
            </div>

            {/* 2. Bottoni di Paginazione al Centro */}
            <div className="flex items-center space-x-1 bg-card border border-border rounded-lg p-1 shadow-sm order-1 sm:order-2">
              {/* Previous Button */}
              <button
                onClick={() =>
                  setTablePage(response.pagination.currentPage - 1)
                }
                disabled={response.pagination.currentPage === 1}
                className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  response.pagination.currentPage === 1
                    ? "text-muted-foreground bg-transparent cursor-not-allowed opacity-50"
                    : "text-foreground bg-transparent hover:bg-muted hover:text-primary"
                }`}
              >
                <ArrowUp className="w-4 h-4 mr-1 rotate-[-90deg]" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {/* First Page */}
                <button
                  onClick={() => setTablePage(1)}
                  className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 ${
                    response.pagination.currentPage === 1
                      ? "text-primary-foreground bg-primary shadow-sm"
                      : "text-foreground bg-transparent hover:bg-muted"
                  }`}
                >
                  1
                </button>

                {/* Ellipsis */}
                {response.pagination.currentPage > 3 && (
                  <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">
                    ...
                  </span>
                )}

                {/* Current Page (if not first or last) */}
                {response.pagination.currentPage !== 1 &&
                  response.pagination.currentPage !==
                    response.pagination.totalPages && (
                      <button className="flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md text-primary-foreground bg-primary shadow-sm">
                        {response.pagination.currentPage}
                      </button>
                    )}

                {/* Ellipsis */}
                {response.pagination.currentPage <
                  response.pagination.totalPages - 2 && (
                    <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">
                      ...
                    </span>
                  )}

                {/* Last Page */}
                {response.pagination.totalPages > 1 && (
                  <button
                    onClick={() => setTablePage(response.pagination.totalPages)}
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 ${
                      response.pagination.currentPage ===
                      response.pagination.totalPages
                        ? "text-primary-foreground bg-primary shadow-sm"
                        : "text-foreground bg-transparent hover:bg-muted"
                    }`}
                  >
                    {response.pagination.totalPages}
                  </button>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() =>
                  setTablePage(response.pagination.currentPage + 1)
                }
                disabled={
                  response.pagination.currentPage ===
                  response.pagination.totalPages
                }
                className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  response.pagination.currentPage ===
                  response.pagination.totalPages
                    ? "text-muted-foreground bg-transparent cursor-not-allowed opacity-50"
                    : "text-foreground bg-transparent hover:bg-muted hover:text-primary"
                }`}
              >
                Next
                <ArrowUp className="w-4 h-4 ml-1 rotate-90" />
              </button>
            </div>

            {/* 3. Dettaglio Pagina a Destra (per schermi larghi) */}
            {limit && (
              <span className="text-xs text-gray-500 dark:text-gray-400 order-3 text-center sm:text-right">
                Visualizzati: {response.rows.length} (Pagina {response.pagination.currentPage} di {response.pagination.totalPages})
              </span>
            )}
          </nav>
        </div>
      )}
    </GenericComponent>
  );
}
