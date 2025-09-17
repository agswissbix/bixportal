"use client"

import type React from "react"

import type { Column, Task } from "./types/kanban"
import { TaskCard } from "./taskCard"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { use, useEffect, useState } from "react"
import { useKanbanContext } from "@/hooks/useKanban"

interface KanbanColumnProps {
  column: Column
  onDragStart?: (taskId: string, columnId: string) => void
  onDragEnd?: () => void
  onDrop?: (e: React.DragEvent, columnId: string) => void
}

export function KanbanColumn({column, onDragStart, onDragEnd, onDrop}: KanbanColumnProps) {
	const { board, moveTask, addTask, setSelectedColumnId, setEditingTask, setIsAddTaskOpen } = useKanbanContext()
	const [draggedData, setDraggedData] = useState<{ taskId: string; sourceColumnId: string } | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

	const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId)
    setEditingTask(null)
    setIsAddTaskOpen(true)
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.setData("text/plain", taskId)
    e.dataTransfer.setData("application/json", JSON.stringify({ taskId, sourceColumnId: column.id }))
    onDragStart?.(taskId, column.id)
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    onDragEnd?.()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDrop?.(e, column.id)
  }

	const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  useEffect(() => {
    console.log('Rendering column:', column.id, 'with tasks:', column.tasks.map(t => t.recordid))
  }, [board, column])

  return (
    <div className="flex flex-col h-full min-w-80 max-w-80">
      {/* Header della colonna */}
      <div className={`${column.color} rounded-t-lg p-4 border-b space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-800">{column.title}</h2>
          </div>
          <span className="bg-white text-gray-600 text-xs px-2 py-1 rounded-full">{column.tasks.length}</span>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddTask?.(column.id)}
            className="h-6 w-6 p-0 hover:bg-white/50"
          >
            <Plus className="h-4 w-4" />
          </Button> */}
        </div>
        <div className="text-xs text-gray-700">
          Totale Fatture: {2000}<br />
          Margine totale: {800}
          {/* TODO implementare calcolo di cose personalizzate */}
        </div>
      </div>

      {/* Area delle task */}
      <div
        className="flex-1 p-4 space-y-3 bg-gray-50 rounded-b-lg min-h-96 overflow-y-auto"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
      >
        
        {column.tasks.map((task) => (
          <div key={task.recordid} draggable onDragStart={(e) => handleDragStart(e, task.recordid)} onDragEnd={handleDragEnd}>
            <TaskCard task={task} isDragging={draggedTaskId === task.recordid} />
          </div>
        ))}

        {column.tasks.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">Nessuna task in questa colonna</p>
            {/* <Button variant="ghost" size="sm" onClick={() => handleAddTask?.(column.id)} className="mt-2 text-xs">
              <Plus className="mr-1 h-3 w-3" />
              Aggiungi task
            </Button> */}
          </div>
        )}
      </div>
    </div>
  )
}
