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
const devName = '';

export default function DonutChart({ values, labels, name }: PropsInterface) {
  const finalValues = isDev ? devValues : values;
  const finalLabels = isDev ? devLabels : labels;
  const finalName = isDev ? devName : name;

  const numericSeries = useMemo(() => {
    return finalValues.map((v) => parseFloat(v));
  }, [finalValues]);

  const chartData = {
    series: numericSeries,
    options: {
      chart: {
        type: 'donut' as const,
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
      tooltip: {
        y: {
          formatter: (val: number) => `€ ${val.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="h-full w-full bg-white">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="donut"
        width="100%"
        height="100%"
      />
    </div>
  );
}
