"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Plus, Save, X, Search, User, FileText, Pencil, Table, LayoutGrid, BadgeCheck, Link, Filter, Clock, Calendar, Binary, Hash, Eye, PlusSquare } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DraggableList } from "@/components/admin/tables/draggableList"
import { useApi } from "@/utils/useApi"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import GenericComponent from "@/components/genericComponent"

const isDev = false

interface Field {
  id: string
  fieldid: string
  description: string
  fieldtypeid: string
  label: string
  order?: number | null
  visible?: boolean
}

interface ResponseInterface {
  fields: Field[]
}

const FieldsResponseDev: ResponseInterface = {
  fields: [
    { id: "f1", fieldid: "campaign_name", description: "Nome Campagna", fieldtypeid: "string", label: "Nome", order: 1, visible: true },
    { id: "f2", fieldid: "start_date", description: "Data Inizio", fieldtypeid: "date", label: "Inizio", order: 2, visible: true },
    { id: "f3", fieldid: "end_date", description: "Data Fine", fieldtypeid: "date", label: "Fine", order: null, visible: false },
  ],
}

const fieldTypeOptions = [
  { value: "Parola", label: "Parola", icon: Pencil },
  { value: "Seriale", label: "Seriale", icon: Binary },
  { value: "Data", label: "Data", icon: Calendar },
  { value: "Ora", label: "Ora", icon: Clock },
  { value: "Numero", label: "Numero", icon: Hash },
  { value: "lookup", label: "Lookup", icon: Search },
  { value: "Utente", label: "Utente", icon: User },
  { value: "Memo", label: "Memo", icon: FileText },
]

const typePreferenceOptions = [
  { value: "view_fields", label: "Campi di Visualizzazione", icon: Eye },
  { value: "insert_fields", label: "Campi di Inserimento", icon: PlusSquare },
  { value: "search_results_fields", label: "Campi Risultati Ricerca", icon: Search },
  { value: "linked_columns", label: "Colonne Collegate", icon: Link },
  { value: "search_fields", label: "Campi di Ricerca", icon: Filter },
  { value: "badge_fields", label: "Campi Distintivi", icon: BadgeCheck },
  { value: "report_fields", label: "Campi tabella report", icon: Table },
  { value: "kanban_fields", label: "Campi di Kanban", icon: LayoutGrid },
]

interface FieldsListProps {
  tableId: string
  userId: string
  selectedFieldId: string
  onSelectField: (fieldId: string) => void
}

export const FieldsList: React.FC<FieldsListProps> = ({ tableId, userId, selectedFieldId, onSelectField }) => {
  const [fields, setFields] = useState<Field[]>(isDev ? FieldsResponseDev.fields : [])
  const [isSaved, setIsSaved] = useState<boolean>(true)
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState({ fieldid: "", description: "", fieldtype: "string" })
  const [typePreference, setTypePreference] = useState<string>("view_fields")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [masterTableId, setMasterTableId] = useState<string>("")
  const [linkedTables, setLinkedTables] = useState<{tableid_id: string}[]>([])

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "settings_table_fields",
      tableid: tableId,
      userid: userId,
      typepreference: typePreference,
      mastertableid: typePreference === "linked_columns" ? masterTableId : undefined,
    }
  }, [tableId, userId, typePreference, masterTableId])

	const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response) {
      setFields(response.fields)
    }
  }, [response])

  useEffect(() => {
    if (typePreference === "linked_columns") {
      axiosInstanceClient.post("/postApi", {
        apiRoute: "get_master_linked_tables", tableid: tableId
      })
      .then(res => {
        setLinkedTables(res.data.linked_tables || [])
        if (res.data.linked_tables?.length) setMasterTableId(res.data.linked_tables[0].tableid_id)
          console.log(res.data.linked_tables)
      })
      .catch((e) => console.error("Errore nel caricamento delle tabelle collegate", e))
    } else {
      setMasterTableId("") // reset quando cambio tipo
    }
  }, [typePreference])

  const handleFieldsReorder = async (reorderedFields: Field[]) => {
    if (isDev) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      toast.success("Ordine campi salvato")
      return
    }
  }

  const handleSave = async () => {
    if (isDev) return
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        { apiRoute: "settings_table_tablefields_save", userid: userId, tableid: tableId, fields, typepreference: typePreference },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      if (response.status === 200) {
        toast.success("Ordine delle tabelle salvato")
        setIsSaved(true)
      }
    } catch {
      toast.error("Errore durante il salvataggio dell'ordine tabelle")
    }
  }

  const handleAddField = async () => {
    try {
      const response = await axiosInstanceClient.post("/postApi", {
        apiRoute: "settings_table_fields_new_field",
        tableid: tableId,
        userid: userId,
        fieldid: newField.fieldid,
        fielddescription: newField.description,
        fieldtype: newField.fieldtype,
      })

      if (response.data.success) {
        toast.success("Campo aggiunto con successo")
        setShowAddField(false)
        setFields(prev => [...prev, {
          id: `temp-${Date.now()}`,
          fieldid: newField.fieldid,
          description: newField.description,
          fieldtypeid: newField.fieldtype,
          label: newField.description,
          order: prev.length + 1,
          visible: true,
        }])
      } else {
        toast.error(response.data.error || "Errore nella creazione del campo")
      }
    } catch {
      toast.error("Errore durante la creazione del campo")
    }
  }

  const filteredFields = useMemo(() => {
    if (!searchTerm.trim()) return fields
    const lower = searchTerm.toLowerCase()
    return fields.filter(
      f => f.description.toLowerCase().includes(lower) ||
           String(f.id).toLowerCase().includes(lower) ||
           (f.label && f.label.toLowerCase().includes(lower))
    )
  }, [fields, searchTerm])

  const fieldsAsGroups = useMemo(() => ({
    fields: {
      name: "fields",
      items: filteredFields.map(f => ({
        id: f.id,
        description: f.description,
        order: f.order,
        visible: f.visible,
        fieldid: f.fieldid,
        fieldtypeid: f.fieldtypeid,
        label: f.label,
      })),
    },
  }), [filteredFields])

  const handleFieldsChange = (groups: Record<string, any>) => {
    const updatedFilteredFields = groups.fields.items.map((item: any) => ({
      id: item.id,
      fieldid: item.fieldid,
      description: item.description,
      fieldtypeid: item.fieldtypeid,
      label: item.label,
      order: item.order,
      visible: item.visible,
    }))
    setFields(prevFields =>
      prevFields.map(f => {
        const updated = updatedFilteredFields.find(u => u.id === f.id)
        return updated ? updated : f
      })
    )
    handleFieldsReorder(updatedFilteredFields)
  }

  const selectedFieldType = fieldTypeOptions.find(opt => opt.value === newField.fieldtype);

  return (
    <GenericComponent response={fields} loading={loading} error={error}>
      {(response: Field[]) => (
        <Card className="overflow-y-auto h-full shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <CardTitle className="flex flex-wrap justify-between items-center w-full">
              <span className="text-slate-800">Gestione Campi</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddField(true)} className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors">
                  <Plus className="h-4 w-4 mr-2" /> Aggiungi Campo
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors">
                  <Save className="h-4 w-4 mr-2" /> Salva
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">
              Trascina per riordinare, clicca l'occhio per nascondere/mostrare
            </CardDescription>

            {showAddField && (
              <div className="mt-4 p-5 border-2 border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-white shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-base text-slate-800">Nuovo Campo</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddField(false)} className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="fieldid" className="text-sm font-medium text-slate-700">ID Campo</Label>
                    <Input id="fieldid" type="text" placeholder="es. campaign_name" value={newField.fieldid} onChange={e => setNewField({ ...newField, fieldid: e.target.value })} className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-slate-700">Descrizione</Label>
                    <Input id="description" type="text" placeholder="Descrizione del campo" value={newField.description} onChange={e => setNewField({ ...newField, description: e.target.value })} className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"/>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fieldtype" className="text-sm font-medium text-slate-700">Tipo Campo</Label>
                    <Select value={newField.fieldtype} onValueChange={value => setNewField({ ...newField, fieldtype: value })}>
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                        {selectedFieldType && (
                          <div className="flex items-center gap-2">
                            {React.createElement(selectedFieldType.icon, { className: "h-4 w-4 text-blue-600" })}
                            <span className="truncate">{selectedFieldType.label}</span>
                          </div>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              {React.createElement(option.icon, { className: "h-4 w-4 text-blue-600" })}
                              <span className="truncate">{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowAddField(false)} className="border-slate-300 hover:bg-slate-100">Annulla</Button>
                  <Button onClick={handleAddField} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    <Save className="h-4 w-4 mr-2" /> Salva Campo
                  </Button>
                </div>
              </div>
            )}

            <div className="w-full mt-4">
              <Label className="text-sm font-medium text-slate-700">Tipo Preferenza</Label>
              <Select value={typePreference} onValueChange={setTypePreference}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 mt-1">
                  {(() => {
                    const selected = typePreferenceOptions.find(opt => opt.value === typePreference)
                    return selected ? (
                      <div className="flex items-center gap-2">
                        {React.createElement(selected.icon, { className: "h-4 w-4 text-blue-600" })}
                        <span>{selected.label}</span>
                      </div>
                    ) : <SelectValue placeholder="Seleziona un tipo" />
                  })()}
                </SelectTrigger>
                <SelectContent>
                  {typePreferenceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {React.createElement(option.icon, { className: "h-4 w-4 text-blue-600" })}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {typePreference === "linked_columns" && (
              <div className="w-full mt-4">
                <Label className="text-sm font-medium text-slate-700">Tabella Master</Label>
                <Select value={masterTableId} onValueChange={setMasterTableId}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 mt-1">
                    {masterTableId 
                      ? linkedTables.find(t => t.tableid_id === masterTableId)?.tableid_id 
                      : "Seleziona tabella"}
                  </SelectTrigger>
                  <SelectContent>
                    {linkedTables.map(table => (
                      <SelectItem key={table.tableid_id} value={table.tableid_id}>{table.tableid_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="relative mb-2 mt-2 bg-white">
              <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
              <Input placeholder="Cerca campo per nome o ID..." className="pl-9 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <DraggableList
              groups={fieldsAsGroups}
              onGroupsChange={handleFieldsChange}
              onItemSettings={onSelectField}
              showGroups={false}
              isSaved={isSaved}
              setIsSaved={setIsSaved}
            />
          </CardContent>
        </Card>
      )}
    </GenericComponent>
  )
}
