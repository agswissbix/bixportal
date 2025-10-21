"use client"
import { useState } from "react"
import type { CalendarChildProps } from "@/components/calendar/calendarBase"
import {
  getEventDurationHours,
  getEventDaySpan,
  isMultiDayEvent,
  getEventPositionInSpan,
  getEventPositionStyles,
} from "@/components/calendar/calendarHelpers"

interface RecordsViewProps extends CalendarChildProps {
  initialView?: "day" | "week" | "month"
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
  initialView = "month",
}: RecordsViewProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1)
  const dayOffset = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1

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
            className={`font-semibold text-sm ${isToday ? "bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}`}
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
                  onDragStart={(e) => !resizingEvent && handleDragStart(event)}
                  className="relative group p-1.5 text-xs cursor-move select-none hover:opacity-80 transition-opacity"
                  style={{
                    height: `${eventHeight}px`,
                    ...positionStyles,
                    backgroundColor: event.color || "#3b82f6",
                    opacity: draggedEvent?.recordid === event.recordid ? 0.5 : 1,
                    cursor: resizingEvent ? ((resizingEvent as any).handle === "right" ? "ew-resize" : "ns-resize") : "move",
                  }}
                >
                  {(position === "first" || position === "single") && (
                    <div
                      className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/30"
                      style={{ borderRadius: "0.375rem 0.375rem 0 0" }}
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

  if (loading) {
    return <div className="flex items-center justify-center h-full">Caricamento...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">Errore: {error.message}</div>
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <header className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1 rounded ${viewMode === "day" ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            Giorno
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 rounded ${viewMode === "week" ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            Settimana
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 rounded ${viewMode === "month" ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700"}`}
          >
            Mese
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const newDate = new Date(currentDate)
              if (viewMode === "month") newDate.setMonth(newDate.getMonth() - 1)
              else if (viewMode === "week") newDate.setDate(newDate.getDate() - 7)
              else newDate.setDate(newDate.getDate() - 1)
              setCurrentDate(newDate)
            }}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
          >
            ←
          </button>
          <span className="font-semibold">
            {viewMode === "month"
              ? currentDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
              : currentDate.toLocaleDateString("it-IT")}
          </span>
          <button
            onClick={() => {
              const newDate = new Date(currentDate)
              if (viewMode === "month") newDate.setMonth(newDate.getMonth() + 1)
              else if (viewMode === "week") newDate.setDate(newDate.getDate() + 7)
              else newDate.setDate(newDate.getDate() + 1)
              setCurrentDate(newDate)
            }}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
          >
            →
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 bg-primary text-white rounded">
            Oggi
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-auto">
        {viewMode === "month" && renderMonthView()}
        {/* Add renderWeekView and renderDayView here */}
      </main>
    </div>
  )
}
