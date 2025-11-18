// src/components/ValueChart.tsx

import React, { useState } from 'react';
import { Image } from 'lucide-react'; // icona di fallback

interface Dataset {
  label: string;
  data: number[];
  image?: string;
}

export interface ChartDataInterface {
  id: number;
  name: string;
  layout: string;
  labels: string[];
  datasets: Dataset[];
  numeric_format?: string
}

interface Props {
  chartType: string;
  chartData: ChartDataInterface;
  view?: "chart" | "table";
  hideData?: boolean; // nuovo parametro per nascondere i dati
}

export default function ValueChart({ chartData, view = "chart", hideData = false }: Props) {
  const [errorImage, setErrorImage] = useState<Record<number, boolean>>({});

  const lastIndex = chartData?.labels.length! - 1;

  const fmt = (v: number) =>
        new Intl.NumberFormat(chartData.numeric_format || "it-CH", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(v);

  return (
    <div className="flex flex-col justify-center h-full w-full p-6 font-sans">
      <div className="w-full space-y-8">
        {chartData?.datasets.map((dataset, pointIndex) => (
          <div key={pointIndex} className="flex flex-row space-x-2 items-center text-center">
            {dataset.image ? (
              errorImage[pointIndex] ? (
                <Image className="h-16 w-16 text-gray-400" />
              ) : (
                <img
                  src={`/api/media-proxy?url=${dataset.image}`}
                  alt={`Icona per ${dataset.label}`}
                  className="h-16 w-16 object-contain"
                  onError={() => setErrorImage((prev) => ({ ...prev, [pointIndex]: true }))}
                />
              )
            ) : (
              <Image className="h-16 w-16 text-gray-300" />
            )}

            {!hideData && (
              <span className="text-6xl font-bold text-gray-800">
                {fmt(dataset.data[lastIndex])}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
