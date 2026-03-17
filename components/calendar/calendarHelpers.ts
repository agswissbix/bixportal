import type React from "react"
/**
 * Utility functions for calendar operations
 */

/**
 * Converts a Date object to ISO string in local timezone (without UTC conversion)
 */
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

/**
 * Calculates how many days an event spans
 */
export function getEventDaySpan(start: string, end: string): number
export function getEventDaySpan(event: { start: Date | string; end: Date | string }): number
export function getEventDaySpan(
  eventOrStart: { start: Date | string; end: Date | string } | string,
  end?: string,
): number {
  if (typeof eventOrStart === "string" && end) {
    const startDay = new Date(eventOrStart)
    startDay.setHours(0, 0, 0, 0)
    const endDay = new Date(end)
    endDay.setHours(0, 0, 0, 0)
    const diffTime = endDay.getTime() - startDay.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1
  } else {
    const event = eventOrStart as { start: Date | string; end: Date | string }
    const startDate = typeof event.start === "string" ? new Date(event.start) : event.start
    const endDate = typeof event.end === "string" ? new Date(event.end) : event.end

    const startDay = normalizeDate(startDate)
    const endDay = normalizeDate(endDate)
    const diffTime = endDay.getTime() - startDay.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1
  }
}

/**
 * Calculates event duration in hours
 */
export function getEventDurationHours(start: string, end: string): number
export function getEventDurationHours(event: { start: Date | string; end: Date | string }): number
export function getEventDurationHours(
  eventOrStart: { start: Date | string; end: Date | string } | string,
  end?: string,
): number {
  if (typeof eventOrStart === "string" && end) {
    const startDate = new Date(eventOrStart)
    const endDate = new Date(end)
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  } else {
    const event = eventOrStart as { start: Date | string; end: Date | string }
    const startDate = typeof event.start === "string" ? new Date(event.start) : event.start
    const endDate = typeof event.end === "string" ? new Date(event.end) : event.end
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  }
}

/**
 * Normalizes a date to midnight (00:00:00)
 */
export function normalizeDate(date: Date): Date {
  try {
    return new Date(date?.getFullYear(), date?.getMonth(), date?.getDate())
  } catch (error) {
    console.error("Error normalizing date:", error)
    return new Date()
  }
}

export const getEventGroupStyles = (events) => {
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const columns = [];
  
  sorted.forEach(event => {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const lastInCol = columns[i][columns[i].length - 1];
      if (new Date(event.start) >= new Date(lastInCol.end)) {
        columns[i].push(event);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([event]);
  });

  const styles = new Map();
  columns.forEach((column, colIndex) => {
    column.forEach(event => {
      styles.set(event.recordid, {
        width: `${100 / columns.length}%`,
        left: `${(100 / columns.length) * colIndex}%`,
      });
    });
  });
  return styles;
};

export const getWeekMultiDayLayout = (events, weekDays) => {
  const weekStart = weekDays[0].getTime();
  const weekEnd = weekDays[6].getTime() + 86400000;

  // Filtra e ordina per durata (i più lunghi in alto)
  const filtered = events.filter(e => {
    const s = new Date(e.start).getTime();
    const end = new Date(e.end || e.start).getTime();
    return s < weekEnd && end > weekStart;
  }).sort((a, b) => {
    const durA = new Date(a.end || a.start).getTime() - new Date(a.start).getTime();
    const durB = new Date(b.end || b.start).getTime() - new Date(b.start).getTime();
    return durB - durA;
  });

  const lanes = [];
  const eventToLane = {};

  filtered.forEach(event => {
    const eventStart = new Date(event.start).getTime();
    const eventEnd = new Date(event.end || event.start).getTime();

    let laneIndex = lanes.findIndex(lane => {
      return !lane.some(e => {
        const eS = new Date(e.start).getTime();
        const eE = new Date(e.end || e.start).getTime();
        return eventStart < eE && eventEnd > eS;
      });
    });

    if (laneIndex === -1) {
      lanes.push([event]);
      laneIndex = lanes.length - 1;
    } else {
      lanes[laneIndex].push(event);
    }
    eventToLane[event.recordid] = laneIndex;
  });

  return { eventToLane, totalLanes: lanes.length, filteredAllDay: filtered };
};

/**
 * Checks if an event covers a specific date
 */
export function eventCoversDate(eventStart: string, eventEnd: string, targetDate: Date): boolean {
  const eventStartDay = normalizeDate(new Date(eventStart))
  const eventEndDay = normalizeDate(new Date(eventEnd))
  const targetDay = normalizeDate(targetDate)

  return targetDay.getTime() >= eventStartDay.getTime() && targetDay.getTime() <= eventEndDay.getTime()
}

/**
 * Determines the position of an event instance in a multi-day span
 */
export function getEventPosition(
  eventStart: string,
  eventEnd: string,
  currentDate: Date,
): "first" | "middle" | "last" | "single" {
  const eventStartDay = normalizeDate(new Date(eventStart))
  const eventEndDay = normalizeDate(new Date(eventEnd))
  const currentDay = normalizeDate(currentDate)

  const isFirst = currentDay.getTime() === eventStartDay.getTime()
  const isLast = currentDay.getTime() === eventEndDay.getTime()

  if (isFirst && isLast) return "single"
  if (isFirst) return "first"
  if (isLast) return "last"
  return "middle"
}

/**
 * Checks if an event is multi-day (spans more than one day)
 */
export function isMultiDayEvent(event: { start: Date | string; end: Date | string }): boolean {
  const startDate = typeof event.start === "string" ? new Date(event.start) : event.start
  const endDate = typeof event.end === "string" ? new Date(event.end) : event.end

  const startDay = normalizeDate(startDate)
  const endDay = normalizeDate(endDate)

  return endDay.getTime() > startDay.getTime()
}

/**
 * Creates a unique identifier for an event
 */
export function getEventUniqueId(recordid: string, start: string): string {
  return `${recordid}-${start}`
}

/**
 * Determines the position of an event instance in a multi-day span (accepts event object)
 */
export function getEventPositionInSpan(
  event: { start: Date | string; end: Date | string },
  currentDate: Date,
): "first" | "middle" | "last" | "single" {
  const startDate = typeof event.start === "string" ? new Date(event.start) : event.start
  const endDate = typeof event.end === "string" ? new Date(event.end) : event.end

  const eventStartDay = normalizeDate(startDate)
  const eventEndDay = normalizeDate(endDate)
  const currentDay = normalizeDate(currentDate)

  const isFirst = currentDay.getTime() === eventStartDay.getTime()
  const isLast = currentDay.getTime() === eventEndDay.getTime()

  if (isFirst && isLast) return "single"
  if (isFirst) return "first"
  if (isLast) return "last"
  return "middle"
}

/**
 * Returns CSS styles for event position in multi-day span
 */
export function getEventPositionStyles(position: "first" | "middle" | "last" | "single"): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    borderRadius: "0.375rem",
  }

  switch (position) {
    case "first":
      return {
        ...baseStyles,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderRightWidth: "1px",
        borderRightStyle: "dashed",
        borderRightColor: "rgba(255, 255, 255, 0.3)",
      }
    case "middle":
      return {
        ...baseStyles,
        borderRadius: 0,
        borderLeftWidth: "1px",
        borderLeftStyle: "dashed",
        borderLeftColor: "rgba(255, 255, 255, 0.3)",
        borderRightWidth: "1px",
        borderRightStyle: "dashed",
        borderRightColor: "rgba(255, 255, 255, 0.3)",
      }
    case "last":
      return {
        ...baseStyles,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderLeftWidth: "1px",
        borderLeftStyle: "dashed",
        borderLeftColor: "rgba(255, 255, 255, 0.3)",
      }
    case "single":
    default:
      return baseStyles
  }
}
