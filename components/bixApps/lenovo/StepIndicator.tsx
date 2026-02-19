"use client"
import React from "react"
import { Check, User, Laptop, Wrench, Camera } from "lucide-react"

const STEPS = [
  { id: 1, label: "Cliente", shortLabel: "Cliente", icon: User },
  { id: 2, label: "Prodotto", shortLabel: "Prodotto", icon: Laptop },
  { id: 3, label: "Assistenza", shortLabel: "Assist.", icon: Wrench },
  { id: 4, label: "Media", shortLabel: "Media", icon: Camera },
] as const

export function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number
  onStepClick: (step: number) => void
}) {
  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop stepper */}
      <ol className="hidden md:flex items-center gap-2">
        {STEPS.map((s, i) => {
          const isComplete = currentStep > s.id
          const isCurrent = currentStep === s.id
          const Icon = s.icon
          return (
            <li key={s.id} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => onStepClick(s.id)}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all w-full
                  ${isCurrent ? "bg-red-50 text-[#E2231A] font-semibold" : ""}
                  ${isComplete ? "text-[#E2231A]" : ""}
                  ${!isCurrent && !isComplete ? "text-gray-400" : ""}
                  hover:bg-gray-50
                `}
              >
                <span
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 transition-all
                    ${isComplete ? "bg-[#E2231A] text-white" : ""}
                    ${isCurrent ? "bg-[#E2231A] text-white ring-2 ring-red-200 ring-offset-2" : ""}
                    ${!isCurrent && !isComplete ? "bg-gray-100 text-gray-500" : ""}
                  `}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : s.id}
                </span>
                <span className="text-sm whitespace-nowrap">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 min-w-6 transition-colors ${
                    isComplete ? "bg-[#E2231A]" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">
            {STEPS[currentStep - 1].label}
          </span>
          <span className="text-xs text-gray-500">
            {currentStep} / {STEPS.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStepClick(s.id)}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                currentStep >= s.id ? "bg-[#E2231A]" : "bg-gray-200"
              }`}
              aria-label={`Step ${s.id}: ${s.label}`}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}
