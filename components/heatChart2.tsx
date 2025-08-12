import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

interface PropsInterface {
  values: string[];
  labels: string[];
  name: string;
  fields: string[];
}

const devValues = ['120000', '155000', '135000', '189000'];
const devLabels = ['2021', '2022', '2023', '2024'];
const devName = '';

export default function HeatmapChart({ values, labels, name, fields }: PropsInterface) {
  const isDev = true;

  const finalValues = isDev ? devValues : values;
  const finalLabels = isDev ? devLabels : labels;
  const finalName = isDev ? devName : name;

  // Preparo i dati per la heatmap: una singola serie con dati {x: label, y: valore}
  const series = useMemo(() => [
    {
      name: finalName,
      data: finalLabels.map((label, i) => ({
        x: label,
        y: parseFloat(finalValues[i]),
      })),
    }
  ], [finalLabels, finalValues, finalName]);

  const chartData = {
    series,
    options: {
      chart: {
        type: 'heatmap',
        toolbar: { show: true },
      },
      dataLabels: { enabled: true, style: { colors: ['#000'] } },
      colors: ['#008FFB'], // scala colori (puoi personalizzare)
      title: {
        text: finalName,
        align: 'center',
        style: { fontSize: '20px', fontWeight: 'bold', color: '#333' },
      },
      xaxis: { type: 'category', title: { text: 'Anno' } },
      yaxis: { show: false }, // niente asse Y per singola riga
      legend: { show: false },
      tooltip: {
        y: { formatter: (val: number) => val.toFixed(0) },
      },
    },
  };

  return (
    <div className="h-full w-full bg-white ">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="heatmap"
        height="100%"
        className="h-full w-full"
      />
    </div>
  );
}
