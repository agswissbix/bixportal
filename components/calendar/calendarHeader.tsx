"use client"

import { ChevronLeft, ChevronRight, Calendar, LayoutGrid } from "lucide-react"

interface CalendarHeaderProps {
  title: string
  viewMode: "month" | "week" | "day"
  onViewModeChange: (mode: "month" | "week" | "day") => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  calendarType: "planner" | "calendar"
  onCalendarTypeChange: (type: "planner" | "calendar") => void
  extraEventTables?: Array<{ id: string; name: string }>
  selectedExtraTable?: string
  onExtraTableChange?: (tableId: string) => void
}

export default function CalendarHeader({
  title,
  viewMode,
  onViewModeChange,
  onPrevious,
  onNext,
  onToday,
  calendarType,
  onCalendarTypeChange,
  extraEventTables = [],
  selectedExtraTable,
  onExtraTableChange,
}: CalendarHeaderProps) {
  return (
    <header className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-x-2">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 mr-2">
          <button
            onClick={() => onCalendarTypeChange("calendar")}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${
                calendarType === "calendar"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }
            `}
            title="Calendario"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCalendarTypeChange("planner")}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${
                calendarType === "planner"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }
            `}
            title="Planner"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onToday}
          className="px-4 py-1.5 text-sm font-medium border border-primary/20 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Oggi
        </button>
        <div className="flex items-center">
          <button
            onClick={onPrevious}
            className="p-1.5 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <h2 className="text-xl font-semibold ml-2 capitalize">{title}</h2>

        {calendarType === "calendar" && extraEventTables.length > 0 && (
          <select
            value={selectedExtraTable || ""}
            onChange={(e) => onExtraTableChange?.(e.target.value)}
            className="ml-4 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 hover:border-primary transition-colors"
          >
            {/* <option value="">Tutti gli eventi</option> */}
            {extraEventTables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-md">
        <button
          onClick={() => onViewModeChange("month")}
          className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === "month" ? "bg-primary text-primary-foreground shadow" : "hover:bg-accent hover:text-accent-foreground"}`}
        >
          Mese
        </button>
        <button
          onClick={() => onViewModeChange("week")}
          className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground shadow" : "hover:bg-accent hover:text-accent-foreground"}`}
        >
          Settimana
        </button>
        <button
          onClick={() => onViewModeChange("day")}
          className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === "day" ? "bg-primary text-primary-foreground shadow" : "hover:bg-accent hover:text-accent-foreground"}`}
        >
          Giorno
        </button>
      </div>
    </header>
  )
}
