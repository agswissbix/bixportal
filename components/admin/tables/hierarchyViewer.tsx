"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { toast } from "sonner"

interface FieldSetting {
  type: string
  options?: string[]
  value: string
}

interface LookupItem {
  itemcode: string
  itemdesc: string
  status?: "new" | "deleted" | "changed"| "unchanged"
}

interface Props {
  tableId?: string
  fieldId?: string
  userId?: string
  items?: LookupItem[]
  currentSettings: Record<string, FieldSetting>
  record?: { description?: string; label?: string }
  onSave?: (updatedSettings: Record<string, FieldSetting>) => void
}

const FieldSettingsViewer: React.FC<Props> = ({ tableId, fieldId, userId, currentSettings, record, items, onSave }) => {
  const [localSettings, setLocalSettings] = useState(currentSettings)
  const [description, setDescription] = useState(record?.description || "")
  const [label, setLabel] = useState(record?.label || "")
  const [lookupItems, setLookupItems] = useState<LookupItem[]>(items || [])

  // Se cambia currentSettings esterno, aggiorno lo stato interno
  useEffect(() => {
    setLocalSettings(currentSettings)
  }, [currentSettings])

  useEffect(() => {
    setDescription(record?.description || "")
    setLabel(record?.label || "")
  }, [record])

  useEffect(() => {
    console.log("Items changed:", items)
    setLookupItems(items)
  }, [items])

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }))
  }

  const renderSettingInput = (key: string, field: FieldSetting) => {
    if (field.type === "select" && field.options) {
      return (
        <Select
          value={field.value}
          onValueChange={(val) => handleSettingChange(key, val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleziona..." />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        value={field.value}
        onChange={(e) => handleSettingChange(key, e.target.value)}
        className="w-full"
      />
    )
  }

  const handleLookupChange = (index: number, value: string) => {
    setLookupItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, itemdesc: value, status: item.status === "new" ? item.status : "changed" } : item
      )
    )
  }

  const handleAddLookup = () => {
    const newItem: LookupItem = {
      itemcode: "",
      itemdesc: "",
      status: "new"
    }
    setLookupItems((prev) => [...prev, newItem])
  }

  const handleDeleteLookup = (index: number) => {
    setLookupItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, status: "deleted" } : item
      )
    )
  }


  const handleSave = async () => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "settings_table_fields_settings_fields_save",
          settings: localSettings,
          tableid: tableId,
          fieldid: fieldId,
          userid: userId,
          record: { description, label},
          items: lookupItems
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Impostazioni campo salvate")
        if (onSave) onSave(localSettings)
      }
    } catch (error) {
      toast.error("Errore durante il salvataggio delle impostazioni")
      console.error("Errore durante il salvataggio delle impostazioni:", error)
    }
  }

  if (!localSettings) {
    return <div className="p-4 text-gray-500">Nessun dato disponibile</div>
  }

  return (
    <div className="space-y-6">
      <Card className="border-gray-300">
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-gray-700">Impostazioni Campo</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
           <div className="flex flex-col gap-1">
            <label htmlFor="field-description" className="font-medium">Descrizione</label>
            <Input
              id="field-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
            />

            <label htmlFor="field-label" className="font-medium">Label</label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full"
            />
          </div>

          {Object.entries(localSettings).map(([key, field]) => (
            <div
              key={key}
              className="flex flex-col gap-1"
            >
              <span className="font-medium">{key}</span>
              {renderSettingInput(key, field)}
            </div>
          ))}

          {items && items.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Lookup Items</h3>

              <Button
                variant="secondary"
                onClick={handleAddLookup}
                className="bg-gray-200 hover:bg-gray-300"
              >
                Aggiungi
              </Button>

              <div className="space-y-3">
                {lookupItems.map((item, index) => (
                  <div
                    key={item.itemcode}
                    className={`flex items-center gap-2 ${
                      item.status === "deleted" ? "opacity-50" : ""
                    }`}
                  >
                    <Input
                      type="text"
                      value={item.itemdesc}
                      onChange={(e) =>
                        handleLookupChange(index, e.target.value)
                      }
                      className={`flex-1 ${
                        item.status === "deleted" ? "bg-red-100" : ""
                      }`}
                      disabled={item.status === "deleted"}
                    />
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteLookup(index)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Elimina
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        Salva Impostazioni
      </Button>
    </div>
  )
}

export default FieldSettingsViewer
