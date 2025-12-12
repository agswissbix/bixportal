import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent'
import { AppContext } from '@/context/appContext';

// Styling & Icons
import { BoltIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = true;

// INTERFACCE
interface PropsInterface {
  customHours?: number; 
  cleanView?: boolean; 
}

interface Stats {
  hours: number
}

interface ResponseInterface {
  stats: Stats
}

export default function WidgetBattery({ customHours, cleanView = false }: PropsInterface) {
    const hasExternalData = customHours !== undefined;

    const responseDataDEFAULT: ResponseInterface = {
        stats: null
    };

    const responseDataDEV: ResponseInterface = {
      stats :{
        hours: 3
      }
    };

    const { user } = useContext(AppContext);
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    // PAYLOAD (solo se non in sviluppo e SE NON abbiamo dati esterni)
    const payload = useMemo(() => {
        if (isDev || hasExternalData) return null;
        return {
            apiRoute: 'examplepost',
        };
    }, [hasExternalData]);

    // CHIAMATA AL BACKEND (solo se necessario)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    useEffect(() => {
      if(!hasExternalData && isDev) {
         setResponseData({ ...responseDataDEV });
      }
    }, []);

    const [displayedPercentage, setDisplayedPercentage] = useState(0);

    const days = 1;
    const hoursPerDay = 8;
    const totalHours = days * hoursPerDay;

    const calcPercentage = (h: number) => (h / totalHours) * 100;
          
    const currentHours = hasExternalData ? customHours : responseData?.stats?.hours;

    const actualPercentage = currentHours !== undefined
      ? calcPercentage(currentHours)
      : 0;
      
    useEffect(() => {
        const target = Math.round(100 - actualPercentage);
        if (Math.abs(target - displayedPercentage) < 1) {
             if(target !== displayedPercentage) setDisplayedPercentage(target);
             return;
        }

        const interval = setInterval(() => {
            setDisplayedPercentage(prev => {
                if (prev < target) return prev + 1;
                if (prev > target) return prev - 1;
                clearInterval(interval);
                return prev;
            });
        }, 15); 

        return () => clearInterval(interval); 
    }, [actualPercentage]);

    const openAlert = () => {
      alert('Funzione non implementata');
    };

    const useWorkloadColor = (workload: number) => {
      if (workload > 90) return '#22c55e'; 
      if (workload > 50) return '#f59e0b';
      if (workload > 20) return '#ef4444';
      return '#b91c1c'; 
    };

    const Battery = ({ workload }: { workload: number }) => {
      const batteryLevel = 100 - workload;
  
      const color = useWorkloadColor(batteryLevel);
      const fillPercentage = Math.max(0, Math.min(100, batteryLevel));
      const isOverloaded = batteryLevel < 0;
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
  
   
    const content = () => {
          if (currentHours === undefined || currentHours === null) {
            return (
              <div className="flex items-center justify-center p-4">
                 <span className="text-sm text-gray-500">Dati non disponibili</span>
              </div>
            );
          }

          const isOvertime = actualPercentage > 100;
          const hoursDifference = totalHours - currentHours;

          let bottomText;
          if (hoursDifference > 0) {
              bottomText = <>Mancano <b>{hoursDifference.toFixed(1)}</b> ore.</>;
          } else if (Math.abs(hoursDifference) < 0.1) {
              bottomText = <span className='flex items-center gap-2'>Obiettivo raggiunto!</span>;
          } else {
              bottomText = <>Hai superato di <b>{Math.abs(hoursDifference).toFixed(1)}</b> ore.</>;
          }

          if (cleanView) {
            return (
                <div className="flex flex-col items-center">
                    <Battery workload={actualPercentage} />
                    <div className="text-2xl font-bold text-gray-800 mt-1 flex items-center">
                        {isOvertime && <BoltIcon className="h-5 w-5 text-amber-500 mr-1" />}
                        <span>{displayedPercentage}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                        {bottomText}
                    </div>
                </div>
            )
          }

          return (
            <div className="flex items-center justify-center p-4">
              <div className="min-w-64 overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
                <div className='bg-white p-5 border-t border-gray-200 relative'>
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
    };

    if (hasExternalData) {
        return content();
    }

    return (
      <GenericComponent response={responseData} loading={loading} error={error}>
        {() => content()}
      </GenericComponent>
    );
};