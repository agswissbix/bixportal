import React, { useEffect, useMemo } from "react"
import { Table } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DraggableList } from "@/components/admin/tables/draggableList"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"

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
  },
  FINANCE: {
    name: "FINANCE",
    tables: [
      { id: "invoice", description: "Fattura", workspace: "FINANCE", order: 1 },
    ],
  },
}


export const TablesColumn: React.FC<{
  workspaces?: Record<string, Workspace>
  selectedUserId: string
  selectedTableId: string
  onSelectTable: (tableId: string) => void
  onWorkspacesChange: (workspaces: Record<string, Workspace>) => void
}> = ({ selectedUserId, selectedTableId, onSelectTable, onWorkspacesChange }) => {
  const [workspaces, setWorkspaces] = React.useState<Record<string, Workspace>>(isDev ? UserTablesDev : {}) 

  const payload = useMemo(() => {
		if (isDev) return null;
		return { 
			apiRoute: 'settings_table_usertables',
			userid: selectedUserId
		};
	}, [selectedUserId]);
  
	const { response, loading, error } = !isDev && payload ? useApi<Record<string, Workspace>>(payload) : { response: null, loading: false, error: null };
	
	useEffect(() => {
			if (!isDev && response) {
				setWorkspaces(response); 
			}
	}, [response]);


  const handleSave = async () => {
    if (isDev) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      toast.success("Tabelle salvate con successo")
      return
    }
    // API Call logic (omitted for brevity)
  }

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Tabelle Utente
        </h2>
        <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
          Salva Ordine
        </Button>
      </div>

      <DraggableList
        groups={
          workspaces
            ? Object.fromEntries(
              Object.entries(workspaces).map(([key, ws]) => [
                key,
                {
                  name: ws.name,
                  items: ws.tables.map((t) => ({
                    id: t.id,
                    description: t.description,
                    order: t.order,
                    workspace: t.workspace,
                  })),
                },
              ])
            )
            : {}
        }
        onGroupsChange={(groups: any) => {
          // Convert DraggableGroup[] back to Workspace[] for state update
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
              },
            ])
          )
          onWorkspacesChange(updatedWorkspaces)
        }}
        onItemSettings={(tableId: string) => {
          onSelectTable(tableId)
        }}
        showGroups={true}
      />
    </div>
      )}
      </GenericComponent>
  )
}