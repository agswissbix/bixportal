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

export default function RadarChart({ values, labels, name, fields }: PropsInterface) {
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
        type: 'radar' as const,
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
      },
      stroke: {
        width: 2,
      },
      fill: {
        opacity: 0.3,
      },
      markers: {
        size: 4,
      },
    },
  };

  return (
    <div className="h-full w-full bg-white ">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="radar"
        height="100%"
      />
    </div>
  );
}
