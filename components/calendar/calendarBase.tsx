"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useApi } from "@/utils/useApi"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { toLocalISOString, getEventUniqueId } from "@/components/calendar/calendarHelpers"
import { UnplannedEventsSidebar } from "./unplannedEventSidebar"
import { useRecordsStore } from "../records/recordsStore"

export interface CalendarEvent {
  recordid: string
  title: string
  start: string
  end: string
  color?: string
  description?: string
  resourceId?: string
}

export interface UnplannedEvent {
  recordid: string
  title: string
  description?: string
  color?: string
}

export interface Resource {
  id: string
  name: string
}

export interface CalendarResponseInterface {
  counter?: number
  events: CalendarEvent[]
  unplannedEvents?: UnplannedEvent[]
  resources?: Resource[]
}

export interface DraggedEvent extends CalendarEvent {
  originalStart: Date
  originalEnd: Date
}

export interface ResizingEvent extends CalendarEvent {
  originalStart: Date
  originalEnd: Date
}

export interface CalendarBaseProps {
  tableid: string
  apiRoute?: string
  showUnplannedEvents?: boolean
  viewType: "matrix" | "records"
  children: (props: CalendarChildProps) => React.ReactNode
}

export interface CalendarChildProps {
  data: CalendarResponseInterface
  loading: boolean
  error: any
  draggedEvent: DraggedEvent | null
  resizingEvent: ResizingEvent | null
  resizeStartY: number
  resizeStartX: number
  handleDragStart: (event: CalendarEvent) => void
  handleDrop: (dropDate: Date, dropHour?: number, resourceId?: string) => void
  handleResizeStart: (
    event: CalendarEvent,
    handle: "top" | "bottom" | "right",
    clientY: number,
    clientX: number,
  ) => void
  saveEvent: (eventid: string, startdate: Date, enddate: Date, resourceid?: string) => Promise<void>
  unscheduleEvent: (eventid: string) => Promise<void>
  tableid: string
}

export function CalendarBase({
  tableid,
  apiRoute = "get_records_matrixcalendar",
  showUnplannedEvents = false,
  viewType,
  children,
}: CalendarBaseProps) {
  const isDev = false

  const { refreshTable } = useRecordsStore();
  
  // API payload
  const payload = useMemo(() => {
    if (isDev) return null;
		return { 
			apiRoute,
			tableid,
      _refreshTick: refreshTable
		};
  }, [apiRoute, tableid, refreshTable])
  
	const { response, loading, error } = !isDev && payload ? useApi<CalendarResponseInterface>(payload) : { response: null, loading: false, error: null };
  // State management
  const [responseData, setResponseData] = useState<CalendarResponseInterface>({
    events: [],
    unplannedEvents: [],
    resources: [],
  })

  const [draggedEvent, setDraggedEvent] = useState<DraggedEvent | null>(null)
  const [resizingEvent, setResizingEvent] = useState<ResizingEvent | null>(null)
  const [resizeStartY, setResizeStartY] = useState(0)
  const [resizeStartX, setResizeStartX] = useState(0)

  // Update responseData when API response changes
  useEffect(() => {
    if (response) {
      setResponseData(response)
    }
  }, [response])

  // Drag start handler
  const handleDragStart = useCallback((event: CalendarEvent) => {
    setDraggedEvent({
      ...event,
      originalStart: new Date(event.start),
      originalEnd: new Date(event.end),
    })
  }, [])

  // Drop handler
  const handleDrop = useCallback(
    (dropDate: Date, dropHour?: number, resourceId?: string) => {
      if (!draggedEvent) return

      const isAlreadyPlanned = responseData.events.some((ev) => ev.recordid === draggedEvent.recordid)

      // Calculate new start and end times
      const newStart = new Date(dropDate.getFullYear(), dropDate.getMonth(), dropDate.getDate())
      newStart.setHours(
        dropHour !== undefined ? dropHour : draggedEvent.originalStart.getHours(),
        draggedEvent.originalStart.getMinutes(),
        0,
        0,
      )

      const duration = draggedEvent.originalEnd.getTime() - draggedEvent.originalStart.getTime()
      const newEnd = new Date(newStart.getTime() + duration)

      setResponseData((prev) => {
        let updatedEvents = [...prev.events]
        let updatedUnplanned = [...(prev.unplannedEvents || [])]

        if (isAlreadyPlanned) {
          // Update existing event
          const eventId = getEventUniqueId(draggedEvent.recordid, draggedEvent.start)
          updatedEvents = prev.events.map((ev) => {
            const evId = getEventUniqueId(ev.recordid, ev.start)
            return evId === eventId
              ? {
                  ...ev,
                  start: toLocalISOString(newStart),
                  end: toLocalISOString(newEnd),
                  ...(resourceId && { resourceId }),
                }
              : ev
          })
        } else {
          // Add new event from unplanned
          updatedEvents.push({
            ...draggedEvent,
            start: toLocalISOString(newStart),
            end: toLocalISOString(newEnd),
            ...(resourceId && { resourceId }),
          })
          updatedUnplanned = updatedUnplanned.filter((ev) => ev.recordid !== draggedEvent.recordid)
        }

        saveEvent(draggedEvent.recordid, newStart, newEnd, resourceId)

        return { ...prev, events: updatedEvents, unplannedEvents: updatedUnplanned }
      })

      setDraggedEvent(null)
    },
    [draggedEvent, responseData.events],
  )

  // Resize start handler
  const handleResizeStart = useCallback(
    (event: CalendarEvent, handle: "top" | "bottom" | "right", clientY: number, clientX: number) => {
      setResizingEvent({
        ...event,
        originalStart: new Date(event.start),
        originalEnd: new Date(event.end),
      })
      setResizeStartY(clientY)
      setResizeStartX(clientX)
    },
    [],
  )

  // Resize mouse move handler
  useEffect(() => {
    if (!resizingEvent) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()

      const deltaY = e.clientY - resizeStartY
      const deltaX = e.clientX - resizeStartX

      setResponseData((prev) => {
        const updatedEvents = prev.events.map((event) => {
          const eventId = getEventUniqueId(event.recordid, event.start)
          const resizingId = getEventUniqueId(resizingEvent.recordid, resizingEvent.start)

          if (eventId !== resizingId) return event

          // Handle vertical resize (hours)
          if (Math.abs(deltaY) > 10) {
            const pixelsPerHour = 60
            const hoursDelta = Math.round(deltaY / pixelsPerHour)

            if (resizingEvent.originalStart.getTime() < resizingEvent.originalEnd.getTime()) {
              // Resize bottom (end time)
              const newEnd = new Date(resizingEvent.originalEnd)
              newEnd.setHours(newEnd.getHours() + hoursDelta)
              if (newEnd > new Date(event.start)) {
                return { ...event, end: toLocalISOString(newEnd) }
              }
            } else {
              // Resize top (start time)
              const newStart = new Date(resizingEvent.originalStart)
              newStart.setHours(newStart.getHours() + hoursDelta)
              if (newStart < new Date(event.end)) {
                return { ...event, start: toLocalISOString(newStart) }
              }
            }
          }

          // Handle horizontal resize (days)
          if (Math.abs(deltaX) > 10) {
            const cellWidth = 100
            const daysDelta = Math.round(deltaX / cellWidth)

            const newEnd = new Date(resizingEvent.originalEnd)
            newEnd.setDate(newEnd.getDate() + daysDelta)

            const newEndDay = new Date(newEnd.getFullYear(), newEnd.getMonth(), newEnd.getDate())
            const startDay = new Date(event.start)
            startDay.setHours(0, 0, 0, 0)

            if (newEndDay >= startDay) {
              return { ...event, end: toLocalISOString(newEnd) }
            }
          }

          return event
        })

        return { ...prev, events: updatedEvents }
      })
    }

    const handleMouseUp = () => {
      if (resizingEvent) {
        const updatedEvent = responseData.events.find(
          (ev) =>
            getEventUniqueId(ev.recordid, ev.start) === getEventUniqueId(resizingEvent.recordid, resizingEvent.start),
        )
        if (updatedEvent) {
          saveEvent(
            updatedEvent.recordid,
            new Date(updatedEvent.start),
            new Date(updatedEvent.end),
            updatedEvent.resourceId,
          )
        }
      }
      setResizingEvent(null)
      setResizeStartY(0)
      setResizeStartX(0)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizingEvent, resizeStartY, resizeStartX, responseData.events])

  // Save event to backend
  const saveEvent = useCallback(
    async (eventid: string, startdate: Date, enddate: Date, resourceid?: string) => {
      try {
        await axiosInstanceClient.post("/postApi", {
          apiRoute: "matrixcalendar_save_record",
          tableid,
          event: {
            id: eventid,
            startdate: toLocalISOString(startdate),
            enddate: toLocalISOString(enddate),
            ...(resourceid && { resourceid }),
          },
        })
      } catch (error) {
        console.error("[v0] Error saving event:", error)
      }
    },
    [tableid],
  )

  // Unschedule event (move back to unplanned)
  const unscheduleEvent = useCallback(
    async (eventid: string) => {
      const event = responseData.events.find((ev) => ev.recordid === eventid)
      if (!event) return

      try {
        await axiosInstanceClient.post("/postApi", {
          apiRoute: "matrixcalendar_save_record",
          tableid,
          event: {
            id: eventid,
            startdate: null,
            enddate: null,
          },
        })

        setResponseData((prev) => ({
          ...prev,
          events: prev.events.filter((ev) => ev.recordid !== eventid),
          unplannedEvents: [
            ...(prev.unplannedEvents || []),
            {
              recordid: event.recordid,
              title: event.title,
              description: event.description,
              color: event.color,
            },
          ],
        }))
      } catch (error) {
        console.error("[v0] Error unscheduling event:", error)
      }
    },
    [responseData.events, tableid],
  )

  const childProps: CalendarChildProps = {
    data: responseData,
    loading,
    error,
    draggedEvent,
    resizingEvent,
    resizeStartY,
    resizeStartX,
    handleDragStart,
    handleDrop,
    handleResizeStart,
    saveEvent,
    unscheduleEvent,
    tableid,
  }

  return (
    <div className="flex h-full">
      <div className="flex-1">{children(childProps)}</div>
      {showUnplannedEvents && (
        <UnplannedEventsSidebar events={responseData.unplannedEvents || []} onDragStart={handleDragStart} />
      )}
    </div>
  )
}
