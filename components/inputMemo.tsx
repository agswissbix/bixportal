"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Textarea } from "./ui/textarea"

// INTERFACCIA PROPS
interface PropsInterface {
  initialValue?: string
  onChange?: (value: string) => void
}

export default function InputMemo({ initialValue = "", onChange }: PropsInterface) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="relative">
      <div className="relative rounded-md bg-background transition-all duration-200 hover:shadow-sm">
        <Textarea
          name="memo"
          value={value}
          onChange={handleChange}
          placeholder="Inserisci note..."
          className="min-h-[100px] resize-y border border-gray-300 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary bg-transparent text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200"
        />
        {/* Gradient accent line on focus */}
        <div className="pointer-events-none absolute bottom-0 left-1 right-1 h-0.5 scale-x-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-all duration-300 group-focus-within:scale-x-100 group-focus-within:opacity-100" />
      </div>
    </div>
  )
}
