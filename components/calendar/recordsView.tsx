"use client"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarChildProps } from "./calendarBase"
import {
  getEventDurationHours,
  getEventDaySpan,
  isMultiDayEvent,
  getEventPositionInSpan,
  getEventPositionStyles,
} from "@/components/calendar/calendarHelpers"
import React from "react"
import { useRecordsStore } from "../records/recordsStore"
import GenericComponent from "../genericComponent"

interface RecordsViewProps extends CalendarChildProps {
  initialView?: "day" | "week" | "month"
}

const WORK_HOUR_START = 8
const WORK_HOUR_END = 17

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
  initialView = "month",
}: RecordsViewProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())
  const { handleRowClick } = useRecordsStore()

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

  const renderMonthView = () => {
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
      const isToday = cellDate.toDateString() === new Date().toDateString()

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
            handleDrop(cellDate, undefined)
            e.currentTarget.classList.remove("bg-blue-50")
          }}
        >
          <span
            className={`font-semibold text-sm ${isToday ? "bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center" : ""}`}
          >
            {dayNumber}
          </span>
          <div className="mt-1 space-y-1 flex-grow overflow-y-auto">
            {eventsForDay.map((event) => {
              const durationHours = getEventDurationHours(event)
              const baseHeightPerHour = 8
              const maxHeight = 24 * baseHeightPerHour
              const calculatedHeight = Math.min(durationHours * baseHeightPerHour, maxHeight)
              const eventHeight = Math.max(calculatedHeight, 40)

              const position = getEventPositionInSpan(event, cellDate)
              const positionStyles = getEventPositionStyles(position)
              const daySpan = getEventDaySpan(event)

              return (
                <div
                  key={`${event.recordid}-${event.start}-${cellDate.toISOString()}`}
                  draggable={!resizingEvent}
                  onDragStart={() => !resizingEvent && handleDragStart(event)}
                  onClick={() => handleRowClick?.("standard", event.recordid, tableid)}
                  className="relative group p-1.5 text-xs cursor-pointer select-none hover:opacity-80 transition-opacity"
                  style={{
                    height: `${eventHeight}px`,
                    ...positionStyles,
                    backgroundColor: event.color || "#3b82f6",
                    opacity: draggedEvent?.recordid === event.recordid ? 0.5 : 1,
                    cursor: resizingEvent ? (resizingEvent.handle === "right" ? "ew-resize" : "ns-resize") : "pointer",
                  }}
                >
                  {(position === "first" || position === "single") && (
                    <div
                      className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                      style={{
                        borderTopLeftRadius: "0.375rem",
                        borderTopRightRadius: "0.375rem",
                        borderBottomLeftRadius: "0",
                        borderBottomRightRadius: "0",
                      }}
                      onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
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
                        style={{
                          borderTopLeftRadius: "0",
                          borderTopRightRadius: "0",
                          borderBottomLeftRadius: "0.375rem",
                          borderBottomRightRadius: "0.375rem",
                        }}
                        onMouseDown={(e) => handleResizeStart(event, "bottom", e.clientY, e.clientX)}
                      />
                      <div
                        className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30"
                        style={{
                          borderTopLeftRadius: "0",
                          borderTopRightRadius: "0.375rem",
                          borderBottomLeftRadius: "0.375rem",
                          borderBottomRightRadius: "0",
                        }}
                        onMouseDown={(e) => handleResizeStart(event, "right", e.clientY, e.clientX)}
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
            startHour = eventStart.getHours()
            startMinute = eventStart.getMinutes()
            endHour = eventEnd.getHours()
            endMinute = eventEnd.getMinutes()
          } else if (isFirstDay) {
            // First day: from event start to 17:00
            startHour = eventStart.getHours()
            startMinute = eventStart.getMinutes()
            endHour = 17
            endMinute = 0
          } else if (isLastDay) {
            // Last day: from 8:00 to event end
            startHour = 8
            startMinute = 0
            endHour = eventEnd.getHours()
            endMinute = eventEnd.getMinutes()
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
                            draggable={!resizingEvent}
                            onDragStart={() => !resizingEvent && handleDragStart(event)}
                            onClick={() => handleRowClick?.("standard", event.recordid, tableid)}
                            className="absolute left-1 right-1 group p-1.5 text-xs cursor-pointer select-none hover:opacity-80 transition-opacity rounded"
                            style={{
                              height: `${eventHeight}px`,
                              backgroundColor: event.color || "#3b82f6",
                              opacity: draggedEvent?.recordid === event.recordid ? 0.5 : 1,
                              cursor: resizingEvent
                                ? resizingEvent.handle === "right"
                                  ? "ew-resize"
                                  : "ns-resize"
                                : "pointer",
                              zIndex: 10,
                            }}
                          >
                            <div
                              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t"
                              onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
                            />

                            <p className="font-bold truncate text-white">{event.title}</p>
                            <p className="text-xs text-white">
                              {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {event.end &&
                                ` - ${new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                            </p>

                            <div
                              className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-b"
                              onMouseDown={(e) => handleResizeStart(event, "bottom", e.clientY, e.clientX)}
                            />
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
                            draggable={!resizingEvent}
                            onDragStart={() => !resizingEvent && handleDragStart(segment.event)}
                            onClick={() => handleRowClick?.("standard", segment.event.recordid, tableid)}
                            className="absolute left-1 right-1 group p-1.5 text-xs cursor-pointer select-none hover:opacity-80 transition-opacity"
                            style={{
                              top: `${topPosition}px`,
                              height: `${height}px`,
                              ...positionStyles,
                              backgroundColor: segment.event.color || "#3b82f6",
                              opacity: draggedEvent?.recordid === segment.event.recordid ? 0.5 : 1,
                              cursor: resizingEvent
                                ? resizingEvent.handle === "right"
                                  ? "ew-resize"
                                  : "ns-resize"
                                : "pointer",
                              zIndex: 10,
                            }}
                          >
                            {(position === "first" || position === "single") && (
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

                            {(position === "last" || position === "single") && (
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
                  draggable={!resizingEvent}
                  onDragStart={(e) => {
                    e.currentTarget.style.pointerEvents = "auto"
                    !resizingEvent && handleDragStart(event)
                  }}
                  onClick={() => handleRowClick?.("standard", event.recordid, tableid)}
                  className="absolute group p-2 text-xs cursor-pointer text-white shadow pointer-events-auto"
                  style={{
                    backgroundColor: event.color || "#3b82f6",
                    top: `${topPosition}px`,
                    height: `${height}px`,
                    left: "8px",
                    width: "calc(80% - 8px)",
                    opacity: draggedEvent?.recordid === event.recordid ? 0.5 : 1,
                    cursor: resizingEvent ? "ns-resize" : "pointer",
                    zIndex: 10,
                    ...borderRadiusStyle,
                  }}
                >
                  {segment.isFirst && (
                    <div
                      className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t pointer-events-auto"
                      onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
                    />
                  )}

                  <p className="font-bold truncate">{event.title}</p>
                  <p className="text-xs">
                    {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {event.end
                      ? new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </p>

                  {segment.isLast && (
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
    <GenericComponent response={data} loading={loading} error={error}>
      {(response) => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-x-2">
          <button
            onClick={handleToday}
            className="px-4 py-1.5 text-sm font-medium border border-primary/20 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Oggi
          </button>
          <div className="flex items-center">
            <button onClick={handlePrev} className="p-1.5 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={handleNext} className="p-1.5 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-xl font-semibold ml-2 capitalize">{renderHeaderTitle()}</h2>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-md">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === "month" ? "bg-primary text-primary-foreground shadow" : "hover:bg-accent hover:text-accent-foreground"}`}
          >
            Mese
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground shadow" : "hover:bg-accent hover:text-accent-foreground"}`}
          >
            Settimana
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === "day" ? "bg-primary text-primary-foreground shadow" : "hover:bg-accent hover:text-accent-foreground"}`}
          >
            Giorno
          </button>
        </div>
      </header>

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
