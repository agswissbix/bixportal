import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';
import { AppContext } from '@/context/appContext';
import ReactApexChart from 'react-apexcharts';
import LoadingComp from '@/components/loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

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

// DATI DI ESEMPIO PER LO SVILUPPO
const devValues = ['120000', '155000', '135000', '189000'];
const devLabels = ['2021', '2022', '2023', '2024'];
const devName = '';

export default function PieChart2({ values, labels, name, fields}: PropsInterface) {

    //DATI DEL COMPONENTE
    // Seleziona i dati da usare: dati di esempio se in sviluppo, altrimenti i props
    const finalValues = isDev ? devValues : values;
    const finalLabels = isDev ? devLabels : labels;
    const finalName = isDev ? devName : '';


    const numericSeries = useMemo(() => {
        return finalValues.map(v => parseFloat(v));
    }, [finalValues]);


    const chartData = {
            series: numericSeries,
            options: {
                chart: {
                    type: "pie" as "pie", 
                    animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                    },
                    toolbar: {
                        show: false
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
                responsive: [{
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }]
            },
        };

    return (
        <div className="h-full w-full bg-white rounded-sm">
            <ReactApexChart
                options={chartData.options}
                series={chartData.series}
                type="pie"
                className="h-full w-full"
                height="100%"
            />
        </div>
    );
};