// src/components/ValueChart.tsx

import React from 'react';

interface Dataset {
  label: string;
  data: number[];
  image?: string;
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

  // Vista "chart" minimalista - solo valore e immagine
  return (
    <div className="flex flex-col justify-center h-full w-full p-6 font-sans">
      <div className="w-full space-y-8">
        {parsed?.datasets.map((dataset, pointIndex) => (
          <div key={pointIndex} className="flex flex-row space-x-2 items-center text-center">
            {dataset.image && (
              <img
                src={`/api/media-proxy?url=${dataset.image}`}
                alt={`${dataset.label} icon`}
                className=" h-16"
              />
            )}
            <span className="text-6xl font-bold text-gray-800">{dataset.data[lastIndex].toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}