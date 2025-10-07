"use client"

import React, { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Users, User, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"


interface SettingsHierarchy {
  standarduser: Record<string, any>
  groups: Record<string, Record<string, any>>
  user: Record<string, any>
}

interface Props {
  tableId?: string
  fieldId?: string
  userId?: string
  hierarchy?: SettingsHierarchy
  currentSettings?: Record<string, any>
  onSettingChange?: (key: string, value: any) => void
  onChange?: (hierarchy: SettingsHierarchy) => void
}

const SettingsHierarchyViewer: React.FC<Props> = ({
  tableId,
  fieldId,
  userId,
  hierarchy: externalHierarchy,
  currentSettings,
  onSettingChange,
  onChange,
}) => {
  const [hierarchy, setHierarchy] = useState<SettingsHierarchy | null>(externalHierarchy || null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["standarduser"]))

  // Fetch automatico se non passo i dati
  useEffect(() => {
    if (externalHierarchy) {
      setHierarchy(externalHierarchy)
    } else if (tableId && fieldId && userId) {
      fetchHierarchy()
    }
  }, [tableId, fieldId, userId, externalHierarchy])

  const fetchHierarchy = async () => {
    const res = await fetch("/postApi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiRoute: "settings_table_fields_settings_block",
        tableid: tableId,
        fieldid: fieldId,
        userid: userId,
      }),
    })
    const data = await res.json()
    setHierarchy(data)
  }

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const newSet = new Set(prev)
      newSet.has(key) ? newSet.delete(key) : newSet.add(key)
      return newSet
    })
  }

  const handleSettingChange = (scope: string, key: string, value: string, groupId?: string) => {
    if (scope === "fieldsettings" && onSettingChange) {
      onSettingChange(key, value)
      return
    }

    if (!hierarchy) return
    const newHierarchy = { ...hierarchy }

    if (scope === "standarduser") newHierarchy.standarduser[key].value = value
    else if (scope === "user") newHierarchy.user[key].value = value
    else if (scope === "group" && groupId) newHierarchy.groups[groupId][key].value = value

    setHierarchy(newHierarchy)
    onChange?.(newHierarchy)
  }

  const renderSettingInput = (scope: string, key: string, field: any, groupId?: string) => {
    if (field.type === "select" && field.options) {
      return (
        <Select
          value={field.value}
          onValueChange={(val) => handleSettingChange(scope, key, val, groupId)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seleziona..." />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        value={field.value}
        onChange={(e) => handleSettingChange(scope, key, e.target.value, groupId)}
        className="w-48"
      />
    )
  }

  if (!hierarchy) {
    return <div className="p-4 text-gray-500">Nessun dato disponibile</div>
  }

  return (
    <div className="space-y-6">
      {/* STANDARDUSER */}
      <Card className="border-green-300">
        <CardHeader
          className="cursor-pointer bg-green-50 hover:bg-green-100"
          onClick={() => toggleExpand("standarduser")}
        >
          <CardTitle className="flex items-center gap-2 text-green-700">
            {expanded.has("standarduser") ? <ChevronDown /> : <ChevronRight />}
            <Shield className="h-5 w-5" />
            Standard User (Default)
          </CardTitle>
        </CardHeader>
        {expanded.has("standarduser") && (
          <CardContent className="p-4 space-y-2">
            {Object.entries(hierarchy.standarduser).map(([key, field]) => (
              <div key={key} className="flex items-center justify-between border p-2 rounded-md">
                <span className="font-medium">{key}</span>
                {renderSettingInput("standarduser", key, field)}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* GROUPS */}
      {hierarchy.groups &&
        Object.entries(hierarchy.groups).map(([groupId, groupSettings]) => (
          <Card key={groupId} className="border-purple-300">
            <CardHeader
              className="cursor-pointer bg-purple-50 hover:bg-purple-100"
              onClick={() => toggleExpand(`group_${groupId}`)}
            >
              <CardTitle className="flex items-center gap-2 text-purple-700">
                {expanded.has(`group_${groupId}`) ? <ChevronDown /> : <ChevronRight />}
                <Users className="h-5 w-5" />
                Gruppo: {groupId}
              </CardTitle>
            </CardHeader>
            {expanded.has(`group_${groupId}`) && (
              <CardContent className="p-4 space-y-2">
                {Object.entries(groupSettings).map(([key, field]) => (
                  <div key={key} className="flex items-center justify-between border p-2 rounded-md">
                    <span className="font-medium">{key}</span>
                    {renderSettingInput("group", key, field, groupId)}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}

      {/* USER */}
      <Card className="border-blue-300">
        <CardHeader
          className="cursor-pointer bg-blue-50 hover:bg-blue-100"
          onClick={() => toggleExpand("user")}
        >
          <CardTitle className="flex items-center gap-2 text-blue-700">
            {expanded.has("user") ? <ChevronDown /> : <ChevronRight />}
            <User className="h-5 w-5" />
            User Specific
          </CardTitle>
        </CardHeader>
        {expanded.has("user") && (
          <CardContent className="p-4 space-y-2">
            {Object.entries(hierarchy.user).map(([key, field]) => (
              <div key={key} className="flex items-center justify-between border p-2 rounded-md">
                <span className="font-medium">{key}</span>
                {renderSettingInput("user", key, field)}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {currentSettings && (
        <Card className="border-gray-300">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-700">Impostazioni Campo</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {Object.entries(currentSettings).map(([key, field]) => (
              <div key={key} className="flex items-center justify-between border p-2 rounded-md">
                <span className="font-medium">{key}</span>
                {renderSettingInput("fieldsettings", key, field)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button className="w-full bg-green-600 hover:bg-green-700">Salva Impostazioni</Button>
    </div>
  )
}

export default SettingsHierarchyViewer
