import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';

// Styling & Icons
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
// INTERFACCIA PROPS
interface PropsInterface {
  propExampleValue?: string;
}

interface Stats {
  hours: number
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  stats: Stats
}

export default function widgetHoursRing({ propExampleValue }: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        stats: null
    };

    const responseDataDEV: ResponseInterface = {
      stats :{
        hours: 4.5
      }
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
            example1: propExampleValue
        };
    }, [propExampleValue]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    // PER DEVELOPMENT
    useEffect(() => {
      setResponseData({ ...responseDataDEV });
    }, []);


    const [displayedPercentage, setDisplayedPercentage] = useState(0);

    const days = 1;
    const hoursPerDay = 8;
    const totalHours = days * hoursPerDay;

    const calcPercentage = (h: number) => (h / totalHours) * 100;
          
    const actualPercentage = responseData?.stats?.hours !== undefined
      ? calcPercentage(responseData.stats.hours)
      : 0;

    const ringFillPercentage = Math.min(actualPercentage, 100);

    // Effetto per animare il conteggio della percentuale
    useEffect(() => {
        const target = Math.round(actualPercentage);
        if (target === displayedPercentage) return;

        const interval = setInterval(() => {
            setDisplayedPercentage(prev => {
                if (prev < target) {
                    return prev + 1;
                }
                if (prev > target) {
                    return prev - 1;
                }
                clearInterval(interval);
                return prev;
            });
        }, 15); 

        return () => clearInterval(interval); 
    }, [actualPercentage]);


    const openAlert = () => {
      alert('Funzione non implementata');
    };
   
    return (
      <GenericComponent response={responseData} loading={false} error={null}>
        {(response: ResponseInterface) => {
          if (!response || !response.stats) {
            return (
              <div className="flex items-center justify-center p-4">
                <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-sm text-gray-500">Caricamento...</span>
                </div>
              </div>
            );
          }

          const isOvertime = actualPercentage > 100;
          
          const size = 192; 
          const strokeWidth = 24;
          const center = size / 2;
          const radius = center - strokeWidth / 2;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference * (1 - ringFillPercentage / 100);

          const hoursDifference = totalHours - response.stats.hours;

          let bottomText;
          if (hoursDifference > 0) {
              bottomText = <>Mancano ancora <b>{hoursDifference.toFixed(1)}</b> ore.</>;
          } else if (hoursDifference === 0) {
              bottomText = <span className='flex items-center gap-2'>100% raggiunto</span>;
          } else {
              bottomText = <>Hai superato di <b>{Math.abs(hoursDifference).toFixed(1)}</b> ore.</>;
          }
  
          return (
            <div className="flex items-center justify-center p-4">
              <div className="overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
                <div className='bg-white p-5 border-t border-gray-200'>
                  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute top-2 right-2"
                      onClick={openAlert}>
                    Nuovo
                  </button>
                </div>  
                <div className='bg-white p-5'>
                  <div className="relative h-48 w-48">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                      {/* Cerchio di sfondo */}
                      <circle
                        className="text-gray-200"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        r={radius}
                        cx={center}
                        cy={center}
                      />
                      {/* Cerchio di progresso */}
                      <circle
                        className={isOvertime ? "text-amber-500" : "text-blue-500"}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round" 
                        fill="transparent"
                        r={radius}
                        cx={center}
                        cy={center}
                        style={{
                          strokeDasharray: circumference,
                          strokeDashoffset: offset,
                          transition: 'stroke-dashoffset 0.8s ease-out',
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-700 dark:text-gray-200 flex items-center">
                        {isOvertime && <ExclamationTriangleIcon className="h-8 w-8 text-amber-500 mr-2" />}
                        {displayedPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className='bg-white p-5 border-t border-gray-200 text-sm'>
                  <span>
                    {bottomText}
                  </span>
                </div>
              </div>
            </div>
          );
        }}
      </GenericComponent>
    );
};