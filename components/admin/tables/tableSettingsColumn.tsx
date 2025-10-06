import React, { useEffect, useMemo, useState } from "react"
import { Layers } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DraggableList } from "@/components/admin/tables/draggableList"
import { useApi } from "@/utils/useApi"


const isDev = false

interface Field {
  id: string
  fieldid: string
  description: string
  fieldtypeid: string
  label: string
  order?: number
  visible?: boolean
}

interface ResponseInterface {
  fields: Field[]
  tables: string[]
}

const FieldsResponseDev: ResponseInterface = {
  fields: [
    { id: "f1", fieldid: "campaign_name", description: "Nome Campagna", fieldtypeid: "string", label: "Nome", order: 1, visible: true },
    { id: "f2", fieldid: "start_date", description: "Data Inizio", fieldtypeid: "date", label: "Inizio", order: 2, visible: true },
  ],
  tables: ["tbl_campaigns", "tbl_leads"],
}

export const TableSettingsColumn: React.FC<{
  tableId: string
  userId: string
  selectedFieldId: string
  onSelectField: (fieldId: string) => void
}> = ({ tableId, userId, selectedFieldId, onSelectField }) => {
  const [fields, setFields] = useState<Field[]>(isDev ? FieldsResponseDev.fields : [])
  const [activeTab, setActiveTab] = useState("fields")

  const payload = useMemo(() => {
    if (isDev) return null;
    return { 
      apiRoute: 'settings_table_fields',
      tableid: tableId,
      userid: userId
    };
  }, [tableId, userId]);

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };
  
  useEffect(() => {
      if (!isDev && response) {
        setFields(response.fields);
      }
  }, [response]);


  const handleFieldsReorder = async (reorderedFields: Field[]) => {
    // API Call logic (omitted for brevity)
    if (isDev) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      toast.success("Ordine campi salvato")
      return
    }
  }

  // Not strictly needed in the final version but was in the original intent
  // const handleFieldVisibilityToggle = async (fieldId: string) => {
  //   const updatedFields = fields.map((f) => (f.id === fieldId ? { ...f, visible: !f.visible } : f))
  //   setFields(updatedFields)

  //   if (isDev) return
  //   // API Call logic (omitted for brevity)
  // }

  const fieldsAsGroups = useMemo(() => {
    return {
      fields: {
        name: "Campi",
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

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Tabella: <span className="text-blue-600">{tableId}</span>
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="table">Tabella</TabsTrigger>
          <TabsTrigger value="fields">Campi</TabsTrigger>
          <TabsTrigger value="other">Altri</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Tabella</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Impostazioni generali della tabella</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Campi</CardTitle>
              <CardDescription>Trascina per riordinare, clicca Impostazioni per modificare</CardDescription>
            </CardHeader>
            <CardContent>
              <DraggableList
                groups={fieldsAsGroups}
                onGroupsChange={handleFieldsChange}
                onItemSettings={(fieldId: string) => onSelectField(fieldId)}
                showGroups={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Altri Tipi di Campo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Layers className="h-4 w-4 mr-2" />
                  Risultati Ricerca
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Layers className="h-4 w-4 mr-2" />
                  Inserimento
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Layers className="h-4 w-4 mr-2" />
                  Visualizzazione
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}