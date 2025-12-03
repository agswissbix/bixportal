"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { GripVertical, Settings, Eye, EyeOff, ChevronDown, ChevronRight, Trash2, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DraggableItem {
  id: string
  description: string
  order?: number | null
  [key: string]: any
}

interface DraggableGroup {
  name: string
  items: DraggableItem[]
  groupOrder?: number | null
  groupHidden?: boolean
  groupCollapsed?: boolean
}

interface DraggableListProps {
  groups: Record<string, DraggableGroup>
  onGroupsChange: (groups: Record<string, DraggableGroup>) => void
  onItemSettings: (itemId: string) => void
  onItemDelete?: (itemId: string) => void
  title?: string
  showGroups?: boolean
  isSaved?: boolean
  setIsSaved?: React.Dispatch<React.SetStateAction<boolean>>
}

export const DraggableList: React.FC<DraggableListProps> = ({
  groups,
  onGroupsChange,
  onItemSettings,
  onItemDelete,
  title,
  showGroups = true,
  isSaved = true,
  setIsSaved,
}) => {
  const [draggedItem, setDraggedItem] = useState<{ groupName: string; itemIndex: number } | null>(null)
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null)
  const initialOrders = useRef<Record<string, Record<string, number | null>>>({})
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    itemId: string
    groupName: string
    itemDescription: string
  }>({
    open: false,
    itemId: "",
    groupName: "",
    itemDescription: "",
  })

  useEffect(() => {
    if (Object.keys(initialOrders.current).length === 0 || isSaved) {
      const snapshot: Record<string, Record<string, number | null>> = {}
      Object.entries(groups).forEach(([groupName, group]) => {
        snapshot[groupName] = {}
        group.items.forEach((item) => {
          snapshot[groupName][item.id] = item.order ?? null
        })
      })
      initialOrders.current = snapshot
      if (setIsSaved) setIsSaved(false)
    }
  }, [groups, isSaved])

  const handleDragStart = (groupName: string, itemIndex: number) => {
    setDraggedItem({ groupName, itemIndex })
  }

  const handleDragOver = (e: React.DragEvent, groupName: string, targetIndex: number) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.groupName !== groupName || draggedItem.itemIndex === targetIndex) return

    const group = groups[groupName]
    if (!group || !group.items) return

    const visibleItems = group.items
      .filter((item) => item.order !== null && item.order !== undefined)
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    if (draggedItem.itemIndex === targetIndex) return

    const reorderedVisible = [...visibleItems]
    const [movedItem] = reorderedVisible.splice(draggedItem.itemIndex, 1)
    reorderedVisible.splice(targetIndex, 0, movedItem)

    const reorderedWithNewOrder = reorderedVisible.map((item, index) => ({
      ...item,
      order: index,
    }))

    const hiddenItems = group.items
      .filter((item) => item.order === null || item.order === undefined)
      .map((item) => ({ ...item }))

    const newItems = [...reorderedWithNewOrder, ...hiddenItems]

    onGroupsChange({
      ...groups,
      [groupName]: { ...group, items: newItems },
    })

    setDraggedItem({ groupName, itemIndex: targetIndex })
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDraggedGroup(null)
  }

  const handleGroupDragStart = (groupKey: string) => {
    setDraggedGroup(groupKey)
  }

  const handleGroupDragOver = (e: React.DragEvent, targetGroupKey: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedGroup || draggedGroup === targetGroupKey) return

    const visibleGroups = Object.entries(groups)
      .filter(([_, group]) => !group.groupHidden)
      .sort((a, b) => (a[1].groupOrder ?? 0) - (b[1].groupOrder ?? 0))

    const draggedIndex = visibleGroups.findIndex(([key]) => key === draggedGroup)
    const targetIndex = visibleGroups.findIndex(([key]) => key === targetGroupKey)

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return

    const reordered = [...visibleGroups]
    const [movedGroup] = reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, movedGroup)

    const updatedGroups = { ...groups }
    reordered.forEach(([key, group], index) => {
      updatedGroups[key] = { ...group, groupOrder: index }
    })

    onGroupsChange(updatedGroups)
  }

  const toggleItemVisibility = (groupName: string, itemId: string) => {
    const group = groups[groupName]
    if (!group || !group.items) return

    const item = group.items.find((i) => i.id === itemId)
    if (!item) return

    const isCurrentlyVisible = item.order !== null && item.order !== undefined

    const newItems = group.items.map((i) => ({ ...i }))

    if (isCurrentlyVisible) {
      const itemToHide = newItems.find((i) => i.id === itemId)
      if (itemToHide) itemToHide.order = null

      const visibleItems = newItems
        .filter((i) => i.id !== itemId && i.order !== null && i.order !== undefined)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

      visibleItems.forEach((i, index) => {
        i.order = index
      })
    } else {
      const visibleItems = newItems.filter((i) => i.order !== null && i.order !== undefined)
      const itemToShow = newItems.find((i) => i.id === itemId)
      if (itemToShow) itemToShow.order = visibleItems.length
    }

    onGroupsChange({
      ...groups,
      [groupName]: { ...group, items: newItems },
    })
  }

  const toggleGroupVisibility = (groupKey: string) => {
    const group = groups[groupKey]
    if (!group) return

    const isCurrentlyVisible = !group.groupHidden

    const updatedGroups = { ...groups }

    if (isCurrentlyVisible) {
      updatedGroups[groupKey] = { ...group, groupHidden: true, groupOrder: null }

      const visibleGroups = Object.entries(updatedGroups)
        .filter(([key, g]) => key !== groupKey && !g.groupHidden)
        .sort((a, b) => (a[1].groupOrder ?? 0) - (b[1].groupOrder ?? 0))

      visibleGroups.forEach(([key, g], index) => {
        updatedGroups[key] = { ...g, groupOrder: index }
      })
    } else {
      const visibleGroups = Object.entries(updatedGroups).filter(([_, g]) => !g.groupHidden)
      updatedGroups[groupKey] = { ...group, groupHidden: false, groupOrder: visibleGroups.length }
    }

    onGroupsChange(updatedGroups)
  }

  const toggleGroupCollapse = (groupKey: string) => {
    const group = groups[groupKey]
    if (!group) return

    onGroupsChange({
      ...groups,
      [groupKey]: { ...group, groupCollapsed: !group.groupCollapsed },
    })
  }

  const handleDeleteClick = (itemId: string, groupName: string, itemDescription: string) => {
    setDeleteDialog({
      open: true,
      itemId,
      groupName,
      itemDescription,
    })
  }

  const handleDeleteConfirm = () => {
    if (onItemDelete) {
      onItemDelete(deleteDialog.itemId)
    }
    setDeleteDialog({ open: false, itemId: "", groupName: "", itemDescription: "" })
  }

  const renderContent = () => {
    if (!groups || Object.keys(groups).length === 0) return null

    if (showGroups) {
      const visibleGroups = Object.entries(groups)
        .filter(([_, group]) => !group.groupHidden)
        .sort((a, b) => (a[1].groupOrder ?? 0) - (b[1].groupOrder ?? 0))

      const hiddenGroups = Object.entries(groups).filter(([_, group]) => group.groupHidden)

      return (
        <>
          {visibleGroups.map(([key, group]) => {
            const visibleItems = group.items
              .filter((item) => item.order !== null && item.order !== undefined)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
            const hiddenItems = group.items.filter((item) => item.order === null || item.order === undefined)

            return (
              <Card
                key={key}
                draggable
                onDragStart={() => handleGroupDragStart(key)}
                onDragOver={(e) => handleGroupDragOver(e, key)}
                onDragEnd={handleDragEnd}
                className={`
                  cursor-move transition-all
                  ${draggedGroup === key ? "opacity-50 scale-95" : ""}
                `}
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroupCollapse(key)}
                        className="h-6 w-6 p-0 hover:bg-white/50"
                      >
                        {group.groupCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <span>{group.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{visibleItems.length} visibili</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroupVisibility(key)}
                        className="hover:bg-white/50"
                      >
                        <Eye className="h-4 w-4 text-green-600" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                {!group.groupCollapsed && (
                  <CardContent className="pt-4">{renderItems(group.name, visibleItems, hiddenItems)}</CardContent>
                )}
              </Card>
            )
          })}

          {hiddenGroups.length > 0 && (
            <div className="space-y-2 pt-4 border-t-2 border-dashed">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Gruppi Nascosti</h4>
              {hiddenGroups.map(([key, group]) => (
                <Card key={key} className="opacity-60 bg-gray-50">
                  <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-50">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="text-gray-700">{group.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroupVisibility(key)}
                        className="hover:bg-gray-200"
                      >
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </>
      )
    } else {
      const firstGroup = Object.values(groups)[0]
      if (!firstGroup || !firstGroup.items) return null

      const visibleItems = firstGroup.items
        .filter((item) => item.order !== null && item.order !== undefined)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
      const hiddenItems = firstGroup.items.filter((item) => item.order === null || item.order === undefined)

      return renderItems(firstGroup.name, visibleItems, hiddenItems)
    }
  }

  const renderItems = (groupName: string, visibleItems: DraggableItem[], hiddenItems: DraggableItem[]) => {
    return (
      <>
        <div className="space-y-2 mb-4">
          {title && <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>}
          {visibleItems.length === 0 ? (
            <div className="text-center py-4 text-gray-400 border-2 border-dashed rounded-lg">Nessun elemento</div>
          ) : (
            visibleItems.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(groupName, index)}
                onDragOver={(e) => handleDragOver(e, groupName, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move
                  hover:shadow-md transition-all
                  ${draggedItem?.groupName === groupName && draggedItem?.itemIndex === index ? "opacity-50 scale-95" : ""}
                `}
              >
                <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{item.description}</div>
                  <div className="text-xs text-gray-500">{item.id}</div>
                </div>
                {(() => {
                  const originalOrder = initialOrders.current[groupName]?.[item.id] ?? null
                  const isModified = originalOrder !== item.order

                  return (
                    <Badge
                      variant="outline"
                      className={
                        isModified
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }
                    >
                      #{item.order !== null && item.order !== undefined ? item.order + 1 : 0}
                    </Badge>
                  )
                })()}
                <Button variant="ghost" size="sm" onClick={() => onItemSettings(item.id)} className="hover:bg-blue-50">
                  <Settings className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleItemVisibility(groupName, item.id)}
                  className="hover:bg-gray-100"
                >
                  <Eye className="h-4 w-4 text-green-600" />
                </Button>
                {onItemDelete && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="shadow-lg">
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(item.id, groupName, item.description)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          )}
        </div>

        {hiddenItems.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Elementi Nascosti</h4>
            {hiddenItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-700 truncate">{item.description}</div>
                  <div className="text-xs text-gray-500">{item.id}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleItemVisibility(groupName, item.id)}
                  className="hover:bg-gray-200"
                >
                  <EyeOff className="h-4 w-4 text-gray-400" />
                </Button>
                {onItemDelete && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover:bg-gray-200">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(item.id, groupName, item.description)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">{renderContent()}</div>
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare "{deleteDialog.itemDescription}"? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DraggableList
