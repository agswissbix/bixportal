"use client"

import type React from "react"
import { useMemo, useContext, useState, useEffect, useRef, useCallback } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import { AppContext } from "@/context/appContext"
import InputWord from "./input/inputWord"
import InputNumber from "./input/inputNumber"
import InputDate from "./input/inputDate"
import InputMemo from "./input/inputMemo"
import InputCheckbox from "./inputCheckbox"
import SelectUser from "./selectUser"
import SelectStandard from "./selectStandard"
import InputLinked from "./input/inputLinked"
import InputEditor from "./input/inputEditor"
import InputFile from "./input/inputFile"
import { toast } from "sonner"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { useRecordsStore } from "./records/recordsStore"
import { Tooltip } from "react-tooltip"
import LoadingComp from "./loading"
import { ChevronDownIcon } from "@heroicons/react/24/solid"
import InputTime from "./input/inputTime"
import { Input } from "./ui/input"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic"
import InputSimpleMarkdown from "./input/inputSimpleMarkdown"

const InputMarkdown = dynamic(() => import("./input/inputMarkdown"), {
    ssr: false,
});

const isDev = false

interface PropsInterface {
  tableid: string
  recordid: string
  mastertableid?: string
  masterrecordid?: string
  prefillData?: Record<string, any>
  fields?: Array<FieldInterface> // Optional: if provided, use these fields instead of fetching
  onSave?: (updatedFields: { [key: string]: string | string[] | File }) => Promise<void> // Optional: custom save handler
  onFieldChange?: (fieldid: string, value: any) => void // New prop to notify parent of field changes
  showSaveButton?: boolean // Optional: control whether to show the save button (default: true)
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

interface ResponseInterface {
  fields: Array<FieldInterface>
  recordid: string
}

interface TableSetting {
  tablesettings: Record<string, { type: string; value: string; valid_records?: string[] }>;
}

interface CalculationResponseInterface {
  updated_fields: { [key: string]: any }
}

export default function CardFields({
  tableid,
  recordid,
  mastertableid,
  masterrecordid,
  prefillData = null,
  fields: externalFields, // Accept fields from parent
  onSave: externalOnSave, // Accept custom save handler
  onFieldChange: externalOnFieldChange, // Accept field change callback
  showSaveButton = true, // Control save button visibility
}: PropsInterface) {
  const [delayedLoading, setDelayedLoading] = useState(true)
  const dummyInputRef = useRef<HTMLInputElement>(null)

  const responseDataDEFAULT: ResponseInterface = { fields: [], recordid: "" }
  const { activeServer, role } = useContext(AppContext)

  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? (undefined as any) : responseDataDEFAULT)
  const [updatedFields, setUpdatedFields] = useState<{ [key: string]: string | string[] | File }>({})
  const [isSaveDisabled, setIsSaveDisabled] = useState(true)
  const [isEditable, setIsEditable] = useState(false)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({})

  const [isSaving, setIsSaving] = useState(false)

  const [isCalculating, setIsCalculating] = useState(false)

  const { removeCard, setRefreshTable, theme, tableSettings, getIsSettingAllowed } = useRecordsStore()

  const payload = useMemo(() => {
    if (isDev || externalFields) return null
    return { apiRoute: "get_record_card_fields", tableid, recordid, mastertableid, masterrecordid }
  }, [tableid, recordid, mastertableid, masterrecordid, externalFields])

	const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  // 2) Calcola l'editabilità quando cambia tableSettings o recordid
  useEffect(() => {
    const setting_name = mastertableid && masterrecordid ? getIsSettingAllowed(mastertableid, 'edit_linked', masterrecordid) : getIsSettingAllowed(tableid, 'edit', recordid)
    setIsEditable(setting_name);
  }, [tableSettings, recordid]);


  const currentFields = useMemo(() => {
    if (externalFields) {
      return externalFields
    }
    return responseData?.fields || []
  }, [externalFields, responseData])

  const currentValues = useMemo(() => {
    const obj: Record<string, any> = {}
    currentFields.forEach((f) => {
      const backendValue = typeof f.value === "object" ? ((f.value as any).code ?? (f.value as any).value) : f.value
      obj[f.fieldid] = updatedFields.hasOwnProperty(f.fieldid) ? updatedFields[f.fieldid] : (backendValue ?? "")
    })
    return obj
  }, [currentFields, updatedFields])

  const handleInputChange = useCallback(
    (fieldid: string, newValue: any | any[]) => {
      setUpdatedFields((prev) => {
        // Check if value actually changed
        const currentValue = prev[fieldid]
        if (currentValue === newValue) {
          return prev
        }

        return { ...prev, [fieldid]: newValue }
      })
      if (externalOnFieldChange) {
        queueMicrotask(() => {
          externalOnFieldChange?.(fieldid, newValue)
        })
      }
    },
    [externalOnFieldChange],
  )

  const handleFieldBlur = async (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return
    }

    if (isCalculating) {
      return
    }
    if (Object.keys(updatedFields).length === 0) {
      return
    }

    setIsCalculating(true)
    try {
      const payload = {
        apiRoute: "calculate_dependent_fields",
        tableid,
        recordid,
        fields: currentValues,
      }

      const response = await axiosInstanceClient.post("/postApi", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      const data: CalculationResponseInterface = response.data

      if (data && data.updated_fields) {
        setUpdatedFields((prev) => ({
          ...prev,
          ...data.updated_fields,
        }))
      }
    } catch (error) {
      console.error("Errore durante il calcolo dei campi dipendenti:", error)
      toast.error("Errore durante l'aggiornamento dei calcoli.")
    } finally {
      setIsCalculating(false)
    }
  }

  const groupedFields = useMemo(() => {
    return currentFields.reduce((acc: Record<string, FieldInterface[]>, field) => {
      const label = field.label || "Dati"
      if (!acc[label]) {
        acc[label] = []
      }
      acc[label].push(field)
      return acc
    }, {})
  }, [currentFields])

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      console.log("[API Response]", response)
      setResponseData(response)
      const initialFields: { [key: string]: string | string[] | File } = {}
      response.fields.forEach((field) => {
        const settings = typeof field.settings === "object" ? field.settings : null
        const defaultValue = settings?.default
        const backendValue =
          typeof field.value === "object" ? ((field.value as any).code ?? (field.value as any).value) : field.value

        if (defaultValue !== undefined && defaultValue !== null && defaultValue !== "") {
          initialFields[field.fieldid] = defaultValue
        } 
          if (backendValue !== undefined && backendValue !== null) {
          initialFields[field.fieldid] = backendValue
        }
        if (prefillData && prefillData[field.fieldid] !== undefined) {
          initialFields[field.fieldid] = prefillData[field.fieldid]
        }
      })
      setUpdatedFields(initialFields)
    }
  }, [response, isDev, responseData, prefillData])

  useEffect(() => {
    if (externalFields && externalFields.length > 0) {
      const initialFields: { [key: string]: string | string[] | File } = {}
      externalFields.forEach((field) => {
        const settings = typeof field.settings === "object" ? field.settings : null
        const defaultValue = settings?.default

        const backendValue =
          typeof field.value === "object" ? ((field.value as any).code ?? (field.value as any).value) : field.value

        if (defaultValue !== undefined && defaultValue !== null && defaultValue !== "") {
          initialFields[field.fieldid] = defaultValue
        } 
        if (backendValue !== undefined && backendValue !== null) {
          initialFields[field.fieldid] = backendValue
        }
        if (prefillData && prefillData[field.fieldid] !== undefined) {
            initialFields[field.fieldid] = prefillData[field.fieldid];
        }
      })
      setUpdatedFields(initialFields)
    }
  }, [externalFields, prefillData])

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setDelayedLoading(false), 100)
      return () => clearTimeout(timer)
    } else {
      setDelayedLoading(true)
    }
  }, [loading])

  const renderField = (field: FieldInterface) => {
    const isNewRecord = recordid === undefined || recordid === null || recordid === ""
    const isEditInsert = isNewRecord ? true : isEditable
    const rawValue = typeof field.value === "object" ? field.value?.value : field.value
    const isRequired = typeof field.settings === "object" && field.settings.obbligatorio === "true"
    const isMarkdown = field.fieldtype === "Markdown";
    const isSimpleMarkdown = field.fieldtype === "SimpleMarkdown";
    const isCalculated = (typeof field.settings === "object" && field.settings.calcolato === "true")
        || !isEditInsert

    // console.log("Rendering field:", field.fieldid, "with value:", rawValue, "isRequired:", isRequired, "isCalculated:", isCalculated)
    const value = currentValues[field.fieldid] ?? rawValue ?? ""

    const currentValue = currentValues[field.fieldid]
    const isEmpty = !currentValue || currentValue === "" || (Array.isArray(currentValue) && currentValue.length === 0)
    const isRequiredEmpty = isRequired && isEmpty
    const isRequiredFilled = isRequired && !isEmpty
    const hasDependencies = field.hasDependencies

    const user = field.lookupitemsuser?.find((u) => u.userid.toString() === value.toString())

    if (isCalculated) {
      return (
        <div key={`${field.fieldid}-container`} className="flex items-start space-x-4 w-full group">
            <div className="w-1/4 pt-2">
            <div className="flex items-center gap-1">
              {isRequired && (
              <div
                className={`w-1 h-4 rounded-full mr-1 ${
                isRequiredEmpty ? "bg-red-500" : isRequiredFilled ? "bg-green-500" : ""
                }`}
              />
              )}
              <p
              data-tooltip-id="my-tooltip"
              data-tooltip-content={`${role === "admin" ? field.fieldid : ""}${isRequired ? " (Campo obbligatorio)" : ""}`}
              data-tooltip-place="top"
              className={`text-sm font-medium ${isRequired ? "text-gray-900" : "text-gray-700"}`}
              >
              {field.description}
              </p>
            </div>
            </div>

            <div
            className={`w-3/4 relative transition-all duration-200 rounded-md ${
              theme !== 'alenonvede' ? 
              (isRequiredEmpty ? "ring-2 ring-red-500/20" : isRequiredFilled ? "ring-2 ring-green-500/20" : "") : ""
            }`}
            >
            <div className="p-2 bg-gray-100 rounded-md">
              {field.fieldtype === "Utente" ? (
                <>
                  {value && user && (
                    <div className="flex items-center gap-2">
                      <img
                        src={`/api/media-proxy?url=userProfilePic/${value}.png`}
                        alt={`${user?.firstname} ${user?.lastname}`}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          if (!target.src.includes("default.jpg")) {
                            target.src = "/api/media-proxy?url=userProfilePic/default.jpg"
                          }
                        }}
                      />
                      <label>
                        {`${user?.firstname} ${user?.lastname}`}
                      </label>
                    </div>
                  )}
                </>
              ) : field.fieldtype === "linkedmaster" && typeof field.value === "object" && field.value?.code ? (
              <InputLinked
                initialValue={value}
                valuecode={typeof field.value === "object" ? field.value : undefined}
                onChange={(v) => handleInputChange(field.fieldid, v)}
                tableid={tableid}
                linkedmaster_tableid={field.linked_mastertable}
                linkedmaster_recordid={typeof field.value === "object" ? field.value?.code : ""}
                fieldid={field.fieldid}
                formValues={currentValues}
                disabled={true}
              />
              ) : isMarkdown ? (
                <article className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(value)}</ReactMarkdown>
                </article>
              ) : isSimpleMarkdown ? (
                <article className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(value)}</ReactMarkdown>
                </article>
              ) : (
                <div className="min-h-[24px]" dangerouslySetInnerHTML={{ __html: value }} />
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
        <div
            key={`${field.fieldid}-container`}
            className="flex flex-col lg:flex-row items-start space-y-2 lg:space-y-0 lg:space-x-4 w-full group"
            onBlur={hasDependencies ? (e) => handleFieldBlur(e) : undefined}>
            <div className="w-full lg:w-1/4 pt-2">
                <div className="flex items-center gap-1">
                    {isRequired && (
                        <div
                            className={`w-1 h-4 rounded-full mr-1 ${
                                isRequiredEmpty
                                    ? "bg-red-500"
                                    : isRequiredFilled
                                    ? "bg-green-500"
                                    : ""
                            }`}
                        />
                    )}
                    <p
                        data-tooltip-id="my-tooltip"
                        data-tooltip-content={`${
                            role === "admin" ? field.fieldid : ""
                        }${isRequired ? " (Campo obbligatorio)" : ""}`}
                        data-tooltip-place="top"
                        className={`text-sm font-medium ${
                            isRequired ? "text-gray-900" : "text-gray-700"
                        }`}>
                        {field.description}
                    </p>
                </div>
            </div>

            <div
                className={`w-full lg:w-3/4 relative transition-all duration-200 rounded-md ${
                    theme !== "alenonvede"
                        ? isRequiredEmpty
                            ? "ring-2 ring-red-500/20"
                            : isRequiredFilled
                            ? "ring-2 ring-green-500/20"
                            : ""
                        : ""
                }`}>
                <div
                    className={`${
                        isRequiredEmpty
                            ? "[&>*]:!border-red-400 [&>*]:!border-radius-25 [&>*]:focus:!border-red-500 [&>*]:focus:!ring-red-500/20"
                            : isRequiredFilled
                            ? "[&>*]:!border-green-400 [&>*]:focus:!border-green-500 [&>*]:focus:!ring-green-500/20"
                            : ""
                    }`}>
                    {field.fieldtype === "Markdown" ? (
                        <InputMarkdown
                            initialValue={String(value)}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                            onSaveRequested={() => handleSave()}
                        />
                    ) : field.fieldtype === "SimpleMarkdown" ? (
                        <InputSimpleMarkdown
                            initialValue={String(value)}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                            onSaveRequested={() => handleSave()}
                        />
                    ) : field.fieldtype === "Parola" ? (
                        <InputWord
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                        />
                    ) : (field.fieldtype === "lookup" ||
                          field.fieldtype === "Categoria") &&
                      field.lookupitems ? (
                        <SelectStandard
                            lookupItems={field.lookupitems}
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                            isMulti={false}
                        />
                    ) : field.fieldtype === "multiselect" &&
                      field.lookupitems ? (
                        <SelectStandard
                            lookupItems={field.lookupitems}
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                            isMulti={true}
                        />
                    ) : field.fieldtype === "Numero" ? (
                        <InputNumber
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                        />
                    ) : field.fieldtype === "Data" ? (
                        <InputDate
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                        />
                    ) : field.fieldtype === "Ora" ? (
                        <InputTime
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                        />
                    ) : field.fieldtype === "Memo" ? (
                        <InputMemo
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                        />
                    ) : field.fieldtype === "Checkbox" ? (
                        <InputCheckbox
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                        />
                    ) : field.fieldtype === "Utente" &&
                      field.lookupitemsuser ? (
                        <SelectUser
                            lookupItems={field.lookupitemsuser}
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                            isMulti={false}
                        />
                    ) : field.fieldtype === "linkedmaster" ? (
                        <InputLinked
                            initialValue={value}
                            valuecode={
                                typeof field.value === "object"
                                    ? field.value
                                    : undefined
                            }
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                            tableid={tableid}
                            linkedmaster_tableid={field.linked_mastertable}
                            linkedmaster_recordid={
                                typeof field.value === "object"
                                    ? field.value?.code
                                    : ""
                            }
                            fieldid={field.fieldid}
                            formValues={currentValues}
                        />
                    ) : field.fieldtype === "html" ? (
                        <InputEditor
                            initialValue={value}
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                        />
                    ) : field.fieldtype === "Attachment" ? (
                        <InputFile
                            initialValue={
                                value ? `/api/media-proxy?url=${value}` : null
                            }
                            onChange={(v) =>
                                handleInputChange(field.fieldid, v)
                            }
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
  }

  useEffect(() => {
    const labels = Object.keys(groupedFields)
    const initialAccordionState: Record<string, boolean> = {}
    labels.forEach((label) => {
      if (label !== "Dati") {
        initialAccordionState[label] = false
      }
    })
    setOpenAccordions(initialAccordionState)
  }, [groupedFields])

  useEffect(() => {
    const requiredFields = currentFields.filter(
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
  }, [currentValues, currentFields, updatedFields])

  const toggleAccordion = (label: string) => {
    setOpenAccordions((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleSave = async () => {
    if (isSaveDisabled) {
      toast.warning("Compilare tutti i campi obbligatori per poter salvare.")
      return
    }

    setIsSaving(true)
    try {
      if (externalOnSave) {
        await externalOnSave(updatedFields)
        setUpdatedFields({})
        setIsSaving(false)
        return
      }

      const formData = new FormData()
      formData.append("tableid", tableid || "")
      formData.append("recordid", recordid || "")
      formData.append("mastertableid", mastertableid || "")
      formData.append("masterrecordid", masterrecordid || "")

      const standardFields: { [key: string]: any } = {}
      Object.entries(updatedFields).forEach(([fieldId, value]) => {
        if (value instanceof File) formData.append(`files[${fieldId}]`, value)
        else standardFields[fieldId] = value
      })

      formData.append("fields", JSON.stringify(standardFields))
      formData.append("apiRoute", "save_record_fields")

      await axiosInstanceClient.post("/postApi", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      toast.success("Record salvato con successo")
      setUpdatedFields({})
      setIsSaving(false)
    } catch (error) {
      console.error("Errore durante il salvataggio del record:", error)
      toast.error("Errore durante il salvataggio del record")
    } finally {
      setRefreshTable((v) => v + 1)
      removeCard(tableid, recordid)
    }
  }

  // Ensure the useApi hook is called at the top level
  if (isDev || externalFields) {
    return (
      <>
        <div className={"absolute inset-0 flex items-center justify-center " + (delayedLoading ? "" : " hidden")}>
          <LoadingComp />
        </div>
        {isCalculating && (
          <div className="absolute inset-0 bg-gray-500 bg-opacity-20 flex items-center justify-center z-20">
            <LoadingComp />
          </div>
        )}
        <div className={"h-full flex flex-col relative" + (delayedLoading ? " invisible" : "")}>
          <Tooltip id="my-tooltip" className="tooltip" />
          <div className="flex-grow overflow-y-auto max-h-[83%] space-y-3 pr-2">
            <input ref={dummyInputRef} tabIndex={-1} className="absolute opacity-0" />

            {groupedFields["Dati"] && (
              <div className="space-y-3">{groupedFields["Dati"].map((field) => renderField(field))}</div>
            )}

            {Object.keys(groupedFields)
              .filter((label) => label !== "Dati")
              .map((label) => (
                <div key={label} className="border rounded-md overflow-hidden">
                  {(label !== "Sistema" || role === "admin") && (
                    <>
                      <div
                        className="flex justify-between items-center p-3 bg-gray-100 cursor-pointer hover:bg-gray-200"
                        onClick={() => toggleAccordion(label)}
                      >
                        <h3 className="font-bold text-gray-700">{label}</h3>
                        <ChevronDownIcon
                          className={`w-5 h-5 text-gray-600 transition-transform transform ${openAccordions[label] ? "rotate-180" : ""}`}
                        />
                      </div>
                      {openAccordions[label] && (
                        <div className="p-4 space-y-3 bg-white">
                          {groupedFields[label].map((field) => renderField(field))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
          </div>

          {showSaveButton && (
            <div className="flex-shrink-0 pt-4">
              {activeServer === "belotti" ? (
                <></>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaveDisabled || isCalculating}
                  className={`w-full theme-accent focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 ${isSaveDisabled || isCalculating ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSaving ? "Salvataggio..." : "Salva"}
                </button>
              )}
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="CardFields">
      {(response: ResponseInterface) => (
        <>
          <div className={"absolute inset-0 flex items-center justify-center " + (delayedLoading ? "" : " hidden")}>
            <LoadingComp />
          </div>
          {isCalculating && (
            <div className="absolute inset-0 bg-gray-500 bg-opacity-20 flex items-center justify-center z-20">
              <LoadingComp />
            </div>
          )}
          <div className={"h-full flex flex-col relative" + (delayedLoading ? " invisible" : "")}>
            <Tooltip id="my-tooltip" className="tooltip" />
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
              <input ref={dummyInputRef} tabIndex={-1} className="absolute opacity-0" />

              {groupedFields["Dati"] && (
                <div className="space-y-3">{groupedFields["Dati"].map((field) => renderField(field))}</div>
              )}

              {Object.keys(groupedFields)
                .filter((label) => label !== "Dati")
                .map((label) => (
                  <div key={label} className="border rounded-md overflow-hidden">
                    {(label !== "Sistema" || role === "admin") && (
                      <>
                        <div
                          className="flex justify-between items-center p-3 bg-gray-100 cursor-pointer hover:bg-gray-200"
                          onClick={() => toggleAccordion(label)}
                        >
                          <h3 className="font-bold text-gray-700">{label}</h3>
                          <ChevronDownIcon
                            className={`w-5 h-5 text-gray-600 transition-transform transform ${openAccordions[label] ? "rotate-180" : ""}`}
                          />
                        </div>
                        {openAccordions[label] && (
                          <div className="p-4 space-y-3 bg-white">
                            {groupedFields[label].map((field) => renderField(field))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
            </div>

            {showSaveButton && (
              <div className="flex-shrink-0 pt-4">
                {activeServer === "belotti" ? (
                  <></>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaveDisabled || isCalculating || !isEditable}
                    className={`w-full theme-accent focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 ${isSaveDisabled || isCalculating || !isEditable ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSaving ? "Salvataggio..." : "Salva"}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </GenericComponent>
  )
}
