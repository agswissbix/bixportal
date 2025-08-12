import React, { useMemo, useContext, useState, useEffect, useCallback } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent'; // Assumendo esista come in RecordsTable
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore'; // Assumendo esista
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Plus, Check } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true; // Impostare su 'false' per usare l'API reale

// INTERFACCE (identiche a RecordsTable)
// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
  filters?: string;
  view?: string;
  order?: {
    columnDesc: string | null;
    direction: 'asc' | 'desc' | null;
  };
  context?: string;
  pagination?: {
    page: number;
    limit: number;
  };
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

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
    counter?: number;
    rows: Array<{
        recordid: string;
        css: string;
        fields: Array<{
            recordid?: string;
            css: string;
            type: string; // Es: 'title', 'start_date', 'end_date', 'resourceId', 'color', 'description'
            value: string;
            fieldid: string;
            userid?: string;
            linkedmaster_tableid?: string;
            linkedmaster_recordid?: string;
        }>
    }>;
    columns: Array<{
        fieldtypeid: string;
        desc: string;
        fieldid: string; // Aggiunto per mappare i campi
    }>;
    // Potremmo aggiungere una sezione per le risorse/dipendenti
    resources?: Array<{ id: string; name: string }>; 
}

// TIPO PER GLI EVENTI INTERNI DEL CALENDARIO
type CalendarEventType = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  color: string;
  resourceId: string;
};

export default function recordsCalendar({ tableid, view, filtersList, masterTableid, masterRecordid }: PropsInterface) {

  // DATI RESPONSE DI DEFAULT
  const responseDataDEFAULT: ResponseInterface = {
    counter: 0,
    rows: [],
    columns: [],
    resources: [],
  };

  // DATI RESPONSE PER LO SVILUPPO 
  const responseDataDEV: ResponseInterface = {
    counter: 2,
    columns: [
        { fieldid: "title", desc: "Titolo Evento", fieldtypeid: "text" },
        { fieldid: "start_date", desc: "Inizio", fieldtypeid: "datetime" },
        { fieldid: "end_date", desc: "Fine", fieldtypeid: "datetime" },
        { fieldid: "description", desc: "Descrizione", fieldtypeid: "text" },
        { fieldid: "color", desc: "Colore", fieldtypeid: "color" },
        { fieldid: "resourceId", desc: "Risorsa", fieldtypeid: "lookup" },
    ],
    rows: [
      {
        recordid: "1",
        css: "",
        fields: [
          { fieldid: "title", value: "Pulizia completa Condominio Lucino", type: "text", css: "" },
          { fieldid: "start_date", value: new Date(2025, 7, 12, 10, 0).toISOString(), type: "datetime", css: "" },
          { fieldid: "end_date", value: new Date(2025, 7, 12, 11, 30).toISOString(), type: "datetime", css: "" },
          { fieldid: "description", value: "Pulizia completa Condominio Lucino", type: "text", css: "" },
          { fieldid: "color", value: "#3b82f6", type: "color", css: "" },
          { fieldid: "resourceId", value: "antonijevictoplica", type: "lookup", css: "" },
        ],
      },
      {
        recordid: "2",
        css: "",
        fields: [
          { fieldid: "title", value: "Pulizia entrata Residenza Nettuno", type: "text", css: "" },
          { fieldid: "start_date", value: new Date(2025, 7, 13, 14, 0).toISOString(), type: "datetime", css: "" },
          { fieldid: "end_date", value: new Date(2025, 7, 13, 15, 0).toISOString(), type: "datetime", css: "" },
          { fieldid: "description", value: "Pulizia entrata Residenza Nettuno", type: "text", css: "" },
          { fieldid: "color", value: "#10b981", type: "color", css: "" },
          { fieldid: "resourceId", value: "BasarabaTomislav", type: "lookup", css: "" },
        ],
      },
    ],
    resources: [
        { id: 'antonijevictoplica', name: 'Antonijevic Toplica' },
        { id: 'BasarabaTomislav', name: 'Basaraba Tomislav' },
        { id: 'BerishaBekim', name: 'Berisha Bekim' },
    ]
  };
  
  // IMPOSTAZIONE DELLA RESPONSE
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

  // STATI SPECIFICI DEL CALENDARIO
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 12));
  const [selectedWeek, setSelectedWeek] = useState(3); // Basato sulla data corrente
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<Partial<CalendarEventType> & { id: string } | null>(null);

  // STATI PER LA UI (modali, form, etc)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventType | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  
  // STATO PER GLI EVENTI NON PIANIFICATI (per ora locale, potrebbe venire dall'API)
  const [unplannedEvents, setUnplannedEvents] = useState([
     { id: 'u1', title: 'Pulizia finestre Stabile fortuna', description: 'Note aggiuntive', color: '#f97316' },
     { id: 'u2', title: 'Pulizie finestre Lisano 1 Massagno', description: 'Note aggiuntive', color: '#8b5cf6' }
  ]);
  
  // ZUSTAND STORE
  const { refreshTable } = useRecordsStore();

  // PAYLOAD PER LA CHIAMATA API
  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_calendar_records', // API route specifica per il calendario
      tableid: tableid,
      view: view,
      // Passiamo i filtri del calendario al backend
      filters: {
        date: currentDate.toISOString(),
        week: selectedWeek,
        resources: selectedResourceIds,
        // Altri filtri possono essere aggiunti qui
      },
      masterTableid: masterTableid,
      masterRecordid: masterRecordid,
      _refreshTick: refreshTable
    };
  }, [tableid, view, currentDate, selectedWeek, selectedResourceIds, masterTableid, masterRecordid, refreshTable]);

  // CHIAMATA AL BACKEND (solo se non in sviluppo)
  const { response, loading, error, elapsedTime } = !isDev && payload 
      ? useApi<ResponseInterface>(payload) 
      : { response: responseDataDEV, loading: false, error: null, elapsedTime: 0 };

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND
  useEffect(() => {
    if (!isDev && response) {
      setResponseData(response);
    }
  }, [response]);

  // TRASFORMAZIONE: da responseData.rows a un array di eventi utilizzabile dalla UI
  const { events, resources } = useMemo(() => {
    const transformedEvents = responseData.rows.map(row => {
      const event: Partial<CalendarEventType> = { id: row.recordid };
      row.fields.forEach(field => {
        switch (field.fieldid) {
          case 'title': event.title = field.value; break;
          case 'start_date': event.start = new Date(field.value); break;
          case 'end_date': event.end = new Date(field.value); break;
          case 'description': event.description = field.value; break;
          case 'color': event.color = field.value; break;
          case 'resourceId': event.resourceId = field.value; break;
        }
      });
      return event as CalendarEventType;
    });

    // Usa le risorse dalla response, altrimenti quelle di default per dev
    const availableResources = responseData.resources && responseData.resources.length > 0 
      ? responseData.resources
      : responseDataDEV.resources || [];
      
    return { events: transformedEvents, resources: availableResources };
  }, [responseData]);
  
  // Il resto della logica del calendario (handleDrop, etc.) rimane simile ma usa setResponseData
  
  const handleDrop = useCallback((dropDate: Date, newResourceId: string) => {
    if (!draggedEvent) return;

    const duration = (draggedEvent.end && draggedEvent.start)
      ? draggedEvent.end.getTime() - draggedEvent.start.getTime()
      : 3600000; // 1 ora di default

    const newStart = new Date(dropDate);
    newStart.setHours(draggedEvent.start ? draggedEvent.start.getHours() : 9, draggedEvent.start ? draggedEvent.start.getMinutes() : 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    // Aggiornamento ottimistico: modifichiamo lo stato locale `responseData`
    setResponseData(currentData => {
      const newData = JSON.parse(JSON.stringify(currentData)); // Deep copy
      const existingRowIndex = newData.rows.findIndex((r: any) => r.recordid === draggedEvent.id);

      if (existingRowIndex > -1) { // L'evento era già pianificato
        const fieldsToUpdate = newData.rows[existingRowIndex].fields;
        fieldsToUpdate.find((f: any) => f.fieldid === 'start_date').value = newStart.toISOString();
        fieldsToUpdate.find((f: any) => f.fieldid === 'end_date').value = newEnd.toISOString();
        fieldsToUpdate.find((f: any) => f.fieldid === 'resourceId').value = newResourceId;
      } else { // L'evento non era pianificato
        setUnplannedEvents(prev => prev.filter(e => e.id !== draggedEvent.id));
        const newRow = {
          recordid: draggedEvent.id,
          css: '',
          fields: [
            { fieldid: 'title', value: draggedEvent.title || '', type: 'text', css: '' },
            { fieldid: 'start_date', value: newStart.toISOString(), type: 'datetime', css: '' },
            { fieldid: 'end_date', value: newEnd.toISOString(), type: 'datetime', css: '' },
            { fieldid: 'description', value: draggedEvent.description || '', type: 'text', css: '' },
            { fieldid: 'color', value: draggedEvent.color || '#3b82f6', type: 'color', css: '' },
            { fieldid: 'resourceId', value: newResourceId, type: 'lookup', css: '' },
          ],
        };
        newData.rows.push(newRow);
      }
      return newData;
    });

    // In una app reale, qui si farebbe una chiamata API per persistere la modifica
    // ad es. `updateEventOnBackend(draggedEvent.id, { start: newStart, end: newEnd, resourceId: newResourceId })`

    setDraggedEvent(null);
  }, [draggedEvent]);

  
  // MANTENIAMO IL RESTO DELLA LOGICA UI (FUNZIONI HELPER, COMPONENTI INTERNI, ECC.)
  const handleDragStart = (e: React.DragEvent, event: CalendarEventType) => {
    e.stopPropagation();
    setDraggedEvent(event);
  };
  
  const handleUnplannedDragStart = (e: React.DragEvent, event: any) => {
    e.stopPropagation();
    setDraggedEvent(event);
  };
  
  const filteredResources = selectedResourceIds.length > 0
    ? resources.filter(resource => selectedResourceIds.includes(resource.id))
    : resources;

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
  
  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  // ... (altre funzioni e componenti interni come MonthDropdown, WeekDropdown, ResourcesDropdown, etc. possono essere inseriti qui)

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title='pitCalendar' elapsedTime={elapsedTime}>
        {(response: ResponseInterface) => (
            <div className="flex h-screen">
                <div className="flex-1 p-4">
                    {/* UI del Calendario, filtri, etc. */}
                    {/* I filtri (es. MonthDropdown) ora aggiornano stati (es. currentDate) che sono nel payload */}
                    {/* La griglia del calendario ora usa l'array `events` derivato da useMemo */}
                    
                    <div className="mb-4">
                        {/* Qui andrebbero i componenti per i filtri come ResourcesDropdown, MonthDropdown, WeekDropdown */}
                        <p>Filtri del calendario (es. per Mese, Settimana, Dipendente)</p>
                    </div>

                    <Card className="p-4 overflow-auto">
                        <div className="grid grid-cols-6 gap-1">
                            <div className="p-2 border-b border-r border-gray-200 bg-gray-200 font-semibold">
                                Dipendenti
                            </div>
                            {getWorkDaysInWeek(currentDate, selectedWeek).map(day => (
                                <div key={day.toISOString()} className="p-2 text-center border-b border-gray-200 bg-gray-50 font-semibold">
                                    {day.toLocaleDateString('it-IT', { weekday: 'short' })}<br />
                                    {day.getDate()}
                                </div>
                            ))}

                            {filteredResources.map(resource => (
                                <React.Fragment key={resource.id}>
                                    <div className="p-2 border-r border-b border-gray-200 font-medium">
                                        {resource.name}
                                    </div>
                                    {getWorkDaysInWeek(currentDate, selectedWeek).map(day => (
                                        <div
                                            key={`${resource.id}-${day.toISOString()}`}
                                            className="min-h-40 p-2 border border-gray-200"
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50'); }}
                                            onDragLeave={(e) => e.currentTarget.classList.remove('bg-blue-50')}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                handleDrop(day, resource.id);
                                                e.currentTarget.classList.remove('bg-blue-50');
                                            }}
                                        >
                                            {events
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
                                                        onClick={() => {
                                                          setSelectedEvent(event);
                                                          setShowEventDialog(true);
                                                        }}
                                                        className="p-2 mb-2 rounded text-sm cursor-move text-white select-none"
                                                        style={{ backgroundColor: event.color, opacity: draggedEvent?.id === event.id ? 0.5 : 1 }}
                                                    >
                                                        <div className="font-semibold">{event.title}</div>
                                                        <div className="text-xs">
                                                            {formatEventTime(event.start)} - {formatEventTime(event.end)}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>

                    {/* DIALOG EVENTO */}
                    <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{selectedEvent?.title}</DialogTitle>
                            </DialogHeader>
                            {selectedEvent && (
                                <div className="space-y-4">
                                  <div className="flex items-center"><Calendar className="mr-2" /><span>{selectedEvent.start.toLocaleDateString()}</span></div>
                                  <div className="flex items-center"><Clock className="mr-2" /><span>{formatEventTime(selectedEvent.start)} - {formatEventTime(selectedEvent.end)}</span></div>
                                  <p>{selectedEvent.description}</p>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                {/* SEZIONE DESTRA: Eventi da pianificare */}
                <div className="w-80 border-l p-4">
                    <h3 className="text-lg font-semibold mb-4">Eventi da pianificare</h3>
                    <div className="space-y-2">
                        {unplannedEvents.map(ev => (
                            <div
                                key={ev.id}
                                draggable="true"
                                onDragStart={(e) => handleUnplannedDragStart(e, ev)}
                                className="p-2 rounded cursor-move text-white"
                                style={{ backgroundColor: ev.color }}
                            >
                                <div className="font-semibold">{ev.title}</div>
                                {ev.description && <div className="text-xs">{ev.description}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </GenericComponent>
  );
};