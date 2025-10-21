"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, parse } from "date-fns"
import { it, itCH } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Modifica: Il tipo per onChange accetta stringa (formato yyyy-MM-dd) o null
interface PropsInterface {
  initialValue?: string // formato "yyyy-MM-dd"
  onChange?: (value: string | null) => void // Può essere stringa o null
}

// ✅ Formatta per input. Accetta Date o undefined/null.
function formatDisplayDate(date?: Date | null): string {
  if (!date || isNaN(date.getTime())) return ""
  return format(date, "dd/MM/yyyy", { locale: it })
}

// ✅ Verifica validità
function isValidDate(date?: Date | null): boolean {
  return !!date && !isNaN(date.getTime())
}

// ✅ Parsing flessibile dell'input
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

// ✅ Inserisce automaticamente gli slash e blocca caratteri non numerici
function autoFormatDateInput(input: string, prev: string): string {
  // Se l’utente cancella, non riformattiamo (per evitare loop fastidiosi)
  if (input.length < prev.length) return input

  // Rimuove tutto ciò che non è cifra e tronca a 8 numeri
  const digits = input.replace(/\D/g, "").slice(0, 8)

  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  let year = digits.slice(4)

  // 🔹 Limita giorno e mese
  let safeDay = day
  if (day.length === 2) {
    const d = parseInt(day, 10)
    if (d === 0) safeDay = "01"
    else if (d > 31) safeDay = "31"
  }

  let safeMonth = month
  if (month.length === 2) {
    const m = parseInt(month, 10)
    if (m === 0) safeMonth = "01"
    else if (m > 12) safeMonth = "12"
  }

  // 🔹 Completa l’anno (2 cifre → 20xx)
  if (year.length === 2) {
    const y = parseInt(year, 10)
    year = y <= 50 ? `20${year}` : `19${year}`
  }

  // 🔹 Ricostruisci la stringa con slash progressivi
  if (digits.length <= 2) return safeDay
  if (digits.length <= 4) return `${safeDay}/${safeMonth}`
  return `${safeDay}/${safeMonth}/${year}`
}

export default function InputDate({ initialValue, onChange }: PropsInterface) {
  // Modifica: calculatedDate ora può essere Date o undefined
  const calculatedDate = React.useMemo(() => {
    if (initialValue && !isNaN(new Date(initialValue).getTime())) {
      return new Date(initialValue)
    }
    return undefined // Ritorna undefined se initialValue non è valido/presente
  }, [initialValue])

  const [open, setOpen] = React.useState(false)
  // Modifica: date e month possono essere Date o undefined
  const [date, setDate] = React.useState<Date | undefined>(calculatedDate)
  // Inizializza month con la data calcolata o la data odierna se calculatedDate è undefined.
  const [month, setMonth] = React.useState<Date>(calculatedDate || new Date())
  const [value, setValue] = React.useState(formatDisplayDate(calculatedDate))
  const uniqueId = React.useId()

  const hasMounted = React.useRef(false)
  const isTypingRef = React.useRef(false)

  // 🔹 Prima sincronizzazione
  React.useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      queueMicrotask(() => {
        // Modifica: Segnala null se calculatedDate non esiste
        const output = calculatedDate ? format(calculatedDate, "yyyy-MM-dd") : null
        onChange?.(output)
      })
    }
  }, [])

  // 🔹 Sincronizza quando cambia initialValue
  React.useEffect(() => {
    if (isTypingRef.current) return

    const dateChanged = isValidDate(date) !== isValidDate(calculatedDate) ||
      (isValidDate(date) && isValidDate(calculatedDate) && date!.getTime() !== calculatedDate!.getTime())

    if (dateChanged) {
      setDate(calculatedDate)
      // Imposta month solo se c'è una data, altrimenti rimane l'attuale/default
      if (calculatedDate) setMonth(calculatedDate)
      setValue(formatDisplayDate(calculatedDate))
    }
    queueMicrotask(() => {
      // Modifica: Segnala null se calculatedDate non esiste
      const output = calculatedDate ? format(calculatedDate, "yyyy-MM-dd") : null
      onChange?.(output)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedDate])

  const handleChange = (val: string) => {
    isTypingRef.current = true
    setValue((prev) => autoFormatDateInput(val, prev))
  }

  const handleBlur = () => {
    isTypingRef.current = false
    const parsed = parseInputDate(value)

    if (parsed) {
      setDate(parsed)
      setMonth(parsed)
      setValue(formatDisplayDate(parsed))
      onChange?.(format(parsed, "yyyy-MM-dd"))
    } else if (value.trim() === "") {
      // Modifica: Se l'input è vuoto dopo il blur
      setDate(undefined)
      // Non cambiamo 'month' per evitare di saltare troppo nel calendario
      setValue("")
      onChange?.(null) // Segnala null al padre
    } else {
      // Caso in cui la data digitata è invalida ma non vuota, ripristina il valore precedente (se esisteva)
      setValue(formatDisplayDate(date))
    }
  }

  const handleSelect = (selected?: Date) => {
    if (!selected) {
      // Se l'utente in qualche modo deseleziona
      isTypingRef.current = false
      setDate(undefined)
      setValue("")
      onChange?.(null)
      setOpen(false)
      return
    }

    isTypingRef.current = false
    setDate(selected)
    setMonth(selected)
    setValue(formatDisplayDate(selected))
    onChange?.(format(selected, "yyyy-MM-dd"))
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex gap-2">
        <Input
          inputMode="numeric"
          pattern="[0-9/]*"
          value={value}
          placeholder="gg/mm/aa"
          className="bg-background pr-10 placeholder:text-gray-500"
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
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
              selected={date} // selected può essere undefined
              onSelect={handleSelect}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              locale={itCH}
              // Modifica: Aggiunto initialFocus
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}