"use client"

import { useState } from "react"
import CalendarBase from "./calendarBase"
import MatrixView from "./matrixView"
import RecordsView from "./recordsView"

interface UnifiedCalendarProps {
  tableid: string
  apiRoute?: string
  showUnplannedEvents?: boolean
  defaultView?: "planner" | "calendar"
  defaultViewModeRecords?: "day" | "week" | "month"
  defaultViewModeMatrix?: "day" | "week" | "month"
}

export default function UnifiedCalendar({
  tableid,
  apiRoute = "get_records_matrixcalendar",
  showUnplannedEvents = true,
  defaultView = "calendar",
  defaultViewModeRecords = "month",
  defaultViewModeMatrix = "week",
}: UnifiedCalendarProps) {
  const [viewType, setViewType] = useState<"planner" | "calendar">(defaultView)

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        <CalendarBase tableid={tableid} apiRoute={apiRoute} showUnplannedEvents={showUnplannedEvents} viewType="matrix">
          {(calendarProps) =>
            viewType === "planner" ? (
              <MatrixView {...calendarProps} calendarType={viewType} onCalendarTypeChange={setViewType} defaultViewMode={defaultViewModeMatrix} />
            ) : (
              <RecordsView {...calendarProps} calendarType={viewType} onCalendarTypeChange={setViewType} defaultViewMode={defaultViewModeRecords} />
            )
          }
        </CalendarBase>
      </div>
    </div>
  )
}
