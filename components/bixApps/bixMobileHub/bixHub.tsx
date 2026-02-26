'use client'

import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';
import { AppContext } from '@/context/appContext';
import Link from 'next/link';

// 1. IMPORTIAMO L'HOOK DEL DISPATCHER
import { useFrontendFunctions } from "@/lib/functionsDispatcher";

// Styling & Icons
import { 
    BriefcaseIcon, 
    ChartBarIcon, 
    UserGroupIcon, 
    Cog6ToothIcon, 
    Squares2X2Icon,
    ArrowRightIcon,
    CalendarDaysIcon,
    BuildingOfficeIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    ChevronDownIcon
} from '@heroicons/react/24/solid';
import { Computer, Laptop } from 'lucide-react';

// INTERFACCE
interface BixApp {
    id: string;
    name: string;
    url: string;
    logo?: string;
    icon?: string;
    description?: string;
    
    // Campi tecnici per la funzione
    function?: string; 
    params?: any;
    [key: string]: any; 
}

interface TimesheetItem {
    id: string;
    date: string;
    company: string;
    is_signed?: boolean;
}

interface User {
    name: string;
}

interface LenovoTicketItem {
    id: string;
    name: string;
    surname: string;
    company: string;
    status: string;
    date: string;
    problem_description?: string;
}

interface ResponseInterface {
    bixApps: BixApp[];
    timesheets?: TimesheetItem[];
    closedTimesheets?: TimesheetItem[];
    lenovoTickets?: LenovoTicketItem[];
    user: User;
    timesheet_fn?: BixApp;
    lenovo_fn?: BixApp;
}

export default function BixHub() {
    // 2. ISTANZIAMO LE FUNZIONI FRONTEND
    const frontendFunctions = useFrontendFunctions();

    const isDev = false;
    const responseDataDEFAULT: ResponseInterface = { bixApps: [], timesheets: [], user: { name: "" } };

    // DATI MOCK (Dev)
    const responseDataDEV: ResponseInterface = {
        bixApps: [
            { 
                id: "1", name: "Timesheet", url: "/timesheet", icon: "clock", 
                function: "open_timesheet_detail", // Esempio di nome funzione
                params: {} 
            },
            { id: "2", name: "Ordini", url: "/orders", icon: "briefcase" },
        ],
        timesheets: [
            { id: "101", date: "2024-03-20", company: "Acme Corp" },
            { id: "102", date: "2024-03-19", company: "Wayne Ent" },
        ],
        user: { name: "Demo" }
    };

    const { user } = useContext(AppContext);
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );
    const [showHistory, setShowHistory] = useState(false);

    const payload = useMemo(() => {
        if (isDev) return null;
        return { apiRoute: "get_bixhub_initial_data" };
    }, []);

    const apiResult = useApi<ResponseInterface>(payload);

    const { response, loading, error } = 
        !isDev && payload 
            ? apiResult 
            : { response: null, loading: false, error: null };

    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    useEffect(() => {
        if (isDev) setResponseData({ ...responseDataDEV });
    }, []);

    const handleTimesheetClick = async (appObj: BixApp, recordId: string) => {
        console.log("CLICK RILEVATO!");
        console.log("App Object:", appObj);
        console.log("Record ID:", recordId);

        if (!appObj.function) {
            console.error("ERRORE: Nessun nome funzione definito nell'oggetto app (appObj.function è vuoto)");
            return;
        }

        const funcToExecute = frontendFunctions[appObj.function];

        if (funcToExecute) {
            try {
                console.log(`Tentativo esecuzione: ${appObj.function}`);
                await funcToExecute({ 
                    ...appObj.params, 
                    recordid: recordId 
                });
                console.log("Esecuzione completata");
            } catch (err) {
                console.error("Eccezione durante esecuzione:", err);
            }
        } else {
            console.error(`ERRORE FATALE: La funzione '${appObj.function}' non esiste in frontendFunctions! Controlla functionsDispatcher.ts`);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
        } catch (e) {
            return dateString;
        }
    };

    const getTheme = (index: number) => {
        const themes = [
            { bg: 'bg-blue-50', text: 'text-blue-600', gradient: 'from-blue-500/10 to-blue-500/5' },
            { bg: 'bg-violet-50', text: 'text-violet-600', gradient: 'from-violet-500/10 to-violet-500/5' },
            { bg: 'bg-emerald-50', text: 'text-emerald-600', gradient: 'from-emerald-500/10 to-emerald-500/5' },
            { bg: 'bg-orange-50', text: 'text-orange-600', gradient: 'from-orange-500/10 to-orange-500/5' },
            { bg: 'bg-pink-50', text: 'text-pink-600', gradient: 'from-pink-500/10 to-pink-500/5' },
        ];
        return themes[index % themes.length];
    };

    const renderNativeIcon = (iconName?: string, className = "h-6 w-6") => {
        switch (iconName) {
            case 'briefcase': return <BriefcaseIcon className={className} />;
            case 'chart': return <ChartBarIcon className={className} />;
            case 'users': return <UserGroupIcon className={className} />;
            case 'cog': return <Cog6ToothIcon className={className} />;
            default: return <Squares2X2Icon className={className} />;
        }
    };

    const getStatusTheme = (status: string) => {
        const lower = status.toLowerCase();
        
        switch (lower) {
            case 'presa in consegna':
                return {
                    bg: 'bg-emerald-50/50',
                    text: 'text-emerald-700',
                    border: 'border-emerald-200/50',
                    icon: 'text-emerald-500',
                    borderGroup: 'group-open:border-emerald-200/50'
                };
            case 'diagnostica':
                return {
                    bg: 'bg-violet-100/50',
                    text: 'text-violet-700',
                    border: 'border-violet-300/50',
                    icon: 'text-violet-500',
                    borderGroup: 'group-open:border-violet-300/50'
                };
            case 'attesa tecnico':
                return {
                    bg: 'bg-amber-50/50',
                    text: 'text-amber-700',
                    border: 'border-amber-200/50',
                    icon: 'text-amber-500',
                    borderGroup: 'group-open:border-amber-200/50'
                };
            case 'riparazione in corso':
                return {
                    bg: 'bg-blue-100/50',
                    text: 'text-blue-700',
                    border: 'border-blue-300/50',
                    icon: 'text-blue-500',
                    borderGroup: 'group-open:border-blue-300/50'
                };
            case 'riconsegnato':
            case 'attesa componenti':
                return {
                    bg: 'bg-orange-50/50',
                    text: 'text-orange-700',
                    border: 'border-orange-200/50',
                    icon: 'text-orange-500',
                    borderGroup: 'group-open:border-orange-200/50'
                };
        }
    };

    return (
        <GenericComponent response={responseData} loading={loading} error={error}>
            {(dataResponse: ResponseInterface) => {
                const safeResponse = dataResponse || responseData; 
                const apps = safeResponse.bixApps || [];
                const timesheets = safeResponse.timesheets || [];
                const closedTimesheets = safeResponse.closedTimesheets || [];
                const lenovoTickets = safeResponse.lenovoTickets || [];

                const timesheetApp = safeResponse.timesheet_fn;
                const lenovoApp = safeResponse.lenovo_fn;

                // Group lenovo tickets by status
                const groupedLenovoTickets = lenovoTickets.reduce((acc, ticket) => {
                    if (!acc[ticket.status]) {
                        acc[ticket.status] = [];
                    }
                    acc[ticket.status].push(ticket);
                    return acc;
                }, {} as Record<string, LenovoTicketItem[]>);

                const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

                return (
                    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden selection:bg-blue-100 pb-10">
                        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-white to-transparent pointer-events-none" />
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply" />
                        <div className="absolute top-24 -left-24 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply" />

                        <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 md:py-16 lg:px-12">
                            
                            {/* HEADER */}
                            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                                <div>
                                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        BixData Mobile Hub
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
                                        Ciao, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{safeResponse.user?.name || 'Guest'}</span>
                                    </h1>
                                </div>

                                <div className="hidden md:flex items-center gap-3 bg-white/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/50 shadow-sm">
                                    <CalendarDaysIcon className="h-6 w-6 text-zinc-400" />
                                    <span className="text-zinc-600 font-semibold capitalize">{today}</span>
                                </div>
                            </header>

                            {/* APPS GRID */}
                            <div className="mb-8 w-full">
                                <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                                    <Squares2X2Icon className="w-5 h-5 text-zinc-400" /> Applicazioni
                                </h2>
                                {apps.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                            {apps.map((app, index) => {
                                                 const theme = getTheme(index);
                                                 return (
                                                    <Link 
                                                        href={app.url} 
                                                        key={index}
                                                        className={`
                                                            group relative flex items-center gap-5 p-5 w-full bg-white rounded-2xl border border-zinc-100 
                                                            shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] overflow-hidden
                                                        `}
                                                    >
                                                        <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                                        <div className={`flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-xl ${theme.bg} ${theme.text} shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-110 duration-300`}>
                                                            {app.logo ? <img src={app.logo} alt={app.name} className="h-8 w-8 object-contain" /> : renderNativeIcon(app.icon, "h-7 w-7")}
                                                        </div>
                                                        <div className="flex-1 min-w-0 z-10 flex flex-col justify-center">
                                                            <h3 className="text-md font-bold text-zinc-900 pr-2">{app.name}</h3>
                                                            {app.description && <p className="text-xs text-zinc-500 truncate mt-0.5">{app.description}</p>}
                                                        </div>
                                                        <div className="flex-shrink-0 z-10 pl-2">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors duration-200`}>
                                                                <ArrowRightIcon className="h-5 w-5" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
                                            <p className="text-zinc-400 font-medium">Nessuna app disponibile</p>
                                        </div>
                                    )}
                            </div>

                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                
                                {/* TIMESHEETS */}
                                <div className="w-full lg:w-1/2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                    <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                                        <ExclamationCircleIcon className="w-5 h-5 text-amber-500" /> Timesheets Da Completare
                                    </h2>
                                    
                                    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                                        {timesheets.length > 0 ? (
                                            <div className="divide-y divide-zinc-100">
                                                {timesheets.map((ts) => (
                                                    <div 
                                                        key={ts.id}
                                                        onClick={() => {
                                                            if (timesheetApp) {
                                                                handleTimesheetClick(timesheetApp, ts.id);
                                                            }
                                                        }}
                                                        className="group flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                                                                <BuildingOfficeIcon className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex flex-col truncate">
                                                                <span className="text-sm font-bold text-zinc-700 group-hover:text-amber-700 transition-colors truncate">
                                                                    {ts.company}
                                                                </span>
                                                                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Timesheet Incompleto</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end shrink-0 pl-2">
                                                            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                {formatDate(ts.date)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                                                <CheckCircleIcon className="w-12 h-12 text-emerald-100" />
                                                <p className="text-zinc-400 text-sm font-medium">Tutto completato!</p>
                                            </div>
                                        )}
                                        
                                        {timesheetApp && (
                                            <div className="bg-zinc-50 border-t border-zinc-100 hover:bg-zinc-100 transition-colors text-center">
                                                 <button 
                                                    onClick={() => setShowHistory(!showHistory)}
                                                    className="p-3 w-full h-full text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                                                 >
                                                    {showHistory ? "Nascondi storico" : "Vedi storico completo"}
                                                 </button>
                                            </div>
                                        )}

                                        {showHistory && closedTimesheets.length > 0 && (
                                            <div className="border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="bg-emerald-50/50 p-2 text-xs font-bold text-emerald-700 uppercase tracking-wider text-center border-b border-emerald-100/50">
                                                    Ultimi completati
                                                </div>
                                                <div className="divide-y divide-zinc-100">
                                                    {closedTimesheets.map((ts) => (
                                                        <div 
                                                            key={ts.id}
                                                            onClick={() => {
                                                                if (timesheetApp) {
                                                                    handleTimesheetClick(timesheetApp, ts.id);
                                                                }
                                                            }}
                                                            className="group flex items-center justify-between p-4 hover:bg-emerald-50 transition-colors cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                                                                    <CheckCircleIcon className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex flex-col truncate">
                                                                    <span className="text-sm font-bold text-zinc-700 group-hover:text-emerald-800 transition-colors truncate">
                                                                        {ts.company}
                                                                    </span>
                                                                    <span className="text-[10px] text-emerald-600/70 font-medium uppercase tracking-wider">Completato</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end shrink-0 pl-2 gap-1">
                                                                {!ts.is_signed && (
                                                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                                                                        Da Firmare
                                                                    </span>
                                                                )}
                                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                    {formatDate(ts.date)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* LENOVO TICKETS */}
                                {lenovoTickets.length > 0 && (
                                    <div className="w-full lg:w-1/2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                        <h2 className="text-lg font-bold text-zinc-800 mb-4 flex items-center gap-2">
                                            <Laptop className="w-5 h-5 text-blue-500" /> Ticket Lenovo in Sospeso
                                        </h2>
                                        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                                            {Object.entries(groupedLenovoTickets).map(([status, tickets], groupIndex) => {
                                                const theme = getStatusTheme(status);
                                                return (
                                                    <LenovoStatusGroup
                                                        key={status}
                                                        status={status}
                                                        tickets={tickets}
                                                        theme={theme}
                                                        lenovoApp={lenovoApp}
                                                        handleTimesheetClick={handleTimesheetClick}
                                                        formatDate={formatDate}
                                                        isLast={groupIndex === Object.entries(groupedLenovoTickets).length - 1}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </main>
                    </div>
                );
            }}
        </GenericComponent>
    );
};

function LenovoStatusGroup({ status, tickets, theme, lenovoApp, handleTimesheetClick, formatDate, isLast }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`${!isLast ? 'border-b border-zinc-100' : ''}`}>
            {/* Header gruppo status */}
            <button
                onClick={() => setOpen(!open)}
                className={`
                    w-full flex items-center justify-between px-4 py-3
                    ${open ? theme.bg : 'hover:bg-zinc-50'}
                    transition-colors duration-200
                `}
            >
                <div className="flex items-center gap-2.5">
                    {/* Dot colorato */}
                    <span className={`w-2 h-2 rounded-full ${theme.dot} shrink-0`} />
                    <span className={`text-sm font-bold ${open ? theme.text : 'text-zinc-600'} uppercase tracking-wider transition-colors`}>
                        {status}
                    </span>
                    {/* Badge count */}
                    <span className={`
                        text-[10px] font-black px-1.5 py-0.5 rounded-full
                        ${open ? `${theme.badgeBg} ${theme.text}` : 'bg-zinc-100 text-zinc-500'}
                        transition-colors duration-200
                    `}>
                        {tickets.length}
                    </span>
                </div>
                <ChevronDownIcon className={`
                    w-4 h-4 ${open ? theme.icon : 'text-zinc-400'}
                    transition-transform duration-300 ${open ? 'rotate-180' : ''}
                `} />
            </button>

            {/* Lista tickets */}
            <div className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
            `}>
                <div className="divide-y divide-zinc-50">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => lenovoApp && handleTimesheetClick(lenovoApp, ticket.id)}
                            className="group/item flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer"
                        >
                            {/* Icona */}
                            <div className={`
                                w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                ${theme.bg} ${theme.icon}
                                border ${theme.border}
                                group-hover/item:scale-110 transition-transform duration-200
                            `}>
                                <Computer className="w-4 h-4" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-bold text-zinc-700 group-hover/item:${theme.text} transition-colors truncate`}>
                                    {
                                        ticket.company
                                            ? `${ticket.company}${
                                                ticket.name || ticket.surname
                                                    ? ` - ${[ticket.name, ticket.surname].filter(Boolean).join(" ")}`
                                                    : ""
                                            }`
                                            : [ticket.name, ticket.surname].filter(Boolean).join(" ")
                                    }
                                </div>
                                {ticket.problem_description && (
                                    <div className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                                        {ticket.problem_description}
                                    </div>
                                )}
                            </div>

                            {/* Data */}
                            <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-lg shrink-0 group-hover/item:bg-white group-hover/item:shadow-sm transition-all border border-zinc-100">
                                {formatDate(ticket.date)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}