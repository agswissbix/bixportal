"use client"

import React, { useState } from "react"
import type { CalendarChildProps } from "./calendarBase"
import {
  getEventDaySpan,
  getEventDurationHours,
  isMultiDayEvent,
  getEventPositionInSpan,
  getEventPositionStyles,
} from "./calendarHelpers"
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
    return (
      <div className="relative flex-1 overflow-auto">
        <div className="grid border-l border-gray-200 dark:border-gray-700" style={gridColsStyle}>
          <div className="p-2 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold sticky top-0 left-0 z-20 text-sm">
            Dipendenti
          </div>
          {displayedDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`${day.getDate() === new Date().getDate() ? "text-accent" : ""} p-2 text-center border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold sticky top-0 z-10`}
            >
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {day.toLocaleDateString("it-IT", { weekday: "short" })}
              </p>
              <p className="text-2xl">{day.getDate()}</p>
            </div>
          ))}

          {resources.map((resource) => (
            <React.Fragment key={resource.id}>
              <div className="p-2 border-r border-b border-gray-200 dark:border-gray-700 font-medium bg-white dark:bg-gray-900 sticky left-0 z-10 text-sm">
                {resource.name}
              </div>

              {displayedDays.map((day, dayIndex) => {
                const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())

                const dayEvents = events
                  .filter((event) => {
                    const eventStart = new Date(event.start)
                    const eventEnd = new Date(event.end)
                    const eventStartDay = new Date(
                      eventStart.getFullYear(),
                      eventStart.getMonth(),
                      eventStart.getDate(),
                    )
                    const eventEndDay = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())

                    return (
                      event.resourceId === resource.id &&
                      dayStart.getTime() >= eventStartDay.getTime() &&
                      dayStart.getTime() <= eventEndDay.getTime()
                    )
                  })
                  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

                return (
                  <div
                    key={`${resource.id}-${day.toISOString()}`}
                    className="min-h-32 p-1 border-b border-r border-gray-200 dark:border-gray-700 transition-colors duration-200 relative"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add("bg-blue-50")
                    }}
                    onDragLeave={(e) => e.currentTarget.classList.remove("bg-blue-50")}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDrop(day, undefined, resource.id)
                      e.currentTarget.classList.remove("bg-blue-50")
                    }}
                  >
                    {dayEvents.map((event) => {
                      const durationHours = getEventDurationHours(event)
                      const baseHeightPerHour = 8
                      const maxHeight = 24 * baseHeightPerHour
                      const calculatedHeight = Math.min(durationHours * baseHeightPerHour, maxHeight)
                      const eventHeight = Math.max(calculatedHeight, 40)
                      const daySpan = getEventDaySpan(event)
                      const position = getEventPositionInSpan(event, day)
                      const positionStyles = getEventPositionStyles(position)

                      return (
                        <div
                          key={`${getEventUniqueId(event)}-${dayIndex}`}
                          draggable={!resizingEvent && !event.disabled}
                          onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
                          onClick={() => !event.disabled && handleRowClick?.("standard", event.recordid, tableid)}
                          className="relative group p-1.5 text-xs cursor-pointer text-white select-none shadow hover:opacity-80 transition-opacity mb-1"
                          style={{
                            backgroundColor: event.color,
                            height: `${eventHeight}px`,
                            ...positionStyles,
                            opacity:
                              draggedEvent?.recordid === event.recordid &&
                              draggedEvent?.start === event.start &&
                              draggedEvent?.resourceId === event.resourceId
                                ? 0.5
                                : event.disabled
                                  ? 0.6
                                  : 1,
                            cursor: event.disabled
                              ? "not-allowed"
                              : resizingEvent
                                ? resizingEvent.handle === "right"
                                  ? "ew-resize"
                                  : "ns-resize"
                                : "pointer",
                            pointerEvents: event.disabled ? "none" : "auto",
                          }}
                        >
                          {!event.disabled && (position === "first" || position === "single") && (
                            <div
                              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                              style={{ borderRadius: "0.375rem 0.375rem 0 0" }}
                              onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
                            />
                          )}

                          <div className="font-bold truncate">
                            {event.title}
                            {position === "middle" && <span className="ml-1">→</span>}
                          </div>
                          <div className="text-xs opacity-90">
                            {position === "first" || position === "single" ? (
                              <>
                                {formatEventTime(event.start)} - {formatEventTime(event.end)}
                                {isMultiDayEvent(event) && <span className="ml-1">({daySpan}g)</span>}
                              </>
                            ) : position === "middle" ? (
                              <span>continua →</span>
                            ) : (
                              <span>← fino a {formatEventTime(event.end)}</span>
                            )}
                          </div>

                          {!event.disabled && (position === "last" || position === "single") && (
                            <>
                              <div
                                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                                style={{ borderRadius: "0 0 0.375rem 0.375rem" }}
                                onMouseDown={(e) => handleResizeStart(event, "bottom", e.clientY, e.clientX)}
                              />
                              <div
                                className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30"
                                style={{ borderRadius: "0 0.375rem 0.375rem 0" }}
                                onMouseDown={(e) => handleResizeStart(event, "right", e.clientY, e.clientX)}
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
    )
  }

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayEvents = events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      return (
        eventStart.toDateString() === currentDate.toDateString() ||
        eventEnd.toDateString() === currentDate.toDateString() ||
        (eventStart < currentDate && eventEnd > currentDate)
      )
    })

    return (
      <div className="flex-1 overflow-auto">
        <div
          className="grid border-l border-gray-200 dark:border-gray-700"
          style={{ gridTemplateColumns: `100px repeat(${resources.length}, 1fr)` }}
        >
          <div className="p-3 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold sticky top-0 left-0 z-20 text-sm">
            Ora
          </div>
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="p-3 text-center border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 font-semibold sticky top-0 z-10"
            >
              {resource.name}
            </div>
          ))}

          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="p-3 border-r border-b border-gray-200 dark:border-gray-700 text-sm bg-background sticky left-0 z-10 font-medium text-muted-foreground">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {resources.map((resource) => {
                const slotStart = new Date(currentDate)
                slotStart.setHours(hour, 0, 0, 0)
                const slotEnd = new Date(currentDate)
                slotEnd.setHours(hour + 1, 0, 0, 0)

                const slotEvents = dayEvents
                  .filter((event) => event.resourceId === resource.id)
                  .map((event) => {
                    const eventStart = new Date(event.start)
                    const eventEnd = new Date(event.end)
                    const eventStartDate = eventStart.toDateString()
                    const eventEndDate = eventEnd.toDateString()
                    const currentDateString = currentDate.toDateString()
                    const isMultiDay = isMultiDayEvent(event)

                    let segmentStartHour: number
                    let segmentStartMinute: number
                    let segmentEndHour: number
                    let segmentEndMinute: number

                    if (isMultiDay) {
                      // Multi-day event: calculate segment for current day
                      if (currentDateString === eventStartDate) {
                        // First day: from actual start time to 17:00
                        segmentStartHour = eventStart.getHours()
                        segmentStartMinute = eventStart.getMinutes()
                        segmentEndHour = 17
                        segmentEndMinute = 0
                      } else if (currentDateString === eventEndDate) {
                        // Last day: from 8:00 to actual end time
                        segmentStartHour = 8
                        segmentStartMinute = 0
                        segmentEndHour = eventEnd.getHours()
                        segmentEndMinute = eventEnd.getMinutes()
                      } else {
                        // Intermediate day: from 8:00 to 17:00
                        segmentStartHour = 8
                        segmentStartMinute = 0
                        segmentEndHour = 17
                        segmentEndMinute = 0
                      }
                    } else {
                      // Single day event: use actual times
                      segmentStartHour = eventStart.getHours()
                      segmentStartMinute = eventStart.getMinutes()
                      segmentEndHour = eventEnd.getHours()
                      segmentEndMinute = eventEnd.getMinutes()
                    }

                    const segmentStart = new Date(currentDate)
                    segmentStart.setHours(segmentStartHour, segmentStartMinute, 0, 0)
                    const segmentEnd = new Date(currentDate)
                    segmentEnd.setHours(segmentEndHour, segmentEndMinute, 0, 0)

                    return {
                      ...event,
                      segmentStart,
                      segmentEnd,
                      segmentStartHour,
                      segmentStartMinute,
                      segmentEndHour,
                      segmentEndMinute,
                    }
                  })
                  .filter((event) => {
                    // Only show events that overlap with this hour slot
                    return event.segmentStart < slotEnd && event.segmentEnd > slotStart
                  })

                return (
                  <div
                    key={`${resource.id}-${hour}`}
                    className="relative min-h-20 border-b border-r border-gray-200 dark:border-gray-700 transition-colors duration-200 bg-background hover:bg-muted/30"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add("bg-primary/10")
                    }}
                    onDragLeave={(e) => e.currentTarget.classList.remove("bg-primary/10")}
                    onDrop={(e) => {
                      e.preventDefault()
                      const dropTime = new Date(currentDate)
                      dropTime.setHours(hour, 0, 0, 0)
                      handleDrop(dropTime, hour, resource.id)
                      e.currentTarget.classList.remove("bg-primary/10")
                    }}
                  >
                    {slotEvents.map((event) => {
                      if (event.segmentStartHour !== hour) return null

                      const durationMinutes = (event.segmentEnd.getTime() - event.segmentStart.getTime()) / (1000 * 60)
                      const pixelsPerMinute = 1
                      const eventHeight = durationMinutes * pixelsPerMinute

                      const minutesFromSlotStart = (event.segmentStart.getTime() - slotStart.getTime()) / (1000 * 60)
                      const topPosition = minutesFromSlotStart * pixelsPerMinute

                      return (
                        <div
                          key={getEventUniqueId(event)}
                          draggable={!resizingEvent && !event.disabled}
                          onDragStart={() => !resizingEvent && !event.disabled && handleDragStart(event)}
                          onClick={() => !event.disabled && handleRowClick?.("standard", event.recordid, tableid)}
                          className="absolute left-2 right-2 group p-2.5 rounded-md cursor-pointer text-white select-none shadow-md hover:shadow-lg transition-shadow z-10"
                          style={{
                            backgroundColor: event.color,
                            top: `${topPosition}px`,
                            height: `${eventHeight}px`,
                            minHeight: "48px",
                            opacity:
                              draggedEvent?.recordid === event.recordid &&
                              draggedEvent?.start === event.start &&
                              draggedEvent?.resourceId === event.resourceId
                                ? 0.5
                                : event.disabled
                                  ? 0.6
                                  : 1,
                            cursor: event.disabled ? "not-allowed" : "pointer",
                            pointerEvents: event.disabled ? "none" : "auto",
                          }}
                        >
                          {!event.disabled && (
                            <div
                              className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/40 rounded-t transition-opacity"
                              onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
                            />
                          )}

                          <div className="font-bold text-sm truncate leading-tight">{event.title}</div>
                          <div className="text-xs mt-1 opacity-95">
                            {event.segmentStartHour.toString().padStart(2, "0")}:
                            {event.segmentStartMinute.toString().padStart(2, "0")} -{" "}
                            {event.segmentEndHour.toString().padStart(2, "0")}:
                            {event.segmentEndMinute.toString().padStart(2, "0")}
                          </div>

                          {!event.disabled && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/40 rounded-b transition-opacity"
                              onMouseDown={(e) => handleResizeStart(event, "bottom", e.clientY, e.clientX)}
                            />
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
    )
  }

  return (
    <GenericComponent loading={loading} error={error}>
      {(response) => (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
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
