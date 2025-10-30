// src/components/ValueChart.tsx

import React from 'react';
import RecordsTable from '../recordsTable';
import { TooltipProvider } from '../ui/tooltip';

interface Dataset {
  label: string;
  image?: string;
  tableid?: string
  view?: number | string;
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

export default function TableChart({ chartData, view }: Props) {
  let parsed: ChartDataInterface | null = null;
  try {
    parsed = JSON.parse(chartData);
  } catch (e) {
    console.error("Errore parsing dati:", e);
    return <div className="p-4 text-red-500">Dati non validi</div>;
  }

  if (!parsed || !parsed.datasets || parsed.datasets.length === 0) {
    return <div className="p-4 text-gray-500">Nessun dato disponibile</div>;
  }
  const firstDataset = parsed?.datasets[0];

  // Vista "chart" minimalista - solo valore e immagine
  return (
    <div className="px-2">
        {firstDataset && (
            <>
            <TooltipProvider>

            <RecordsTable
                tableid={firstDataset.tableid}
                context="linked"
                view={firstDataset.view?.toString()}
                limit={10}
                />
            </TooltipProvider>
            </>
        )}
    </div>
  );
}