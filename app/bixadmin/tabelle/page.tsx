"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Table, Settings, AlertCircle, CheckCircle2 } from "lucide-react"
import {ColumnWrapper} from "@/components/admin/tables/columnWrapper"
import {UserSelectionColumn} from "@/components/admin/tables/userSelectionColumn"
import {TablesColumn} from "@/components/admin/tables/tablesColumn"
import {TableSettingsColumn} from "@/components/admin/tables/tableSettingsColumn"
import {FieldSettingsColumn} from "@/components/admin/tables/fieldsSettingsColumn"

const isDev = false

interface User {
  id: string
  username: string
  firstname: string
  lastname: string
  description?: string
  superuser?: string
  disabled?: string
}

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

interface Field {
  id: string
  fieldid: string
  description: string
  fieldtypeid: string
  label: string
  order?: number
  visible?: boolean
}

interface SettingsHierarchy {
  superuser: Record<string, any>
  groups: Record<string, Record<string, any>>
  user: Record<string, any>
}

// --- Dev Data ---


const UserTablesDev = {
  workspaces: {
    Marketing: {
      name: "Marketing",
      tables: [
        { id: "tbl_campaigns", description: "Campagne pubblicitarie e social", workspace: "Marketing", order: 1 },
        { id: "tbl_leads", description: "Gestione contatti e potenziali clienti", workspace: "Marketing", order: 2 },
      ] as TableType[],
    },
    Vendite: {
      name: "Vendite",
      tables: [
        { id: "tbl_orders", description: "Ordini e transazioni", workspace: "Vendite", order: 1 },
      ] as TableType[],
    },
  },
} as { workspaces: Record<string, Workspace> }
// --- End Dev Data ---

const TabellePage: React.FC = () => {
	const [users, setUsers] = useState<User[]>([])
	const [groups, setGroups] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>(isDev ? "2" : "")
  const [workspaces, setWorkspaces] = useState<Record<string, Workspace> | undefined>(
    isDev ? UserTablesDev.workspaces : undefined,
  )
  const [selectedTableId, setSelectedTableId] = useState<string>(isDev ? "tbl_campaigns" : "")
  const [selectedFieldId, setSelectedFieldId] = useState<string>(isDev ? "f1" : "")
  const [success, setSuccess] = useState<string | null>(
    isDev ? "Modalità di sviluppo (isDev=true) attiva. Dati mock caricati." : null,
  )

  // NEW STATE FOR COLLAPSIBILITY
  const [isCol1Open, setIsCol1Open] = useState(true) // Users (now collapsible)
  const [isCol2Open, setIsCol2Open] = useState(true) // Tables
  const [isCol3Open, setIsCol3Open] = useState(true) // Table Settings (Fields)
  const [isCol4Open, setIsCol4Open] = useState(true) // Field Settings

  const fetchTableFields = async (tableId: string) => {
    setSuccess(null)
    if (isDev) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSuccess(`Campi per la tabella ${tableId} (mock) caricati con successo.`)
      return
    }
    // API Call logic (omitted for brevity)
  }

  useEffect(() => {
    if (selectedUserId) {
      setSelectedTableId("")
      setSelectedFieldId("") // Reset field selection when user changes
    }
  }, [selectedUserId])

  useEffect(() => {
    if (selectedTableId) {
      fetchTableFields(selectedTableId)
      setSelectedFieldId("") // Reset field selection when table changes
    }
  }, [selectedTableId])

  // Variables to control visibility flow
  const isCol2Visible = !!selectedUserId;
  const isCol3Visible = !!selectedTableId;
  const isCol4Visible = !!selectedFieldId;

  return (
        <div className="h-[1100px] flex flex-col bg-gray-50">

          {/* Column Layout - Main container uses flex-nowrap to prevent wrapping */}
          <div className="flex-1 flex overflow-x-auto overflow-y-hidden border">

            {/* Column 1: User Selection - COLLAPSIBLE - 1/7 proportion */}
            <div
              className={`
                 border-r bg-white overflow-y-auto transition-all duration-300
                ${isCol1Open ? 'flex-[1] min-w-[200px]' : 'w-16'}
              `}
            >
              <ColumnWrapper
                title="Utenti"
                icon={<Table className="h-5 w-5 text-gray-600" />}
                isOpen={isCol1Open}
                onToggle={() => setIsCol1Open(!isCol1Open)}
              >
                <UserSelectionColumn
                  users={users}
                  groups={groups}
                  selectedUserId={selectedUserId}
                  onSelectUser={setSelectedUserId}
                  onUsersUpdate={setUsers}
                  onGroupsUpdate={setGroups}
                />
              </ColumnWrapper>
            </div>

            {/* Column 2: Tables List - COLLAPSIBLE - 2/7 proportion */}
            {isCol2Visible && (
              <div
                className={`
                   border-r bg-gray-50 transition-all duration-300 overflow-hidden
                  ${isCol2Open ? 'flex-[2] min-w-[280px]' : 'w-16'}
                `}
              >
                <ColumnWrapper
                  title="Tabelle"
                  icon={<Table className="h-5 w-5 text-gray-600" />}
                  isOpen={isCol2Open}
                  onToggle={() => {
                    setIsCol2Open(!isCol2Open)
                    // Ensure the next column is closed if this one closes and the next is visible
                    if (isCol3Visible && !isCol2Open) setIsCol3Open(true);
                  }}
                >
                  <TablesColumn
                    selectedUserId={selectedUserId}
                    selectedTableId={selectedTableId}
                    onSelectTable={setSelectedTableId}
                    onWorkspacesChange={setWorkspaces}
                  />
                </ColumnWrapper>
              </div>
            )}

            {/* Column 3: Table Settings with Tabs - COLLAPSIBLE - 2/7 proportion */}
            {isCol3Visible && (
              <div
                className={`
                   border-r bg-white transition-all duration-300 overflow-hidden
                  ${isCol3Open ? 'flex-[2] min-w-[280px]' : 'w-16'}
                `}
              >
                <ColumnWrapper
                  title="Impostazioni Tabella"
                  icon={<Settings className="h-5 w-5 text-gray-600" />}
                  isOpen={isCol3Open}
                  onToggle={() => {
                    setIsCol3Open(!isCol3Open)
                    // Ensure the next column is closed if this one closes and the next is visible
                    if (isCol4Visible && !isCol3Open) setIsCol4Open(true);
                  }}
                >
                  <TableSettingsColumn
                    tableId={selectedTableId}
                    userId={selectedUserId}
                    selectedFieldId={selectedFieldId}
                    onSelectField={setSelectedFieldId}
                  />
                </ColumnWrapper>
              </div>
            )}

            {/* Column 4: Field Settings - COLLAPSIBLE - 2/7 proportion */}
            {isCol4Visible && (
              <div
                className={`
                   border-l bg-gray-50 transition-all duration-300 overflow-hidden
                  ${isCol4Open ? 'flex-[2] min-w-[280px]' : 'w-16'}
                `}
              >
                <ColumnWrapper
                  title="Impostazioni Campo"
                  icon={<Settings className="h-5 w-5 text-gray-600" />}
                  isOpen={isCol4Open}
                  onToggle={() => setIsCol4Open(!isCol4Open)}
                >
                  <FieldSettingsColumn tableId={selectedTableId} fieldId={selectedFieldId} userId={selectedUserId} />
                </ColumnWrapper>
              </div>
            )}
          </div>
        </div>
  )
}

export default TabellePage