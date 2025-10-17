"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, parse } from "date-fns"
import { it, itCH } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { on } from "events"

interface PropsInterface {
  initialValue?: string // formato "yyyy-MM-dd"
  onChange?: (value: string) => void
}

// ✅ Formatta per input
function formatDisplayDate(date?: Date): string {
  if (!date || isNaN(date.getTime())) return ""
  return format(date, "dd/MM/yyyy", { locale: it })
}

// ✅ Verifica validità
function isValidDate(date?: Date): boolean {
  return !!date && !isNaN(date.getTime())
}

// ✅ Parsing flessibile dell’input
function parseInputDate(value: string): Date | undefined {
  if (!value) return undefined

  const trimmed = value.trim()
  const formats = ["dd/MM/yyyy", "dd-MM-yyyy", "yyyy-MM-dd"]

  for (const fmt of formats) {
    const parsed = parse(trimmed, fmt, new Date())
    if (isValidDate(parsed)) return parsed
  }

  const fallback = new Date(trimmed)
  return isValidDate(fallback) ? fallback : undefined
}

export default function InputDate({
  initialValue,
  onChange,
}: PropsInterface) {
  // ✅ Se initialValue è vuoto → oggi
  const calculatedDate = React.useMemo(() => {
    if (initialValue && !isNaN(new Date(initialValue).getTime())) {
      return new Date(initialValue);
    }
    return new Date();
  }, [initialValue]);

  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date>(calculatedDate)
  const [month, setMonth] = React.useState<Date>(calculatedDate)
  const [value, setValue] = React.useState(formatDisplayDate(calculatedDate))
  const uniqueId = React.useId()

  const isFirstRender = React.useRef(true)

  React.useEffect(() => {
    console.log("InputDate: useEffect [calculatedDate] triggered.", calculatedDate);
    
    // Aggiorna lo stato interno con la data calcolata
    setDate(calculatedDate);
    setMonth(calculatedDate);
    setValue(formatDisplayDate(calculatedDate));

    if (isFirstRender.current) {
      isFirstRender.current = false
      onChange?.(format(calculatedDate, "yyyy-MM-dd"))
    }
    
    // Dipendenze pulite
  }, [calculatedDate]);


  const handleChange = (val: string) => {
    setValue(val)
    const parsed = parseInputDate(val)

    if (parsed) {
      setDate(parsed)
      setMonth(parsed)
      onChange?.(format(parsed, "yyyy-MM-dd"))
    } else if (val.trim() === "") {
      // ✅ se cancelli tutto → torna a oggi
      const today = new Date()
      setDate(today)
      setMonth(today)
      setValue(formatDisplayDate(today))
      onChange?.(format(today, "yyyy-MM-dd"))
    }
  }

  const handleSelect = (selected?: Date) => {
    if (!selected) return
    setDate(selected)
    setValue(formatDisplayDate(selected))
    onChange?.(format(selected, "yyyy-MM-dd"))
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex gap-2">
        <Input
          value={value}
          placeholder={formatDisplayDate(new Date())}
          className="bg-background pr-10"
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
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-4 text-primary hover:text-accent-foreground" />
              <span className="sr-only">Apri calendario</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            side="bottom"
            alignOffset={-8}
            sideOffset={8}
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              locale={itCH}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
