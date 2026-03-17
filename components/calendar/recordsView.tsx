"use client"
import { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import type { CalendarChildProps } from "./calendarBase"
import {
  getEventDurationHours,
  getEventDaySpan,
  isMultiDayEvent,
  getEventPositionInSpan,
  getEventPositionStyles,
} from "./calendarHelpers"
import React from "react"
import { useRecordsStore } from "../records/recordsStore"
import CalendarHeader from "./calendarHeader"
import GenericComponent from "../genericComponent"
import { ArrowRight, ArrowRightFromLine } from "lucide-react"

interface RecordsViewProps extends CalendarChildProps {
  calendarType: "planner" | "calendar"
  onCalendarTypeChange: (type: "planner" | "calendar") => void
}

export default function RecordsView({
  data,
  loading,
  error,
  draggedEvent,
  resizingEvent,
  handleDragStart,
  handleDrop,
  handleResizeStart,
  tableid,
  calendarType,
  onCalendarTypeChange,
  requestEventsForTable,
}: RecordsViewProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const { handleRowClick } = useRecordsStore()
  const [selectedExtraTable, setSelectedExtraTable] = useState<string>("")
  const calendarRef = useRef<HTMLDivElement>(null)

  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const MAX_VISIBLE_LANES = 4;

  const hoverTimeoutRef = useRef(null);

  const handlePrintFn = useReactToPrint({
    pageStyle: `
      @page {
        size: landscape;
        margin: 5mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          zoom: 0.65;
        }
        /* Override global layout constraints */
        html, body {
          height: auto !important;
          overflow: visible !important;
        }
        /* Ensure the container expands */
        #calendar-records-view {
          height: auto !important;
          overflow: visible !important;
          display: block !important;
        }
        /* Reset internal scroll containers */
        .overflow-auto {
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
        }
        .h-full {
          height: auto !important;
        }
        /* Hide scrollbars */
        ::-webkit-scrollbar {
          display: none;
        }
      }
    `,
  })

  // Wrapper to pass the content ref to the print function
  const handlePrint = () => {
    handlePrintFn(() => calendarRef.current)
  }

  const handleExtraTableChange = (tableId: string) => {
    setSelectedExtraTable(tableId)
    requestEventsForTable(tableId)
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1)
  const dayOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1

  const handleToday = () => setCurrentDate(new Date())

  const handlePrev = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate)
      if (viewMode === "month") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else if (viewMode === "week") {
        newDate.setDate(newDate.getDate() - 7)
      } else {
        newDate.setDate(newDate.getDate() - 1)
      }
      return newDate
    })
  }

  const handleNext = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate)
      if (viewMode === "month") {
        newDate.setMonth(newDate.getMonth() + 1)
      } else if (viewMode === "week") {
        newDate.setDate(newDate.getDate() + 7)
      } else {
        newDate.setDate(newDate.getDate() + 1)
      }
      return newDate
    })
  }

  const renderHeaderTitle = () => {
    const monthNames = [
      "Gennaio",
      "Febbraio",
      "Marzo",
      "Aprile",
      "Maggio",
      "Giugno",
      "Luglio",
      "Agosto",
      "Settembre",
      "Ottobre",
      "Novembre",
      "Dicembre",
    ]
    if (viewMode === "month") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    } else if (viewMode === "week") {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return `${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`
    } else {
      return currentDate.toLocaleDateString("it-IT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

const calculateLayout = (events, dayOffset, daysInMonth, year, month) => {
  // Filtriamo gli eventi che hanno almeno un giorno nel mese corrente
  const monthStart = new Date(year, month, 1).getTime();
  const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59).getTime();

  const filtered = events.filter(event => {
    const s = new Date(event.start).getTime();
    const e = new Date(event.end || event.start).getTime();
    return s <= monthEnd && e >= monthStart;
  }).sort((a, b) => {
    const isAMulti = isMultiDayEvent(a);
    const isBMulti = isMultiDayEvent(b);
    
    // PRIORITÀ 1: Multi-day sopra i Single-day
    if (isAMulti && !isBMulti) return -1;
    if (!isAMulti && isBMulti) return 1;
    
    // PRIORITÀ 2: Se entrambi sono multi-day, il più lungo va sopra
    const durA = new Date(a.end || a.start).getTime() - new Date(a.start).getTime();
    const durB = new Date(b.end || b.start).getTime() - new Date(b.start).getTime();
    if (durB !== durA) return durB - durA;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  const lanes = []; // Array di corsie, ogni corsia contiene eventi che non si sovrappongono
  const eventToLane = {};

  filtered.forEach(event => {
    const eventStart = new Date(event.start).getTime();
    const eventEnd = new Date(event.end || event.start).getTime();

    let laneIndex = lanes.findIndex(lane => {
      // Un evento può stare in questa corsia se non interseca NESSUN evento già presente
      return !lane.some(e => {
        const eS = new Date(e.start).getTime();
        const eE = new Date(e.end || e.start).getTime();
        return eventStart <= eE && eventEnd >= eS;
      });
    });

    if (laneIndex === -1) {
      lanes.push([event]);
      laneIndex = lanes.length - 1;
    } else {
      lanes[laneIndex].push(event);
    }
    eventToLane[event.recordid] = laneIndex;
  });

  return { eventToLane, totalLanes: lanes.length, filteredEvents: filtered };
};

const handleMouseEnterWithDelay = (e, event) => {
  // Puliamo eventuali timer residui (sia di entrata che di uscita)
  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

  // Salviamo le coordinate subito (perché l'evento 'e' è sintetico e sparisce)
  const x = e.clientX;
  const y = e.clientY;

  hoverTimeoutRef.current = setTimeout(() => {
    setHoverPosition({ x, y });
    setHoveredEvent(event);
  }, 700); // Ritardo di attivazione
};

const handleMouseLeaveWithDelay = () => {
  // Annulliamo il timer di attivazione se l'utente esce prima dei 700ms
  if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

  // Opzionale: aggiungi un piccolo ritardo prima di chiudere 
  // per permettere movimenti imprecisi
  hoverTimeoutRef.current = setTimeout(() => {
    setHoveredEvent(null);
  }, 100);
};

const renderMonthView = () => {
  const { eventToLane, totalLanes, filteredEvents } = calculateLayout(data.events, dayOffset, daysInMonth, year, month);
  const laneHeight = 28; 
  const headerHeight = 32; 

  // Funzione per gestire il posizionamento del popover
  const handleMouseEnter = (e, event) => {
    setHoveredEvent(event);
    setHoverPosition({ x: e.clientX, y: e.clientY });
  };

  const dayCells = Array.from({ length: dayOffset + daysInMonth }, (_, i) => {
    const dayNumber = i - dayOffset + 1;
    const cellDate = new Date(year, month, dayNumber);
    const cellStartTime = new Date(year, month, dayNumber, 0, 0, 0).getTime();
    const cellEndTime = new Date(year, month, dayNumber, 23, 59, 59).getTime();

    const isToday = cellDate.toDateString() === new Date().toDateString();

    // Conta quanti eventi passano per questo giorno ma sono in una corsia superiore al limite
    const hiddenEventsCount = filteredEvents.filter(e => {
        const lane = eventToLane[e.recordid];
        const eventStart = new Date(e.start).getTime();
        const eventEnd = new Date(e.end || e.start).getTime();
        
        // L'evento passa per questo giorno E la sua corsia è oltre il limite
        return lane >= MAX_VISIBLE_LANES && eventStart <= cellEndTime && eventEnd >= cellStartTime;
    }).length;

    return (
      <div 
        key={i} 
        className="relative border-t border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        style={{ minHeight: '150px' }}
        onDragOver={(e) => { e.preventDefault(); if (dayNumber > 0) e.currentTarget.classList.add("bg-blue-50/50"); }}
        onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50/50")}
        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("bg-blue-50/50"); if (dayNumber > 0) handleDrop(cellDate, undefined); }}
      >
        <div className="p-1 flex justify-between items-center relative z-30 bg-white dark:bg-gray-900">
          <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-gray-500"}`}>
            {dayNumber > 0 ? dayNumber : ""}
          </span>
          {hiddenEventsCount > 0 && (
            <button className="relative z-30 text-[10px] font-bold text-accent bg-accent-foreground hover:bg-accent hover:text-accent-foreground px-1.5 py-0.5 rounded">
              +{hiddenEventsCount}
            </button>
          )}
        </div>
      </div>
    );
  });

  const renderEvents = () => {
    return filteredEvents.map((event) => {
      const lane = eventToLane[event.recordid];
      if (lane >= MAX_VISIBLE_LANES) return null; // Nascondi se supera il limite

      const isFullDay = new Date(event.start).getHours() === 0 && new Date(event.end).getHours() === 0;

      const start = new Date(event.start);
      const end = new Date(event.end || event.start);
      const isMulti = isMultiDayEvent(event);
      const startIndex = Math.max(0, (start.getDate() - 1) + dayOffset);
      const endIndex = Math.min(dayCells.length - 1, (end.getDate() - 1) + dayOffset);

      const segments = [];
      let currentIdx = startIndex;

      while (currentIdx <= endIndex) {
        const rowStart = Math.floor(currentIdx / 7) * 7;
        const rowEnd = rowStart + 6;
        const segmentEnd = Math.min(endIndex, rowEnd);
        const colStart = (currentIdx % 7) + 1;
        const colSpan = (segmentEnd - currentIdx) + 1;
        const rowNum = Math.floor(currentIdx / 7) + 1;
        const isActualStart = currentIdx === startIndex;
        const isActualEnd = segmentEnd === endIndex;

        segments.push(
          <div
            key={`${event.recordid}-${currentIdx}`}
            draggable={!resizingEvent && !event.disabled}
            onMouseEnter={(e) => handleMouseEnterWithDelay(e, event)}
            onMouseLeave={handleMouseLeaveWithDelay}
            onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
            onClick={(e) => {
              e.stopPropagation();
              if (!event.disabled) handleRowClick?.("standard", event.recordid, tableid);
            }}
            className={`absolute h-6 text-[11px] flex items-center px-2 transition-opacity z-20 group
              ${event.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}
              ${!isMulti ? "border border-gray-200 dark:border-gray-700 shadow-sm" : "text-white"}`}
            style={{
              gridColumn: `${colStart} / span ${colSpan}`,
              top: `${(rowNum - 1) * 150 + headerHeight + (lane * laneHeight)}px`,
              left: isActualStart ? '4px' : '0px',
              right: isActualEnd ? '4px' : '0px',
              backgroundColor: isMulti ? (event.color || "#3b82f6") : "#ffffff",
              borderLeft: !isMulti ? `3px solid ${event.color || "#3b82f6"}` : "none",
              borderRadius: isMulti ? `${isActualStart ? '4px' : '0'} ${isActualEnd ? '4px' : '0'} ${isActualEnd ? '4px' : '0'} ${isActualStart ? '4px' : '0'}` : '4px',
              height: `${laneHeight - 2}px`, // Leggermente più piccolo della corsia per dare margine
              zIndex: 20,
              pointerEvents: 'auto',
            }}
          >
            <div className="truncate flex items-center gap-1 w-full select-none">
              {isActualStart && !isFullDay && (
                <span className="font-bold opacity-75 mr-1">
                  {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {!isActualStart && (
                <ArrowRight className="w-3 h-3" />
              )}
              <span className={isMulti ? "font-semibold" : "font-medium"}>{event.title}</span>
              {isActualStart && isMulti && <span className="text-[9px] opacity-70">({getEventDaySpan(event)}g)</span>}
            </div>

            {/* RESIZE HANDLE: Solo laterale (destra) per i giorni, come richiesto */}
            {!event.disabled && isActualEnd && (
              <div
                className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleResizeStart(event, "right", e.clientY, e.clientX);
                }}
              />
            )}
          </div>
        );
        currentIdx = rowEnd + 1;
      }
      return segments;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden relative">
      <div className="grid grid-cols-7 text-center font-bold text-[10px] py-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 uppercase">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d}>{d}</div>)}
      </div>
      
      <div className="relative flex-grow overflow-y-auto">
        <div className="grid grid-cols-7 auto-rows-[150px]">{dayCells}</div>
        <div className="absolute top-0 left-0 w-full grid grid-cols-7 pointer-events-none h-full">{renderEvents()}</div>
      </div>

      {/* COMPONENTE POPOVER */}
      {hoveredEvent && (
        <div 
          className="fixed z-[100] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-64 pointer-events-none"
          style={{ top: hoverPosition.y + 10, left: Math.min(hoverPosition.x + 10, window.innerWidth - 270) }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hoveredEvent.color }} />
            <h4 className="font-bold text-sm truncate">{hoveredEvent.title}</h4>
          </div>
          <div className="text-[11px] space-y-1 text-gray-600 dark:text-gray-400">
            <p><strong>Inizio:</strong> {new Date(hoveredEvent.start).toLocaleString('it-IT')}</p>
            {hoveredEvent.end && <p><strong>Fine:</strong> {new Date(hoveredEvent.end).toLocaleString('it-IT')}</p>}
            {isMultiDayEvent(hoveredEvent) && (
              <p className="text-accent font-semibold mt-1">Durata: {getEventDaySpan(hoveredEvent)} giorni</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

  const renderWeekView = () => {
    const weekDays = []
    const firstDayOfWeek = new Date(currentDate)
    const day = firstDayOfWeek.getDay()
    const diff = firstDayOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    firstDayOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDayOfWeek)
      day.setDate(firstDayOfWeek.getDate() + i)
      weekDays.push(day)
    }

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourHeight = 60 // Fixed height per hour slot

    const singleDayEvents = data.events.filter((event) => !isMultiDayEvent(event))
    const multiDayEvents = data.events.filter((event) => isMultiDayEvent(event))

    // Create segments for multi-day events
    const multiDaySegments: Array<{
      event: (typeof data.events)[0]
      day: Date
      startHour: number
      startMinute: number
      endHour: number
      endMinute: number
    }> = []

    multiDayEvents.forEach((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end || event.start)

      weekDays.forEach((day) => {
        const dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)

        // Check if event covers this day
        if (eventStart <= dayEnd && eventEnd >= dayStart) {
          const isFirstDay = eventStart >= dayStart && eventStart <= dayEnd
          const isLastDay = eventEnd >= dayStart && eventEnd <= dayEnd

          let startHour: number, startMinute: number, endHour: number, endMinute: number

          if (isFirstDay && isLastDay) {
            // Event starts and ends on the same day (shouldn't happen for multi-day, but handle it)
            startHour = eventStart.getHours() !== 0 ? eventStart.getHours() : 8
            startMinute = eventStart.getMinutes() !== 0 ? eventStart.getMinutes() : 0
            endHour = eventEnd.getHours() !== 0 ? eventEnd.getHours() : 17
            endMinute = eventEnd.getMinutes() !== 0 ? eventEnd.getMinutes() : 0
          } else if (isFirstDay) {
            // First day: from event start to 17:00
            startHour = eventStart.getHours() !== 0 ? eventStart.getHours() : 8
            startMinute = eventStart.getMinutes() !== 0 ? eventStart.getMinutes() : 0
            endHour = 17
            endMinute = 0
          } else if (isLastDay) {
            // Last day: from 8:00 to event end
            startHour = 8
            startMinute = 0
            endHour = eventEnd.getHours() !== 0 ? eventEnd.getHours() : 17
            endMinute = eventEnd.getMinutes() !== 0 ? eventEnd.getMinutes() : 0
          } else {
            // Intermediate day: from 8:00 to 17:00
            startHour = 8
            startMinute = 0
            endHour = 17
            endMinute = 0
          }

          multiDaySegments.push({
            event,
            day,
            startHour,
            startMinute,
            endHour,
            endMinute,
          })
        }
      })
    })

    return (
      <div className="flex flex-col h-full">
        {/* Header with days */}
        <div
          className="grid border-b border-gray-200 dark:border-gray-700"
          style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
        >
          <div className="p-2 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold text-sm">
            Ora
          </div>
          {weekDays.map((day) => {
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <div
                key={day.toISOString()}
                className={`p-2 text-center border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold text-sm ${isToday ? "text-accent" : ""}`}
              >
                <p>{day.toLocaleString("it-IT", { weekday: "short" })}</p>
                <p className="text-lg">{day.getDate()}</p>
              </div>
            )
          })}
        </div>

        <div className="flex-grow overflow-auto">
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
            {hours.map((hour) => (
              <React.Fragment key={`hour-row-${hour}`}>
                <div className="p-2 border-r border-b border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-900 text-gray-500">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {weekDays.map((day) => {
                  const slotStart = new Date(day)
                  slotStart.setHours(hour, 0, 0, 0)

                  const eventsForSlot = singleDayEvents.filter((event) => {
                    const eventStart = new Date(event.start)
                    const eventStartHour = eventStart.getHours()
                    const eventStartDay = new Date(eventStart)
                    eventStartDay.setHours(0, 0, 0, 0)
                    const slotDay = new Date(day)
                    slotDay.setHours(0, 0, 0, 0)

                    return eventStartHour === hour && eventStartDay.getTime() === slotDay.getTime()
                  })

                  const segmentsStartingInSlot = multiDaySegments.filter((segment) => {
                    const segmentDay = new Date(segment.day)
                    segmentDay.setHours(0, 0, 0, 0)
                    const slotDay = new Date(day)
                    slotDay.setHours(0, 0, 0, 0)

                    return segmentDay.getTime() === slotDay.getTime() && segment.startHour === hour
                  })

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="relative border-b border-r border-gray-200 dark:border-gray-700"
                      style={{ height: `${hourHeight}px` }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.add("bg-blue-50")
                      }}
                      onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50")}
                      onDrop={(e) => {
                        e.preventDefault()
                        handleDrop(day, hour)
                        e.currentTarget.classList.remove("bg-blue-50")
                      }}
                    >
                      {/* Single-day events */}
                      {eventsForSlot.map((event) => {
                        const durationHours = getEventDurationHours(event)
                        const eventHeight = Math.max(durationHours * hourHeight, 40)

                        return (
                          <div
                            key={`${event.recordid}-${event.start}-${day.toISOString()}-${hour}`}
                            draggable={!resizingEvent && !event.disabled}
                            onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
                            onClick={() => !event.disabled && handleRowClick?.("standard", event.recordid, tableid)}
                            className="absolute left-1 right-1 group p-1.5 text-xs cursor-pointer select-none hover:opacity-80 transition-opacity rounded"
                            style={{
                              height: `${eventHeight}px`,
                              backgroundColor: event.color || "#3b82f6",
                              opacity: draggedEvent?.recordid === event.recordid ? 0.5 : event.disabled ? 0.8 : 1,
                              cursor: event.disabled
                                ? "not-allowed"
                                : resizingEvent
                                  ? resizingEvent.handle === "right"
                                    ? "ew-resize"
                                    : "ns-resize"
                                  : "pointer",
                              zIndex: 10,
                              pointerEvents: event.disabled ? "none" : "auto",
                            }}
                          >
                            {!event.disabled && (
                              <div
                                className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t"
                                onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
                              />
                            )}

                            <p className="font-bold truncate text-white">{event.title}</p>
                            <p className="text-xs text-white">
                              {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {event.end &&
                                ` - ${new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                            </p>

                            {!event.disabled && (
                              <div
                                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-b"
                                onMouseDown={(e) => handleResizeStart(event, "bottom", e.clientY, e.clientX)}
                              />
                            )}
                          </div>
                        )
                      })}

                      {segmentsStartingInSlot.map((segment) => {
                        const startMinutes = segment.startHour * 60 + segment.startMinute
                        const endMinutes = segment.endHour * 60 + segment.endMinute
                        const durationMinutes = endMinutes - startMinutes

                        // Calculate position relative to the start of this hour slot
                        const minutesIntoHour = segment.startMinute
                        const topPosition = (minutesIntoHour / 60) * hourHeight
                        const height = Math.max((durationMinutes / 60) * hourHeight, 40)

                        const position = getEventPositionInSpan(segment.event, segment.day)
                        const positionStyles = getEventPositionStyles(position)

                        return (
                          <div
                            key={`${segment.event.recordid}-${segment.event.start}-${segment.day.toISOString()}-segment`}
                            draggable={!resizingEvent && !segment.event.disabled}
                            onDragStart={() =>
                              !resizingEvent && !segment.event.disabled && handleDragStart(segment.event)
                            }
                            onClick={() =>
                              !segment.event.disabled && handleRowClick?.("standard", segment.event.recordid, tableid)
                            }
                            className="absolute left-1 right-1 group p-1.5 text-xs cursor-pointer select-none hover:opacity-80 transition-opacity"
                            style={{
                              top: `${topPosition}px`,
                              height: `${height}px`,
                              ...positionStyles,
                              backgroundColor: segment.event.color || "#3b82f6",
                              opacity:
                                draggedEvent?.recordid === segment.event.recordid
                                  ? 0.5
                                  : segment.event.disabled
                                    ? 0.8
                                    : 1,
                              cursor: segment.event.disabled
                                ? "not-allowed"
                                : resizingEvent
                                  ? resizingEvent.handle === "right"
                                    ? "ew-resize"
                                    : "ns-resize"
                                  : "pointer",
                              zIndex: 10,
                              pointerEvents: segment.event.disabled ? "none" : "auto",
                            }}
                          >
                            {!segment.event.disabled && (position === "first" || position === "single") && (
                              <div
                                className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                                style={{
                                  borderTopLeftRadius: "0.375rem",
                                  borderTopRightRadius: "0.375rem",
                                  borderBottomLeftRadius: "0",
                                  borderBottomRightRadius: "0",
                                }}
                                onMouseDown={(e) => handleResizeStart(segment.event, "top", e.clientY, e.clientX)}
                              />
                            )}

                            <p className="font-bold truncate text-white">
                              {segment.event.title}
                              {position === "middle" && <span className="ml-1">→</span>}
                            </p>
                            <p className="text-xs text-white">
                              {segment.startHour.toString().padStart(2, "0")}:
                              {segment.startMinute.toString().padStart(2, "0")} -{" "}
                              {segment.endHour.toString().padStart(2, "0")}:
                              {segment.endMinute.toString().padStart(2, "0")}
                            </p>

                            {!segment.event.disabled && (position === "last" || position === "single") && (
                              <>
                                <div
                                  className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                                  style={{
                                    borderTopLeftRadius: "0",
                                    borderTopRightRadius: "0",
                                    borderBottomLeftRadius: "0.375rem",
                                    borderBottomRightRadius: "0.375rem",
                                  }}
                                  onMouseDown={(e) => handleResizeStart(segment.event, "bottom", e.clientY, e.clientX)}
                                />
                                <div
                                  className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30"
                                  style={{
                                    borderTopLeftRadius: "0",
                                    borderTopRightRadius: "0.375rem",
                                    borderBottomLeftRadius: "0.375rem",
                                    borderBottomRightRadius: "0",
                                  }}
                                  onMouseDown={(e) => handleResizeStart(segment.event, "right", e.clientY, e.clientX)}
                                />
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourHeight = 64 // Fixed height per hour slot

    const eventsForDay = data.events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end || event.start)
      const currentDayStart = new Date(currentDate)
      currentDayStart.setHours(0, 0, 0, 0)
      const currentDayEnd = new Date(currentDate)
      currentDayEnd.setHours(23, 59, 59, 999)

      return eventStart < currentDayEnd && eventEnd > currentDayStart
    })

    const processedEvents: Array<{
      event: any
      segment: {
        startHour: number
        endHour: number
        dayIndex: number
        isFirst: boolean
        isLast: boolean
      }
    }> = []

    eventsForDay.forEach((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end || event.start)
      const currentDayStart = new Date(currentDate)
      currentDayStart.setHours(0, 0, 0, 0)
      const currentDayEnd = new Date(currentDate)
      currentDayEnd.setHours(23, 59, 59, 999)

      const isMultiDay =
        eventEnd.getDate() !== eventStart.getDate() ||
        eventEnd.getMonth() !== eventStart.getMonth() ||
        eventEnd.getFullYear() !== eventStart.getFullYear()

      if (isMultiDay) {
        const startOfDay = new Date(currentDate)
        startOfDay.setHours(8, 0, 0, 0)
        const endOfDay = new Date(currentDate)
        endOfDay.setHours(17, 0, 0, 0)

        const segmentStart = eventStart > currentDayStart ? eventStart : startOfDay
        const segmentEnd = eventEnd < currentDayEnd ? eventEnd : endOfDay

        const isFirst = eventStart >= currentDayStart && eventStart <= currentDayEnd
        const isLast = eventEnd >= currentDayStart && eventEnd <= currentDayEnd

        processedEvents.push({
          event,
          segment: {
            startHour: segmentStart.getHours() + segmentStart.getMinutes() / 60,
            endHour: segmentEnd.getHours() + segmentEnd.getMinutes() / 60,
            dayIndex: 0,
            isFirst,
            isLast,
          },
        })
      } else {
        processedEvents.push({
          event,
          segment: {
            startHour: eventStart.getHours() + eventStart.getMinutes() / 60,
            endHour: eventEnd.getHours() + eventEnd.getMinutes() / 60,
            dayIndex: 0,
            isFirst: true,
            isLast: true,
          },
        })
      }
    })

    return (
      <div className="flex h-full overflow-auto">
        <div className="w-20 text-right pr-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {hours.map((hour) => (
            <div key={hour} className="flex items-start justify-end pt-1" style={{ height: `${hourHeight}px` }}>
              <span className="text-xs text-gray-500 dark:text-gray-400">{hour.toString().padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
        <div className="relative flex-grow">
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-gray-200 dark:border-gray-700"
              style={{ height: `${hourHeight}px` }}
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add("bg-blue-50", "dark:bg-blue-900/20")
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("bg-blue-50", "dark:bg-blue-900/20")
              }}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(currentDate, hour)
                e.currentTarget.classList.remove("bg-blue-50", "dark:bg-blue-900/20")
              }}
            ></div>
          ))}
          <div className="absolute inset-0 pointer-events-none">
            {processedEvents.map(({ event, segment }) => {
              const topPosition = segment.startHour * hourHeight
              const height = Math.max((segment.endHour - segment.startHour) * hourHeight, 40)

              const borderRadiusStyle = {
                borderTopLeftRadius: segment.isFirst ? "0.375rem" : "0",
                borderTopRightRadius: segment.isFirst ? "0.375rem" : "0",
                borderBottomLeftRadius: segment.isLast ? "0.375rem" : "0",
                borderBottomRightRadius: segment.isLast ? "0.375rem" : "0",
              }

              return (
                <div
                  key={`${event.recordid}-${event.start}-day-${segment.dayIndex}`}
                  draggable={!resizingEvent && !event.disabled}
                  onDragStart={(e) => {
                    if (!event.disabled) {
                      e.currentTarget.style.pointerEvents = "auto"
                      !resizingEvent && handleDragStart(event)
                    }
                  }}
                  onClick={() => !event.disabled && handleRowClick?.("standard", event.recordid, tableid)}
                  className="absolute group p-2 text-xs cursor-pointer text-white shadow pointer-events-auto"
                  style={{
                    backgroundColor: event.color || "#3b82f6",
                    top: `${topPosition}px`,
                    height: `${height}px`,
                    left: "8px",
                    width: "calc(80% - 8px)",
                    opacity: draggedEvent?.recordid === event.recordid ? 0.5 : event.disabled ? 0.8 : 1,
                    cursor: event.disabled ? "not-allowed" : resizingEvent ? "ns-resize" : "pointer",
                    zIndex: 10,
                    ...borderRadiusStyle,
                    pointerEvents: event.disabled ? "none" : "auto",
                  }}
                >
                  {!event.disabled && segment.isFirst && (
                    <div
                      className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t pointer-events-auto"
                      onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
                    />
                  )}

                  <p className="font-bold truncate">{event.title}</p>
                  <p className="text-xs">
                    {new Date(event.start).getHours() !== 0 ? new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} -{" "}
                    {event.end
                      ? new Date(event.end).getHours() !== 0 ? new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""
                      : ""}
                  </p>

                  {!event.disabled && segment.isLast && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-b pointer-events-auto"
                      onMouseDown={(e) => handleResizeStart(event, "bottom", e.clientY, e.clientX)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <GenericComponent loading={loading} error={error}>
      {(response) => (
      <div ref={calendarRef} id="calendar-records-view" className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <CalendarHeader
          title={renderHeaderTitle()}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPrevious={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          calendarType={calendarType}
          onCalendarTypeChange={onCalendarTypeChange}
          extraEventTables={data.extraEventTables}
          selectedExtraTable={selectedExtraTable}
          onExtraTableChange={handleExtraTableChange}
          onPrint={handlePrint}
        />

        <main className="flex-grow overflow-auto">
          {viewMode === "month" && renderMonthView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "day" && renderDayView()}
        </main>

        <footer className="text-right p-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <span className="font-medium">Eventi totali:</span> {data.events.length}
        </footer>
      </div>
      )}
    </GenericComponent>
  )
}
