import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import ReactApexChart from 'react-apexcharts';
import LoadingComp from '../loading';

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

export default function BarChart({ values, labels, name, fields}: PropsInterface) {

    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : "";

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                values: ["0"],
                labels: [''],
                name: '',
                fields: ['']
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                values: ["3.5", "1.5", "1.0", "11.25", "0.5"],
                labels: ['Commercial support', 'Fixed price Project', 'Invoiced', 'Service Contract: Manutenzione Printing', 'Service Contract: Monte Ore'],
                name: 'Timesheet - ven ultimi 14 giorni - Per stato fatture',
                fields: ['totaltime_decimal']
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'examplepost', // riferimento api per il backend
        };
    }, []);    

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

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
      text: name,
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
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="h-full w-full bg-white drop-shadow-lg rounded-sm p-2 overflow-hidden">
                 <ReactApexChart
                   options={chartData.options}
                   series={chartData.series}
                   type="bar"
                   className="h-full w-full"
                    height="100%"
                 />
               </div>
            )}  
        </GenericComponent>
    );
};
