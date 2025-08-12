import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';

const isDev = true;

interface PropsInterface {
  values: string[];
  labels: string[];
  name: string;
  fields: string[];
}

const devValues = ['120000', '155000', '135000', '189000'];
const devLabels = ['2021', '2022', '2023', '2024'];
const devName = 'Fatturato Annuale (Esempio)';

export default function AreaChart({ values, labels, name }: PropsInterface) {
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
        type: 'area' as const,
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
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 1,
          stops: [0, 90, 100],
        },
      },
      markers: {
        size: 4,
        colors: ['#10B981'],
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
    <div className="h-full w-full bg-white drop-shadow-lg rounded-sm p-4 overflow-hidden">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="area"
        height="100%"
        width="100%"
      />
    </div>
  );
}
