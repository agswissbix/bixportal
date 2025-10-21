"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { itCH } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface PropsInterface {
  initialValue?: string // formato "yyyy-MM-dd"
  onChange?: (value: string | null) => void
}

function isValidDateString(dateStr: string): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

export default function InputDate({ initialValue, onChange }: PropsInterface) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState<string>(initialValue || "")
  const [month, setMonth] = React.useState<Date>(() => {
    if (initialValue && isValidDateString(initialValue)) {
      return new Date(initialValue)
    }
    return new Date()
  })

  const uniqueId = React.useId()
  const hasMounted = React.useRef(false)
  const isTypingRef = React.useRef(false)

  React.useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      queueMicrotask(() => {
        onChange?.(initialValue || null)
      })
    }
  }, [])

  React.useEffect(() => {
    if (isTypingRef.current) return

    if (initialValue !== value) {
      setValue(initialValue || "")
      if (initialValue && isValidDateString(initialValue)) {
        setMonth(new Date(initialValue))
      }
    }
  }, [initialValue])

  const handleChange = (val: string) => {
    isTypingRef.current = true
    setValue(val)
  }

  const handleBlur = () => {
    isTypingRef.current = false

    if (value && isValidDateString(value)) {
      onChange?.(value)
      setMonth(new Date(value))
    } else if (value === "") {
      onChange?.(null)
    }
  }

  const handleSelect = (selected?: Date) => {
    if (!selected) {
      isTypingRef.current = false
      setValue("")
      onChange?.(null)
      setOpen(false)
      return
    }

    isTypingRef.current = false
    const formattedDate = format(selected, "yyyy-MM-dd")
    setValue(formattedDate)
    setMonth(selected)
    onChange?.(formattedDate)
    setOpen(false)
  }

  const selectedDate = value && isValidDateString(value) ? new Date(value) : undefined

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex gap-2">
        <Input
          type="date"
          value={value}
          className="bg-background text-foreground pr-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
          onClick={() => setOpen(true)} // apri il popover al click, se tolgo questa riga non c'è piu il problema della selezione del testo
        />
        <Popover key={uniqueId} open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute top-1/2 right-2 size-6 -translate-y-1/2">
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
              selected={selectedDate}
              onSelect={handleSelect}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              locale={itCH}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
