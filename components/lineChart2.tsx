import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const isDev = false;

interface PropsInterface {
  values: string[];
  labels: string[];
  name: string;
  fields: string[];
}

const devValues = ['120000', '155000', '135000', '189000'];
const devLabels = ['2021', '2022', '2023', '2024'];
const devName = '';

export default function LineChart({ values, labels, name }: PropsInterface) {
  const finalValues = isDev ? devValues : values;
  const finalLabels = isDev ? devLabels : labels;
  const finalName = isDev ? devName : '';

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
        type: 'line' as const,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
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
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      markers: {
        size: 5,
        colors: ['#1E90FF'],
        strokeColors: '#fff',
        strokeWidth: 2,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `€ ${val.toLocaleString()}`,
        },
      },
      legend: {
        position: 'bottom' as const,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 300,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    },
  };

  return (
    <div className="h-full w-full bg-white ">
      <ReactApexChart
        options={chartData.options as ApexCharts.ApexOptions}
        series={chartData.series}
        type="line"
        height="100%"
        width="100%"
      />
    </div>
  );
}
