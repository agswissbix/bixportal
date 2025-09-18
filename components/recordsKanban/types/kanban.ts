// // Interfacce per compatibilità con il sistema esistente dell'utente
// export interface RecordData {
//   recordid: string
//   css?: string
//   fields: { [key: string]: string }
// }

// export interface KanbanGroup {
//   groupTitle: string
//   records: RecordData[]
// }

// export interface ResponseInterface {
//   totalRecords: number
//   groups: KanbanGroup[]
// }

// Interfacce esistenti del kanban con aggiunte per nuove funzionalità
export interface Task {
  recordid: string
  // title: string
  // description?: string
  // priority: "low" | "medium" | "high"
  // assignee?: string
  // dueDate?: string
  // tags?: string[]
  // createdAt: string
  // updatedAt: string
  // collapsed?: boolean
  css?: string
  fields?: { [key: string]: string }
}

export interface Column {
  id: string
  title: string
  color: string
  tasks: Task[]
  order: number
  editable?: boolean
}

export interface KanbanBoard {
  id: string
  isDraggable?: boolean
  columns: Column[]
}

export type DragResult = {
  draggableId: string
  type: string
  source: {
    droppableId: string
    index: number
  }
  destination?: {
    droppableId: string
    index: number
  } | null
}
