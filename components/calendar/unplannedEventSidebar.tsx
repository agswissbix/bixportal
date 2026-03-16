"use client"

import { useState, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Search, Filter, ChevronDown, GripVertical, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface UnplannedEvent {
  recordid: string
  title: string
  start: string
  end: string
  color?: string
  description?: string
  event_color?: string
  resourceId?: string
}

interface UnplannedEventsSidebarProps {
  events: UnplannedEvent[]
  onDragStart: (event: UnplannedEvent) => void
  onRowClick?: (recordid: string) => void
}

// Mappa colori a nomi leggibili
const COLOR_LABELS: Record<string, string> = {
  "#3b82f6": "Blu",
  "#ef4444": "Rosso",
  "#eab308": "Giallo",
  "#10b981": "Verde",
  "#8b5cf6": "Viola",
  "#f97316": "Arancione",
  "#ec4899": "Rosa",
  "#14b8a6": "Ciano",
}

function getColorLabel(color: string): string {
  return COLOR_LABELS[color.toLowerCase()] || color
}

export function UnplannedEventsSidebar({ 
  events, 
  onDragStart,
  onRowClick 
}: UnplannedEventsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedColors, setSelectedColors] = useState<string[]>([])

  // Estrai i colori unici dagli eventi
  const uniqueCategories = useMemo(() => {
    const categories = new Map<string, string>() // event_color -> color
    events.forEach((ev) => {
      if (ev.color) {
        categories.set(ev.event_color, ev.color)
      }
    })
    return Array.from(categories.entries()) // [[label, color], ...]
  }, [events])

  // Filtra gli eventi
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Filtro ricerca
      const matchesSearch =
        searchQuery === "" ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.description?.toLowerCase().includes(searchQuery.toLowerCase())

      // Filtro categorie (event_color)
      const matchesColor =
        selectedColors.length === 0 ||
        (selectedColors.includes(ev.event_color))

      return matchesSearch && matchesColor
    })
  }, [events, searchQuery, selectedColors])

  const toggleCategory = (category: string) => {
    setSelectedColors((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedColors([])
  }

  const hasActiveFilters = searchQuery !== "" || selectedColors.length > 0

  if (!events || events.length === 0) {
    return (
      <div className="w-64 border-l bg-muted flex flex-col">
        <div className="p-3 border-b bg-background backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            <h3 className="font-semibold text-sm">Eventi Non Pianificati</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Nessun evento da pianificare
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-l bg-muted flex flex-col">
      {/* Header */}
      <div className="p-3 border-b bg-background backdrop-blur-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="font-semibold text-sm">Non Pianificati</h3>
          </div>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {filteredEvents.length}/{events.length}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cerca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 pr-7 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters Collapsible */}
        {uniqueCategories.length > 1 && (
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full h-7 justify-between text-xs px-2",
                  hasActiveFilters && "text-primary"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Filter className="h-3 w-3" />
                  Filtri
                  {selectedColors.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {selectedColors.length}
                    </Badge>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    filtersOpen && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex flex-wrap gap-1">
                {uniqueCategories.map(([label, color]) => (
                  <button
                    key={label}
                    onClick={() => toggleCategory(label)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all border",
                      selectedColors.includes(label)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background hover:bg-muted border-border"
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    {label ? label : "Altro"}
                  </button>
                ))}
              </div>
              {hasActiveFilters && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-0 text-xs text-muted-foreground mt-1"
                >
                  Rimuovi filtri
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Events List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-xs">Nessun risultato</p>
            </div>
          ) : (
            filteredEvents.map((ev) => (
              <div
                key={ev.recordid}
                draggable
                onDragStart={() => onDragStart(ev)}
                onClick={() => onRowClick?.(ev.recordid)}
                className={cn(
                  "group relative cursor-grab rounded-lg border bg-card p-2.5 text-xs transition-all",
                  "hover:shadow-md hover:border-foreground hover:scale-[1.02]",
                  "active:cursor-grabbing active:scale-100"
                )}
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: ev.color || "#3b82f6",
                }}
              >
                {/* Drag indicator */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>

                <div className="pr-4">
                  <div className="font-medium leading-tight line-clamp-2">
                    {ev.title}
                  </div>
                  {ev.description && (
                    <div className="mt-1 text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {ev.description}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t bg-background text-center">
        <p className="text-[10px] text-muted-foreground">
          Trascina per pianificare
        </p>
      </div>
    </div>
  )
}
