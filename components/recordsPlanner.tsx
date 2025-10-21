"use client"

import React, { useState, useCallback, useEffect, useMemo, useContext } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, Trash2 } from "lucide-react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import { AppContext } from "@/context/appContext"
import axiosInstanceClient from "@/utils/axiosInstanceClient"

// ===================================================================================
// FLAG PER LO SVILUPPO
// ===================================================================================
const isDev = false

// ===================================================================================
// HELPER FUNCTIONS
// ===================================================================================

function toLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

// ===================================================================================
// INTERFACCE E TIPI
// ===================================================================================
interface Resource {
  id: string
  name: string
}

interface CalendarEvent {
  recordid: string
  title: string
  start: Date
  end: Date
  description: string
  color: string
  resourceId: string
}

interface UnplannedEvent {
  recordid: string
  title: string
  description: string
  color: string
}

interface ResponseInterface {
  resources: Resource[]
  events: CalendarEvent[]
  unplannedEvents: UnplannedEvent[]
  viewMode?: "day" | "week" | "month"
}

interface PropsInterface {
  tableid?: string
  searchTerm?: string
  filters?: string
  view?: string
  order?: {
    columnDesc: string | null
    direction: "asc" | "desc" | null
  }
  context?: string
  pagination?: {
    page: number
    limit: number
  }
  level?: number
  filtersList?: Array<{
    fieldid: string
    type: string
    label: string
    value: string
  }>
  masterTableid?: string
  masterRecordid?: string
  showUnplannedEvents?: boolean // New prop to control sidebar visibility
  initialDate?: Date
}

type ViewMode = "day" | "week" | "month"
type ResizeHandle = "top" | "bottom" | "right" | null

// ===================================================================================
// DATI DI DEFAULT E PER LO SVILUPPO
// ===================================================================================

const responseDataDEFAULT: ResponseInterface = {
  resources: [],
  events: [],
  unplannedEvents: [],
}

const responseDataDEV: ResponseInterface = {
  resources: [
    { id: "antonijevictoplica", name: "Antonijevic Toplica" },
    { id: "BasarabaTomislav", name: "Basaraba Tomislav" },
    { id: "BerishaBekim", name: "Berisha Bekim" },
    { id: "DokovicDorde", name: "Dokovic Dorde" },
    { id: "FazziLuca", name: "Fazzi Luca" },
    { id: "RossiMario", name: "Rossi Mario" },
    { id: "BianchiGiulia", name: "Bianchi Giulia" },
    { id: "VerdiPaolo", name: "Verdi Paolo" },
    { id: "GalliAnna", name: "Galli Anna" },
    { id: "ContiMarco", name: "Conti Marco" },
  ],
  events: [
    {
      recordid: "1",
      title: "Pulizia completa Condominio Lucino",
      start: new Date(2025, 0, 7, 10, 0),
      end: new Date(2025, 0, 7, 11, 30),
      description: "Pulizia completa Condominio Lucino",
      color: "#3b82f6",
      resourceId: "antonijevictoplica",
    },
    {
      recordid: "2",
      title: "Pulizia entrata Residenza Nettuno",
      start: new Date(2025, 0, 8, 14, 0),
      end: new Date(2025, 0, 8, 15, 0),
      description: "Pulizia entrata Residenza Nettuno",
      color: "#10b981",
      resourceId: "BasarabaTomislav",
    },
    {
      recordid: "3",
      title: "Manutenzione giardino Villa Ada",
      start: new Date(2025, 0, 22, 9, 0),
      end: new Date(2025, 0, 22, 12, 0),
      description: "Taglio erba e siepi",
      color: "#ef4444",
      resourceId: "RossiMario",
    },
  ],
  unplannedEvents: [
    { recordid: "u1", title: "Pulizia finestre Stabile fortuna", description: "Note aggiuntive", color: "#f97316" },
    { recordid: "u2", title: "Pulizie finestre Lisano 1 Massagno", description: "Note aggiuntive", color: "#8b5cf6" },
  ],
}

// ===================================================================================
// SOTTO-COMPONENTI
// ===================================================================================

const WeekDropdown: React.FC<{ selectedWeek: number; onWeekChange: (week: number) => void }> = ({
  selectedWeek,
  onWeekChange,
}) => (
  <select
    className="w-48 p-2 border rounded"
    value={selectedWeek}
    onChange={(e) => onWeekChange(Number(e.target.value))}
  >
    {[1, 2, 3, 4, 5].map((week) => (
      <option key={week} value={week}>
        Settimana {week}
      </option>
    ))}
  </select>
)

const MonthDropdown: React.FC<{ selectedMonth: number; onMonthChange: (month: number) => void }> = ({
  selectedMonth,
  onMonthChange,
}) => {
  const months = [
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
  return (
    <select
      className="w-48 p-2 border rounded"
      value={selectedMonth}
      onChange={(e) => onMonthChange(Number(e.target.value))}
    >
      {months.map((label, index) => (
        <option key={index} value={index}>
          {label}
        </option>
      ))}
    </select>
  )
}

const DayPicker: React.FC<{ selectedDate: Date; onDateChange: (date: Date) => void }> = ({
  selectedDate,
  onDateChange,
}) => {
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={handlePrevDay}>
        ←
      </Button>
      <span className="w-48 text-center font-medium">
        {selectedDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
      </span>
      <Button variant="outline" size="sm" onClick={handleNextDay}>
        →
      </Button>
    </div>
  )
}

// ===================================================================================
// COMPONENTE PRINCIPALE
// ===================================================================================

export default function UnifiedMatrixCalendar({
  tableid,
  searchTerm,
  filters,
  view,
  order,
  context,
  pagination,
  level,
  masterTableid,
  masterRecordid,
  showUnplannedEvents = false,
  initialDate,
}: PropsInterface) {
  const { user } = useContext(AppContext)

  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT)

  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [selectedWeek, setSelectedWeek] = useState(3)
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<(Partial<CalendarEvent> & { recordid: string }) | null>(null)

  const [resizingEvent, setResizingEvent] = useState<{
    recordid: string
    handle: ResizeHandle
    originalStart: Date
    originalEnd: Date
    originalResourceId: string
  } | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number>(0)
  const [resizeStartX, setResizeStartX] = useState<number>(0)

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_records_matrixcalendar",
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      tableid: tableid,
      searchTerm: searchTerm,
      view: view,
    }
  }, [currentDate, tableid, searchTerm, view])

  const { response, loading, error } = useApi<ResponseInterface>(payload)

  useEffect(() => {
    if (!isDev && response) {
      const parsedEvents = response.events.map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }))
      setResponseData({ ...response, events: parsedEvents })
      setViewMode(response.viewMode || "week")
    }
  }, [response])

  const { resources, events, unplannedEvents } = responseData

  async function saveEvent(eventid: string, startdate: Date | null, enddate: Date | null, resourceid: string | null) {
    const startdateStr = startdate ? toLocalISOString(startdate) : null
    const enddateStr = enddate ? toLocalISOString(enddate) : null

    console.log("[v0] Saving event:", { eventid, startdate: startdateStr, enddate: enddateStr, resourceid })
    try {
      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "matrixcalendar_save_record",
          tableid,
          event: {
            id: eventid,
            startdate: startdateStr,
            enddate: enddateStr,
            resourceid,
          },
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
    } catch (error) {
      console.log("[v0] Error saving event:", error)
    }
  }

  const unscheduleEvent = useCallback(
    async (event: CalendarEvent) => {
      try {
        saveEvent(event.recordid, null as any, null as any, event.resourceId)

        setResponseData((prev) => ({
          ...prev,
          events: prev.events.filter((e) => getEventUniqueId(e) !== getEventUniqueId(event)),
          unplannedEvents: [
            ...prev.unplannedEvents,
            {
              recordid: event.recordid,
              title: event.title,
              description: event.description,
              color: event.color,
            },
          ],
        }))

        setShowEventDialog(false)
        setSelectedEvent(null)
      } catch (error) {
        console.log("[v0] Error unscheduling event:", error)
      }
    },
    [tableid],
  )

  const filteredResources = useMemo(
    () =>
      selectedResourceIds.length > 0
        ? resources.filter((resource) => selectedResourceIds.includes(resource.id))
        : resources,
    [resources, selectedResourceIds],
  )

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getWorkDaysInWeek = (date: Date, week: number) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    let dayOfWeek = startOfMonth.getDay()
    if (dayOfWeek === 0) dayOfWeek = 7
    const firstMonday = new Date(startOfMonth)
    if (dayOfWeek !== 1) {
      firstMonday.setDate(firstMonday.getDate() + (8 - dayOfWeek))
    }
    const offsetStart = new Date(firstMonday)
    offsetStart.setDate(offsetStart.getDate() + (week - 1) * 7)
    const days = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(offsetStart)
      d.setDate(offsetStart.getDate() + i)
      days.push(d)
    }
    return days
  }

  const displayedDays = useMemo(() => {
    if (viewMode === "month") {
      return getDaysInMonth(currentDate)
    }
    return getWorkDaysInWeek(currentDate, selectedWeek)
  }, [currentDate, selectedWeek, viewMode])

  const handleDrop = useCallback(
    (dropDate: Date, newResourceId: string) => {
      if (!draggedEvent) return

      console.log("[v0] Dropping event on date:", dropDate.toISOString(), "resource:", newResourceId)

      const duration =
        draggedEvent.end && draggedEvent.start ? draggedEvent.end.getTime() - draggedEvent.start.getTime() : 3600000

      const newStart = new Date(dropDate)
      newStart.setHours(
        draggedEvent.start ? draggedEvent.start.getHours() : 9,
        draggedEvent.start ? draggedEvent.start.getMinutes() : 0,
        0,
        0,
      )
      const newEnd = new Date(newStart.getTime() + duration)

      console.log("[v0] New start:", toLocalISOString(newStart), "New end:", toLocalISOString(newEnd))

      const isAlreadyPlanned = events.some((ev) => ev.recordid === draggedEvent.recordid)

      setResponseData((prev) => {
        let updatedEvents = [...prev.events]
        let updatedUnplanned = [...prev.unplannedEvents]

        if (isAlreadyPlanned) {
          const draggedStart = draggedEvent.start?.getTime()
          const draggedEnd = draggedEvent.end?.getTime()
          const draggedResourceId = draggedEvent.resourceId

          updatedEvents = prev.events.map((event) => {
            const isSameEvent =
              event.recordid === draggedEvent.recordid &&
              event.start.getTime() === draggedStart &&
              event.end.getTime() === draggedEnd &&
              event.resourceId === draggedResourceId

            return isSameEvent ? { ...event, start: newStart, end: newEnd, resourceId: newResourceId } : event
          })
        } else {
          updatedUnplanned = prev.unplannedEvents.filter((e) => e.recordid !== draggedEvent.recordid)
          const eventToAdd: CalendarEvent = {
            recordid: draggedEvent.recordid,
            title: draggedEvent.title || "Nuovo Evento",
            description: draggedEvent.description || "",
            color: draggedEvent.color || "#3b82f6",
            start: newStart,
            end: newEnd,
            resourceId: newResourceId,
          }
          updatedEvents.push(eventToAdd)
        }

        saveEvent(draggedEvent.recordid, newStart, newEnd, newResourceId)

        return { ...prev, events: updatedEvents, unplannedEvents: updatedUnplanned }
      })

      setDraggedEvent(null)
    },
    [draggedEvent, events],
  )

  const handleDragStart = (e: React.DragEvent, event: Partial<CalendarEvent> & { recordid: string }) => {
    e.stopPropagation()
    setDraggedEvent(event)
    const dragImage = document.createElement("div")
    dragImage.style.position = "fixed"
    dragImage.style.top = "-100px"
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleResizeStart = (e: React.MouseEvent, event: CalendarEvent, handle: "top" | "bottom" | "right") => {
    e.stopPropagation()
    e.preventDefault()
    setResizingEvent({
      recordid: event.recordid,
      handle,
      originalStart: new Date(event.start),
      originalEnd: new Date(event.end),
      originalResourceId: event.resourceId,
    })
    setResizeStartY(e.clientY)
    setResizeStartX(e.clientX)
  }

  useEffect(() => {
    if (!resizingEvent) return

    const handleMouseMove = (e: MouseEvent) => {
      if (resizingEvent.handle === "right") {
        const deltaX = e.clientX - resizeStartX
        const cellWidth = 160
        const daysDelta = Math.round(deltaX / cellWidth)

        setResponseData((prev) => ({
          ...prev,
          events: prev.events.map((event) => {
            const isSameEvent =
              event.recordid === resizingEvent.recordid &&
              event.start.getTime() === resizingEvent.originalStart.getTime() &&
              event.end.getTime() === resizingEvent.originalEnd.getTime() &&
              event.resourceId === resizingEvent.originalResourceId

            if (!isSameEvent) return event

            const newEnd = new Date(resizingEvent.originalEnd)
            newEnd.setDate(newEnd.getDate() + daysDelta)

            const startDay = new Date(event.start)
            startDay.setHours(0, 0, 0, 0)
            const newEndDay = new Date(newEnd)
            newEndDay.setHours(0, 0, 0, 0)

            if (newEndDay >= startDay) {
              return { ...event, end: newEnd }
            }
            return event
          }),
        }))
      } else {
        const deltaY = e.clientY - resizeStartY
        const minutesPerPixel = 60
        const deltaMinutes = Math.round(deltaY * minutesPerPixel)

        setResponseData((prev) => ({
          ...prev,
          events: prev.events.map((event) => {
            const isSameEvent =
              event.recordid === resizingEvent.recordid &&
              event.start.getTime() === resizingEvent.originalStart.getTime() &&
              event.end.getTime() === resizingEvent.originalEnd.getTime() &&
              event.resourceId === resizingEvent.originalResourceId

            if (!isSameEvent) return event

            if (resizingEvent.handle === "top") {
              const newStart = new Date(resizingEvent.originalStart)
              newStart.setMinutes(newStart.getMinutes() + deltaMinutes)
              if (newStart < event.end) {
                return { ...event, start: newStart }
              }
            } else if (resizingEvent.handle === "bottom") {
              const newEnd = new Date(resizingEvent.originalEnd)
              newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes)
              if (newEnd > event.start) {
                return { ...event, end: newEnd }
              }
            }
            return event
          }),
        }))
      }
    }

    const handleMouseUp = () => {
      if (resizingEvent) {
        const event = events.find(
          (e) => e.recordid === resizingEvent.recordid && e.resourceId === resizingEvent.originalResourceId,
        )
        if (event) {
          saveEvent(event.recordid, event.start, event.end, event.resourceId)
        }
      }
      setResizingEvent(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizingEvent, resizeStartY, resizeStartX, events])

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(month)
    newDate.setDate(1)
    setCurrentDate(newDate)
  }

  const formatEventTime = (date: Date) =>
    date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false })

  const gridColsStyle = {
    gridTemplateColumns: `minmax(180px, 1fr) repeat(${displayedDays.length}, minmax(160px, 1fr))`,
  }

  const getEventUniqueId = (event: CalendarEvent) => {
    return `${event.recordid || "no-id"}-${event.resourceId}-${event.start.getTime()}-${event.end.getTime()}`
  }

  const getEventDaySpan = (event: CalendarEvent) => {
    const startDay = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate())
    const endDay = new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate())
    const daysDiff = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff + 1 // +1 because if start and end are same day, it's still 1 day
  }

  const isMultiDayEvent = (event: CalendarEvent) => {
    return event.start.toDateString() !== event.end.toDateString()
  }

  const getEventDurationHours = (event: CalendarEvent) => {
    return (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)
  }

  const getEventPositionInSpan = (event: CalendarEvent, currentDay: Date): "first" | "middle" | "last" | "single" => {
    const eventStartDay = new Date(event.start.getFullYear(), event.start.getMonth(), event.start.getDate())
    const eventEndDay = new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate())
    const currentDayNormalized = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate())

    const isFirst = currentDayNormalized.getTime() === eventStartDay.getTime()
    const isLast = currentDayNormalized.getTime() === eventEndDay.getTime()

    if (isFirst && isLast) return "single"
    if (isFirst) return "first"
    if (isLast) return "last"
    return "middle"
  }

  const getEventPositionStyles = (position: "first" | "middle" | "last" | "single") => {
    switch (position) {
      case "first":
        return {
          borderRadius: "0.375rem 0 0 0.375rem", // rounded-l
          borderRight: "none",
        }
      case "middle":
        return {
          borderRadius: "0",
          borderLeft: "none",
          borderRight: "none",
        }
      case "last":
        return {
          borderRadius: "0 0.375rem 0.375rem 0", // rounded-r
          borderLeft: "none",
        }
      case "single":
        return {
          borderRadius: "0.375rem", // rounded
        }
    }
  }

  const renderWeekMonthView = () => {
    return (
      <div className="relative">
        <div className="grid" style={gridColsStyle}>
          {/* Headers */}
          <div className="p-2 border-b border-r border-gray-200 bg-gray-100 font-semibold sticky top-0 left-0 z-20">
            Dipendenti
          </div>
          {displayedDays.map((day) => (
            <div
              key={day.toISOString()}
              className="p-2 text-center border-b border-gray-200 bg-gray-100 font-semibold sticky top-0 z-10"
            >
              {day.toLocaleDateString("it-IT", { weekday: "short" })}
              <br />
              <span className="text-xl">{day.getDate()}</span>
            </div>
          ))}

          {filteredResources.map((resource, resourceIndex) => (
            <React.Fragment key={resource.id}>
              {/* Resource name cell */}
              <div className="p-2 border-r border-b border-gray-200 font-medium bg-white sticky left-0 z-10">
                {resource.name}
              </div>

              {/* Day cells with events inside */}
              {displayedDays.map((day, dayIndex) => {
                const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
                const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59)

                const dayEvents = responseData.events
                  .filter((event) => {
                    const eventStartDay = new Date(
                      event.start.getFullYear(),
                      event.start.getMonth(),
                      event.start.getDate(),
                    )
                    const eventEndDay = new Date(event.end.getFullYear(), event.end.getMonth(), event.end.getDate())

                    return (
                      event.resourceId === resource.id &&
                      dayStart.getTime() >= eventStartDay.getTime() &&
                      dayStart.getTime() <= eventEndDay.getTime()
                    )
                  })
                  .sort((a, b) => a.start.getTime() - b.start.getTime())

                return (
                  <div
                    key={`${resource.id}-${day.toISOString()}`}
                    className="min-h-24 p-1 border-b border-gray-200 transition-colors duration-200 relative"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add("bg-blue-50")
                    }}
                    onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50")}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDrop(day, resource.id)
                      e.currentTarget.classList.remove("bg-blue-50")
                    }}
                  >
                    {dayEvents.map((event, eventIndex) => {
                      const durationHours = getEventDurationHours(event)
                      const baseHeightPerHour = 8
                      const maxHeight = 24 * baseHeightPerHour // 192px for 24 hours
                      const calculatedHeight = Math.min(durationHours * baseHeightPerHour, maxHeight)
                      const eventHeight = Math.max(calculatedHeight, 48) // minimum 48px
                      const isMultiDay = isMultiDayEvent(event)
                      const daySpan = getEventDaySpan(event)

                      const position = getEventPositionInSpan(event, day)
                      const positionStyles = getEventPositionStyles(position)

                      return (
                        <div
                          key={`${getEventUniqueId(event)}-${dayIndex}`}
                          draggable={!resizingEvent}
                          onDragStart={(e) => !resizingEvent && handleDragStart(e, event)}
                          onClick={() => {
                            setSelectedEvent(event)
                            setShowEventDialog(true)
                          }}
                          className="relative group p-2 text-sm cursor-move text-white select-none shadow-sm mb-1"
                          style={{
                            backgroundColor: event.color,
                            height: `${eventHeight}px`,
                            ...positionStyles, // Apply position-specific styles
                            opacity:
                              draggedEvent?.recordid === event.recordid &&
                              draggedEvent?.start?.getTime() === event.start.getTime() &&
                              draggedEvent?.resourceId === event.resourceId
                                ? 0.5
                                : 1,
                            cursor: resizingEvent
                              ? resizingEvent.handle === "right"
                                ? "ew-resize"
                                : "ns-resize"
                              : "move",
                          }}
                        >
                          {position === "first" || position === "single" ? (
                            <div
                              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                              style={{ borderRadius: "0.375rem 0.375rem 0 0" }}
                              onMouseDown={(e) => handleResizeStart(e, event, "top")}
                            />
                          ) : null}

                          <div className="font-semibold truncate">
                            {event.title}
                            {position === "middle" && <span className="ml-1">→</span>}
                          </div>
                          <div className="text-xs">
                            {position === "first" || position === "single" ? (
                              <>
                                {formatEventTime(event.start)} - {formatEventTime(event.end)}
                                {isMultiDay && <span className="ml-1">({daySpan}g)</span>}
                                <span className="ml-1">({durationHours.toFixed(1)}h)</span>
                              </>
                            ) : position === "middle" ? (
                              <span>continua →</span>
                            ) : (
                              <span>← fino a {formatEventTime(event.end)}</span>
                            )}
                          </div>

                          {position === "last" || position === "single" ? (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                              style={{ borderRadius: "0 0 0.375rem 0.375rem" }}
                              onMouseDown={(e) => handleResizeStart(e, event, "bottom")}
                            />
                          ) : null}

                          {position === "last" || position === "single" ? (
                            <div
                              className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30"
                              style={{ borderRadius: "0 0.375rem 0.375rem 0" }}
                              onMouseDown={(e) => handleResizeStart(e, event, "right")}
                            />
                          ) : null}
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
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = responseData.events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      return (
        eventStart.toDateString() === currentDate.toDateString() ||
        eventEnd.toDateString() === currentDate.toDateString() ||
        (eventStart < currentDate && eventEnd > currentDate)
      )
    })

    return (
      <div className="grid" style={{ gridTemplateColumns: `80px repeat(${filteredResources.length}, 1fr)` }}>
        {/* Header */}
        <div className="p-2 border-b border-r border-gray-200 bg-gray-100 font-semibold sticky top-0 left-0 z-20">
          Ora
        </div>
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="p-2 text-center border-b border-gray-200 bg-gray-100 font-semibold sticky top-0 z-10"
          >
            {resource.name}
          </div>
        ))}

        {/* Time slots */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="p-2 border-r border-b border-gray-200 text-sm bg-white sticky left-0 z-10">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {filteredResources.map((resource) => {
              const slotStart = new Date(currentDate)
              slotStart.setHours(hour, 0, 0, 0)
              const slotEnd = new Date(currentDate)
              slotEnd.setHours(hour + 1, 0, 0, 0)

              const slotEvents = dayEvents.filter((event) => {
                return event.resourceId === resource.id && event.start < slotEnd && event.end > slotStart
              })

              return (
                <div
                  key={`${resource.id}-${hour}`}
                  className="relative min-h-16 border-b border-r border-gray-200 transition-colors duration-200"
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add("bg-blue-50")
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50")}
                  onDrop={(e) => {
                    e.preventDefault()
                    const dropTime = new Date(currentDate)
                    dropTime.setHours(hour, 0, 0, 0)
                    handleDrop(dropTime, resource.id)
                    e.currentTarget.classList.remove("bg-blue-50")
                  }}
                >
                  {slotEvents.map((event) => {
                    if (event.start.getHours() !== hour) return null

                    const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60)
                    const pixelsPerMinute = 1 // 1px per minute = 60px per hour
                    const eventHeight = durationMinutes * pixelsPerMinute

                    const minutesFromSlotStart = (event.start.getTime() - slotStart.getTime()) / (1000 * 60)
                    const topPosition = minutesFromSlotStart * pixelsPerMinute

                    return (
                      <div
                        key={getEventUniqueId(event)}
                        draggable={!resizingEvent}
                        onDragStart={(e) => !resizingEvent && handleDragStart(e, event)}
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowEventDialog(true)
                        }}
                        className="absolute left-1 right-1 group p-2 rounded text-sm cursor-move text-white select-none shadow z-10"
                        style={{
                          backgroundColor: event.color,
                          top: `${topPosition}px`,
                          height: `${eventHeight}px`,
                          minHeight: "40px",
                          opacity:
                            draggedEvent?.recordid === event.recordid &&
                            draggedEvent?.start?.getTime() === event.start.getTime() &&
                            draggedEvent?.resourceId === event.resourceId
                              ? 0.5
                              : 1,
                        }}
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t"
                          onMouseDown={(e) => handleResizeStart(e, event, "top")}
                        />

                        <div className="font-semibold text-xs truncate">{event.title}</div>
                        <div className="text-xs">
                          {formatEventTime(event.start)} - {formatEventTime(event.end)}
                        </div>

                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-b"
                          onMouseDown={(e) => handleResizeStart(e, event, "bottom")}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(data: ResponseInterface) => (
        <div className="flex h-11/12 bg-gray-50">
          <div className="flex-1 p-4 flex flex-col min-w-0">
            <header className="mb-4 space-y-4 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  {viewMode === "day" && <DayPicker selectedDate={currentDate} onDateChange={setCurrentDate} />}
                  <MonthDropdown selectedMonth={currentDate.getMonth()} onMonthChange={handleMonthChange} />
                  {viewMode === "week" && <WeekDropdown selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />}
                </div>
                <div className="flex space-x-2">
                  <Button variant={viewMode === "day" ? "default" : "outline"} onClick={() => setViewMode("day")}>
                    Giorno
                  </Button>
                  <Button variant={viewMode === "week" ? "default" : "outline"} onClick={() => setViewMode("week")}>
                    Settimana
                  </Button>
                  <Button variant={viewMode === "month" ? "default" : "outline"} onClick={() => setViewMode("month")}>
                    Mese
                  </Button>
                </div>
              </div>
            </header>

            <div className="relative flex-grow">
              <Card className="absolute inset-0 p-4 overflow-auto">
                {viewMode === "day" ? renderDayView() : renderWeekMonthView()}
              </Card>
            </div>
          </div>

          {showUnplannedEvents && (
            <aside className="w-80 border-l bg-white flex flex-col">
              <div className="p-4 flex-grow overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Eventi da pianificare</h3>
                <div className="space-y-2">
                  {responseData.unplannedEvents?.map((ev) => (
                    <div
                      key={ev.recordid}
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
          )}

          {/* Dialog Dettaglio Evento */}
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>{selectedEvent?.title}</DialogTitle>
              </DialogHeader>
              {selectedEvent && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center">
                    <Calendar className="mr-2" />
                    <span>
                      {selectedEvent.start.toLocaleDateString("it-IT")}
                      {isMultiDayEvent(selectedEvent) && ` - ${selectedEvent.end.toLocaleDateString("it-IT")}`}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2" />
                    <span>
                      {formatEventTime(selectedEvent.start)} - {formatEventTime(selectedEvent.end)}
                    </span>
                  </div>
                  <p>{selectedEvent.description}</p>
                  <div className="flex justify-end pt-4">
                    <Button
                      variant="destructive"
                      onClick={() => unscheduleEvent(selectedEvent)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Rimuovi dalla pianificazione
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </GenericComponent>
  )
}
