"use client"
import React from "react"
import { Check } from "lucide-react"

export function AccessorySelector({
  selectedItems,
  onToggle,
  options
}: {
  selectedItems: string[]
  onToggle: (item: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map((item) => {
        const selected = selectedItems.includes(item.value)
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onToggle(item.value)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
              ${
                selected
                  ? "bg-[#E2231A] text-white border-[#E2231A]"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
              }
            `}
          >
            {selected && <Check className="w-3 h-3" />}
            {item.label}
          </button>
        )
      })}
      {selectedItems.length > 0 && (
        <p className="text-xs text-gray-500 mt-2 w-full">
          {selectedItems.length} selected
        </p>
      )}
    </div>
  )
}
