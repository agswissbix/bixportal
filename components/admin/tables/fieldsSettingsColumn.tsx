import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import SettingsHierarchyViewer from "./hierarchyViewer"

const isDev = true

interface SettingsHierarchy {
  superuser: Record<string, any>
  groups: Record<string, Record<string, any>>
  user: Record<string, any>
}

const FieldSettingsResponseDev = {
  settings: {
    can_read: { value: true, type: "boolean", label: "Può Leggere" },
    can_write: { value: false, type: "boolean", label: "Può Scrivere" },
    required: { value: true, type: "boolean", label: "Campo Obbligatorio" },
  },
  hierarchy: {
    superuser: { can_read: true, can_write: true, required: false },
    groups: { g_marketing: { can_write: false, required: true } },
    user: { can_read: true },
  },
}


export const FieldSettingsColumn: React.FC<{
  tableId: string
  fieldId: string
  userId: string
}> = ({ fieldId }) => {
  const [settings, setSettings] = useState<any>(null)
  const [hierarchy, setHierarchy] = useState<SettingsHierarchy | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFieldSettings()
  }, [fieldId])

  const fetchFieldSettings = async () => {
    setLoading(true)
    if (isDev) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setSettings(FieldSettingsResponseDev.settings)
      setHierarchy(FieldSettingsResponseDev.hierarchy as SettingsHierarchy)
      setLoading(false)
      return
    }

    // API Call logic (omitted for brevity)
  }

  const handleSave = async () => {
    if (isDev) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      toast.success("Impostazioni campo salvate")
      return
    }
    // API Call logic (omitted for brevity)
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Campo: <span className="text-blue-600">{fieldId}</span></h2>

      {hierarchy && (
        <SettingsHierarchyViewer
          hierarchy={hierarchy}
          currentSettings={settings}
          onSettingChange={(key: string, value: any) => {
            setSettings({
              ...settings,
              [key]: { ...settings[key], value },
            })
          }}
        />
      )}

      <Button onClick={handleSave} className="w-full mt-4 bg-green-600 hover:bg-green-700">
        Salva Impostazioni
      </Button>
    </div>
  )
}