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

const responseDataDEV: KanbanBoard = {
id: "1",
title: "Il Mio Progetto",
columns: [
    {
    id: "todo",
    title: "Da Fare",
    color: "bg-gray-100",
    order: 0,
    editable: true,
    tasks: [
        {
        id: "1",
        title: "Progettare interfaccia utente",
        description: "Creare mockup e wireframe per la nuova feature",
        priority: "high",
        assignee: "Mario Rossi",
        tags: ["design", "ui"],
        createdAt: "2024-01-15",
        updatedAt: "2024-01-15",
        collapsed: false,
        css: "border-l-4 border-red-500",
        fields: {
            "Product name": "Macbook",
            "Color": "nero",
            "Price": "2k",
        },
        },
        {
        id: "2",
        title: "Setup database",
        description: "Configurare il database PostgreSQL",
        priority: "medium",
        assignee: "Giulia Bianchi",
        tags: ["backend", "database"],
        createdAt: "2024-01-14",
        updatedAt: "2024-01-14",
        collapsed: false,
        css: "border-l-4 border-yellow-500",
        },
    ],
    },
    {
    id: "in-progress",
    title: "In Corso",
    color: "bg-blue-100",
    order: 1,
    editable: true,
    tasks: [
        {
        id: "3",
        title: "Implementare autenticazione",
        description: "Aggiungere login e registrazione utenti",
        priority: "high",
        assignee: "Luca Verdi",
        tags: ["auth", "security"],
        createdAt: "2024-01-13",
        updatedAt: "2024-01-16",
        collapsed: false,
        css: "border-l-4 border-blue-500",
        },
    ],
    },
    {
    id: "review",
    title: "In Revisione",
    color: "bg-yellow-100",
    order: 2,
    editable: true,
    tasks: [
        {
        id: "4",
        title: "Code review API endpoints",
        description: "Revisione del codice per gli endpoint REST",
        priority: "medium",
        assignee: "Anna Neri",
        tags: ["review", "api"],
        createdAt: "2024-01-12",
        updatedAt: "2024-01-15",
        collapsed: false,
        css: "border-l-4 border-purple-500",
        },
    ],
    },
    {
    id: "done",
    title: "Completato",
    color: "bg-green-100",
    order: 3,
    editable: true,
    tasks: [
        {
        id: "5",
        title: "Setup progetto iniziale",
        description: "Configurazione Next.js e dipendenze",
        priority: "low",
        assignee: "Marco Blu",
        tags: ["setup", "config"],
        createdAt: "2024-01-10",
        updatedAt: "2024-01-11",
        collapsed: false,
        css: "border-l-4 border-green-500",
        },
    ],
    },
],
}


// 1. Definiamo il tipo del contesto
type KanbanContextType = {
  board: KanbanBoard
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
  const [board, setBoard] = useState<KanbanBoard>(responseDataDEV)
  
    const moveTask = useCallback(
      (taskId: string, sourceColumnId: string, destinationColumnId: string, destinationIndex: number) => {
        setBoard((prevBoard) => {
          const newColumns = [...prevBoard.columns]
  
          const sourceColumn = newColumns.find((col) => col.id === sourceColumnId)
          const destinationColumn = newColumns.find((col) => col.id === destinationColumnId)
  
          if (!sourceColumn || !destinationColumn) return prevBoard
  
          const taskIndex = sourceColumn.tasks.findIndex((task) => task.id === taskId)
          if (taskIndex === -1) return prevBoard
  
          const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1)
  
          const safeIndex = Math.min(destinationIndex, destinationColumn.tasks.length)
  
          destinationColumn.tasks.splice(safeIndex, 0, {
            ...movedTask,
            updatedAt: new Date().toISOString().split("T")[0],
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
          id: Date.now().toString(),
          createdAt: new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString().split("T")[0],
          collapsed: false,
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
          const taskIndex = column.tasks.findIndex((task) => task.id === taskId)
          if (taskIndex !== -1) {
            column.tasks[taskIndex] = {
              ...column.tasks[taskIndex],
              ...updates,
              updatedAt: new Date().toISOString().split("T")[0],
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
          const taskIndex = column.tasks.findIndex((task) => task.id === taskId)
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
      setBoard((prevBoard) => {
        const newColumns = [...prevBoard.columns]
        
        for (const column of newColumns) {
          const taskIndex = column.tasks.findIndex((task) => task.id === taskId)
          if (taskIndex !== -1) {
            column.tasks[taskIndex] = {
              ...column.tasks[taskIndex],
              collapsed: !column.tasks[taskIndex].collapsed,
            }
            console.log("toggleTaskCollapse chiamata: da ", column.tasks[taskIndex].collapsed)
            break
          }
        }
  
        return {
          ...prevBoard,
          columns: newColumns,
        }
      })
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