"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarChildProps } from "@/components/calendar/calendarBase"
import {
  getEventDaySpan,
  getEventDurationHours,
  isMultiDayEvent,
  getEventPositionInSpan,
  getEventPositionStyles,
} from "@/components/calendar/calendarHelpers"

export default function MatrixView({
  data,
  loading,
  error,
  draggedEvent,
  resizingEvent,
  handleDragStart,
  handleDrop,
  handleResizeStart,
}: CalendarChildProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedWeek, setSelectedWeek] = useState(0)

  const events = data.events
  const resources = data.resources || []

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
    gridTemplateColumns: `minmax(180px, 1fr) repeat(${displayedDays.length}, minmax(160px, 1fr))`,
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

  const renderWeekMonthView = () => {
    return (
      <div className="relative">
        <div className="grid" style={gridColsStyle}>
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

          {resources.map((resource) => (
            <React.Fragment key={resource.id}>
              <div className="p-2 border-r border-b border-gray-200 font-medium bg-white sticky left-0 z-10">
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
                    className="min-h-24 p-1 border-b border-gray-200 transition-colors duration-200 relative"
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
                      const eventHeight = Math.max(calculatedHeight, 48)
                      const daySpan = getEventDaySpan(event)
                      const position = getEventPositionInSpan(event, day)
                      const positionStyles = getEventPositionStyles(position)

                      return (
                        <div
                          key={`${getEventUniqueId(event)}-${dayIndex}`}
                          draggable={!resizingEvent}
                          onDragStart={() => !resizingEvent && handleDragStart(event)}
                          className="relative group p-2 text-sm cursor-move text-white select-none shadow-sm mb-1"
                          style={{
                            backgroundColor: event.color,
                            height: `${eventHeight}px`,
                            ...positionStyles,
                            opacity:
                              draggedEvent?.recordid === event.recordid &&
                              draggedEvent?.start === event.start &&
                              draggedEvent?.resourceId === event.resourceId
                                ? 0.5
                                : 1,
                            cursor: resizingEvent
                              ? (resizingEvent as any).handle === "right"
                                ? "ew-resize"
                                : "ns-resize"
                              : "move",
                          }}
                        >
                          {(position === "first" || position === "single") && (
                            <div
                              className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                              style={{ borderRadius: "0.375rem 0.375rem 0 0" }}
                              onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
                            />
                          )}

                          <div className="font-semibold truncate">
                            {event.title}
                            {position === "middle" && <span className="ml-1">→</span>}
                          </div>
                          <div className="text-xs">
                            {position === "first" || position === "single" ? (
                              <>
                                {formatEventTime(event.start)} - {formatEventTime(event.end)}
                                {isMultiDayEvent(event) && <span className="ml-1">({daySpan}g)</span>}
                                <span className="ml-1">({durationHours.toFixed(1)}h)</span>
                              </>
                            ) : position === "middle" ? (
                              <span>continua →</span>
                            ) : (
                              <span>← fino a {formatEventTime(event.end)}</span>
                            )}
                          </div>

                          {(position === "last" || position === "single") && (
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
      <div className="grid" style={{ gridTemplateColumns: `80px repeat(${resources.length}, 1fr)` }}>
        <div className="p-2 border-b border-r border-gray-200 bg-gray-100 font-semibold sticky top-0 left-0 z-20">
          Ora
        </div>
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="p-2 text-center border-b border-gray-200 bg-gray-100 font-semibold sticky top-0 z-10"
          >
            {resource.name}
          </div>
        ))}

        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="p-2 border-r border-b border-gray-200 text-sm bg-white sticky left-0 z-10">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {resources.map((resource) => {
              const slotStart = new Date(currentDate)
              slotStart.setHours(hour, 0, 0, 0)
              const slotEnd = new Date(currentDate)
              slotEnd.setHours(hour + 1, 0, 0, 0)

              const slotEvents = dayEvents.filter((event) => {
                const eventStart = new Date(event.start)
                const eventEnd = new Date(event.end)
                return event.resourceId === resource.id && eventStart < slotEnd && eventEnd > slotStart
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
                    handleDrop(dropTime, hour, resource.id)
                    e.currentTarget.classList.remove("bg-blue-50")
                  }}
                >
                  {slotEvents.map((event) => {
                    const eventStart = new Date(event.start)
                    const eventEnd = new Date(event.end)

                    if (eventStart.getHours() !== hour) return null

                    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60)
                    const pixelsPerMinute = 1
                    const eventHeight = durationMinutes * pixelsPerMinute

                    const minutesFromSlotStart = (eventStart.getTime() - slotStart.getTime()) / (1000 * 60)
                    const topPosition = minutesFromSlotStart * pixelsPerMinute

                    return (
                      <div
                        key={getEventUniqueId(event)}
                        draggable={!resizingEvent}
                        onDragStart={() => !resizingEvent && handleDragStart(event)}
                        className="absolute left-1 right-1 group p-2 rounded text-sm cursor-move text-white select-none shadow z-10"
                        style={{
                          backgroundColor: event.color,
                          top: `${topPosition}px`,
                          height: `${eventHeight}px`,
                          minHeight: "40px",
                          opacity:
                            draggedEvent?.recordid === event.recordid &&
                            draggedEvent?.start === event.start &&
                            draggedEvent?.resourceId === event.resourceId
                              ? 0.5
                              : 1,
                        }}
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-t"
                          onMouseDown={(e) => handleResizeStart(event, "top", e.clientY, e.clientX)}
                        />

                        <div className="font-semibold text-xs truncate">{event.title}</div>
                        <div className="text-xs">
                          {formatEventTime(event.start)} - {formatEventTime(event.end)}
                        </div>

                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-b"
                          onMouseDown={(e) => handleResizeStart(event, "bottom", e.clientY, e.clientX)}
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

  if (loading) {
    return (
      <Card className="absolute inset-0 p-4 flex items-center justify-center">
        <div>Caricamento...</div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="absolute inset-0 p-4 flex items-center justify-center">
        <div className="text-red-500">Errore: {error.message}</div>
      </Card>
    )
  }

  return (
    <Card className="absolute inset-0 p-4 overflow-auto flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Oggi
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-lg font-semibold">
          {viewMode === "day"
            ? currentDate.toLocaleDateString("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : viewMode === "week"
              ? `Settimana ${selectedWeek === 0 ? "corrente" : selectedWeek > 0 ? `+${selectedWeek}` : selectedWeek}`
              : currentDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
        </div>

        <div className="flex gap-2">
          <Button variant={viewMode === "day" ? "default" : "outline"} size="sm" onClick={() => setViewMode("day")}>
            Giorno
          </Button>
          <Button variant={viewMode === "week" ? "default" : "outline"} size="sm" onClick={() => setViewMode("week")}>
            Settimana
          </Button>
          <Button variant={viewMode === "month" ? "default" : "outline"} size="sm" onClick={() => setViewMode("month")}>
            Mese
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">{viewMode === "day" ? renderDayView() : renderWeekMonthView()}</div>
    </Card>
  )
}
