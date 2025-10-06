"use client"

import type React from "react"
import { useState } from "react"
import { GripVertical, Settings, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DraggableItem {
  id: string
  description: string
  order?: number
  visible?: boolean
  [key: string]: any
}

interface DraggableGroup {
  name: string
  items: DraggableItem[]
}

interface DraggableListProps {
  groups: Record<string, DraggableGroup>
  onGroupsChange: (groups: Record<string, DraggableGroup>) => void
  onItemSettings: (itemId: string) => void
  title?: string
  showGroups?: boolean
}


// TODO drag and drop non va
// TODO visibile/unvisibile non va
// TODO ordine di partenza per i fields non va
export const DraggableList: React.FC<DraggableListProps> = ({
  groups,
  onGroupsChange,
  onItemSettings,
  title,
  showGroups = true,
}) => {
  const [draggedItem, setDraggedItem] = useState<{ groupName: string; itemIndex: number } | null>(null)

  const handleDragStart = (groupName: string, itemIndex: number) => {
    setDraggedItem({ groupName, itemIndex })
  }

  const handleDragOver = (e: React.DragEvent, groupName: string, targetIndex: number) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.groupName !== groupName) return

    const group = groups[groupName]
    if (!group || !group.items) return
    const visibleItems = group.items.filter((item) => item.order !== undefined)

    if (draggedItem.itemIndex === targetIndex) return

    const newItems = [...group.items]
    const draggedItemData = visibleItems[draggedItem.itemIndex]
    const draggedItemIndex = newItems.findIndex((item) => item.id === draggedItemData.id)
    const targetItem = visibleItems[targetIndex]
    const targetItemIndex = newItems.findIndex((item) => item.id === targetItem.id)

    newItems.splice(draggedItemIndex, 1)
    newItems.splice(targetItemIndex, 0, draggedItemData)

    let orderCounter = 0
    newItems.forEach((item) => {
      if (item.order !== undefined) {
        item.order = orderCounter++
      }
    })

    onGroupsChange({
      ...groups,
      [groupName]: { ...group, items: newItems },
    })

    setDraggedItem({ groupName, itemIndex: targetIndex })
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const toggleItemVisibility = (groupName: string, itemId: string) => {
    const group = groups[groupName]
    if (!group || !group.items) return
    const newItems = group.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          order: item.order !== undefined || item.visible !== null ? undefined : 0,
          visible: item.order !== undefined || item.visible !== null ? false : true,
        }
      }
      return item
    })

    let orderCounter = 0
    newItems.forEach((item) => {
      if (item.order !== undefined || item.visible !== null) {
        item.order = orderCounter++
      }
    })

    onGroupsChange({
      ...groups,
      [groupName]: { ...group, items: newItems },
    })
  }

  const renderContent = () => {
    if (!groups || Object.keys(groups).length === 0) return null
    if (showGroups) {
      return Object.entries(groups).map(([key, group]) => {
        const visibleItems = group.items
          .filter((item) => item.order !== undefined || item.visible !== null)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
        const hiddenItems = group.items.filter((item) => item.order === undefined || item.visible === null)

        return (
          <Card key={key}>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{group.name}</span>
                <Badge variant="outline">{visibleItems.length} visibili</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">{renderItems(group.name, visibleItems, hiddenItems)}</CardContent>
          </Card>
        )
      })
    } else {
      // Single group mode (no card wrapper)
      const firstGroup = Object.values(groups)[0]
        if (!firstGroup || !firstGroup.items) return null

      const visibleItems = firstGroup.items
        .filter((item) => item.order !== undefined || item.visible !== false || item.visible !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
      const hiddenItems = firstGroup.items.filter((item) => item.order === undefined && item.visible === false)

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
                {item.order !== undefined && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    #{item.order + 1}
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => onItemSettings(item.id)} className="hover:bg-blue-50">
                  <Settings className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleItemVisibility(groupName, item.id)}
                  className="hover:bg-gray-100"
                >
                  {item.order !== undefined || item.visible !== false ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
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
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  return <div className="space-y-4">{renderContent()}</div>
}

export default DraggableList
