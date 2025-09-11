"use client"

import { useState, useEffect, useContext, useMemo } from "react"
import { useRecordsStore } from "./records/recordsStore"
import QuickFilters from "./quickFilters"
import TableFilters from "./TableFilters"
import RecordTabs from "./recordTabs"
import RecordCard from "./recordCard"
import GenericComponent from "./genericComponent"
import { PlusIcon, ArrowPathIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { toast } from "sonner"
import { AppContext } from "@/context/appContext"
import type { CustomFunction } from "./dynamicMenuItem"
import DynamicMenuItem from "./dynamicMenuItem"
import { useApi } from "@/utils/useApi"

const isDev = false;

// INTERFACCIA PROPS
interface PropsInterface {
  tableid: string
}

interface ResponseInterface {
  fn: CustomFunction[]
}

export default function StandardContent({ tableid }: PropsInterface) {
  const [recordid, setRecordid] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  const { refreshTable, setIsFiltersOpen, isFiltersOpen } = useRecordsStore() // Stato per il valore di ricerca

  const { cardsList, addCard, removeCard, resetCardsList, handleRowClick, searchTerm, tableView } = useRecordsStore() // Stato per il valore di ricerca

  const { activeServer } = useContext(AppContext)

  const { setRefreshTable } = useRecordsStore()

  const refreshTableFunc = () => setRefreshTable((v) => v + 1)

  const devPropExampleValue = isDev ? "Example prop" : tableid;
  const responseDataDEFAULT: ResponseInterface = {
    fn: []
  };
  const responseDataDEV: ResponseInterface = {
    fn: []
  };

  const { user } = useContext(AppContext);
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

  // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_custom_functions',
            tableid: tableid,
        };
    }, [tableid]);

  // CHIAMATA AL BACKEND (solo se non in sviluppo)
  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
      console.log("Custom functions loaded:", response);
    }
  }, [response, responseData]);

  // const handleCreaListaLavanderia = async (mese: string) => {
  //   try {
  //     const response = await axiosInstanceClient.post(
  //       "/postApi",
  //       {
  //         apiRoute: "crea_lista_lavanderie",
  //         mese: mese,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //       },
  //     )
  //     toast.success("Record creati")
  //   } catch (error) {
  //     console.error("Errore durante la creazione dei record", error)
  //     toast.error("Errore durante la creazione dei record")
  //   }
  // }

  // useEffect(() => {
  //   if (recordid) {
  //     resetCardsList() // Resetta le schede
  //     addCard(tableid, recordid, "standard") // Aggiungi la nuova scheda
  //   }
  // }, [recordid])

  const exportExcel = async () => {
    // crea un toast con dentro il componente LoadingComp e salva l'id
    const loadingToastId = toast.loading("Esportazione in corso...")
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "export_excel",
          tableid: tableid,
          searchTerm: searchTerm,
          view: tableView,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")

      // Estrai il filename dal header Content-Disposition
      const contentDisposition = response.headers["content-disposition"] || ""
      let filename = "export.xlsx"
      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i)
      if (match && match[1]) {
        filename = decodeURIComponent(match[1])
      }

      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)

      toast.dismiss(loadingToastId)
      toast.success("File Excel esportato con successo")
    } catch (error) {
      console.error("Errore durante l'esportazione in Excel", error)
      toast.dismiss(loadingToastId)
      toast.error("Errore durante l'esportazione in Excel")
    }
  }

  return (
    <GenericComponent title="standardContent" response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <div className="h-full w-full shadow-lg bg-records-background rounded-lg p-6">
          <div className="flex flex-wrap w-full mb-6 gap-4">
            <div className="flex-1 min-w-0">
              <QuickFilters></QuickFilters>
            </div>
            <div className="flex items-center gap-3">
              {activeServer !== "belotti" && (
                <>
                  <div className="relative">
                    <button
                      className="theme-secondary inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg 
                                focus:ring-2 focus:outline-none focus:ring-primary/20 transition-all duration-200 
                                shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      Funzioni
                      <svg
                        className="w-2.5 h-2.5 ms-3"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    </button>

                    {showDropdown && (
                      <div className="absolute left-0 mt-2 w-48 theme-card border rounded-lg shadow-lg z-50">
                        <ul className="py-2">
                          <li
                            className="px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors duration-150"
                            onClick={() => exportExcel()}
                          >
                            Esporta excel
                          </li>
                            {response?.fn?.map((fn, index) => (
                              fn.context === 'results' && (
                                <DynamicMenuItem key={fn.title} fn={fn}/>
                              )
                            ))}
                          {/* {tableid === "rendicontolavanderia" && (
                            <li
                              className="px-4 py-2 text-sm text-foreground hover:bg-muted cursor-pointer transition-colors duration-150"
                              onClick={() => handleCreaListaLavanderia("mesecorrente")}
                            >
                              Crea rendiconti lavanderia mese corrente
                            </li>
                          )} */}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
              <button
                type="button"
                className="theme-primary inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 
                          shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                onClick={() => handleRowClick("", "", tableid)}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nuovo
              </button>
              <button
                type="button"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-foreground 
                          bg-card-background border border-card-border rounded-lg hover:bg-muted 
                          focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 
                          shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                onClick={refreshTableFunc}
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Ricarica
              </button>
              <button
                type="button"
                className="theme-accent inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-200 
                          shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                onClick={() => exportExcel()}
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Esporta
              </button>
            </div>
          </div>

          {cardsList.map((card, index) => (
            <RecordCard
              key={`${card.tableid}-${card.recordid}`}
              tableid={card.tableid}
              recordid={card.recordid}
              mastertableid={card.mastertableid}
              masterrecordid={card.masterrecordid}
              index={index}
              total={cardsList.length}
              type={card.type}
            />
          ))}

          <div className="w-full h-11/12 flex gap-6 mb-4">
            {isFiltersOpen && (
              <div className="w-1/4 h-full flex flex-nowrap overflow-x-auto overflow-y-hidden theme-card border rounded-lg p-4">
                <TableFilters tableid={tableid}></TableFilters>
              </div>
            )}
            <div className="w-full h-full flex flex-nowrap overflow-x-auto overflow-y-hidden theme-card border rounded-lg p-4">
              <div className="w-full h-full">
                <RecordTabs tableid={tableid}></RecordTabs>
              </div>
            </div>
          </div>
        </div>
      )}
    </GenericComponent>
  )
}
