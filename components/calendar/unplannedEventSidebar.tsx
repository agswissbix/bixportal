"use client"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UnplannedEvent {
  recordid: string
  title: string
  start: string
  end: string
  color?: string
  description?: string
  resourceId?: string
}

interface UnplannedEventsSidebarProps {
  events: UnplannedEvent[]
  onDragStart: (event: UnplannedEvent) => void
}

export function UnplannedEventsSidebar({ events, onDragStart }: UnplannedEventsSidebarProps) {
  if (!events || events.length === 0) {
    return (
      <div className="w-64 border-l bg-muted/30 p-4">
        <h3 className="mb-4 font-semibold">Eventi Non Pianificati</h3>
        <p className="text-sm text-muted-foreground">Nessun evento da pianificare</p>
      </div>
    )
  }

  return (
    <div className="w-64 border-l bg-muted/30 p-4">
      <h3 className="mb-4 font-semibold">Eventi Non Pianificati</h3>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-2">
          {events.map((ev) => (
            <div
              key={ev.recordid}
              draggable
              onDragStart={() => onDragStart(ev)}
              className="cursor-move rounded border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md"
              style={{
                borderLeft: `4px solid ${ev.color || "#3b82f6"}`,
              }}
            >
              <div className="font-medium">{ev.title}</div>
              {ev.description && <div className="mt-1 text-xs text-muted-foreground">{ev.description}</div>}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
