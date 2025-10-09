"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Layers, Plus, Save, X, Type, Calendar, CheckSquare, List, Binary,
  Clock, Hash, Search, User, FileText, Pencil, Table, Grid, BadgeCheck, ClipboardList, LayoutGrid,
  Eye, Link, Filter, PlusSquare
} from "lucide-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import TableSettingsForm from "./settingsTableInput"
import LinkedTables from "./linkedTables"
import {FieldsList} from "./fieldsList"

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
    {
      id: "f1",
      fieldid: "campaign_name",
      description: "Nome Campagna",
      fieldtypeid: "string",
      label: "Nome",
      order: 1,
      visible: true,
    },
    {
      id: "f2",
      fieldid: "start_date",
      description: "Data Inizio",
      fieldtypeid: "date",
      label: "Inizio",
      order: 2,
      visible: true,
    },
    {
      id: "f3",
      fieldid: "end_date",
      description: "Data Fine",
      fieldtypeid: "date",
      label: "Fine",
      order: null,
      visible: false,
    },
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
];

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

export const TableSettingsColumn: React.FC<{
  tableId: string
  userId: string
  selectedFieldId: string
  onSelectField: (fieldId: string) => void
}> = ({ tableId, userId, selectedFieldId, onSelectField }) => {
  const [fields, setFields] = useState<Field[]>(isDev ? FieldsResponseDev.fields : [])
  const [activeTab, setActiveTab] = useState("fields")

  return (
    <div className="p-6 flex flex-col h-full overflow-y-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
          Tabella: <span className="text-blue-600 font-semibold">{tableId}</span>
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border border-slate-200 p-1 rounded-lg mb-4">
          <TabsTrigger
            value="table"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
          >
            Tabella
          </TabsTrigger>
          <TabsTrigger
            value="fields"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
          >
            Campi
          </TabsTrigger>
          <TabsTrigger
            value="linkedtables"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
          >
            Tabelle collegate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4 h-10/12">
          <Card className="overflow-y-auto h-full shadow-lg border-slate-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
              <CardTitle className="text-slate-800">Impostazioni Tabella</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <TableSettingsForm tableId={tableId} userId={userId}/>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="mt-4 h-10/12">
            <FieldsList tableId={tableId} userId={userId} selectedFieldId={selectedFieldId} onSelectField={onSelectField}/>
        </TabsContent>

        <TabsContent value="linkedtables" className="mt-4 h-10/12">
          <LinkedTables tableId={tableId} userId={userId}/>
        </TabsContent>
      </Tabs>
    </div>
  )
}
