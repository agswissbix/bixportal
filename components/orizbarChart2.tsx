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
const devName = ''; // Ho aggiunto un nome per una migliore visualizzazione

// Funzione helper per generare un colore esadecimale casuale
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function OrizBarChart({ values, labels, name, fields }: PropsInterface) {
  const finalValues = isDev ? devValues : values;
  const finalLabels = isDev ? devLabels : labels;
  const finalName = isDev ? devName : name;

  const numericSeries = useMemo(() => {
    return finalValues.map((v) => parseFloat(v));
  }, [finalValues]);
  
  // <-- AGGIUNTO: Genera un array di colori casuali.
  // useMemo garantisce che i colori non cambino ad ogni re-render, ma solo se i dati cambiano.
  const randomColors = useMemo(() => {
    return finalValues.map(() => getRandomColor());
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
      // <-- AGGIUNTO: Fornisce al grafico la lista di colori da usare.
      colors: randomColors,
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
          horizontal: false,
          // <-- AGGIUNTO: Questa è l'opzione chiave!
          // Dice al grafico di distribuire i colori dall'array `colors`
          // su ogni singola barra, invece di usarne uno per serie.
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
      },
      legend: {
        // La legenda non è più necessaria se ogni barra ha un colore diverso
        // e non rappresenta una categoria specifica.
        show: false,
      },
    },
  };

  return (
    <div className="h-full w-full bg-white ">
      <ReactApexChart
        options={chartData.options}
        series={chartData.series}
        type="bar"
        height="100%"
      />
    </div>
  );
}