import React, { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import SettingsHierarchyViewer from "./hierarchyViewer"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"

const isDev = false

interface SettingsHierarchy {
  standarduser: Record<string, any>
  groups: Record<string, Record<string, any>>
  user: Record<string, any>
}

interface FieldSetting {
  value: any
  type: string
  label: string
}

interface ResponseInterface {
  fieldsettings: Record<string, FieldSetting>
  record: Record<string, any>
  items: any[]
  hierarchy?: SettingsHierarchy // opzionale se il BE la aggiunge in futuro
}


const FieldSettingsResponseDev: ResponseInterface = {
  fieldsettings: {
    can_read: { value: true, type: "boolean", label: "Può Leggere" },
    can_write: { value: false, type: "boolean", label: "Può Scrivere" },
    required: { value: true, type: "boolean", label: "Campo Obbligatorio" },
  },
  record: { id: 1, name: "Campo esempio" },
  items: [],
  hierarchy: {
    standarduser: { can_read: true, can_write: true, required: false },
    groups: { g_marketing: { can_write: false, required: true } },
    user: { can_read: true },
  },
}

export const FieldSettingsColumn: React.FC<{
  tableId: string
  fieldId: string
  userId: string
}> = ({ fieldId, userId, tableId }) => {
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? FieldSettingsResponseDev : { fieldsettings: {}, record: {}, items: [] })

  const payload = useMemo(() => {
		if (isDev) return null;
		return { 
			apiRoute: 'settings_table_fields_settings_block',
			tableid: tableId,
      fieldid: fieldId,
      userid: userId
		};
	}, [tableId, fieldId, userId]);

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };
	
	useEffect(() => {
			if (!isDev && response) { 
				setResponseData(response);
        console.log("Field Settings Response:", response);
			}
	}, [response]);

  const handleSave = async () => {
    if (isDev) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      toast.success("Impostazioni campo salvate")
      return
    }
    // API Call logic (omitted for brevity)
  }

  return (
<GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Campo: <span className="text-blue-600">{fieldId}</span></h2>

      {response.hierarchy && (
        <SettingsHierarchyViewer
          hierarchy={response.hierarchy}
          currentSettings={response.fieldsettings}
          onSettingChange={(key: string, value: any) => {
            setResponseData((prev) => ({
              ...prev,
              fieldsettings: {
                ...prev.fieldsettings,
                [key]: { ...prev.fieldsettings[key], value },
              },
            }))
          }}
        />
      )}

      <Button onClick={handleSave} className="w-full mt-4 bg-green-600 hover:bg-green-700">
        Salva Impostazioni
      </Button>
    </div>
      )}
      </GenericComponent>
  )
}