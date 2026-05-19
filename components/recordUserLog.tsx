import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import { History, User, ExternalLink, Clock, ChevronDown } from 'lucide-react';

const isDev = false;
const PAGE_LIMIT = 50; // Ridotto a 50 per gestire meglio il caricamento progressivo

interface PropsInterface {
  tableid: string;
  recordid: string;
}

interface ResponseInterface {
  rows: Array<{
    recordid: string;
    fields: Array<{
      fieldid: string;
      value: string;
      type?: string;
    }>;
  }>;
  // Molte API restituiscono un totale per la paginazione. 
  // Se la tua lo fa, aggiungilo qui (es. total: number;)
}

export default function RecordUserLog({ tableid, recordid }: PropsInterface) {
  const [responseData, setResponseData] = useState<ResponseInterface>({ rows: [] });
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const { handleRowClick, refreshTable } = useRecordsStore();

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_table_records',
      tableid: 'user_log',
      searchTerm: '',
      view: '',
      pagination: {
        page: page,
        limit: PAGE_LIMIT,
      },
      order: {
        fieldid: 'recordid_',
        direction: 'desc',
      },
      filtersList: [
        { fieldid: 'tableid', type: 'exact', label: 'Tabella', value: tableid },
        { fieldid: 'recordidtable', type: 'exact', label: 'Record', value: recordid },
      ],
      _refreshTick: refreshTable['user_log'] ?? 0,
    };
  }, [tableid, recordid, refreshTable['user_log'], page]);

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  // Gestione del caricamento progressivo dei dati
  useEffect(() => {
    if (!isDev && response && response.rows) {
      setResponseData(prevData => {
        // Se è la pagina 1 (es. reset o refresh), sovrascrivi i dati
        if (page === 1) {
          return response;
        }
        
        // Se è una pagina successiva, unisci i nuovi record a quelli vecchi
        // Utilizziamo un Set per evitare duplicati in caso di accavallamenti dell'API
        const existingIds = new Set(prevData.rows.map(r => r.recordid));
        const newRows = response.rows.filter(r => !existingIds.has(r.recordid));
        
        return {
          ...response,
          rows: [...prevData.rows, ...newRows]
        };
      });
      setIsFetchingMore(false);
    }
  }, [response, page]);

  // Se la tabella si aggiorna (refreshTick cambia), resettiamo la pagina a 1
  useEffect(() => {
    if (refreshTable['user_log']) {
      setPage(1);
    }
  }, [refreshTable['user_log']]);

  const getFieldValue = (fields: any[], fieldid: string) => {
    return fields.find(f => f.fieldid === fieldid)?.value || '';
  };

  const formatActionType = (action: string) => {
    if (!action) return 'Azione sconosciuta';
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('insert') || lowerAction.includes('create')) return 'Creazione Record';
    if (lowerAction.includes('update')) return 'Aggiornamento Record';
    if (lowerAction.includes('delete')) return 'Eliminazione Record';
    return action;
  };

  const getActionColor = (action: string) => {
    if (!action) return 'bg-gray-100 text-gray-500';
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('insert') || lowerAction.includes('create')) return 'bg-green-100 text-green-700';
    if (lowerAction.includes('update')) return 'bg-blue-100 text-blue-700';
    if (lowerAction.includes('delete')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const loadMore = () => {
    setIsFetchingMore(true);
    setPage(prev => prev + 1);
  };

  // Determina se ci sono potenzialmente altri record
  // (Se l'ultima chiamata ha restituito meno record del limite, significa che siamo alla fine)
  const hasMore = response?.rows?.length === PAGE_LIMIT;

  // NOTA CRITICA SUL GENERIC COMPONENT:
  // Se GenericComponent mostra un loader che nasconde completamente i "children" quando loading === true,
  // la timeline svanirà ad ogni click su "Carica altri".
  // Per evitare questo, passiamo il loading solo se siamo alla pagina 1, altrimenti gestiamo il loader sul tasto.
  const isInitialLoad = loading && page === 1;

  return (
    <GenericComponent response={responseData} loading={isInitialLoad} error={error}>
      {(response: ResponseInterface) => (
        <div className="p-4 h-full w-full overflow-y-auto bg-gray-50/50">
          <div className="relative border-l border-gray-200 ml-3">
            {responseData.rows?.length === 0 && !isInitialLoad && (
              <div className="flex flex-col items-center justify-center text-gray-400 py-12 ml-[-12px]">
                <History className="h-12 w-12 mb-3 opacity-50" />
                <p>Nessun log disponibile per questo record</p>
              </div>
            )}
            
            {responseData.rows?.map((row) => {
              const actionType = getFieldValue(row.fields, 'action_type');
              const user = getFieldValue(row.fields, 'user_id');
              const date = getFieldValue(row.fields, 'date');
              const time = getFieldValue(row.fields, 'time');
              const ipAddress = getFieldValue(row.fields, 'ip_address');

              return (
                <div key={row.recordid} className="mb-8 ml-6 group relative">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-white rounded-full -left-9 ring-4 ring-gray-50/50 border border-gray-200 group-hover:border-blue-400 transition-colors">
                    <History className="w-3 h-3 text-gray-500 group-hover:text-blue-500" />
                  </span>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getActionColor(actionType)}`}>
                          {formatActionType(actionType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{date} {time && `- ${time}`}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-700 truncate">{user || 'Sistema'}</span>
                        {ipAddress && <span className="text-xs text-gray-400 flex-shrink-0">({ipAddress})</span>}
                      </div>

                      <button
                        onClick={() => handleRowClick('linked', row.recordid, 'user_log', tableid, recordid)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md transition-all hover:bg-blue-100 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Dettagli
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottone "Carica altri" */}
            {hasMore && responseData.rows?.length > 0 && (
              <div className="mt-8 ml-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading || isFetchingMore}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(loading || isFetchingMore) ? (
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {loading || isFetchingMore ? 'Caricamento...' : 'Carica log precedenti'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </GenericComponent>
  );
}