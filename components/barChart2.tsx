import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';
import { AppContext } from '@/context/appContext';
import ReactApexChart from 'react-apexcharts';
import LoadingComp from '@/components/loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
// INTERFACCIA PROPS
interface PropsInterface {
    values: string[];
    labels: string[];
    name: string;
    fields: string[];
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
}

export default function BarChart2({ values, labels, name, fields}: PropsInterface) {

    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : "";

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);



const chartData = {
  series: [
    {
      name: name,
      data: values
    },
  ],
  options: {
    chart: {
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      toolbar: {
        show: false
      },
      responsive: true,
    },
    plotOptions: {
      bar: {
        horizontal: false,
      },
    },
    xaxis: {
      categories: labels,
    },
    title: {
      align: 'center' as const,
      style: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333',
      },
    },
  },
};

console.log('Chart Data:', chartData);

    return (
      
            <div className="h-full w-full bg-white rounded-sm">
            <ReactApexChart
                options={chartData.options}
                series={chartData.series}
                type="bar"
                className="h-full w-full"
                height="100%"
            />
        </div>
    );
};
