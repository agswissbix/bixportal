'use client'

import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';
import { AppContext } from '@/context/appContext';
import Link from 'next/link';

// Styling & Icons
import { 
    BriefcaseIcon, 
    ChartBarIcon, 
    UserGroupIcon, 
    Cog6ToothIcon, 
    Squares2X2Icon,
    ArrowRightIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/solid';

// INTERFACCE
interface BixApp {
    name: string;
    url: string;
    logo?: string;
    icon?: string;
    description?: string; // Opzionale: per dare più contesto su Desktop
}

interface User {
    name: string;
}

interface ResponseInterface {
    bixApps: BixApp[],
    user: User
}

export default function BixHub() {
    // FLAG PER LO SVILUPPO
    const isDev = false;

    // DATI DEFAULT
    const responseDataDEFAULT: ResponseInterface = { bixApps: [], user: { name: "" } };

    // DATI DEV
    const responseDataDEV: ResponseInterface = {
        bixApps: [
            { name: "Ordini", url: "/orders", icon: "briefcase", description: "Gestione ordini e commesse" },
            { name: "Analisi", url: "/analytics", icon: "chart", description: "Dashboard e KPI aziendali" },
            { name: "Team", url: "/hr", icon: "users", description: "Rubrica e gestione personale" },
            { name: "Opzioni", url: "/settings", icon: "cog", description: "Impostazioni generali" },
        ],
        user: { name: "Demo" }
    };

    const { user } = useContext(AppContext);
    
    // STATO & API
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

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

    // --- HELPER UI ---
    const getTheme = (index: number) => {
        const themes = [
            { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'group-hover:border-blue-200', gradient: 'from-blue-500/10 to-blue-500/5' },
            { bg: 'bg-violet-50', text: 'text-violet-600', hover: 'group-hover:border-violet-200', gradient: 'from-violet-500/10 to-violet-500/5' },
            { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover:border-emerald-200', gradient: 'from-emerald-500/10 to-emerald-500/5' },
            { bg: 'bg-orange-50', text: 'text-orange-600', hover: 'group-hover:border-orange-200', gradient: 'from-orange-500/10 to-orange-500/5' },
            { bg: 'bg-pink-50', text: 'text-pink-600', hover: 'group-hover:border-pink-200', gradient: 'from-pink-500/10 to-pink-500/5' },
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

    const renderAppCard = (app: BixApp, index: number) => {
        const theme = getTheme(index);

        return (
            <Link 
                href={app.url} 
                key={index}
                className={`
                    group relative flex flex-col justify-between 
                    p-6 h-48 sm:h-56 
                    bg-white rounded-[2rem] border border-zinc-100 
                    shadow-sm hover:shadow-xl transition-all duration-300 
                    active:scale-95 ${theme.hover}
                    overflow-hidden
                `}
            >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[4rem] bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="flex justify-between items-start z-10 w-full">
                    <div className={`p-3.5 rounded-2xl ${theme.bg} ${theme.text} transition-transform group-hover:scale-110 duration-300 flex-shrink-0`}>
                            {app.logo ? (
                            <img src={app.logo} alt={app.name} className="h-7 w-7 object-contain" />
                            ) : (
                            renderNativeIcon(app.icon, "h-7 w-7") 
                            )}
                    </div>
                    
                    <div className={`p-2 rounded-full bg-white/50 backdrop-blur-sm ${theme.text} opacity-0 -translate-y-2 translate-x-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300 shadow-sm`}>
                        <ArrowRightIcon className="h-5 w-5 -rotate-45" />
                    </div>
                </div>

                <div className="z-10 mt-2">
                    {app.name === "Ordini" && (
                        <span className="inline-flex mb-2 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider border border-red-100">
                            3 Novità
                        </span>
                    )}

                    <h3 className={`
                        font-bold text-zinc-800 leading-tight group-hover:text-zinc-900
                        /* Mobile: testo leggermente più piccolo per far stare parole lunghe */
                        text-lg sm:text-xl 
                        /* Gestione a capo */
                        break-words hyphens-auto
                        /* Limite righe (opzionale, per sicurezza) */
                        line-clamp-3
                    `}>
                        {app.name}
                    </h3>
                </div>
            </Link>
        );
    };

    const renderAppListItem = (app: BixApp, index: number) => {
        const theme = getTheme(index);

        return (
            <Link 
                href={app.url} 
                key={index}
                className={`
                    group relative flex items-center gap-5
                    p-5 w-full
                    bg-white rounded-2xl border border-zinc-100 
                    shadow-sm hover:shadow-md transition-all duration-200 
                    active:scale-[0.98]
                    overflow-hidden
                `}
            >
                <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className={`
                    flex-shrink-0 flex items-center justify-center
                    w-14 h-14 rounded-xl 
                    ${theme.bg} ${theme.text} 
                    shadow-sm ring-1 ring-black/5
                    transition-transform group-hover:scale-110 duration-300
                `}>
                     {app.logo ? (
                        <img src={app.logo} alt={app.name} className="h-8 w-8 object-contain" />
                     ) : (
                        renderNativeIcon(app.icon, "h-7 w-7") 
                     )}
                </div>

                <div className="flex-1 min-w-0 z-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <h3 className="text-md font-bold text-zinc-900 pr-2">
                            {app.name}
                        </h3>
                    </div>
                </div>

                <div className="flex-shrink-0 z-10 pl-2">
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        text-zinc-300 group-hover:text-blue-600 group-hover:bg-blue-50
                        transition-colors duration-200
                    `}>
                        <ArrowRightIcon className="h-5 w-5" />
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <GenericComponent response={responseData} loading={loading} error={error}>
            {(dataResponse: ResponseInterface) => {
                const safeResponse = dataResponse || responseData; 
                const apps = safeResponse.bixApps || [];

                const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

                return (
                    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden selection:bg-blue-100">
                        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-white to-transparent pointer-events-none" />
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply" />
                        <div className="absolute top-24 -left-24 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply" />

                        <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 md:py-16 lg:px-12">
                            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
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

                            {apps.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                    {apps.map((app, index) => renderAppListItem(app, index))}
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
                                    <p className="text-zinc-400 font-medium">Nessuna app disponibile</p>
                                </div>
                            )}

                        </main>
                    </div>
                );
            }}
        </GenericComponent>
    );
};