import React, { useMemo, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';
import { useRecordsStore } from '../records/recordsStore';
import Preview from '@/components/mobile/preview';
import { ArrowUp } from "lucide-react";

const isDev = false;

interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
  view?: string;
  context?: string;
  masterTableid?: string;
  masterRecordid?: string;
}

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

export default function CardsList({ tableid, searchTerm, view, context, masterTableid, masterRecordid }: PropsInterface) {
  const responseDataDEFAULT: ResponseInterface = {
    rows: [],
    columns: []
  };

  const responseDataDEV: ResponseInterface = {
    rows: Array.from({ length: 25 }).map((_, i) => ({
      recordid: String(i + 1),
      css: "#",
      fields: [
        { fieldid: "1", type: "standard", value: `Product ${i + 1}`, css: "" },
        { fieldid: "2", type: "standard", value: "Color", css: "" },
        { fieldid: "3", type: "standard", value: "Type", css: "" },
        { fieldid: "4", type: "standard", value: `${i + 1}k`, css: "" },
      ]
    })),
    columns: [
      { fieldtypeid: "Numero", desc: 'Product name' },
      { fieldtypeid: "Numero", desc: 'Color' },
      { fieldtypeid: "Numero", desc: 'Type' },
      { fieldtypeid: "Numero", desc: 'Price' },
    ],
  };

  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

  const refreshTable    = useRecordsStore(s => s.refreshTable);
  const handleRowClick  = useRecordsStore(s => s.handleRowClick);

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_table_records',
      tableid: tableid,
      searchTerm: searchTerm,
      view: view,
      masterTableid: masterTableid,
      masterRecordid: masterRecordid,
      _refreshTick: refreshTable,
    };
  }, [refreshTable, tableid, searchTerm, view, masterTableid, masterRecordid]);

  const { response, loading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null, elapsedTime:null };

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, responseData]);

  const handleCardClick = (recordid: string) => {
    if (handleRowClick && tableid && context) {
      handleRowClick(context, recordid, tableid, masterTableid, masterRecordid);
    }
  };

  // PAGINAZIONE FRONTEND
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(responseData.rows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = responseData.rows.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <GenericComponent
      response={responseData} 
      loading={loading} 
      error={error} 
      title='cardsList' 
      elapsedTime={elapsedTime}
    > 
      {(response: ResponseInterface) => (
        <div className="h-full w-full flex flex-col px-1 py-2 sm:px-2 sm:py-4">
          <div className="flex-1 overflow-y-auto">
            {response.rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <p className="text-xl font-medium">Nessun elemento trovato</p>
                <p className="text-sm">Modifica i filtri o prova una nuova ricerca</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedRows.map((row) => (
                  <Preview 
                    key={row.recordid}
                    row={row}
                    columns={response.columns}
                    onRowClick={handleCardClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* PAGINATION CONTROLS */}
          {response.rows.length > itemsPerPage && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-1 bg-card border border-border rounded-lg p-1 shadow-sm">
                {/* Previous */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 
                    ${currentPage === 1 
                      ? "text-muted-foreground bg-transparent cursor-not-allowed opacity-50"
                      : "text-foreground bg-transparent hover:bg-muted hover:text-primary"}`}
                >
                  <ArrowUp className="w-4 h-4 mr-1 rotate-[-90deg]" />
                  <span className="hidden sm:inline">Precedente</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                {/* Prima pagina */}
                <button
                    onClick={() => goToPage(1)}
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 
                    ${currentPage === 1 
                        ? "text-primary-foreground bg-primary shadow-sm" 
                        : "text-foreground bg-transparent hover:bg-muted"}`}
                >
                    1
                </button>

                {/* Ellipsis se siamo oltre pagina 3 */}
                {currentPage > 3 && (
                    <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">
                    ...
                    </span>
                )}

                {/* Pagine vicine (current-1, current, current+1) */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                    (page) =>
                        page !== 1 &&
                        page !== totalPages &&
                        page >= currentPage - 1 &&
                        page <= currentPage + 1
                    )
                    .map((page) => (
                    <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 
                        ${currentPage === page
                            ? "text-primary-foreground bg-primary shadow-sm"
                            : "text-foreground bg-transparent hover:bg-muted"}`}
                    >
                        {page}
                    </button>
                    ))}

                {/* Ellipsis se mancano almeno 2 pagine dopo */}
                {currentPage < totalPages - 2 && (
                    <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">
                    ...
                    </span>
                )}

                {/* Ultima pagina (se > 1) */}
                {totalPages > 1 && (
                    <button
                    onClick={() => goToPage(totalPages)}
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 
                        ${currentPage === totalPages
                        ? "text-primary-foreground bg-primary shadow-sm"
                        : "text-foreground bg-transparent hover:bg-muted"}`}
                    >
                    {totalPages}
                    </button>
                )}
                </div>

                {/* Next */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 
                    ${currentPage === totalPages
                      ? "text-muted-foreground bg-transparent cursor-not-allowed opacity-50"
                      : "text-foreground bg-transparent hover:bg-muted hover:text-primary"}`}
                >
                  <span className="hidden sm:inline">Successivo</span>
                  <ArrowUp className="w-4 h-4 ml-1 rotate-90" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </GenericComponent>
  );
};
