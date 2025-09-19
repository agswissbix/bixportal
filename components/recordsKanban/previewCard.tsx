import React from "react"
import { Maximize2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface Task {
  recordid: string
  css?: string
  fields?: { [key: string]: string }
}

interface PropsInterface {
  task: Task
  onRowClick: (id: string) => void
}

export default function Preview({ task, onRowClick }: PropsInterface) {
  // prendo il primo campo dei fields
  const firstFieldKey = task.fields ? Object.keys(task.fields)[0] : undefined
  const firstFieldValue =
    firstFieldKey && task.fields ? task.fields[firstFieldKey] : "Senza titolo"

  // Separa i campi: primi 2 in evidenza, altri compatti
  const otherFields = task.fields ? Object.entries(task.fields).filter(([key]) => key !== firstFieldKey) : []
  const featuredFields = otherFields.slice(0, 2) // Prime 2 in evidenza
  const compactFields = otherFields.slice(2) // Il resto compatto

  return (
    <Card
      className={`bg-white transition-all duration-200 hover:shadow-md border-l-2 ${task.css || ""}`}
    >
      <CardContent className="p-4">
        {/* Header con titolo e azione */}
        <div className="flex items-start justify-between mb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="font-semibold text-base text-gray-900 leading-tight">
                {firstFieldValue || "Senza titolo"}
              </h3>
            </TooltipTrigger>
            <TooltipContent>{firstFieldValue || "Senza titolo"}</TooltipContent>
          </Tooltip>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRowClick(task.recordid)
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Espandi"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Primi campi in evidenza */}
        {featuredFields.length > 0 && (
          <div className="space-y-2 mb-3">
            {featuredFields.map(([key, value]) => (
              <div
                key={`${task.recordid}-${key}`}
                className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg px-3 py-2.5 border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {key.replace(/[_-]/g, ' ')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%] break-words">
                    {value || "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Altri campi in formato compatto */}
        {compactFields.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <div className="grid gap-1.5">
              {compactFields.map(([key, value]) => (
                <div
                  key={`${task.recordid}-${key}`}
                  className="flex justify-between items-center py-1"
                >
                  <span className="text-xs text-gray-500 truncate mr-3 flex-shrink-0 min-w-0">
                    {key.replace(/[_-]/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-800 font-medium text-right break-all max-w-[65%]">
                    {value || "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}