"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import GenericComponent from "@/components/genericComponent"
import SelectStandard from "@/components/selectStandard"
import { useApi } from "@/utils/useApi"
import axiosInstanceClient from "@/utils/axiosInstanceClient"

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
  { id: 2, title: "Tipo e Sorgente", description: "Seleziona il tipo di grafico e la tabella dati" },
  { id: 3, title: "Campi e Operazioni", description: "Configura i campi da visualizzare e le operazioni" },
]

export default function ChartConfigForm({ tableid, recordid, mastertableid, masterrecordid }: ChartConfigFormProps) {
  const isDev = false

  const [backendFields, setBackendFields] = useState<FieldInterface[]>([])
  const [lookupData, setLookupData] = useState<{
    table: Array<{ itemcode: string; itemdesc: string }>
    campi: Record<string, Array<{ itemcode: string; itemdesc: string }>>
  } | null>(null)

  const [formData, setFormData] = useState<Record<string, any>>({})

  const [currentStep, setCurrentStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

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
          initialFormData[field.fieldid] = field.isMulti ? [] : ""
        }
      })

      setFormData(initialFormData)
    }
  }, [response, isDev])

  useEffect(() => {
    const tabellaField = backendFields.find((f) => f.fieldid === "tabella")
    if (tabellaField && formData.tabella) {
      // Reset campi and raggruppamento when table changes
      const campiField = backendFields.find((f) => f.fieldid === "campi")
      const raggruppamentoField = backendFields.find((f) => f.fieldid === "raggruppamento")

      if (campiField) {
        setFormData((prev) => ({ ...prev, campi: [] }))
      }
      if (raggruppamentoField) {
        setFormData((prev) => ({ ...prev, raggruppamento: [] }))
      }
    }
  }, [formData.tabella, backendFields])

  const handleInputChange = (fieldid: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldid]: value }))
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

    console.log({ isRequiredFilled, isRequiredEmpty, isEmpty })

    let lookupItems = field.lookupitems || []

    // Special handling for "campi" and "raggruppamento" fields
    if ((field.fieldid === "campi" || field.fieldid === "raggruppamento") && formData.tabella && lookupData) {
      lookupItems = lookupData.campi[formData.tabella] || []
    }

    // Special handling for "tabella" field
    if (field.fieldid === "tabella" && lookupData) {
      lookupItems = lookupData.table || []
    }

    if (isCalculated) {
      return (
        <div key={field.fieldid} className="flex items-start space-x-4 w-full group">
          <div className="w-1/4 pt-2">
            <div className="flex items-center gap-1">
              {isRequired && isNewRecord && (
                <div
                  className={`w-1 h-4 rounded-full mr-1 ${
                    isRequiredEmpty ? "bg-red-500" : isRequiredFilled ? "bg-green-500" : ""
                  }`}
                />
              )}
              <p className={`text-sm font-medium ${isRequired ? "text-gray-900" : "text-gray-700"}`}>
                {field.description}
                {isRequired && <span className="text-red-600 ml-1 text-base">*</span>}
              </p>
            </div>
          </div>

          <div
            className={`w-3/4 relative transition-all duration-200 rounded-md ${
              isRequiredEmpty ? "ring-2 ring-red-500/20" : isRequiredFilled ? "ring-2 ring-green-500/20" : ""
            }`}
          >
            <div className="p-2 bg-gray-100 rounded-md">{currentValue}</div>

            {isRequired && (
              <div
                className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                  isRequiredEmpty ? "bg-red-500" : isRequiredFilled ? "bg-green-500" : ""
                }`}
              >
                {isRequiredEmpty ? "!" : isRequiredFilled ? "✓" : "*"}
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div
        key={field.fieldid}
        className="flex flex-col lg:flex-row items-start space-y-2 lg:space-y-0 lg:space-x-4 w-full group"
      >
        <div className="w-full lg:w-1/4 pt-2">
          <div className="flex items-center gap-1">
            {isRequired && isNewRecord && (
              <div
                className={`w-1 h-4 rounded-full mr-1 ${
                  isRequiredEmpty ? "bg-red-500" : isRequiredFilled ? "bg-green-500" : ""
                }`}
              />
            )}
            <p className={`text-sm font-medium ${isRequired ? "text-gray-900" : "text-gray-700"}`}>
              {field.description}
              {isRequired && <span className="text-red-600 ml-1 text-base">*</span>}
            </p>
          </div>
        </div>

        <div
          className={`w-full lg:w-3/4 relative transition-all duration-200 rounded-md ${
            isRequiredEmpty ? "ring-2 ring-red-500/20" : isRequiredFilled ? "ring-2 ring-green-500/20" : ""
          }`}
        >
          <div
            className={`${
              isRequiredEmpty
                ? "[&>*]:!border-red-400 [&>*]:focus:!border-red-500 [&>*]:focus:!ring-red-500/20"
                : isRequiredFilled
                  ? "[&>*]:!border-green-400 [&>*]:focus:!border-green-500 [&>*]:focus:!ring-green-500/20"
                  : ""
            }`}
          >
            {field.fieldtype === "Parola" ? (
              <Input
                value={currentValue || ""}
                onChange={(e) => handleInputChange(field.fieldid, e.target.value)}
                placeholder={`Inserisci ${field.description.toLowerCase()}`}
              />
            ) : field.fieldtype === "Memo" ? (
              <Textarea
                value={currentValue || ""}
                onChange={(e) => handleInputChange(field.fieldid, e.target.value)}
                placeholder={`Inserisci ${field.description.toLowerCase()}`}
              />
            ) : (field.fieldtype === "lookup" || field.fieldtype === "Categoria") && lookupItems ? (
              <SelectStandard
                lookupItems={lookupItems}
                initialValue={currentValue || ""}
                onChange={(v) => handleInputChange(field.fieldid, v)}
                isMulti={false}
              />
            ) : field.fieldtype === "multiselect" && lookupItems ? (
              <SelectStandard
                lookupItems={lookupItems}
                initialValue={currentValue || []}
                onChange={(v) => handleInputChange(field.fieldid, v)}
                isMulti={true}
              />
            ) : null}
          </div>

          {isRequired && (
            <div
              className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                isRequiredEmpty ? "bg-red-500" : isRequiredFilled ? "bg-green-500" : ""
              }`}
            >
              {isRequiredEmpty ? "!" : isRequiredFilled ? "✓" : "*"}
            </div>
          )}
        </div>
      </div>
    )
  }

  const fieldsByStep = useMemo(() => {
    const step1Fields = backendFields.filter((f) =>
      ["name", "title", "descrizione"].includes(f.fieldid),
    )
    const step2Fields = backendFields.filter((f) => ["type", "tabella"].includes(f.fieldid))
    const step3Fields = backendFields.filter((f) => ["campi", "operation", "raggruppamento"].includes(f.fieldid))

    return {
      1: step1Fields,
      2: step2Fields,
      3: step3Fields,
    }
  }, [backendFields])

  const isStepValid = useMemo(() => {
    const currentFields = fieldsByStep[currentStep as keyof typeof fieldsByStep] || []

    return currentFields.every((field) => {
      const isRequired = typeof field.settings === "object" && field.settings.obbligatorio === "true"
      if (!isRequired) return true

      const value = formData[field.fieldid]
      return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0)
    })
  }, [currentStep, fieldsByStep, formData])

  const handleNext = () => {
    if (!isStepValid) {
      toast.error("Compila tutti i campi obbligatori prima di procedere")
      return
    }
    if (currentStep < STEPS.length) setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
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

      const res = await axiosInstanceClient.post(
        "/postApi",
        savePayload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

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
    }
  }

  const progressPercentage = (currentStep / STEPS.length) * 100

  return (
    <GenericComponent response={response} loading={loading} error={error}>
      {() => (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-foreground">
                Step {currentStep} di {STEPS.length}
              </p>
              <p className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</p>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Step Indicator */}
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep > step.id
                        ? "bg-primary border-primary text-primary-foreground"
                        : currentStep === step.id
                          ? "border-primary text-primary"
                          : "border-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <p
                    className={`text-xs mt-2 text-center hidden md:block ${
                      currentStep === step.id ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fieldsByStep[currentStep as keyof typeof fieldsByStep]?.map((field) => renderField(field))}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSaving}
              className="flex items-center gap-2 bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
              Indietro
            </Button>

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={!isStepValid || isSaving} className="flex items-center gap-2">
                Avanti
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!isStepValid || isSaving} className="flex items-center gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Salva Configurazione
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </GenericComponent>
  )
}
