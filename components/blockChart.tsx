"use client"

import { useState } from "react"
import { ArrowLeftRight, ChartBar, ChartLine, Eye, EyeOff, FileDown, ImageDown, Table, TableProperties, Tags, Trash2 } from "lucide-react"
import ValueChart, {ChartDataInterface as IValueChartData} from "./charts/valueChart"
import GenericApexChart from "./charts/genericApexChart"
import "./blockChart.css"
import OverlayBarChart, {ChartDataInterface as IMultiChartData} from "./charts/multiBarChart"
import ApexCharts from "apexcharts";
import ButtonChart, {ChartDataInterface as IButtonChartData} from "./charts/buttonChart";
import TableChart, {ChartDataInterface as ITableChartData} from "./charts/tableChart";

interface Props {
  id: number
  name: string
  type: string
  chart_data: string
  onDelete: (id: number) => void
  onExport: (id: number) => void
}

interface ChartDataInterface {
    id: number;
    name: string;
    layout: string;
    labels: string[];
    datasets: Dataset[];
    datasets2?: Dataset[] | Dataset;
    colors?: string[];
}

interface Dataset {
    label: string;
    data: number[] | { x: string; y: number }[];
}

export const getDefaultShowDataLabels = (chartType: string): boolean => {
    const showByDefault = ["piechart", "donutchart", "polarchart", "heatchart", "orizbarchart", "multibarchart"]
    return showByDefault.includes(chartType.toLowerCase())
}

export const supportsDataLabelsToggle = (chartType: string): boolean => {
    const noToggle = ["piechart", "donutchart", "polarchart", "heatchart", "value", "table", "button"]
    return !noToggle.includes(chartType.toLowerCase())
}
export const getDefaultHideMetaLabels = (chartType: string): boolean => {
    const showByDefault = [""]
    return showByDefault.includes(chartType.toLowerCase())
}

export const supportsHideMetaToggle = (chartType: string): boolean => {
    const noToggle = [ "table", "button"]
    return !noToggle.includes(chartType.toLowerCase())
}

export default function BlockChart({ id, name, type, chart_data, onDelete, onExport }: Props) {
  
  const [view, setView] = useState<"chart" | "table">("chart")
  const [showDataLabels, setShowDataLabels] = useState(() => getDefaultShowDataLabels(type))
  const [hideMeta, setHideMeta] = useState(() => getDefaultHideMetaLabels(type))

  let parsed: ChartDataInterface | null = null;
  try {
      parsed = JSON.parse(chart_data);
  } catch (e) {
      console.error('Errore durante il parsing dei dati del grafico:', e);
      parsed = null;
  }

  const renderChartComponent = (chartType: string, chartData: ChartDataInterface | null) => {
    switch (chartType.toLowerCase()) {
      case "value":
        return <ValueChart chartType={chartType} chartData={chartData as IValueChartData} hideData={hideMeta} />
      case 'button':
        return <ButtonChart chartType={chartType} chartData={chartData as IButtonChartData} view="chart" />;
      case 'table':
        return <TableChart chartType={chartType} chartData={chartData as ITableChartData} view="chart" />;
      case "multibarchart":
        return <OverlayBarChart chartData={chartData as IMultiChartData} colors={chartData?.colors} graphicOnly={hideMeta} showDataLabels={showDataLabels} />
      default:
        return (
          <GenericApexChart chartType={chartType} chartData={chartData ?? null} view="chart" hideMeta={hideMeta} showDataLabels={showDataLabels} />
        )
    }
  }

  const handleExportPNG = async () => {
    if (!parsed?.id) return;

    const chartId = `chart-${parsed.id}`;
    console.log("Exporting chart", chartId);

    try {
        const data = await ApexCharts.exec(chartId, "dataURI");

        if (!data || !data.imgURI) {
            console.error("dataURI is undefined:", data);
            return;
        }

        const link = document.createElement("a");
        link.href = data.imgURI;
        link.download = `${name}.png`;
        link.click();
    } catch (e) {
        console.error("Errore export:", e);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-md flex flex-col overflow-hidden border border-gray-200">
      {/* HEADER in stile WeGolf */}
      <div className="bg-gray-100 flex flex-col">
        {/* Riga 1 — barra comandi */}
        <div className="flex justify-end items-center px-3 py-1.5 sm:py-2 border-b border-gray-200 bg-gray-100  not-print-header">

          {supportsHideMetaToggle(type) && (
            <button
            onClick={() => setHideMeta(!hideMeta)}
            className={`p-2 rounded-md transition-colors ${
              hideMeta ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600 hover:bg-gray-200"
            }`}
            title={hideMeta ? 'Nascondi dati' : 'Mostra dati'}
            >
              {hideMeta ? <EyeOff className="w-5 h-5 transition-all" /> : <Eye className="w-5 h-5 transition-all" />}
            </button>
          )}
          {supportsDataLabelsToggle(type) && (
            <button
              onClick={() => setShowDataLabels(!showDataLabels)}
              className={`p-2 rounded-md transition-all duration-200
                ${
                  showDataLabels
                    ? "text-blue-600 bg-blue-50 shadow-sm"
                    : "text-gray-400 hover:text-blue-600 hover:bg-gray-200 hover:shadow-sm"
                }
              `}
              title={
                showDataLabels
                  ? "Nascondi valori"
                  : "Mostra valori"
              }
            >
              <div
                className="w-5 h-5 flex items-center justify-center transition-all"
              >
                <Tags className="w-5 h-5" />
              </div>
            </button>
          )}

          {/* --- Dropdown Download --- */}
          <div className="relative group">
            <button
              className="p-2 rounded-md text-gray-500 hover:text-green-600 hover:bg-gray-200 transition-colors flex items-center"
              title={'Scarica'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <svg
                className="w-4 h-4 ml-1 text-gray-500 group-hover:text-green-600 transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            <div className="absolute right-0 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                onClick={handleExportPNG}
                className="w-full px-4 py-2 text-left text-gray-500 hover:text-green-600 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <ImageDown className="w-4 h-4"/>
                PNG
              </button>

              <button
                onClick={() => onExport(id)}
                className="w-full px-4 py-2 text-left text-gray-500 hover:text-green-600 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <FileDown className="w-4 h-4"/>
                Excel
              </button>
            </div>
          </div>

          <button
            onClick={() => onDelete(id)}
            className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-200 transition-colors"
            title={'Elimina'}
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setView(view === "chart" ? "table" : "chart")}
            className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-200 transition-colors"
            title={'Cambia vista'}
          >
            {view === "chart" ? 
            <TableProperties className="w-5 h-5" />
            : <ChartLine className="w-5 h-5" /> }
          </button>
        </div>

        {/* Riga 2 — titolo su una o più righe */}
        <div className="px-4 py-2 bg-white">
          <h4 className="text-base sm:text-lg font-semibold text-gray-700 leading-snug break-words">
            {name}
          </h4>
        </div>
      </div>

      {/* CONTENUTO */}
      <div className="chart-container flex-grow relative">
        <div className={`flipper ${view === "table" ? "is-flipped" : ""}`}>
          <div className="front p-4">{renderChartComponent(type, parsed)}</div>
          <div className="back p-4">
            <div className="keep-upright">
              <GenericApexChart chartType={type} chartData={parsed} view="table" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}