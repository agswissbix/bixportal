import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  CalendarDays, 
  AlertCircle, 
  XCircle,
  Briefcase,
  User,
  MoreVertical,
  Copy,
  Activity,
  ArrowRight,
  ArrowLeft,
  LayoutList,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  Eye,
  List,
  Info,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Check,
  DollarSign,
  Clock,
  Building2,
  ChevronRight,
  Sliders,
  HelpCircle,
  Percent
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('Tutti');
  const [simulationActive, setSimulationActive] = useState(false);
  const [simData, setSimData] = useState<any>(null);

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
      typepreference: "insert_fields",
      _refreshTick: refreshTable['deal'] ?? 0
    }
  }, [searchTerm, refreshTable['deal'] ?? 0, filtersList, tableView, currentPage])

  const { response, loading, error } = useApi<ResponseInterface>(payload)

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtersList]);

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
      const company = getField('recordidcompany_');
      const dealstage = getField('dealstage');
      
      const isGoodMargin = effectivemargin >= expectedmargin;
      const performancePercent = expectedmargin > 0 ? (effectivemargin / expectedmargin) * 100 : 100;

      // HW/SW
      const expectedhwserviceprice = parseFloat(getField('expectedhwserviceprice')) || 0;
      const expectedhwservicecost = parseFloat(getField('expectedhwservicecost')) || 0;
      const actualhwservicecost = parseFloat(getField('actualhwservicecost')) || 0;
      const expectedhwservicemargin = parseFloat(getField('expectedhwservicemargin')) || 0;
      const actualhwservicemargin = parseFloat(getField('actualhwservicemargin')) || 0;

      // LAVORO
      const expectedlaborprice = parseFloat(getField('expectedlaborprice')) || 0;
      const expectedlaborcost = parseFloat(getField('expectedlaborcost')) || 0;
      const actuallaborcost = parseFloat(getField('actuallaborcost')) || 0;
      const expectedhours = parseFloat(getField('expectedhours')) || 0;
      const usedhours = parseFloat(getField('usedhours')) || 0;
      const nonbillablehours = parseFloat(getField('nonbillablehours')) || 0;
      const expectedlabormargin = parseFloat(getField('expectedlabormargin')) || 0;
      const actuallabormargin = parseFloat(getField('actuallabormargin')) || 0;

      // TOTALI
      const amount = parseFloat(getField('amount')) || 0;
      const grossamount = parseFloat(getField('grossamount')) || 0;
      const expectedcost = parseFloat(getField('expectedcost')) || 0;
      const actualcost = parseFloat(getField('actualcost')) || 0;
      const actualgrossmargin = parseFloat(getField('actualgrossmargin')) || 0;
      const actualnetmargin = parseFloat(getField('actualnetmargin')) || 0;
      const totalcontractvalue = parseFloat(getField('totalcontractvalue')) || 0;
      
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
        dealstage,
        isGoodMargin,
        performancePercent,
        expectedhwserviceprice, expectedhwservicecost, actualhwservicecost, expectedhwservicemargin, actualhwservicemargin,
        expectedlaborprice, expectedlaborcost, actuallaborcost, expectedhours, usedhours, nonbillablehours, expectedlabormargin, actuallabormargin,
        amount, grossamount, expectedcost, actualcost, actualgrossmargin, actualnetmargin, totalcontractvalue
      };
    });
  }, [response]);

  const calculateMargins = (deal: any) => {
    const data = simulationActive && simData && simData.recordid_ === deal.recordid_ ? simData : deal;
    
    // Simulate what the mockup did
    const hwSales = Number(data.expectedhwserviceprice) || 0;
    const hwPlannedCost = Number(data.expectedhwservicecost) || 0;
    const hwActualCost = Number(data.actualhwservicecost) || 0;
    
    const hwPlannedMargin = hwSales - hwPlannedCost;
    const hwActualMargin = hwSales - hwActualCost;
    
    const hwPlannedMarginPct = hwSales ? (hwPlannedMargin / hwSales) * 100 : 0;
    const hwActualMarginPct = hwSales ? (hwActualMargin / hwSales) * 100 : 0;

    const laborType = data.fixedprice ? 'progetto' : 'ore';
    const costRate = 60; // default come richiesto dal mockup
    const sellRate = 120;
    
    const plannedHours = Number(data.expectedhours) || 0;
    const actualHours = Number(data.usedhours) || 0;
    const extraHours = Number(data.nonbillablehours) || 0;
    const billedHours = Number(data.invoicedhours) || 0;

    let laborPlannedSales = Number(data.expectedlaborprice) || 0;
    let laborActualSales = 0;

    if (laborType === 'progetto') {
      laborActualSales = laborPlannedSales;
    } else {
      laborActualSales = Number(data.invoicedprice) || (billedHours * sellRate);
    }

    const laborPlannedCost = Number(data.expectedlaborcost) || (plannedHours * costRate);
    const laborActualCostGross = actualHours * costRate;

    const laborPlannedMargin = laborPlannedSales - laborPlannedCost;
    const laborActualMarginGross = laborActualSales - laborActualCostGross;

    const laborPlannedMarginPct = laborPlannedSales ? (laborPlannedMargin / laborPlannedSales) * 100 : 0;
    const laborActualMarginGrossPct = laborActualSales ? (laborActualMarginGross / laborActualSales) * 100 : 0;

    const totalPlannedSales = Number(data.amount) || (hwSales + laborPlannedSales);
    const totalActualSales = Number(data.grossamount) || (hwSales + laborActualSales);

    const totalPlannedMargin = Number(data.expectedmargin) || (hwPlannedMargin + laborPlannedMargin);
    // Margine effettivo totale = Margine HW + Margine Lavoro
    const totalActualMarginNet = Number(data.actualnetmargin) || (hwActualMargin + laborActualMarginGross);
    const totalActualMarginGross = Number(data.actualgrossmargin) || totalActualMarginNet;

    const totalPlannedMarginPct = totalPlannedSales ? (totalPlannedMargin / totalPlannedSales) * 100 : 0;
    const totalActualMarginGrossPct = totalActualSales ? (totalActualMarginGross / totalActualSales) * 100 : 0;
    const totalActualMarginNetPct = totalActualSales ? (totalActualMarginNet / totalActualSales) * 100 : 0;

    return {
      ...data,
      id: data.recordid_,
      name: data.dealname || 'Senza Nome',
      company: data.company || 'N/A',
      seller: data.dealuser1,
      status: data.dealstage || 'In Trattativa',
      
      hw_sales_price: hwSales,
      hw_planned_cost: hwPlannedCost,
      hw_actual_cost: hwActualCost,
      hw_planned_margin: hwPlannedMargin,
      hw_actual_margin: hwActualMargin,
      hw_planned_margin_pct: hwPlannedMarginPct,
      hw_actual_margin_pct: hwActualMarginPct,
      
      labor_type: laborType,
      labor_hourly_rate: sellRate,
      labor_cost_rate: costRate,
      labor_planned_hours: plannedHours,
      labor_actual_hours: actualHours,
      labor_extra_hours: extraHours,
      labor_billed_hours: billedHours,
      
      labor_planned_sales: laborPlannedSales,
      labor_actual_sales: laborActualSales,
      labor_planned_cost: laborPlannedCost,
      labor_actual_cost_gross: laborActualCostGross,
      labor_planned_margin: laborPlannedMargin,
      labor_actual_margin_gross: laborActualMarginGross,
      labor_planned_margin_pct: laborPlannedMarginPct,
      labor_actual_margin_gross_pct: laborActualMarginGrossPct,

      total_planned_sales: totalPlannedSales,
      total_actual_sales: totalActualSales,
      total_planned_margin: totalPlannedMargin,
      total_actual_margin_gross: totalActualMarginGross,
      total_actual_margin_net: totalActualMarginNet,
      total_planned_margin_pct: totalPlannedMarginPct,
      total_actual_margin_gross_pct: totalActualMarginGrossPct,
      total_actual_margin_net_pct: totalActualMarginNetPct
    };
  };

  const calculatedDeals = useMemo(() => {
    return processedDeals.map(deal => calculateMargins(deal));
  }, [processedDeals, simulationActive, simData]);

  const currentDeal = useMemo(() => {
    return calculatedDeals.find(d => d.id === selectedDealId) || calculatedDeals[0];
  }, [calculatedDeals, selectedDealId]);

  const filteredDeals = useMemo(() => {
    if (filterStatus === 'Tutti') return calculatedDeals;
    return calculatedDeals.filter(d => d.status === filterStatus);
  }, [calculatedDeals, filterStatus]);

  const globalMetrics = useMemo(() => {
    const activeDeals = calculatedDeals.filter(d => d.status !== 'Persa');
    const totalSales = activeDeals.reduce((acc, d) => acc + d.total_actual_sales, 0);
    const totalPlannedSales = activeDeals.reduce((acc, d) => acc + d.total_planned_sales, 0);
    const totalMarginNet = activeDeals.reduce((acc, d) => acc + d.total_actual_margin_net, 0);
    const totalPlannedMargin = activeDeals.reduce((acc, d) => acc + d.total_planned_margin, 0);
    const avgMarginPct = totalSales ? (totalMarginNet / totalSales) * 100 : 0;
    
    return {
      totalSales,
      totalPlannedSales,
      totalMarginNet,
      totalPlannedMargin,
      avgMarginPct,
      count: activeDeals.length
    };
  }, [calculatedDeals]);

  const handleSimulateChange = (field: string, value: string) => {
    const numValue = Number(value);
    if (!simulationActive) {
      setSimulationActive(true);
      const baseDeal = processedDeals.find(d => d.recordid_ === selectedDealId);
      if (baseDeal) {
        // Map simulation fields back to original bix properties
        let mappedField = field;
        if (field === 'labor_actual_hours') mappedField = 'usedhours';
        if (field === 'labor_extra_hours') mappedField = 'nonbillablehours';
        if (field === 'hw_actual_cost') mappedField = 'actualhwservicecost';

        const copy = { ...baseDeal, [mappedField]: numValue };
        setSimData(copy);
      }
    } else {
      let mappedField = field;
      if (field === 'labor_actual_hours') mappedField = 'usedhours';
      if (field === 'labor_extra_hours') mappedField = 'nonbillablehours';
      if (field === 'hw_actual_cost') mappedField = 'actualhwservicecost';

      setSimData({ ...simData, [mappedField]: numValue });
    }
  };

  const resetSimulation = () => {
    setSimulationActive(false);
    setSimData(null);
  };

  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Ordine materiale': 'bg-blue-50 text-blue-700 border-blue-200',
      'Appuntamento': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Credit check': 'bg-rose-50 text-rose-700 border-rose-200',
      'Progetto in corso': 'bg-amber-50 text-amber-700 border-amber-200',
      'Progetto fatturato': 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  return (
    <GenericComponent response={response} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <>
        <div className="flex flex-col h-full text-slate-800 font-sans relative">
          
          {/* KPI DI SINTESI (PIPELINE ATTIVA) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 shrink-0 bg-white border-b border-slate-200">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Venduto Effettivo (Attivo)</p>
                <h3 className="text-xl md:text-2xl font-bold mt-1 text-slate-950">{formatCHF(globalMetrics.totalSales)}</h3>
                <p className="text-xs text-slate-400 mt-1">Previsto: {formatCHF(globalMetrics.totalPlannedSales)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-indigo-600">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Margine Netto Effettivo</p>
                <h3 className="text-xl md:text-2xl font-bold mt-1 text-emerald-600">{formatCHF(globalMetrics.totalMarginNet)}</h3>
                <p className="text-xs text-slate-400 mt-1">Previsto: {formatCHF(globalMetrics.totalPlannedMargin)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Efficienza Margine Medio</p>
                <h3 className="text-xl md:text-2xl font-bold mt-1 text-slate-900">{globalMetrics.avgMarginPct.toFixed(1)}%</h3>
                <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(Math.max(globalMetrics.avgMarginPct, 0), 100)}%` }}></div>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                <Percent className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Trattative Attive / Vinte</p>
                <h3 className="text-xl md:text-2xl font-bold mt-1 text-slate-900">{globalMetrics.count}</h3>
                <p className="text-xs text-slate-400 mt-1">Escluse trattative Perse</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </section>

          {/* CONTROLLI DI VISTA & FILTRI */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-4 shrink-0 bg-white border-b border-slate-200">

            {/* Selettore Vista */}
            <div className="bg-slate-200/60 p-1 rounded-xl flex items-center self-start md:self-auto shadow-inner">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Vista Schede + Dettaglio
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Vista Tabella Unica
              </button>
            </div>
          </div>

          {/* Area scrollabile */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50">
            {filteredDeals.length === 0 ? (
              <div className="text-center py-16 m-4 bg-white rounded-xl border border-slate-200 border-dashed">
                <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Nessuna trattativa trovata</h3>
                <p className="mt-1 text-slate-500">Prova a modificare i filtri o i termini di ricerca.</p>
              </div>
            ) : viewMode === 'table' ? (
              <div className="min-w-max border-b border-slate-200">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 border-y border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Trattativa</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Hardware / Software</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Lavoro</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Totali</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredDeals.map((deal) => (
                      <tr 
                        key={deal.recordid_} 
                        onClick={() => handleRowClick('standard', deal.recordid_, 'deal')}
                        className={`even:bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer transition-colors group ${
                          deal.isGoodMargin ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-rose-400'
                        }`}
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1.5 max-w-[300px] truncate">
                            <div className="font-bold text-slate-900 text-base flex items-center gap-2 ">
                              {deal.dealname || 'Senza Nome'}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold bg-indigo-50 w-fit px-2 py-0.5 rounded border border-indigo-100">
                              <Building2 className="w-3.5 h-3.5" /> {deal.company || 'N/A'}
                            </div>
                            <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500">
                              {deal.dealstage && (
                                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-slate-400"/> {deal.dealstage}</span>
                              )}
                              {deal.dealuser1 && (
                                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400"/> {deal.dealuser1}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1.5 text-xs min-w-[160px]">
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-slate-500">Vendita</span>
                              <span className="font-mono text-slate-700 font-bold text-xs">{formatCHF(deal.expectedhwserviceprice)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-slate-500">Costo Prev.</span>
                              <span className="font-mono text-slate-500">{formatCHF(deal.expectedhwservicecost)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-slate-500">Costo Eff.</span>
                              <span className={`font-mono text-xs font-bold ${deal.actualhwservicecost > deal.expectedhwservicecost ? "text-rose-600" : "text-slate-700"}`}>{formatCHF(deal.actualhwservicecost)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-6 pt-1.5 border-t border-slate-100 mt-1">
                              <span className="text-slate-400 font-semibold">Margine</span>
                              <span className={`font-mono font-bold text-xs ${deal.actualhwservicemargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatCHF(deal.actualhwservicemargin)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1.5 text-xs min-w-[160px]">
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-slate-500">Ore Prev.</span>
                              <span className="font-mono text-slate-500">{deal.expectedhours}h</span>
                            </div>
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-slate-500">Ore Eff.</span>
                              <span className={`font-mono text-xs font-bold ${deal.usedhours > deal.expectedhours ? "text-amber-600" : "text-slate-700"}`}>{deal.usedhours}h</span>
                            </div>
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-slate-500">Ore Extra</span>
                              <span className={`font-mono text-xs font-bold ${deal.nonbillablehours > 0 ? "text-rose-600" : "text-slate-500"}`}>{deal.nonbillablehours}h</span>
                            </div>
                            <div className="flex justify-between items-center gap-6 pt-1.5 border-t border-slate-100 mt-1">
                              <span className="text-slate-400 font-semibold">Mrg Netto</span>
                              <span className={`font-mono font-bold text-xs ${deal.actuallabormargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatCHF(deal.actuallabormargin)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1.5 text-xs min-w-[160px]">
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-slate-500">Fatturato</span>
                              <span className="font-mono text-slate-700 font-bold text-xs">{formatCHF(deal.total_actual_sales)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-6">
                              <span className="text-slate-500">Mrg Lordo</span>
                              <span className="font-mono text-slate-600 font-bold text-xs">{formatCHF(deal.total_actual_margin_gross)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-6 pt-1.5 border-t border-slate-100 mt-1">
                              <span className="text-slate-400 font-semibold">Mrg Netto</span>
                              <span className={`font-mono font-bold text-xs ${deal.total_actual_margin_net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                {deal.total_actual_margin_net_pct.toFixed(1)}% <span className="text-[10px] text-slate-400 ml-1 font-normal">({formatCHF(deal.total_actual_margin_net)})</span>
                              </span>
                            </div>
                            {deal.totalcontractvalue > 0 && (
                              <div className="flex justify-between items-center gap-6 pt-1.5 border-t border-slate-100 mt-1">
                                <span className="text-purple-400 font-semibold text-[10px] uppercase tracking-wider">Contratto</span>
                                <span className="font-mono text-purple-700 font-semibold text-xs">{formatCHF(deal.totalcontractvalue)}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Analizza Margini"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setSelectedDealId(deal.id);
                                setViewMode('cards');
                                resetSimulation();
                              }}
                            >
                              <Eye className="w-5 h-5" />
                            </button>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start p-4">
                {/* SPALLA SINISTRA: Lista Schede Trattative */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trattative ({filteredDeals.length})</span>
                    <span className="text-xs text-indigo-600 font-medium">Clicca per analizzare</span>
                  </div>
                  
                  <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
                    {filteredDeals.map((deal) => {
                      const isSelected = deal.id === selectedDealId;
                      return (
                        <div
                          key={deal.id}
                          onClick={() => { setSelectedDealId(deal.id); resetSimulation(); }}
                          className={`p-4 rounded-xl border transition-all cursor-pointer bg-white relative overflow-hidden group ${
                            isSelected 
                              ? 'border-indigo-600 shadow-md ring-1 ring-indigo-500/10' 
                              : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                          }`}
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            deal.total_actual_margin_net_pct >= 30 
                              ? 'bg-emerald-500' 
                              : deal.total_actual_margin_net_pct >= 15 
                              ? 'bg-blue-500' 
                              : deal.total_actual_margin_net_pct > 0 
                              ? 'bg-amber-400' 
                              : 'bg-rose-500'
                          }`} />
                          
                          <div className="pl-2">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{deal.name}</h4>
                              <span className="shrink-0">{renderStatusBadge(deal.status)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span className="line-clamp-1">{deal.company}</span>
                            </div>

                            <div className="pt-3 mt-3 border-t border-slate-100">
                              <div className="flex justify-between items-end mb-1.5">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-0.5">Venduto</span>
                                  <span className="font-bold text-slate-900 text-sm font-mono">{formatCHF(deal.total_actual_sales)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block mb-0.5">Mrg Netto</span>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className={`font-bold text-sm ${deal.total_actual_margin_net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {deal.total_actual_margin_net_pct.toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">
                                      {formatCHF(deal.total_actual_margin_net)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    deal.total_actual_margin_net_pct >= 30 ? 'bg-emerald-500' : 
                                    deal.total_actual_margin_net_pct >= 15 ? 'bg-blue-500' : 
                                    deal.total_actual_margin_net_pct > 0 ? 'bg-amber-400' : 'bg-rose-500'
                                  }`} 
                                  style={{ width: `${Math.min(Math.max(deal.total_actual_margin_net_pct, 0), 100)}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* Pulsanti azioni veloci */}
                            <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-50/80">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRowClick('standard', deal.id, 'deal'); }}
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded transition"
                                title="Modifica"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SEZIONE DESTRA: Dettaglio Margini Trattativa */}
                <div className="lg:col-span-8">
                  {currentDeal ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                      {/* ── DEAL HEADER ────────────────────────────────── */}
                      <div className="p-6 bg-[#0B1120] text-white border-b border-slate-800">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                                Dettaglio Economico
                              </span>
                              {renderStatusBadge(currentDeal.status)}
                              {simulationActive && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold uppercase tracking-wider animate-pulse">
                                  Simulazione Attiva
                                </span>
                              )}
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight mb-2 truncate">{currentDeal.name}</h2>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /><strong className="text-slate-200 font-medium">{currentDeal.company}</strong></span>
                              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /><strong className="text-slate-200 font-medium">{currentDeal.seller}</strong></span>
                              <span className="flex items-center gap-1.5">
                                <span className={`font-semibold ${currentDeal.labor_type === 'progetto' ? 'text-indigo-400' : 'text-amber-400'}`}>
                                  {currentDeal.labor_type === 'progetto' ? 'Lavoro a Progetto' : 'Lavoro a Consuntivo'}
                                </span>
                              </span>
                            </div>
                            <div className="mt-4">
                              <button
                                onClick={() => handleRowClick('standard', currentDeal.id, 'deal')}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition"
                              >
                                Modifica Dati Base
                              </button>
                            </div>
                          </div>

                          {/* Total margin net big */}
                          <div className="shrink-0 text-right bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Margine Netto Eff.</p>
                            <p className={`text-4xl font-black font-mono ${currentDeal.total_actual_margin_net_pct >= 30 ? 'text-emerald-400' : currentDeal.total_actual_margin_net_pct >= 15 ? 'text-blue-400' : currentDeal.total_actual_margin_net_pct > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {currentDeal.total_actual_margin_net_pct.toFixed(1)}%
                            </p>
                            <p className="text-sm text-slate-300 font-mono font-medium mt-1">{formatCHF(currentDeal.total_actual_margin_net)}</p>
                          </div>
                        </div>
                      </div>

                      {/* CONTENUTO SCHEDA DETTAGLIO */}
                      <div className="p-6 space-y-6 overflow-y-auto bg-slate-50">
                        
                        {/* ── ECONOMIC OVERVIEW ─────────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          {/* Coppietta Fatturato */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 justify-between">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Fatturato Globale</p>
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-2">
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-medium">Previsto</span>
                                <span className="font-mono text-base text-slate-600">{formatCHF(currentDeal.total_planned_sales)}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-medium">Effettivo</span>
                                <span className="font-mono text-base font-bold text-slate-900">{formatCHF(currentDeal.total_actual_sales)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Coppietta Margine (Previsto vs Lordo Effettivo) */}
                          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 justify-between">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Margine di Base</p>
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-2">
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-medium">Previsto</span>
                                <span className="font-mono text-base text-slate-600">{formatCHF(currentDeal.total_planned_margin)}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-medium">Lordo Effettivo</span>
                                <span className="font-mono text-base font-bold text-slate-900">{formatCHF(currentDeal.total_actual_margin_gross)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Coppietta Margine Netto Effettivo (Valore vs Pct) */}
                          <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 justify-between border-l-4 ${currentDeal.total_actual_margin_net >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Margine Netto Finale</p>
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-2">
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-medium">Valore</span>
                                <span className={`font-mono text-base font-bold ${currentDeal.total_actual_margin_net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCHF(currentDeal.total_actual_margin_net)}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-medium">Percentuale</span>
                                <span className={`font-mono text-base font-bold ${currentDeal.total_actual_margin_net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currentDeal.total_actual_margin_net_pct.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── DETAIL BLOCKS: HW + LAVORO ───────────────── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* HW/SW */}
                          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                              <div className="flex items-center gap-2.5">
                                <h4 className="text-sm font-bold text-slate-800">Hardware / Software</h4>
                              </div>
                              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">HW/SW</span>
                            </div>

                            {/* Header row */}
                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-5 pt-4 pb-2 border-b border-slate-50">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Voce</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold text-right w-20">Previsto</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold text-right w-20">Effettivo</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold text-right w-20">Delta</span>
                            </div>

                            <div className="px-5 pb-5">
                              {[
                                { label: "Prezzo di Vendita", planned: currentDeal.hw_sales_price, actual: currentDeal.hw_sales_price },
                                { label: "Costo", planned: currentDeal.hw_planned_cost, actual: currentDeal.hw_actual_cost },
                                { label: "Margine HW/SW", planned: currentDeal.hw_planned_margin, actual: currentDeal.hw_actual_margin, highlight: true },
                              ].map((r) => {
                                const delta = r.actual - r.planned;
                                const positive = delta >= 0;
                                return (
                                  <div key={r.label} className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center py-3 border-b border-slate-50 last:border-0 ${r.highlight ? "bg-slate-50 -mx-5 px-5 rounded-lg mt-2" : ""}`}>
                                    <span className="text-xs text-slate-500 font-medium">{r.label}</span>
                                    <span className="text-xs text-slate-500 font-mono text-right w-20">{formatCHF(r.planned)}</span>
                                    <span className={`text-xs font-bold font-mono text-right w-20 ${r.highlight ? "text-slate-800" : "text-slate-700"}`}>{formatCHF(r.actual)}</span>
                                    <span className={`text-xs font-bold font-mono text-right w-20 ${delta === 0 ? "text-slate-300" : positive ? "text-emerald-500" : "text-rose-500"}`}>
                                      {delta === 0 ? "-" : `${positive ? "+" : ""}${formatCHF(delta)}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {currentDeal.hw_actual_cost > currentDeal.hw_planned_cost && (
                              <div className="px-5 pb-5 pt-0">
                                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-medium">
                                  <AlertTriangle className="w-4 h-4 shrink-0" />
                                  <span>Sforamento Costi HW: +{formatCHF(currentDeal.hw_actual_cost - currentDeal.hw_planned_cost)}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Lavoro */}
                          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
                              <div className="flex items-center gap-2.5">
                                <h4 className="text-sm font-bold text-slate-800">Lavoro</h4>
                              </div>
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {currentDeal.labor_type === 'progetto' ? 'A Progetto' : 'A Consuntivo'}
                              </span>
                            </div>

                            <div className="px-5 py-4 space-y-5">
                              {/* Hours gauge (adapted to light mode) */}
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Ore Lavorate</p>
                                <div className="space-y-2.5">
                                  <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 gap-0.5">
                                    <div className="bg-slate-300 rounded-l-full transition-all" style={{ width: `${Math.min(100, (currentDeal.labor_planned_hours / Math.max(currentDeal.labor_planned_hours, currentDeal.labor_actual_hours + currentDeal.labor_extra_hours)) * 100)}%` }} title="Pianificate" />
                                    <div className="bg-indigo-500 transition-all" style={{ width: `${Math.min(100, (currentDeal.labor_actual_hours / Math.max(currentDeal.labor_planned_hours, currentDeal.labor_actual_hours + currentDeal.labor_extra_hours)) * 100)}%` }} title="Effettive" />
                                    <div className="bg-rose-500 rounded-r-full transition-all" style={{ width: `${Math.min(100, (currentDeal.labor_extra_hours / Math.max(currentDeal.labor_planned_hours, currentDeal.labor_actual_hours + currentDeal.labor_extra_hours)) * 100)}%` }} title="Extra" />
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] font-medium">
                                    <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />Prev: <strong className="text-slate-700">{currentDeal.labor_planned_hours}h</strong></span>
                                    <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Eff: <strong className="text-indigo-700">{currentDeal.labor_actual_hours}h</strong></span>
                                    <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Extra: <strong className="text-rose-600">{currentDeal.labor_extra_hours}h</strong></span>
                                  </div>
                                </div>
                              </div>

                              {/* Rates */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Costo Interno</p>
                                  <p className="font-bold text-slate-700 font-mono">{formatCHF(currentDeal.labor_cost_rate)}/h</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Tariffa Vendita</p>
                                  <p className="font-bold text-indigo-600 font-mono">{formatCHF(currentDeal.labor_hourly_rate)}/h</p>
                                  {currentDeal.labor_type === 'ore' && (
                                    <p className="text-[10px] text-slate-500 mt-0.5">{currentDeal.labor_billed_hours}h fatturate</p>
                                  )}
                                </div>
                              </div>

                              {/* Margin rows */}
                              <div className="border-t border-slate-100 pt-1 space-y-0">
                                {[
                                  { label: "Margine Previsto", planned: currentDeal.labor_planned_margin, actual: currentDeal.labor_planned_margin },
                                  { label: "Mrg Lordo Eff.", planned: currentDeal.labor_planned_margin, actual: currentDeal.labor_actual_margin_gross, highlight: true }
                                ].map((r) => {
                                  const delta = r.actual - r.planned;
                                  const positive = delta >= 0;
                                  return (
                                    <div key={r.label} className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center py-3 border-b border-slate-50 last:border-0 ${r.highlight ? "bg-slate-50 -mx-5 px-5 rounded-lg mt-2" : ""}`}>
                                      <span className="text-xs text-slate-500 font-medium">{r.label}</span>
                                      <span className="text-xs text-slate-500 font-mono text-right w-20">{formatCHF(r.planned)}</span>
                                      <span className={`text-xs font-bold font-mono text-right w-20 ${r.highlight ? "text-slate-800" : "text-slate-700"}`}>{formatCHF(r.actual)}</span>
                                      <span className={`text-xs font-bold font-mono text-right w-20 ${delta === 0 ? "text-slate-300" : positive ? "text-emerald-500" : "text-rose-500"}`}>
                                        {delta === 0 ? "-" : `${positive ? "+" : ""}${formatCHF(delta)}`}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ── SIMULATOR ─────────────────────────────────── */}
                        <div className="bg-white border border-amber-200 shadow-sm rounded-xl overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/30 gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md">
                                <Sliders className="w-4 h-4 animate-pulse" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-amber-900">Simulatore di Margine</h4>
                                <p className="text-[10px] text-amber-700/70 mt-0.5 uppercase tracking-wider font-semibold">Modifica i parametri per vedere l'impatto in tempo reale</p>
                              </div>
                            </div>
                            {simulationActive && (
                              <button
                                onClick={resetSimulation}
                                className="flex items-center justify-center gap-1.5 text-xs bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 font-semibold py-1.5 px-3 rounded-lg transition"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Ripristina
                              </button>
                            )}
                          </div>

                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Slider: Actual hours */}
                            <div>
                              <div className="flex justify-between items-baseline mb-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ore Effettive</label>
                                <span className="text-sm font-bold text-indigo-600 font-mono">{currentDeal.labor_actual_hours}h</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={Math.max(currentDeal.labor_planned_hours * 2, 300)}
                                value={currentDeal.labor_actual_hours}
                                onChange={(e) => handleSimulateChange('labor_actual_hours', e.target.value)}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500 bg-slate-200"
                              />
                              <p className="text-[10px] text-slate-500 mt-2 font-medium">Previste: {currentDeal.labor_planned_hours}h · @{currentDeal.labor_cost_rate} CHF/h</p>
                            </div>

                            {/* Slider: Extra hours */}
                            <div>
                              <div className="flex justify-between items-baseline mb-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ore Extra</label>
                                <span className="text-sm font-bold text-rose-500 font-mono">{currentDeal.labor_extra_hours}h</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={currentDeal.labor_extra_hours}
                                onChange={(e) => handleSimulateChange('labor_extra_hours', e.target.value)}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-rose-500 bg-slate-200"
                              />
                              <p className="text-[10px] text-slate-500 mt-2 font-medium">Erodono il margine a {currentDeal.labor_cost_rate} CHF/h</p>
                            </div>

                            {/* Slider: HW actual cost */}
                            <div>
                              <div className="flex justify-between items-baseline mb-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Costo HW/SW</label>
                                <span className="text-sm font-bold text-amber-600 font-mono">{formatCHF(currentDeal.hw_actual_cost)}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={Math.max(currentDeal.hw_sales_price * 1.5, 50000)}
                                step="100"
                                value={currentDeal.hw_actual_cost}
                                onChange={(e) => handleSimulateChange('hw_actual_cost', e.target.value)}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-amber-500 bg-slate-200"
                              />
                              <p className="text-[10px] text-slate-500 mt-2 font-medium">Vendita HW/SW: {formatCHF(currentDeal.hw_sales_price)}</p>
                            </div>
                          </div>

                          {/* Simulation result */}
                          {simulationActive && (
                            <div className="border-t border-amber-100 bg-amber-50/50 p-6">
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-amber-200 shadow-sm rounded-xl p-5">
                                <div>
                                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Nuovo Margine Netto Simulato</p>
                                  <div className="flex items-baseline gap-3">
                                    <span className={`text-2xl font-black font-mono ${currentDeal.total_actual_margin_net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {currentDeal.total_actual_margin_net_pct.toFixed(1)}%
                                    </span>
                                    <span className={`text-base font-bold font-mono ${currentDeal.total_actual_margin_net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {formatCHF(currentDeal.total_actual_margin_net)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-center sm:text-right">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Delta vs Originale</p>
                                  {(() => {
                                    const origDeal = calculatedDeals.find(d => d.recordid_ === currentDeal.id) || currentDeal;
                                    const orig = origDeal.total_actual_margin_net;
                                    const curr = currentDeal.total_actual_margin_net;
                                    const delta = curr - orig;
                                    return (
                                      <p className={`text-xl font-bold font-mono ${delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                        {delta >= 0 ? "+" : ""}{formatCHF(delta)}
                                      </p>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="bg-white h-full flex flex-col items-center justify-center p-16 rounded-xl border border-slate-200 text-center text-slate-400">
                      <Info className="w-16 h-16 text-slate-200 mb-4" />
                      <p className="text-lg font-medium text-slate-600 mb-1">Seleziona una trattativa</p>
                      <p className="text-sm">Clicca su una scheda a sinistra per esplorare la marginalità dettagliata.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SEZIONE PAGINAZIONE FISSA IN BASSO */}
          <div className="flex-none bg-card border-t border-slate-200 p-2 sm:p-4 z-20 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] rounded-b-xl">
            <nav
              aria-label="Page navigation"
              className="flex flex-col sm:flex-row justify-between items-center space-x-2 space-y-2 sm:space-y-0"
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