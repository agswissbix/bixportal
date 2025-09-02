"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { Column } from "../types/kanban"

interface AddColumnDialogProps {
  onAddColumn: (column: Omit<Column, "id" | "order">) => void
}

const colorOptions = [
  { value: "bg-gray-100", label: "Grigio", preview: "bg-gray-100" },
  { value: "bg-blue-100", label: "Blu", preview: "bg-blue-100" },
  { value: "bg-green-100", label: "Verde", preview: "bg-green-100" },
  { value: "bg-yellow-100", label: "Giallo", preview: "bg-yellow-100" },
  { value: "bg-red-100", label: "Rosso", preview: "bg-red-100" },
  { value: "bg-purple-100", label: "Viola", preview: "bg-purple-100" },
  { value: "bg-pink-100", label: "Rosa", preview: "bg-pink-100" },
  { value: "bg-indigo-100", label: "Indaco", preview: "bg-indigo-100" },
]

export function AddColumnDialog({ onAddColumn }: AddColumnDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [color, setColor] = useState("bg-gray-100")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onAddColumn({
      title: title.trim(),
      color,
      tasks: [],
      editable: true,
    })

    setTitle("")
    setColor("bg-gray-100")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-full min-h-[200px] w-80 border-2 border-dashed">
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-8 w-8" />
            <span>Aggiungi Colonna</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Aggiungi Nuova Colonna</DialogTitle>
            <DialogDescription>Crea una nuova colonna per organizzare i tuoi task.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Titolo
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="Nome della colonna"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Colore
              </Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.preview} border`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit">Aggiungi Colonna</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
