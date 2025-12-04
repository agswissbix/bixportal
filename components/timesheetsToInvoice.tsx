import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { Check, Calendar, ChevronDown } from 'lucide-react'; 
import { toast, Toaster } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

const isDev = false;

// --- INTERFACCE ---
interface Timesheet {
    id: string;
    conto: string;
    contoTravel?: string;
    company: string;
    description: string;
    date: Date;
    user: string;
    worktime_decimal: number;
    workprice: number;
    hourprice: number;
    travelprice?: number;
    total_price: number;
}

interface ResponseInterface {
    timesheets: Timesheet[];
}

export default function TimeSheetsToInvoice() {
    const responseDataDEFAULT: ResponseInterface = { timesheets: [] };

    const responseDataDEV: ResponseInterface = {
        timesheets: [
            // --- AZIENDA ALPHA ---
            {
                id: "1",
                conto: "3400",
                company: "Azienda Alpha S.r.l.",
                description: "Sviluppo backend per il modulo di login e gestione permessi utente.",
                date: new Date("2025-06-01"),
                user: "Mario Rossi",
                worktime_decimal: 4.0,
                workprice: 400,
                hourprice: 100,
                travelprice: 0,
                total_price: 400
            },
            {
                id: "2",
                conto: "3400",
                company: "Azienda Alpha S.r.l.",
                description: "Meeting di avanzamento lavori con il team interno e revisione roadmap.",
                date: new Date("2025-06-01"),
                user: "Luigi Bianchi",
                worktime_decimal: 1.5,
                workprice: 150,
                travelprice: 30,
                hourprice: 100,
                total_price: 180
            },
            {
                id: "3",
                conto: "3400",
                company: "Azienda Alpha S.r.l.",
                description: "Deploy in ambiente di staging e smoke test.",
                date: new Date("2025-06-01"),
                user: "Mario Rossi",
                worktime_decimal: 1.0,
                workprice: 100,
                travelprice: 0,
                hourprice: 100,
                total_price: 100
            },
            // --- BETA SOLUTIONS ---
            {
                id: "4",
                conto: "3400",
                company: "Beta Solutions Ltd",
                description: "Consulenza sistemistica per migrazione infrastruttura VMWare. Analisi colli di bottiglia e ottimizzazione storage.",
                date: new Date("2025-06-02"),
                user: "Giulia Verdi",
                worktime_decimal: 8.0,
                workprice: 960,
                travelprice: 0,
                hourprice: 120,
                total_price: 960
            },
            // --- GAMMA SERVICES ---
            {
                id: "5",
                conto: "3400",
                company: "Gamma Services",
                description: "Reset password utente amministrazione.",
                date: new Date("2025-06-04"),
                user: "Francesca Neri",
                worktime_decimal: 0.25,
                workprice: 30,
                travelprice: 0,
                hourprice: 120,
                total_price: 30
            },
            {
                id: "6",
                conto: "3400",
                company: "Gamma Services",
                description: "Configurazione VPN su portatile nuovo dipendente.",
                date: new Date("2025-06-04"),
                user: "Francesca Neri",
                worktime_decimal: 0.5,
                workprice: 60,
                travelprice: 0,
                hourprice: 120,
                total_price: 60
            },
            {
                id: "7",
                conto: "3400",
                company: "Gamma Services",
                description: "Verifica backup notturni falliti (errore disco pieno).",
                date: new Date("2025-06-04"),
                user: "Mario Rossi",
                worktime_decimal: 0.75,
                workprice: 90,
                travelprice: 0,
                hourprice: 120,
                total_price: 90
            },
            // --- DELTA GROUP ---
            {
                id: "8",
                conto: "3400",
                company: "Delta Group SpA",
                description: "Intervento on-site per guasto bloccante server principale. Sostituzione controller RAID, ricostruzione array dischi, ripristino configurazione BIOS e verifica integrità dati post-avvio. Aggiornamento firmware di sicurezza d'urgenza.",
                date: new Date("2025-06-05"),
                user: "Luigi Bianchi",
                worktime_decimal: 5.5,
                workprice: 660,
                travelprice: 50,
                hourprice: 120,
                total_price: 710
            },
            // --- OMEGA & PARTNERS ---
            {
                id: "9",
                conto: "3400",
                company: "Omega & Partners",
                description: "Call conference su Teams.",
                date: new Date("2025-06-06"),
                user: "Giulia Verdi",
                worktime_decimal: 1.0,
                workprice: 120,
                travelprice: 0,
                hourprice: 120,
                total_price: 120
            },
            {
                id: "10",
                conto: "3400",
                company: "Omega & Partners",
                description: "Redazione documentazione tecnica finale.",
                date: new Date("2025-06-06"),
                user: "Giulia Verdi",
                worktime_decimal: 3.0,
                workprice: 360,
                travelprice: 0,
                hourprice: 120,
                total_price: 360
            }
        ]
    };
    
    const { user } = useContext(AppContext);

    const [triggerReload, setTriggerReload] = useState<boolean>(false);
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
    const [dateFilter, setDateFilter] = useState<Date>(new Date());
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [collapsedCompanies, setCollapsedCompanies] = useState<Record<string, boolean>>({});

    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_timesheets_to_invoice',
        };
    }, [triggerReload]);

    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    useEffect(() => {
        setResponseData({ ...responseDataDEV });
    }, []);
    

    const toggleCollapse = (companyName: string) => {
        setCollapsedCompanies(prev => ({
            ...prev,
            [companyName]: !prev[companyName]
        }));
    };

    const handleCompanySelection = (e: React.ChangeEvent<HTMLInputElement>, companyTimesheets: Timesheet[]) => {
        e.stopPropagation(); 
        const isChecked = e.target.checked;
        const idsToToggle = companyTimesheets.map(t => t.id);

        setSelectedIds(prev => {
            if (isChecked) {
                const newIds = [...prev];
                idsToToggle.forEach(id => {
                    if (!newIds.includes(id)) newIds.push(id);
                });
                return newIds;
            } else {
                return prev.filter(id => !idsToToggle.includes(id));
            }
        });
    };

    const groupedTimesheets = useMemo(() => {
        const sortedTimesheets = [...responseData.timesheets].sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        const groups: Record<string, Timesheet[]> = {};
        
        sortedTimesheets.forEach((ts) => {
            const companyName = ts.company || "Senza Azienda";
            if (!groups[companyName]) groups[companyName] = [];
            groups[companyName].push(ts);
        });
        
        return groups;
    }, [responseData.timesheets]);

    const grandTotal = useMemo(() => {
        return responseData.timesheets.reduce((acc, curr) => acc + curr.total_price, 0);
    }, [responseData.timesheets]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('it-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString('it-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.valueAsDate) setDateFilter(e.target.valueAsDate);
    };

    const formattedDateForInput = useMemo(() => dateFilter.toISOString().split('T')[0], [dateFilter]);

    const handleSendToBexio = async () => {
        if (selectedIds.length === 0) {
            console.log("Nessun timesheet selezionato per l'invio.");
            toast.error("Nessun timesheet selezionato per l'invio.");
            return;
        }

        const payloadToSend = {
            invoiceDate: formattedDateForInput,
            selectedTimesheetIds: selectedIds
        };

        await sentToBexio(payloadToSend);
    };

    async function sentToBexio(payloadToSend: { invoiceDate: string; selectedTimesheetIds: string[]; }) {
        try {
            const response = await axiosInstanceClient.post("/postApi",
                { 
                    apiRoute: "upload_timesheet_in_bexio",
                    invoiceDate: payloadToSend.invoiceDate,
                    selectedTimesheets: payloadToSend.selectedTimesheetIds
                  }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` 
                  },
            });

            if (response.status === 200) {
                setSelectedIds([]);
                toast.success("Timesheet inviati con successo a Bexio.");
            } else {
                toast.error("Errore durante l'invio dei timesheet a Bexio.");
            }

            setTriggerReload(prev => !prev);

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <GenericComponent response={responseData} loading={loading} error={error}>
            {(response: ResponseInterface) => (
                <>
                    <Toaster position="top-right" richColors />
                    <section className="bg-gray-50 h-screen flex flex-col font-sans text-slate-700 overflow-hidden">
                        <div className="flex-none bg-gray-50 pt-8 pb-6 shadow-sm z-20 border-b border-gray-200">
                            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Timesheet da Fatturare</h1>
                                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Segna come fatturato in Bixdata
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center w-full md:w-auto">
                                        <div className="flex items-center gap-3">
                                            <label htmlFor="invoice-date" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                                Data Fattura:
                                            </label>
                                            <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-300 flex items-center gap-2 hover:border-teal-500 transition-colors">
                                                <div className="pl-2 text-gray-400">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <input
                                                    id="invoice-date"
                                                    type="date"
                                                    value={formattedDateForInput}
                                                    onChange={handleDateChange}
                                                    className="block w-full text-sm text-gray-700 border-none focus:ring-0 bg-transparent p-1 outline-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={handleSendToBexio}
                                            className="bg-[#164e63] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-[#113a4b] transition-colors shadow-sm whitespace-nowrap active:scale-95 transform duration-150"
                                        >
                                            CARICA IN BEXIO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto scroll-smooth">
                            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
                                
                                <div className="bg-white shadow-lg shadow-slate-200/50 rounded-sm overflow-hidden border border-slate-200 flex flex-col">
                                    
                                    {Object.entries(groupedTimesheets).map(([company, sheets]) => {
                                        const companyTotal = sheets.reduce((acc, curr) => acc + curr.total_price, 0);
                                        const isCollapsed = collapsedCompanies[company];
                                        
                                        const allSelected = sheets.length > 0 && sheets.every(s => selectedIds.includes(s.id));
                                        const someSelected = sheets.some(s => selectedIds.includes(s.id));

                                        return (
                                            <div key={company} className="border-b border-slate-200 last:border-0 transition-all duration-200">
                                                <div 
                                                    className="bg-[#164e63] text-white px-6 py-3 flex justify-between items-center cursor-pointer select-none hover:bg-[#113a4b] transition-colors sticky top-0 z-10"
                                                    onClick={() => toggleCollapse(company)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={allSelected}
                                                                onChange={(e) => handleCompanySelection(e, sheets)}
                                                                className="w-5 h-5 accent-[#164e63] ring-1 ring-white/50 cursor-pointer rounded-sm" 
                                                            />
                                                        </div>
                                                        <h3 className="text-lg font-medium tracking-wide flex items-center gap-2">
                                                            {company}
                                                            {someSelected && !allSelected && <span className="text-xs bg-teal-500 text-white px-1.5 rounded-full">Parziale</span>}
                                                        </h3>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-lg font-bold">{formatCurrency(companyTotal)}</span>
                                                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                                                    </div>
                                                </div>

                                                {!isCollapsed && (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                                            <thead>
                                                                <tr className="bg-[#f1f5f9] text-slate-700 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                                                    <th className="px-6 py-3 w-[10%]">Conto</th>
                                                                    <th className="px-6 py-3 w-[55%]">Descrizione</th>
                                                                    <th className="px-6 py-3 w-[10%] text-right">Quantità</th>
                                                                    <th className="px-6 py-3 w-[12%] text-right">Prezzo</th>
                                                                    <th className="px-6 py-3 w-[13%] text-right">Totale</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-sm">
                                                                {sheets.map((ts) => (
                                                                    <React.Fragment key={ts.id}>
                                                                        <tr className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${selectedIds.includes(ts.id) ? 'bg-blue-50/30' : ''}`}>
                                                                            <td className="px-6 py-4 align-top text-slate-500 font-mono">{ts.conto}</td>
                                                                            <td className="px-6 py-4 align-top">
                                                                                <div className="text-slate-800 mb-1.5 text-base leading-relaxed">
                                                                                    {ts.description}
                                                                                </div>
                                                                                <div className="font-bold text-slate-500 text-xs flex items-center gap-2">
                                                                                    <span>{formatDate(ts.date)}</span>
                                                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                                                    <span className="uppercase tracking-wide">{ts.user}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4 align-top text-right text-slate-600">
                                                                                {ts.worktime_decimal}
                                                                            </td>
                                                                            <td className="px-6 py-4 align-top text-right text-slate-600">
                                                                                {formatCurrency(ts.hourprice)}
                                                                            </td>
                                                                            <td className="px-6 py-4 align-top text-right text-slate-900 font-bold">
                                                                                {formatCurrency(ts.workprice)}
                                                                            </td>
                                                                        </tr>

                                                                        {ts.travelprice && ts.travelprice > 0 ? (
                                                                            <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 bg-slate-50/50">
                                                                                <td className="px-6 py-3 align-top text-slate-500 font-mono">{ts.contoTravel}</td>
                                                                                <td className="px-6 py-3 align-top text-slate-700 italic">
                                                                                    Trasferta
                                                                                </td>
                                                                                <td className="px-6 py-3 align-top text-right text-slate-600"></td>
                                                                                <td className="px-6 py-3 align-top text-right text-slate-600">
                                                                                </td>
                                                                                <td className="px-6 py-3 align-top text-right text-slate-900 font-bold">
                                                                                    {formatCurrency(ts.travelprice)}
                                                                                </td>
                                                                            </tr>
                                                                        ) : null}
                                                                    </React.Fragment>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <div className="bg-slate-100 border-t-2 border-[#164e63] p-6 flex items-center justify-end gap-8 z-20">
                                        <span className="text-[#164e63] font-bold text-lg uppercase tracking-wide">
                                            Totale
                                        </span>
                                        <span className="text-3xl font-bold text-[#164e63]">{formatCurrency(grandTotal)}</span>
                                    </div>
                                    
                                </div> 

                            </div>
                        </div>
                    </section>
                </>

            )}
        </GenericComponent>
    );
};