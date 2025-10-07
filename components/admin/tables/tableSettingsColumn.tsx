import React, { useEffect, useMemo, useState } from "react"
import {
  Layers, Settings, Eye, EyeOff,
  Type, Calendar, CheckSquare, List, AlignLeft, 
  Binary, 
  Clock,
  Hash,
  Search,
  User,
  FileText,
  Pencil,
  CalendarClock
} from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DraggableList } from "@/components/admin/tables/draggableList"
import { useApi } from "@/utils/useApi"
import TableSettingsForm from "./settingsTableInput"
import axiosInstanceClient from "@/utils/axiosInstanceClient"


import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

// --- MAPPING DEI TIPI DI CAMPO CON LE LORO ICONE E LABEL ---
const fieldTypeOptions = [
  { value: "Parola", label: "Parola", icon: Pencil },
  { value: "Seriale", label: "Seriale", icon: Binary },
  { value: "Data", label: "Data", icon: Calendar },
  { value: "Ora", label: "Ora", icon: Clock },
  { value: "Numero", label: "Numero", icon: Hash },
  { value: "lookup", label: "Lookup", icon: Search },
  { value: "Utente", label: "Utente", icon: User },
  { value: "Memo", label: "Memo", icon: FileText },
];


export const TableSettingsColumn: React.FC<{
  tableId: string
  userId: string
  selectedFieldId: string
  onSelectField: (fieldId: string) => void
}> = ({ tableId, userId, selectedFieldId, onSelectField }) => {
  const [fields, setFields] = useState<Field[]>(isDev ? FieldsResponseDev.fields : [])
  const [activeTab, setActiveTab] = useState("fields")
  const [isSaved, setIsSaved] = React.useState<boolean>(true)
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState({ fieldid: "", description: "", fieldtype: "string" })

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: 'settings_table_fields',
      tableid: tableId,
      userid: userId
    }
  }, [tableId, userId])

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null }

  useEffect(() => {
    if (!isDev && response) {
      setFields(response.fields)
    }
  }, [response])

  const handleFieldsReorder = async (reorderedFields: Field[]) => {
    if (isDev) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      toast.success("Ordine campi salvato")
      return
    }
    setIsSaved(false); // Ci sono modifiche da salvare
  }

  const handleSave = async () => {
    if (isDev) {
      toast.success("Modifiche salvate (solo dev)")
      setIsSaved(true)
      return
    }

    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "settings_table_tablefields_save",
          userid: userId,
          tableid: tableId,
          fields: fields,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      if (response.status === 200) {
        toast.success("Ordine delle tabelle salvato")
        setIsSaved(true)
      }
    } catch (error) {
      toast.error("Errore durante il salvataggio dell'ordine tabelle")
    }
  }

  const handleAddField = async () => {
    try {
      // Trova l'etichetta del tipo di campo selezionato per usarla come label iniziale
      const selectedType = fieldTypeOptions.find(opt => opt.value === newField.fieldtype);
      const fieldLabel = newField.description || selectedType?.label || "Nuovo Campo";

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
        setFields((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            fieldid: newField.fieldid,
            description: newField.description,
            fieldtypeid: newField.fieldtype,
            label: fieldLabel, // Usa la label determinata
            order: prev.length + 1,
            visible: true,
          },
        ])
        setNewField({ fieldid: "", description: "", fieldtype: "string" }) // Reset form
        setIsSaved(false); // Nuovi campi aggiunti, quindi ci sono modifiche da salvare
      } else {
        toast.error(response.data.error || "Errore nella creazione del campo")
      }
    } catch (err) {
      toast.error("Errore durante la creazione del campo")
    }
  }

  const fieldsAsGroups = useMemo(() => {
    return {
      fields: {
        name: "fields",
        items: fields.length
          ? fields.map((f) => ({
              id: f.id,
              description: f.description,
              order: f.order,
              visible: f.visible,
              fieldid: f.fieldid,
              fieldtypeid: f.fieldtypeid,
              label: f.label,
            }))
          : [],
      },
    }
  }, [fields])

  const handleFieldsChange = (groups: Record<string, any>) => {
    const updatedFields = groups.fields.items.map((item: any) => ({
      id: item.id,
      fieldid: item.fieldid,
      description: item.description,
      fieldtypeid: item.fieldtypeid,
      label: item.label,
      order: item.order,
      visible: item.visible,
    }))

    setFields(updatedFields)
    handleFieldsReorder(updatedFields)
  }

  // Trova l'icona e la label del tipo di campo selezionato per visualizzarle nel SelectTrigger
  const selectedFieldType = fieldTypeOptions.find(opt => opt.value === newField.fieldtype);


  return (
    <div className="p-6 flex flex-col h-full bg-gray-50 overflow-y-hidden">
      <div className="mb-6 pb-2 border-b border-gray-200">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <Settings className="h-5 w-5 text-blue-600" />
          Impostazioni Tabella: <span className="text-blue-600 font-extrabold">{tableId}</span>
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3 h-10 bg-gray-200 p-1 rounded-lg">
          <TabsTrigger
            value="table"
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 data-[state=active]:font-semibold transition-all duration-300 rounded-md"
          >
            Tabella
          </TabsTrigger>
          <TabsTrigger
            value="fields"
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 data-[state=active]:font-semibold transition-all duration-300 rounded-md"
          >
            Campi
          </TabsTrigger>
          <TabsTrigger
            value="other"
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 data-[state=active]:font-semibold transition-all duration-300 rounded-md"
          >
            Altri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4 h-11/12">
          <Card className="shadow-lg border-t-4 border-blue-500 rounded-xl overflow-y-auto h-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-700">Impostazioni Tabella</CardTitle>
              <CardDescription>Configura le opzioni principali della tabella.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <TableSettingsForm tableId={tableId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="mt-4 h-11/12">
          <Card className="shadow-lg border-t-4 border-blue-500 rounded-xl flex flex-col h-full">
            <CardHeader className="bg-white border-b sticky top-0 z-10 p-4 rounded-t-xl">
              <CardTitle>
                <div className="flex justify-between items-center w-full">
                  <span className="text-xl font-bold text-gray-800">Gestione Campi</span>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md transition-colors" onClick={() => {
                        setShowAddField(prev => !prev);
                        setNewField({ fieldid: "", description: "", fieldtype: "string" });
                    }}>
                      + Aggiungi Campo
                    </Button>
                    <Button
                        onClick={handleSave}
                        className={`font-semibold shadow-md transition-colors ${isSaved ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                        disabled={isSaved}
                    >
                      {isSaved ? "Salvato" : "Salva Modifiche"}
                    </Button>
                  </div>
                </div>

              </CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-1">Trascina per riordinare, usa l'icona per nascondere/mostrare e l'icona di ingranaggio per le impostazioni.</CardDescription>

              {showAddField && (
                <div className="mt-4 p-5 border-2 border-blue-200 rounded-lg bg-blue-50 space-y-4 shadow-inner transition-all duration-500">
                  <h4 className="font-bold text-blue-700 text-base border-b pb-2">Nuovo Campo Personalizzato</h4>
                  <input
                    type="text"
                    placeholder="ID campo (es. new_field_id)"
                    value={newField.fieldid}
                    onChange={(e) => setNewField({ ...newField, fieldid: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                    className="border border-blue-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                  <input
                    type="text"
                    placeholder="Descrizione (Visibile all'utente)"
                    value={newField.description}
                    onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                    className="border border-blue-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                  {/* --- COMPONENTE SELECT DI SHADCN UI CON ICONE --- */}
                  <Select value={newField.fieldtype} onValueChange={(value) => setNewField({ ...newField, fieldtype: value })}>
                    <SelectTrigger className="w-full border border-blue-300 rounded-lg px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow">
                      {/* {selectedFieldType && React.createElement(selectedFieldType.icon, { className: "mr-2 h-4 w-4 text-blue-600" })} 
                      {selectedFieldType?.label && <span className="mr-2">{selectedFieldType.label}</span>}                      <SelectValue placeholder="Seleziona un tipo di campo" /> */}
                      <SelectValue placeholder="Seleziona un tipo di campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Tipi di Campo</SelectLabel>
                        {fieldTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="w-full">
                            <div className="flex items-start flex-row hover:bg-gray-50">
                              {React.createElement(option.icon, { className: "mr-2 h-4 w-4 text-gray-600" })}
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {/* --- FINE COMPONENTE SELECT DI SHADCN UI --- */}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setShowAddField(false)} className="text-gray-600 border-gray-300 hover:bg-gray-100">Annulla</Button>
                    <Button
                      onClick={handleAddField}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
                    >
                      Salva Campo
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-grow p-0 overflow-y-auto bg-gray-50 rounded-b-xl">
              <div className="p-4 space-y-2">
                <DraggableList
                  groups={fieldsAsGroups}
                  onGroupsChange={(groups) => handleFieldsChange(groups)}
                  onItemSettings={(fieldId: string) => onSelectField(fieldId)}
                  showGroups={false}
                  isSaved={isSaved}
                  setIsSaved={setIsSaved}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          <Card className="shadow-lg border-t-4 border-blue-500 rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-700">Configurazioni Avanzate</CardTitle>
              <CardDescription>Gestisci le configurazioni per le diverse visualizzazioni dei dati.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-white border border-gray-200 hover:bg-blue-50 text-gray-700 font-medium transition-colors">
                  <Layers className="h-4 w-4 mr-3 text-blue-500" />
                  Risultati Ricerca
                </Button>
                <Button variant="outline" className="w-full justify-start bg-white border border-gray-200 hover:bg-blue-50 text-gray-700 font-medium transition-colors">
                  <Layers className="h-4 w-4 mr-3 text-blue-500" />
                  Inserimento
                </Button>
                <Button variant="outline" className="w-full justify-start bg-white border border-gray-200 hover:bg-blue-50 text-gray-700 font-medium transition-colors">
                  <Layers className="h-4 w-4 mr-3 text-blue-500" />
                  Visualizzazione Dettaglio
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}