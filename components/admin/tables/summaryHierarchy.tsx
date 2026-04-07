import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import axiosInstanceClient from '@/utils/axiosInstanceClient'

export const SummaryHierarchy: React.FC<{ selectedUserId: string }> = ({ selectedUserId }) => {
  const [customizations, setCustomizations] = useState<Record<string, Record<string, string[]>>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  useEffect(() => {
    console.log("selectedUserId", selectedUserId)
    if (selectedUserId && selectedUserId !== "" && selectedUserId.toString() !== "1") {
      axiosInstanceClient.post("/postApi", {
        apiRoute: "settings_user_customizations_summary",
        userid: selectedUserId
      }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(res => {
        if (res.data.customizations && Object.keys(res.data.customizations).length > 0) {
          setCustomizations(res.data.customizations)
        } else {
          setCustomizations({})
        }
      })
      .catch(e => console.error("Error loading customizations", e))
    } else {
      setCustomizations({})
    }
  }, [selectedUserId])

  if (!selectedUserId) return null;

  const totalModifications = Object.keys(customizations).length > 0 
    ? Object.values(customizations).reduce((acc, curr) => acc + Object.values(curr).reduce((sum, cat) => sum + cat.length, 0), 0)
    : 0;

  return (
    <div className="p-4 mt-auto border-t border-slate-200 bg-slate-50">
      {Object.keys(customizations).length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <h3 className="font-semibold text-sm text-slate-800 mb-3 px-3 pt-3 flex items-center justify-between">
            Riepilogo Personalizzazioni
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {totalModifications} Modifiche
            </span>
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto px-3 pb-3 scrollbar-thin scrollbar-thumb-slate-200">
            {Object.entries(customizations).map(([group, categories]) => {
              const tableCount = Object.values(categories).reduce((acc, cat) => acc + cat.length, 0);
              
              return (
              <div key={group} className="border border-slate-200 rounded-md overflow-hidden bg-slate-50 transition-all duration-200">
                <button 
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedGroups[group] ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                    <span className="capitalize">{group === "Sistema" ? "Globale di Sistema" : `Tabella: ${group}`}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-700">{tableCount}</Badge>
                </button>
                {expandedGroups[group] && (
                  <div className="p-3 space-y-3 bg-white border-t border-slate-100">
                    {Object.entries(categories).map(([category, items]) => (
                      <div key={category} className="space-y-1.5">
                        <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{category}</h4>
                        <ul className="space-y-1">
                          {items.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-600 p-1.5 rounded border border-slate-100 bg-slate-50 break-words leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500 text-center">Nessuna personalizzazione attiva per questo utente.</p>
        </div>
      )}
    </div>
  )
}
