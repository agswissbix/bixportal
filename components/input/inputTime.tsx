"use client"

import * as React from "react"
import { Clock } from "lucide-react"

// Assumo che queste siano le tue shadcn/ui components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// --------------------------------------------------------------------------
// INTERFACE E FUNZIONI UTILITY (LE LASCIAMO COME SONO)
// --------------------------------------------------------------------------

interface PropsInterface {
  initialValue?: string // formato "HH:mm" o "HH:mm:ss"
  onChange?: (value: string) => void
  format24h?: boolean // default true
}

// ✅ Formatta per display (24h)
function formatDisplayTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

// ✅ Parsing flessibile dell'input
function parseInputTime(value: string): { hours: number; minutes: number } | undefined {
  if (!value) return undefined

  const trimmed = value.trim()

  // Supporta formati: HH:mm, H:mm, HHmm, Hmm
  const timeRegex = /^(\d{1,2}):?(\d{2})$/
  const match = trimmed.match(timeRegex)

  if (match) {
    const hours = Number.parseInt(match[1], 10)
    const minutes = Number.parseInt(match[2], 10)

    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return { hours, minutes }
    }
  }

  return undefined
}

// --------------------------------------------------------------------------
// NUOVE FUNZIONI PER MIGLIORARE L'USABILITA' GRAFICA
// --------------------------------------------------------------------------

// Funzione per formattare l'ora in 12h (es. 13 -> 01 PM)
function formatHourForDisplay(h: number, format24h: boolean): string {
  if (format24h) {
    return String(h).padStart(2, "0")
  }

  const hour12 = h % 12 === 0 ? 12 : h % 12
  const ampm = h >= 12 ? "PM" : "AM"
  return `${String(hour12).padStart(2, "0")} ${ampm}`
}

// --------------------------------------------------------------------------
// COMPONENTE PRINCIPALE
// --------------------------------------------------------------------------

export default function InputTime({ initialValue, onChange, format24h = true }: PropsInterface) {
  // ✅ Parse initialValue o usa 00:00
  const parseInitial = () => {
    if (initialValue) {
      const parsed = parseInputTime(initialValue)
      if (parsed) return parsed
    }
    return { hours: 0, minutes: 0 }
  }

  const initial = parseInitial()
  const [open, setOpen] = React.useState(false)
  const [hours, setHours] = React.useState(initial.hours)
  const [minutes, setMinutes] = React.useState(initial.minutes)
  const [value, setValue] = React.useState(formatDisplayTime(initial.hours, initial.minutes))
  const uniqueId = React.useId()

  // Riferimenti per lo scroll automatico
  const hoursScrollRef = React.useRef<HTMLDivElement>(null)
  const minutesScrollRef = React.useRef<HTMLDivElement>(null)

  // 🔁 Aggiorna se cambia initialValue da fuori
  React.useEffect(() => {
    const parsed = parseInitial()
    setHours(parsed.hours)
    setMinutes(parsed.minutes)
    setValue(formatDisplayTime(parsed.hours, parsed.minutes))
  }, [initialValue])

  // 🖱️ Scrolla all'elemento selezionato quando il popover si apre
  React.useEffect(() => {
    if (open) {
      // Scrolla l'ora selezionata
      const activeHour = hoursScrollRef.current?.querySelector(`[data-hour="${hours}"]`)
      if (activeHour) {
        // L'altezza è approssimativamente 32px (taglia sm)
        hoursScrollRef.current!.scrollTop = (activeHour as HTMLElement).offsetTop - 16 * 5 // Centra approssimativamente
      }

      // Scrolla il minuto selezionato
      const activeMinute = minutesScrollRef.current?.querySelector(`[data-minute="${minutes}"]`)
      if (activeMinute) {
        minutesScrollRef.current!.scrollTop = (activeMinute as HTMLElement).offsetTop - 16 * 5
      }
    }
  }, [open, hours, minutes])


  const handleChange = (val: string) => {
    setValue(val)
    const parsed = parseInputTime(val)

    if (parsed) {
      setHours(parsed.hours)
      setMinutes(parsed.minutes)
      onChange?.(formatDisplayTime(parsed.hours, parsed.minutes))
    }
  }

  const handleSelect = (newHours: number, newMinutes: number) => {
    setHours(newHours)
    setMinutes(newMinutes)
    const formatted = formatDisplayTime(newHours, newMinutes)
    setValue(formatted)
    onChange?.(formatted)
  }

  const handleHourClick = (h: number) => {
    handleSelect(h, minutes)
  }

  const handleMinuteClick = (m: number) => {
    handleSelect(hours, m)
    setOpen(false) // Chiude dopo aver selezionato anche i minuti
  }

  // Genera array di ore e minuti
  const hoursArray = Array.from({ length: 24 }, (_, i) => i)
  const minutesArray = Array.from({ length: 12 }, (_, i) => i * 5) // 0, 5, 10, ..., 55

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex">
        {/* L'Input rimane semplice */}
        <Input
          value={value}
          placeholder={format24h ? "00:00" : "12:00 AM"}
          className="bg-white pr-10" // pr-10 per il bottone
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
          onClick={() => setOpen(true)}
        />
        <Popover key={uniqueId} open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {/* Bottone a orologio migliorato */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-0 size-8 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
            >
              <Clock className="size-4 text-primary" />
              <span className="sr-only">Apri selettore orario</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border shadow-lg bg-white rounded-lg overflow-hidden" // Contenitore più definito
            align="end"
            side="bottom"
            alignOffset={0} // Allineamento più stretto
            sideOffset={4} // Distanza più ridotta
          >
            <div className="flex divide-x divide-gray-200">
              {/* Colonna Ore */}
              <div className="w-[120px]">
                <div className="text-center text-xs text-gray-500 py-2 border-b font-semibold bg-gray-50">Ore</div>
                <ScrollArea className="h-[200px]">
                  <div className="p-1">
                    {hoursArray.map((h) => (
                      <Button
                        key={h}
                        data-hour={h} // Data attribute per lo scroll
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full h-8 justify-center text-sm font-normal text-gray-700 hover:bg-accent rounded-md",
                          hours === h && "bg-primary text-primary-foreground hover:bg-primary" // Colore primario attivo
                        )}
                        onClick={() => handleHourClick(h)}
                      >
                        {formatHourForDisplay(h, format24h)}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Colonna Minuti */}
              <div className="w-[80px]">
                <div className="text-center text-xs text-gray-500 py-2 border-b font-semibold bg-gray-50">Min</div>
                <ScrollArea className="h-[200px]" >
                  <div className="p-1">
                    {minutesArray.map((m) => (
                      <Button
                        key={m}
                        data-minute={m} // Data attribute per lo scroll
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full h-8 justify-center text-sm font-normal text-gray-700 hover:bg-accent rounded-md",
                          minutes === m && "bg-primary text-primary-foreground hover:bg-primary" // Colore primario attivo
                        )}
                        onClick={() => handleMinuteClick(m)}
                      >
                        {String(m).padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}