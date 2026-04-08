"use client"

import type React from "react"
import { useState, useEffect, useMemo, type ChangeEvent } from "react"
import { useApi } from "@/utils/useApi" // ipotizzo un hook custom
import GenericComponent from "@/components/genericComponent"
import SelectStandard from "@/components/selectStandard"
import { Button } from "@/components/ui/button"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { toast } from "sonner"
import { Save, Search, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import ConditionsEditor from "./conditionsEditor"

const isDev = false

interface LookupItem {
  id?: string
  name: string
  selected?: boolean
}

interface TableSettingOption {
  id?: string
  name?: string
  value?: string
}

interface Conditions {
  logic?: "AND" | "OR"
  rules?: Array<{
    field: string
    operator: string
    value: string
  }>
  is_merged?: boolean
  conditions_list?: Conditions[]
}

interface TableSetting {
  type: "select" | "multiselect" | "parola"
  options?: (string | TableSettingOption)[]
  value: string | string[]
  conditions?: string | Conditions
  source?: "user" | "default" | "hardcoded"
  original_default?: string
}

interface ResponseInterface {
  tablesettings: Record<string, TableSetting>
}

interface Props {
  tableId: string
  userId: string
}

const ResponseDataDef: ResponseInterface = {
  tablesettings: {},
}

const ResponseDataDev: ResponseInterface = {
  tablesettings: {
    edit: { type: "select", options: ["true", "false"], value: "true" },
    risultati_edit: {
      type: "select",
      options: ["true", "false"],
      value: "false",
      conditions: {
        logic: "AND",
        rules: [
          { field: "status", operator: "=", value: "vinta" },
          { field: "userid", operator: "=", value: "$userid$" },
        ],
      },
    },
    default_viewid: {
      type: "select",
      options: [
        { id: "1", name: "Vista 1" },
        { id: "2", name: "Vista 2" },
      ],
      value: "None",
    },
    default_recordstab: { type: "parola", value: "Tabella" },
    default_recordtab: { type: "parola", value: "Fields" },
    dem_mail_field: { type: "select", options: ["address", "email", "user_mail"], value: "address" },
    fields_autoscroll: { type: "select", options: ["true", "false"], value: "false" },
    col_s: { type: "parola", value: "3" },
    col_m: { type: "parola", value: "3" },
    col_l: { type: "parola", value: "3" },
  },
}

const TableSettingsForm: React.FC<Props> = ({ tableId, userId }) => {
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? ResponseDataDev : ResponseDataDef)
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({})
  const [conditionsValues, setConditionsValues] = useState<Record<string, Conditions>>({})
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [showOnlyCustom, setShowOnlyCustom] = useState<boolean>(false)

  const payload = useMemo(() => {
    return {
      apiRoute: "settings_table_settings",
      tableid: tableId,
      userid: userId,
    }
  }, [tableId])

  const { response, loading, error } = useApi<ResponseInterface>(payload)

  useEffect(() => {
    const source = isDev ? ResponseDataDev : response
    if (source) {
      setResponseData(source)
      const initialValues = Object.entries(source.tablesettings).reduce(
        (acc, [key, val]) => {
          acc[key] = val.value
          return acc
        },
        {} as Record<string, string | string[]>,
      )
      setFormValues(initialValues)

      const initialConditions = Object.entries(source.tablesettings).reduce(
        (acc, [key, val]) => {
          if (val.conditions) {
            try {
              acc[key] = typeof val.conditions === "string" ? JSON.parse(val.conditions) : val.conditions
            } catch {
              acc[key] = { logic: "AND", rules: [] }
            }
          }
          return acc
        },
        {} as Record<string, Conditions>,
      )
      setConditionsValues(initialConditions)
    }
  }, [response, isDev])

  const handleInputChange = (fieldId: string, value: string | string[]) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleConditionsChange = (fieldId: string, conditions: Conditions) => {
    setConditionsValues((prev) => ({ ...prev, [fieldId]: conditions }))
  }

  const handleResetSetting = async (settingName: string) => {
    try {
      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "settings_table_settings_reset",
          tableid: tableId,
          userid: userId,
          settingid: settingName,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      toast.success("Impostazione ripristinata")
      
      const newFormValue = responseData.tablesettings[settingName]?.original_default || ""
      setFormValues((prev) => ({ ...prev, [settingName]: newFormValue }))
    } catch (err) {
      toast.error("Errore durante il ripristino dell'impostazione")
    }
  }

  const handleSave = async () => {
    try {
      const settings = Object.entries(formValues).map(([name, value]) => {
        const setting: any = {
          name,
          value: Array.isArray(value) ? value.join(",") : value,
        }

        const cond = conditionsValues[name]
        if (cond && (cond.is_merged || (cond.rules && cond.rules.length > 0))) {
          setting.conditions = JSON.stringify(cond)
        }

        return setting
      })

      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "settings_table_fields_settings_save",
          settings,
          tableid: tableId,
          userid: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      toast.success("Impostazioni salvate correttamente.")
    } catch (err) {
      toast.error("Errore durante il salvataggio delle impostazioni")
    }
  }

  const filteredSettings = useMemo(() => {
    let result = Object.entries(responseData.tablesettings)
    
    if (showOnlyCustom) {
      result = result.filter(([key, val]) => val.source === "user")
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(([key, val]) => {
        return (
          key.toLowerCase().includes(lower) ||
          (typeof val.value === "string" && val.value.toLowerCase().includes(lower))
        )
      })
    }

    return Object.fromEntries(result)
  }, [searchTerm, showOnlyCustom, responseData])

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <div className="flex flex-col gap-4 p-4 ">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 max-w-full bg-white p-2 border rounded-md shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca impostazione..."
                className="pl-9 w-full border-gray-200"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer text-gray-700 select-none">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={showOnlyCustom}
                onChange={(e) => setShowOnlyCustom(e.target.checked)}
              />
              Mostra solo personalizzati
            </label>
          </div>

          {Object.entries(filteredSettings).map(([setting, val]) => {
            const initialValue = formValues[setting] ?? val.value ?? ""
            const isBooleanField =
              val.type === "select" &&
              val.options?.length === 2 &&
              val.options.includes("true") &&
              val.options.includes("false")

            // Determine badge appearance based on source
            let badgeText = "Predefinito di sistema"
            let badgeColors = "bg-gray-100 text-gray-600 border border-gray-200"
            if (val.source === "user") {
              badgeText = "Personalizzato"
              badgeColors = "bg-blue-100 text-blue-800 border-blue-300 font-medium"
            } else if (val.source === "default") {
              badgeText = "Ereditato (Default)"
              badgeColors = "bg-slate-100 text-slate-700 border-slate-300"
            }

            const headerJSX = (
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <label className="font-medium text-sm text-slate-800">{setting}</label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${badgeColors}`}>
                    {badgeText}
                  </span>
                  {val.source === "user" && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleResetSetting(setting)}
                      title="Ripristina a default"
                      className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-full transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )

            if (val.type === "select" || val.type === "multiselect") {
              const lookupItems =
                val.options?.map((opt) =>
                  typeof opt === "string"
                    ? { name: opt, id: opt }
                    : { name: opt.name ?? opt.id ?? "", id: opt.id ?? opt.name ?? "" },
                ) ?? []

              return (
                <div key={setting} className="flex flex-col gap-1 pb-4 border-b border-gray-200 hover:bg-slate-50 p-2 rounded-md transition-colors">
                  {headerJSX}
                  <SelectStandard
                    lookupItems={lookupItems.map((item) => ({ itemcode: item.id ?? item.name, itemdesc: item.name }))}
                    initialValue={initialValue}
                    onChange={(value: string | string[]) => handleInputChange(setting, value)}
                    isMulti={val.type === "multiselect"}
                  />

                  {isBooleanField && (
                    <div className="mt-3 pl-3 border-l-2 border-slate-300 bg-white p-2 rounded shadow-sm">
                      <label className="font-medium text-xs text-slate-600 mb-1 flex items-center">
                        Condizioni <span className="text-[10px] ml-2 text-slate-400 font-normal">(opzionale)</span>
                      </label>
                      <ConditionsEditor
                        value={conditionsValues[setting] || null}
                        onChange={(conditions) => handleConditionsChange(setting, conditions)}
                      />
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div key={setting} className="flex flex-col gap-1 pb-4 border-b border-gray-200 hover:bg-slate-50 p-2 rounded-md transition-colors">
                {headerJSX}
                <input
                  type="text"
                  className="border border-gray-300 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={initialValue as string}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(setting, e.target.value)}
                />
              </div>
            )
          })}

          <div className="sticky bottom-0 bg-white p-4 border-t w-full">
            <Button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
            >
              <Save className="h-4 w-4 mr-2" /> Salva Impostazioni
            </Button>
          </div>
        </div>
      )}
    </GenericComponent>
  )
}

export default TableSettingsForm
