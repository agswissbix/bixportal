'use client'

import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent'
import { AppContext } from '@/context/appContext';
import { 
    PlusCircleIcon, 
    StopCircleIcon, 
    XMarkIcon, 
    ClockIcon, 
    ExclamationTriangleIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import WidgetBattery from './widgetBattery';
import { set } from 'lodash';
import { se } from 'date-fns/locale';

const MINUTES_PER_HOUR = 60;
const DAILY_GOAL_HOURS = 8.0;
const LUNCH_BREAK_START = 12; // 12:00
const LUNCH_BREAK_END = 13;   // 13:00

// INTERFACCE
interface Timetracking {
    id: string;
    description: string;
    date: Date;
    start: string; 
    end: string;
    worktime: number;
    worktime_string: string;
    status: string; // "Attivo" | "Terminato"
    clientid?: string;
    client_name?: string;
}

interface Client {
    id: string;
    companyname: string;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
    timetracking: Timetracking[];
    clients: Client[];
}

export default function TimetrackingList() {
    // FLAG PER LO SVILUPPO
    const isDev = false;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        timetracking: [],
        clients: []
    };

    // DATI RESPONSE PER LO SVILUPPO 
    const responseDataDEV: ResponseInterface = {
        timetracking: [
            {
                id: '1',
                description: 'Sviluppo Backend API',
                date: new Date(),
                start: '08:00',
                end: '12:00',
                worktime: 4.0,
                worktime_string: '04:00',
                status: 'Terminato',
            },
            {
                id: '2',
                description: 'Meeting con il team',
                date: new Date(),
                start: '13:00',
                end: '', 
                worktime: 0,
                worktime_string: '00:00',
                status: 'Attivo',
            }
        ],
        clients: [
            {
                id: 'c1',
                companyname: 'Azienda Alpha'
            },
            {
                id: 'c2',
                companyname: 'Beta Solutions'
            },
            {
                id: 'c3',
                companyname: 'Gamma Corp'
            },
            {
                id: 'c4',
                companyname: 'Delta Inc'
            }
        ]
    };

    // DATI DEL CONTESTO
    const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
    
    // STATO PER IL TEMPO CORRENTE
    const [now, setNow] = useState(new Date());
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // STATO PER LA MODALE DI AGGIUNTA
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const [selectedClientId, setSelectedClientId] = useState("");

    // STATO DI RICERCA
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // PAYLOAD
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_timetracking',
            _t: refreshTrigger
        };
    }, [refreshTrigger]);

    // CHIAMATA AL BACKEND
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    // PER DEVELOPMENT 
    useEffect(() => {
        if (isDev) setResponseData({ ...responseData });
    }, []);

    // TIMER EFFECT
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const activeTrack = useMemo(() => {
        return responseData.timetracking.find(t => t.status === 'Attivo');
    }, [responseData.timetracking]);

    const finishedTracks = useMemo(() => {
        return responseData.timetracking
            .filter(t => t.status !== 'Attivo')
            .sort((a, b) => b.start.localeCompare(a.start));
    }, [responseData.timetracking]);

    const filteredClients = useMemo(() => {
        if (!searchQuery.trim()) return responseData.clients;
        return responseData.clients.filter((client) =>
            client.companyname.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [responseData.clients, searchQuery]);

    // HELPERS
    const getDynamicDuration = (startTime: string): string => {
        if (!startTime) return "00:00";
        
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(startHours, startMinutes, 0, 0);
        
        let diffMs = now.getTime() - startDate.getTime();
        if (diffMs < 0) diffMs = 0;

        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60; 

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const calculateTotalHoursNumeric = (timetracking: Timetracking[]): number => {
        let totalMinutesSum = 0;

        for (const time of timetracking) {
            if (!time.start) continue;

            let endHours, endMinutes;

            if (time.status === 'Attivo') {
                endHours = now.getHours();
                endMinutes = now.getMinutes();
            } else if (time.end) {
                [endHours, endMinutes] = time.end.split(':').map(Number);
            } else {
                continue; 
            }

            const [startHours, startMinutes] = time.start.split(':').map(Number);

            const startTotalMinutes = (startHours * MINUTES_PER_HOUR) + startMinutes;
            const endTotalMinutes = (endHours * MINUTES_PER_HOUR) + endMinutes;

            let diff = endTotalMinutes - startTotalMinutes;
            if (diff < 0) diff += 24 * 60; 

            totalMinutesSum += diff;
        }

        return totalMinutesSum / MINUTES_PER_HOUR;
    }

    const totalWorkedHoursString = (numericHours: number) => {
        const hours = Math.floor(numericHours);
        const minutes = Math.round((numericHours - hours) * 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }   

    const handleStopActivity = async (timetracking: Timetracking) => {
        console.log("Stopping timetracking:", timetracking.id);
                
        if (isDev) {
            const updatedList = responseData.timetracking.map(t => {
                if (t.id === timetracking.id) {
                    const currentHours = String(now.getHours()).padStart(2, '0');
                    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
                    return {
                        ...t,
                        status: 'Terminato',
                        end: `${currentHours}:${currentMinutes}`,
                    };
                }
                return t;
            });
            setResponseData({ ...responseData, timetracking: updatedList });
        } else {
            try {
                const response = await axiosInstanceClient.post(
                    "/postApi",
                    {
                        apiRoute: "stop_timetracking",
                        timetracking: timetracking.id
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                    }
                );

                if (!response.data.success) {
                    toast.error("Errore nel fermare il tracking");
                } else {
                    toast.success("Tracking fermato correttamente!");
                }
            } catch (e) {
                console.error("Errore nel fermare il tracking:" + e);
            }
        }
        setRefreshTrigger(prev => prev + 1);
    };

    const saveTimetracking = async (description: string, clientid?: string) => {
        try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "save_timetracking",
                    description: description,
                    clientid: clientid || '',
                }, 
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                }
            );

            if (!response.data.success) {
                toast.error("Errore nell'avviare il tracking");
            } else {
                toast.success("Il timetracking è stato avviato correttamente!");
            }

        } catch (e) {
            console.error("Errore nell'iniziare il timetracking:" + e);
        }
        
        setRefreshTrigger(prev => prev + 1);
    }

    const openModal = () => {
        setNewDescription('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewDescription('');
        setSelectedClientId("");
        setSearchQuery("");
        setIsDropdownOpen(false);
    };

    const submitNewTracking = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!newDescription.trim()) {
            toast.error("Inserisci una descrizione");
            return;
        }

        if (activeTrack) {
            await handleStopActivity(activeTrack);
        }

        await saveTimetracking(newDescription, selectedClientId);
        closeModal();
    };

    const numericWorkedHours = calculateTotalHoursNumeric(response?.timetracking || []);
    const remainingHours = Math.max(0, DAILY_GOAL_HOURS - numericWorkedHours);
    
    const estimatedFinishDate = new Date(now.getTime() + (remainingHours * 60 * 60 * 1000));
    const estimatedFinishString = `${String(estimatedFinishDate.getHours()).padStart(2, '0')}:${String(estimatedFinishDate.getMinutes()).padStart(2, '0')}`;

    const currentHour = now.getHours();
    const isLunchTime = currentHour >= LUNCH_BREAK_START && currentHour < LUNCH_BREAK_END;
    const isOvertime = numericWorkedHours > DAILY_GOAL_HOURS;

    return (
        <GenericComponent
            response={responseData}
            loading={loading}
            error={error}>
            {(response: ResponseInterface) => (
                <section
                    id="timesheets"
                    className="py-12 md:py-16 relative">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-4xl md:text-4xl font-semibold text-gray-800 mb-4 text-center">
                            Timetracking
                        </h1>
                        <p className="text-center text-gray-600 mb-8">
                            Tracking giornaliero
                        </p>
                    </div>

                    <div className="flex-1 w-full max-w-6xl mx-auto px-4 min-h-0 pb-2 mt-8">
                        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
                            <div className="flex-1 p-4">
                                {activeTrack ? (
                                    <div
                                        className={`p-4 rounded-lg border transition-all shadow-sm ${
                                            isLunchTime
                                                ? "border-amber-200 bg-amber-50"
                                                : "border-green-200 bg-green-50"
                                        }`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">
                                                    {activeTrack.description}
                                                </span>
                                                {activeTrack.client_name && (
                                                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">
                                                        {
                                                            activeTrack.client_name
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() =>
                                                    handleStopActivity(
                                                        activeTrack
                                                    )
                                                }
                                                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer group"
                                                title="Ferma tracking">
                                                <StopCircleIcon className="w-4 h-4 animate-pulse group-hover:animate-none" />
                                                <span className="text-xs font-bold uppercase">
                                                    Stop
                                                </span>
                                            </button>
                                        </div>

                                        <div className="flex justify-between text-sm text-gray-500 mt-2 items-end">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400">
                                                    Inizio
                                                </span>
                                                <span>{activeTrack.start}</span>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-gray-400">
                                                    Durata Attuale
                                                </span>
                                                <span
                                                    className={`font-mono text-2xl font-bold ${
                                                        isLunchTime
                                                            ? "text-amber-600"
                                                            : "text-green-600"
                                                    }`}>
                                                    {getDynamicDuration(
                                                        activeTrack.start
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        {isLunchTime && (
                                            <div className="mt-2 text-xs text-amber-700 text-right">
                                                * Attività in corso durante la
                                                pausa pranzo
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <p className="text-gray-400">
                                            Nessuna attività in corso al
                                            momento.
                                        </p>
                                        {isLunchTime ? (
                                            <p className="text-sm text-green-600 mt-1 font-medium">
                                                Buon appetito! 🥪
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 mt-1">
                                                Premi il pulsante + per
                                                iniziare.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-6xl mx-auto px-4 min-h-0 pb-2 mt-8">
                        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
                            {isLunchTime && activeTrack && (
                                <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center justify-center space-x-2 text-amber-700 animate-pulse">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    <span className="font-medium">
                                        Attenzione: È ora di pranzo (12:00 -
                                        13:00). Metti in pausa!
                                    </span>
                                </div>
                            )}

                            <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0 flex justify-between items-center">
                                <h3 className="font-medium text-gray-700">
                                    Riepilogo Oggi
                                </h3>
                                <span
                                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                                        isOvertime
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-green-100 text-green-700"
                                    }`}>
                                    {isOvertime ? "STRAORDINARI" : "STANDARD"}
                                </span>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 h-full">
                                    <span className="text-sm text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                        Ore Lavorate
                                    </span>
                                    <span
                                        className={`text-4xl font-bold font-mono ${
                                            isOvertime
                                                ? "text-purple-600"
                                                : "text-green-600"
                                        }`}>
                                        {totalWorkedHoursString(
                                            numericWorkedHours
                                        )}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        su {DAILY_GOAL_HOURS}h previste
                                    </span>
                                </div>

                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">
                                        Carico Lavoro
                                    </span>
                                    <WidgetBattery
                                        customHours={numericWorkedHours}
                                        cleanView={true}
                                        isLunchTime={isLunchTime}
                                    />
                                </div>

                                <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl border border-blue-100 h-full">
                                    <span className="text-sm text-blue-500 mb-1 font-medium uppercase tracking-wide">
                                        Stima Uscita
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <ClockIcon className="w-6 h-6 text-blue-400" />
                                        <span className="text-3xl font-bold font-mono text-blue-700">
                                            {isOvertime
                                                ? "Adesso"
                                                : estimatedFinishString}
                                        </span>
                                    </div>
                                    <span className="text-xs text-blue-400 mt-1">
                                        {isOvertime
                                            ? "Hai raggiunto l'obiettivo"
                                            : `Mancano ${totalWorkedHoursString(
                                                  remainingHours
                                              )} ore`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-6xl mx-auto px-4 min-h-0 pb-24 mt-8">
                        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
                                <h3 className="font-medium text-gray-700">
                                    Timetracker terminati oggi
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {finishedTracks.length > 0 ? (
                                    finishedTracks.map((track, i) => (
                                        <div
                                            key={track.id || i}
                                            className="p-4 rounded-lg border transition-all border-gray-200 hover:bg-gray-50">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-800">
                                                        {
                                                            activeTrack.description
                                                        }
                                                    </span>
                                                    {activeTrack.client_name && (
                                                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">
                                                            {
                                                                activeTrack.client_name
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                                    {track.status}
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm text-gray-500 mt-2 items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400">
                                                        Orario
                                                    </span>
                                                    <span>
                                                        {track.start} -{" "}
                                                        {track.end}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-gray-400">
                                                        Durata
                                                    </span>
                                                    <span className="font-mono font-medium text-gray-700">
                                                        {track.worktime_string}{" "}
                                                        h
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400 py-4">
                                        Nessun'altra attività registrata oggi.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {isModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible animate-in fade-in zoom-in duration-200">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="font-semibold text-gray-800">
                                        Nuovo Tracking
                                    </h3>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <form
                                    onSubmit={submitNewTracking}
                                    className="p-6">
                                    <div className="mb-6">
                                        <label
                                            htmlFor="description"
                                            className="block text-sm font-medium text-gray-700 mb-2">
                                            Descrizione attività
                                        </label>
                                        <input
                                            type="text"
                                            id="description"
                                            autoFocus
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                            placeholder="Es: Sviluppo Homepage..."
                                            value={newDescription}
                                            onChange={(e) =>
                                                setNewDescription(
                                                    e.target.value
                                                )
                                            }
                                        />
                                        {activeTrack && (
                                            <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                Nota: L'attività attuale "
                                                {activeTrack.description}" verrà
                                                terminata automaticamente.
                                            </p>
                                        )}
                                        {isLunchTime && (
                                            <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center">
                                                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                                Stai iniziando un'attività
                                                durante la pausa pranzo
                                                (12:00-13:00).
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-6 relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cliente (opzionale)
                                        </label>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-200 outline-none bg-white cursor-text"
                                                placeholder={
                                                    selectedClientId
                                                        ? responseData.clients.find(
                                                              (c) =>
                                                                  c.id ===
                                                                  selectedClientId
                                                          )?.companyname
                                                        : "Cerca e seleziona un cliente..."
                                                }
                                                value={searchQuery}
                                                onFocus={() =>
                                                    setIsDropdownOpen(true)
                                                }
                                                onChange={(e) => {
                                                    setSearchQuery(
                                                        e.target.value
                                                    );
                                                    setIsDropdownOpen(true);
                                                }}
                                            />
                                            <MagnifyingGlassIcon className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>

                                        {/* Dropdown posizionato sopra a tutto */}
                                        {isDropdownOpen && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto overscroll-contain">
                                                <div
                                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-400 border-b border-gray-100 italic"
                                                    onClick={() => {
                                                        setSelectedClientId("");
                                                        setSearchQuery("");
                                                        setIsDropdownOpen(
                                                            false
                                                        );
                                                    }}>
                                                    Nessuno
                                                </div>
                                                {filteredClients.length > 0 ? (
                                                    filteredClients.map(
                                                        (client) => (
                                                            <div
                                                                key={client.id}
                                                                className="px-4 py-3 hover:bg-green-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-50 last:border-0"
                                                                onClick={() => {
                                                                    setSelectedClientId(
                                                                        client.id
                                                                    );
                                                                    setSearchQuery(
                                                                        client.companyname
                                                                    );
                                                                    setIsDropdownOpen(
                                                                        false
                                                                    );
                                                                }}>
                                                                {
                                                                    client.companyname
                                                                }
                                                            </div>
                                                        )
                                                    )
                                                ) : (
                                                    <div className="px-4 py-4 text-center text-xs text-gray-400">
                                                        Nessun risultato per "
                                                        {searchQuery}"
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                                            Annulla
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newDescription.trim()}
                                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                                            Avvia Tracking
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="z-50">
                        <button
                            className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 z-50"
                            onClick={openModal}
                            aria-label="Aggiungi tracking">
                            <PlusCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                </section>
            )}
        </GenericComponent>
    );
};