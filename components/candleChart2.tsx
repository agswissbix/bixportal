import React from 'react';
import ReactApexChart from 'react-apexcharts';

interface PropsInterface {
  // Per candlestick servono dati specifici, quindi potresti voler passare un array di oggetti
  // { x: string (label), y: [open, high, low, close] }
  seriesData?: { x: string; y: [number, number, number, number] }[];
  name?: string;
}

const devSeriesData: { x: string; y: [number, number, number, number] }[] = [
  { x: "2021-01-01", y: [120000, 125000, 115000, 123000] },
  { x: "2021-02-01", y: [123000, 130000, 119000, 129000] },
  { x: "2021-03-01", y: [129000, 135000, 125000, 130000] },
  { x: "2021-04-01", y: [130000, 138000, 128000, 134000] },
];

const devName = 'Esempio Candlestick';

export default function CandlestickChart({ seriesData = devSeriesData, name = devName }: PropsInterface) {

  const chartData = {
    series: [
      {
        name,
        data: seriesData,
      },
    ],
    options: {
      chart: {
        type: 'candlestick',
        height: '100%',
        toolbar: {
          show: true,
        },
      },
      title: {
        text: name,
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
        },
      },
      xaxis: {
        type: 'category',
        labels: {
          rotate: -45,
        },
      },
      yaxis: {
        tooltip: {
          enabled: true,
        },
      },
      tooltip: {
        enabled: true,
      },
    } as ApexCharts.ApexOptions,
  };

  return (
    <div className="h-full w-full bg-white drop-shadow-lg rounded-sm p-2 overflow-hidden">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="candlestick"
        height="100%"
        className="h-full w-full"
      />
    </div>
  );
}
