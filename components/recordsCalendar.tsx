import React, { useMemo, useContext, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Assumendo che questi percorsi siano corretti nel tuo progetto
import { useApi } from '@/utils/useApi'; 
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { useRecordsStore } from './records/recordsStore';

// --- CONFIGURAZIONE E COSTANTI ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO: true per usare dati mock, false per chiamare l'API reale
const isDev = false; 

// --- INTERFACCE ---

// Interfaccia per le Props del componente
interface PropsInterface {
          tableid?: string;
          searchTerm?: string;
          filters?: string;
          view?: string;
          context?: string;
          level?: number;
          filtersList?: Array<{
            fieldid: string;
            type: string;   
            label: string;
            value: string;
            }>;
          masterTableid?: string;
          masterRecordid?: string;
        }

// Interfaccia per la risposta attesa dal backend (e per i dati mock)
interface ResponseInterface {
    counter?: number;
    rows: Array<{
        recordid: string;
        title: string;
        startDate: string;
        endDate?: string;
        css: string;
        fields: Array<any>;
    }>;
    columns: Array<any>;
}

type CalendarView = 'month' | 'week' | 'day';

// --- COMPONENTE CALENDARIO ---

export default function RecordsCalendar({ tableid, initialView = 'month', context, searchTerm, filters, masterTableid, masterRecordid }: PropsInterface) {
    
    // --- SEZIONE DATI ---

    // 1. PROPS PER LO SVILUPPO
    // Se isDev è true, usiamo valori di default per le props per facilitare il testing
    const devTableId = isDev ? "calendar_demo" : tableid;
    const devInitialView = isDev ? "month" : initialView;
    
    // 2. DATI DI DEFAULT PER LA RESPONSE (usati prima che l'API risponda)
    const responseDataDEFAULT: ResponseInterface = {
        counter: 0,
        rows: [],
        columns: []
    };

    // 3. DATI MOCK PER LO SVILUPPO (usati quando isDev è true)
    const responseDataDEV: ResponseInterface = {
        counter: 4,
        rows: [
            { recordid: "1", title: "Team Sync Meeting", startDate: "2025-08-12T10:00:00", endDate: "2025-08-12T11:30:00", css: "bg-blue-100 border-l-4 border-blue-500 text-blue-800 dark:bg-blue-900/50 dark:border-blue-400 dark:text-blue-200", fields: [] },
            { recordid: "2", title: "Project Alpha Deadline", startDate: "2025-08-15T17:00:00", endDate: "2025-08-15T17:30:00", css: "bg-red-100 border-l-4 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-400 dark:text-red-200", fields: [] },
            { recordid: "3", title: "Deploy to Production", startDate: "2025-08-20T09:00:00", endDate: "2025-08-22T18:00:00", css: "bg-green-100 border-l-4 border-green-500 text-green-800 dark:bg-green-900/50 dark:border-green-400 dark:text-green-200", fields: [] },
            { recordid: "4", title: "Client Call", startDate: "2025-08-12T15:00:00", endDate: "2025-08-12T15:30:00", css: "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-400 dark:text-yellow-200", fields: [] }
        ],
        columns: [
            { fieldtypeid: 'Testo', desc: 'Event Title' },
            { fieldtypeid: 'Data', desc: 'Start Date' },
        ]
    };

    // 4. DATI DAL CONTESTO GLOBALE (opzionale, per coerenza con lo schema)
    const { user } = useContext(AppContext);

    
    // --- SEZIONE STATO E LOGICA ---

    // Stato principale per i dati del calendario. Inizializzato con dati mock o vuoti.
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
    
    // Stati per la UI del calendario
    const [view, setView] = useState<CalendarView>(devInitialView);
    const [currentDate, setCurrentDate] = useState(new Date('2025-08-12T10:00:00Z')); // Data fissa per la demo

    const {
            refreshTable,
            setRefreshTable,
            handleRowClick,
        } = useRecordsStore();

    // PAYLOAD PER LA CHIAMATA API (solo se non in sviluppo)
    const payload = useMemo(() => {
            if (isDev) return null;
            return {
                apiRoute: 'get_calendar_records', // riferimento api per il backend
                tableid: tableid,
                searchTerm: searchTerm,
                view: view,
                filtersList: filters,
                masterTableid: masterTableid,
                masterRecordid: masterRecordid,
                _refreshTick: refreshTable
            };
        }, [tableid, refreshTable, masterTableid, masterRecordid, filters]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO DELLO STATO CON I DATI DAL BACKEND (solo se non in sviluppo)
    useEffect(() => {
        if (!isDev && response) {
            setResponseData(response);
        }
    }, [response]);
    
    // --- FUNZIONI DI UTILITY E RENDERING ---
    
    const handlePrev = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
            if (view === 'week') newDate.setDate(newDate.getDate() - 7);
            if (view === 'day') newDate.setDate(newDate.getDate() - 1);
            return newDate;
        });
    };

    const handleNext = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
            if (view === 'week') newDate.setDate(newDate.getDate() + 7);
            if (view === 'day') newDate.setDate(newDate.getDate() + 1);
            return newDate;
        });
    };

    const handleToday = () => setCurrentDate(new Date('2025-08-12T10:00:00Z'));

    const renderHeaderTitle = () => {
        if (view === 'month') {
            return currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
        }
        if (view === 'day') {
            return currentDate.toLocaleString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        if (view === 'week') {
            const firstDayOfWeek = new Date(currentDate);
            const day = firstDayOfWeek.getDay();
            const diff = firstDayOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            firstDayOfWeek.setDate(diff);
            
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
            
            const startMonth = firstDayOfWeek.toLocaleString('it-IT', { month: 'long' });
            const endMonth = lastDayOfWeek.toLocaleString('it-IT', { month: 'long' });

            if (startMonth === endMonth) {
                return `${firstDayOfWeek.getDate()} - ${lastDayOfWeek.getDate()} ${startMonth} ${lastDayOfWeek.getFullYear()}`;
            }
            return `${firstDayOfWeek.getDate()} ${startMonth} - ${lastDayOfWeek.getDate()} ${endMonth} ${lastDayOfWeek.getFullYear()}`;
        }
    };

    const renderCalendar = (data: ResponseInterface) => {
        switch (view) {
            case 'week': return renderWeekView(data);
            case 'day': return renderDayView(data);
            default: return renderMonthView(data);
        }
    };

    const renderMonthView = (data: ResponseInterface) => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        const dayCells = Array.from({ length: dayOffset + daysInMonth }, (_, i) => {
            if (i < dayOffset) return <div key={`empty-${i}`} className="border-t border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"></div>;
            
            const dayNumber = i - dayOffset + 1;
            const cellDate = new Date(year, month, dayNumber);
            const isToday = cellDate.toDateString() === new Date('2025-08-12').toDateString();
            
            const eventsForDay = data.rows.filter(event => new Date(event.startDate).toDateString() === cellDate.toDateString());

            return (
                <div key={dayNumber} className="relative border-t border-r border-gray-200 dark:border-gray-700 p-1 min-h-[120px] flex flex-col">
                    <span className={`font-semibold text-sm ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{dayNumber}</span>
                    <div className="mt-1 space-y-1 flex-grow overflow-y-auto">
                        {eventsForDay.map(event => (
                             <div key={event.recordid} className={`p-1.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${event.css}`} >
                                 <p className="font-bold truncate">{event.title}</p>
                                 <p>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                             </div>
                        ))}
                    </div>
                </div>
            );
        });

        return (
            <>
                <div className="grid grid-cols-7 text-center font-semibold text-sm py-2 text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                    <div>Lunedì</div> <div>Martedì</div> <div>Mercoledì</div> <div>Giovedì</div> <div>Venerdì</div> <div>Sabato</div> <div>Domenica</div>
                </div>
                <div className="grid grid-cols-7 h-full">{dayCells}</div>
            </>
        );
    };
    
    const renderWeekView = (data: ResponseInterface) => {
        const weekDays = [];
        const firstDayOfWeek = new Date(currentDate);
        const day = firstDayOfWeek.getDay();
        const diff = firstDayOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);

        for (let i = 0; i < 7; i++) {
            const day = new Date(firstDayOfWeek);
            day.setDate(firstDayOfWeek.getDate() + i);
            weekDays.push(day);
        }

        return (
            <div className="flex flex-col h-full">
                <div className="grid grid-cols-7 text-center font-semibold text-sm py-2 text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className={day.toDateString() === new Date('2025-08-12').toDateString() ? 'text-blue-600' : ''}>
                            <p>{day.toLocaleString('it-IT', { weekday: 'short' })}</p>
                            <p className="text-2xl">{day.getDate()}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 flex-grow overflow-auto">
                    {weekDays.map(day => {
                        const eventsForDay = data.rows.filter(event => new Date(event.startDate).toDateString() === day.toDateString());
                        return (
                            <div key={day.toISOString()} className="border-r dark:border-gray-700 p-1 space-y-2">
                                {eventsForDay.map(event => (
                                    <div key={event.recordid} className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${event.css}`} >
                                        <p className="font-bold">{event.title}</p>
                                        <p>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.endDate ? new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDayView = (data: ResponseInterface) => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const eventsForDay = data.rows.filter(event => new Date(event.startDate).toDateString() === currentDate.toDateString());
        
        const getEventPosition = (event) => {
            const start = new Date(event.startDate);
            const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 ora
            const top = (start.getHours() * 60 + start.getMinutes());
            const bottom = (end.getHours() * 60 + end.getMinutes());
            const height = bottom - top;
            
            return { top: top / (24*60) * 100, height: height / (24*60) * 100 };
        };

        return (
            <div className="flex h-full overflow-auto">
                <div className="w-16 text-right pr-2 border-r dark:border-gray-700">
                    {hours.map(hour => (
                        <div key={hour} className="h-16 flex items-start justify-end">
                            <span className="text-xs text-gray-500 -mt-2">{hour.toString().padStart(2, '0')}:00</span>
                        </div>
                    ))}
                </div>
                <div className="relative flex-grow">
                    {hours.map(hour => (
                        <div key={hour} className="h-16 border-b dark:border-gray-700"></div>
                    ))}
                    <div className="absolute inset-0">
                        {eventsForDay.map(event => {
                            const {top, height} = getEventPosition(event);
                            return (
                                <div 
                                    key={event.recordid} 
                                    className={`absolute left-2 right-2 p-2 rounded text-xs cursor-pointer ${event.css}`}
                                    style={{ top: `${top}%`, height: `${height}%` }}
                                >
                                    <p className="font-bold">{event.title}</p>
                                    <p>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.endDate ? new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // --- SEZIONE RENDER JSX ---
    
    console.log('[DEBUG] Rendering RecordsCalendar', { tableid, responseData });

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(data: ResponseInterface) => (
                <div className="h-full w-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-x-2">
                            <button onClick={handleToday} className="px-4 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Oggi</button>
                            <div className="flex items-center">
                                <button onClick={handlePrev} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ChevronLeft className="h-5 w-5"/></button>
                                <button onClick={handleNext} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ChevronRight className="h-5 w-5"/></button>
                            </div>
                            <h2 className="text-xl font-semibold ml-2 capitalize">{renderHeaderTitle()}</h2>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-md">
                            <button onClick={() => setView('month')} className={`px-3 py-1 text-sm rounded ${view === 'month' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>Mese</button>
                            <button onClick={() => setView('week')} className={`px-3 py-1 text-sm rounded ${view === 'week' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>Settimana</button>
                            <button onClick={() => setView('day')} className={`px-3 py-1 text-sm rounded ${view === 'day' ? 'bg-white dark:bg-gray-700 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>Giorno</button>
                        </div>
                    </header>
                    <main className="flex-grow overflow-auto">{renderCalendar(data)}</main>
                     <footer className="text-right p-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                         <span className="font-medium">Eventi totali:</span> {data.counter}
                    </footer>
                </div>
            )}
        </GenericComponent>
    );
}


