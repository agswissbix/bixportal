"use client"
import React from "react"
import { Checkbox } from "@/components/ui/checkbox"

export function AuthCard({
  checked,
  onChange,
  title,
  description,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onChange(!checked)
        }
      }}
      className={`
        flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all
        ${checked ? "border-[#E2231A] bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"}
      `}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        onClick={(e) => e.stopPropagation()}
        className="mt-0.5 shrink-0 data-[state=checked]:bg-[#E2231A] data-[state=checked]:border-[#E2231A]"
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            checked ? "text-gray-900" : "text-gray-900"
          }`}
        >
          {title}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
        {checked && children && (
          <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
