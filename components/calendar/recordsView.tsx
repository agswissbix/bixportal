"use client"
import { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import type { CalendarChildProps } from "./calendarBase"
import {
  getEventDaySpan,
  isMultiDayEvent,
} from "./calendarHelpers"
import React from "react"
import { useRecordsStore } from "../records/recordsStore"
import CalendarHeader from "./calendarHeader"
import GenericComponent from "../genericComponent"
import { ArrowRight } from "lucide-react"

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
            <button 
              onClick={() => {setViewMode("day"); setCurrentDate(cellDate);}}
              className="relative z-30 text-[10px] font-bold text-accent bg-accent-foreground hover:bg-accent hover:text-accent-foreground px-1.5 py-0.5 rounded">
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
              backgroundColor: isMulti ? (event.color || "#3b82f6") : "#fafafa",
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
            <h4 className="font-bold text-sm">{hoveredEvent.title}</h4>
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
    const weekDays: Date[] = []
    const firstDayOfWeek = new Date(currentDate)
    const dayOfWeek = firstDayOfWeek.getDay()
    const diff = firstDayOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    firstDayOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const d = new Date(firstDayOfWeek)
      d.setDate(firstDayOfWeek.getDate() + i)
      weekDays.push(d)
    }

    const weekStart = new Date(weekDays[0])
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekDays[6])
    weekEnd.setHours(23, 59, 59, 999)

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourHeight = 60
    const laneHeight = 26

    // Helper: check if event is full-day (both start and end at 00:00)
    const isFullDayEvent = (event: any) => {
      const start = new Date(event.start)
      const end = new Date(event.end || event.start)
      return start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0
    }

    // Filter events that overlap with the week
    const weekEvents = data.events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end || event.start)
      return eventStart <= weekEnd && eventEnd >= weekStart
    })

    // Separate full-day events from timed events
    const fullDayEvents = weekEvents.filter(isFullDayEvent)
    const timedEvents = weekEvents.filter((e) => !isFullDayEvent(e))

    // ---------- FULL-DAY EVENTS LAYOUT (like month view) ----------
    const calculateFullDayLayout = () => {
      const sorted = [...fullDayEvents].sort((a, b) => {
        const durA = new Date(a.end || a.start).getTime() - new Date(a.start).getTime()
        const durB = new Date(b.end || b.start).getTime() - new Date(b.start).getTime()
        if (durB !== durA) return durB - durA
        return new Date(a.start).getTime() - new Date(b.start).getTime()
      })

      const lanes: any[][] = []
      const eventToLane: Record<string, number> = {}

      sorted.forEach((event) => {
        const eventStart = new Date(event.start).getTime()
        const eventEnd = new Date(event.end || event.start).getTime()

        let laneIndex = lanes.findIndex((lane) =>
          !lane.some((e) => {
            const eS = new Date(e.start).getTime()
            const eE = new Date(e.end || e.start).getTime()
            return eventStart <= eE && eventEnd >= eS
          })
        )

        if (laneIndex === -1) {
          lanes.push([event])
          laneIndex = lanes.length - 1
        } else {
          lanes[laneIndex].push(event)
        }
        eventToLane[event.recordid] = laneIndex
      })

      return { eventToLane, totalLanes: lanes.length, sortedEvents: sorted }
    }

    const { eventToLane: fullDayEventToLane, totalLanes: fullDayTotalLanes, sortedEvents: sortedFullDayEvents } = calculateFullDayLayout()
    const fullDaySectionHeight = fullDayTotalLanes > 0 ? fullDayTotalLanes * laneHeight + 8 : 0

    // ---------- TIMED EVENTS: Calculate overlapping groups per day ----------
    const calculateTimedEventsLayout = (dayDate: Date) => {
      const dayStart = new Date(dayDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayDate)
      dayEnd.setHours(23, 59, 59, 999)

      // Get all timed events for this day
      const dayEvents = timedEvents.filter((event) => {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)
        return eventStart <= dayEnd && eventEnd >= dayStart
      })

      if (dayEvents.length === 0) return { groups: [], eventPositions: {} }

      // Helper to get effective time range for an event on this day
      const getEffectiveRange = (event: any) => {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)
        const effectiveStart = eventStart < dayStart ? dayStart : eventStart
        const effectiveEnd = eventEnd > dayEnd ? dayEnd : eventEnd
        return {
          startMin: effectiveStart.getHours() * 60 + effectiveStart.getMinutes(),
          endMin: effectiveEnd.getHours() * 60 + effectiveEnd.getMinutes()
        }
      }

      // Check if two events overlap
      const eventsOverlap = (e1: any, e2: any) => {
        const r1 = getEffectiveRange(e1)
        const r2 = getEffectiveRange(e2)
        return r1.startMin <= r2.endMin && r1.endMin >= r2.startMin
      }

      // Sort by start time, then by duration (longer first)
      const sorted = [...dayEvents].sort((a, b) => {
        const rA = getEffectiveRange(a)
        const rB = getEffectiveRange(b)
        if (rA.startMin !== rB.startMin) return rA.startMin - rB.startMin
        // Longer events first (they span more columns)
        return (rB.endMin - rB.startMin) - (rA.endMin - rA.startMin)
      })

      // Assign columns using a greedy algorithm
      const eventPositions: Record<string, { column: number; totalColumns: number }> = {}
      const columns: any[][] = []

      sorted.forEach((event) => {
        const range = getEffectiveRange(event)

        // Find first column where this event doesn't overlap with any existing event
        let colIndex = -1
        for (let c = 0; c < columns.length; c++) {
          const hasOverlap = columns[c].some((e) => eventsOverlap(event, e))
          if (!hasOverlap) {
            colIndex = c
            break
          }
        }

        if (colIndex === -1) {
          // Need a new column
          columns.push([event])
          colIndex = columns.length - 1
        } else {
          columns[colIndex].push(event)
        }

        eventPositions[event.recordid] = { column: colIndex, totalColumns: 0 }
      })

      // Now we need to determine totalColumns for each event
      // An event's totalColumns should be based on concurrent events at its time slot
      sorted.forEach((event) => {
        const range = getEffectiveRange(event)
        
        // Find all events that overlap with this one
        const overlapping = sorted.filter((e) => eventsOverlap(event, e))
        
        // The number of columns needed is the max column index + 1 among overlapping events
        let maxCol = 0
        overlapping.forEach((e) => {
          const pos = eventPositions[e.recordid]
          if (pos && pos.column > maxCol) {
            maxCol = pos.column
          }
        })
        
        eventPositions[event.recordid].totalColumns = maxCol + 1
      })

      return { groups: [], eventPositions }
    }

    // Precompute layout for each day
    const dayLayouts = weekDays.map((day) => calculateTimedEventsLayout(day))

    // ---------- RENDER FULL-DAY EVENTS ----------
    const renderFullDayEvents = () => {
      return sortedFullDayEvents.map((event) => {
        const lane = fullDayEventToLane[event.recordid]
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)

        // Calculate start and end day index within the week (0-6)
        let startDayIndex = 0
        let endDayIndex = 6

        for (let i = 0; i < 7; i++) {
          const dayStart = new Date(weekDays[i])
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(weekDays[i])
          dayEnd.setHours(23, 59, 59, 999)

          if (eventStart >= dayStart && eventStart <= dayEnd) {
            startDayIndex = i
          }
          if (eventEnd >= dayStart && eventEnd <= dayEnd) {
            endDayIndex = i
          }
        }

        // Clamp to week boundaries
        if (eventStart < weekStart) startDayIndex = 0
        if (eventEnd > weekEnd) endDayIndex = 6

        const colStart = startDayIndex + 2 // +2 because column 1 is the "Ora" column
        const colSpan = endDayIndex - startDayIndex + 1
        const isActualStart = eventStart >= weekStart
        const isActualEnd = eventEnd <= weekEnd

        return (
          <div
            key={`fullday-${event.recordid}`}
            draggable={!resizingEvent && !event.disabled}
            onMouseEnter={(e) => handleMouseEnterWithDelay(e, event)}
            onMouseLeave={handleMouseLeaveWithDelay}
            onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
            onClick={(e) => {
              e.stopPropagation()
              if (!event.disabled) handleRowClick?.("standard", event.recordid, tableid)
            }}
            className={`absolute h-6 text-[11px] flex items-center px-2 transition-opacity z-20 group text-white
              ${event.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
            style={{
              gridColumn: `${colStart} / span ${colSpan}`,
              top: `${lane * laneHeight + 4}px`,
              left: isActualStart ? "4px" : "0px",
              right: isActualEnd ? "4px" : "0px",
              backgroundColor: event.color || "#3b82f6",
              borderRadius: `${isActualStart ? "4px" : "0"} ${isActualEnd ? "4px" : "0"} ${isActualEnd ? "4px" : "0"} ${isActualStart ? "4px" : "0"}`,
              height: `${laneHeight - 2}px`,
              pointerEvents: "auto",
            }}
          >
            <div className="truncate flex items-center gap-1 w-full select-none">
              {!isActualStart && <ArrowRight className="w-3 h-3 flex-shrink-0" />}
              <span className="font-semibold">{event.title}</span>
              {isActualStart && colSpan > 1 && <span className="text-[9px] opacity-70">({colSpan}g)</span>}
            </div>
            {!event.disabled && isActualEnd && (
              <div
                className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleResizeStart(event, "right", e.clientY, e.clientX)
                }}
              />
            )}
          </div>
        )
      })
    }

    // ---------- RENDER TIMED EVENTS FOR A DAY ----------
    const renderTimedEventsForDay = (day: Date, dayIndex: number) => {
      const { eventPositions } = dayLayouts[dayIndex]
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      return timedEvents
        .filter((event) => {
          const eventStart = new Date(event.start)
          const eventEnd = new Date(event.end || event.start)
          return eventStart <= dayEnd && eventEnd >= dayStart
        })
        .map((event) => {
          const eventStart = new Date(event.start)
          const eventEnd = new Date(event.end || event.start)

          // Clamp to this day
          const effectiveStart = eventStart < dayStart ? dayStart : eventStart
          const effectiveEnd = eventEnd > dayEnd ? dayEnd : eventEnd

          const startHour = effectiveStart.getHours() + effectiveStart.getMinutes() / 60
          const endHour = effectiveEnd.getHours() + effectiveEnd.getMinutes() / 60
          const durationHours = Math.max(endHour - startHour, 0.5)

          const topPosition = startHour * hourHeight
          const height = Math.max(durationHours * hourHeight, 30)

          const position = eventPositions[event.recordid] || { column: 0, totalColumns: 1 }
          const width = position.totalColumns > 1 ? `calc((100% - 8px) / ${position.totalColumns})` : "calc(100% - 8px)"
          const leftOffset = position.totalColumns > 1 ? `calc(4px + (100% - 8px) / ${position.totalColumns} * ${position.column})` : "4px"

          const isFirstDay = eventStart >= dayStart && eventStart <= dayEnd
          const isLastDay = eventEnd >= dayStart && eventEnd <= dayEnd

          return (
            <div
              key={`timed-${event.recordid}-${day.toISOString()}`}
              draggable={!resizingEvent && !event.disabled}
              onMouseEnter={(e) => handleMouseEnterWithDelay(e, event)}
              onMouseLeave={handleMouseLeaveWithDelay}
              onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
              onClick={() => !event.disabled && handleRowClick?.("standard", event.recordid, tableid)}
              className="absolute group p-1.5 text-xs cursor-pointer select-none hover:opacity-80 transition-opacity rounded"
              style={{
                top: `${topPosition}px`,
                height: `${height}px`,
                width,
                left: leftOffset,
                backgroundColor: event.color || "#3b82f6",
                opacity: draggedEvent?.recordid === event.recordid ? 0.5 : event.disabled ? 0.8 : 1,
                cursor: event.disabled ? "not-allowed" : resizingEvent ? "ns-resize" : "pointer",
                zIndex: 10,
                pointerEvents: event.disabled ? "none" : "auto",
              }}
            >
              {!event.disabled && isFirstDay && (
                <div
                  className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t"
                  onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
                />
              )}

              <p className="font-bold text-white text-[10px]">{event.title}</p>
              {height >= 40 && (
                <p className="text-[9px] text-white opacity-80">
                  {effectiveStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {effectiveEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}

              {!event.disabled && isLastDay && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-b"
                  onMouseDown={(e) => handleResizeStart(event, "bottom", e.clientY, e.clientX)}
                />
              )}
            </div>
          )
        })
    }

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

        {/* Full-day events section (like month view) */}
        {fullDayTotalLanes > 0 && (
          <div
            className="relative border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
            style={{ minHeight: `${fullDaySectionHeight}px` }}
          >
            <div
              className="grid h-full"
              style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
            >
              <div className="p-2 border-r border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex items-center justify-center">
                Tutto il giorno
              </div>
              {weekDays.map((day) => (
                <div
                  key={`fullday-cell-${day.toISOString()}`}
                  className="border-r border-gray-200 dark:border-gray-700 relative"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add("bg-blue-50/50")
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50/50")}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove("bg-blue-50/50")
                    handleDrop(day, undefined)
                  }}
                />
              ))}
            </div>
            {/* Overlay for full-day events */}
            <div
              className="absolute top-0 left-0 w-full h-full grid pointer-events-none"
              style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
            >
              {renderFullDayEvents()}
            </div>
          </div>
        )}

        {/* Timed events grid */}
        <div className="flex-grow overflow-auto">
          <div className="flex">
            {/* Hour labels column */}
            <div className="w-20 flex-shrink-0">
              {hours.map((hour) => (
                <div
                  key={`hour-label-${hour}`}
                  className="p-2 border-r border-b border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-900 text-gray-500"
                  style={{ height: `${hourHeight}px` }}
                >
                  {hour.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns with events */}
            {weekDays.map((day, dayIndex) => (
              <div key={`day-col-${day.toISOString()}`} className="flex-1 relative">
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="border-b border-r border-gray-200 dark:border-gray-700"
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
                  />
                ))}
                {/* Events overlay for this day */}
                <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                  {renderTimedEventsForDay(day, dayIndex)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popover for hovered events */}
        {hoveredEvent && (
          <div
            className="fixed z-[100] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-64 pointer-events-none"
            style={{ top: hoverPosition.y + 10, left: Math.min(hoverPosition.x + 10, window.innerWidth - 270) }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hoveredEvent.color }} />
              <h4 className="font-bold text-sm">{hoveredEvent.title}</h4>
            </div>
            <div className="text-[11px] space-y-1 text-gray-600 dark:text-gray-400">
              <p><strong>Inizio:</strong> {new Date(hoveredEvent.start).toLocaleString("it-IT")}</p>
              {hoveredEvent.end && <p><strong>Fine:</strong> {new Date(hoveredEvent.end).toLocaleString("it-IT")}</p>}
              {isMultiDayEvent(hoveredEvent) && (
                <p className="text-accent font-semibold mt-1">Durata: {getEventDaySpan(hoveredEvent)} giorni</p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourHeight = 64
    const laneHeight = 28

    const currentDayStart = new Date(currentDate)
    currentDayStart.setHours(0, 0, 0, 0)
    const currentDayEnd = new Date(currentDate)
    currentDayEnd.setHours(23, 59, 59, 999)

    // Helper: check if event is full-day (both start and end at 00:00)
    const isFullDayEvent = (event: any) => {
      const start = new Date(event.start)
      const end = new Date(event.end || event.start)
      return start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0
    }

    // Filter events for this day
    const eventsForDay = data.events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end || event.start)
      return eventStart <= currentDayEnd && eventEnd >= currentDayStart
    })

    // Separate full-day from timed events
    const fullDayEvents = eventsForDay.filter(isFullDayEvent)
    const timedEvents = eventsForDay.filter((e) => !isFullDayEvent(e))

    // ---------- FULL-DAY EVENTS LAYOUT ----------
    const calculateFullDayLayout = () => {
      const sorted = [...fullDayEvents].sort((a, b) => {
        const durA = new Date(a.end || a.start).getTime() - new Date(a.start).getTime()
        const durB = new Date(b.end || b.start).getTime() - new Date(b.start).getTime()
        if (durB !== durA) return durB - durA
        return new Date(a.start).getTime() - new Date(b.start).getTime()
      })

      const lanes: any[][] = []
      const eventToLane: Record<string, number> = {}

      sorted.forEach((event) => {
        const eventStart = new Date(event.start).getTime()
        const eventEnd = new Date(event.end || event.start).getTime()

        let laneIndex = lanes.findIndex((lane) =>
          !lane.some((e) => {
            const eS = new Date(e.start).getTime()
            const eE = new Date(e.end || e.start).getTime()
            return eventStart <= eE && eventEnd >= eS
          })
        )

        if (laneIndex === -1) {
          lanes.push([event])
          laneIndex = lanes.length - 1
        } else {
          lanes[laneIndex].push(event)
        }
        eventToLane[event.recordid] = laneIndex
      })

      return { eventToLane, totalLanes: lanes.length, sortedEvents: sorted }
    }

    const { eventToLane: fullDayEventToLane, totalLanes: fullDayTotalLanes, sortedEvents: sortedFullDayEvents } = calculateFullDayLayout()
    const fullDaySectionHeight = fullDayTotalLanes > 0 ? fullDayTotalLanes * laneHeight + 8 : 0

    // ---------- TIMED EVENTS: Calculate overlapping layout ----------
    const calculateTimedEventsLayout = () => {
      if (timedEvents.length === 0) return { eventPositions: {} }

      const getEffectiveRange = (event: any) => {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)
        const effectiveStart = eventStart < currentDayStart ? currentDayStart : eventStart
        const effectiveEnd = eventEnd > currentDayEnd ? currentDayEnd : eventEnd
        return {
          startMin: effectiveStart.getHours() * 60 + effectiveStart.getMinutes(),
          endMin: effectiveEnd.getHours() * 60 + effectiveEnd.getMinutes()
        }
      }

      const eventsOverlap = (e1: any, e2: any) => {
        const r1 = getEffectiveRange(e1)
        const r2 = getEffectiveRange(e2)
        return r1.startMin <= r2.endMin && r1.endMin >= r2.startMin
      }

      const sorted = [...timedEvents].sort((a, b) => {
        const rA = getEffectiveRange(a)
        const rB = getEffectiveRange(b)
        if (rA.startMin !== rB.startMin) return rA.startMin - rB.startMin
        return (rB.endMin - rB.startMin) - (rA.endMin - rA.startMin)
      })

      const eventPositions: Record<string, { column: number; totalColumns: number }> = {}
      const columns: any[][] = []

      sorted.forEach((event) => {
        let colIndex = -1
        for (let c = 0; c < columns.length; c++) {
          const hasOverlap = columns[c].some((e) => eventsOverlap(event, e))
          if (!hasOverlap) {
            colIndex = c
            break
          }
        }

        if (colIndex === -1) {
          columns.push([event])
          colIndex = columns.length - 1
        } else {
          columns[colIndex].push(event)
        }

        eventPositions[event.recordid] = { column: colIndex, totalColumns: 0 }
      })

      sorted.forEach((event) => {
        const overlapping = sorted.filter((e) => eventsOverlap(event, e))
        let maxCol = 0
        overlapping.forEach((e) => {
          const pos = eventPositions[e.recordid]
          if (pos && pos.column > maxCol) {
            maxCol = pos.column
          }
        })
        eventPositions[event.recordid].totalColumns = maxCol + 1
      })

      return { eventPositions }
    }

    const { eventPositions } = calculateTimedEventsLayout()

    // ---------- RENDER FULL-DAY EVENTS ----------
    const renderFullDayEvents = () => {
      return sortedFullDayEvents.map((event) => {
        const lane = fullDayEventToLane[event.recordid]
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)
        const isActualStart = eventStart >= currentDayStart
        const isActualEnd = eventEnd <= currentDayEnd

        return (
          <div
            key={`fullday-${event.recordid}`}
            draggable={!resizingEvent && !event.disabled}
            onMouseEnter={(e) => handleMouseEnterWithDelay(e, event)}
            onMouseLeave={handleMouseLeaveWithDelay}
            onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
            onClick={(e) => {
              e.stopPropagation()
              if (!event.disabled) handleRowClick?.("standard", event.recordid, tableid)
            }}
            className={`absolute h-6 text-[11px] flex items-center px-2 transition-opacity z-20 group text-white
              ${event.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
            style={{
              top: `${lane * laneHeight + 4}px`,
              left: "4px",
              right: "4px",
              backgroundColor: event.color || "#3b82f6",
              borderRadius: `${isActualStart ? "4px" : "0"} ${isActualEnd ? "4px" : "0"} ${isActualEnd ? "4px" : "0"} ${isActualStart ? "4px" : "0"}`,
              height: `${laneHeight - 2}px`,
              pointerEvents: "auto",
            }}
          >
            <div className="truncate flex items-center gap-1 w-full select-none">
              {!isActualStart && <ArrowRight className="w-3 h-3 flex-shrink-0" />}
              <span className="font-semibold">{event.title}</span>
              {isMultiDayEvent(event) && <span className="text-[9px] opacity-70">({getEventDaySpan(event)}g)</span>}
            </div>
            {!event.disabled && isActualEnd && (
              <div
                className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleResizeStart(event, "right", e.clientY, e.clientX)
                }}
              />
            )}
          </div>
        )
      })
    }

    // ---------- RENDER TIMED EVENTS ----------
    const renderTimedEvents = () => {
      return timedEvents.map((event) => {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)

        const effectiveStart = eventStart < currentDayStart ? currentDayStart : eventStart
        const effectiveEnd = eventEnd > currentDayEnd ? currentDayEnd : eventEnd

        const startHour = effectiveStart.getHours() + effectiveStart.getMinutes() / 60
        const endHour = effectiveEnd.getHours() + effectiveEnd.getMinutes() / 60
        const durationHours = Math.max(endHour - startHour, 0.5)

        const topPosition = startHour * hourHeight
        const height = Math.max(durationHours * hourHeight, 40)

        const position = eventPositions[event.recordid] || { column: 0, totalColumns: 1 }
        const width = position.totalColumns > 1 ? `calc((100% - 16px) / ${position.totalColumns})` : "calc(100% - 16px)"
        const leftOffset = position.totalColumns > 1 ? `calc(8px + (100% - 16px) / ${position.totalColumns} * ${position.column})` : "8px"

        const isFirst = eventStart >= currentDayStart && eventStart <= currentDayEnd
        const isLast = eventEnd >= currentDayStart && eventEnd <= currentDayEnd

        return (
          <div
            key={`timed-${event.recordid}`}
            draggable={!resizingEvent && !event.disabled}
            onMouseEnter={(e) => handleMouseEnterWithDelay(e, event)}
            onMouseLeave={handleMouseLeaveWithDelay}
            onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
            onClick={() => !event.disabled && handleRowClick?.("standard", event.recordid, tableid)}
            className="absolute group p-2 text-xs cursor-pointer text-white shadow pointer-events-auto rounded"
            style={{
              backgroundColor: event.color || "#3b82f6",
              top: `${topPosition}px`,
              height: `${height}px`,
              left: leftOffset,
              width,
              opacity: draggedEvent?.recordid === event.recordid ? 0.5 : event.disabled ? 0.8 : 1,
              cursor: event.disabled ? "not-allowed" : resizingEvent ? "ns-resize" : "pointer",
              zIndex: 10,
              pointerEvents: event.disabled ? "none" : "auto",
            }}
          >
            {!event.disabled && isFirst && (
              <div
                className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t pointer-events-auto"
                onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
              />
            )}

            <p className="font-bold">{event.title}</p>
            {height >= 50 && (
              <p className="text-[10px] opacity-90">
                {effectiveStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {" - "}
                {effectiveEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}

            {!event.disabled && isLast && (
              <div
                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-b pointer-events-auto"
                onMouseDown={(e) => handleResizeStart(event, "bottom", e.clientY, e.clientX)}
              />
            )}
          </div>
        )
      })
    }

    return (
      <div className="flex flex-col h-full">
        {/* Full-day events section */}
        {fullDayTotalLanes > 0 && (
          <div
            className="relative border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
            style={{ minHeight: `${fullDaySectionHeight}px` }}
          >
            <div className="flex h-full">
              <div className="w-20 text-right pr-2 border-r border-gray-200 dark:border-gray-700 flex items-center justify-end">
                <span className="text-xs text-gray-500 dark:text-gray-400">Tutto il giorno</span>
              </div>
              <div
                className="flex-grow relative"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add("bg-blue-50/50")
                }}
                onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50/50")}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove("bg-blue-50/50")
                  handleDrop(currentDate, undefined)
                }}
              >
                {renderFullDayEvents()}
              </div>
            </div>
          </div>
        )}

        {/* Timed events grid */}
        <div className="flex flex-grow overflow-auto">
          <div className="w-20 text-right pr-2 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
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
              />
            ))}
            <div className="absolute inset-0 pointer-events-none">
              {renderTimedEvents()}
            </div>
          </div>
        </div>

        {/* Popover for hovered events */}
        {hoveredEvent && (
          <div
            className="fixed z-[100] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-64 pointer-events-none"
            style={{ top: hoverPosition.y + 10, left: Math.min(hoverPosition.x + 10, window.innerWidth - 270) }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hoveredEvent.color }} />
              <h4 className="font-bold text-sm">{hoveredEvent.title}</h4>
            </div>
            <div className="text-[11px] space-y-1 text-gray-600 dark:text-gray-400">
              <p><strong>Inizio:</strong> {new Date(hoveredEvent.start).toLocaleString("it-IT")}</p>
              {hoveredEvent.end && <p><strong>Fine:</strong> {new Date(hoveredEvent.end).toLocaleString("it-IT")}</p>}
              {isMultiDayEvent(hoveredEvent) && (
                <p className="text-accent font-semibold mt-1">Durata: {getEventDaySpan(hoveredEvent)} giorni</p>
              )}
            </div>
          </div>
        )}
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
