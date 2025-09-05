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
// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
  filters?: string;
  view?: string;
  order?: {
    columnDesc: string | null;
    direction: "asc" | "desc" | null;
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
    }>;
  }>;
  columns: Array<{
    fieldtypeid: string;
    desc: string;
  }>;
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
  pagination,
  level,
  masterTableid,
  masterRecordid,
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
      },
      {
        fieldtypeid: "Numero",
        desc: "Color",
      },
      {
        fieldtypeid: "Numero",
        desc: "Type",
      },
      {
        fieldtypeid: "Numero",
        desc: "Price",
      },
    ],
  };

  // DATI DEL CONTESTO
  const { user } = useContext(AppContext);

  // IMPOSTAZIONE DELLA RESPONSE (non toccare)
  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  // STATO PER L'ORDINAMENTO (solo parte grafica)
  const [sortConfig, setSortConfig] = useState<{
    columnDesc: string | null;
    direction: SortDirection;
  }>({
    columnDesc: null,
    direction: null,
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
      apiRoute: "get_table_records", // riferimento api per il backend
      tableid: tableid,
      searchTerm: searchTerm,
      view: view,
      pagination: {
        page: pagination?.page || 1,
        limit: pagination?.limit || 10,
      },
      order: {
        columnDesc: columnOrder.columnDesc,
        direction: columnOrder.direction,
      },
      filtersList: filters,
      masterTableid: masterTableid,
      masterRecordid: masterRecordid,
      _refreshTick: refreshTable,
    };
  }, [
    tableid,
    refreshTable,
    pagination,
    masterTableid,
    masterRecordid,
    columnOrder.columnDesc,
    columnOrder.direction,
    filters,
  ]);

  // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
  const { response, loading, error, elapsedTime } =
    !isDev && payload
      ? useApi<ResponseInterface>(payload)
      : { response: null, loading: true, error: null };

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non toccare)
  useEffect(() => {
    if (
      !isDev &&
      response &&
      JSON.stringify(response) !== JSON.stringify(responseData)
    ) {
      setResponseData(response);
    }
  }, [response, responseData]);

  // FUNZIONE PER GESTIRE IL CLICK SULL'INTESTAZIONE DELLA COLONNA (solo parte grafica)
  const handleSort = (columnDesc: string) => {
    let direction: SortDirection = "asc";

    if (sortConfig.columnDesc === columnDesc) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }

    setSortConfig({
      columnDesc: direction === null ? null : columnDesc,
      direction,
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
        <div className="h-full w-full ">
          <div className="w-full h-full relative rounded-lg overflow-auto">
              <table className="min-w-max text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 bg-table-background border-table-border rounded-t-2xl rounded-b-xl">
    <thead className="text-xs text-gray-700 uppercase bg-table-header dark:text-gray-400 rounded-t-xl truncate">
      <tr>
        {response.columns.map((column) => (
          <th
            key={column.desc}
            scope="col"
            onClick={() => handleSort(column.desc)}
            className={`
              px-4 py-3 cursor-pointer select-none whitespace-nowrap overflow-hidden text-clip
              ${column.fieldtypeid === "Numero"
                ? " max-w-[80px] text-right"
                : " max-w-[180px] text-left"}
            `}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-between">
                  <span className="truncate">{column.desc}</span>
                  <div className="w-4 h-4 ml-1">
                    {sortConfig.columnDesc === column.desc &&
                      sortConfig.direction === "asc" && (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    {sortConfig.columnDesc === column.desc &&
                      sortConfig.direction === "desc" && (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    {(sortConfig.columnDesc !== column.desc ||
                      sortConfig.direction === null) && (
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

    <tbody className="w-11/12 h-11/12">
      {response.rows.map((row) => (
        <tr
          key={row.recordid}
          className={`theme-table table-fixed border-b dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:bg-records-background dark:hover:bg-secondary-hover ${row.css}`}
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
                  ${column?.fieldtypeid === "Numero"
                    ? "min-w-max max-w-max text-right"
                    : "min-w-max max-w-fit text-left"}
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

    <tfoot className="bg-table-header dark:bg-gray-700">
      <tr>
        <td
          colSpan={response.columns.length}
          className="px-4 py-3 text-right rounded-b-xl"
        >
          <span className="font-medium">Totale:</span> {response.counter}
        </td>
      </tr>
    </tfoot>
  </table>

            <nav
              aria-label="Page navigation"
              className="mt-4 flex justify-center"
            >
              <div className="flex items-center space-x-1 bg-card border border-border rounded-lg p-1 shadow-sm">
                {/* Previous Button */}
                <button
                  onClick={() =>
                    pagination && setTablePage(pagination.page - 1)
                  }
                  disabled={!pagination || pagination.page === 1}
                  className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 
                                                        ${
                                                          !pagination ||
                                                          pagination.page === 1
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
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 
                                                            ${
                                                              pagination &&
                                                              pagination.page ===
                                                                1
                                                                ? "text-primary-foreground bg-primary shadow-sm"
                                                                : "text-foreground bg-transparent hover:bg-muted"
                                                            }`}
                  >
                    1
                  </button>

                  {/* Ellipsis */}
                  {pagination && pagination.page > 3 && (
                    <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">
                      ...
                    </span>
                  )}

                  {/* Current Page (if not first or last) */}
                  {pagination &&
                    pagination.page !== 1 &&
                    pagination.page !== pagination.limit && (
                      <button className="flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md text-primary-foreground bg-primary shadow-sm">
                        {pagination.page}
                      </button>
                    )}

                  {/* Ellipsis */}
                  {pagination && pagination.page < pagination.limit - 2 && (
                    <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">
                      ...
                    </span>
                  )}

                  {/* Last Page */}
                  {pagination && pagination.limit > 1 && (
                    <button
                      onClick={() => setTablePage(pagination.limit)}
                      className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 
                                                                ${
                                                                  pagination.page ===
                                                                  pagination.limit
                                                                    ? "text-primary-foreground bg-primary shadow-sm"
                                                                    : "text-foreground bg-transparent hover:bg-muted"
                                                                }`}
                    >
                      {pagination.limit}
                    </button>
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={() =>
                    pagination && setTablePage(pagination.page + 1)
                  }
                  disabled={!pagination || pagination.page === pagination.limit}
                  className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 
                                                        ${
                                                          !pagination ||
                                                          pagination.page ===
                                                            pagination.limit
                                                            ? "text-muted-foreground bg-transparent cursor-not-allowed opacity-50"
                                                            : "text-foreground bg-transparent hover:bg-muted hover:text-primary"
                                                        }`}
                >
                  Next
                  <ArrowUp className="w-4 h-4 ml-1 rotate-90" />
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </GenericComponent>
  );
}
