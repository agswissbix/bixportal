"use client"

import GenericComponent from "@/components/genericComponent"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Save } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { useApi } from "@/utils/useApi"
import { toast } from "sonner"
import DraggableList from "@/components/admin/tables/draggableList"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { X, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const isDev = false

interface StepItem {
  id: string
  description: string
  order: number | null
  visible?: boolean
  fieldid?: string
  fieldtypeid?: string
  label?: string
}

interface Step {
  id: number
  name: string
  type: string
  order?: number | null
  items?: StepItem[]
  groupHidden?: boolean
  groupCollapsed?: boolean
}

interface ResponseInterface {
  success: boolean
  steps: Step[]
}

interface Propssteps {
  tableId: string
  userId: string
}

const StepsDev: ResponseInterface = {
  success: true,
  steps: [
    {
      id: 1,
      name: "Utenti",
      type: "campi",
      order: 0,
      items: [
        { id: "1", description: "Nome", order: 0, fieldid: "name", label: "Nome" },
        { id: "2", description: "Email", order: 1, fieldid: "email", label: "Email" },
        { id: "3", description: "Telefono", order: 2, fieldid: "phone", label: "Telefono" },
      ],
    },
    {
      id: 2,
      name: "Ordini",
      type: "campi",
      order: 1,
      items: [
        { id: "4", description: "Numero Ordine", order: 0, fieldid: "order_num", label: "Numero Ordine" },
        { id: "5", description: "Data", order: 1, fieldid: "date", label: "Data" },
      ],
    },
    {
      id: 3,
      name: "Fatture",
      type: "campi",
      order: 2,
      items: [
        { id: "6", description: "Numero Fattura", order: 0, fieldid: "invoice_num", label: "Numero Fattura" },
        { id: "7", description: "Importo", order: 1, fieldid: "amount", label: "Importo" },
      ],
    },
  ],
}

export default function StepsList({ tableId, userId }: Propssteps) {
  const [steps, setSteps] = useState<Step[]>(isDev ? StepsDev.steps : [])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSaved, setIsSaved] = useState(true)
  const [showAddStep, setShowAddStep] = useState(false)
  const [newStep, setNewStep] = useState({
    name: "",
    type: "campi",
  })

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "settings_table_steps",
      tableid: tableId,
      userid: userId,
    }
  }, [userId, tableId])

  const { response, loading, error } = useApi<ResponseInterface>(payload)

  useEffect(() => {
    if (!isDev && response) {
      console.log(response.steps)
      setSteps(response.steps)
    }
  }, [response])

  const filteredSteps = useMemo(() => {
		if (!searchTerm.trim()) return steps

		const lower = searchTerm.toLowerCase()

		return steps
			.map((step) => {
				const filteredItems = Array.isArray(step.items)
					? step.items.filter(
							(item) =>
								item.description?.toLowerCase().includes(lower)
						)
					: []

				const matchesStep =
					step.name?.toLowerCase().includes(lower) ||
					step.type?.toLowerCase().includes(lower)

				// se il nome o tipo dello step corrisponde, lo teniamo tutto
				// altrimenti lo teniamo solo se ha items filtrati
				if (matchesStep || filteredItems.length > 0) {
					return { ...step, items: filteredItems }
				}
				return null
			})
			.filter((s) => s !== null)
	}, [steps, searchTerm])


  const stepsAsGroups = useMemo(() => {
    const groups: Record<string, any> = {}

    filteredSteps.forEach((step) => {
      groups[step.name] = {
        name: step.name,
        items: (step.items || []).map((item) => ({
          id: item.id,
          description: item.description,
          order: item.order ?? null,
          fieldid: item.fieldid,
          fieldtypeid: item.fieldtypeid,
          label: item.label,
        })),
        groupOrder: step.order ?? null,
        groupHidden: step.order === null ? true : (step.groupHidden ?? false),
        groupCollapsed: step.groupCollapsed ?? false,
      }
    })

    return groups
  }, [filteredSteps])

  const handleStepsChange = (groups: Record<string, any>) => {
    const groupsMap = new Map(Object.entries(groups))

    const updated = steps.map((step) => {
      const key = step.name
      const group = groupsMap.get(key)

      if (group) {
        return {
          id: step.id,
          name: group.name,
          type: step.type,
          order: group.groupOrder,
          items: group.items.map((item: any) => ({
            id: item.id,
            description: item.description,
            order: item.order,
            visible: item.visible,
            fieldid: item.fieldid,
            fieldtypeid: item.fieldtypeid,
            label: item.label,
          })),
          groupHidden: group.groupHidden,
          groupCollapsed: group.groupCollapsed,
        }
      }

      return step
    })
		updated.sort((a, b) => {
      const orderA = a.order ?? 999
      const orderB = b.order ?? 999
      return orderA - orderB
    })

    setSteps(updated)
    setIsSaved(false)
  }

  const handleSave = async () => {
    try {
      const response = await axiosInstanceClient.post("/postApi", {
        apiRoute: "settings_table_steps_save",
        tableid: tableId,
        userid: userId,
        steps: steps.map((step) => ({
          id: step.id,
          name: step.name,
          type: step.type,
          order: step.order,
          groupHidden: step.groupHidden,
          groupCollapsed: step.groupCollapsed,
          items: step.items,
        })),
      })

      if (response.data.success) {
        toast.success("Ordine step salvato!")
        setIsSaved(true)
      } else {
        toast.error(response.data.error || "Errore durante il salvataggio")
      }
    } catch {
      toast.error("Errore durante il salvataggio")
    }
  }

  const handleAddStep = async () => {
    if (!newStep.name.trim()) {
      toast.error("Il nome dello step è obbligatorio!")
      return
    }

    try {
      const response = await axiosInstanceClient.post("/postApi", {
        apiRoute: "settings_table_newstep",
        tableid: tableId,
        userid: userId,
        step_name: newStep.name,
        step_type: newStep.type,
      })

      if (response.data.success) {
        toast.success("Step aggiunto con successo!")
        setShowAddStep(false)
        setSteps((prev) => [
          ...prev,
          {
            id: response.data.step.id,
            name: response.data.step.name,
            type: response.data.step.type,
            order: response.data.step.order,
            items: [],
          },
        ])
        setNewStep({ name: "", type: "campi" })
      } else {
        toast.error(response.data.error || "Errore durante la creazione dello step")
      }
    } catch {
      toast.error("Errore durante la creazione dello step")
    }
  }

  return (
    <GenericComponent response={steps} loading={loading} error={error}>
      {(response: Step[]) => (
        <Card className="overflow-y-auto h-full shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <CardTitle>
              <div className="flex justify-between items-center">
                <span className="text-slate-800 text-lg font-semibold">Steps</span>
                <Button
                  variant="outline"
                  onClick={() => setShowAddStep(true)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" /> Aggiungi Step
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaved}>
                  <Save className="h-4 w-4 mr-2" /> Salva
                </Button>
              </div>
            </CardTitle>

            {showAddStep && (
              <>
                <div className="mt-4 p-5 border-2 border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-white shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-base text-slate-800">Nuovo Step</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddStep(false)}
                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="step-name" className="text-sm font-medium text-slate-700">
                        Nome Step
                      </Label>
                      <Input
                        id="step-name"
                        type="text"
                        placeholder="es. Dati principali"
                        value={newStep.name}
                        onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="step-type" className="text-sm font-medium text-slate-700">
                        Tipo Step
                      </Label>
                      <Select value={newStep.type} onValueChange={(value) => setNewStep({ ...newStep, type: value })}>
                        <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                          <span>{newStep.type}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="campi">Campi</SelectItem>
                          <SelectItem value="collegate">Tabelle collegate</SelectItem>
                          <SelectItem value="allegati">Allegati</SelectItem>
                          <SelectItem value="aggiuntivi">Campi aggiuntivi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddStep(false)}
                      className="border-slate-300 hover:bg-slate-100"
                    >
                      Annulla
                    </Button>
                    <Button onClick={handleAddStep} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                      <Save className="h-4 w-4 mr-2" /> Salva Step
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca step o campo..."
                className="pl-9 w-full max-w-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <DraggableList
              groups={stepsAsGroups}
              onGroupsChange={handleStepsChange}
              onItemSettings={(id: string) => {
                console.log("[v0] Item settings clicked for:", id)
              }}
              showGroups={true}
              isSaved={isSaved}
              setIsSaved={setIsSaved}
            />
          </CardContent>
        </Card>
      )}
    </GenericComponent>
  )
}
