"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LayoutDashboard, Users } from "lucide-react"
import { ColumnWrapper } from "@/components/admin/tables/columnWrapper"
import { UserSelectionColumn } from "@/components/admin/tables/userSelectionColumn"
import { DashboardColumn } from "@/components/admin/charts/dashboardColumn"

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

const GraficiPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>(isDev ? "2" : "")
  const [success, setSuccess] = useState<string | null>(
    isDev ? "Modalità di sviluppo (isDev=true) attiva. Dati mock caricati." : null,
  )

  // State for collapsibility
  const [isCol1Open, setIsCol1Open] = useState(true) // Users
  const [isCol2Open, setIsCol2Open] = useState(true) // Dashboards

  useEffect(() => {
    if (selectedUserId) {
      // Reset or fetch dashboard data when user changes
      setSuccess(`Utente ${selectedUserId} selezionato. Caricamento dashboard...`)
    }
  }, [selectedUserId])

  // Control visibility flow
  const isCol2Visible = !!selectedUserId

  return (
    <div className="h-[1100px] flex flex-col bg-gray-50">
      {/* Column Layout - Main container uses flex-nowrap to prevent wrapping */}
      <div className="flex-1 flex overflow-x-auto overflow-y-hidden border">
        {/* Column 1: User Selection - COLLAPSIBLE - 1/3 proportion */}
        <div
          className={`
            border-r bg-white overflow-y-auto transition-all duration-300
            ${isCol1Open ? "flex-[1] min-w-[250px]" : "w-16"}
          `}
        >
          <ColumnWrapper
            title="Utenti"
            icon={<Users className="h-5 w-5 text-gray-600" />}
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

        {/* Column 2: Dashboard Checklist - COLLAPSIBLE - 2/3 proportion */}
        {isCol2Visible && (
          <div
            className={`
              border-r bg-gray-50 transition-all duration-300 overflow-hidden
              ${isCol2Open ? "flex-[2] min-w-[400px]" : "w-16"}
            `}
          >
            <ColumnWrapper
              title="Dashboard Disponibili"
              icon={<LayoutDashboard className="h-5 w-5 text-gray-600" />}
              isOpen={isCol2Open}
              onToggle={() => setIsCol2Open(!isCol2Open)}
            >
              <DashboardColumn selectedUserId={selectedUserId} />
            </ColumnWrapper>
          </div>
        )}
      </div>
    </div>
  )
}

export default GraficiPage
