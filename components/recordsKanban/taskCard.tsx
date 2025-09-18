"use client"

import type React from "react"

import type { Task } from "./types/kanban"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, MoreHorizontal, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { use, useEffect } from "react"
import { useKanbanContext } from "@/hooks/useKanban"
import Preview from "./previewCard"
import { useRecordsStore } from "../records/recordsStore";

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

const priorityLabels = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
}

export function TaskCard({task, isDragging} : TaskCardProps) {
	const { board, addTask, updateTask, deleteTask, toggleTaskCollapse, selectedColumnId, setSelectedColumnId, setEditingTask, setIsAddTaskOpen } = useKanbanContext()


	useEffect(() => {
  	task = board.columns.flatMap((col) => col.tasks).find((t) => t.recordid === task.recordid) || task
	}, [board, task])

	const handleAddTask = (columnId: string) => {
		setSelectedColumnId(columnId)
		setEditingTask(null)
		setIsAddTaskOpen(true)
	}

	const handleEditTask = (task: Task) => {
		setEditingTask(task)
		setIsAddTaskOpen(true)
	}

  const handleRowClick  = useRecordsStore(s => s.handleRowClick);
  const { tableid } = useRecordsStore();

  const handleCardClick = (recordid: string) => {
    if (handleRowClick && tableid) {
      handleRowClick('standard', recordid, tableid);
    }
  };

  return (
    <div className={`${isDragging !== null && isDragging !== undefined ? "cursor-grabbing" : ""}`}>
      <Preview
        task={task}
        onRowClick={handleCardClick}
        />
    </div>
  )
}
