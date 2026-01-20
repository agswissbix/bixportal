"use client"
import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "./genericComponent"
import { Plus, X, Loader2, ChevronRight, Search, RotateCcw, Filter } from 'lucide-react'
import axiosInstanceClient from "@/utils/axiosInstanceClient"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
// FLAG PER LO SVILUPPO
const isDev = false

// --- NUOVA INTERFACCIA ---
// Nuova interfaccia per rappresentare un singolo club
interface Club {
  title: string
  recordid: string
  logo?: string
}

// INTERFACCIA STATO FILTRI
export interface FilterState {
  selectedYears: string[]
  showTotalAverage: boolean
  averageExcludeNoSharing: boolean
  numericFilters: NumericFilter[]
  demographicFilters: DemographicFilter[]
  selectedClubs: string[]
}

// FILTRO NUMERICO SINGOLO
export interface NumericFilter {
  field: string
  label: string
  operator: ">=" | "<="
  value: number
}

// FILTRO DEMOGRAFICO SINGOLO
export interface DemographicFilter {
  field: string
  label: string
  type: "number" | "select" | "toggle" | "distance"
  operator?: ">=" | "<=" // Solo per number e distance
  value: string | number | boolean
  options?: string[] // Solo per select
}

// OPZIONE PER UN NUOVO FILTRO NUMERICO
interface FilterOption {
  field: string
  label: string
}

// INTERFACCIA FILTRI VISIBILI
export interface VisibleFilters {
  years?: boolean
  average?: boolean
  numericFilters?: boolean
  demographicFilters?: boolean | {
    anno_fondazione?: boolean
    colelgamenti_pubblici?: boolean
    infrastrutture_turistiche?: boolean
    pacchetti_golf?: boolean
    strutture_complementari?: boolean
    territorio_circostante?: boolean
    tipo_gestione?: boolean
    distance?: boolean
    nazione?: boolean
  }
  clubs?: boolean
}

// INTERFACCIA PROPS
interface PropsInterface {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  translateClass?: string // Classe per la trasformazione CSS
  visibleFilters?: VisibleFilters // Nuova prop per configurare filtri visibili
  availableYears?: string[] // Anni disponibili per il filtro
}

// INTERFACCIA RISPOSTA INIZIALE DAL BACKEND
interface InitialResponseInterface {
  filterOptionsNumbers: FilterOption[]
  filterOptionsDemographic: FilterOption[] // Ora è FilterOption invece di DemographicFilterOption
  availableClubs: Club[]
  availableYears?: string[] // Aggiunto supporto per anni dal backend
}

// INTERFACCIA RISPOSTA FILTRATA DAL BACKEND
interface FilteredClubsResponse {
  availableClubs: Club[]
}

// OPZIONI DEMOGRAFICHE FISSE
const DEMOGRAPHIC_FILTER_OPTIONS = [
  {
    field: "anno_fondazione",
    label: "Anno di fondazione",
    type: "number" as const,
  },
  {
    field: "colelgamenti_pubblici",
    label: "Collegamenti pubblici",
    type: "toggle" as const,
  },
  {
    field: "infrastrutture_turistiche",
    label: "Infrastrutture turistiche nei dintorni",
    type: "toggle" as const,
  },
  {
    field: "pacchetti_golf",
    label: "Pacchetti golf + soggiorno",
    type: "select" as const,
    options: ["Si", "No", "Occasionale"],
  },
  {
    field: "strutture_complementari",
    label: "Club house e strutture complementari",
    type: "select" as const,
    options: ['Hotel', 'Ristorante', 'Sale meeting', 'Spa'],
  },
  {
    field: "territorio_circostante",
    label: "Territorio circostante",
    type: "select" as const,
    options: ["Area costiera","Area lacustre", "Collina", "Pianura", "Montagna"],
  },
  {
    field: "tipo_gestione",
    label: "Tipo di gestione",
    type: "select" as const,
    options: ['Municipale', 'Privata', 'Pubblica', "Resort integrato"],
  },
  {
    field: "distance",
    label: "Distanza dal nazione (km)",
    type: "distance" as const,
  },
  {
    field: "nazione",
    label: "Nazione",
    type: "select" as const,
    options: [], // Verrà popolato dinamicamente con countries()
  },
]

export default function DashboardFilters({
  filters,
  onFiltersChange,
  translateClass = "lg:translate-x-20",
  visibleFilters = { years: false, average: false, numericFilters: false, demographicFilters: false, clubs: false },
  availableYears = ["2020","2021", "2022", "2023", "2024", "2025"],
}: PropsInterface) {
  // --- STATO E DATI ---


  const [isCollapsed, setIsCollapsed] = useState(true)
  const [showAddFilterMenu, setShowAddFilterMenu] = useState(false)
  const [showAddDemographicFilterMenu, setShowAddDemographicFilterMenu] = useState(false)
  const [distanceFilter, setDistanceFilter] = useState<number>(0)
  const [isUpdatingClubs, setIsUpdatingClubs] = useState(false)
  const initialLoadComplete = useRef(false)

  const [clubSearchQuery, setClubSearchQuery] = useState("")

  // DATI RESPONSE DI DEFAULT
  const responseDataDEFAULT: InitialResponseInterface = {
    filterOptionsNumbers: [],
    filterOptionsDemographic: [],
    availableClubs: [],
    availableYears: availableYears,
  }

  // DATI RESPONSE PER LO SVILUPPO
  const responseDataDEV: InitialResponseInterface = {
    filterOptionsNumbers: [
      { field: "members_total", label: "Membri totali" },
      { field: "green_fees_total", label: "Green fees totali" },
      { field: "revenue_total", label: "Ricavi totali" },
    ],
    filterOptionsDemographic: [
      { field: "num_employees", label: "Numero dipendenti" },
      { field: "num_holes", label: "Numero buche" },
      { field: "course_length", label: "Lunghezza percorso (m)" },
    ],
    availableClubs: [
      { title: "Golf Club Milano", recordid: "recA" },
      { title: "Country Club Roma", recordid: "recB" },
      { title: "Golf Club Torino", recordid: "recC" },
      { title: "Royal Golf Napoli", recordid: "recD" },
      { title: "Golf Club Firenze", recordid: "recE" },
      { title: "Venezia Golf Resort", recordid: "recF" },
      { title: "Bologna Golf Club", recordid: "recG" },
      { title: "Palermo Country Club", recordid: "recH" },
    ],
    availableYears: availableYears,
  }

  const [initialData, setInitialData] = useState<InitialResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT,
  )
  const [availableClubs, setAvailableClubs] = useState<Club[]>(isDev ? responseDataDEV.availableClubs : [])

  // Stato iniziale per il reset
  const initialFilters = useRef<FilterState>({
    selectedYears: [],
    showTotalAverage: false,
    averageExcludeNoSharing: false,
    numericFilters: [],
    demographicFilters: [],
    selectedClubs: [],
  })

  useEffect(() => {
    if (!initialLoadComplete.current) {
      initialFilters.current = { ...filters }
    }
  }, [])

  // --- CHIAMATE API ---

  const initialPayload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_benchmark_filters", // Ora restituisce tutti i filtri in una sola chiamata
    }
  }, [])

  // Chiamata API INIZIALE (solo al mount)
	const { response, loading, error } = !isDev && initialPayload ? useApi<InitialResponseInterface>(initialPayload) : { response: null, loading: false, error: null };
  useEffect(() => {
    if (!isDev && response) {
      setInitialData(response)
      setAvailableClubs(response.availableClubs || [])
      initialLoadComplete.current = true
    } else if (isDev) {
      initialLoadComplete.current = true
    }
  }, [response])

  // Rimossa useEffect per demographicResponse

  const fetchFilteredClubs = useCallback(
    async (currentFilters: {
      numericFilters: NumericFilter[]
      selectedYears: string[]
      demographicFilters: DemographicFilter[]
    }) => {
      if (isDev) {
        console.log("DEV MODE: Simulating API call with filters:", currentFilters)
        setAvailableClubs([
          { title: "Club Filtrato 1", recordid: "recF1" },
          { title: "Club Filtrato 2", recordid: "recF2" },
        ])
        return
      }

      setIsUpdatingClubs(true)
      try {
        const apiResponse = await axiosInstanceClient.post(
          "/postApi",
          {
            apiRoute: "get_filtered_clubs",
            filters: currentFilters,
          },
          {
            headers: {
              Authorization: `Bearer a_mock_token_for_testing`,
            },
          },
        )

        const data: FilteredClubsResponse = apiResponse.data
        setAvailableClubs(data.availableClubs || [])
      } catch (err) {
        console.error("Failed to fetch filtered clubs:", err)
        setAvailableClubs([])
      } finally {
        setIsUpdatingClubs(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (availableClubs.length > 0) {
      onFiltersChange({ ...filters, selectedClubs: availableClubs[0].recordid ? [availableClubs[0].recordid] : [] })
    }
  }, [availableClubs])

  useEffect(() => {
    if (availableClubs.length > 0) {
      onFiltersChange({ ...filters, selectedClubs: [] })
    }
  }, [initialData.availableClubs])

  useEffect(() => {
    if (!initialLoadComplete.current) {
      return
    }

    const handler = setTimeout(() => {
      fetchFilteredClubs({
        numericFilters: filters.numericFilters,
        selectedYears: filters.selectedYears,
        demographicFilters: filters.demographicFilters,
      })
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [filters.numericFilters, filters.demographicFilters])

  // --- DATI DERIVATI E MEMOIZZATI ---

  const availableFilterOptions = useMemo(
    () =>
      initialData.filterOptionsNumbers.filter(
        (option) => !filters.numericFilters.some((f) => f.field === option.field),
      ),
    [initialData.filterOptionsNumbers, filters.numericFilters],
  )

  const isDemographicFilterVisible = (field: string) => {
    if (visibleFilters.demographicFilters === true) return true
    if (typeof visibleFilters.demographicFilters === 'object') {
      return visibleFilters.demographicFilters[field as keyof typeof visibleFilters.demographicFilters] === true
    }
    return false
  }

  const availableDemographicOptions = useMemo(
    () =>
      DEMOGRAPHIC_FILTER_OPTIONS.filter((option) => 
        !filters.demographicFilters.some((f) => f.field === option.field) &&
        isDemographicFilterVisible(option.field)
      ).map(option => {
        return option
      }),
    [filters.demographicFilters, visibleFilters],
  )

  const [filterSearchQuery, setFilterSearchQuery] = useState("")
  const filteredFilterOptions = useMemo(() => {
    if (!filterSearchQuery.trim()) return availableFilterOptions
    const query = filterSearchQuery.toLowerCase()
    return availableFilterOptions.filter((opt) => opt.label.toLowerCase().includes(query))
  }, [availableFilterOptions, filterSearchQuery])

  const [demographicSearchQuery, setDemographicSearchQuery] = useState("")
  const filteredDemographicOptions = useMemo(() => {
    if (!demographicSearchQuery.trim()) return availableDemographicOptions
    const query = demographicSearchQuery.toLowerCase()
    return availableDemographicOptions.filter((opt) => opt.label.toLowerCase().includes(query))
  }, [availableDemographicOptions, demographicSearchQuery])

  const filteredClubs = useMemo(() => {
    if (!clubSearchQuery.trim()) return availableClubs
    const query = clubSearchQuery.toLowerCase()
    return availableClubs.filter((club) => club.title.toLowerCase().includes(query))
  }, [availableClubs, clubSearchQuery])

  // --- GESTORI DI EVENTI (Handlers) ---

  const handleCheckboxChange = (field: keyof FilterState, checked: boolean) => {
    onFiltersChange({ ...filters, [field]: checked })
  }

  const handleClubToggle = (clubId: string) => {
    const newClubs = filters.selectedClubs.includes(clubId)
      ? filters.selectedClubs.filter((id) => id !== clubId)
      : [...filters.selectedClubs, clubId]
    onFiltersChange({ ...filters, selectedClubs: newClubs })
  }

  const handleYearToggle = (year: string) => {
    const newYears = filters.selectedYears.includes(year)
      ? filters.selectedYears.filter((y) => y !== year)
      : [...filters.selectedYears, year]
    onFiltersChange({ ...filters, selectedYears: newYears })
  }

  const handleAddNumericFilter = (field: string) => {
    const filterOption = initialData.filterOptionsNumbers.find((f) => f.field === field)
    if (!filterOption) return

    const newFilter: NumericFilter = {
      field,
      label: filterOption.label,
      operator: ">=",
      value: 0,
    }

    onFiltersChange({
      ...filters,
      numericFilters: [...filters.numericFilters, newFilter],
    })

    setShowAddFilterMenu(false)
  }

  const handleAddDemographicFilter = (field: string) => {
    const filterOption = DEMOGRAPHIC_FILTER_OPTIONS.find((f) => f.field === field)
    if (!filterOption) return

    let newFilter: DemographicFilter

    switch (filterOption.type) {
      case "number":
      case "distance":
        newFilter = {
          field,
          label: filterOption.label,
          type: filterOption.type,
          operator: ">=",
          value: 0,
        }
        break
      case "toggle":
        newFilter = {
          field,
          label: filterOption.label,
          type: "toggle",
          value: false,
        }
        break
      case "select":
        const options = filterOption.options
        newFilter = {
          field,
          label: filterOption.label,
          type: "select",
          value: options?.[0] || "",
          options: options,
        }
        break
    }

    onFiltersChange({
      ...filters,
      demographicFilters: [...filters.demographicFilters, newFilter],
    })

    setShowAddDemographicFilterMenu(false)
  }

  const handleRemoveNumericFilter = (field: string) => {
    onFiltersChange({
      ...filters,
      numericFilters: filters.numericFilters.filter((f) => f.field !== field),
    })
  }

  const handleRemoveDemographicFilter = (field: string) => {
    onFiltersChange({
      ...filters,
      demographicFilters: filters.demographicFilters.filter((f) => f.field !== field),
    })
  }

  const handleNumericFilterChange = (field: string, key: "operator" | "value", value: string | number) => {
    onFiltersChange({
      ...filters,
      numericFilters: filters.numericFilters.map((filter) =>
        filter.field === field ? { ...filter, [key]: value } : filter,
      ),
    })
  }

  const handleDemographicFilterChange = (
    field: string,
    key: "operator" | "value",
    value: string | number | boolean,
  ) => {
    onFiltersChange({
      ...filters,
      demographicFilters: filters.demographicFilters.map((filter) =>
        filter.field === field ? { ...filter, [key]: value } : filter,
      ),
    })
  }

  const handleDistanceFilterChange = (distance: number) => {
    setDistanceFilter(distance)
    // Qui puoi aggiungere logica per filtrare i club in base alla distanza
    // Per ora lo salviamo solo nello stato locale
  }

  const handleResetFilters = () => {
    onFiltersChange(initialFilters.current)
    setClubSearchQuery("")
    setDistanceFilter(0) // Resetta anche il filtro distanza
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.selectedYears.length > 0) count++
    if (filters.showTotalAverage) count++
    if (filters.numericFilters.length > 0) count += filters.numericFilters.length
    if (filters.demographicFilters.length > 0) count += filters.demographicFilters.length
    if (filters.selectedClubs.length > 0) count++
    if (distanceFilter > 0) count++ // Conta anche il filtro distanza se attivo
    return count
  }, [filters, distanceFilter])

  return (
    <>
      <button
        onClick={() => setIsCollapsed(false)}
        className={`flex items-center w-full sm:w-auto justify-center transition-colors duration-200 text-white bg-[#2dad6e] hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-md text-sm px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2dad6e] disabled:focus:ring-0`}
        aria-label="Apri filtri"
        disabled={!isCollapsed}
      >
        <Filter className="h-5 w-5 mr-2" />
        <span>{"Filtri"}</span>
        {activeFiltersCount > 0 && (
          <span className="bg-white text-[#2dad6e] text-xs font-bold px-2 py-0.5 rounded-full ml-2">
            {activeFiltersCount}
          </span>
        )}
        <ChevronRight className="h-5 w-5 ml-1" />
      </button>
      <GenericComponent response={initialData} loading={loading} error={error}>
        {(response: InitialResponseInterface) => (
          <>
            <div
              className={`fixed left-0 top-14 lg:top-[200px] w-screen lg:w-5/12 h-[calc(100vh-2rem)] lg:h-2/3 bg-white shadow-2xl border-r border-gray-200 transition-all duration-500 ease-in-out z-40 ${
                isCollapsed ? "-translate-x-full" : `translate-x-0 ${translateClass}`
              } w-[640px]`}
            >
              <div className="h-full overflow-y-auto">
                <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-50 sticky top-0 z-10 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{"Filtri"}</h2>
                      {activeFiltersCount > 0 && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {activeFiltersCount} {activeFiltersCount !== 1 ? "filtri attivi" : "filtro attivo"} 
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetFilters}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
                        aria-label="Reset filtri"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {"Reset"}
                      </button>
                      <button
                        onClick={() => setIsCollapsed(true)}
                        className="flex items-center justify-center p-2 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all duration-200 shadow-sm hover:shadow"
                        aria-label="Chiudi filtri"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  {visibleFilters.years && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{"Anni di riferimento"}</h3>
                        {filters.selectedYears.length > 0 && (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                            {filters.selectedYears.length}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {(response.availableYears || availableYears).map((year) => (
                          <label
                            key={year}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                              filters.selectedYears.includes(year)
                                ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={filters.selectedYears.includes(year)}
                              onChange={() => handleYearToggle(year)}
                              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                            />
                            <span
                              className={`text-sm font-semibold ${
                                filters.selectedYears.includes(year) ? "text-emerald-700" : "text-gray-700"
                              }`}
                            >
                              {year}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {visibleFilters.average && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-800">{"Opzioni Media"}</h3>
                      <label
                        className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                          filters.showTotalAverage
                            ? "bg-emerald-50 border-emerald-500 shadow-sm"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id="showTotalAverage"
                          checked={filters.showTotalAverage}
                          onChange={(e) => handleCheckboxChange("showTotalAverage", e.target.checked)}
                          className="h-5 w-5 mt-0.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span
                            className={`text-sm font-semibold block ${
                              filters.showTotalAverage ? "text-emerald-700" : "text-gray-700"
                            }`}
                          >
                            {"Mostra media totale"}
                          </span>
                          <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                            {"La media complessiva viene calcolata su tutti i club che rispettano i filtri selezionati"}
                          </span>
                        </div>
                      </label>
                    </div>
                  )}

                  {visibleFilters.numericFilters && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{"Filtri Numerici"}</h3>
                        {filters.numericFilters.length > 0 && (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                            {filters.numericFilters.length}
                          </span>
                        )}
                      </div>

                      {filters.numericFilters.length > 0 && (
                        <div className="space-y-3">
                          {filters.numericFilters.map((filter) => (
                            <div
                              key={filter.field}
                              className="flex flex-col gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm text-gray-800">{filter.label}</span>
                                <button
                                  onClick={() => handleRemoveNumericFilter(filter.field)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  aria-label={`Rimuovi filtro ${filter.label}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <select
                                  value={filter.operator}
                                  onChange={(e) =>
                                    handleNumericFilterChange(filter.field, "operator", e.target.value as ">=" | "<=")
                                  }
                                  className="block w-full px-3 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                  <option value=">=">≥ Maggiore o uguale</option>
                                  <option value="<=">≤ Minore o uguale</option>
                                </select>
                                <input
                                  type="number"
                                  placeholder="Valore"
                                  value={filter.value}
                                  onChange={(e) =>
                                    handleNumericFilterChange(filter.field, "value", e.target.value === "" ? "" : Number(e.target.value))
                                  }
                                  className="block w-full px-3 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <button
                          onClick={() => setShowAddFilterMenu(!showAddFilterMenu)}
                          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200 w-full shadow-sm"
                          disabled={availableFilterOptions.length === 0}
                        >
                          <Plus className="h-5 w-5" />
                          {"Aggiungi Filtro Numerico"}
                        </button>

                        {showAddFilterMenu && availableFilterOptions.length > 0 && (
                          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-10 border-2 border-gray-200 max-h-72 overflow-hidden flex flex-col">
                            <div className="relative p-2 border-b border-gray-200">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Cerca filtro..."
                                value={filterSearchQuery}
                                onChange={(e) => setFilterSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 text-sm font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>

                            <div className="overflow-y-auto">
                              {filteredFilterOptions.length > 0 ? (
                                filteredFilterOptions.map((option) => (
                                  <button
                                    key={option.field}
                                    onClick={() => handleAddNumericFilter(option.field)}
                                    className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl"
                                  >
                                    {option.label}
                                  </button>
                                ))
                              ) : (
                                <p className="text-gray-500 text-sm text-center py-3 font-medium">
                                  Nessun filtro trovato
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {visibleFilters.demographicFilters && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{"Filtri Anagrafici"}</h3>
                        {filters.demographicFilters.length > 0 && (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                            {filters.demographicFilters.length}
                          </span>
                        )}
                      </div>

                      {filters.demographicFilters.length > 0 && (
                        <div className="space-y-3">
                          {filters.demographicFilters.map((filter) => (
                            <div
                              key={filter.field}
                              className={`flex flex-col gap-3 p-4 rounded-xl border-2 transition-all duration-200 shadow-sm ${
                                filter.type === "distance"
                                  ? "bg-blue-50 border-blue-200 hover:border-blue-300"
                                  : "bg-white border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`font-semibold text-sm ${
                                    filter.type === "distance" ? "text-blue-800" : "text-gray-800"
                                  }`}
                                >
                                  {filter.label}
                                </span>
                                <button
                                  onClick={() => handleRemoveDemographicFilter(filter.field)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  aria-label={`Rimuovi filtro ${filter.label}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              {(filter.type === "number" || filter.type === "distance") && (
                                <div className="grid grid-cols-2 gap-3">
                                  <select
                                    value={filter.operator}
                                    onChange={(e) =>
                                      handleDemographicFilterChange(
                                        filter.field,
                                        "operator",
                                        e.target.value as ">=" | "<=",
                                      )
                                    }
                                    className="block w-full px-3 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                  >
                                    <option value=">=">≥ Maggiore o uguale</option>
                                    <option value="<=">≤ Minore o uguale</option>
                                  </select>
                                  <input
                                    type="number"
                                    placeholder="Valore"
                                    value={filter.value as number}
                                    onChange={(e) =>
                                      handleDemographicFilterChange(filter.field, "value", e.target.value ==="" ? "" : Number(e.target.value))
                                    }
                                    className="block w-full px-3 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  />
                                </div>
                              )}

                              {filter.type === "select" && (
                                <select
                                  value={filter.value as string}
                                  onChange={(e) => handleDemographicFilterChange(filter.field, "value", e.target.value)}
                                  className="block w-full px-3 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                  {filter.options?.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {filter.type === "toggle" && (
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      checked={filter.value as boolean}
                                      onChange={(e) =>
                                        handleDemographicFilterChange(filter.field, "value", e.target.checked)
                                      }
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">
                                    {filter.value ? "Sì" : "No"}
                                  </span>
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <button
                          onClick={() => setShowAddDemographicFilterMenu(!showAddDemographicFilterMenu)}
                          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200 w-full shadow-sm"
                          disabled={availableDemographicOptions.length === 0}
                        >
                          <Plus className="h-5 w-5" />
                          {"Aggiungi Filtro Anagrafico"}
                        </button>

                        {showAddDemographicFilterMenu && availableDemographicOptions.length > 0 && (
                          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-10 border-2 border-gray-200 max-h-72 overflow-hidden flex flex-col">
                            <div className="relative p-2 border-b border-gray-200">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Cerca filtro..."
                                value={demographicSearchQuery}
                                onChange={(e) => setDemographicSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 text-sm font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>

                            <div className="overflow-y-auto">
                              {availableDemographicOptions
                                .filter((opt) =>
                                  demographicSearchQuery
                                    ? opt.label.toLowerCase().includes(demographicSearchQuery.toLowerCase())
                                    : true,
                                )
                                .map((option) => (
                                  <button
                                    key={option.field}
                                    onClick={() => handleAddDemographicFilter(option.field)}
                                    className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl"
                                  >
                                    {option.label}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {visibleFilters.clubs && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-800">{"Visualizza Dettagli Club"}</h3>
                          {filters.selectedClubs.length > 0 && (
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                              {filters.selectedClubs.length}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {"Selezionabili solo i club che consentono la condivisione per i filtri applicati"}
                        </p>
                      </div>

                      {availableClubs.length > 5 && (
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder={"Cerca club ..."}
                            value={clubSearchQuery}
                            onChange={(e) => setClubSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                          />
                        </div>
                      )}

                      <div className="border-2 border-gray-200 rounded-xl bg-white shadow-sm p-4">
                        {isUpdatingClubs ? (
                          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-12">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                            <span className="font-medium">{"Aggiornamento club ..."}</span>
                          </div>
                        ) : filteredClubs.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {filteredClubs.map((club) => (
                              <button
                                key={club.recordid}
                                onClick={() => handleClubToggle(club.recordid)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                                  filters.selectedClubs.includes(club.recordid)
                                    ? "bg-emerald-500 text-white border-emerald-600 shadow-md hover:bg-emerald-600 hover:shadow-lg"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                                } flex items-center gap-2`}
                              >
                                {club.logo && (
                                  <img
                                    src={`/api/media-proxy?url=${club.logo}`}
                                    alt={`${club.title} logo`}
                                    className="h-8 w-auto rounded-md object-contain"
                                  />
                                )}
                                <span>{club.title}</span>
                              </button>
                            ))}
                          </div>
                        ) : clubSearchQuery ? (
                          <p className="text-gray-500 text-sm text-center py-12 font-medium">
                            {"Nessun club trovato per " + clubSearchQuery}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-12 font-medium">
                            {"Nessun club disponibile per i filtri selezionati"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isCollapsed && (
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
                onClick={() => setIsCollapsed(true)}
              />
            )}
          </>
        )}
      </GenericComponent>
    </>
  )
}