"use client"

// src/components/ValueChart.tsx

import { useContext, useEffect, useMemo, useState } from "react"
import DynamicMenuItem from "../dynamicMenuItem"
import { ImageIcon, X } from "lucide-react"
import { createPortal } from "react-dom"
import { useRecordsStore } from "../records/recordsStore"
import { AppContext } from "@/context/appContext"

export type CustomFunction = {
  tableid: string
  context: string
  title: string
  function: string
  conditions?: any
  params?: any
  css?: string
}

interface Dataset {
  label: string
  data: number[]
  fn?: CustomFunction
  tableid?: string
  image?: string
}

export interface ChartDataInterface {
  id: number
  name: string
  layout: string
  labels: string[]
  datasets: Dataset[]
}

interface Props {
  chartType: string
  chartData: ChartDataInterface
  view: "chart" | "table"
  activeServer?: string
}

export default function ButtonChart({ chartData, view, activeServer }: Props) {
  const [errorImage, setErrorImage] = useState<Record<number, boolean>>({})
  const [showJumpScare, setShowJumpScare] = useState(false)

  const handleImageClick = () => {
    if (activeServer !== "swissbix") return
    setShowJumpScare(true)
    const audio = new Audio("/api/media-proxy?url=audio/sium.mp3")
    audio.volume = 0.5
    audio.play().catch((err) => console.error("Errore riproduzione audio:", err))
  }

  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return <div className="p-4 text-gray-500">Nessun dato disponibile</div>;
  }
  const firstDataset = chartData.datasets[0]
  if (!firstDataset?.fn) {
    return <div className="p-4 text-gray-500">Nessun dato disponibile</div>;
  }

  const computedTitle = useMemo(() => {
    if (!firstDataset.fn) return ""

    if (firstDataset.fn.context === "table") {
      return `${firstDataset.fn.title} ${firstDataset.tableid ?? ""}`
    }

    return firstDataset.fn.title
  }, [firstDataset.fn, firstDataset.tableid])


  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="group relative w-full flex items-center p-1 pr-6 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/10 hover:border-accent active:scale-95">
        {/* Area Icona / Immagine */}
        <div
          className="relative flex items-center justify-center w-14 h-14 m-1 rounded-xl bg-slate-50 group-hover:bg-accent transition-colors duration-300 overflow-hidden cursor-pointer"
          onClick={handleImageClick}
        >
          {firstDataset.image && !errorImage[0] ? (
            <img
              src={`/api/media-proxy?url=${firstDataset.image}`}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              onError={() => setErrorImage((prev) => ({ ...prev, [0]: true }))}
            />
          ) : (
            <ImageIcon className="w-7 h-7 text-slate-300 group-hover:text-accent" />
          )}
        </div>

        {/* Area Bottone Dinamico */}
        <div className="ml-4 flex flex-col flex-1 justify-center">
          <div
            className="
            [&_*]:!border-0 
            [&_button]:!bg-transparent 
            [&_button]:!p-0 
            [&_button]:!m-0
            [&_button]:text-2xl 
            [&_button]:font-black 
            [&_button]:tracking-tight
            [&_button]:text-slate-800
            group-hover:[&_button]:text-accent600
            transition-colors
          "
          >
            <DynamicMenuItem
              key={computedTitle}
              fn={{
                ...firstDataset.fn,
                title: computedTitle,
              }}
              params={{
                tableid: firstDataset.tableid,
                ...(typeof firstDataset.fn.params === "object" ? firstDataset.fn.params : {}),
              }}
            />
          </div>

          {/* Sottolineatura decorativa che appare all'hover */}
          <div className="h-1 w-0 group-hover:w-full bg-accent rounded-full transition-all duration-300 mt-0.5" />
        </div>

        {/* Effetto Glow di sfondo opzionale */}
        <div className="absolute -z-10 inset-0 bg-slate-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity rounded-2xl" />
      </div>

      {showJumpScare && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center animate-in fade-in duration-100"
          style={{ width: '100vw', height: '100vh' }} // Forza dimensioni viewport
          onClick={() => setShowJumpScare(false)}
        >
          <button
            className="absolute top-4 right-4 z-[10000] ..."
            onClick={() => setShowJumpScare(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in duration-300">
            <img src="/api/media-proxy?url=audio/sium.jpg" className="max-w-full h-full object-contain" />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="text-9xl font-black text-red-600 animate-pulse ...">
                SIUUUMM!
              </h1>
            </div>
          </div>
        </div>,
        document.body // Destinazione del portale
      )}
    </div>
  )
}
