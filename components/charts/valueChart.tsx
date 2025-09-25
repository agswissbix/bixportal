// src/components/ValueChart.tsx

import React from 'react';

// --- DATI DI SVILUPPO ---
const isDev = true;
const devChartData = {
  id: 11,
  name: "Dati Sviluppo",
  layout: "valore",
  labels: ["2023", "2024", "2025"],
  datasets: [
    { label: "Totale soci", data: [80.0, 100.0, 1610.0], icona: "chart/prova.png" },
    { label: "Nuovi soci", data: [5.0, 10.0, 321.0] }
  ]
};

interface Dataset {
  label: string;
  data: number[];
  icona?: string;
}

interface ChartDataInterface {
  id: number;
  name: string;
  layout: string;
  labels: string[];
  datasets: Dataset[];
}

interface Props {
  chartType: string;
  chartData: string;
  view: "chart" | "table";
}

export default function ValueChart({ chartData, view }: Props) {
  let parsed: ChartDataInterface | null = null;
  try {
    parsed = JSON.parse(chartData);
  } catch (e) {
    console.error("Errore parsing dati:", e);
    return <div className="p-4 text-red-500">Dati non validi</div>;
  }

  // Prende l'ultimo indice disponibile
  const lastIndex = parsed?.labels.length! - 1;

  if (view === "table") {
    return (
      <div className="h-full overflow-y-auto p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2 text-center text-gray-700">{parsed?.name}</h3>
        <table className="min-w-full bg-white border border-gray-300 text-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="py-3 px-4 border-b text-left font-medium text-gray-600">Anno</th>
              {parsed?.datasets.map((d, i) => (
                <th key={i} className="py-3 px-4 border-b text-left font-medium text-gray-600">
                  {d.icona && (
                    <img 
                      src={`/api/media-proxy?url=userProfilePic/${d.icona}`} 
                      alt="Icona" 
                      className="w-6 h-6 mr-2 inline-block" 
                    />
                  )}
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed?.labels.map((label, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 border-b">{label}</td>
                {parsed?.datasets.map((d, j) => (
                  <td key={j} className="py-3 px-4 border-b">{d.data[i].toLocaleString()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Vista "chart" che mostra solo l'ultimo valore con l'icona
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 overflow-y-auto font-sans">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center leading-tight">{parsed?.name}</h2>
      
      <div className="w-full space-y-5">
        {parsed?.datasets.map((dataset, pointIndex) => (
          <div key={pointIndex} className="p-5 border border-gray-200 rounded-xl bg-gray-50 transition-shadow hover:shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Dati dell'anno: {parsed?.labels[lastIndex]}</h3>
            <div className="flex justify-between items-center text-gray-600">
              <span className="text-sm font-medium flex items-center">
                {dataset.icona && (
                  <img
                    src={`/api/media-proxy?url=${dataset.icona}`}
                    alt={`${dataset.label} icon`}
                    className=" h-12 mr-2 inline-block"
                  />
                )}
                {dataset.label}
              </span>
              <span className="text-lg font-bold text-blue-600">{dataset.data[lastIndex].toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}