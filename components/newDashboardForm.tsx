"use client"

import axiosInstanceClient from "@/utils/axiosInstanceClient"
import React from "react"
import { toast } from "sonner"
import { useMemo, useEffect } from "react"
import { useApi } from "@/utils/useApi"
import GenericComponent from "@/components/genericComponent"
import { AlertCircle } from "lucide-react"
import { useRecordsStore } from "./records/recordsStore"

const isDev = false

type PropsInterface = {
  category?: string
}

interface ResponseInterface {
  categories_dashboard: { value: string; label: string }[]
}

const mapCategories: Record<string, string> = {
  myoverview: "My Overview",
  benchmark: "Benchmark"
}

export default function DashboardForm({ category }: PropsInterface) {
  const [dashboardName, setDashboardName] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(false)


  const addDashboardBlock = async () => {

    if (isLoading) return
  setIsLoading(true)
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "new_dashboard",
          dashboard_name: dashboardName,
          category: category
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      if (response.data.success) {
        toast.success("Nuova dashboard creata con successo")
        setDashboardName("")
      }
    } catch (error) {
      console.error("Errore during il salvataggio della nuova dashboard", error)
      toast.error("Errore during il salvataggio della nuova dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const proceedWithoutCategory = () => {
    addDashboardBlock()
  }

  const categoryLabel = category && mapCategories[category] 
  ? mapCategories[category] 
  : category

  return (
    <GenericComponent>
      {(response: ResponseInterface) => (
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              {"Crea Nuova Dashboard"}
            </h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="dashboardName" className="block text-sm font-medium text-gray-700 mb-2">
                  {"Nome dashboard"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="dashboardName"
                  placeholder={"Inserisci il nome..."}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={addDashboardBlock}
                disabled={!dashboardName.trim() || isLoading}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    {"Creazione..."}
                  </span>
                ) : (
                  `Crea Dashboard in ${categoryLabel}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </GenericComponent>
  )
}