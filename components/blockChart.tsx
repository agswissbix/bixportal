import React, { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import BarChart2 from "./charts/barChart";
import PieChart2 from "./pieChart2"; // Importa PieChart2
import LineChart from "./lineChart2";
import DonutChart from "./donutChart2";
import HeatmapChart from "./heatChart2";
import OrizBarChart from "./orizbarChart2";
import PolarChart from "./polarChart2";
import RadarChart from "./radarChart2";
import ScatterChart from "./scatterChart2";
// import MultiBarLineChart from "./charts/multiBarLineChart";
// import MultiBarBarChart from "./charts/multi_barbarchart";
import "./blockChart.css";
// import ValueChart from "./valueChart";

interface Props {
  id: number;
  name: string;
  type: string;
  chart_data: string;
  onDelete: (id: number) => void;
  onExport: (id: number) => void;
}

export default function BlockChart({ id, name, type, chart_data, onDelete, onExport }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");

  // Funzione per renderizzare il componente grafico corretto
  const renderChartComponent = (chartType: string, chartData: string) => {
    switch (chartType) {
    case 'valore':
        return <ValueChart chartType={chartType} chartData={chartData} view="chart" />;
      case 'barchart':
        return <BarChart2 chartType={chartType} chartData={chartData} view="chart" />;
      case 'piechart':
        return <PieChart2 chartType={chartType} chartData={chartData} view="chart" />;
      case 'linechart':
        return <LineChart chartType={chartType} chartData={chartData} view="chart" />;
      case 'donutchart':
        return <DonutChart chartType={chartType} chartData={chartData} view="chart" />;
      case 'heatchart':
        return <HeatmapChart chartType={chartType} chartData={chartData} view="chart" />;
      case 'orizbarchart':
        return <OrizBarChart chartType={chartType} chartData={chartData} view="chart" />;
      case 'polarchart':
        return <PolarChart chartType={chartType} chartData={chartData} view="chart" />;
      case 'radarchart':
        return <RadarChart chartType={chartType} chartData={chartData} view="chart" />;
      case 'scatterchart':
        return <ScatterChart chartType={chartType} chartData={chartData} view="chart" />;
      case 'multiBarLineChart':
        return <MultiBarLineChart chartType={chartType} chartData={chartData} view="chart" />;
      case 'multi_barbarchart':
        return <MultiBarBarChart chartType={chartType} chartData={chartData} view="chart" />;
      default:
        return <div className="p-4 text-red-500">Tipo di grafico non supportato: {chartType}</div>;
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex justify-between items-center flex-shrink-0 border-b">
        <h4 className="text-lg font-semibold text-gray-700">{name}</h4>
        <div className="flex space-x-2">
          {/* ... (buttons) ... */}
          <button
            onClick={() => onExport(id)}
            className="p-2 text-gray-500 hover:text-green-600"
            title="Scarica Excel"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-2 text-gray-500 hover:text-red-600"
            title="Elimina"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={() => setView(view === "chart" ? "table" : "chart")}
            className="p-2 text-gray-500 hover:text-blue-600"
            title="Switch View"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenuto con effetto flip */}
      <div className="chart-container flex-grow relative">
        <div className={`flipper ${view === "table" ? "is-flipped" : ""}`}>
          {/* Lato grafico */}
          <div className="front p-4">
            {renderChartComponent(type, chart_data)}
          </div>

          {/* Lato tabella */}
          <div className="back p-4">
            <div className="keep-upright">
              {/* Qui renderizziamo solo BarChart2 in modalità 'table', 
                  poiché è l'unico componente che gestisce la visualizzazione a tabella. */}
              <BarChart2 chartType={type} chartData={chart_data} view="table" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}