import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  CalendarDays, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Briefcase,
  User,
  Building2,
  MoreVertical,
  Copy,
  Trash2,
  DollarSign,
  Activity,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import DynamicMenuItem, { CustomFunction } from '@/components/dynamicMenuItem';
import { useRecordActions } from "@/hooks/useRecordActions"

import { useApi } from "@/utils/useApi";
import GenericComponent from '@/components/genericComponent';
import { useRecordsStore } from '@/components/records/recordsStore';
import { formatPrice } from '@/utils/formatPrice';

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

const parseDateString = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) {
    const [datePart] = dateStr.split(' ');
    const parts = datePart.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dateStr;
};

const formatCHF = (value: number) => {
  return "CHF " + formatPrice(value);
};

export default function CustomDeal() {
  const { handleRowClick, getIsSettingAllowed, setTableSettings, refreshTable, searchTerm, filtersList, tableView } = useRecordsStore();
  const { duplicateRecordAction, deleteRecordAction } = useRecordActions();

  const [currentPage, setCurrentPage] = useState(1);
  const [marginFilter, setMarginFilter] = useState('all'); // 'all', 'good', 'bad'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'fixedprice', 'monteore', 'invoiced'

  // Payload per il backend
  const payload = useMemo(() => {
    return {
      apiRoute: "get_table_records",
      tableid: "deal",
      searchTerm: searchTerm,
      view: tableView,
      pagination: {
        page: currentPage,
        limit: 100,
      },
      order: {
        fieldid: "creation_",
        direction: "desc" as "asc" | "desc" | null,
      },
      filtersList: filtersList,
      _refreshTick: refreshTable['deal'] ?? 0
    }
  }, [searchTerm, refreshTable['deal'] ?? 0, filtersList, tableView, currentPage])

  const { response, loading, error } = useApi<ResponseInterface>(payload)

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtersList, marginFilter, typeFilter]);

  const payloadSettings = useMemo(() => ({
    apiRoute: 'settings_table_settings',
    tableid: 'deal',
  }), []);
    
  const { response: responseSettings } = useApi<TableSetting>(payloadSettings);

  useEffect(() => {
    if (!responseSettings) return;
    setTableSettings('deal', responseSettings.tablesettings ?? {});
  }, [responseSettings, setTableSettings]);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; recordid: string | null } | null>(null);
  const [isDeleteAble, setIsDeleteAble] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(0);
  const [functionsLoading, setFunctionsLoading] = useState(false);
  const [visibleFunctions, setVisibleFunctions] = useState<ResponseCustomFunction | null>(null);
  const requestIdRef = useRef(0);

  const payloadFunctions = useMemo(() => {
    return {
      apiRoute: 'get_custom_functions',
      tableid: 'deal',
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
    await duplicateRecordAction('deal', recordid);
  }

  const handleTrashClick = (recordid: string) => {
    toast.warning("Sei sicuro di voler eliminare questo record?", {
      action: {
        label: "Conferma",
        onClick: async () => {
          await deleteRecordAction('deal', recordid);
        },
      },
    })
  }

  const processedDeals = useMemo(() => {
    if (!response?.rows) return [];
    
    return response.rows.map(row => {
      const getField = (id: string) => row.fields.find(f => f.fieldid === id)?.value || '';
      
      const expectedmargin = parseFloat(getField('expectedmargin')) || 0;
      const effectivemargin = parseFloat(getField('effectivemargin')) || 0;
      const annualmargin = parseFloat(getField('annualmargin')) || 0;
      const bankhours = parseFloat(getField('bankhours')) || 0;
      const fixedpricehours = parseFloat(getField('fixedpricehours')) || 0;
      const invoicedhours = parseFloat(getField('invoicedhours')) || 0;
      const invoicedprice = parseFloat(getField('invoicedprice')) || 0;
      const fixedprice = getField('fixedprice') === 'Si' || getField('fixedprice')?.toLowerCase() === 'si';
      
      const dealname = getField('dealname');
      const dealuser1 = getField('dealuser1'); // potrebbe essere un ID o testo, se è lookup framework dà il valore
      const closedate = parseDateString(getField('closedate'));
      const company = getField('_recordidcompany');
      
      const isGoodMargin = effectivemargin >= expectedmargin;
      const performancePercent = expectedmargin > 0 ? (effectivemargin / expectedmargin) * 100 : 100;
      
      return {
        recordid_: row.recordid,
        expectedmargin,
        effectivemargin,
        annualmargin,
        bankhours,
        fixedpricehours,
        invoicedhours,
        invoicedprice,
        fixedprice,
        dealname,
        dealuser1,
        closedate,
        company,
        isGoodMargin,
        performancePercent
      };
    });
  }, [response]);

  const filteredDeals = useMemo(() => {
    return processedDeals.filter(deal => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = deal.dealname?.toLowerCase().includes(s) || 
                            deal.company?.toLowerCase().includes(s) ||
                            deal.dealuser1?.toLowerCase().includes(s);
                            
      const matchesMargin = marginFilter === 'all' ||
                            (marginFilter === 'good' && deal.isGoodMargin) ||
                            (marginFilter === 'bad' && !deal.isGoodMargin);
                            
      const matchesType = typeFilter === 'all' ||
                          (typeFilter === 'fixedprice' && deal.fixedprice) ||
                          (typeFilter === 'monteore' && deal.bankhours > 0) ||
                          (typeFilter === 'invoiced' && (deal.invoicedhours > 0 || deal.invoicedprice > 0));

      return matchesSearch && matchesMargin && matchesType;
    });
  }, [processedDeals, searchTerm, marginFilter, typeFilter]);

  return (
    <GenericComponent response={response} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <>
        <div className="min-h-screen text-slate-800 font-sans relative pb-10">
          
          <div className="space-y-6">
            {/* Filtri */}
            <div className="flex flex-wrap gap-4">
              <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button onClick={() => setMarginFilter('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${marginFilter === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Tutti Margini</button>
                <button onClick={() => setMarginFilter('good')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${marginFilter === 'good' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-emerald-700'}`}><TrendingUp className="w-4 h-4" /> Buon Margine</button>
                <button onClick={() => setMarginFilter('bad')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${marginFilter === 'bad' ? 'bg-rose-100 text-rose-800' : 'text-slate-500 hover:text-rose-700'}`}><TrendingDown className="w-4 h-4" /> Critico</button>
              </div>
              
              <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button onClick={() => setTypeFilter('all')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Tutte le Tipologie</button>
                <button onClick={() => setTypeFilter('fixedprice')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === 'fixedprice' ? 'bg-purple-100 text-purple-800' : 'text-slate-500 hover:text-purple-700'}`}>Fixed Price</button>
                <button onClick={() => setTypeFilter('monteore')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === 'monteore' ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:text-blue-700'}`}>Monte Ore</button>
                <button onClick={() => setTypeFilter('invoiced')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === 'invoiced' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:text-amber-700'}`}>Consuntivo (FF)</button>
              </div>
            </div>

            {filteredDeals.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Nessuna trattativa trovata</h3>
                <p className="mt-1 text-slate-500">Prova a modificare i filtri o i termini di ricerca.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredDeals.map((deal) => {

                  return (
                    <div 
                      key={deal.recordid_} 
                      onClick={() => handleRowClick('standard', deal.recordid_, 'deal')}
                      className={`group bg-white rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all flex flex-col gap-6 cursor-pointer relative overflow-hidden ${
                         deal.isGoodMargin ? 'border-emerald-200 hover:border-emerald-400' : 'border-rose-200 hover:border-rose-400'
                      }`}
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 transition-colors ${
                        deal.isGoodMargin ? 'bg-emerald-50/50 group-hover:bg-emerald-100/50' : 'bg-rose-50/50 group-hover:bg-rose-100/50'
                      }`}></div>

                      {/* Intestazione */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide flex items-center gap-1.5 border border-indigo-100/50">
                              <Building2 className="w-3.5 h-3.5" />
                              {deal.company || 'N/A'}
                            </span>
                            {deal.fixedprice && (
                              <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border border-purple-100/50">
                                Fixed Price
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 leading-tight">
                            {deal.dealname || 'Senza Nome'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                            {deal.dealuser1 && (
                              <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400"/> {deal.dealuser1}</span>
                            )}
                            {deal.closedate && (
                              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-slate-400"/> Chiuso il: {new Date(deal.closedate).toLocaleDateString('it-CH')}</span>
                            )}
                          </div>
                        </div>
                        
                        <button 
                          className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsDeleteAble(getIsSettingAllowed('deal', 'delete', deal.recordid_));
                            if (deal.recordid_ !== contextMenu?.recordid) {
                              setMenuOpenId((v) => v + 1);
                            }
                            const x = window.innerWidth - e.clientX;
                            const y = e.clientY;
                            setTimeout(() => {
                              setContextMenu({ x, y, recordid: deal.recordid_ });
                            }, 10);
                          }}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Griglia Metriche */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Sezione Margini */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" /> Trend Margin
                            </h4>
                            {deal.isGoodMargin ? (
                              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full"><TrendingUp className="w-3.5 h-3.5 mr-1" /> OK</span>
                            ) : (
                              <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded-full"><TrendingDown className="w-3.5 h-3.5 mr-1" /> CRITICO</span>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-500">Stimato</span>
                                <span className="font-semibold text-slate-700">{formatCHF(deal.expectedmargin)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-bold">
                                <span className={deal.isGoodMargin ? 'text-emerald-700' : 'text-rose-700'}>Effettivo</span>
                                <span className={deal.isGoodMargin ? 'text-emerald-600' : 'text-rose-600'}>
                                  {formatCHF(deal.effectivemargin)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Barra progresso comparativa */}
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                              <div 
                                className={`h-full transition-all ${deal.isGoodMargin ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(deal.performancePercent, 100)}%` }}
                              />
                            </div>

                            {deal.annualmargin !== 0 && (
                              <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-sm">
                                <span className="text-slate-500">A regime annuo</span>
                                <span className="font-bold text-indigo-600">{formatCHF(deal.annualmargin)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sezione Ore / Fatturato */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center relative overflow-hidden">
                           <DollarSign className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-200/30 -z-10 rotate-12" />
                           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" /> Dettaglio Ore
                           </h4>
                           
                           <div className="space-y-4">
                             {deal.bankhours > 0 ? (
                               <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium text-slate-600">Monte Ore</span>
                                 <span className="text-lg font-bold text-slate-800">{deal.bankhours} h</span>
                               </div>
                             ) : deal.fixedpricehours > 0 ? (
                               <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium text-slate-600">Fixed Price</span>
                                 <span className="text-lg font-bold text-slate-800">{deal.fixedpricehours} h</span>
                               </div>
                             ) : deal.invoicedhours > 0 ? (
                               <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium text-slate-600">Consuntivo (FF)</span>
                                 <div className="text-right">
                                   <div className="text-lg font-bold text-slate-800">{deal.invoicedhours} h</div>
                                   <div className="text-xs font-semibold text-emerald-600">Fatturato: {formatCHF(deal.invoicedprice)}</div>
                                 </div>
                               </div>
                             ) : (
                               <div className="text-sm text-slate-400 italic text-center py-4">
                                 Nessun timesheet rilevato
                               </div>
                             )}
                           </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
            
            {/* SEZIONE PAGINAZIONE AGGIORNATA */}
          <nav
            aria-label="Page navigation"
            className="mt-4 flex flex-col sm:flex-row justify-between items-center space-x-2 space-y-2 sm:space-y-0 sticky bottom-0 bg-card border border-border rounded-lg p-4 shadow-sm"
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
                onClick={() => setCurrentPage(response?.pagination.currentPage - 1)}
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
                  onClick={() => setCurrentPage(1)}
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
                    onClick={() => setCurrentPage(response?.pagination.totalPages)}
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
                onClick={() => setCurrentPage(response?.pagination.currentPage + 1)}
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
              <span className="text-xs text-gray-500 dark:text-gray-400 order-3 text-center sm:text-right">
                Visualizzati: {response?.rows.length} (Pagina {response?.pagination.currentPage} di{" "}
                {response?.pagination.totalPages})
              </span>
          </nav>
            
          </div>

          <AnimatePresence>
            {contextMenu && (
              <motion.div
                key="context-menu"
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ type: "spring", stiffness: 250, damping: 25, mass: 0.8 }}
                className="fixed p-1 z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl shadow-gray-500 flex flex-col min-w-[160px] overflow-hidden"
                style={{ top: contextMenu.y, right: contextMenu.x, transformOrigin: "top right" }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); if (contextMenu.recordid) duplicateRecord(contextMenu.recordid); setContextMenu(null); }}
                  className="w-full text-left rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" /> Duplica
                </button>
                {isDeleteAble && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (contextMenu.recordid) handleTrashClick(contextMenu.recordid); setContextMenu(null); }}
                    className="w-full text-left rounded-lg flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Elimina
                  </button>
                )}
                {functionsLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full" /> Caricamento funzioni...
                  </div>
                ) : (
                  <>
                    {visibleFunctions?.fn.filter((fn) => fn.context === 'cards').length > 0 && <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />}
                    {visibleFunctions?.fn.filter((fn) => fn.context === 'cards').map((originalFn) => {
                      const fn = { ...originalFn };
                      try { if (typeof fn.params === 'string') fn.params = JSON.parse(fn.params); } catch { fn.params = null; }
                      return (
                        <div key={fn.title} onClick={(e) => e.stopPropagation()}>
                          <DynamicMenuItem fn={fn} params={{ recordid: contextMenu.recordid, ...(typeof fn.params === 'object' && fn.params ? fn.params : {}) }} />
                        </div>
                      )
                    })}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        
        </>
      )}
    </GenericComponent>
  );
}