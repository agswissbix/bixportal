"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { Column, Task } from "./types/kanban"
import { useKanbanContext } from "@/hooks/useKanban"
import { KanbanColumn } from "./kanbanColumn"
import { AddTaskDialog } from "./dialogs/addTaskDialog"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AddColumnDialog } from "./dialogs/addColumnDialog"
import type {KanbanBoard} from "./types/kanban"

export function KanbanBoard({ boardProp }: { boardProp: KanbanBoard }) {
  const { board, setBoard, addColumn, moveTask } = useKanbanContext()
  const [draggedData, setDraggedData] = useState<{ taskId: string; sourceColumnId: string } | null>(null)

  useEffect(() => {
    setBoard(boardProp)
  }, [boardProp])

  const handleCreateColumn = (columnData: Omit<Column, "id" | "order">) => {
		addColumn(columnData)
	}

  const handleDragStart = (taskId: string, sourceColumnId: string) => {
    setDraggedData({ taskId, sourceColumnId })
  }

  const handleDragEnd = () => {
    setDraggedData(null)
  }

  const handleDrop = (e: React.DragEvent, destinationColumnId: string) => {
    e.preventDefault()

    if (!draggedData) return

    const { taskId, sourceColumnId } = draggedData

    if (sourceColumnId !== destinationColumnId) {
      // Trova l'indice di destinazione (per ora aggiungiamo alla fine)
      const destinationColumn = board.columns.find((col) => col.id === destinationColumnId)
      const destinationIndex = destinationColumn ? destinationColumn.tasks.length : 0

      moveTask(taskId, sourceColumnId, destinationColumnId, destinationIndex)
    }
  }


  return (
    <div className="h-full flex flex-col">
      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto bg-gray-100 rounded-lg">
        <div className="flex gap-6 p-6 h-full min-w-max">
          {board.columns
            .sort((a, b) => a.order - b.order)
            .map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
              />
            ))}
            {/* <AddColumnDialog 
                onAddColumn={handleCreateColumn}
            /> */}
        </div>
      </div>

      {/* Dialog per aggiungere/modificare task */}
      <AddTaskDialog/>
    </div>
  )
}
