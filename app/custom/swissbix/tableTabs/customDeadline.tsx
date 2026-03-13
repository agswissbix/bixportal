import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  CalendarDays, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Globe, 
  Monitor, 
  KeySquare,
  MoreVertical,
  Plus,
  Bell,
  BellRing,
  BellOff,
  Repeat,
  FileText,
  CheckSquare,
  Settings,
  Copy,
  Trash2
} from 'lucide-react';

import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import DynamicMenuItem, { CustomFunction } from '@/components/dynamicMenuItem';
import { useRecordActions } from "@/hooks/useRecordActions"

import { useApi } from "@/utils/useApi";
import GenericComponent from '@/components/genericComponent';
import { useRecordsStore } from '@/components/records/recordsStore';

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  counter?: number
  rows: Array<{
    recordid: string
    css: string
    linkedorder?: number
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
  order: {
    fieldid: string | null
    direction: "asc" | "desc" | null
  }
}

interface TableSetting {
  tablesettings: Record<string, { type: string; value: string }>;
}

interface ResponseCustomFunction {
  fn: CustomFunction[];
}


// Funzione helper per parsare le date in formato dd/mm/yyyy
const parseDateString = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const [datePart] = dateStr.split(' ');
    const parts = datePart.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
    }
  }
  return dateStr;
};

// Funzione helper per calcolare i giorni rimanenti
const calculateDaysLeft = (expiryDateStr) => {
    console.log(expiryDateStr)
  const today = new Date(); // Utilizziamo la data odierna reale
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Funzione helper per calcolare la percentuale di completamento
const calculateProgress = (purchaseDateStr, expiryDateStr) => {
  const today = new Date().getTime();
  const start = new Date(purchaseDateStr).getTime();
  const end = new Date(expiryDateStr).getTime();
  
  if (today <= start) return 0;
  if (today >= end) return 100;
  
  const total = end - start;
  const elapsed = today - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
};

// Mappatura icone per tabella di origine (tableid)
const TableIcon = ({ tableid, className }) => {
  switch (tableid?.toLowerCase()) {
    case 'serviceandasset': return <Monitor className={className} />;
    case 'contract': return <FileText className={className} />;
    case 'task': return <CheckSquare className={className} />;
    default: return <Settings className={className} />;
  }
};

export default function CustomDeadlines() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, Attivo, In scadenza, Scaduto
  const { handleRowClick, getIsSettingAllowed, setTableSettings, refreshTable } = useRecordsStore();
  const { duplicateRecordAction, deleteRecordAction } = useRecordActions();

  // Payload per il backend
  const payload = useMemo(() => {
    return {
      apiRoute: "get_table_records", // riferimento api per il backend
      tableid: "deadline",
      searchTerm: searchTerm,
      view: "all",
      pagination: {
        page: 1,
        limit: 1000,
      },
      order: {
        fieldid: "date_deadline",
        direction: "asc" as "asc" | "desc" | null,
      },
      filtersList: [],
      _refreshTick: refreshTable['deadline'] ?? 0
    }
  }, [searchTerm, refreshTable['deadline'] ?? 0])

  // CHIAMATA AL BACKEND
  const { response, loading, error } = useApi<ResponseInterface>(payload)

  // SETTINGS (PER POTER VERIFICARE I PERMESSI, ES. isDeleteAble)
  const payloadSettings = useMemo(() => ({
    apiRoute: 'settings_table_settings',
    tableid: 'deadline',
  }), []);
    
  const { response: responseSettings } = useApi<TableSetting>(payloadSettings);

  useEffect(() => {
    if (!responseSettings) return;
    setTableSettings('deadline', responseSettings.tablesettings ?? {});
  }, [responseSettings, setTableSettings]);

  // STATO DEL CONTEXT MENU E FUNZIONI PERSONALIZZATE
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; recordid: string | null } | null>(null);
  const [isDeleteAble, setIsDeleteAble] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(0);
  const [functionsLoading, setFunctionsLoading] = useState(false);
  const [visibleFunctions, setVisibleFunctions] = useState<ResponseCustomFunction | null>(null);
  const requestIdRef = useRef(0);

  const payloadFunctions = useMemo(() => {
    return {
      apiRoute: 'get_custom_functions',
      tableid: 'deadline',
      recordid: contextMenu?.recordid || null,
    };
  }, [contextMenu?.recordid]);

  const { response: responseFunc } = useApi<ResponseCustomFunction>(payloadFunctions);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

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
      setVisibleFunctions({fn: responseFunc.fn ?? []});
      setFunctionsLoading(false);
    });
  }, [responseFunc]);

  const duplicateRecord = async (recordid: string) => {
    await duplicateRecordAction('deadline', recordid);
  }

  const handleTrashClick = (recordid: string) => {
    toast.warning("Sei sicuro di voler eliminare questo record?", {
      action: {
        label: "Conferma",
        onClick: async () => {
          await deleteRecordAction('deadline', recordid);
        },
      },
    })
  }

  // Elaborazione dei dati
  const processedDeadlines = useMemo(() => {
    if (!response?.rows) return [];
    
    return response.rows.map(row => {
      const getField = (id: string) => row.fields.find(f => f.fieldid === id)?.value || '';
      
      const deadline = {
        recordid_: row.recordid,
        date_deadline: parseDateString(getField('date_deadline')),
        date_start: parseDateString(getField('date_start')),
        description: getField('description'),
        status: getField('status'),
        frequency: getField('frequency'),
        frequency_months: getField('frequency_months'),
        actions: getField('actions'),
        notice_days: parseInt(getField('notice_days') || '0', 10),
        tableid: getField('tableid'),
        notification_sent: getField('notification_sent') === '1' || getField('notification_sent')?.toLowerCase() === 'si' ? 'Si' : 'No'
      };

      const daysLeft = calculateDaysLeft(deadline.date_deadline);
      const progress = calculateProgress(deadline.date_start, deadline.date_deadline);
      return {
        ...deadline,
        daysLeft,
        progress
      };
    }).sort((a, b) => a.daysLeft - b.daysLeft); // Ordina per scadenza più vicina
  }, [response]);

  // Metriche per i widget
  const metrics = useMemo(() => {
    return processedDeadlines.reduce((acc, curr) => {
      acc.total++;
      const statusKey = curr.status.toLowerCase();
      if (statusKey === 'attivo') acc.active++;
      if (statusKey === 'in scadenza') acc.expiring++;
      if (statusKey === 'scaduto') acc.expired++;
      return acc;
    }, { total: 0, active: 0, expiring: 0, expired: 0 });
  }, [processedDeadlines]);

  // Filtraggio dati per la lista
  const filteredDeadlines = useMemo(() => {
    return processedDeadlines.filter(deadline => {
      const matchesSearch = deadline.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (deadline.tableid && deadline.tableid.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || deadline.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [processedDeadlines, searchTerm, statusFilter]);

  return (
    <GenericComponent loading={loading} error={error}>
        {(response: ResponseInterface) => (
    <div className="min-h-screen text-slate-800 font-sans relative">

        {/* Widget Riassuntivi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card Totale */}
          <div className={`rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer ${statusFilter === 'all' ? 'bg-slate-50' : 'bg-white'}`}
            onClick={() => setStatusFilter('all')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full -z-10"></div>
            <div className="bg-slate-100 p-3 rounded-lg text-slate-600">
              <KeySquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Totale Scadenze</p>
              <h3 className="text-2xl font-bold text-slate-900">{metrics.total}</h3>
            </div>
          </div>

          {/* Card Attive */}
          <div className={`rounded-xl p-5 border border-emerald-200 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer ${statusFilter === 'attivo' ? 'bg-emerald-50' : 'bg-white'}`}
            onClick={() => setStatusFilter('attivo')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-10"></div>
            <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Attive</p>
              <h3 className="text-2xl font-bold text-slate-900">{metrics.active}</h3>
            </div>
          </div>

          {/* Card In Scadenza */}
          <div className={`rounded-xl p-5 border border-amber-200 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer ${statusFilter === 'in scadenza' ? 'bg-amber-50' : 'bg-white'}`}
            onClick={() => setStatusFilter('in scadenza')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-10"></div>
            <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">In Scadenza</p>
              <h3 className="text-2xl font-bold text-amber-700">{metrics.expiring}</h3>
            </div>
          </div>

          {/* Card Scadute */}
          <div className={`rounded-xl p-5 border border-red-200 shadow-sm flex items-center gap-4 relative overflow-hidden cursor-pointer ${statusFilter === 'scaduto' ? 'bg-red-50' : 'bg-white'}`}
            onClick={() => setStatusFilter('scaduto')}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-10"></div>
            <div className="bg-red-100 p-3 rounded-lg text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Scadute</p>
              <h3 className="text-2xl font-bold text-red-700">{metrics.expired}</h3>
            </div>
          </div>
        </div>

    {/* Lista Scadenze */}
    <div className="space-y-4">
      {filteredDeadlines.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">Nessuna scadenza trovata</h3>
          <p className="mt-1 text-slate-500">Prova a modificare i filtri o i termini di ricerca.</p>
        </div>
      ) : (
        filteredDeadlines.map((deadline) => {
          const statusLower = deadline.status.toLowerCase();
          const isExpired = statusLower === 'scaduto';
          const isExpiring = statusLower === 'in scadenza';

          return (
          <div 
            key={deadline.recordid_} 
            onClick={() => {handleRowClick('standard', deadline.recordid_, 'deadline',)}}
            className={`group bg-white rounded-xl border p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-5 cursor-pointer ${
              isExpired ? 'border-red-200 bg-red-50/30' : 
              isExpiring ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            {/* Contenitore Superiore */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Info Principali */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl flex-shrink-0 mt-1 bg-indigo-50 text-indigo-600">
                  <TableIcon tableid={deadline.tableid} className="w-6 h-6" />
                </div>
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {deadline.description}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200">
                    <Globe className="w-3.5 h-3.5"/> Modulo: {deadline.tableid || 'N/D'}
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5"/> 
                    Freq: {deadline.frequency ? deadline.frequency : deadline.frequency_months ? `${deadline.frequency_months} mesi` : 'N/D'}
                  </span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5"/> 
                    Preavviso: {deadline.notice_days} gg
                  </span>
                </div>
              </div>
            </div>

            {/* Date e Stato */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:ml-auto">
              
              {/* Scadenza Visuale */}
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Scadenza</span>
                <div className="flex items-center gap-2">
                  <CalendarDays className={`w-4 h-4 ${
                    isExpired ? 'text-red-500' : 
                    isExpiring ? 'text-amber-500' : 'text-slate-400'
                  }`} />
                  <span className="font-medium text-slate-700">
                    {new Date(deadline.date_deadline).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Badge Giorni Rimanenti */}
              <div className={`px-4 py-2 rounded-lg flex flex-col items-center justify-center min-w-[140px] font-semibold text-sm ${
                isExpired ? 'bg-red-100 text-red-700 border border-red-200' :
                isExpiring ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {isExpired ? (
                  <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4"/> Scaduto</span>
                ) : isExpiring ? (
                  <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> In scadenza</span>
                ) : (
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Attivo</span>
                )}
                <span className="text-xs font-normal mt-0.5 opacity-80">
                  {deadline.daysLeft < 0 ? `da ${Math.abs(deadline.daysLeft)} gg` : `tra ${deadline.daysLeft} gg`}
                </span>
              </div>

              {/* Icona Notifica Inviata */}
              <div className="flex flex-col items-center" title="Stato Notifica">
                 {deadline.notification_sent === 'Si' ? (
                   <BellRing className="w-5 h-5 text-indigo-500" />
                 ) : (
                   <BellOff className="w-5 h-5 text-slate-300" />
                 )}
                 <span className="text-[10px] text-slate-400 mt-1">{deadline.notification_sent === 'Si' ? 'Inviata' : 'Non Inviata'}</span>
              </div>

              {/* Azioni */}
              <button 
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors hidden lg:block"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  setIsDeleteAble(getIsSettingAllowed('deadline', 'delete', deadline.recordid_));

                  if (deadline.recordid_ !== contextMenu?.recordid) {
                    setMenuOpenId((v) => v + 1);
                  }
                  
                  const x = window.innerWidth - e.clientX;
                  const y = e.clientY;
                  setTimeout(() => {
                    setContextMenu({
                      x,
                      y,
                      recordid: deadline.recordid_,
                    });
                  }, 10);
                }}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            </div>

            {/* Barra di Avanzamento */}
            <div className="w-full mt-1">
              <div className="flex justify-between text-xs mb-2 px-0.5">
                <span className="text-slate-500 font-medium">
                  Inizio: {new Date(deadline.date_start).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className={`font-semibold ${
                  isExpired ? 'text-red-600' : 
                  isExpiring ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {Math.round(deadline.progress)}% trascorso
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50 flex flex-col justify-center">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isExpired ? 'bg-red-500' : 
                    isExpiring ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${deadline.progress}%` }}
                />
              </div>
              
              {/* Action row (se presente) */}
              {deadline.actions && (
                <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100 flex items-center gap-2 w-fit">
                   <Settings className="w-3.5 h-3.5" />
                   Azione automatica: <span className="font-mono text-slate-700">{deadline.actions}</span>
                </div>
              )}
            </div>
          </div>
        );
        })
      )}
    </div>

    <AnimatePresence>
      {contextMenu && (
        <motion.div
          key="context-menu"
          initial={{ opacity: 0, scale: 0.95, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 25,
            mass: 0.8,
          }}
          className="
            fixed p-1 z-[100]
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-600
            rounded-lg shadow-2xl shadow-gray-500
            flex flex-col
            min-w-[160px] overflow-hidden
          "
          style={{
            top: contextMenu.y,
            right: contextMenu.x,
            transformOrigin: "top right",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (contextMenu.recordid) {
                duplicateRecord(contextMenu.recordid);
              }
              setContextMenu(null);
            }}
            className="w-full text-left rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Duplica
          </button>

          {isDeleteAble && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (contextMenu.recordid) {
                  handleTrashClick(contextMenu.recordid);
                }
                setContextMenu(null);
              }}
              className="w-full text-left rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
              <Trash2 className="w-4 h-4" />
              Elimina
            </button>
          )}

          {functionsLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full" />
              Caricamento funzioni...
            </div>
          ) : (
            <>
              {visibleFunctions?.fn.filter((fn) => fn.context === 'cards').length > 0 && (
                <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
              )}

              {visibleFunctions?.fn
                .filter((fn) => fn.context === 'cards')
                .map((originalFn) => {
                const fn = { ...originalFn };

                try {
                  if (fn.params && typeof fn.params === 'string') {
                    fn.params = JSON.parse(fn.params);
                  }
                } catch (error) {
                  console.error("Errore nel parsing di fn.params:", fn.params, error);
                  fn.params = null; 
                }
                return (
                  <div key={fn.title} onClick={(e) => e.stopPropagation()}>
                    <DynamicMenuItem
                      fn={fn}
                      params={{
                        recordid: contextMenu.recordid,
                        ...(typeof fn.params === 'object' && fn.params ? fn.params : {})
                      }}
                    />
                  </div>
                )                         
              })}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>

</div>
        )}
    </GenericComponent>
);
}