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
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // setBoard(boardProp)
    console.log("KanbanBoard - boardProp changed:", boardProp)
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

  // Filtra le colonne in base al termine di ricerca
  const filteredBoard = {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => {
        if (!task.fields) return false;

        return Object.entries(task.fields).some(
          ([key, value]) =>
            `${value}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${key}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }),
    })),
  };


  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
          {/* <Button onClick={() => handleAddTask("todo")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuova Task
          </Button> */}
        </div>

        {/* Barra di ricerca e filtri */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cerca task..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtri
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto bg-gray-100">
        <div className="flex gap-6 p-6 h-full min-w-max">
          {filteredBoard.columns
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
            <AddColumnDialog 
                onAddColumn={handleCreateColumn}
            />
        </div>
      </div>

      {/* Dialog per aggiungere/modificare task */}
      <AddTaskDialog/>
    </div>
  )
}
