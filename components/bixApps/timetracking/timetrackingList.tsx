'use client'

import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent'
import { AppContext } from '@/context/appContext';
import { PlusCircleIcon, StopCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import WidgetTaskTracker from '@/components/widgets/widgetTaskTracker';
import WidgetBattery from './widgetBattery';

const MINUTES_PER_HOUR = 60;

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
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
    timetracking: Timetracking[];
}

export default function TimetrackingList() {
    // FLAG PER LO SVILUPPO
    const isDev = false;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        timetracking: []
    };

    // DATI RESPONSE PER LO SVILUPPO 
    const responseDataDEV: ResponseInterface = {
        timetracking: [
            {
                id: '1',
                description: 'Sviluppo Backend API',
                date: new Date(),
                start: '08:00',
                end: '12:30',
                worktime: 4.5,
                worktime_string: '04:30',
                status: 'Terminato'
            },
            {
                id: '2',
                description: 'Meeting con il team',
                date: new Date(),
                start: '14:00',
                end: '', 
                worktime: 0,
                worktime_string: '00:00',
                status: 'Attivo'
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
        const hasActiveTimetracking = responseData.timetracking.some(t => t.status === 'Attivo');
        
        let interval: NodeJS.Timeout;
        if (hasActiveTimetracking) {
            interval = setInterval(() => {
                setNow(new Date());
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [responseData.timetracking]);

    const activeTrack = useMemo(() => {
        return responseData.timetracking.find(t => t.status === 'Attivo');
    }, [responseData.timetracking]);

    const finishedTracks = useMemo(() => {
        return responseData.timetracking
            .filter(t => t.status !== 'Attivo')
            .sort((a, b) => b.start.localeCompare(a.start));
    }, [responseData.timetracking]);


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

    const totalWorkedHoursString = (timetracking: Timetracking[]) => {
        const numericHours = calculateTotalHoursNumeric(timetracking);
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

    const saveTimetracking = async (description: string) => {
        try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "save_timetracking",
                    description: description
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

        await saveTimetracking(newDescription);
        closeModal();
    };

    const numericWorkedHours = calculateTotalHoursNumeric(response?.timetracking || []);

    return (
        <GenericComponent response={responseData} loading={loading} error={error}>
            {(response: ResponseInterface) => (
                <section
                    id="timesheets"
                    className="py-12 md:py-16 relative"
                >

                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-4xl md:text-4xl font-semibold text-gray-800 mb-4 text-center">
                            Timetracking
                        </h1>
                        <p className="text-center text-gray-600 mb-8">
                            Tracking giornaliero
                        </p>
                    </div>

                    <div className="flex-1 w-full max-w-6xl mx-auto px-4 min-h-0 pb-2">
                        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
                                <h3 className="font-medium text-gray-700">Riepilogo Oggi</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 flex flex-col md:flex-row items-center justify-around space-y-4 md:space-y-0">
                                <div className="flex flex-col items-center">
                                    <span className="text-sm text-gray-500 mb-1">Ore Totali</span>
                                    <span className="text-4xl font-bold font-mono text-green-600">
                                        {totalWorkedHoursString(response.timetracking)} h
                                    </span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <span className="text-sm text-gray-500 mb-2">Carico Lavoro</span>
                                    <WidgetBattery customHours={numericWorkedHours} cleanView={true} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-6xl mx-auto px-4 min-h-0 pb-2 mt-8">
                        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
                            <div className="flex-1 p-4">
                                {activeTrack ? (
                                    <div className="p-4 rounded-lg border transition-all border-green-200 bg-green-50 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-gray-800">{activeTrack.description}</span>
                                            
                                            <button 
                                                onClick={() => handleStopActivity(activeTrack)}
                                                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer group"
                                                title="Ferma tracking"
                                            >
                                                <StopCircleIcon className="w-4 h-4 animate-pulse group-hover:animate-none" />
                                                <span className="text-xs font-bold uppercase">Stop</span>
                                            </button>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm text-gray-500 mt-2 items-end">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400">Inizio</span>
                                                <span>{activeTrack.start}</span>
                                            </div>
                                            
                                            <div className="flex flex-col items-end">
                                                 <span className="text-xs text-gray-400">Durata</span>
                                                 <span className="font-mono text-2xl font-bold text-green-600">
                                                    {getDynamicDuration(activeTrack.start)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <p className="text-gray-400">Nessuna attività in corso al momento.</p>
                                        <p className="text-sm text-gray-400 mt-1">Premi il pulsante + per iniziare.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-6xl mx-auto px-4 min-h-0 pb-24 mt-8">
                        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
                                <h3 className="font-medium text-gray-700">Timetracker terminati oggi</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {finishedTracks.length > 0 ? (
                                    finishedTracks.map((track, i) => (
                                        <div key={track.id || i} className="p-4 rounded-lg border transition-all border-gray-200 hover:bg-gray-50">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-gray-800">{track.description}</span>
                                                
                                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                                    {track.status}
                                                </span>
                                            </div>
                                            
                                            <div className="flex justify-between text-sm text-gray-500 mt-2 items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400">Orario</span>
                                                    <span>{track.start} - {track.end}</span>
                                                </div>
                                                
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-gray-400">Durata</span>
                                                    <span className="font-mono font-medium text-gray-700">
                                                        {track.worktime_string} h
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400 py-4">Nessun'altra attività registrata oggi.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {isModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="font-semibold text-gray-800">Nuovo Tracking</h3>
                                    <button 
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <form onSubmit={submitNewTracking} className="p-6">
                                    <div className="mb-6">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                            Descrizione attività
                                        </label>
                                        <input
                                            type="text"
                                            id="description"
                                            autoFocus
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                            placeholder="Es: Sviluppo Homepage..."
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                        />
                                        {activeTrack && (
                                            <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                Nota: L'attività attuale "{activeTrack.description}" verrà terminata automaticamente.
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                        >
                                            Annulla
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newDescription.trim()}
                                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
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
                            aria-label="Aggiungi tracking"
                        >
                            <PlusCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                </section>
            )}
        </GenericComponent>
    );
};