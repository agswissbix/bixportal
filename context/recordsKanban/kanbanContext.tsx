"use client"

import { createContext, useCallback, ReactNode, useState } from "react"
// import { useKanban } from ""
import type { KanbanBoard, Task, Column } from "@/components/recordsKanban/types/kanban"

// --- DATI DI ESEMPIO AGGIORNATI PER KANBAN ---
  
const responseDataDEFAULT: KanbanBoard = {
id: "1",
title: "Il Mio Progetto",
columns: [],
}


// 1. Definiamo il tipo del contesto
type KanbanContextType = {
  board: KanbanBoard
  setBoard: (board: KanbanBoard) => void
  moveTask: (taskId: string, sourceColumnId: string, destinationColumnId: string, destinationIndex: number) => void
  addTask: (columnId: string, task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  toggleTaskCollapse: (taskId: string) => void
  addColumn: (column: Omit<Column, "id" | "order">) => void
  updateColumn: (columnId: string, updates: Partial<Column>) => void
  deleteColumn: (columnId: string) => void
	selectedColumnId: string,
	setSelectedColumnId: (id: string) => void
	isAddTaskOpen: boolean,
	setIsAddTaskOpen: (value: boolean)=> void
  editingTask: Task | null, 
	setEditingTask: (task: Task | null)=> void
}



export const KanbanContext = createContext<KanbanContextType | undefined>(undefined)

export function KanbanProvider({ children }: { children: ReactNode }) {
	const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
	const [editingTask, setEditingTask] = useState<Task | null>(null)
	const [selectedColumnId, setSelectedColumnId] = useState<string>("")
  const [board, setBoard] = useState<KanbanBoard>(responseDataDEFAULT)
  
    const moveTask = useCallback(
      (taskId: string, sourceColumnId: string, destinationColumnId: string, destinationIndex: number) => {
        setBoard((prevBoard) => {
          const newColumns = [...prevBoard.columns]
  
          const sourceColumn = newColumns.find((col) => col.id === sourceColumnId)
          const destinationColumn = newColumns.find((col) => col.id === destinationColumnId)
  
          if (!sourceColumn || !destinationColumn) return prevBoard
  
          const taskIndex = sourceColumn.tasks.findIndex((task) => task.recordid === taskId)
          if (taskIndex === -1) return prevBoard
  
          const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1)
  
          const safeIndex = Math.min(destinationIndex, destinationColumn.tasks.length)
  
          destinationColumn.tasks.splice(safeIndex, 0, {
            ...movedTask,
          })
  
          return {
            ...prevBoard,
            columns: newColumns,
          }
        })
      },
      [],
    )
  
    const addTask = useCallback((columnId: string, task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      setBoard((prevBoard) => {
        const newColumns = [...prevBoard.columns]
        const column = newColumns.find((col) => col.id === columnId)
  
        if (!column) return prevBoard
  
        const newTask: Task = {
          ...task,
          recordid: Date.now().toString(),
        }
  
        column.tasks.push(newTask)
  
        return {
          ...prevBoard,
          columns: newColumns,
        }
      })
    }, [])
  
    const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
      setBoard((prevBoard) => {
        const newColumns = [...prevBoard.columns]
  
        for (const column of newColumns) {
          const taskIndex = column.tasks.findIndex((task) => task.recordid === taskId)
          if (taskIndex !== -1) {
            column.tasks[taskIndex] = {
              ...column.tasks[taskIndex],
              ...updates,
            }
            break
          }
        }
  
        return {
          ...prevBoard,
          columns: newColumns,
        }
      })
    }, [])
  
    const deleteTask = useCallback((taskId: string) => {
      setBoard((prevBoard) => {
        const newColumns = [...prevBoard.columns]
  
        for (const column of newColumns) {
          const taskIndex = column.tasks.findIndex((task) => task.recordid === taskId)
          if (taskIndex !== -1) {
            column.tasks.splice(taskIndex, 1)
            break
          }
        }
  
        return {
          ...prevBoard,
          columns: newColumns,
        }
      })
    }, [])
  
    const toggleTaskCollapse = useCallback((taskId: string) => {
      // setBoard((prevBoard) => {
      //   const newColumns = [...prevBoard.columns]
        
      //   for (const column of newColumns) {
      //     const taskIndex = column.tasks.findIndex((task) => task.recordid === taskId)
      //     if (taskIndex !== -1) {
      //       column.tasks[taskIndex] = {
      //         ...column.tasks[taskIndex],
      //         collapsed: !column.tasks[taskIndex].collapsed,
      //       }
      //       console.log("toggleTaskCollapse chiamata: da ", column.tasks[taskIndex].collapsed)
      //       break
      //     }
      //   }
  
      //   return {
      //     ...prevBoard,
      //     columns: newColumns,
      //   }
      // })
    }, [])
  
    const addColumn = useCallback((column: Omit<Column, "id" | "order">) => {
      setBoard((prevBoard) => {
        const newColumn: Column = {
          ...column,
          id: Date.now().toString(),
          order: prevBoard.columns.length,
          tasks: [],
          editable: true,
        }
  
        return {
          ...prevBoard,
          columns: [...prevBoard.columns, newColumn],
        }
      })
    }, [])
  
    const updateColumn = useCallback((columnId: string, updates: Partial<Column>) => {
      setBoard((prevBoard) => {
        const newColumns = [...prevBoard.columns]
        const columnIndex = newColumns.findIndex((col) => col.id === columnId)
  
        if (columnIndex !== -1) {
          newColumns[columnIndex] = {
            ...newColumns[columnIndex],
            ...updates,
          }
        }
  
        return {
          ...prevBoard,
          columns: newColumns,
        }
      })
    }, [])
  
    const deleteColumn = useCallback((columnId: string) => {
      setBoard((prevBoard) => {
        const newColumns = prevBoard.columns.filter((col) => col.id !== columnId)
  
        return {
          ...prevBoard,
          columns: newColumns,
        }
      })
    }, [])

  return (
    <KanbanContext.Provider
      value={{
        board,
        setBoard,
        moveTask,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCollapse,
        addColumn,
        updateColumn,
        deleteColumn,
				selectedColumnId,
				setSelectedColumnId,
				isAddTaskOpen,
				setIsAddTaskOpen,
				editingTask,
				setEditingTask,
      }}
    >
      {children}
    </KanbanContext.Provider>
  )
}