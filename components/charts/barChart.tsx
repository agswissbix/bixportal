//...
import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface Dataset {
  label: string;
  data: number[];
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

export default function BarChart2({ chartType, chartData, view }: Props) {
  let parsed: ChartDataInterface | null = null;
  try {
    parsed = JSON.parse(chartData);
  } catch (e) {
    console.error("Errore parsing dati:", e);
    return <div className="p-4 text-red-500">Dati non validi</div>;
  }

  if (!parsed) return null;

  if (view === "table") {
    // Ruota il contenitore del componente per annullare la rotazione.
    // In questo modo, il contenuto della tabella rimarrà dritto.
    return (
      <div className="h-full overflow-y-auto" style={{ transform: "rotateY(180deg)" }}>
        <h3 className="text-lg font-semibold mb-2 text-center text-gray-700">{parsed.name}</h3>
        <table className="min-w-full bg-white border border-gray-300 text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-600">Categoria</th>
              {parsed.datasets.map((d, i) => (
                <th key={i} className="py-2 px-4 border-b text-left font-medium text-gray-600">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.labels.map((label, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{label}</td>
                {parsed.datasets.map((d, j) => (
                  <td key={j} className="py-2 px-4 border-b">{d.data[i]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // vista grafico
  const series = parsed.datasets.map((d) => ({ name: d.label, data: d.data }));
  const options: ApexOptions = {
    chart: { toolbar: { show: false } },
    xaxis: { categories: parsed.labels },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
  };

  return (
    <ReactApexChart options={options} series={series} type="bar" height="100%" />
  );
}