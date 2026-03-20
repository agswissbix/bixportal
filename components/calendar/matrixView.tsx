"use client"

import React, { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import type { CalendarChildProps } from "./calendarBase"
import {
  getEventDaySpan,
  getEventDurationHours,
  isMultiDayEvent,
  getEventPositionInSpan,
  getEventPositionStyles,
} from "./calendarHelpers"
import { ArrowRight } from "lucide-react"
import GenericComponent from "../genericComponent"
import { useRecordsStore } from "../records/recordsStore"
import CalendarHeader from "./calendarHeader"

interface MatrixViewProps extends CalendarChildProps {
  calendarType: "planner" | "calendar"
  onCalendarTypeChange: (type: "planner" | "calendar") => void
}

export default function MatrixView({
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
}: MatrixViewProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [selectedExtraTable, setSelectedExtraTable] = useState<string>("")
  const { handleRowClick } = useRecordsStore()
  const calendarRef = useRef<HTMLDivElement>(null)

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
          transform: scale(0.65);
          transform-origin: top left;
          width: 153.8%; /* Compensate for 0.65 scale (100/0.65 ≈ 153.8) */
        }
        /* Override global layout constraints */
        html, body {
          height: auto !important;
          overflow: visible !important;
        }
        /* Ensure the container expands */
        #calendar-matrix-view {
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
      handlePrintFn(() => calendarRef.current);
  }



  const events = data.events
  const resources = data.resources || []

  const handleExtraTableChange = (tableId: string) => {
    setSelectedExtraTable(tableId)
    requestEventsForTable(tableId)
  }

  const displayedDays = (() => {
    if (viewMode === "day") {
      return [currentDate]
    } else if (viewMode === "week") {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1 + selectedWeek * 7)
      return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek)
        day.setDate(startOfWeek.getDate() + i)
        return day
      })
    } else {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()
      return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
    }
  })()

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
  }

  const getEventUniqueId = (event: any) => {
    return `${event.recordid}-${event.start}`
  }

  const gridColsStyle = {
    gridTemplateColumns: `minmax(150px, 200px) repeat(${displayedDays.length}, minmax(140px, 1fr))`,
  }

  const handlePrevious = () => {
    if (viewMode === "day") {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 1)
      setCurrentDate(newDate)
    } else if (viewMode === "week") {
      setSelectedWeek(selectedWeek - 1)
    } else {
      const newDate = new Date(currentDate)
      newDate.setMonth(currentDate.getMonth() - 1)
      setCurrentDate(newDate)
    }
  }

  const handleNext = () => {
    if (viewMode === "day") {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 1)
      setCurrentDate(newDate)
    } else if (viewMode === "week") {
      setSelectedWeek(selectedWeek + 1)
    } else {
      const newDate = new Date(currentDate)
      newDate.setMonth(currentDate.getMonth() + 1)
      setCurrentDate(newDate)
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
    setSelectedWeek(0)
  }

  const renderHeaderTitle = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } else if (viewMode === "week") {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1 + selectedWeek * 7)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

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

      return `${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`
    } else {
      return currentDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
    }
  }

  const renderWeekMonthView = () => {
    const laneHeight = 26
    const headerHeight = 50
    const rowHeight = 120

    // Get period boundaries
    const periodStart = new Date(displayedDays[0])
    periodStart.setHours(0, 0, 0, 0)
    const periodEnd = new Date(displayedDays[displayedDays.length - 1])
    periodEnd.setHours(23, 59, 59, 999)

    // ---------- LAYOUT CALCULATION FOR A RESOURCE (like records-view month) ----------
    const calculateResourceLayout = (resourceId: string) => {
      const resourceEvents = events.filter((event) => {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)
        return event.resourceId === resourceId && eventStart <= periodEnd && eventEnd >= periodStart
      })

      // Sort: multi-day first (longer ones first), then by start time
      const sorted = [...resourceEvents].sort((a, b) => {
        const isAMulti = isMultiDayEvent(a)
        const isBMulti = isMultiDayEvent(b)
        
        if (isAMulti && !isBMulti) return -1
        if (!isAMulti && isBMulti) return 1
        
        const durA = new Date(a.end || a.start).getTime() - new Date(a.start).getTime()
        const durB = new Date(b.end || b.start).getTime() - new Date(b.start).getTime()
        if (durB !== durA) return durB - durA

        return new Date(a.start).getTime() - new Date(b.start).getTime()
      })

      // Assign lanes (events that don't overlap can share the same lane)
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

    // Pre-calculate layouts for all resources
    const resourceLayouts = resources.reduce((acc, resource) => {
      acc[resource.id] = calculateResourceLayout(resource.id)
      return acc
    }, {} as Record<string, ReturnType<typeof calculateResourceLayout>>)

    // ---------- RENDER EVENTS FOR A RESOURCE (like month view in records-view) ----------
    const renderEventsForResource = (resourceId: string, resourceIndex: number) => {
      const layout = resourceLayouts[resourceId]
      const numDays = displayedDays.length

      return layout.sortedEvents.map((event) => {
        const lane = layout.eventToLane[event.recordid]
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)
        const isMulti = isMultiDayEvent(event)
        const isFullDay = eventStart.getHours() === 0 && eventEnd.getHours() === 0

        // Find start and end day indices within displayedDays
        let startDayIndex = -1
        let endDayIndex = -1

        for (let i = 0; i < numDays; i++) {
          const dayStart = new Date(displayedDays[i])
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(displayedDays[i])
          dayEnd.setHours(23, 59, 59, 999)

          if (startDayIndex === -1 && eventStart <= dayEnd) {
            startDayIndex = i
          }
          if (eventEnd >= dayStart) {
            endDayIndex = i
          }
        }

        // Clamp to visible range
        if (startDayIndex === -1) startDayIndex = 0
        if (endDayIndex === -1 || endDayIndex >= numDays) endDayIndex = numDays - 1
        if (eventStart < periodStart) startDayIndex = 0
        if (eventEnd > periodEnd) endDayIndex = numDays - 1

        const colStart = startDayIndex + 2 // +2 because column 1 is the resource name
        const colSpan = endDayIndex - startDayIndex + 1
        const isActualStart = eventStart >= periodStart
        const isActualEnd = eventEnd <= periodEnd

        // Calculate top position based on resource row and lane
        const topPosition = resourceIndex * rowHeight + headerHeight + (lane * laneHeight) + 4

        return (
          <div
            key={`event-${event.recordid}-${resourceId}`}
            draggable={!resizingEvent && !event.disabled}
            onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
            onClick={(e) => {
              e.stopPropagation()
              if (!event.disabled) handleRowClick?.("standard", event.recordid, tableid)
            }}
            className={`absolute h-6 text-[11px] flex items-center px-2 transition-opacity group
              ${event.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}
              ${!isMulti ? "border border-gray-200 dark:border-gray-700 shadow-sm" : "text-white"}`}
            style={{
              gridColumn: `${colStart} / span ${colSpan}`,
              top: `${topPosition}px`,
              left: isActualStart ? "4px" : "0px",
              right: isActualEnd ? "4px" : "0px",
              backgroundColor: isMulti ? (event.color || "#3b82f6") : "#ffffff",
              borderLeft: !isMulti ? `3px solid ${event.color || "#3b82f6"}` : "none",
              borderRadius: isMulti
                ? `${isActualStart ? "4px" : "0"} ${isActualEnd ? "4px" : "0"} ${isActualEnd ? "4px" : "0"} ${isActualStart ? "4px" : "0"}`
                : "4px",
              height: `${laneHeight - 2}px`,
              pointerEvents: "auto",
              opacity:
                draggedEvent?.recordid === event.recordid &&
                draggedEvent?.resourceId === event.resourceId
                  ? 0.5
                  : event.disabled
                    ? 0.6
                    : 1,
            }}
          >
            <div className="truncate flex items-center gap-1 w-full select-none">
              {isActualStart && !isFullDay && (
                <span className={`font-bold opacity-75 mr-1 ${isMulti ? "" : "text-gray-600"}`}>
                  {eventStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {!isActualStart && <ArrowRight className="w-3 h-3 flex-shrink-0" />}
              <span className={`${isMulti ? "font-semibold" : "font-medium text-gray-800"}`}>{event.title}</span>
              {isActualStart && isMulti && <span className="text-[9px] opacity-70">({getEventDaySpan(event)}g)</span>}
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

    return (
      <div className="relative flex-1 overflow-auto">
        <div className="grid border-l border-gray-200 dark:border-gray-700" style={gridColsStyle}>
          {/* Header row */}
          <div
            className="p-2 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold sticky top-0 left-0 z-20 text-sm"
            style={{ height: `${headerHeight}px` }}
          >
            Dipendenti
          </div>
          {displayedDays.map((day) => {
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <div
                key={day.toISOString()}
                className={`${isToday ? "text-accent" : ""} p-2 text-center border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold sticky top-0 z-10`}
                style={{ height: `${headerHeight}px` }}
              >
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {day.toLocaleDateString("it-IT", { weekday: "short" })}
                </p>
                <p className="text-lg leading-none">{day.getDate()}</p>
              </div>
            )
          })}

          {/* Resource rows */}
          {resources.map((resource) => (
            <React.Fragment key={resource.id}>
              {/* Resource name cell */}
              <div
                className="border-r border-b border-gray-200 dark:border-gray-700 font-medium bg-white dark:bg-gray-900 sticky left-0 z-10 text-sm p-2"
                style={{ height: `${rowHeight}px` }}
              >
                {resource.name}
              </div>

              {/* Day cells for this resource */}
              {displayedDays.map((day) => (
                <div
                  key={`${resource.id}-${day.toISOString()}`}
                  className="border-b border-r border-gray-200 dark:border-gray-700 transition-colors duration-200 relative bg-white dark:bg-gray-900"
                  style={{ height: `${rowHeight}px` }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add("bg-blue-50/50")
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50/50")}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove("bg-blue-50/50")
                    handleDrop(day, undefined, resource.id)
                  }}
                />
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Events overlay */}
        <div
          className="absolute top-0 left-0 w-full grid pointer-events-none"
          style={gridColsStyle}
        >
          {resources.map((resource, resourceIndex) => renderEventsForResource(resource.id, resourceIndex))}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourHeight = 60
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
    const dayEvents = events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end || event.start)
      return eventStart <= currentDayEnd && eventEnd >= currentDayStart
    })

    // ---------- LAYOUT CALCULATION FOR A RESOURCE ----------
    const calculateResourceLayout = (resourceId: string) => {
      const resourceEvents = dayEvents.filter((e) => e.resourceId === resourceId)
      const fullDayEvents = resourceEvents.filter(isFullDayEvent)
      const timedEvents = resourceEvents.filter((e) => !isFullDayEvent(e))

      // Full-day layout (lanes)
      const fullDayLanes: any[][] = []
      const fullDayEventToLane: Record<string, number> = {}

      const sortedFullDay = [...fullDayEvents].sort((a, b) => {
        const durA = new Date(a.end || a.start).getTime() - new Date(a.start).getTime()
        const durB = new Date(b.end || b.start).getTime() - new Date(b.start).getTime()
        if (durB !== durA) return durB - durA
        return new Date(a.start).getTime() - new Date(b.start).getTime()
      })

      sortedFullDay.forEach((event) => {
        const eventStart = new Date(event.start).getTime()
        const eventEnd = new Date(event.end || event.start).getTime()

        let laneIndex = fullDayLanes.findIndex((lane) =>
          !lane.some((e) => {
            const eS = new Date(e.start).getTime()
            const eE = new Date(e.end || e.start).getTime()
            return eventStart <= eE && eventEnd >= eS
          })
        )

        if (laneIndex === -1) {
          fullDayLanes.push([event])
          laneIndex = fullDayLanes.length - 1
        } else {
          fullDayLanes[laneIndex].push(event)
        }
        fullDayEventToLane[event.recordid] = laneIndex
      })

      // Timed events layout (columns)
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
        return r1.startMin < r2.endMin && r1.endMin > r2.startMin
      }

      const sortedTimed = [...timedEvents].sort((a, b) => {
        const rA = getEffectiveRange(a)
        const rB = getEffectiveRange(b)
        if (rA.startMin !== rB.startMin) return rA.startMin - rB.startMin
        return (rB.endMin - rB.startMin) - (rA.endMin - rA.startMin)
      })

      const timedEventPositions: Record<string, { column: number; totalColumns: number }> = {}
      const columns: any[][] = []

      sortedTimed.forEach((event) => {
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

        timedEventPositions[event.recordid] = { column: colIndex, totalColumns: 0 }
      })

      sortedTimed.forEach((event) => {
        const overlapping = sortedTimed.filter((e) => eventsOverlap(event, e))
        let maxCol = 0
        overlapping.forEach((e) => {
          const pos = timedEventPositions[e.recordid]
          if (pos && pos.column > maxCol) maxCol = pos.column
        })
        timedEventPositions[event.recordid].totalColumns = maxCol + 1
      })

      return {
        fullDayEvents: sortedFullDay,
        fullDayEventToLane,
        fullDayTotalLanes: fullDayLanes.length,
        timedEvents: sortedTimed,
        timedEventPositions,
      }
    }

    // Pre-calculate layouts for all resources
    const resourceLayouts = resources.reduce((acc, resource) => {
      acc[resource.id] = calculateResourceLayout(resource.id)
      return acc
    }, {} as Record<string, ReturnType<typeof calculateResourceLayout>>)

    // Calculate max full-day lanes across all resources
    const maxFullDayLanes = Math.max(0, ...resources.map((r) => resourceLayouts[r.id].fullDayTotalLanes))
    const fullDaySectionHeight = maxFullDayLanes > 0 ? maxFullDayLanes * laneHeight + 32 : 0

    // ---------- RENDER FULL-DAY EVENTS FOR A RESOURCE ----------
    const renderFullDayEventsForResource = (resourceId: string) => {
      const layout = resourceLayouts[resourceId]
      return layout.fullDayEvents.map((event) => {
        const lane = layout.fullDayEventToLane[event.recordid]
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)
        const isActualStart = eventStart >= currentDayStart
        const isActualEnd = eventEnd <= currentDayEnd

        return (
          <div
            key={`fullday-${event.recordid}`}
            draggable={!resizingEvent && !event.disabled}
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

    // ---------- RENDER TIMED EVENTS FOR A RESOURCE ----------
    const renderTimedEventsForResource = (resourceId: string) => {
      const layout = resourceLayouts[resourceId]

      return layout.timedEvents.map((event) => {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.end || event.start)

        const effectiveStart = eventStart < currentDayStart ? currentDayStart : eventStart
        const effectiveEnd = eventEnd > currentDayEnd ? currentDayEnd : eventEnd

        const startHour = effectiveStart.getHours() + effectiveStart.getMinutes() / 60
        const endHour = effectiveEnd.getHours() + effectiveEnd.getMinutes() / 60
        const durationHours = Math.max(endHour - startHour, 0.5)

        const topPosition = startHour * hourHeight
        const height = Math.max(durationHours * hourHeight, 40)

        const position = layout.timedEventPositions[event.recordid] || { column: 0, totalColumns: 1 }
        const width = position.totalColumns > 1 ? `calc((100% - 16px) / ${position.totalColumns})` : "calc(100% - 16px)"
        const leftOffset = position.totalColumns > 1 ? `calc(8px + (100% - 16px) / ${position.totalColumns} * ${position.column})` : "8px"

        const isFirst = eventStart >= currentDayStart && eventStart <= currentDayEnd
        const isLast = eventEnd >= currentDayStart && eventEnd <= currentDayEnd

        return (
          <div
            key={`timed-${event.recordid}`}
            draggable={!resizingEvent && !event.disabled}
            onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
            onClick={() => !event.disabled && handleRowClick?.("standard", event.recordid, tableid)}
            className="absolute group p-2 text-xs cursor-pointer text-white shadow-md rounded pointer-events-auto hover:shadow-lg transition-shadow"
            style={{
              backgroundColor: event.color || "#3b82f6",
              top: `${topPosition}px`,
              height: `${height}px`,
              left: leftOffset,
              width,
              opacity:
                draggedEvent?.recordid === event.recordid &&
                draggedEvent?.start === event.start &&
                draggedEvent?.resourceId === event.resourceId
                  ? 0.5
                  : event.disabled
                    ? 0.6
                    : 1,
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

            <p className="font-bold truncate text-sm">{event.title}</p>
            {height >= 50 && (
              <p className="text-[10px] opacity-90 mt-0.5">
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
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header row */}
        <div
          className="grid border-l border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
          style={{ gridTemplateColumns: `100px repeat(${resources.length}, 1fr)` }}
        >
          <div className="p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold text-sm">
            Ora
          </div>
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="p-3 text-center border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold truncate"
              title={resource.name}
            >
              {resource.name}
            </div>
          ))}
        </div>

        {/* Full-day section */}
        {maxFullDayLanes > 0 && (
          <div
            className="grid border-l border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0"
            style={{ gridTemplateColumns: `100px repeat(${resources.length}, 1fr)`, minHeight: `${fullDaySectionHeight}px` }}
          >
            <div className="p-2 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Tutto il giorno</span>
            </div>
            {resources.map((resource) => (
              <div
                key={`fullday-cell-${resource.id}`}
                className="border-r border-gray-200 dark:border-gray-700 relative"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add("bg-blue-50/50")
                }}
                onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50/50")}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove("bg-blue-50/50")
                  handleDrop(currentDate, undefined, resource.id)
                }}
              >
                {renderFullDayEventsForResource(resource.id)}
              </div>
            ))}
          </div>
        )}

        {/* Timed events grid */}
        <div className="flex-1 overflow-auto">
          <div className="flex">
            {/* Hour labels column */}
            <div className="w-[100px] flex-shrink-0">
              {hours.map((hour) => (
                <div
                  key={`hour-label-${hour}`}
                  className="p-2 border-r border-b border-gray-200 dark:border-gray-700 text-sm bg-background font-medium text-muted-foreground"
                  style={{ height: `${hourHeight}px` }}
                >
                  {hour.toString().padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Resource columns with events */}
            {resources.map((resource) => (
              <div key={`resource-col-${resource.id}`} className="flex-1 relative">
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div
                    key={`${resource.id}-${hour}`}
                    className="border-b border-r border-gray-200 dark:border-gray-700 transition-colors duration-200 bg-background hover:bg-muted"
                    style={{ height: `${hourHeight}px` }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add("bg-primary")
                    }}
                    onDragLeave={(e) => e.currentTarget.classList.remove("bg-primary")}
                    onDrop={(e) => {
                      e.preventDefault()
                      const dropTime = new Date(currentDate)
                      dropTime.setHours(hour, 0, 0, 0)
                      handleDrop(dropTime, hour, resource.id)
                      e.currentTarget.classList.remove("bg-primary")
                    }}
                  />
                ))}
                {/* Events overlay for this resource */}
                <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                  {renderTimedEventsForResource(resource.id)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <GenericComponent loading={loading} error={error}>
      {(response) => (
      <div ref={calendarRef} id="calendar-matrix-view" className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <CalendarHeader
          title={renderHeaderTitle()}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          calendarType={calendarType}
          onCalendarTypeChange={onCalendarTypeChange}
          extraEventTables={data.extraEventTables}
          selectedExtraTable={selectedExtraTable}
          onExtraTableChange={handleExtraTableChange}
          onPrint={handlePrint}
        />

        {viewMode === "day" ? renderDayView() : renderWeekMonthView()}

        <footer className="text-right p-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <span className="font-medium">Eventi totali:</span> {data.events.length}
        </footer>
      </div>
      )}
    </GenericComponent>
  )
}
