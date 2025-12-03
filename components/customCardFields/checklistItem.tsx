"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface ChecklistItemProps {
  item: ChecklistItem
  onToggle: (recordid: string, newValue: "Si" | "No") => Promise<void>
}

export interface ChecklistItem {
  recordid: string
  description: string
  checked: "Si" | "No"
  css: string
}

export function ChecklistItem({ item, onToggle }: ChecklistItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const isChecked = item.checked === "Si"

  const handleToggle = async () => {
    setIsUpdating(true)
    try {
      const newValue = isChecked ? "No" : "Si"
      await onToggle(item.recordid, newValue)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={cn(
        "w-full flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all duration-200",
        "hover:shadow-md active:scale-[0.98]",
        "disabled:opacity-50 disabled:pointer-events-none",
        isChecked
          ? "bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400"
          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300",
        item.css,
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center mt-0.5 transition-all",
          isChecked ? "bg-green-500 border-green-500" : "bg-white border-gray-300 hover:border-gray-400",
        )}
      >
        {isChecked && <Check className="w-4 h-4 text-white stroke-[3]" />}
      </div>

      <span
        className={cn(
          "flex-1 text-[15px] leading-relaxed transition-all",
          isChecked ? "line-through text-gray-500 font-normal" : "text-gray-900 font-medium",
        )}
      >
        {item.description}
      </span>
    </button>
  )
}
