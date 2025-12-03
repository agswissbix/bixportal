"use client"

import type React from "react"
import { useMemo, useContext, useState, useEffect } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import { AppContext } from "@/context/appContext"
import { useRecordsStore } from "./records/recordsStore"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
// FLAG PER LO SVILUPPO
const isDev = false

// INTERFACCE
// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  views: {
    id: number
    name: string
  }[]
  defaultViewId?: number
}

export default function QuickFilters({ tableid }: PropsInterface) {
  //DATI

  // DATI RESPONSE DI DEFAULT
  const responseDataDEFAULT: ResponseInterface = {
    views: [],
  }

  // DATI RESPONSE PER LO SVILUPPO
  const responseDataDEV: ResponseInterface = {
    views: [
      {
        id: 1,
        name: "view1",
      },
      {
        id: 2,
        name: "view2",
      },
      {
        id: 3,
        name: "view3",
      },
    ],
    defaultViewId: 2,
  }

  // DATI DEL CONTESTO
  const { user } = useContext(AppContext)

  const [inputValue, setInputValue] = useState("")
  const [selectedView, setSelectedView] = useState(1)

  const {
    setSearchTerm,
    setTableView, // usa lo setter aggiornato
    isFiltersOpen,
    setIsFiltersOpen,
    setRefreshTable, // ★ MOD (nuova firma)
    selectedMenu,
  } = useRecordsStore()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value
    setInputValue(keyword) // Solo aggiorna lo stato locale
    // RIMOSSO: setSearchTerm(keyword);
  }

  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const viewid = e.target.value
    setSelectedView(Number.parseInt(viewid)) // Aggiorna stato locale
    setTableView(viewid) // Passa il valore al componente genitore
    researchTableSubmit()
  }

  const researchTableSubmit = () => {
    setSearchTerm(inputValue) // Imposta il termine di ricerca solo quando invii
    setRefreshTable((v) => v + 1) // Ricarica la tabella
  }

  // PAYLOAD (solo se non in sviluppo)
  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_table_views", // riferimento api per il backend
      tableid: tableid ?? selectedMenu,
    }
  }, [selectedMenu, tableid])

  // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
  const { response, loading, error } = useApi<ResponseInterface>(payload)

  // IMPOSTAZIONE DELLA RESPONSE (non toccare)
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT)

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
  useEffect(() => {
    // azzera input + filtri
    setInputValue("")
    setSearchTerm("")

    if (response?.views?.length) {
      setResponseData(response) // ★ QUI: aggiorna lo state
      const first = String(response.views[0].id)
      const initialViewId = response.defaultViewId ?? response.views[0].id
      const initialViewIdStr = String(initialViewId)

      setSelectedView(initialViewId)
      setTableView(initialViewIdStr) // auto-refresh via store
    }
  }, [selectedMenu, response, setSearchTerm, setTableView])

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="recordFilters">
      {(response: ResponseInterface) => (
        <div className="flex flex-row items-start xl:items-center justify-between w-full gap-4">
          {/* Form con select e search */}
          <form
            className="flex flex-row xl:flex-row items-stretch xl:items-center gap-3 w-full"
            onSubmit={(e) => {
              e.preventDefault()
              researchTableSubmit()
            }}
          >
            <select
              id="filter-type"
              value={selectedView}
              className="w-1/2 xl:w-64 h-11 bg-card-background border border-card-border text-foreground text-sm rounded-lg 
                              focus:ring-2 focus:ring-primary/20 focus:border-primary px-4 shadow-sm 
                              hover:border-primary/50 transition-all duration-200 outline-none"
              onChange={handleViewChange}
            >
              {response.views.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </select>

            <div className="relative flex-grow">
              <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="search"
                id="default-search"
                className="block w-full h-11 ps-10 pr-20 xl:pr-24 text-sm text-foreground border border-card-border rounded-lg 
                                bg-card-background focus:ring-2 focus:ring-primary/20 focus:border-primary 
                                shadow-sm hover:border-primary/50 transition-all duration-200 outline-none"
                placeholder="Cerca"
                value={inputValue}
                onChange={handleInputChange}
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-9 theme-primary font-medium rounded-lg text-sm px-3 xl:px-4 
                                transition-all duration-200 shadow-sm hover:shadow-md focus:ring-2 focus:ring-primary/20"
              >
                <div className="flex items-center">
                  <span className="hidden sm:inline">Cerca</span>
                  <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </form>

          <button
            type="button"
            className={`flex flex-1 items-center h-11 gap-2 px-4 font-medium rounded-lg text-sm 
                            focus:ring-2 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md 
                            whitespace-nowrap flex-shrink-0
                            ${
                              isFiltersOpen
                                ? "theme-primary focus:ring-primary/20"
                                : "text-foreground bg-card-background border border-card-border hover:bg-muted focus:ring-primary/20"
                            }`}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="hidden sm:inline">Filtri</span>
          </button>
        </div>
      )}
    </GenericComponent>
  )
}
