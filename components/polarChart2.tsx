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
const isDev = true;

export default function PolarChart({ values, labels, name, fields }: PropsInterface) {
  const finalValues = isDev ? devValues : values;
  const finalLabels = isDev ? devLabels : labels;
  const finalName = isDev ? devName : name;

  const numericSeries = useMemo(() => finalValues.map((v) => parseFloat(v)), [finalValues]);

  const chartData = {
    series: numericSeries,
    options: {
      chart: {
        type: 'polarArea',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
        toolbar: {
          show: false,
        },
      },
      labels: finalLabels,
      title: {
        text: finalName,
        align: 'center' as const,
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
        },
      },
      legend: {
        position: 'bottom' as const,
      },
      fill: {
        opacity: 0.8,
      },
      stroke: {
        width: 1,
        colors: ['#fff'],
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
        options={chartData.options}
        series={chartData.series}
        type="polarArea"
        className="h-full w-full"
        height="100%"
      />
    </div>
  );
}
