// src/components/ValueChart.tsx

import React from 'react';
import DynamicMenuItem from '../dynamicMenuItem';


export type CustomFunction = {
  tableid: string;
  context: string;
  title: string;
  function: string;
  conditions?: any;
  params?: any;
  css?: string;
};


interface Dataset {
  label: string;
  data: number[];
  fn?: CustomFunction;
  tableid?: string
}

export interface ChartDataInterface {
  id: number;
  name: string;
  layout: string;
  labels: string[];
  datasets: Dataset[];
}

interface Props {
  chartType: string;
  chartData: ChartDataInterface;
  view: "chart" | "table";
}

export default function ButtonChart({ chartData, view }: Props) {

  // Prende l'ultimo indice disponibile
  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return <div className="p-4 text-gray-500">Nessun dato disponibile</div>;
  }
  const firstDataset = chartData?.datasets[0];
  if (!firstDataset?.fn) {
    return <div className="p-4 text-gray-500">Nessun dato disponibile</div>;
  }
  firstDataset.fn.title += " " + firstDataset.tableid
  // Vista "chart" minimalista - solo valore e immagine
  return (
    <div className="flex flex-col justify-center h-full w-full p-6 font-sans">
      <div className="w-full space-y-8">
        <ul className="text-sm text-gray-700 inline-flex items-center rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-accent text-gray-700 hover:text-accent font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] [&_*]:!border-0">
        <DynamicMenuItem
            key={firstDataset.fn.title}
            fn={firstDataset.fn}
            params={{
            tableid: firstDataset.tableid,
            ...(typeof firstDataset.fn.params === 'object' && firstDataset.fn.params ? firstDataset.fn.params : {})
            }}
        />
        </ul>
      </div>
    </div>
  );
}