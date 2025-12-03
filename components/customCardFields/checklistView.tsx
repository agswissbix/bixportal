"use client"

import { useState, useMemo, useEffect } from "react"
import { ChecklistItem } from "./checklistItem"
import { ChecklistFilters } from "./checklistFilters"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, SquarePlus } from "lucide-react"
import { useApi } from "@/utils/useApi"
import type { ChecklistItem as ChecklistItemType } from "./checklistItem"
import { useRecordsStore } from "../records/recordsStore"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import GenericComponent from "../genericComponent"

interface ChecklistViewProps {
  tableid: string
  view?: string
  masterTableid?: string
  masterRecordid?: string
  isDev?: boolean
  limit?: number
}

export interface SortOrder {
  fieldid: string | null
  direction: "asc" | "desc" | null
}

export type SortDirection = "asc" | "desc" | null

export interface ResponseInterface {
  counter?: number
  rows: Array<{
    recordid: string
    css: string
    fields: Array<{
      recordid?: string
      css: string
      type: string
      value: string
      fieldid: string
      userid?: string
      linkedmaster_tableid?: string
      linkedmaster_recordid?: string
    }>
  }>
  columns: Array<{
    fieldtypeid: string
    desc: string
    fieldid: string
  }>
  pagination: {
    currentPage: number
    totalPages: number
  }
  order: SortOrder
}

export interface FilterConfig {
  fieldid: string
  value: string | string[]
  operator: string
}

export function ChecklistView({
  tableid,
  view,
  masterTableid,
  masterRecordid,
  isDev = false,
  limit = 50,
}: ChecklistViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "Si" | "No">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortOrder>({
    fieldid: "description",
    direction: "asc",
  })
  const [responseData, setResponseData] = useState<ResponseInterface | null>(null)
  const [refreshTable, setRefreshTable] = useState(0)

  const { handleRowClick } = useRecordsStore()

  const filtersList = useMemo(() => {
    const filters: any[] = []
    if (statusFilter !== "all") {
      filters.push({
        fieldid: "checked",
        type: "lookup",
        label: "Completato",
        value: `["${statusFilter}"]`,
        conditions: [],
      })
    }
    return filters
  }, [statusFilter])

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_table_records",
      tableid: tableid,
      searchTerm: searchTerm,
      view: view,
      pagination: {
        page: currentPage,
        limit: limit,
      },
      order: sortConfig,
      filtersList: filtersList,
      masterTableid: masterTableid,
      masterRecordid: masterRecordid,
      _refreshTick: refreshTable,
    }
  }, [
    tableid,
    searchTerm,
    view,
    currentPage,
    limit,
    sortConfig,
    filtersList,
    masterTableid,
    masterRecordid,
    refreshTable,
    isDev,
  ])

  const { response, loading, error } = useApi<ResponseInterface>(payload)

  useEffect(() => {
    if (!isDev && response) {
      if (JSON.stringify(response) !== JSON.stringify(responseData)) {
        setResponseData(response)
      }
    }
  }, [response, isDev])

  const checklistItems = useMemo<ChecklistItemType[]>(() => {
    if (!responseData?.rows) return []

    return responseData.rows.map((row) => {
      const descriptionField = row.fields.find((f) => f.fieldid === "description")
      const checkedField = row.fields.find((f) => f.fieldid === "checked")

      return {
        recordid: row.recordid,
        description: descriptionField?.value || "",
        checked: (checkedField?.value === "Si" ? "Si" : "No") as "Si" | "No",
        css: row.css,
      }
    })
  }, [responseData])

  const handleToggle = async (recordid: string, newValue: "Si" | "No") => {
    try {
        const response = await axiosInstanceClient.post(
        "/postApi",
        {
            apiRoute: "fieldsupdate",
            params: {"tableid": 'checklist',"checked": newValue, "recordid": recordid}
        },
        {
            responseType: "blob",
            headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
        );
    } catch (error) {
      console.error("Error updating record:", error)
    } finally {
              setRefreshTable((prev) => prev + 1)
    }
  }

  const toggleSort = () => {
    setSortConfig((prev) => ({
      ...prev,
      direction: prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  const checkedCount = checklistItems.filter((item) => item.checked === "Si").length
  const totalRecords = responseData?.counter || checklistItems.length


  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
    <div className="flex flex-col gap-6">
      {/* Filters and search */}
      <ChecklistFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalRecords={totalRecords}
        checkedCount={checkedCount}
      />

      {/* Action buttons section with Add button */}
      <div className="w-full flex items-start justify-between">
        <Button variant="outline" size="sm"
          className="font-semibold flex items-center bg-transparent text-accent border border-gray-300 px-4 py-2 rounded-lg 
                    hover:border-accent hover:bg-transparent hover:text-accent transition-all duration-300 transform 
                    hover:scale-[1.05] active:scale-[0.98] shadow-md hover:shadow-lg"
            onClick={() => handleRowClick('linked', '', 'checklist', masterTableid, masterRecordid)}
        >
          <SquarePlus className="mr-2 h-5 w-5" />
          Aggiungi
        </Button>

        <Button variant="outline" size="sm" onClick={toggleSort}
            className="font-semibold flex items-center bg-transparent text-secondary border border-gray-300 px-4 py-2 rounded-lg 
                    hover:border-secondary hover:bg-transparent hover:text-secondary transition-all duration-300 transform 
                    hover:scale-[1.05] active:scale-[0.98] shadow-md hover:shadow-lg">
          {sortConfig.direction === "asc"
           ? <ArrowDown className="h-4 w-4 mr-2" />
            : <ArrowUp className="h-4 w-4 mr-2" />
            }
          Ordina {sortConfig.direction === "asc" ? "A-Z" : "Z-A"}
        </Button>
      </div>

      {/* Checklist items */}
      <div className="flex flex-col gap-2">
        {checklistItems.map((item) => (
          <ChecklistItem key={item.recordid} item={item} onToggle={handleToggle} />
        ))}

        {checklistItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nessun elemento trovato</div>
        )}
      </div>

      {/* Pagination */}
      {responseData?.pagination && responseData.pagination.totalPages > 1 && (
        <nav
            aria-label="Page navigation"
            className="mt-4 flex flex-col sm:flex-row justify-between items-center space-x-2 space-y-2 sm:space-y-0"
          >
            {/* 1. Conteggio Totale Record a Sinistra (per schermi larghi) */}
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                Totale Record:
              </span>
              <span className="font-medium">
                {response.counter}
              </span>
            </div>
        <div className="flex items-center space-x-1 bg-card border border-border rounded-lg p-1 shadow-sm order-1 sm:order-2">
              {/* Previous Button */}
              <button
                onClick={() =>
                  setCurrentPage(response.pagination.currentPage - 1)
                }
                title="Previous"
                disabled={response.pagination.currentPage === 1}
                className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  response.pagination.currentPage === 1
                    ? "text-muted-foreground bg-transparent cursor-not-allowed opacity-50"
                    : "text-foreground bg-transparent hover:bg-muted hover:text-primary"
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 ${
                    response.pagination.currentPage === 1
                      ? "text-primary-foreground bg-primary shadow-sm"
                      : "text-foreground bg-transparent hover:bg-muted"
                  }`}
                >
                  1
                </button>

                {/* Ellipsis */}
                {response.pagination.currentPage > 3 && (
                  <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">
                    ...
                  </span>
                )}

                {/* Current Page (if not first or last) */}
                {response.pagination.currentPage !== 1 &&
                  response.pagination.currentPage !==
                    response.pagination.totalPages && (
                      <button className="flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md text-primary-foreground bg-primary shadow-sm">
                        {response.pagination.currentPage}
                      </button>
                    )}

                {/* Ellipsis */}
                {response.pagination.currentPage <
                  response.pagination.totalPages - 2 && (
                    <span className="flex items-center justify-center w-10 h-10 text-muted-foreground">
                      ...
                    </span>
                  )}

                {/* Last Page */}
                {response.pagination.totalPages > 1 && (
                  <button
                    onClick={() => setCurrentPage(response.pagination.totalPages)}
                    className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-md transition-all duration-200 ${
                      response.pagination.currentPage ===
                      response.pagination.totalPages
                        ? "text-primary-foreground bg-primary shadow-sm"
                        : "text-foreground bg-transparent hover:bg-muted"
                    }`}
                  >
                    {response.pagination.totalPages}
                  </button>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() =>
                  setCurrentPage(response.pagination.currentPage + 1)
                }
                disabled={
                  response.pagination.currentPage ===
                  response.pagination.totalPages
                }
                title="Next"
                className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  response.pagination.currentPage ===
                  response.pagination.totalPages
                    ? "text-muted-foreground bg-transparent cursor-not-allowed opacity-50"
                    : "text-foreground bg-transparent hover:bg-muted hover:text-primary"
                }`}
              >
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            {limit && (
              <span className="text-xs text-gray-500 dark:text-gray-400 order-3 text-center sm:text-right">
                Visualizzati: {response.rows.length} (Pagina {response.pagination.currentPage} di {response.pagination.totalPages})
              </span>
            )}
          </nav>
      )}
    </div>
  )}
  </GenericComponent>
  )
}
