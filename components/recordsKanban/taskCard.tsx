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

	// const handleCardClick = (e: React.MouseEvent) => {
  //   if ((e.target as HTMLElement).closest('[role="button"]') || (e.target as HTMLElement).closest("button")) {
  //     return
  //   }
	// 	toggleTaskCollapse(task.recordid)
  // }

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
    <Preview
      task={task}
      onRowClick={handleCardClick}
    />
    // <Card
    //   className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
    //     isDragging ? "shadow-lg opacity-80" : ""
    //   } ${task.css || ""}`}
    //   onClick={handleCardClick}
    // >
    //   <CardHeader className="pb-2">
    //     <div className="flex items-start justify-between">
    //       <div className="flex items-center gap-2 flex-1">
    //         <Button
    //           variant="ghost"
    //           size="sm"
    //           className="h-4 w-4 p-0 hover:bg-transparent"
    //           onClick={(e) => {
    //             e.stopPropagation()
		// 						toggleTaskCollapse(task.recordid)
    //           }}
    //         >
    //           {task.collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
    //         </Button>
    //         <h3 className="font-medium text-sm leading-tight flex-1">{task.title}</h3>
    //         { task.collapsed && (
    //           <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
    //             {priorityLabels[task.priority]}
    //           </Badge>
    //         )}
    //       </div>
    //       <DropdownMenu>
    //         <DropdownMenuTrigger asChild>
    //           <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
    //             <MoreHorizontal className="h-3 w-3" />
    //           </Button>
    //         </DropdownMenuTrigger>
    //         <DropdownMenuContent align="end">
    //           <DropdownMenuItem onClick={() => handleEditTask?.(task)}>
    //             <Edit className="mr-2 h-4 w-4" />
    //             Modifica
    //           </DropdownMenuItem>
    //           <DropdownMenuItem onClick={() => deleteTask(task.recordid)} className="text-red-600">
    //             <Trash2 className="mr-2 h-4 w-4" />
    //             Elimina
    //           </DropdownMenuItem>
    //         </DropdownMenuContent>
    //       </DropdownMenu>
    //     </div>
    //   </CardHeader>

    //   {!task.collapsed && (
    //     <CardContent className="pt-0">
    //       {task.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>}

    //       <div className="space-y-2">
    //         <div className="flex items-center justify-between">
    //           <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
    //             {priorityLabels[task.priority]}
    //           </Badge>

    //           {task.dueDate && (
    //             <div className="flex items-center text-xs text-gray-500">
    //               <Calendar className="mr-1 h-3 w-3" />
    //               {new Date(task.dueDate).toLocaleDateString("it-IT")}
    //             </div>
    //           )}
    //         </div>

    //         {task.assignee && (
    //           <div className="flex items-center text-xs text-gray-600">
    //             <User className="mr-1 h-3 w-3" />
    //             {task.assignee}
    //           </div>
    //         )}

    //         {task.tags && task.tags.length > 0 && (
    //           <div className="flex flex-wrap gap-1">
    //             {task.tags.map((tag, index) => (
    //               <Badge key={index} variant="outline" className="text-xs">
    //                 {tag}
    //               </Badge>
    //             ))}
    //           </div>
    //         )}

    //         {task.fields && Object.keys(task.fields).length > 0 && (
    //           <div className="space-y-1 pt-2 border-t">
    //             {Object.entries(task.fields)
    //               .slice(0, 3)
    //               .map(([key, value]) => (
    //                 <div key={key} className="flex justify-between text-xs">
    //                   <span className="text-gray-500 truncate">{key}:</span>
    //                   <span className="text-gray-700 truncate ml-2">{value}</span>
    //                 </div>
    //               ))}
    //           </div>
    //         )}
    //       </div>
    //     </CardContent>
    //   )}
    // </Card>
  )
}
