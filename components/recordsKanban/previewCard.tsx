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

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${task.css || ""}`}
    >
      <CardContent className="p-4">
        {/* Titolo = primo campo dei fields */}
        <div className="flex items-start justify-between mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 truncate">
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
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Espandi"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Campi dinamici */}
        <div className="space-y-1">
          {task.fields &&
            Object.entries(task.fields).map(([key, value]) =>
              key !== firstFieldKey ? (
                <div
                  key={`${task.recordid}-${key}`}
                  className="flex text-sm justify-between"
                >
                  <span className="text-gray-500 mr-1">{key}:</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right font-medium">
                    {value || "-"}
                  </span>
                </div>
              ) : null
            )}
        </div>
      </CardContent>
    </Card>
  )
}
