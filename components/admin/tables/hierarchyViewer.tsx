"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Users, Shield, User, ChevronDown, ChevronRight, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

interface HierarchyLevel {
  level: "superuser" | "group" | "user"
  id?: string
  name: string
  settings: Record<string, any>
  icon: React.ReactNode
  color: string
}

interface SettingsHierarchyViewerProps {
  tableId?: string
  fieldId?: string
  userId?: string
  hierarchy?: any
  currentSettings?: any
  onSettingChange?: (key: string, value: any) => void
}

const SettingsHierarchyViewer: React.FC<SettingsHierarchyViewerProps> = ({
  tableId,
  fieldId,
  userId,
  hierarchy: externalHierarchy,
  currentSettings,
  onSettingChange,
}) => {
  const [hierarchy, setHierarchy] = useState<any>(externalHierarchy || null)
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(["superuser"]))
  const [loading, setLoading] = useState(!externalHierarchy)
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null)

  useEffect(() => {
    if (externalHierarchy) {
      setHierarchy(externalHierarchy)
      setLoading(false)
    } else if (tableId && fieldId && userId) {
      fetchHierarchy()
    }
  }, [tableId, fieldId, userId, externalHierarchy])

  const fetchHierarchy = async () => {
    setLoading(true)
    try {
      const response = await fetch("/postApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          apiRoute: "get_settings_hierarchy",
          tableid: tableId,
          fieldid: fieldId,
          userid: userId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setHierarchy(data)
      }
    } catch (err) {
      console.error("Error fetching hierarchy:", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleLevel = (levelId: string) => {
    setExpandedLevels((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(levelId)) {
        newSet.delete(levelId)
      } else {
        newSet.add(levelId)
      }
      return newSet
    })
  }

  const getEffectiveValue = (settingKey: string): { value: any; source: string; color: string } => {
    if (!hierarchy) return { value: null, source: "none", color: "gray" }

    // Priority: user > group > superuser
    if (hierarchy.user && hierarchy.user[settingKey] !== undefined) {
      return { value: hierarchy.user[settingKey], source: "user", color: "blue" }
    }

    // Check all groups
    if (hierarchy.groups) {
      for (const [groupId, groupSettings] of Object.entries(hierarchy.groups)) {
        if ((groupSettings as any)[settingKey] !== undefined) {
          return { value: (groupSettings as any)[settingKey], source: `group_${groupId}`, color: "purple" }
        }
      }
    }

    // Fallback to superuser
    if (hierarchy.superuser && hierarchy.superuser[settingKey] !== undefined) {
      return { value: hierarchy.superuser[settingKey], source: "superuser", color: "green" }
    }

    return { value: null, source: "none", color: "gray" }
  }

  const getAllSettings = (): string[] => {
    if (!hierarchy) return []

    const settings = new Set<string>()
    if (hierarchy.superuser) {
      Object.keys(hierarchy.superuser).forEach((k) => settings.add(k))
    }
    if (hierarchy.groups) {
      Object.values(hierarchy.groups).forEach((groupSettings: any) => {
        Object.keys(groupSettings).forEach((k) => settings.add(k))
      })
    }
    if (hierarchy.user) {
      Object.keys(hierarchy.user).forEach((k) => settings.add(k))
    }

    return Array.from(settings)
  }

  const renderSettingValue = (key: string, value: any, settingDef?: any) => {
    if (!currentSettings || !onSettingChange) {
      return <code className="bg-gray-100 px-2 py-1 rounded">{String(value)}</code>
    }

    const currentValue = currentSettings[key]?.value ?? value
    const type = currentSettings[key]?.type || settingDef?.type || "string"

    if (type === "boolean") {
      return <Switch checked={currentValue} onCheckedChange={(checked) => onSettingChange(key, checked)} />
    }

    return (
      <Input
        type={type === "number" ? "number" : "text"}
        value={currentValue}
        onChange={(e) => onSettingChange(key, type === "number" ? Number(e.target.value) : e.target.value)}
        className="max-w-xs"
      />
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-pulse text-gray-500">Caricamento gerarchia...</div>
        </CardContent>
      </Card>
    )
  }

  if (!hierarchy) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-500">Nessuna gerarchia disponibile</CardContent>
      </Card>
    )
  }

  const allSettings = getAllSettings()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerarchia Settings
          </CardTitle>
          <CardDescription>
            Visualizza come i settings vengono ereditati e sovrascritti attraverso i livelli
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Superuser Level */}
            {hierarchy.superuser && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleLevel("superuser")}
                  className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedLevels.has("superuser") ? (
                      <ChevronDown className="h-5 w-5 text-green-700" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-green-700" />
                    )}
                    <Shield className="h-5 w-5 text-green-700" />
                    <div className="text-left">
                      <div className="font-semibold text-green-900">Superuser (Default)</div>
                      <div className="text-sm text-green-700">Settings di base applicati a tutti gli utenti</div>
                    </div>
                  </div>
                  <Badge className="bg-green-600">{Object.keys(hierarchy.superuser).length} settings</Badge>
                </button>

                {expandedLevels.has("superuser") && (
                  <div className="p-4 bg-white border-t">
                    <div className="space-y-2">
                      {Object.entries(hierarchy.superuser).map(([key, value]) => {
                        const effective = getEffectiveValue(key)
                        const isOverridden = effective.source !== "superuser"

                        return (
                          <div
                            key={key}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isOverridden ? "bg-gray-50 opacity-60" : "bg-white"
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{currentSettings?.[key]?.label || key}</div>
                              <div className="text-xs text-gray-600 flex items-center gap-2">
                                <span>Valore:</span>
                                {renderSettingValue(key, value, currentSettings?.[key])}
                              </div>
                            </div>
                            {isOverridden && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                      Sovrascritto
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Questo valore è sovrascritto a livello {effective.source}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Group Levels */}
            {hierarchy.groups &&
              Object.entries(hierarchy.groups).map(([groupId, groupSettings]: [string, any]) => (
                <div key={groupId} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleLevel(`group_${groupId}`)}
                    className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedLevels.has(`group_${groupId}`) ? (
                        <ChevronDown className="h-5 w-5 text-purple-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-purple-700" />
                      )}
                      <Users className="h-5 w-5 text-purple-700" />
                      <div className="text-left">
                        <div className="font-semibold text-purple-900">Gruppo {groupId}</div>
                        <div className="text-sm text-purple-700">Override per membri del gruppo</div>
                      </div>
                    </div>
                    <Badge className="bg-purple-600">{Object.keys(groupSettings).length} overrides</Badge>
                  </button>

                  {expandedLevels.has(`group_${groupId}`) && (
                    <div className="p-4 bg-white border-t">
                      <div className="space-y-2">
                        {Object.entries(groupSettings).map(([key, value]) => {
                          const effective = getEffectiveValue(key)
                          const isActive = effective.source === `group_${groupId}`

                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isActive ? "bg-purple-50 border-purple-200" : "bg-gray-50 opacity-60"
                              }`}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{currentSettings?.[key]?.label || key}</div>
                                <div className="text-xs text-gray-600 flex items-center gap-2">
                                  <span>Valore:</span>
                                  {renderSettingValue(key, value, currentSettings?.[key])}
                                </div>
                              </div>
                              {isActive ? (
                                <Badge className="bg-purple-600">Attivo</Badge>
                              ) : (
                                <Badge variant="outline">Sovrascritto da user</Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {/* User Level */}
            {hierarchy.user && Object.keys(hierarchy.user).length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleLevel("user")}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedLevels.has("user") ? (
                      <ChevronDown className="h-5 w-5 text-blue-700" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-blue-700" />
                    )}
                    <User className="h-5 w-5 text-blue-700" />
                    <div className="text-left">
                      <div className="font-semibold text-blue-900">Utente Specifico</div>
                      <div className="text-sm text-blue-700">Override personali (massima priorità)</div>
                    </div>
                  </div>
                  <Badge className="bg-blue-600">{Object.keys(hierarchy.user).length} overrides</Badge>
                </button>

                {expandedLevels.has("user") && (
                  <div className="p-4 bg-white border-t">
                    <div className="space-y-2">
                      {Object.entries(hierarchy.user).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 border-blue-200"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{currentSettings?.[key]?.label || key}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-2">
                              <span>Valore:</span>
                              {renderSettingValue(key, value, currentSettings?.[key])}
                            </div>
                          </div>
                          <Badge className="bg-blue-600">Attivo</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Riepilogo Settings Attivi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allSettings.map((settingKey) => {
              const effective = getEffectiveValue(settingKey)
              return (
                <div key={settingKey} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{currentSettings?.[settingKey]?.label || settingKey}</div>
                    <div className="text-xs text-gray-600">
                      Valore effettivo: <code className="bg-gray-100 px-2 py-1 rounded">{String(effective.value)}</code>
                    </div>
                  </div>
                  <Badge
                    className={`${
                      effective.color === "blue"
                        ? "bg-blue-600"
                        : effective.color === "purple"
                          ? "bg-purple-600"
                          : effective.color === "green"
                            ? "bg-green-600"
                            : "bg-gray-600"
                    }`}
                  >
                    {effective.source === "user"
                      ? "User Override"
                      : effective.source.startsWith("group_")
                        ? "Group Override"
                        : effective.source === "superuser"
                          ? "Default"
                          : "N/A"}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-semibold mb-3">Legenda:</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-600"></div>
              <span>Superuser (Default)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-600"></div>
              <span>Gruppo (Override)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-600"></div>
              <span>Utente (Priorità Max)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { SettingsHierarchyViewer }
export default SettingsHierarchyViewer
