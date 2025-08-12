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

export default function ScatterChart({ values, labels, name, fields }: PropsInterface) {
  const isDev = true;

  const finalValues = isDev ? devValues : values;
  const finalLabels = isDev ? devLabels : labels;
  const finalName = isDev ? devName : name;

  // Per scatter, creiamo una serie di punti {x: label, y: valore numerico}
  const seriesData = useMemo(() => {
    return finalLabels.map((label, i) => ({
      x: label,
      y: parseFloat(finalValues[i]),
    }));
  }, [finalLabels, finalValues]);

  const chartData = {
    series: [
      {
        name: finalName,
        data: seriesData,
      },
    ],
    options: {
      chart: {
        type: 'scatter',
        zoom: {
          enabled: true,
          type: 'xy',
        },
        toolbar: {
          show: true,
        },
      },
      xaxis: {
        type: 'category',
        title: {
          text: 'Anno',
        },
      },
      yaxis: {
        title: {
          text: 'Valore',
        },
      },
      title: {
        text: finalName,
        align: 'center',
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
        },
      },
      markers: {
        size: 6,
      },
      tooltip: {
        shared: false,
        intersect: true,
      },
    },
  };

  return (
    <div className="h-full w-full bg-white ">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="scatter"
        height="100%"
        className="h-full w-full"
      />
    </div>
  );
}
