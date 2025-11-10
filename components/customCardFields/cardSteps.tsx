"use client"
import { useMemo, useContext, useState, useEffect, useRef, useCallback } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "../genericComponent"
import { AppContext } from "@/context/appContext"
import CardFields from "../cardFields"
import { toast } from "sonner"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { useRecordsStore } from "@/components/records/recordsStore"
import { Tooltip } from "react-tooltip"
import LoadingComp from "../loading"
import { ChevronRightIcon, ChevronLeftIcon, SquarePlus } from "lucide-react"
import RecordsTable from "@/components/recordsTable"
import { Badge } from "../ui/badge"
import CardsList from "@/components/mobile/cardList"
import RecordAttachments from "../recordAttachments"

const isDev = false

interface PropsInterface {
  tableid: string
  recordid: string
  mastertableid?: string
  masterrecordid?: string
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

interface LinkedTable {
  tableid: string
  description: string
  rowsCount: number
  tablelinkid?: number
  fieldorder?: number
}

interface Attachments {
  recordid: string;
  file: string;
  type?: string;
  note?: string;
  filename?: string;
}

interface Step {
  id: number
  name: string
  type: "campi" | "collegate" | "allegati"
  order: number
  fields?: Array<FieldInterface>
  linked_tables?: Array<LinkedTable>
  attachments?: Array<Attachments>
}

interface ResponseInterface {
  recordid: string
  steps?: Array<Step>
}

export default function cardSteps({
  tableid,
  recordid,
  mastertableid,
  masterrecordid,
  ...rest
}: PropsInterface) {
  const [delayedLoading, setDelayedLoading] = useState(true)
  const formRef = useRef<HTMLDivElement>(null)

  const responseDataDEFAULT: ResponseInterface = { recordid: "" }
  const { activeServer } = useContext(AppContext)

  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? (undefined as any) : responseDataDEFAULT)
  const [updatedFields, setUpdatedFields] = useState<{ [key: string]: string | string[] | File }>({})
  const [isSaveDisabled, setIsSaveDisabled] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [newRecordId, setNewRecordId] = useState<string | undefined>(undefined)

  const { removeCard, setRefreshTable, handleRowClick } = useRecordsStore()

  const payload = useMemo(() => {
    if (isDev) return null
    return { apiRoute: "get_fields_swissbix_deal", tableid, recordid, mastertableid, masterrecordid }
  }, [tableid, recordid, mastertableid, masterrecordid])

  const { response, loading, error } = useApi<ResponseInterface>(payload)

  const currentValues = useMemo(() => {
    const obj: Record<string, any> = {}
    responseData?.steps?.forEach((step) => {
      if (step.type === "campi" && step.fields) {
        step.fields.forEach((f) => {
          const backendValue = typeof f.value === "object" ? ((f.value as any).code ?? (f.value as any).value) : f.value
          obj[f.fieldid] = updatedFields.hasOwnProperty(f.fieldid) ? updatedFields[f.fieldid] : (backendValue ?? "")
        })
      }
    })
    return obj
  }, [responseData, updatedFields])

  const handleFieldChange = useCallback((fieldid: string, value: any) => {
    console.log("CardFields: notifying parent of field change:", fieldid, value)
    setUpdatedFields((prev) => ({ ...prev, [fieldid]: value }))
  }, [])

  const [currentStep, setCurrentStep] = useState(0)

  const stepsData = useMemo(() => {
    if (!responseData?.steps) return []

    return responseData.steps
      .filter((step) => step.order !== undefined && step.order !== null)
      .sort((a, b) => a.order - b.order)
      .map((step) => {
        if (step.type === "campi") {
          const stepFields = (step.fields || []).sort((a, b) => {
            const orderA = Number(a.fieldorder) || 0
            const orderB = Number(b.fieldorder) || 0
            return orderA - orderB
          })

          return {
            id: `step_${step.id}`,
            title: step.name,
            description: `Compila i campi e salva.`,
            fields: stepFields,
            type: "fields" as const,
          }
        } else if (step.type === "collegate") {
          const linkedTables = (step.linked_tables || []).sort((a, b) => (a.fieldorder ?? 0) - (b.fieldorder ?? 0))

          return {
            id: `step_${step.id}`,
            title: step.name,
            description: `Aggiungi e visualizza le righe collegate.`,
            fields: [],
            linkedTables,
            type: "linked" as const,
          }
        } else if (step.type === "allegati") {
          const attachments = (step.attachments || []).sort()

          return {
            id: `step_${step.id}`,
            title: step.name,
            description: `Aggiungi e visualizza gli allegati.`,
            fields: [],
            linkedTables: [],
            attachments,
            type: "attachments" as const,
          }
        }

        return null
      })
      .filter((step): step is NonNullable<typeof step> => step !== null)
  }, [responseData])

  const goToNextStep = () => {
    if (currentStep < stepsData.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      console.log("[API Response]", response)
      setResponseData(response)

      const initialFields: { [key: string]: string | string[] | File } = {}
      response.steps?.forEach((step) => {
        if (step.type === "campi" && step.fields) {
          step.fields.forEach((field) => {
            const settings = typeof field.settings === "object" ? field.settings : null
            const defaultValue = settings?.default

            const backendValue =
              typeof field.value === "object" ? ((field.value as any).code ?? (field.value as any).value) : field.value

            if (defaultValue !== undefined && defaultValue !== null && defaultValue !== "") {
              initialFields[field.fieldid] = defaultValue
            } else if (backendValue !== undefined && backendValue !== null) {
              initialFields[field.fieldid] = backendValue
            }
          })
        }
      })

      setUpdatedFields(initialFields)
    }
  }, [response, isDev, responseData])

  useEffect(() => {
    const allFields: FieldInterface[] = []
    responseData?.steps?.forEach((step) => {
      if (step.type === "campi" && step.fields) {
        allFields.push(...step.fields)
      }
    })

    const requiredFields = allFields.filter(
      (field) => typeof field.settings === "object" && field.settings.obbligatorio === "true",
    )

    if (requiredFields.length === 0) {
      setIsSaveDisabled(Object.keys(updatedFields).length === 0)
      return
    }

    const allRequiredFilled = requiredFields.every((field) => {
      const value = currentValues[field.fieldid]
      return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0)
    })

    setIsSaveDisabled(!allRequiredFilled || Object.keys(updatedFields).length === 0)
  }, [currentValues, responseData?.steps, updatedFields])

  const handleSaveFromCardFields = async (fieldsToSave: { [key: string]: string | string[] | File }) => {
    setUpdatedFields((prev) => ({ ...prev, ...fieldsToSave }))
  }

  const handleSave = async () => {
    if (isSaveDisabled) {
      toast.warning("Compilare tutti i campi obbligatori per poter salvare.")
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("tableid", tableid || "")
      formData.append("recordid", newRecordId || recordid || "")

      const standardFields: { [key: string]: any } = {}
      Object.entries(updatedFields).forEach(([fieldId, value]) => {
        if (value instanceof File) formData.append(`files[${fieldId}]`, value)
        else standardFields[fieldId] = value
      })

      formData.append("fields", JSON.stringify(standardFields))
      formData.append("apiRoute", "save_record_fields")

      const saveResponse = await axiosInstanceClient.post("/postApi", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.error || "Errore sconosciuto durante il salvataggio.")
      }

      setNewRecordId(saveResponse.data.recordid)

      toast.success(`Record ${saveResponse.data.recordid} salvato con successo`)
      setUpdatedFields({})
      setIsSaving(false)
    } catch (error) {
      console.error("Errore durante il salvataggio del record:", error)
      toast.error("Errore durante il salvataggio del record")
      setIsSaving(false)
    } finally {
      setRefreshTable((v) => v + 1)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement

        if (target.tagName === "TEXTAREA") {
          return
        }

        e.preventDefault()
        const focusableElements = formRef.current?.querySelectorAll(
          "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])",
        )

        if (focusableElements) {
          const currentIndex = Array.from(focusableElements).indexOf(target)
          const nextElement = focusableElements[currentIndex + 1] as HTMLElement
          if (nextElement) {
            nextElement.focus()
          }
        }
      }
    }

    const formElement = formRef.current
    if (formElement) {
      formElement.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      if (formElement) {
        formElement.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setDelayedLoading(false), 100)
      return () => clearTimeout(timer)
    } else {
      setDelayedLoading(true)
    }
  }, [loading])

  const renderLinkedTableButton = (table: LinkedTable) => {
    const thereIsNotRecordId = (recordid === undefined || recordid === null || recordid === "") &&
           (newRecordId === undefined || newRecordId === null || newRecordId === "")
    return (
      <>
      <button
        type="button"
        disabled={thereIsNotRecordId}
        title={thereIsNotRecordId ? "Salva il record per abilitare" : ""}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-accent text-gray-700 hover:text-accent font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]
          ${thereIsNotRecordId ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onClick={() => handleRowClick("linked", "", table.tableid, tableid, newRecordId || recordid)}
          >
        <SquarePlus className="h-5 w-5" />
        <span>Aggiungi {table.description}</span>
      </button>
      
      {!thereIsNotRecordId && (
        <>
          {/* Mobile: CardList */}
          <div className="block xl:hidden w-full">
              <CardsList 
              tableid={table.tableid}
              searchTerm={''}
              context="linked"
              masterTableid={tableid}
              masterRecordid={newRecordId ||recordid}
              />
          </div>
          {/* Desktop: RecordsTable */}
          <div className="hidden xl:block w-full">
              <RecordsTable
                  tableid={table.tableid}
                  searchTerm={''}
                  context="linked"
                  masterTableid={tableid}
                  masterRecordid={newRecordId || recordid}
                  limit={10}
              />
          </div>
        </>
      )}
      </>
    )
  }

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="CustomFormBuilder">
      {(response: ResponseInterface) => (
        <>
          <div className={"absolute inset-0 flex items-center justify-center " + (delayedLoading ? "" : " hidden")}>
            <LoadingComp />
          </div>

          <div ref={formRef} className={"h-full flex flex-col relative" + (delayedLoading ? " invisible" : "")}>
            <Tooltip id="my-tooltip" className="tooltip" />

            <div className="flex-shrink-0 mb-6">
              <div className="relative">
                <div
                  className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 hidden md:block"
                  style={{ zIndex: 0 }}
                />
                <div
                  className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-accent hidden md:block transition-all duration-500"
                  style={{
                    width: `${(currentStep / (stepsData.length - 1)) * 100}%`,
                    zIndex: 1,
                  }}
                />
                <div className="relative flex items-center justify-around gap-2 md:gap-4" style={{ zIndex: 2 }}>
                  {stepsData.map((step, index) => {
                    const isActive = index === currentStep
                    const isCompleted = index < currentStep

                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => goToStep(index)}
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
                          {isCompleted ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span>{index + 1}</span>
                          )}

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
            </div>

            <div className="flex-grow overflow-y-auto max-h-[83%] space-y-4 pr-2">
              <div className="mb-6 pb-3 border-b-2 border-gray-200">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stepsData[currentStep]?.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{stepsData[currentStep]?.description}</p>
              </div>

              {stepsData[currentStep]?.type === "fields" ? (
                <CardFields
                  tableid={tableid}
                  recordid={newRecordId || recordid}
                  mastertableid={mastertableid}
                  masterrecordid={masterrecordid}
                  fields={stepsData[currentStep]?.fields}
                  onSave={handleSaveFromCardFields}
                  onFieldChange={handleFieldChange}
                  showSaveButton={false}
                />
              ) : stepsData[currentStep]?.type === "attachments" ? (
                <RecordAttachments
                  recordid={newRecordId || recordid}
                  tableid={tableid}
                />
              ) : (
                <div className="space-y-6">
                  {stepsData[currentStep]?.linkedTables?.map((table) => {
                    return (
                      <div
                        key={table.tableid}
                        className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                          <div className="w-1 h-6 theme-primary rounded-full"></div>
                          {table.description} - <Badge>{table.rowsCount}</Badge>
                        </h3>
                        {renderLinkedTableButton(table)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 pt-4 flex items-center justify-between gap-4 border-t-2 border-gray-100 mt-4">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={currentStep === 0}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  currentStep === 0
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 hover:border-gray-400 hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Indietro</span>
              </button>

              <div className="flex items-center gap-3 flex-1 justify-end">
                {currentStep < stepsData.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSave()
                      goToNextStep()
                    }}
                    className="inline-flex items-center gap-2 rounded-lg theme-primary px-5 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <span>Salva e Avanti</span>
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                )}

                {activeServer !== "belotti" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSave()
                      removeCard(tableid, recordid)
                    }}
                    disabled={isSaveDisabled}
                    className={`theme-accent focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 ${
                      isSaveDisabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                    }`}
                  >
                    {isSaving ? "Salvataggio..." : "Salva"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </GenericComponent>
  )
}
