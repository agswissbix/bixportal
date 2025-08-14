import React, { useState, useCallback, useEffect, useMemo, useContext } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Plus, Check } from 'lucide-react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';

// ===================================================================================
// FLAG PER LO SVILUPPO
// ===================================================================================
const isDev = true;

// ===================================================================================
// INTERFACCE E TIPI
// ===================================================================================
interface Resource {
  id: string;
  name: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  color: string;
  resourceId: string;
}

interface UnplannedEvent {
  id: string;
  title: string;
  description: string;
  color: string;
}

interface ResponseInterface {
  resources: Resource[];
  events: CalendarEvent[];
  unplannedEvents: UnplannedEvent[];
}

interface PropsInterface {
  initialDate?: Date;
}

type ViewMode = 'week' | 'month';

// ===================================================================================
// DATI DI DEFAULT E PER LO SVILUPPO
// ===================================================================================

const responseDataDEFAULT: ResponseInterface = {
  resources: [],
  events: [],
  unplannedEvents: [],
};

const responseDataDEV: ResponseInterface = {
  resources: [
    { id: 'antonijevictoplica', name: 'Antonijevic Toplica' },
    { id: 'BasarabaTomislav', name: 'Basaraba Tomislav' },
    { id: 'BerishaBekim', name: 'Berisha Bekim' },
    { id: 'DokovicDorde', name: 'Dokovic Dorde' },
    { id: 'FazziLuca', name: 'Fazzi Luca' },
    { id: 'RossiMario', name: 'Rossi Mario' },
    { id: 'BianchiGiulia', name: 'Bianchi Giulia' },
    { id: 'VerdiPaolo', name: 'Verdi Paolo' },
    { id: 'GalliAnna', name: 'Galli Anna' },
    { id: 'ContiMarco', name: 'Conti Marco' }
  ],
  events: [
    {
      id: '1',
      title: 'Pulizia completa Condominio Lucino',
      start: new Date(2025, 0, 7, 10, 0),
      end: new Date(2025, 0, 7, 11, 30),
      description: 'Pulizia completa Condominio Lucino',
      color: '#3b82f6',
      resourceId: 'antonijevictoplica'
    },
    {
      id: '2',
      title: 'Pulizia entrata Residenza Nettuno',
      start: new Date(2025, 0, 8, 14, 0),
      end: new Date(2025, 0, 8, 15, 0),
      description: 'Pulizia entrata Residenza Nettuno',
      color: '#10b981',
      resourceId: 'BasarabaTomislav'
    },
    {
      id: '3',
      title: 'Manutenzione giardino Villa Ada',
      start: new Date(2025, 0, 22, 9, 0),
      end: new Date(2025, 0, 22, 12, 0),
      description: 'Taglio erba e siepi',
      color: '#ef4444',
      resourceId: 'RossiMario'
    }
  ],
  unplannedEvents: [
    { id: 'u1', title: 'Pulizia finestre Stabile fortuna', description: 'Note aggiuntive', color: '#f97316' },
    { id: 'u2', title: 'Pulizie finestre Lisano 1 Massagno', description: 'Note aggiuntive', color: '#8b5cf6' }
  ]
};

const defaultNewEvent = {
  title: '',
  start: new Date(),
  end: new Date(Date.now() + 3600000), // +1 ora
  description: '',
  color: '#3b82f6',
  resourceId: ''
};

// ===================================================================================
// SOTTO-COMPONENTI (estratti per performance e leggibilità)
// ===================================================================================

const WeekDropdown: React.FC<{ selectedWeek: number, onWeekChange: (week: number) => void }> = ({ selectedWeek, onWeekChange }) => (
  <select className="w-48 p-2 border rounded" value={selectedWeek} onChange={(e) => onWeekChange(Number(e.target.value))}>
    {[1, 2, 3, 4, 5].map(week => <option key={week} value={week}>Settimana {week}</option>)}
  </select>
);

const MonthDropdown: React.FC<{ selectedMonth: number, onMonthChange: (month: number) => void }> = ({ selectedMonth, onMonthChange }) => {
  const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  return (
    <select className="w-48 p-2 border rounded" value={selectedMonth} onChange={(e) => onMonthChange(Number(e.target.value))}>
      {months.map((label, index) => <option key={index} value={index}>{label}</option>)}
    </select>
  );
};


// ===================================================================================
// COMPONENTE PRINCIPALE
// ===================================================================================

function PitCalendar({ initialDate }: PropsInterface) {
  // DATI
  const { user } = useContext(AppContext);
  
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
  
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(initialDate || new Date(2025, 0, 21));
  const [selectedWeek, setSelectedWeek] = useState(3);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<Partial<CalendarEvent> & { id: string } | null>(null);
  const [newEvent, setNewEvent] = useState<Omit<CalendarEvent, 'id'>>(defaultNewEvent);
  
  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'getCalendarData',
      month: currentDate.getMonth(),
      year: currentDate.getFullYear()
    };
  }, [currentDate]);

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };
  
  useEffect(() => {
    if (!isDev && response) {
      const parsedEvents = response.events.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setResponseData({ ...response, events: parsedEvents });
    }
  }, [response]);

  const { resources, events, unplannedEvents } = responseData;

  const filteredResources = useMemo(() => 
    selectedResourceIds.length > 0
      ? resources.filter(resource => selectedResourceIds.includes(resource.id))
      : resources,
    [resources, selectedResourceIds]
  );
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  };

  const getWorkDaysInWeek = (date: Date, week: number) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    let dayOfWeek = startOfMonth.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    const firstMonday = new Date(startOfMonth);
    if (dayOfWeek !== 1) {
      firstMonday.setDate(firstMonday.getDate() + (8 - dayOfWeek));
    }
    const offsetStart = new Date(firstMonday);
    offsetStart.setDate(offsetStart.getDate() + (week - 1) * 7);
    const days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(offsetStart);
      d.setDate(offsetStart.getDate() + i);
      days.push(d);
    }
    return days;
  };
  
  const displayedDays = useMemo(() => {
    if (viewMode === 'month') {
        return getDaysInMonth(currentDate);
    }
    return getWorkDaysInWeek(currentDate, selectedWeek);
  }, [currentDate, selectedWeek, viewMode]);

  const handleDrop = useCallback((dropDate: Date, newResourceId: string) => {
    if (!draggedEvent) return;

    const duration = (draggedEvent.end && draggedEvent.start)
      ? draggedEvent.end.getTime() - draggedEvent.start.getTime()
      : 3600000;

    const newStart = new Date(dropDate);
    newStart.setHours(
      draggedEvent.start ? draggedEvent.start.getHours() : 9,
      draggedEvent.start ? draggedEvent.start.getMinutes() : 0,
      0, 0
    );
    const newEnd = new Date(newStart.getTime() + duration);

    const isAlreadyPlanned = events.some(ev => ev.id === draggedEvent.id);

    setResponseData(prev => {
      let updatedEvents = [...prev.events];
      let updatedUnplanned = [...prev.unplannedEvents];

      if (isAlreadyPlanned) {
        updatedEvents = prev.events.map(event =>
          event.id === draggedEvent.id
            ? { ...event, start: newStart, end: newEnd, resourceId: newResourceId }
            : event
        );
      } else {
        updatedUnplanned = prev.unplannedEvents.filter(e => e.id !== draggedEvent.id);
        const eventToAdd: CalendarEvent = {
          id: draggedEvent.id,
          title: draggedEvent.title || 'Nuovo Evento',
          description: draggedEvent.description || '',
          color: draggedEvent.color || '#3b82f6',
          start: newStart,
          end: newEnd,
          resourceId: newResourceId,
        };
        updatedEvents.push(eventToAdd);
      }
      return { ...prev, events: updatedEvents, unplannedEvents: updatedUnplanned };
    });

    setDraggedEvent(null);
  }, [draggedEvent, events]);
  
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.resourceId) {
      alert('Titolo e dipendente sono obbligatori.');
      return;
    }
    if (newEvent.end <= newEvent.start) {
      alert("L'ora di fine deve essere successiva all'ora di inizio.");
      return;
    }
    
    const eventToAdd: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      ...newEvent
    };

    setResponseData(prev => ({ ...prev, events: [...prev.events, eventToAdd] }));
    setNewEvent(defaultNewEvent);
  };
  
  const handleDragStart = (e: React.DragEvent, event: Partial<CalendarEvent> & { id: string }) => {
    e.stopPropagation();
    setDraggedEvent(event);
    const dragImage = document.createElement('div');
    dragImage.style.position = 'fixed';
    dragImage.style.top = '-100px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };
  
  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(month);
    newDate.setDate(1);
    setCurrentDate(newDate);
  };

  const formatEventTime = (date: Date) => date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false });

  const gridColsStyle = {
    gridTemplateColumns: `minmax(180px, 1fr) repeat(${displayedDays.length}, minmax(160px, 1fr))`
  };

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(data: ResponseInterface) => (
        <div className="flex h-11/12 bg-gray-50">
          <div className="flex-1 p-4 flex flex-col min-w-0">
            <header className="mb-4 space-y-4 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <MonthDropdown 
                    selectedMonth={currentDate.getMonth()}
                    onMonthChange={handleMonthChange}
                  />
                  {viewMode === 'week' && (
                    <WeekDropdown
                      selectedWeek={selectedWeek}
                      onWeekChange={setSelectedWeek}
                    />
                  )}
                </div>
                <div className="flex space-x-2">
                    <Button variant={viewMode === 'week' ? 'default' : 'outline'} onClick={() => setViewMode('week')}>Settimana</Button>
                    <Button variant={viewMode === 'month' ? 'default' : 'outline'} onClick={() => setViewMode('month')}>Mese</Button>
                </div>
              </div>
            </header>

            {/* Questo wrapper è la chiave della soluzione.
                1. `relative` crea un contesto di posizionamento per il suo figlio (la Card).
                2. `flex-grow` lo fa espandere per riempire tutto lo spazio verticale disponibile. */}
            <div className="relative flex-grow">
              {/* La Card del calendario
                  1. `absolute inset-0` la fa espandere per riempire completamente il wrapper `relative`.
                     Questo le dà una dimensione definita (l'altezza del suo genitore).
                  2. `overflow-auto` aggiunge le barre di scorrimento (orizzontale e verticale)
                     solo se il contenuto interno (la griglia) è più grande della Card stessa. */}
              <Card className="absolute inset-0 p-4 overflow-auto">
                <div className="grid" style={gridColsStyle}>
                  {/* Headers */}
                  <div className="p-2 border-b border-r border-gray-200 bg-gray-100 font-semibold sticky top-0 left-0 z-20">
                    Dipendenti
                  </div>
                  {displayedDays.map(day => (
                    <div key={day.toISOString()} className="p-2 text-center border-b border-gray-200 bg-gray-100 font-semibold sticky top-0 z-10">
                      {day.toLocaleDateString('it-IT', { weekday: 'short' })}<br />
                      <span className="text-xl">{day.getDate()}</span>
                    </div>
                  ))}
                  
                  {/* Righe Risorse */}
                  {filteredResources.map(resource => (
                    <React.Fragment key={resource.id}>
                      <div className="p-2 border-r border-b border-gray-200 font-medium bg-white sticky left-0 z-10">
                        {resource.name}
                      </div>
                      {displayedDays.map(day => (
                        <div
                          key={`${resource.id}-${day.toISOString()}`}
                          className="min-h-20 p-1 border-b border-r border-gray-200 transition-colors duration-200 space-y-1"
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50'); }}
                          onDragLeave={(e) => e.currentTarget.classList.remove('bg-blue-50')}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDrop(day, resource.id);
                            e.currentTarget.classList.remove('bg-blue-50');
                          }}
                        >
                          {data.events
                            .filter(event => 
                              event.resourceId === resource.id &&
                              event.start.toDateString() === day.toDateString()
                            )
                            .sort((a, b) => a.start.getTime() - b.start.getTime())
                            .map(event => (
                              <div
                                key={event.id}
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, event)}
                                onClick={() => { setSelectedEvent(event); setShowEventDialog(true); }}
                                className="p-2 rounded text-sm cursor-move text-white select-none shadow"
                                style={{ backgroundColor: event.color, opacity: draggedEvent?.id === event.id ? 0.5 : 1 }}
                              >
                                <div className="font-semibold">{event.title}</div>
                                <div className="text-xs">{formatEventTime(event.start)} - {formatEventTime(event.end)}</div>
                              </div>
                            ))}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </Card>
            </div>
            
          </div>
          
          {/* Sidebar Destra */}
          <aside className="w-80 border-l bg-white flex flex-col">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold mb-4">Nuovo Evento</h3>
                <Button onClick={handleAddEvent} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Aggiungi Evento (Form)
                </Button>
              </div>

              <div className="p-4 flex-grow overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Eventi da pianificare</h3>
                <div className="space-y-2">
                  {data.unplannedEvents.map(ev => (
                    <div
                      key={ev.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, ev)}
                      className="p-2 rounded cursor-move text-white shadow"
                      style={{ backgroundColor: ev.color }}
                    >
                      <div className="font-semibold">{ev.title}</div>
                      {ev.description && <div className="text-xs opacity-90">{ev.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
          </aside>

          {/* Dialog Dettaglio Evento */}
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedEvent?.title}</DialogTitle>
              </DialogHeader>
              {selectedEvent && <div className="space-y-4 pt-4">
                <div className="flex items-center"><Calendar className="mr-2" /><span>{selectedEvent.start.toLocaleDateString('it-IT')}</span></div>
                <div className="flex items-center"><Clock className="mr-2" /><span>{formatEventTime(selectedEvent.start)} - {formatEventTime(selectedEvent.end)}</span></div>
                <p>{selectedEvent.description}</p>
              </div>}
            </DialogContent>
          </Dialog>

        </div>
      )}
    </GenericComponent>
  );
};

const MemoizedPitCalendar = memoWithDebug(PitCalendar, "PitCalendar");
export default MemoizedPitCalendar;