import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const data = [
  { luogo: 'Lugano', anno: 2024, value: 100 },
  { luogo: 'Lugano', anno: 2025, value: 300 },
  { luogo: 'Ascona', anno: 2025, value: 150 },
  { luogo: 'Locarno', anno: 2024, value: 220 },
  { luogo: 'Bellinzona', anno: 2024, value: 180 },
  { luogo: 'Ascona', anno: 2024, value: 130 },
];

export default function MixedChart() {
  const labels = data.map((d) => `${d.luogo} ${d.anno}`);
  const values = data.map((d) => d.value);

  const media = values.reduce((a, b) => a + b, 0) / values.length;

  const chartData = {
    series: [
      {
        name: 'Valore',
        type: 'column',
        data: values,
      },
      {
        name: 'Linea',
        type: 'line',
        data: values,
      },
    ],
    options: {
      chart: {
        height: 400,
        type: 'line',
        stacked: false,
      },
      stroke: {
        width: [0, 3],
      },
      title: {
        text: 'Fatturato per luogo e anno',
        align: 'center',
      },
      xaxis: {
        categories: labels,
      },
      yaxis: [
        {
          title: {
            text: 'Valore (€)',
          },
        },
      ],
      annotations: {
        yaxis: [
          {
            y: media,
            borderColor: 'red',
            label: {
              borderColor: 'red',
              style: {
                color: '#fff',
                background: 'red',
              },
              text: `Media € ${Math.round(media)}`,
            },
          },
        ],
      },
      tooltip: {
        y: {
          formatter: (val: number) => `€ ${val.toLocaleString()}`,
        },
      },
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <ReactApexChart
        options={chartData.options as ApexCharts.ApexOptions}
        series={chartData.series}
        type="line"
        height={400}
      />
    </div>
  );
}
