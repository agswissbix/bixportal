"use client"

import type React from "react"

import { useEffect, useState } from "react"
// import type { Task } from "../types/kanban"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useKanbanContext } from "@/hooks/useKanban"

export function AddTaskDialog() {
  const { addTask, updateTask, selectedColumnId, isAddTaskOpen, setIsAddTaskOpen, editingTask, setEditingTask } = useKanbanContext()
  const [formData, setFormData] = useState({
    title: editingTask?.title || "",
    description: editingTask?.description || "",
    priority: editingTask?.priority || ("medium" as const),
    assignee: editingTask?.assignee || "",
    dueDate: editingTask?.dueDate || "",
    tags: editingTask?.tags?.join(", ") || "",
  })

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask?.title || "",
        description: editingTask?.description || "",
        priority: editingTask?.priority || ("medium" as const),
        assignee: editingTask?.assignee || "",
        dueDate: editingTask?.dueDate || "",
        tags: editingTask?.tags?.join(", ") || "",
      })
    }
  }, [editingTask])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) return

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      assignee: formData.assignee.trim() || undefined,
      dueDate: formData.dueDate || undefined,
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined,
    }

    if (editingTask) {
      updateTask(editingTask.id, taskData)
    } else {
      addTask(selectedColumnId, taskData)
    }

    // Reset form
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      assignee: "",
      dueDate: "",
      tags: "",
    })

    setIsAddTaskOpen(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isAddTaskOpen} onOpenChange={(open) => {
      console.log("Dialog stato cambiato:", open, {
      isAddTaskOpen,
      editingTask,
    })
    setIsAddTaskOpen(open)
    if (!open) {
      console.log("Dialog CHIUSO → reset editingTask")
      setEditingTask(null)
    }
  }}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Modifica Task" : "Nuova Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titolo * {formData?.title}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Inserisci il titolo della task"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrizione opzionale"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priorità</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Bassa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Scadenza</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assignee">Assegnato a</Label>
            <Input
              id="assignee"
              value={formData.assignee}
              onChange={(e) => handleInputChange("assignee", e.target.value)}
              placeholder="Nome della persona"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tag</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddTaskOpen(false)}>
              Annulla
            </Button>
            <Button type="submit">{editingTask ? "Aggiorna" : "Crea Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
