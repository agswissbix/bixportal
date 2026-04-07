"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Rule {
  field: string
  operator: string
  value: string
}

interface Conditions {
  logic?: "AND" | "OR"
  rules?: Rule[]
  is_merged?: boolean
  conditions_list?: Conditions[]
}

interface ConditionsEditorProps {
  value: Conditions | null
  onChange: (value: Conditions) => void
  fieldOptions?: string[]
}

const OPERATORS = [
  { value: "=", label: "=" },
  { value: "!=", label: "≠" },
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: "in", label: "in" },
]

const ConditionsEditor: React.FC<ConditionsEditorProps> = ({ value, onChange, fieldOptions = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const defaultConditions: Conditions = { logic: "AND", rules: [] }
  const conditions = value || defaultConditions
  const isMerged = conditions.is_merged
  const safeRules = conditions.rules || []
  const hasConditions = safeRules.length > 0

  const handleLogicChange = (logic: "AND" | "OR") => {
    onChange({ ...conditions, logic })
  }

  const handleRuleChange = (index: number, field: keyof Rule, newValue: string) => {
    const newRules = [...safeRules]
    newRules[index] = { ...newRules[index], [field]: newValue }
    onChange({ ...conditions, rules: newRules })
  }

  const addRule = () => {
    onChange({
      ...conditions,
      logic: conditions.logic || "AND",
      rules: [...safeRules, { field: "", operator: "=", value: "" }],
    })
    setIsOpen(true)
  }

  const removeRule = (index: number) => {
    const newRules = safeRules.filter((_, i) => i !== index)
    onChange({ ...conditions, rules: newRules })
  }

  if (isMerged) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-sm text-purple-600 hover:text-purple-900 px-0"
          >
            {isOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            Condizioni ereditate (multiple)
          </Button>
        </div>

        {isOpen && (
          <div className="border rounded-lg p-4 bg-purple-50 space-y-3">
            <span className="text-xs text-purple-600 block mb-2 font-medium">Condizioni combinate dai vari gruppi a cui appartiene l'utente:</span>
            <div className="space-y-2">
               {conditions.conditions_list?.map((sub, i) => (
                 <div key={i} className="p-2 bg-white rounded border border-purple-100 shadow-sm">
                    <span className="font-medium text-xs text-purple-700">Gruppo logico ({sub.logic}):</span>
                    <ul className="list-disc pl-4 mt-1">
                      {sub.rules?.map((r, idx) => (
                        <li key={idx} className="text-xs text-gray-700">{r.field} <b>{r.operator}</b> {r.value}</li>
                      ))}
                    </ul>
                 </div>
               ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                 const flattenedRules: Rule[] = [];
                 conditions.conditions_list?.forEach(sub => {
                     if (sub.rules) {
                         flattenedRules.push(...sub.rules);
                     }
                 });
                 onChange({ 
                     logic: "OR", 
                     rules: flattenedRules.length > 0 ? flattenedRules : [{ field: "", operator: "=", value: "" }] 
                 })
                 setIsOpen(true)
              }}
              className="w-full border-dashed bg-white mt-2 text-purple-700 hover:bg-purple-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Sovrascrivi e Modifica Regole Ereditate
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-gray-600 hover:text-gray-900 px-0"
        >
          {isOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {hasConditions
            ? `${conditions.rules.length} condizion${conditions.rules.length === 1 ? "e" : "i"}`
            : "Nessuna condizione"}
        </Button>

        {!hasConditions && (
          <Button type="button" variant="outline" size="sm" onClick={addRule} className="text-xs bg-transparent">
            <Plus className="h-3 w-3 mr-1" />
            Aggiungi
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          {/* Logic Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Logica:</span>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => handleLogicChange("AND")}
                className={`px-4 py-1.5 text-sm font-medium rounded-l-md border transition-colors ${
                  conditions.logic === "AND"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                AND
              </button>
              <button
                type="button"
                onClick={() => handleLogicChange("OR")}
                className={`px-4 py-1.5 text-sm font-medium rounded-r-md border-t border-r border-b transition-colors ${
                  conditions.logic === "OR"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                OR
              </button>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            {safeRules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-md border border-gray-200">
                <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  {/* Field */}
                  {fieldOptions.length > 0 ? (
                    <select
                      value={rule.field}
                      onChange={(e) => handleRuleChange(index, "field", e.target.value)}
                      className="border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Seleziona campo</option>
                      {fieldOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="campo"
                      value={rule.field}
                      onChange={(e) => handleRuleChange(index, "field", e.target.value)}
                      className="text-sm h-9"
                    />
                  )}

                  {/* Operator */}
                  <select
                    value={rule.operator}
                    onChange={(e) => handleRuleChange(index, "operator", e.target.value)}
                    className="border rounded px-2 py-1.5 text-sm w-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value */}
                  <Input
                    placeholder="valore"
                    value={rule.value}
                    onChange={(e) => handleRuleChange(index, "value", e.target.value)}
                    className="text-sm h-9"
                  />
                </div>

                {/* Delete Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add Rule Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRule}
            className="w-full border-dashed bg-transparent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Regola
          </Button>

          {safeRules.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              Nessuna regola configurata. Clicca "Aggiungi Regola" per iniziare.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default ConditionsEditor
