import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';

// Styling & Icons
import { BoltIcon } from '@heroicons/react/24/solid';

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

export default function widgetBattery({ propExampleValue }: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        stats: null
    };

    const responseDataDEV: ResponseInterface = {
      stats :{
        hours: 3
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
      
    useEffect(() => {
        const target = Math.round(100 - actualPercentage);
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

    const useWorkloadColor = (workload) => {
      if (workload > 90) return '#22c55e'; 
      if (workload > 50) return '#f59e0b';
      if (workload > 20) return '#ef4444';
      return '#b91c1c'; 
    };

    const Battery = ({ workload }) => {
      const batteryLevel = 100 - workload;
  
      const color = useWorkloadColor(batteryLevel);
      const fillPercentage = Math.max(0, Math.min(100, batteryLevel));
      const isOverloaded = batteryLevel < 0;
      
      // Condition to show the lightning bolt icon
      const showLightning = batteryLevel <= 0;
  
      return (
          <div className="flex items-center justify-center">
              <div className={`w-24 h-10 bg-white border-2 border-gray-700 rounded-lg p-1 relative flex items-center ${isOverloaded ? 'animate-[flash-red-border_1.2s_infinite]' : ''}`}>
                  <div 
                      style={{ width: `${fillPercentage}%`, backgroundColor: color }} 
                      className="h-full rounded transition-all duration-500 ease-in-out"
                  ></div>

                  {showLightning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                          <svg 
                              className="w-6 h-6 text-gray-700" 
                              xmlns="http://www.w3.org/2000/svg" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                          >
                              <path d="M11 0L3 11h4v9l8-11h-4V0z" />
                          </svg>
                      </div>
                  )}
  
              </div>
              <div className="w-1.5 h-5 bg-gray-700 rounded-r-sm"></div>
          </div>
      );
    };
  
   
    return (
      <GenericComponent response={responseData} loading={loading} error={error}>
        {(response: ResponseInterface) => {
          if (!response || !response.stats) {
            return (
              <div className="flex items-center justify-center p-4">
                <div className="flex h-48 w-48 items-center justify-center">
                  <span className="text-sm text-gray-500">Caricamento...</span>
                </div>
              </div>
            );
          }

          const isOvertime = actualPercentage > 100;
          const hoursDifference = totalHours - response.stats.hours;

          let bottomText;
          if (hoursDifference > 0) {
              bottomText = <>Mancano ancora <b>{hoursDifference.toFixed(1)}</b> ore.</>;
          } else if (hoursDifference === 0) {
              bottomText = <span className='flex items-center gap-2'>0 ore rimanenti</span>;
          } else {
              bottomText = <>Hai superato di <b>{Math.abs(hoursDifference).toFixed(1)}</b> ore.</>;
          }

          return (
            <div className="flex items-center justify-center p-4">
              <div className="min-w-64 overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
                <div className='bg-white p-5 border-t border-gray-200'>
                  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute top-2 right-2"
                      onClick={openAlert}>
                    Nuovo
                  </button>
                </div>  
                <div className="w-full flex flex-col justify-center items-center p-5">
                  <Battery workload={actualPercentage} />
                  <div className="text-3xl font-bold text-gray-800 mt-2 flex items-center">
                    {isOvertime && <BoltIcon className="h-7 w-7 text-amber-500 mr-2" />}
                    <span>{displayedPercentage}%</span>
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