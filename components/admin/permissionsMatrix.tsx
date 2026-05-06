"use client"

import React, { useState, useEffect } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface User {
  id: number
  username: string
  firstname: string
  lastname: string
  is_group_manager: boolean
  group_names: string[]
}

interface TableData {
  id: string
  description: string
}

interface Setting {
  id: number
  userid_id: number
  tableid_id: string
  settingid: string
  value: string
  conditions: any
}

interface MatrixResponse {
  success: boolean
  users: User[]
  tables: TableData[]
  settings: Setting[]
}

export function PermissionsMatrix() {
  const payload = { apiRoute: "get_permissions_matrix" }
  const { response, loading, error } = useApi<MatrixResponse>(payload)

  if (loading) return <div>Caricamento in corso...</div>
  if (error) return <div>Errore: {error || String(error)}</div>
  if (!response || !response.success) return <div>Nessun dato disponibile o errore del server.</div>

  const { users, tables, settings } = response

  // Organize settings: table_id -> user_id -> setting_id -> setting
  const settingsMap: Record<string, Record<number, Record<string, Setting>>> = {}
  
  settings.forEach(s => {
    if (!settingsMap[s.tableid_id]) settingsMap[s.tableid_id] = {}
    if (!settingsMap[s.tableid_id][s.userid_id]) settingsMap[s.tableid_id][s.userid_id] = {}
    settingsMap[s.tableid_id][s.userid_id][s.settingid] = s
  })

  const getInitials = (s: string) => {
    switch (s) {
      case 'edit': return 'E'
      case 'add': return 'A'
      case 'delete': return 'D'
      case 'view': return 'V'
      case 'duplicate': return 'Dup'
      default: return s.charAt(0).toUpperCase()
    }
  }

  const getColor = (s: string, value: string) => {
     if (value !== 'true') return 'bg-gray-200 text-gray-500'
     switch (s) {
       case 'edit': return 'bg-blue-100 text-blue-800 border-blue-200'
       case 'add': return 'bg-green-100 text-green-800 border-green-200'
       case 'delete': return 'bg-red-100 text-red-800 border-red-200'
       case 'view': return 'bg-purple-100 text-purple-800 border-purple-200'
       case 'duplicate': return 'bg-orange-100 text-orange-800 border-orange-200'
       default: return 'bg-gray-100 text-gray-800 border-gray-200'
     }
  }

  return (
    <Card className="w-full mt-6 shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-xl">Matrice Permessi Avanzati</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Questa tabella mostra i permessi di default (Utente 1) e solo gli utenti e le tabelle che possiedono impostazioni personalizzate.</p>
        {/* Legenda */}
        <p className="text-sm text-gray-500 mt-1">Legenda:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">E - Edit</Badge>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">A - Add</Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">D - Delete</Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">V - View</Badge>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Dup - Duplicate</Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-2"><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500 border border-white"></span> Condizioni</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto w-full relative custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-gray-700 bg-white sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-gray-50 z-30 min-w-[200px] max-w-[250px] border-b border-r">
                  Utenti / Gruppi
                </th>
                {tables.map(t => (
                  <th key={t.id} className="px-4 py-3 border-b border-r text-center min-w-[150px] bg-white">
                    <div className="font-semibold text-gray-800 truncate" title={t.description}>{t.description || t.id}</div>
                    <div className="text-[10px] font-normal text-gray-400 mt-0.5 font-mono">{t.id}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u.id} className={`border-b hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-3 sticky left-0 z-10 border-r align-top bg-inherit">
                    {/* Aggiungiamo un pseudo-elemento per nascondere il contenuto che scivola sotto nella colonna sticky quando si fa scroll */}
                    <div className="absolute inset-0 bg-white -z-10 group-hover:bg-blue-50/50"></div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{u.firstname} {u.lastname}</span>
                      {u.is_group_manager && (
                        <span className="text-xs font-semibold text-purple-600 mt-0.5">Gruppo: {u.group_names.join(', ')}</span>
                      )}
                      {!u.is_group_manager && <span className="text-xs text-gray-500 mt-0.5">@{u.username}</span>}
                    </div>
                  </td>
                  {tables.map(t => {
                    const cellSettings = settingsMap[t.id]?.[u.id] || {}
                    const hasAnySetting = Object.keys(cellSettings).length > 0
                    return (
                      <td key={`${u.id}-${t.id}`} className="px-2 py-2 border-r text-center align-middle hover:bg-gray-100 transition-colors">
                        {!hasAnySetting ? (
                          <span className="text-gray-300 select-none">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 justify-center max-w-[140px] mx-auto">
                            {['view', 'add', 'edit', 'delete', 'duplicate'].map(settingId => {
                              const s = cellSettings[settingId]
                              if (!s) return null
                              const hasCondition = !!s.conditions && (!s.conditions.rules || s.conditions.rules.length > 0)
                              return (
                                <div key={settingId} className="relative group cursor-help">
                                  <Badge variant="outline" className={`${getColor(settingId, s.value)} text-[10px] px-1.5 py-0.5 uppercase tracking-wider relative`}>
                                    {getInitials(settingId)}
                                    {hasCondition && (
                                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500 border border-white"></span>
                                      </span>
                                    )}
                                  </Badge>
                                  {hasCondition && (
                                    <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-[100] w-56 p-3 bg-gray-900 text-white text-xs rounded-md shadow-xl border border-gray-700 pointer-events-none">
                                      <div className="font-semibold text-blue-300 mb-1.5 pb-1.5 border-b border-gray-700">Condizioni ({s.conditions.logic})</div>
                                      <ul className="space-y-1 text-left">
                                        {s.conditions.rules?.map((r: any, i: number) => (
                                          <li key={i} className="flex gap-1.5 items-baseline">
                                            <span className="text-yellow-400 font-mono">{r.field}</span>
                                            <span className="text-gray-400 font-bold">{r.operator}</span>
                                            <span className="text-green-300 break-all">{r.value}</span>
                                          </li>
                                        ))}
                                      </ul>
                                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-gray-700"></div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={tables.length + 1} className="text-center py-12 text-gray-500 bg-gray-50">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <span className="text-base font-medium">Nessuna personalizzazione trovata</span>
                      <span className="text-sm mt-1">Tutti gli utenti stanno utilizzando i permessi di default.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
