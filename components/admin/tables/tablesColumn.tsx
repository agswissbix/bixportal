"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Table, Search, Save, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DraggableList } from "@/components/admin/tables/draggableList"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"

const isDev = false

interface TableType {
  id: string
  description: string
  workspace: string
  order?: number
}

interface Workspace {
  name: string
  tables: TableType[]
  groupOrder?: number
  groupHidden?: boolean
  groupCollapsed?: boolean
}

interface WorkspacesResponse {
  [workspaceKey: string]: Workspace
}

const UserTablesDev: WorkspacesResponse = {
  CRM: {
    name: "CRM",
    tables: [
      { id: "deal", description: "Trattative", workspace: "CRM", order: 1 },
      { id: "cliente", description: "Anagrafica clienti", workspace: "CRM", order: 2 },
    ],
    groupOrder: 0,
    groupHidden: false,
    groupCollapsed: false,
  },
  FINANCE: {
    name: "FINANCE",
    tables: [{ id: "invoice", description: "Fattura", workspace: "FINANCE", order: 1 }],
    groupOrder: 1,
    groupHidden: false,
    groupCollapsed: false,
  },
}

export const TablesColumn: React.FC<{
  workspaces?: Record<string, Workspace>
  selectedUserId: string
  selectedTableId: string
  onSelectTable: (tableId: string) => void
}> = ({ selectedUserId, selectedTableId, onSelectTable }) => {
  const [workspaces, setWorkspaces] = useState<WorkspacesResponse>(isDev ? UserTablesDev : {})
  const [isSaved, setIsSaved] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [showAddTable, setShowAddTable] = useState(false)
  const [newTable, setNewTable] = useState({ id: "", description: "", workspace: "" })

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "settings_table_usertables",
      userid: selectedUserId,
    }
  }, [selectedUserId])

  const { response, loading, error } = useApi<Record<string, Workspace>>(payload)

  useEffect(() => {
    if (!isDev && response) {
      setWorkspaces(response)
      setNewTable({ ...newTable, workspace: Object.keys(response)[0] || "" })
    }
  }, [response])

  const handleCreateTable = async () => {
    if (!newTable.id.trim() || !newTable.description.trim() || !newTable.workspace) {
      toast.error("Compila tutti i campi")
      return
    }

    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "save_new_table",
          tableid: newTable.id,
          description: newTable.description,
          workspace: newTable.workspace,
          userid: selectedUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      if (response.status === 200) {
        toast.success("Tabella creata con successo")

        const updatedWorkspace = { ...workspaces[newTable.workspace] }
        updatedWorkspace.tables.push({
          id: newTable.id,
          description: newTable.description,
          workspace: newTable.workspace,
        })

        const updatedWorkspaces = {
          ...workspaces,
          [newTable.workspace]: updatedWorkspace,
        }
        setWorkspaces(updatedWorkspaces)

        setNewTable({ id: "", description: "", workspace: "" })
        setShowAddTable(false)
      }
    } catch (error) {
      toast.error("Errore durante la creazione della tabella")
    }
  }

  const handleSave = async () => {
    if (isDev) return
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "settings_table_usertables_save",
          workspaces: workspaces,
          userid: selectedUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )
      if (response.data.success) {
        toast.success("Ordine delle tabelle salvato")
        setIsSaved(true)
      } else {
        toast.error(
          "Errore durante il salvataggio dell'ordine tabelle: " +
            (response.data.error || response.data.errors.join(", ")),
        )
      }
    } catch (error) {
      toast.error("Errore durante il salvataggio dell'ordine tabelle")
    }
  }

  const handleGroupsChange = (groups: any) => {
    const updatedWorkspaces: Record<string, Workspace> = Object.fromEntries(
      Object.entries(groups).map(([key, group]: any) => [
        key,
        {
          name: group.name,
          tables: group.items.map((item: any) => ({
            id: item.id,
            description: item.description,
            order: item.order,
            workspace: item.workspace,
          })),
          groupOrder: group.groupOrder,
          groupHidden: group.groupHidden,
          groupCollapsed: group.groupCollapsed,
        },
      ]),
    )
    setWorkspaces(updatedWorkspaces)
  }

  // --- 🔍 Filtro frontend
  const filteredWorkspaces = useMemo(() => {
    if (!searchTerm.trim()) return workspaces

    const lower = searchTerm.toLowerCase()

    return Object.fromEntries(
      Object.entries(workspaces)
        .map(([key, ws]) => {
          const filteredTables = ws.tables?.filter(
            (t) => t.description.toLowerCase().includes(lower) || t.id.toLowerCase().includes(lower),
          )
          return [key, { ...ws, tables: filteredTables }]
        })
        .filter(([_, ws]) => typeof ws !== "string" && ws.tables.length > 0),
    )
  }, [searchTerm, workspaces])

  if (!workspaces || Object.keys(workspaces).length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Table className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>Caricamento tabelle...</p>
      </div>
    )
  }

  return (
    <GenericComponent response={workspaces} loading={loading} error={error}>
      {(response: Record<string, Workspace>) => (
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">Tabelle Utente</h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAddTable((prev) => !prev)}
                className="bg-green-600 hover:bg-green-700 text-white shadow-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" /> Crea tabella
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
              >
                <Save className="h-4 w-4 mr-2" /> Salva
              </Button>
            </div>
          </div>
          {showAddTable && (
            <div className="mt-4 p-5 border-2 border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-white shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-base text-slate-800">Nuova Tabella</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddTable(false)}
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {/* ID */}
                <div className="space-y-2">
                  <Label htmlFor="tableid" className="text-sm font-medium text-slate-700">
                    ID Tabella
                  </Label>
                  <Input
                    id="tableid"
                    type="text"
                    placeholder="es. invoice_items"
                    value={newTable.id}
                    onChange={(e) => setNewTable({ ...newTable, id: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* DESCRIZIONE */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                    Descrizione
                  </Label>
                  <Input
                    id="description"
                    type="text"
                    placeholder="Descrizione della tabella"
                    value={newTable.description}
                    onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* WORKSPACE */}
                <div className="space-y-2">
                  <Label htmlFor="workspace" className="text-sm font-medium text-slate-700">
                    Workspace
                  </Label>
                  <Select
                    value={newTable.workspace}
                    onValueChange={(value) => setNewTable({ ...newTable, workspace: value })}
                  >
                    <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                      {newTable.workspace ? (
                        <span className="truncate">{workspaces[newTable.workspace]?.name}</span>
                      ) : (
                        <span className="text-slate-400">Seleziona workspace...</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(workspaces).map(([key, ws]) => (
                        <SelectItem key={key} value={key}>
                          {ws.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* BOTTONI */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddTable(false)}
                  className="border-slate-300 hover:bg-slate-100"
                >
                  Annulla
                </Button>
                <Button onClick={handleCreateTable} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                  <Save className="h-4 w-4 mr-2" /> Crea Tabella
                </Button>
              </div>
            </div>
          )}

          {/* 🔍 Campo ricerca */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Cerca tabella..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <DraggableList
            groups={Object.fromEntries(
              Object.entries(filteredWorkspaces).map(([key, ws]) => [
                key,
                {
                  name: (ws as Workspace).name,
                  items: (ws as Workspace).tables?.map((t) => ({
                    id: t.id,
                    description: t.description,
                    order: t.order,
                    workspace: t.workspace,
                  })),
                  groupOrder: (ws as Workspace).groupOrder,
                  groupHidden: (ws as Workspace).groupHidden || (ws as Workspace).groupOrder === null,
                  groupCollapsed: (ws as Workspace).groupCollapsed === undefined ? true : (ws as Workspace).groupCollapsed,
                },
              ]),
            )}
            onGroupsChange={handleGroupsChange}
            onItemSettings={(tableId: string) => onSelectTable(tableId)}
            showGroups={true}
            isSaved={isSaved}
            setIsSaved={setIsSaved}
          />
        </div>
      )}
    </GenericComponent>
  )
}
