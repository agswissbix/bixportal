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
  Percent,
  Box,
  Timer,
  Lock
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
  const [openHoursPopupId, setOpenHoursPopupId] = useState<string | null>(null);

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
      setVisibleFunctions({ fn: responseFunc.fn ?? [] });
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
      const annualprice = parseFloat(getField('annualprice')) || 0;
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
      const actuallaborprice = parseFloat(getField('actuallaborprice')) || 0;
      const expectedlaborcost = parseFloat(getField('expectedlaborcost')) || 0;
      const actuallaborcost = parseFloat(getField('actuallaborcost')) || 0;
      const expectedhours = parseFloat(getField('expectedhours')) || 0;
      const usedhours = parseFloat(getField('usedhours')) || 0;
      const nonbillablehours = parseFloat(getField('nonbillablehours')) || 0;
      const expectedlabormargin = parseFloat(getField('expectedlabormargin')) || 0;
      const actuallabormargin = parseFloat(getField('actuallabormargin')) || 0;

      const residualhours = parseFloat(getField('residualhours')) || 0;
      const travelhours = parseFloat(getField('travelhours')) || 0;
      const saleshours = parseFloat(getField('saleshours')) || 0;
      const unbilledhours = parseFloat(getField('unbilledhours')) || 0;
      const totalhours = parseFloat(getField('totalhours')) || 0;
      const deductedhours = parseFloat(getField('deductedhours')) || 0;

      // TOTALI
      const amount = parseFloat(getField('amount')) || 0;
      const grossamount = parseFloat(getField('grossamount')) || 0;
      const expectedcost = parseFloat(getField('expectedcost')) || 0;
      const actualcost = parseFloat(getField('actualcost')) || 0;
      const actualgrossmargin = parseFloat(getField('actualgrossmargin')) || 0;
      const actualnetmargin = parseFloat(getField('actualnetmargin')) || 0;
      const totalcontractnetmargin = parseFloat(getField('totalcontractnetmargin')) || 0;
      const totalcontractvalue = parseFloat(getField('totalcontractvalue')) || 0;

      return {
        recordid_: row.recordid,
        expectedmargin,
        effectivemargin,
        annualprice,
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
        expectedlaborprice, actuallaborprice, expectedlaborcost, actuallaborcost, expectedhours, usedhours, nonbillablehours, expectedlabormargin, actuallabormargin,
        residualhours, travelhours, saleshours, unbilledhours, totalhours,
        amount, grossamount, expectedcost, actualcost, actualgrossmargin, actualnetmargin, totalcontractnetmargin, totalcontractvalue
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

    const laborPlannedSales = Number(data.expectedlaborprice) || 0;
    const laborActualSales = Number(data.actuallaborprice) || 0;

    const laborPlannedCost = Number(data.expectedlaborcost) || 0;
    const laborActualCostGross = Number(data.actuallaborcost) || 0;

    const laborPlannedMargin = Number(data.expectedlabormargin) || 0;
    const laborActualMarginGross = Number(data.actuallabormargin) || 0;

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

      residualhours: Number(data.residualhours) || 0,
      travelhours: Number(data.travelhours) || 0,
      saleshours: Number(data.saleshours) || 0,
      unbilledhours: Number(data.unbilledhours) || 0,
      totalhours: Number(data.totalhours) || 0,

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
      total_actual_margin_net_pct: totalActualMarginNetPct,

      annualprice: Number(data.annualprice) || 0,
      annualmargin: Number(data.annualmargin) || 0,
      totalcontractnetmargin: Number(data.totalcontractnetmargin) || 0,
      totalcontractvalue: Number(data.totalcontractvalue) || 0
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
    // Se il backend fornisce i totali specifici calcolati su tutto il dataset, usiamo quelli
    if (response?.totals && response.totals.total_actual_sales !== undefined) {
      return {
        totalSales: Number(response.totals.total_actual_sales) || 0,
        totalPlannedSales: Number(response.totals.total_planned_sales) || 0,
        totalMarginNet: Number(response.totals.total_actual_margin_net) || 0,
        totalPlannedMargin: Number(response.totals.total_planned_margin) || 0,
        totalMarginGross: Number(response.totals.total_actual_margin_gross) || 0,
        avgMarginPct: Number(response.totals.avg_margin_pct) || 0,
        count: response.counter || 0
      };
    }

    // Fallback: calcolo frontend (solo sulla pagina corrente)
    const activeDeals = calculatedDeals.filter(d => d.status !== 'Persa');
    const totalSales = activeDeals.reduce((acc, d) => acc + d.total_actual_sales, 0);
    const totalPlannedSales = activeDeals.reduce((acc, d) => acc + d.total_planned_sales, 0);
    const totalMarginNet = activeDeals.reduce((acc, d) => acc + d.total_actual_margin_net, 0);
    const totalPlannedMargin = activeDeals.reduce((acc, d) => acc + d.total_planned_margin, 0);
    const totalMarginGross = activeDeals.reduce((acc, d) => acc + d.total_actual_margin_gross, 0);
    const avgMarginPct = totalSales ? (totalMarginNet / totalSales) * 100 : 0;

    return {
      totalSales,
      totalPlannedSales,
      totalMarginNet,
      totalPlannedMargin,
      totalMarginGross,
      avgMarginPct,
      count: activeDeals.length
    };
  }, [calculatedDeals, response]);

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
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 shrink-0 bg-white border-b border-slate-200">
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
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Margine Previsto</p>
                  <h3 className="text-xl md:text-2xl font-bold mt-1 text-slate-900">{formatCHF(globalMetrics.totalPlannedMargin)}</h3>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Margine Lordo Effettivo</p>
                  <h3 className="text-xl md:text-2xl font-bold mt-1 text-amber-600">{formatCHF(globalMetrics.totalMarginGross)}</h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Margine Netto Effettivo</p>
                  <h3 className="text-xl md:text-2xl font-bold mt-1 text-emerald-600">{formatCHF(globalMetrics.totalMarginNet)}</h3>
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
            </section>

            {/* Area scrollabile */}
            <div className="flex-1 overflow-auto min-h-0 bg-slate-50/50">
              {filteredDeals.length === 0 ? (
                <div className="text-center py-16 m-4 bg-white rounded-xl border border-slate-200 border-dashed">
                  <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900">Nessuna trattativa trovata</h3>
                  <p className="mt-1 text-slate-500">Prova a modificare i filtri o i termini di ricerca.</p>
                </div>
              ) : (
                <div className="min-w-max pb-4 px-4 bg-[#f4f7f9]">
                  <table className="w-full text-left text-sm whitespace-nowrap border-separate" style={{ borderSpacing: '0 12px' }}>
                    <thead className="text-slate-500 sticky top-0 z-20">
                      <tr>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap sticky left-0 z-30 bg-[#f4f7f9]">Trattativa</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#f4f7f9]">Hardware / Software</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#f4f7f9]">Costi e Margini Lavoro</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#f4f7f9]">Ore Lavorate</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-[#f4f7f9]">Contratti</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-right text-slate-400 bg-[#f4f7f9]">Risultato Netto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeals.map((deal) => (
                        <tr
                          key={deal.recordid_}
                          onClick={() => handleRowClick('standard', deal.recordid_, 'deal')}
                          className={`cursor-pointer group`}
                        >
                          <td className={`px-5 py-4 align-top sticky left-0 z-10 bg-white group-hover:bg-indigo-50/40 border-y border-l border-slate-200/80 group-hover:border-indigo-200 rounded-l-xl shadow-sm transition-all duration-200`}>
                            <div className="space-y-1.5 max-w-[300px] truncate">
                              <div className="font-bold text-slate-900 text-base flex items-center gap-2 ">
                                {deal.name || 'Senza Nome'}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold bg-indigo-50 w-fit px-2 py-0.5 rounded border border-indigo-100">
                                <Building2 className="w-3.5 h-3.5" /> {deal.company || 'N/A'}
                              </div>
                              <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500">
                                {deal.status && (
                                  <span className={`flex items-center gap-1.5 w-fit px-2 py-0.5 rounded font-semibold text-[11px] border uppercase tracking-wider ${deal.status === 'Progetto fatturato' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    deal.status === 'Progetto in corso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      ['Credit check', 'Tech validation', 'Ordine materiale'].includes(deal.status) ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        deal.status === 'Chiuso perso' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                          'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}>
                                    <Activity className="w-3 h-3" /> {deal.status}
                                  </span>
                                )}
                                {deal.seller && (
                                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {deal.seller}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top bg-white group-hover:bg-indigo-50/40 border-y border-slate-200/80 group-hover:border-indigo-200 shadow-sm transition-all duration-200 relative">
                            <div className="absolute left-0 inset-y-6 w-px bg-slate-100 group-hover:bg-indigo-100 transition-colors"></div>
                            <div className="flex flex-col gap-2 min-w-[190px]">
                              {/* VENDITA */}
                              <div className="flex justify-between items-center bg-[#e0eaf5]/80 px-3 py-2 rounded-xl border border-blue-100/50">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Vendita</span>
                                <span className="font-mono text-[#002b5e] font-bold text-[14px]">{formatCHF(deal.hw_sales_price)}</span>
                              </div>

                              {/* COSTI E PREVISIONI */}
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[13px] text-slate-500">Costo prev.</span>
                                <span className="font-mono text-[13px] text-slate-600 font-medium">{formatCHF(deal.hw_planned_cost)}</span>
                              </div>
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[13px] text-slate-500">Costo eff.</span>
                                <div className="flex items-center gap-1.5 justify-end">
                                  <span className={`font-mono text-[13px] font-bold ${deal.hw_actual_cost > deal.hw_planned_cost ? "text-rose-600" : "text-slate-800"}`}>{formatCHF(deal.hw_actual_cost)}</span>
                                  {deal.hw_actual_cost - deal.hw_planned_cost !== 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${deal.hw_actual_cost > deal.hw_planned_cost ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                                      {deal.hw_actual_cost > deal.hw_planned_cost ? "+" : ""}{formatCHF(deal.hw_actual_cost - deal.hw_planned_cost)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[13px] text-slate-500">Mrg prev.</span>
                                <span className="font-mono text-[13px] text-slate-600 font-medium">{formatCHF(deal.hw_planned_margin)}</span>
                              </div>

                              {/* MARGINE EFFETTIVO */}
                              {(() => {
                                const margin = deal.hw_actual_margin;
                                const pct = deal.hw_actual_margin_pct;
                                const isPositive = margin >= 0;
                                const bgClass = isPositive ? 'bg-[#e8f5e9]/80' : 'bg-[#ffebee]/80';
                                const textClassLabel = isPositive ? 'text-emerald-700' : 'text-rose-700';
                                const textClassValue = isPositive ? 'text-[#00695c]' : 'text-[#b71c1c]';
                                const borderClass = isPositive ? 'border-emerald-200/50' : 'border-rose-200/50';

                                return (
                                  <div className={`flex justify-between items-center px-3 py-2.5 mt-1 rounded-xl border ${bgClass} ${borderClass}`}>
                                    <div className="flex flex-col leading-tight">
                                      <span className={`text-[10px] font-bold uppercase tracking-widest ${textClassLabel}`}>Margine</span>
                                      <span className={`text-[10px] font-bold uppercase tracking-widest ${textClassLabel}`}>Effettivo</span>
                                    </div>
                                    <div className={`font-mono font-bold text-[14px] text-right ${textClassValue}`}>
                                      <span>{pct.toFixed(1)}% &middot; </span>
                                      <span>{formatCHF(margin)}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top bg-white group-hover:bg-indigo-50/40 border-y border-slate-200/80 group-hover:border-indigo-200 shadow-sm transition-all duration-200 relative">
                            <div className="absolute left-0 inset-y-6 w-px bg-slate-100 group-hover:bg-indigo-100 transition-colors"></div>
                            <div className="flex flex-col gap-2 min-w-[190px]">
                              {/* VENDITA */}
                              <div className="flex justify-between items-center bg-[#e0eaf5]/80 px-3 py-2 rounded-xl border border-blue-100/50">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Vendita</span>
                                <div className="flex items-center gap-1.5 text-right">
                                  {deal.labor_actual_sales > deal.labor_planned_sales ? (
                                    <>
                                      <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase tracking-widest" title="Valore Effettivo maggiore del previsto">Eff.</span>
                                      <span className="font-mono text-[#002b5e] font-bold text-[14px]" title="Vendita Effettiva">{formatCHF(deal.labor_actual_sales)}</span>
                                    </>
                                  ) : (
                                    <span className="font-mono text-[#002b5e] font-bold text-[14px]" title="Vendita Prevista">{formatCHF(deal.labor_planned_sales)}</span>
                                  )}
                                </div>
                              </div>

                              {/* COSTI E PREVISIONI */}
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[13px] text-slate-500">Costo prev.</span>
                                <span className="font-mono text-[13px] text-slate-600 font-medium">{formatCHF(deal.labor_planned_cost)}</span>
                              </div>
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[13px] text-slate-500">Costo eff.</span>
                                <div className="flex items-center gap-1.5 justify-end">
                                  {(() => {
                                    const isFixedPrice = deal.labor_type === 'progetto';
                                    const isExceeded = deal.labor_actual_cost_gross > deal.labor_planned_cost;
                                    const costTextColor = isFixedPrice && isExceeded ? "text-rose-600" : "text-slate-800";
                                    const badgeClass = isFixedPrice
                                      ? (isExceeded ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700")
                                      : "bg-slate-100 text-slate-700";

                                    return (
                                      <>
                                        <span className={`font-mono text-[13px] font-bold ${costTextColor}`}>{formatCHF(deal.labor_actual_cost_gross)}</span>
                                        {deal.labor_actual_cost_gross - deal.labor_planned_cost !== 0 && (
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
                                            {deal.labor_actual_cost_gross > deal.labor_planned_cost ? "+" : ""}{formatCHF(deal.labor_actual_cost_gross - deal.labor_planned_cost)}
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[13px] text-slate-500">Mrg prev.</span>
                                <span className="font-mono text-[13px] text-slate-600 font-medium">{formatCHF(deal.labor_planned_margin)}</span>
                              </div>

                              {/* MARGINE EFFETTIVO */}
                              {(() => {
                                const margin = deal.labor_actual_margin_gross;
                                const pct = deal.labor_actual_margin_gross_pct;
                                const isPositive = margin >= 0;
                                const bgClass = isPositive ? 'bg-[#e8f5e9]/80' : 'bg-[#ffebee]/80';
                                const textClassLabel = isPositive ? 'text-emerald-700' : 'text-rose-700';
                                const textClassValue = isPositive ? 'text-[#00695c]' : 'text-[#b71c1c]';
                                const borderClass = isPositive ? 'border-emerald-200/50' : 'border-rose-200/50';

                                return (
                                  <div className={`flex justify-between items-center px-3 py-2.5 mt-1 rounded-xl border ${bgClass} ${borderClass}`}>
                                    <div className="flex flex-col leading-tight">
                                      <span className={`text-[10px] font-bold uppercase tracking-widest ${textClassLabel}`}>Margine</span>
                                      <span className={`text-[10px] font-bold uppercase tracking-widest ${textClassLabel}`}>Effettivo</span>
                                    </div>
                                    <div className={`font-mono font-bold text-[14px] text-right ${textClassValue}`}>
                                      <span>{pct.toFixed(1)}% &middot; </span>
                                      <span>{formatCHF(margin)}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>



                          <td className="px-5 py-4 align-top bg-white group-hover:bg-indigo-50/40 border-y border-slate-200/80 group-hover:border-indigo-200 shadow-sm transition-all duration-200 relative">
                            <div className="absolute left-0 inset-y-6 w-px bg-slate-100 group-hover:bg-indigo-100 transition-colors"></div>
                            <div className="space-y-1.5 text-xs min-w-[140px]">
                              {deal.labor_type === 'progetto' && (
                                <div className="mb-2.5 flex items-center gap-1.5 w-fit px-2 py-0.5 rounded border border-indigo-200/60 bg-indigo-50/80 text-indigo-700">
                                  <Lock className="w-3 h-3" />
                                  <span className="text-[9px] font-bold uppercase tracking-widest">Fixed Price</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-slate-500">Ore Previste</span>
                                <span className="font-mono text-slate-500">{deal.labor_planned_hours}h</span>
                              </div>
                              <div className="flex justify-between items-center gap-6 relative">
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-500">Ore Usate</span>
                                  <Info 
                                    className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenHoursPopupId(openHoursPopupId === deal.recordid_ ? null : deal.recordid_);
                                    }}
                                  />
                                </div>
                                <div className="text-right">
                                  {(() => {
                                    const isFixedPrice = deal.labor_type === 'progetto';
                                    const isExceeded = deal.labor_actual_hours > deal.labor_planned_hours;
                                    const hoursTextColor = isFixedPrice && isExceeded ? "text-rose-600" : "text-slate-700";
                                    const badgeClass = isFixedPrice ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700";

                                    return (
                                      <>
                                        <span className={`font-mono text-xs font-bold ${hoursTextColor}`}>{deal.labor_actual_hours}h</span>
                                        {isExceeded && (
                                          <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
                                            +{deal.labor_actual_hours - deal.labor_planned_hours}h
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                                
                                {openHoursPopupId === deal.recordid_ && (
                                  <div 
                                    className="absolute top-6 left-0 z-50 w-[220px] bg-white border border-slate-200 shadow-xl rounded-lg p-3 cursor-default"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Distribuzione Ore Usate</span>
                                      <X 
                                        className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenHoursPopupId(null);
                                        }}
                                      />
                                    </div>
                                    <div className="flex justify-between items-center gap-4 mb-1.5">
                                      <span className="text-slate-500 text-[11px]">A Progetto</span>
                                      <span className="font-mono text-slate-500 text-[11px]">{deal.fixedpricehours}h</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 mb-1.5">
                                      <span className="text-slate-500 text-[11px]">Monte Ore</span>
                                      <span className="font-mono text-slate-500 text-[11px]">{deal.bankhours}h</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 mb-1.5">
                                      <span className="text-slate-500 text-[11px]">Scalate</span>
                                      <span className="font-mono text-slate-500 text-[11px]">{deal.deductedhours}h</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 mb-1.5">
                                      <span className="text-slate-500 text-[11px]">Fatturate</span>
                                      <span className="font-mono text-slate-500 text-[11px]">{deal.labor_billed_hours}h</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 mb-1.5">
                                      <span className="text-slate-500 text-[11px]">Da Fatturare</span>
                                      <span className="font-mono text-amber-600 font-medium text-[11px]">{deal.unbilledhours}h</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                      <span className="text-slate-500 text-[11px]">Non Fatturabili</span>
                                      <span className="font-mono text-rose-600 font-medium text-[11px]">{deal.labor_extra_hours}h</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {deal.labor_planned_hours > 0 && (
                                <div className="mt-0.5 mb-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  {(() => {
                                    const isFixedPrice = deal.labor_type === 'progetto';
                                    const isExceeded = deal.labor_actual_hours > deal.labor_planned_hours;
                                    const barColor = isFixedPrice
                                      ? (isExceeded ? 'bg-rose-500' : 'bg-emerald-500')
                                      : 'bg-blue-500';

                                    return (
                                      <div
                                        className={`h-full rounded-full transition-all ${barColor}`}
                                        style={{ width: `${Math.min((deal.labor_actual_hours / deal.labor_planned_hours) * 100, 100)}%` }}
                                      />
                                    );
                                  })()}
                                </div>
                              )}
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-slate-500">Ore Commerciali</span>
                                <span className="font-mono text-slate-500">{deal.saleshours}h</span>
                              </div>
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-slate-500">Ore Viaggio</span>
                                <span className="font-mono text-slate-500">{deal.travelhours}h</span>
                              </div>
                              <div className="flex justify-between items-center gap-6 pt-1 border-t border-slate-100/80 mt-1">
                                <span className="text-slate-700 font-medium">Ore Totali</span>
                                <span className="font-mono text-slate-700 font-bold">{deal.totalhours}h</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top bg-white group-hover:bg-indigo-50/40 border-y border-slate-200/80 group-hover:border-indigo-200 shadow-sm transition-all duration-200 relative">
                            <div className="absolute left-0 inset-y-6 w-px bg-slate-100 group-hover:bg-indigo-100 transition-colors"></div>
                            {(() => {
                              const contractMarginPct = deal.totalcontractvalue > 0 ? (deal.totalcontractnetmargin / deal.totalcontractvalue) * 100 : 0;
                              const isPositive = deal.totalcontractnetmargin >= 0;
                              const badgeBg = isPositive ? 'bg-[#e8f5e9]' : 'bg-[#ffebee]';
                              const badgeText = isPositive ? 'text-[#00695c]' : 'text-[#c62828]';
                              const Icon = isPositive ? TrendingUp : TrendingDown;

                              return (
                                <div className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm min-w-[220px]">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Valore Contr. Tot.</span>
                                    {deal.totalcontractvalue > 0 && (
                                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${badgeBg} ${badgeText}`}>
                                        <Icon className="w-3 h-3" />
                                        <span>{contractMarginPct.toFixed(2)}%</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="font-mono text-[#002b5e] font-bold text-[15px] mb-3">
                                    {formatCHF(deal.totalcontractvalue)}
                                  </div>

                                  <div className="pt-2.5 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Margine Contr. Tot.</span>
                                    <div className={`font-mono font-bold text-[15px] ${isPositive ? 'text-[#00695c]' : 'text-[#c62828]'}`}>
                                      {formatCHF(deal.totalcontractnetmargin)}
                                    </div>
                                    <div className="flex flex-col gap-1 mt-2 text-[11px] text-slate-500">
                                      <span>Canone: {formatCHF(deal.annualprice)}</span>
                                      <span>Margine Annuo: {formatCHF(deal.annualmargin)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          {/* COLONNA RISULTATO NETTO CUSTOM */}
                          {(() => {
                            const pct = deal.total_actual_margin_net_pct;
                            let bgClass, valueClass, barClass, mrgClass;
                            if (pct >= 20) {
                              bgClass = 'bg-emerald-50';
                              valueClass = 'text-emerald-700';
                              barClass = 'bg-emerald-500';
                              mrgClass = 'text-emerald-600';
                            } else if (pct > 0) {
                              bgClass = 'bg-amber-50';
                              valueClass = 'text-amber-700';
                              barClass = 'bg-amber-500';
                              mrgClass = 'text-amber-600';
                            } else {
                              bgClass = 'bg-rose-50';
                              valueClass = 'text-rose-700';
                              barClass = 'bg-rose-500';
                              mrgClass = 'text-rose-600';
                            }

                            return (
                              <td className={`p-5 align-top w-64 border-y border-r border-slate-200/80 group-hover:border-indigo-200 rounded-r-xl shadow-sm transition-all duration-200 relative group-hover:brightness-95 ${bgClass}`}>
                                <div className="absolute left-0 inset-y-6 w-px bg-slate-100 group-hover:bg-indigo-200 transition-colors"></div>
                                <div className="flex flex-col h-full min-w-[180px]">
                                  <div className="flex items-baseline gap-0.5 mb-3">
                                    <span className={`text-[32px] leading-[1.1] font-black tracking-tight ${valueClass}`}>
                                      {pct > 0 && pct < 100 ? pct.toFixed(1) : pct.toFixed(1)}
                                    </span>
                                    <span className={`text-sm font-bold ${valueClass}`}>%</span>
                                  </div>

                                  <div className="h-[5px] w-full bg-slate-200/80 rounded-full mb-5 relative overflow-hidden">
                                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400/40 z-10"></div>
                                    {pct >= 0 ? (
                                      <div
                                        className={`absolute top-0 bottom-0 left-1/2 rounded-r-full ${barClass}`}
                                        style={{ width: `${Math.min(pct, 100) / 2}%` }}
                                      ></div>
                                    ) : (
                                      <div
                                        className={`absolute top-0 bottom-0 right-1/2 rounded-l-full ${barClass}`}
                                        style={{ width: `${Math.min(Math.abs(pct), 100) / 2}%` }}
                                      ></div>
                                    )}
                                  </div>

                                  <div className="space-y-1 mt-auto">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-slate-400 font-bold uppercase tracking-widest">Fatturato</span>
                                      <span className="font-mono text-slate-800 font-bold text-xs">{formatCHF(deal.total_actual_sales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-slate-400 font-bold uppercase tracking-widest">Mrg Netto</span>
                                      <span className={`font-mono font-bold text-xs ${mrgClass}`}>
                                        {deal.total_actual_margin_net < 0 ? "-" : ""}{formatCHF(Math.abs(deal.total_actual_margin_net))}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-slate-400 font-bold uppercase tracking-widest">Mrg Lordo</span>
                                      <span className="font-mono text-slate-500 text-xs">{formatCHF(deal.total_actual_margin_gross)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            );
                          })()}


                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                    className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${response?.pagination.currentPage === 1
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
                      className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 ${response?.pagination.currentPage === 1
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
                        className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 ${response?.pagination.currentPage === response?.pagination.totalPages
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
                    className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${response?.pagination.currentPage === response?.pagination.totalPages
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