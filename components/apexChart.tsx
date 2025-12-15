import { ApexOptions } from 'apexcharts';
import React from 'react';
import ReactApexChart from 'react-apexcharts';

const data = [
  { place: 'Lugano', year: 2024, value: 100 },
  { place: 'Lugano', year: 2025, value: 300 },
  { place: 'Ascona', year: 2025, value: 150 },
  { place: 'Locarno', year: 2024, value: 240 },
  { place: 'Bellinzona', year: 2024, value: 400 },
  { place: 'Ascona', year: 2024, value: 130 },
];

const placeColors: Record<string, string> = {
  Lugano: '#1f77b4',
  Ascona: '#ff7f0e',
  Locarno: '#2ca02c',
  Bellinzona: '#d62728',
};

export default function GroupedBarWithPlaceAverages() {
  const categories = data.map((item) => `${item.place} - ${item.year}`);
  const values = data.map((item) => item.value);

  // Colori associati all’ordine dei dati
  const barColors = data.map((item) => placeColors[item.place] || '#888');

  // Calcola media generale
  const totalAverage =
    values.reduce((sum, val) => sum + val, 0) / values.length;

  // Calcola media per ciascun luogo
  const placeAverages = Object.entries(
    data.reduce((acc, { place, value }) => {
      if (!acc[place]) acc[place] = { sum: 0, count: 0 };
      acc[place].sum += value;
      acc[place].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>)
  ).map(([place, { sum, count }]) => ({
    place,
    average: sum / count,
    color: placeColors[place] || '#000',
  }));

  const chartData = {
    series: [
      {
        name: 'Valore',
        data: values,
      },
    ],
    options: {
      chart: {
        type: 'bar',
        height: 350,
      },
      plotOptions: {
        bar: {
          distributed: true,
          columnWidth: '50%',
        },
      },
      colors: barColors.map((color) => {
        // Applica opacità bassa alle barre
        return `${color}80`; // 80 = 50% opacity in HEX
      }),
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `€ ${val.toLocaleString()}`,
      },
      xaxis: {
        categories,
        title: { text: 'Luogo - Anno' },
      },
      yaxis: {
        title: { text: 'Valore' },
      },
      title: {
        text: 'Valori per Luogo e Anno con Medie Locali',
        align: 'center',
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
        },
      },
      annotations: {
        yaxis: [
          // Media generale (opzionale, puoi rimuoverla se vuoi solo quelle locali)
          {
            y: totalAverage,
            borderColor: 'gray',
            strokeDashArray: 4,
            label: {
              borderColor: 'gray',
              style: {
                color: '#fff',
                background: 'gray',
              },
              text: `Media totale: € ${totalAverage.toFixed(0)}`,
            },
          },
          // Medie per ciascun luogo
          ...placeAverages.map((avg) => ({
            y: avg.average,
            borderColor: avg.color,
            strokeDashArray: 0,
            label: {
              borderColor: avg.color,
              style: {
                color: '#fff',
                background: avg.color,
              },
              text: `Media ${avg.place}: € ${avg.average.toFixed(0)}`,
            },
          })),
        ],
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <ReactApexChart
        options={chartData.options as ApexOptions}
        series={chartData.series}
        type="bar"
        height={400}
      />
    </div>
  );
}
