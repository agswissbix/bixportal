"use client"

import { useMemo, useContext, useState, useEffect } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "../genericComponent"
import { AppContext } from "@/context/appContext"
import {
  UserCircle2,
  ChevronDown,
  Calendar,
  Clock,
  Building2,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { useRecordsStore } from "../records/recordsStore"

const isDev = false

interface PropsInterface {
  tableid?: string
  recordid?: string
  type?: string
}

interface ResponseInterface {
  badgeItems: {
    service: string
    date: string
    description: string
    project_name: string
    user_name: string
    company_name: string
    total_worktime: number
    validated: string
    user_photo: string
    company_id: string,
    project_id: string,
  }
}

export default function CardBadgeTimesheet({ tableid, recordid }: PropsInterface) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { handleRowClick } = useRecordsStore()

  const responseDataDEFAULT: ResponseInterface = {
    badgeItems: {
      service: "",
      date: "",
      description: "",
      project_name: "",
      user_name: "",
      company_name: "",
      total_worktime: 0,
      validated: "No",
      user_photo: "",
      company_id: "",
      project_id: "",
    },
  }

  const responseDataDEV: ResponseInterface = {
    badgeItems: {
      service: "Sviluppo Software",
      date: "2024-01-15",
      description:
        "Implementazione nuove funzionalità per il modulo di gestione clienti e ottimizzazione delle performance del database",
      project_name: "Progetto CRM Enterprise",
      user_name: "Mario Rossi",
      company_name: "Acme Corporation",
      total_worktime: 7.5,
      validated: "Yes",
      user_photo: "/bixdata/users/avatar.jpg",
      company_id: "comp_123",
      project_id: "proj_456",
    },
  }

  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT)

  const payload = useMemo(() => {
    if (isDev) return null
    return {
      apiRoute: "get_record_badge_swissbix_timesheet",
      tableid: tableid,
      recordid: recordid,
    }
  }, [tableid, recordid])

  const { response, loading, error } = useApi<ResponseInterface>(payload)

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response)
    }
  }, [response, responseData])

  // Format hours to "Xh Ym" format
  const formatHours = (decimal: number): string => {
    const hours = Math.floor(decimal)
    const minutes = Math.round((decimal - hours) * 60)
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  // Format date to Italian format
  const formatDate = (dateString: string): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const totalWorktime = responseData.badgeItems.total_worktime || 0
  const isValidated = responseData.badgeItems.validated === "Si"
  const progressPercentage = Math.min((totalWorktime / 8) * 100, 100)

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Timesheet Badge">
      {(response: ResponseInterface) => (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="flex-1 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-800">{response.badgeItems.service || "Servizio"}</h2>

              <div className="flex items-center gap-3">
                {/* Validation Badge */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    isValidated ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isValidated ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Validato</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Da validare</span>
                    </>
                  )}
                </div>

                {/* User Photo */}
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {response.badgeItems.user_photo ? (
                      <img
                        src={`/api/media-proxy?url=userProfilePic/${response.badgeItems.user_photo}.png`}
                        alt="User"
                        className="w-8 h-8 rounded-full object-cover"
                        draggable={false}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = `/api/media-proxy?url=userProfilePic/default.jpg`
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircle2 className="text-gray-500 w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{response.badgeItems.user_name || "Utente"}</span>
                </div>
              </div>
            </div>

            <div
              className={`text-gray-600 transform transition-transform duration-200 ml-2 ${
                isCollapsed ? "rotate-180" : "rotate-0"
              }`}
            >
              <ChevronDown />
            </div>
          </div>

          {/* Content */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isCollapsed ? "max-h-0" : "max-h-[600px]"
            }`}
          >
            <div className="p-4 pt-0">
              {/* Date and Hours */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  <div>
                    <div className="text-xs text-gray-500">Data</div>
                    <div className="text-base font-semibold text-gray-800">{formatDate(response.badgeItems.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end text-right">
                  <div>
                    <div className="text-xs text-gray-500">Ore Lavorate</div>
                    <div className="text-2xl font-bold text-accent">{formatHours(totalWorktime)}</div>
                  </div>
                  <Clock className="w-5 h-5 text-accent" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-gray-500">Progresso giornaliero</span>
                  <span className="font-semibold text-gray-700">{totalWorktime.toFixed(1)}h / 8h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Project and Company */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-2">
                  <FolderKanban className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-500 mb-0.5">Progetto</div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {response.badgeItems.project_name || "N/A"}
                      </div>
                      {response.badgeItems.project_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick("linked", response.badgeItems.project_id, "project")
                          }}
                          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Visualizza progetto"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500 hover:text-primary" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-500 mb-0.5">Azienda</div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {response.badgeItems.company_name || "N/A"}
                      </div>
                      {response.badgeItems.company_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick("linked", response.badgeItems.company_id, "company")
                          }}
                          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Visualizza azienda"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500 hover:text-primary" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {response.badgeItems.description && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1.5 font-medium">Descrizione</div>
                  <p className="text-sm text-gray-900 font-medium leading-relaxed">{response.badgeItems.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </GenericComponent>
  )
}
