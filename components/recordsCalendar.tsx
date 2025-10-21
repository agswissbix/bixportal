"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Assumendo che questi percorsi siano corretti nel tuo progetto
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import axiosInstanceClient from "@/utils/axiosInstanceClient"

// --- CONFIGURAZIONE E COSTANTI ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
// FLAG PER LO SVILUPPO: true per usare dati mock, false per chiamare l'API reale
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

// --- INTERFACCE ---

// Interfaccia per le Props del componente
interface PropsInterface {
  tableid?: string
  searchTerm?: string
  filters?: string
  view?: string
  context?: string
  level?: number
  filtersList?: Array<{
    fieldid: string
    type: string
    label: string
    value: string
  }>
  masterTableid?: string
  masterRecordid?: string
  showUnplannedEvents?: boolean // Added prop to control sidebar visibility
  initialView?: CalendarView
}

interface ResponseInterface {
  counter?: number
  events: Array<{
    recordid: string
    title: string
    start: string
    end: string
    color?: string
    description?: string
  }>
  unplannedEvents?: Array<{
    recordid: string
    title: string
    description?: string
    color?: string
  }>
}

type CalendarView = "month" | "week" | "day"
type ResizeHandle = "top" | "bottom" | "right" | null

export default function RecordsCalendar({
  tableid,
  initialView = "month",
  context,
  searchTerm,
  filters,
  masterTableid,
  masterRecordid,
  showUnplannedEvents = false, // Added prop with default value
}: PropsInterface) {
  const [view, setView] = useState<CalendarView>(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [responseData, setResponseData] = useState<ResponseInterface>({ events: [], unplannedEvents: [] })
  const payload = useMemo(() => {
    if (isDev) return null
    return {
        apiRoute: "get_records_matrixcalendar",
        tableid,
        searchTerm,
        filters,
        masterTableid,
        masterRecordid,
      }
    }, [tableid, searchTerm, filters, masterTableid, masterRecordid])
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };



  const responseDataDEV: ResponseInterface = {
    counter: 4,
    events: [
      {
        recordid: "1",
        title: "Team Sync Meeting",
        start: "2025-08-12T10:00:00",
        end: "2025-08-12T11:30:00",
        color: "#3b82f6",
        description: "Team Sync Meeting",
      },
      {
        recordid: "2",
        title: "Project Alpha Deadline",
        start: "2025-08-15T17:00:00",
        end: "2025-08-15T17:30:00",
        color: "#10b981",
        description: "Project Alpha Deadline",
      },
      {
        recordid: "3",
        title: "Deploy to Production",
        start: "2025-08-20T09:00:00",
        end: "2025-08-22T18:00:00",
        color: "#ef4444",
        description: "Deploy to Production",
      },
      {
        recordid: "4",
        title: "Client Call",
        start: "2025-08-12T15:00:00",
        end: "2025-08-12T15:30:00",
        color: "#f59e0b",
        description: "Client Call",
      },
    ],
    unplannedEvents: [
      {
        recordid: "u1",
        title: "Unplanned Event 1",
        description: "Description 1",
        color: "#f97316",
      },
      {
        recordid: "u2",
        title: "Unplanned Event 2",
        description: "Description 2",
        color: "#8b5cf6",
      },
    ],
  }

  // Use mock data if in development mode, otherwise use API response
  useEffect(() => {
    if (isDev) {
      setResponseData(responseDataDEV)
    }
  }, [])

  useEffect(() => {
    if (!isDev && response) {
      const parsedEvents = response.events.map((event) => ({
        ...event,
        start: event.start,
        end: event.end,
      }))
      setResponseData({ ...response, events: parsedEvents })
    }
  }, [response])

  async function saveEvent(eventid: string, startdate: Date | null, enddate: Date | null) {
    const startdateStr = startdate ? toLocalISOString(startdate) : null
    const enddateStr = enddate ? toLocalISOString(enddate) : null

    console.log("[v0] Saving event:", { eventid, startdate: startdateStr, enddate: enddateStr })
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
    async (event: any) => {
      try {
        await saveEvent(event.recordid, null, null)

        setResponseData((prev) => ({
          ...prev,
          events: prev.events.filter((e) => e.recordid !== event.recordid),
          unplannedEvents: [
            ...(prev.unplannedEvents || []),
            {
              recordid: event.recordid,
              title: event.title,
              description: "",
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

  const [draggedEvent, setDraggedEvent] = useState<any>(null)
  const [resizingEvent, setResizingEvent] = useState<{
    recordid: string
    handle: ResizeHandle
    originalStart: Date
    originalEnd: Date
  } | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number>(0)
  const [resizeStartX, setResizeStartX] = useState<number>(0)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)

  const handleDragStart = (e: React.DragEvent, event: any) => {
    e.stopPropagation()
    setDraggedEvent(event)
    const dragImage = document.createElement("div")
    dragImage.style.position = "fixed"
    dragImage.style.top = "-100px"
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleDrop = useCallback(
    (dropDate: Date, dropHour?: number) => {
      if (!draggedEvent) return

      console.log("[v0] Dropping event on date:", dropDate.toISOString())

      const isAlreadyPlanned = responseData.events.some((ev) => ev.recordid === draggedEvent.recordid)

      let duration = 3600000
      if (isAlreadyPlanned && draggedEvent.start && draggedEvent.end) {
        const start = new Date(draggedEvent.start)
        const end = new Date(draggedEvent.end)
        duration = end.getTime() - start.getTime()
      }

      const newStart = new Date(dropDate)
      if (dropHour !== undefined) {
        newStart.setHours(dropHour, 0, 0, 0)
      } else if (isAlreadyPlanned && draggedEvent.start) {
        const oldStart = new Date(draggedEvent.start)
        newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0)
      } else {
        newStart.setHours(9, 0, 0, 0)
      }
      const newEnd = new Date(newStart.getTime() + duration)

      console.log("[v0] New start:", toLocalISOString(newStart), "New end:", toLocalISOString(newEnd))

      const draggedEventKey = `${draggedEvent.recordid}-${draggedEvent.start}`

      setResponseData((prev) => {
        let updatedEvents = [...prev.events]
        let updatedUnplanned = [...(prev.unplannedEvents || [])]

        if (isAlreadyPlanned) {
          updatedEvents = prev.events.map((event) => {
            const eventKey = `${event.recordid}-${event.start}`
            return eventKey === draggedEventKey
              ? { ...event, start: toLocalISOString(newStart), end: toLocalISOString(newEnd) }
              : event
          })
        } else {
          updatedUnplanned = (prev.unplannedEvents || []).filter((e) => e.recordid !== draggedEvent.recordid)
          updatedEvents.push({
            recordid: draggedEvent.recordid,
            title: draggedEvent.title || "Nuovo Evento",
            start: toLocalISOString(newStart),
            end: toLocalISOString(newEnd),
            color: draggedEvent.color || "#3b82f6",
            description: draggedEvent.description || "",
          })
        }

        console.log("[v0] Updated events count:", updatedEvents.length)
        const recordIds = updatedEvents.map((r) => r.recordid)
        const uniqueRecordIds = new Set(recordIds)
        if (recordIds.length !== uniqueRecordIds.size) {
          console.warn("[v0] WARNING: Duplicate recordids detected in events!")
        }

        saveEvent(draggedEvent.recordid, newStart, newEnd)

        return { ...prev, events: updatedEvents, unplannedEvents: updatedUnplanned }
      })

      setDraggedEvent(null)
    },
    [draggedEvent, responseData.events],
  )

  const handleResizeStart = (e: React.MouseEvent, event: any, handle: "top" | "bottom" | "right") => {
    e.stopPropagation()
    e.preventDefault()
    setResizingEvent({
      recordid: event.recordid,
      handle,
      originalStart: new Date(event.start),
      originalEnd: new Date(event.end),
    })
    setResizeStartY(e.clientY)
    setResizeStartX(e.clientX)
  }

  useEffect(() => {
    if (!resizingEvent) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()

      if (resizingEvent.handle === "right") {
        const deltaX = e.clientX - resizeStartX
        const cellWidth = 160 // Assuming cell width for week/day view
        const daysDelta = Math.round(deltaX / cellWidth)

        setResponseData((prev) => ({
          ...prev,
          events: prev.events.map((event) => {
            if (event.recordid !== resizingEvent.recordid) return event

            const newEnd = new Date(resizingEvent.originalEnd)
            newEnd.setDate(newEnd.getDate() + daysDelta)

            const startDay = new Date(event.start)
            startDay.setHours(0, 0, 0, 0)
            const newEndDay = new Date(newEnd)
            newEndDay.setHours(0, 0, 0, 0)

            if (newEndDay >= startDay) {
              return { ...event, end: toLocalISOString(newEnd) }
            }
            return event
          }),
        }))
      } else {
        const deltaY = e.clientY - resizeStartY
        const minutesPerPixel = 1 // Approximate based on visual inspection or define a constant
        const deltaMinutes = Math.round(deltaY * minutesPerPixel)

        setResponseData((prev) => ({
          ...prev,
          events: prev.events.map((event) => {
            if (event.recordid !== resizingEvent.recordid) return event

            if (resizingEvent.handle === "top") {
              const newStart = new Date(resizingEvent.originalStart)
              newStart.setMinutes(newStart.getMinutes() + deltaMinutes)
              const end = new Date(event.end)
              if (newStart < end) {
                return { ...event, start: toLocalISOString(newStart) }
              }
            } else if (resizingEvent.handle === "bottom") {
              const newEnd = new Date(resizingEvent.originalEnd)
              newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes)
              const start = new Date(event.start)
              if (newEnd > start) {
                return { ...event, end: toLocalISOString(newEnd) }
              }
            }
            return event
          }),
        }))
      }
    }

    const handleMouseUp = () => {
      if (resizingEvent) {
        const event = responseData.events.find((e) => e.recordid === resizingEvent.recordid)
        if (event && event.end) {
          saveEvent(event.recordid, new Date(event.start), new Date(event.end))
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
  }, [resizingEvent, resizeStartY, resizeStartX, responseData.events])

  // --- DATE & NAVIGATION ---
  const handleToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate)
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else if (view === "week") {
        newDate.setDate(newDate.getDate() - 7)
      } else {
        // day view
        newDate.setDate(newDate.getDate() - 1)
      }
      return newDate
    })
  }, [view])

  const handleNext = useCallback(() => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate)
      if (view === "month") {
        newDate.setMonth(newDate.getMonth() + 1)
      } else if (view === "week") {
        newDate.setDate(newDate.getDate() + 7)
      } else {
        // day view
        newDate.setDate(newDate.getDate() + 1)
      }
      return newDate
    })
  }, [view])

  const renderHeaderTitle = useCallback(() => {
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
    if (view === "month") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    } else if (view === "week") {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return `${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`
    } else {
      // day view
      return currentDate.toLocaleDateString("it-IT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }, [view, currentDate])

  const getEventDurationHours = (event: any) => {
    if (!event.end) return 1
    const start = new Date(event.start)
    const end = new Date(event.end)
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }

  const getEventDaySpan = (event: any) => {
    if (!event.end) return 1
    const startDay = new Date(event.start)
    startDay.setHours(0, 0, 0, 0)
    const endDay = new Date(event.end)
    endDay.setHours(0, 0, 0, 0)
    const daysDiff = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff + 1
  }

  const isMultiDayEvent = (event: any) => {
    if (!event.end) return false
    return new Date(event.start).toDateString() !== new Date(event.end).toDateString()
  }

  const getEventPositionInSpan = (event: any, currentDay: Date): "first" | "middle" | "last" | "single" => {
    const eventStartDay = new Date(event.start)
    eventStartDay.setHours(0, 0, 0, 0)
    const eventEndDay = new Date(event.end || event.start)
    eventEndDay.setHours(0, 0, 0, 0)
    const currentDayNormalized = new Date(currentDay)
    currentDayNormalized.setHours(0, 0, 0, 0)

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
          borderRadius: "0.375rem 0 0 0.375rem",
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
          borderRadius: "0 0.375rem 0.375rem 0",
          borderLeft: "none",
        }
      case "single":
        return {
          borderRadius: "0.375rem",
        }
    }
  }

  // Month view helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1)
  const dayOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1 // Monday is 0

  const renderMonthView = (data: ResponseInterface) => {
    const dayCells = Array.from({ length: dayOffset + daysInMonth }, (_, i) => {
      if (i < dayOffset)
        return (
          <div
            key={`empty-${i}`}
            className="border-t border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
          ></div>
        )

      const dayNumber = i - dayOffset + 1
      const cellDate = new Date(year, month, dayNumber)
      const isToday = cellDate.toDateString() === new Date().toDateString() // Use current date for 'today'

      const eventsForDay = data.events.filter((event) => {
        const eventStartDay = new Date(event.start)
        eventStartDay.setHours(0, 0, 0, 0)
        const eventEndDay = new Date(event.end || event.start)
        eventEndDay.setHours(0, 0, 0, 0)
        const cellDay = new Date(cellDate)
        cellDay.setHours(0, 0, 0, 0)

        return cellDay.getTime() >= eventStartDay.getTime() && cellDay.getTime() <= eventEndDay.getTime()
      })

      return (
        <div
          key={dayNumber}
          className="relative border-t border-r border-gray-200 dark:border-gray-700 p-1 min-h-[120px] flex flex-col"
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add("bg-blue-50")
          }}
          onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50")}
          onDrop={(e) => {
            e.preventDefault()
            handleDrop(cellDate)
            e.currentTarget.classList.remove("bg-blue-50")
          }}
        >
          <span
            className={`font-semibold text-sm ${isToday ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}`}
          >
            {dayNumber}
          </span>
          <div className="mt-1 space-y-1 flex-grow overflow-y-auto">
            {eventsForDay.map((event) => {
              const durationHours = getEventDurationHours(event)
              const baseHeightPerHour = 8 // Adjust this based on your desired pixel height per hour
              const maxHeight = 24 * baseHeightPerHour // Max height for a 24-hour day
              const calculatedHeight = Math.min(durationHours * baseHeightPerHour, maxHeight)
              const eventHeight = Math.max(calculatedHeight, 40) // Minimum height for visibility

              const position = getEventPositionInSpan(event, cellDate)
              const positionStyles = getEventPositionStyles(position)
              const daySpan = getEventDaySpan(event)

              return (
                <div
                  key={`${event.recordid}-${event.start}-${cellDate.toISOString()}`}
                  draggable={!resizingEvent}
                  onDragStart={(e) => !resizingEvent && handleDragStart(e, event)}
                  onClick={() => {
                    setSelectedEvent(event)
                    setShowEventDialog(true)
                  }}
                  className={`relative group p-1.5 text-xs cursor-move select-none hover:opacity-80 transition-opacity`}
                  style={{
                    height: `${eventHeight}px`,
                    ...positionStyles,
                    backgroundColor: event.color || "#3b82f6",
                    opacity: draggedEvent?.recordid === event.recordid ? 0.5 : 1,
                    cursor: resizingEvent ? (resizingEvent.handle === "right" ? "ew-resize" : "ns-resize") : "move",
                  }}
                >
                  {(position === "first" || position === "single") && (
                    <div
                      className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                      style={{ borderRadius: "0.375rem 0.375rem 0 0" }}
                      onMouseDown={(e) => handleResizeStart(e, event, "top")}
                    />
                  )}

                  <p className="font-bold truncate text-white">
                    {event.title}
                    {position === "middle" && <span className="ml-1">→</span>}
                  </p>
                  <p className="text-xs text-white">
                    {position === "first" || position === "single" ? (
                      <>
                        {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {event.end &&
                          ` - ${new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                        {isMultiDayEvent(event) && <span className="ml-1">({daySpan}g)</span>}
                      </>
                    ) : position === "middle" ? (
                      <span>continua →</span>
                    ) : (
                      <span>
                        ← fino a {new Date(event.end!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </p>

                  {(position === "last" || position === "single") && (
                    <>
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                        style={{ borderRadius: "0 0 0.375rem 0.375rem" }}
                        onMouseDown={(e) => handleResizeStart(e, event, "bottom")}
                      />
                      <div
                        className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30"
                        style={{ borderRadius: "0 0.375rem 0.375rem 0" }}
                        onMouseDown={(e) => handleResizeStart(e, event, "right")}
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    })

    return (
      <>
        <div className="grid grid-cols-7 text-center font-semibold text-sm py-2 text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">
          <div>Lunedì</div> <div>Martedì</div> <div>Mercoledì</div> <div>Giovedì</div> <div>Venerdì</div>{" "}
          <div>Sabato</div> <div>Domenica</div>
        </div>
        <div className="grid grid-cols-7 h-full">{dayCells}</div>
      </>
    )
  }

  // Week view helpers
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const renderWeekView = (data: ResponseInterface) => {
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

    return (
      <div className="flex flex-col h-full">
        {/* Header with days */}
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
          <div className="p-2 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold sticky top-0 left-0 z-20">
            Ora
          </div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-2 text-center border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold sticky top-0 z-10 ${day.toDateString() === new Date().toDateString() ? "text-blue-600" : ""}`}
            >
              <p>{day.toLocaleString("it-IT", { weekday: "short" })}</p>
              <p className="text-2xl">{day.getDate()}</p>
            </div>
          ))}
        </div>

        {/* Time slots with events */}
        <div className="flex-grow overflow-auto">
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className="p-2 border-r border-b border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 sticky left-0 z-10">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {weekDays.map((day) => {
                  const slotStart = new Date(day)
                  slotStart.setHours(hour, 0, 0, 0)
                  const slotEnd = new Date(day)
                  slotEnd.setHours(hour + 1, 0, 0, 0)

                  const slotEvents = data.events.filter((event) => {
                    const eventStart = new Date(event.start)
                    const eventEnd = new Date(event.end || event.start)
                    // Check if the event overlaps with the current hour slot
                    return (
                      eventStart < slotEnd && eventEnd > slotStart && eventStart.toDateString() === day.toDateString()
                    )
                  })

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="relative min-h-16 border-b border-r border-gray-200 dark:border-gray-700 transition-colors duration-200"
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
                      {slotEvents.map((event) => {
                        // Only render the event if its start hour matches the current hour slot
                        if (new Date(event.start).getHours() !== hour) return null

                        const eventStart = new Date(event.start)
                        const eventEnd = new Date(event.end || event.start)
                        const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60)
                        const pixelsPerMinute = 1 // Adjust this based on your time slot height (e.g., 16px per 15 mins = 0.66 pixels/minute)
                        const eventHeight = durationMinutes * pixelsPerMinute

                        const minutesFromSlotStart = (eventStart.getTime() - slotStart.getTime()) / (1000 * 60)
                        const topPosition = minutesFromSlotStart * pixelsPerMinute

                        return (
                          <div
                            key={event.recordid}
                            draggable={!resizingEvent}
                            onDragStart={(e) => !resizingEvent && handleDragStart(e, event)}
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowEventDialog(true)
                            }}
                            className={`absolute left-1 right-1 group p-2 rounded text-sm cursor-move select-none shadow z-10 text-white`}
                            style={{
                              backgroundColor: event.color || "#3b82f6",
                              top: `${topPosition}px`,
                              height: `${eventHeight}px`,
                              minHeight: "40px", // Ensure a minimum visible height
                              opacity: draggedEvent?.recordid === event.recordid ? 0.5 : 1,
                              cursor: resizingEvent
                                ? resizingEvent.handle === "right"
                                  ? "ew-resize"
                                  : "ns-resize"
                                : "move",
                            }}
                          >
                            <div
                              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t"
                              onMouseDown={(e) => handleResizeStart(e, event, "top")}
                            />

                            <div className="font-semibold text-xs truncate">{event.title}</div>
                            <div className="text-xs">
                              {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                              {event.end
                                ? new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : ""}
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
        </div>
      </div>
    )
  }

  // Day view helpers
  const getEventPosition = (event: any) => {
    const start = new Date(event.start)
    const end = new Date(event.end || event.start) // Handle events without end date
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    // Clamp event start and end to the current day
    const effectiveStart = Math.max(start.getTime(), dayStart.getTime())
    const effectiveEnd = Math.min(end.getTime(), dayEnd.getTime())

    const totalMinutesInDay = 24 * 60
    const minutesFromMidnightStart = (effectiveStart - dayStart.getTime()) / (1000 * 60)
    const durationMinutes = (effectiveEnd - effectiveStart) / (1000 * 60)

    const topPercentage = (minutesFromMidnightStart / totalMinutesInDay) * 100
    const heightPercentage = (durationMinutes / totalMinutesInDay) * 100

    return {
      top: topPercentage,
      height: Math.max(heightPercentage, 2), // Ensure a minimum height
    }
  }

  const renderDayView = (data: ResponseInterface) => {
    const eventsForDay = data.events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end || event.start)
      const currentDayStart = new Date(currentDate)
      currentDayStart.setHours(0, 0, 0, 0)
      const currentDayEnd = new Date(currentDate)
      currentDayEnd.setHours(23, 59, 59, 999)

      return eventStart < currentDayEnd && eventEnd > currentDayStart
    })

    return (
      <div className="flex h-full overflow-auto">
        <div className="w-16 text-right pr-2 border-r dark:border-gray-700">
          {hours.map((hour) => (
            <div key={hour} className="h-16 flex items-start justify-end">
              <span className="text-xs text-gray-500 -mt-2">{hour.toString().padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
        <div className="relative flex-grow">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b dark:border-gray-700"
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add("bg-blue-50")
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50")}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(currentDate, hour)
                e.currentTarget.classList.remove("bg-blue-50")
              }}
            ></div>
          ))}
          <div className="absolute inset-0">
            {eventsForDay.map((event) => {
              const { top, height } = getEventPosition(event)
              return (
                <div
                  key={event.recordid}
                  draggable={!resizingEvent}
                  onDragStart={(e) => !resizingEvent && handleDragStart(e, event)}
                  onClick={() => {
                    setSelectedEvent(event)
                    setShowEventDialog(true)
                  }}
                  className={`absolute left-2 right-2 group p-2 rounded text-xs cursor-move text-white`}
                  style={{
                    backgroundColor: event.color || "#3b82f6",
                    top: `${top}%`,
                    height: `${height}%`,
                    opacity: draggedEvent?.recordid === event.recordid ? 0.5 : 1,
                    cursor: resizingEvent ? (resizingEvent.handle === "right" ? "ew-resize" : "ns-resize") : "move",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t"
                    onMouseDown={(e) => handleResizeStart(e, event, "top")}
                  />

                  <p className="font-bold">{event.title}</p>
                  <p>
                    {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {event.end
                      ? new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </p>

                  <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-b"
                    onMouseDown={(e) => handleResizeStart(e, event, "bottom")}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderCalendar = (data: ResponseInterface) => {
    switch (view) {
      case "month":
        return renderMonthView(data)
      case "week":
        return renderWeekView(data)
      case "day":
        return renderDayView(data)
      default:
        return renderMonthView(data)
    }
  }

  console.log("[DEBUG] Rendering RecordsCalendar", { tableid, responseData })

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(data: ResponseInterface) => (
        <div className="flex h-full w-full">
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-x-2">
                <button
                  onClick={handleToday}
                  className="px-4 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Oggi
                </button>
                <div className="flex items-center">
                  <button
                    onClick={handlePrev}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <h2 className="text-xl font-semibold ml-2 capitalize">{renderHeaderTitle()}</h2>
              </div>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-md">
                <button
                  onClick={() => setView("month")}
                  className={`px-3 py-1 text-sm rounded ${view === "month" ? "bg-white dark:bg-gray-700 shadow" : "hover:bg-gray-200 dark:hover:bg-gray-700/50"}`}
                >
                  Mese
                </button>
                <button
                  onClick={() => setView("week")}
                  className={`px-3 py-1 text-sm rounded ${view === "week" ? "bg-white dark:bg-gray-700 shadow" : "hover:bg-gray-200 dark:hover:bg-gray-700/50"}`}
                >
                  Settimana
                </button>
                <button
                  onClick={() => setView("day")}
                  className={`px-3 py-1 text-sm rounded ${view === "day" ? "bg-white dark:bg-gray-700 shadow" : "hover:bg-gray-200 dark:hover:bg-gray-700/50"}`}
                >
                  Giorno
                </button>
              </div>
            </header>
            <main className="flex-grow overflow-auto">{renderCalendar(data)}</main>
            <footer className="text-right p-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              <span className="font-medium">Eventi totali:</span> {data.counter}
            </footer>
          </div>

          {showUnplannedEvents && (
            <aside className="w-80 border-l bg-white dark:bg-gray-900 flex flex-col">
              <div className="p-4 flex-grow overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Eventi da pianificare</h3>
                <div className="space-y-2">
                  {data.unplannedEvents?.map((ev) => (
                    <div
                      key={ev.recordid}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, ev)}
                      className={`p-2 rounded cursor-move shadow`}
                      style={{ backgroundColor: ev.color || "#f97316" }}
                    >
                      <div className="font-semibold text-white">{ev.title}</div>
                      {ev.description && <div className="text-xs opacity-90 text-white">{ev.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Updated Dialog to use start/end instead of startDate/endDate */}
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogContent className="bg-white dark:bg-gray-900">
              <DialogHeader>
                <DialogTitle>{selectedEvent?.title}</DialogTitle>
              </DialogHeader>
              {selectedEvent && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2" />
                    <span>
                      {new Date(selectedEvent.start).toLocaleDateString("it-IT")}
                      {isMultiDayEvent(selectedEvent) &&
                        ` - ${new Date(selectedEvent.end).toLocaleDateString("it-IT")}`}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2" />
                    <span>
                      {new Date(selectedEvent.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {selectedEvent.end
                        ? new Date(selectedEvent.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
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
