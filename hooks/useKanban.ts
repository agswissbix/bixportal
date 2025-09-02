import { useContext } from "react"
import { KanbanContext } from "@/context/recordsKanban/kanbanContext"

export function useKanbanContext() {
  const context = useContext(KanbanContext)
  if (!context) {
    throw new Error("useKanbanContext deve essere usato dentro a <KanbanProvider>")
  }
  return context
}