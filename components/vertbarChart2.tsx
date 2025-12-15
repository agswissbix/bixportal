import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

interface PropsInterface {
  values: string[];
  labels: string[];
  name: string;
  fields: string[];
}

const isDev = true;

const devValues = ['120000', '155000', '135000', '189000'];
const devLabels = ['2021', '2022', '2023', '2024'];
const devName = 'Fatturato Annuale (Esempio)';

export default function BarChart({ values, labels, name, fields }: PropsInterface) {
  const finalValues = isDev ? devValues : values;
  const finalLabels = isDev ? devLabels : labels;
  const finalName = isDev ? devName : name;

  const numericSeries = useMemo(() => {
    return finalValues.map((v) => parseFloat(v));
  }, [finalValues]);

  const chartData = {
    series: [
      {
        name: finalName,
        data: numericSeries,
      },
    ],
    options: {
      chart: {
        type: 'bar' as const,
        toolbar: {
          show: false,
        },
      },
      title: {
        text: finalName,
        align: 'center' as const,
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
        },
      },
      xaxis: {
        categories: finalLabels,
        title: {
          text: 'Anno',
        },
      },
      yaxis: {
        title: {
          text: 'Valore',
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
        },
      },
      dataLabels: {
        enabled: true,
      },
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="h-full w-full bg-white drop-shadow-lg rounded-sm p-2 overflow-hidden">
      <ReactApexChart
        options={chartData.options as ApexCharts.ApexOptions}
        series={chartData.series}
        type="bar"
        height="100%"
      />
    </div>
  );
}
