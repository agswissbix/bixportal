"use client"

import React from "react"
import { useApi } from "@/utils/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

interface FieldOrder {
  userid_id: number
  tableid_id: string
  typepreference: string
}

interface MatrixResponse {
  success: boolean
  users: User[]
  tables: TableData[]
  custom_table_order_users: number[]
  field_orders: FieldOrder[]
}

export function OrdersMatrix() {
  const payload = { apiRoute: "get_orders_matrix" }
  const { response, loading, error } = useApi<MatrixResponse>(payload)

  if (loading) return <div>Caricamento in corso...</div>
  if (error) return <div>Errore: {error || String(error)}</div>
  if (!response || !response.success) return <div>Nessun dato disponibile o errore del server.</div>

  const { users, tables, custom_table_order_users, field_orders } = response

  // Organize field orders: table_id -> user_id -> typepreference[]
  const fieldOrdersMap: Record<string, Record<number, string[]>> = {}
  
  field_orders.forEach(fo => {
    if (!fieldOrdersMap[fo.tableid_id]) fieldOrdersMap[fo.tableid_id] = {}
    if (!fieldOrdersMap[fo.tableid_id][fo.userid_id]) fieldOrdersMap[fo.tableid_id][fo.userid_id] = []
    
    // Evitiamo duplicati nel caso ci siano più record per la stessa preference
    const pref = fo.typepreference || 'default'
    if (!fieldOrdersMap[fo.tableid_id][fo.userid_id].includes(pref)) {
      fieldOrdersMap[fo.tableid_id][fo.userid_id].push(pref)
    }
  })

  return (
    <Card className="w-full mt-6 shadow-sm border-gray-200">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-xl">Matrice Ordini Tabelle & Campi</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Questa tabella mostra l'utente di default (User 1) e solo gli utenti/gruppi che possiedono un ordinamento personalizzato per le tabelle o i campi.</p>
        {/* Legenda */}
        <p className="text-sm text-gray-500 mt-1">Legenda:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Tabelle Ordinate</Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Campi Custom</Badge>
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
                <th className="px-4 py-3 border-b border-r text-center min-w-[120px] bg-white text-blue-800">
                  <div className="font-semibold truncate">Ordine Tabelle</div>
                  <div className="text-[10px] font-normal text-gray-400 mt-0.5">Globale</div>
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
              {users.map((u, index) => {
                const hasTableOrder = custom_table_order_users.includes(u.id)

                return (
                  <tr key={u.id} className={`border-b hover:bg-blue-50/50 transition-colors ${index === 0 ? 'bg-orange-50/30' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-3 sticky left-0 z-10 border-r align-top bg-inherit">
                      <div className="absolute inset-0 bg-white -z-10 group-hover:bg-blue-50/50"></div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{u.firstname} {u.lastname}</span>
                        {u.is_group_manager && (
                          <span className="text-xs font-semibold text-purple-600 mt-0.5">Gruppo: {u.group_names.join(', ')}</span>
                        )}
                        {!u.is_group_manager && <span className="text-xs text-gray-500 mt-0.5">@{u.username}</span>}
                      </div>
                    </td>
                    
                    {/* Colonna Generica Ordine Tabelle */}
                    <td className="px-2 py-2 border-r text-center align-middle hover:bg-gray-100 transition-colors">
                      {hasTableOrder ? (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] uppercase tracking-wider">
                          Sì
                        </Badge>
                      ) : (
                        <span className="text-gray-300 select-none">-</span>
                      )}
                    </td>

                    {/* Colonne per i Campi di ogni Tabella */}
                    {tables.map(t => {
                      const prefs = fieldOrdersMap[t.id]?.[u.id] || []
                      const hasFieldOrder = prefs.length > 0

                      return (
                        <td key={`${u.id}-${t.id}`} className="px-2 py-2 border-r text-center align-middle hover:bg-gray-100 transition-colors">
                          {!hasFieldOrder ? (
                            <span className="text-gray-300 select-none">-</span>
                          ) : (
                            <div className="relative group cursor-help inline-block">
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] uppercase tracking-wider">
                                Campi Custom
                              </Badge>
                              
                              <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-[100] min-w-[200px] p-3 bg-gray-900 text-white text-xs rounded-md shadow-xl border border-gray-700 pointer-events-none">
                                <div className="font-semibold text-purple-300 mb-1.5 pb-1.5 border-b border-gray-700">Type Preferences:</div>
                                <ul className="space-y-1 text-left list-disc pl-4">
                                  {prefs.map((pref, i) => (
                                    <li key={i} className="text-gray-200 font-mono">
                                      {pref}
                                    </li>
                                  ))}
                                </ul>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-gray-700"></div>
                              </div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={tables.length + 2} className="text-center py-12 text-gray-500 bg-gray-50">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <span className="text-base font-medium">Nessuna personalizzazione trovata</span>
                      <span className="text-sm mt-1">Nessun utente ha ordini di tabelle o campi personalizzati.</span>
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
