"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import GenericComponent from "@/components/genericComponent"
import SelectStandard from "@/components/selectStandard"
import { useApi } from "@/utils/useApi"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { useRecordsStore } from "../records/recordsStore"

interface ChartConfig {
  nomeInterno: string
  titoloPubblico: string
  descrizione: string
  tipoGrafico: string
  tabella: string
  campi: string[]
  operazione: string
  raggruppamento: string[]
}

interface ChartConfigFormProps {
  tableid: string
  recordid?: string
  mastertableid?: string
  masterrecordid?: string
}

interface BackendResponse {
  fields: Array<FieldInterface>
  recordid: string
  lookup?: {
    table: Array<{ value: string; label: string }>
    campi: Record<string, Array<{ value: string; label: string }>>
    views: Record<string, Array<{ value: string; label: string }>>
    dashboards: Array<{ value: string; label: string }>
  }
}

interface FieldInterface {
  tableid: string
  fieldid: string
  fieldorder: string
  description: string
  value: string | { code: string; value: string }
  fieldtype: string
  label?: string
  lookupitems?: Array<{ itemcode: string; itemdesc: string }>
  lookupitemsuser?: Array<{
    userid: string
    firstname: string
    lastname: string
    link: string
    linkdefield: string
    linkedvalue: string
  }>
  fieldtypewebid?: string
  linked_mastertable?: string
  settings: string | { calcolato: string; default: string; nascosto: string; obbligatorio: string }
  isMulti?: boolean
  hasDependencies?: boolean
}

const STEPS = [
  { id: 1, title: "Informazioni Base", description: "Nome, titolo e descrizione del grafico" },
  { id: 2, title: "Configurazione Grafico", description: "Tipo di grafico e dashboard di destinazione" },
  { id: 3, title: "Sorgente Dati Principale", description: "Tabella, viste e campi del dataset principale" },
  {
    id: 4,
    title: "Dataset Secondario",
    description: "Campi e operazioni per grafici complessi (es. multibarlinechart)",
  },
  { id: 5, title: "Raggruppamento e Pivot", description: "Configurazione raggruppamento e tabelle pivot" },
]

export default function ChartConfigForm({ tableid, recordid, mastertableid, masterrecordid }: ChartConfigFormProps) {
  const isDev = false

  const [backendFields, setBackendFields] = useState<FieldInterface[]>([])
  const [lookupData, setLookupData] = useState<{
    table: Array<{ itemcode: string; itemdesc: string }>
    campi: Record<string, Array<{ itemcode: string; itemdesc: string }>>
    views: Record<string, Array<{ itemcode: string; itemdesc: string }>>
    dashboards: Array<{ itemcode: string; itemdesc: string }>
  } | null>(null)

  const [formData, setFormData] = useState<Record<string, any>>({})

  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  const { setRefreshTable, resetCardsList } = useRecordsStore()

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_record_card_fields",
      tableid,
      recordid,
      mastertableid,
      masterrecordid,
    }
  }, [recordid, tableid, mastertableid, masterrecordid])

  const { response, loading, error } = useApi<BackendResponse>(payload)

  const isNewRecord = !recordid || recordid === ""

  useEffect(() => {
    if (!isDev && response) {
      setBackendFields(response.fields)

      console.log("Backend fields:", response.fields)

      if (response.lookup) {
        setLookupData({
          table: response.lookup.table.map((item) => ({
            itemcode: item.value,
            itemdesc: item.label,
          })),
          campi: Object.keys(response.lookup.campi).reduce(
            (acc, key) => {
              acc[key] = response.lookup!.campi[key].map((item) => ({
                itemcode: item.value,
                itemdesc: item.label,
              }))
              return acc
            },
            {} as Record<string, Array<{ itemcode: string; itemdesc: string }>>,
          ),
          views: Object.keys(response.lookup.views).reduce(
            (acc, key) => {
              acc[key] = response.lookup!.views[key].map((item) => ({
                itemcode: item.value,
                itemdesc: item.label,
              }))
              return acc
            },
            {} as Record<string, Array<{ itemcode: string; itemdesc: string }>>,
          ),
          dashboards: response.lookup.dashboards.map((item) => ({
            itemcode: item.value,
            itemdesc: item.label,
          })),
        })
      }

      const initialFormData: Record<string, any> = {}
      response.fields.forEach((field) => {
        const value = typeof field.value === "object" ? field.value.code : field.value
        const settings = typeof field.settings === "object" ? field.settings : null
        const defaultValue = settings?.default

        // Apply default value if exists, otherwise use backend value
        if (defaultValue !== undefined && defaultValue !== null && defaultValue !== "") {
          initialFormData[field.fieldid] = defaultValue
        } else if (value !== undefined && value !== null) {
          initialFormData[field.fieldid] = value
        } else {
          initialFormData[field.fieldid] = field.fieldtype === "multiSelect" ? [] : ""
        }
      })

      console.log("Initial form data:", initialFormData)

      setFormData(initialFormData)
    }
  }, [response, isDev])

  useEffect(() => {
    const tabellaField = backendFields.find((f) => f.fieldid === "tabella")
    if (tabellaField && formData.tabella && isNewRecord) {
      const campiField = backendFields.find((f) => f.fieldid === "campi")
      const campi2Field = backendFields.find((f) => f.fieldid === "campi2")
      const pivotTotalField = backendFields.find((f) => f.fieldid === "pivot_total_field")
      const raggruppamentoField = backendFields.find((f) => f.fieldid === "raggruppamento")
      const viewsField = backendFields.find((f) => f.fieldid === "views")

      if (campiField) {
        setFormData((prev) => ({ ...prev, campi: [] }))
      }
      if (campi2Field) {
        setFormData((prev) => ({ ...prev, campi2: [] }))
      }
      if (pivotTotalField) {
        setFormData((prev) => ({ ...prev, pivot_total_field: [] }))
      }
      if (raggruppamentoField) {
        setFormData((prev) => ({ ...prev, raggruppamento: [] }))
      }
      if (viewsField) {
        setFormData((prev) => ({ ...prev, views: [] }))
      }
    }
  }, [formData.tabella, backendFields])

  const handleInputChange = (fieldid: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldid]: value }))
  }

  const getFieldDescription = (fieldid: string): string | null => {
    const descriptions: Record<string, string> = {
      tiporaggruppamento: "Definisce se il grafico sarà visualizzato come tabella pivot",
      pivot_total_field: "Campo utilizzato per i totali (considerato solo se il tipo raggruppamento è 'pivot')",
      campi2: "Secondo dataset necessario per grafici complessi come multibarlinechart",
      operation2: "Operazione da applicare al secondo dataset",
    }
    return descriptions[fieldid] || null
  }

  const renderField = (field: FieldInterface) => {
    const isRequired = typeof field.settings === "object" && field.settings.obbligatorio === "true"
    const isCalculated = typeof field.settings === "object" && field.settings.calcolato === "true"
    const isHidden = typeof field.settings === "object" && field.settings.nascosto === "true"

    if (isHidden) return null

    const currentValue = formData[field.fieldid]
    const isEmpty = !currentValue || currentValue === "" || (Array.isArray(currentValue) && currentValue.length === 0)
    const isRequiredEmpty = isNewRecord && isRequired && isEmpty
    const isRequiredFilled = isNewRecord && isRequired && !isEmpty

    const customDescription = getFieldDescription(field.fieldid)

    let lookupItems = field.lookupitems || []

    if (
      (field.fieldid === "campi" ||
        field.fieldid === "campi2" ||
        field.fieldid === "raggruppamento" ||
        field.fieldid === "pivot_total_field" ||
        field.fieldid === "views") &&
      formData.tabella &&
      lookupData
    ) {
      if (field.fieldid === "views") {
        lookupItems = lookupData.views[formData.tabella] || []
      } else {
        lookupItems = lookupData.campi[formData.tabella] || []
      }
    } else if (field.fieldid === "tabella" && lookupData) {
      lookupItems = lookupData.table || []
    } else if (field.fieldid === "dashboards" && lookupData) {
      lookupItems = lookupData.dashboards || []
    }

    if (isCalculated) {
      return (
        <div key={field.fieldid} className="flex flex-col space-y-2 w-full group">
          <div className="flex items-start space-x-4 w-full">
            <div className="w-1/4 pt-2">
              <div className="flex items-center gap-1">
                {isRequired && isNewRecord && (
                  <div
                    className={`w-1 h-4 rounded-full mr-1 transition-colors ${
                      isRequiredEmpty ? "bg-red-600" : isRequiredFilled ? "bg-green-500" : ""
                    }`}
                  />
                )}
                <div className="flex flex-col gap-0.5">
                  <p className={`text-sm font-medium ${isRequired ? "text-foreground" : "text-muted-foreground"}`}>
                    {field.description}
                    {isRequired && <span className="text-red-600 ml-1 text-base">*</span>}
                  </p>
                  {customDescription && (
                    <p className="text-xs text-muted-foreground/70 leading-tight">{customDescription}</p>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`w-3/4 relative transition-all duration-200 rounded-md ${
                isRequiredEmpty ? "ring-2 ring-red-600/20" : isRequiredFilled ? "ring-2 ring-green-500/20" : ""
              }`}
            >
              <div className="p-2 bg-muted rounded-md text-muted-foreground">{currentValue}</div>

              {isRequired && isNewRecord && (
                <div
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-sm transition-colors ${
                    isRequiredEmpty ? "bg-red-600" : isRequiredFilled ? "bg-green-500" : ""
                  }`}
                >
                  {isRequiredEmpty ? "!" : isRequiredFilled ? "✓" : "*"}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div key={field.fieldid} className="flex flex-col space-y-2 w-full group">
        <div className="flex flex-col lg:flex-row items-start space-y-2 lg:space-y-0 lg:space-x-4 w-full">
          <div className="w-full lg:w-1/4 pt-2">
            <div className="flex items-center gap-1">
              {isRequired && isNewRecord && (
                <div
                  className={`w-1 h-4 rounded-full mr-1 transition-colors ${
                    isRequiredEmpty ? "bg-red-600" : isRequiredFilled ? "bg-green-500" : ""
                  }`}
                />
              )}
              <div className="flex flex-col gap-0.5">
                <p className={`text-sm font-medium ${isRequired ? "text-foreground" : "text-muted-foreground"}`}>
                  {field.description}
                  {isRequired && <span className="text-red-600 ml-1 text-base">*</span>}
                </p>
                {customDescription && (
                  <p className="text-xs text-muted-foreground/70 leading-tight">{customDescription}</p>
                )}
              </div>
            </div>
          </div>

          <div
            className={`w-full lg:w-3/4 relative transition-all duration-200 rounded-md ${
              isRequiredEmpty ? "ring-2 ring-red-600/20" : isRequiredFilled ? "ring-2 ring-green-500/20" : ""
            }`}
          >
            <div
              className={`${
                isRequiredEmpty
                  ? "[&>*]:!border-red-600 [&>*]:focus:!border-red-600 [&>*]:focus:!ring-red-600/20"
                  : isRequiredFilled
                    ? "[&>*]:!border-green-500 [&>*]:focus:!border-green-500 [&>*]:focus:!ring-green-500/20"
                    : ""
              }`}
            >
              {field.fieldtype === "Parola" ? (
                <Input
                  value={currentValue || ""}
                  onChange={(e) => handleInputChange(field.fieldid, e.target.value)}
                  placeholder={`Inserisci ${field.description.toLowerCase()}`}
                  className="transition-colors"
                />
              ) : field.fieldtype === "Memo" ? (
                <Textarea
                  value={currentValue || ""}
                  onChange={(e) => handleInputChange(field.fieldid, e.target.value)}
                  placeholder={`Inserisci ${field.description.toLowerCase()}`}
                  className="transition-colors"
                />
              ) : (field.fieldtype === "lookup" || field.fieldtype === "Categoria") &&
                lookupItems &&
                lookupItems.length > 0 ? (
                <SelectStandard
                  lookupItems={lookupItems}
                  initialValue={currentValue || ""}
                  onChange={(v) => handleInputChange(field.fieldid, v)}
                  isMulti={false}
                />
              ) : (field.fieldtype === "multiselect" || field.fieldtype === "multiSelect") &&
                lookupItems &&
                lookupItems.length > 0 ? (
                <SelectStandard
                  lookupItems={lookupItems}
                  initialValue={currentValue || []}
                  onChange={(v) => handleInputChange(field.fieldid, v)}
                  isMulti={true}
                />
              ) : null}
            </div>

            {isRequired && isNewRecord && (
              <div
                className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-sm transition-colors ${
                  isRequiredEmpty ? "bg-red-600" : isRequiredFilled ? "bg-green-500" : ""
                }`}
              >
                {isRequiredEmpty ? "!" : isRequiredFilled ? "✓" : "*"}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const fieldsByStep = useMemo(() => {
    const step1Fields = backendFields.filter((f) => ["name", "title", "descrizione"].includes(f.fieldid))
    const step2Fields = backendFields.filter((f) => ["type", "dashboards"].includes(f.fieldid))
    const step3Fields = backendFields.filter((f) => ["tabella", "views", "campi", "operation"].includes(f.fieldid))
    const step4Fields = backendFields.filter((f) => ["campi2", "operation2"].includes(f.fieldid))
    const step5Fields = backendFields.filter((f) =>
      ["raggruppamento", "tiporaggruppamento", "pivot_total_field", "dynamicfield1"].includes(f.fieldid),
    )

    return {
      1: step1Fields,
      2: step2Fields,
      3: step3Fields,
      4: step4Fields,
      5: step5Fields,
    }
  }, [backendFields])

  const visibleSteps = useMemo(() => {
    const chartType = formData.type
    const isMultiBarLineChart =
      chartType === "multibarlinechart" ||
      (typeof chartType === "object" && chartType?.code === "multibarlinechart") ||
      (typeof chartType === "object" && chartType?.value === "multibarlinechart")

    // If chart type is not multibarlinechart, filter out step 4
    if (!isMultiBarLineChart) {
      return STEPS.filter((step) => step.id !== 4)
    }

    return STEPS
  }, [formData.type])

  const currentStepFields = useMemo(() => {
    const fields = fieldsByStep[currentStep as keyof typeof fieldsByStep] || []

    // Filter out pivot_total_field if tiporaggruppamento is not "pivot"
    return fields.filter((field) => {
      if (field.fieldid === "pivot_total_field") {
        const tipoRaggruppamento = formData.tiporaggruppamento.toString().toLowerCase()
        const isPivot =
          tipoRaggruppamento === "pivot" ||
          (typeof tipoRaggruppamento === "object" && tipoRaggruppamento?.code === "pivot") ||
          (typeof tipoRaggruppamento === "object" && tipoRaggruppamento?.value === "pivot")

        return isPivot
      }
      return true
    })
  }, [currentStep, fieldsByStep, formData.tiporaggruppamento])

  const isStepValid = useMemo(() => {
    return currentStepFields.every((field) => {
      const isRequired = typeof field.settings === "object" && field.settings.obbligatorio === "true"
      if (!isRequired) return true

      const value = formData[field.fieldid]
      return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0)
    })
  }, [currentStepFields, formData])

  const handleNext = () => {
    if (!isStepValid) {
      toast.error("Compila tutti i campi obbligatori prima di procedere")
      return
    }

    const currentVisibleStepIndex = visibleSteps.findIndex((s) => s.id === currentStep)
    if (currentVisibleStepIndex < visibleSteps.length - 1) {
      const nextStep = visibleSteps[currentVisibleStepIndex + 1]
      setCurrentStep(nextStep.id)
    }
  }

  const handlePrevious = () => {
    const currentVisibleStepIndex = visibleSteps.findIndex((s) => s.id === currentStep)
    if (currentVisibleStepIndex > 0) {
      const prevStep = visibleSteps[currentVisibleStepIndex - 1]
      setCurrentStep(prevStep.id)
    }
  }

  const handleSubmit = async () => {
    if (!isStepValid) {
      toast.error("Compila tutti i campi obbligatori")
      return
    }

    setIsSaving(true)
    try {
      const savePayload = {
        apiRoute: "save_record_fields",
        tableid,
        recordid,
        fields: formData,
      }
      const res = await axiosInstanceClient.post("/postApi", savePayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (!res.data.success) {
        throw new Error("Errore durante il salvataggio della configurazione")
      }

      toast.success("Configurazione grafico salvata con successo!")

      setFormData({})
      setCurrentStep(1)
    } catch (err) {
      console.error(err)
      toast.error("Errore durante il salvataggio della configurazione")
    } finally {
      setIsSaving(false)
      resetCardsList()
      setRefreshTable((prev) => prev + 1)
    }
  }

  const progressPercentage = useMemo(() => {
    const currentVisibleStepIndex = visibleSteps.findIndex((s) => s.id === currentStep)
    return ((currentVisibleStepIndex + 1) / visibleSteps.length) * 100
  }, [currentStep, visibleSteps])

  return (
    <GenericComponent response={response} loading={loading} error={error}>
      {() => (
        <div className="space-y-6 max-w-5xl mx-auto p-4">
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 hidden md:block" style={{ zIndex: 0 }} />
            <div
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-accent hidden md:block transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
                zIndex: 1,
              }}
            />

            <div className="relative flex items-center justify-around gap-2 md:gap-4" style={{ zIndex: 2 }}>
              {visibleSteps.map((step, index) => {
                const isActive = step.id === currentStep
                const currentVisibleStepIndex = visibleSteps.findIndex((s) => s.id === currentStep)
                const isCompleted = index < currentVisibleStepIndex

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex flex-col items-center gap-2 transition-all duration-300 group relative ${
                      isActive ? "scale-110" : "scale-100 hover:scale-105"
                    } flex-1 md:flex-initial`}
                  >
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 border-2 ${
                        isActive
                          ? "theme-primary text-white border-primary shadow-lg"
                          : isCompleted
                            ? "bg-green-500 text-white border-green-500 shadow-md"
                            : "bg-white text-gray-400 border-gray-300 group-hover:border-gray-400 group-hover:shadow-md"
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}

                      {isActive && (
                        <span
                          className="absolute inset-0 rounded-full theme-primary animate-ping opacity-75"
                          style={{ animationDuration: "2s" }}
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-0.5 min-w-0">
                      <span
                        className={`text-xs md:text-sm font-medium transition-colors duration-300 text-center ${
                          isActive
                            ? "text-primary"
                            : isCompleted
                              ? "text-gray-700"
                              : "text-gray-500 group-hover:text-gray-700"
                        } hidden sm:block truncate max-w-[120px]`}
                      >
                        {step.title}
                      </span>

                      <span
                        className={`text-xs font-medium transition-colors duration-300 text-center ${
                          isActive ? "text-primary" : isCompleted ? "text-gray-700" : "text-gray-500"
                        } sm:hidden`}
                      >
                        {step.title.split(" ")[0]}
                      </span>
                    </div>

                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap sm:hidden z-10">
                      {step.title}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <Card className="shadow-md border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="border-b-2 border-gray-200 pb-3">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {visibleSteps.find((s) => s.id === currentStep)?.title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                {visibleSteps.find((s) => s.id === currentStep)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">{currentStepFields.map((field) => renderField(field))}</CardContent>
          </Card>

          <div className="flex justify-between items-center gap-4 pt-4 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={visibleSteps.findIndex((s) => s.id === currentStep) === 0 || isSaving}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                visibleSteps.findIndex((s) => s.id === currentStep) === 0
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 hover:border-gray-400 hover:scale-105 active:scale-95 shadow-sm hover:shadow"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Indietro</span>
            </button>

            <div className="flex items-center gap-3 flex-1 justify-end">
              {visibleSteps.findIndex((s) => s.id === currentStep) < visibleSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid || isSaving}
                  className={`inline-flex items-center gap-2 rounded-lg theme-primary px-5 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 ${
                    !isStepValid || isSaving ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                  }`}
                >
                  <span>Avanti</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStepValid || isSaving}
                  className={`theme-accent focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ${
                    !isStepValid || isSaving ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 inline mr-2" />
                      Salva Configurazione
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </GenericComponent>
  )
}
