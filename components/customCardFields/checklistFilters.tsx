"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface ChecklistFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: "all" | "Si" | "No"
  onStatusFilterChange: (value: "all" | "Si" | "No") => void
  totalRecords: number
  checkedCount: number
}

export function ChecklistFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalRecords,
  checkedCount,
}: ChecklistFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalSearch(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearchChange(localSearch)
        searchInputRef.current?.focus()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [localSearch, searchTerm, onSearchChange])

  const progressPercentage = totalRecords > 0 ? Math.round((checkedCount / totalRecords) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Stats and Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm space-x-4">
          <span className="text-muted-foreground">
            Completati: <strong className="text-foreground">{checkedCount}</strong> / {totalRecords}
          </span>
          <div className="flex-1 h-3 bg-gray-100 border border-1 border-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-muted-foreground">
            <strong className="text-foreground">{progressPercentage}%</strong>
          </span>
        </div>

      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Cerca nella checklist..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {localSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setLocalSearch("")
                onSearchChange("")
                searchInputRef.current?.focus()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px] border-gray-300">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent className="border-gray-300">
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="Si">Completati</SelectItem>
            <SelectItem value="No">Da completare</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
