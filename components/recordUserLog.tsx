import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import { History, User, ExternalLink, Clock, ChevronDown, ArrowRight } from 'lucide-react';
import Image from 'next/image';

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
      userid?: string;
    }>;
  }>;
  // Molte API restituiscono un totale per la paginazione. 
  // Se la tua lo fa, aggiungilo qui (es. total: number;)
}

interface LogChangesViewerProps {
  oldVal: any;
  newVal: any;
  action: string;
}

const LogChangesViewer = ({ oldVal, newVal, action }: LogChangesViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const parseJson = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return null;
        return JSON.parse(trimmed);
      }
      return val;
    } catch (e) {
      return null;
    }
  };

  const oldObj = parseJson(oldVal) || {};
  const newObj = parseJson(newVal) || {};
  const lowerAction = (action || '').toLowerCase();

  const ignoreKeys = [
    'recordid_', 'creatorid_', 'creation_', 'lastupdaterid_', 'lastupdate_', 
    'totpages_', 'firstpagefilename_', 'recordstatus_', 'deleted_', 'id',
    'creationdate', 'creatorid', 'lastupdate', 'lastupdaterid'
  ];

  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
    .filter(key => !ignoreKeys.includes(key));

  if (allKeys.length === 0) return null;

  const changes = allKeys.map(key => {
    const o = oldObj[key];
    const n = newObj[key];
    return { key, old: o, new: n };
  }).filter(c => {
    if (lowerAction.includes('insert') || lowerAction.includes('create')) return true;
    if (lowerAction.includes('delete')) return true;
    return JSON.stringify(c.old) !== JSON.stringify(c.new);
  });

  if (changes.length === 0) return null;

  const limit = 5;
  const hasMore = changes.length > limit;
  const displayedChanges = isExpanded ? changes : changes.slice(0, limit);

  const formatValue = (v: any) => {
    if (v === null || v === undefined || v === '') return 'vuoto';
    if (typeof v === 'boolean') return v ? 'Sì' : 'No';
    let strVal = '';
    if (typeof v === 'object') {
      try {
        strVal = JSON.stringify(v);
      } catch {
        strVal = '[Oggetto]';
      }
    } else {
      strVal = String(v);
    }
    return strVal;
  };

  const formatKey = (key: string) => {
    if (!key) return '';
    const humanized = key.replace(/_/g, ' ');
    return humanized.charAt(0).toUpperCase() + humanized.slice(1);
  };

  return (
    <div className="mt-3 text-xs border-t border-gray-100 pt-3">
      <div className="space-y-2">
        {displayedChanges.map(({ key, old, new: nv }) => {
          const oldFormatted = formatValue(old);
          const newFormatted = formatValue(nv);
          const displayOldVal = oldFormatted.length > 80 ? oldFormatted.slice(0, 80) + '...' : oldFormatted;
          const displayNewVal = newFormatted.length > 80 ? newFormatted.slice(0, 80) + '...' : newFormatted;

          if (lowerAction.includes('insert') || lowerAction.includes('create')) {
            return (
              <div key={key} className="flex flex-wrap items-center gap-1.5 py-0.5">
                <span className="font-semibold text-gray-500 text-[11px] shrink-0">{formatKey(key)}:</span>
                <span 
                  className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-mono text-[10px] border border-green-100/50 break-all max-w-full"
                  title={newFormatted.length > 80 ? newFormatted : undefined}
                >
                  {displayNewVal}
                </span>
              </div>
            );
          } else if (lowerAction.includes('delete')) {
            return (
              <div key={key} className="flex flex-wrap items-center gap-1.5 py-0.5">
                <span className="font-semibold text-gray-500 text-[11px] shrink-0">{formatKey(key)}:</span>
                <span 
                  className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 line-through font-mono text-[10px] border border-red-100/50 break-all max-w-full"
                  title={oldFormatted.length > 80 ? oldFormatted : undefined}
                >
                  {displayOldVal}
                </span>
              </div>
            );
          } else {
            // UPDATE
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 py-1 border-b border-gray-50/50 last:border-0 pb-1">
                <span className="font-semibold text-gray-600 text-[11px] min-w-[120px] shrink-0 break-all">{formatKey(key)}</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span 
                    className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 line-through font-mono text-[10px] border border-red-100/50 break-all"
                    title={oldFormatted.length > 80 ? oldFormatted : undefined}
                  >
                    {displayOldVal}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span 
                    className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-mono text-[10px] border border-green-100/50 break-all"
                    title={newFormatted.length > 80 ? newFormatted : undefined}
                  >
                    {displayNewVal}
                  </span>
                </div>
              </div>
            );
          }
        })}
      </div>

      {hasMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
        >
          {isExpanded ? 'Mostra meno' : `Mostra altri ${changes.length - limit} campi`}
        </button>
      )}
    </div>
  );
};

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
              const user = getFieldValue(row.fields, 'user');
              const userid = row.fields.find(f => f.fieldid === 'user')?.userid || '';
              const date = getFieldValue(row.fields, 'date');
              const time = getFieldValue(row.fields, 'time');
              const ipAddress = getFieldValue(row.fields, 'ip_address');
              const oldVal = getFieldValue(row.fields, 'old_values');
              const newVal = getFieldValue(row.fields, 'new_values');

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

                    <LogChangesViewer oldVal={oldVal} newVal={newVal} action={actionType} />
                    
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Image
                          src={user ? `/api/media-proxy?url=userProfilePic/${userid}.png` : "/api/media-proxy?url=userProfilePic/default.jpg"}
                          alt="profile"
                          width={20}
                          height={20}
                          className="w-8 h-8 rounded-full object-cover border-2 border-gray-300"
                          onError={(e) => {
                            const target = e.currentTarget
                            if (!target.src.includes("default.jpg")) {
                              target.srcset = ""
                              target.src = "/api/media-proxy?url=userProfilePic/default.jpg"
                            }
                          }}
                        />
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