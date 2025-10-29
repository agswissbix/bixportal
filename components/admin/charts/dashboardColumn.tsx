"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { toast } from "sonner"

interface Dashboard {
  id: string
  name: string
  description?: string
  enabled: boolean
}

interface DashboardChecklistColumnProps {
  selectedUserId: string
}

interface ResponseInterface {
  dashboards: Dashboard[]
}

const isDev = false

const mockDashboards: ResponseInterface = {
  dashboards: [
    { id: "dash_1", name: "Dashboard Vendite", description: "Panoramica vendite e revenue", enabled: true },
    { id: "dash_2", name: "Dashboard Marketing", description: "Metriche campagne e conversioni", enabled: false },
    {
      id: "dash_3",
      name: "Dashboard Analytics",
      description: "Analisi traffico e comportamento utenti",
      enabled: true,
    },
    { id: "dash_4", name: "Dashboard Inventario", description: "Gestione stock e magazzino", enabled: false },
    { id: "dash_5", name: "Dashboard HR", description: "Risorse umane e presenze", enabled: true },
  ],
}

export const DashboardColumn: React.FC<DashboardChecklistColumnProps> = ({ selectedUserId }) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>(mockDashboards.dashboards)
  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "settings_get_dashboards_user",
      userid: selectedUserId,
    }
  }, [selectedUserId])

  const { response, loading, error } = useApi<ResponseInterface>(payload)

  useEffect(() => {
    if (!isDev && response) {
      setDashboards(response.dashboards)
    }
  }, [response])

  const handleToggleDashboard = async (dashboardId: string, currentEnabled: boolean) => {
    setDashboards((prev) =>
      prev.map((dash) => (dash.id === dashboardId ? { ...dash, enabled: !currentEnabled } : dash)),
    )

    if (isDev) return

    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "save_user_dashboard_setting",
          userid: selectedUserId,
          dashboardid: dashboardId,
          enabled: !currentEnabled,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      if (response.data.success !== true) {
        throw new Error("Errore nel salvataggio delle impostazioni della dashboard")
      }

      toast.success("Impostazioni della dashboard aggiornate con successo")
    } catch (err) {
      setDashboards((prev) =>
        prev.map((dash) => (dash.id === dashboardId ? { ...dash, enabled: currentEnabled } : dash)),
      )
        toast.error("Errore nel salvataggio delle impostazioni della dashboard")
    }
  }

  const enabledCount = dashboards.filter((d) => d.enabled).length

  return (
    <GenericComponent response={dashboards} loading={loading} error={error}>
      {(data: Dashboard[]) => (
        <div className="flex flex-col h-full">
          {/* Summary Header */}
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm text-gray-700">Dashboard Abilitate</h3>
              <span className="text-sm font-semibold text-blue-600">
                {enabledCount} / {dashboards.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(enabledCount / dashboards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Dashboard List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all duration-200",
                    dashboard.enabled ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:border-gray-300",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={dashboard.id}
                      checked={dashboard.enabled}
                      onCheckedChange={() => handleToggleDashboard(dashboard.id, dashboard.enabled)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={dashboard.id} className="cursor-pointer block">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn("font-medium text-sm", dashboard.enabled ? "text-blue-900" : "text-gray-700")}
                          >
                            {dashboard.name}
                          </span>
                        </div>
                        {dashboard.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{dashboard.description}</p>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </GenericComponent>
  )
}
