import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';
import { AppContext } from '@/context/appContext';

// Styling & Icons
import { BoltIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/solid';

// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
interface PropsInterface {
  propExampleValue?: string;
  customHours?: number;
  cleanView?: boolean;
  isLunchTime?: boolean;
}

interface Stats {
  hours: number
}

interface ResponseInterface {
  stats: Stats
}

export default function WidgetBattery({ propExampleValue, customHours, cleanView = false, isLunchTime = false }: PropsInterface) {
    const responseDataDEFAULT: ResponseInterface = {
        stats: { hours: 0 }
    };

    const responseDataDEV: ResponseInterface = {
      stats :{
        hours: 3
      }
    };

    const { user } = useContext(AppContext);
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    const payload = useMemo(() => {
        if (isDev || customHours !== undefined) return null;
        return {
            apiRoute: 'examplepost', 
            example1: propExampleValue
        };
    }, [propExampleValue, customHours]);

    const { response, loading, error } = (!isDev && !customHours && payload) 
        ? useApi<ResponseInterface>(payload) 
        : { response: null, loading: false, error: null };

    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    useEffect(() => {
      if(isDev) setResponseData({ ...responseDataDEV });
    }, []);

    const currentHours = customHours !== undefined ? customHours : (responseData?.stats?.hours || 0);

    const [displayedPercentage, setDisplayedPercentage] = useState(0);

    const days = 1;
    const hoursPerDay = 8;
    const totalHours = days * hoursPerDay;

    const calcPercentage = (h: number) => (h / totalHours) * 100;
          
    const actualPercentage = calcPercentage(currentHours);
      
    useEffect(() => {
        const target = Math.round(Math.min(100, (currentHours / hoursPerDay) * 100));
        const targetText = Math.round((currentHours / hoursPerDay) * 100);

        if (targetText === displayedPercentage) return;

        const interval = setInterval(() => {
            setDisplayedPercentage(prev => {
                if (prev < targetText) return prev + 1;
                if (prev > targetText) return prev - 1;
                clearInterval(interval);
                return prev;
            });
        }, 15); 

        return () => clearInterval(interval); 
    }, [currentHours]);

    const useWorkloadColor = (workload: number) => {
      if (isLunchTime) return '#fbbf24';0
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
      
      return (
          <div className="flex items-center justify-center">
              <div className={`w-24 h-10 bg-white border-2 border-gray-700 rounded-lg p-1 relative flex items-center transition-all ${isLunchTime ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : ''} ${isOverloaded ? 'animate-[flash-red-border_1.2s_infinite]' : ''}`}>
                  
                  <div 
                      style={{ width: `${fillPercentage}%`, backgroundColor: color }} 
                      className="h-full rounded transition-all duration-500 ease-in-out"
                  ></div>

                  <div className="absolute inset-0 flex items-center justify-center z-10">
                      {isLunchTime ? (
                          <PauseIcon className="w-6 h-6 text-amber-600/80 animate-pulse" />
                      ) : isOverloaded ? (
                          <BoltIcon className="w-6 h-6 text-red-600 animate-pulse" />
                      ) : batteryLevel <= 20 ? (
                           <BoltIcon className="w-6 h-6 text-gray-400/50" />
                      ) : null}
                  </div>
  
              </div>
              <div className={`w-1.5 h-5 rounded-r-sm transition-colors ${isLunchTime ? 'bg-amber-400' : 'bg-gray-700'}`}></div>
          </div>
      );
    };
  
    const content = (
        <div className={`flex flex-col items-center justify-center ${!cleanView ? 'p-4' : ''}`}>
            <Battery workload={actualPercentage} />
            
            <div className={`text-3xl font-bold mt-2 flex items-center ${isLunchTime ? 'text-amber-500' : 'text-gray-800'}`}>
                {isLunchTime ? (
                    <span className="text-sm font-medium uppercase tracking-widest animate-pulse">In Pausa</span>
                ) : (
                    <span>{displayedPercentage}%</span>
                )}
            </div>

            {!cleanView && (
                 <div className='mt-4 text-sm text-center text-gray-500'>
                    {currentHours < totalHours ? (
                        <>Mancano <b>{(totalHours - currentHours).toFixed(1)}</b> ore</>
                    ) : (
                        <>Hai superato di <b>{(currentHours - totalHours).toFixed(1)}</b> ore</>
                    )}
                 </div>
            )}
        </div>
    );

    if (cleanView) {
        return content;
    }

    return (
      <GenericComponent response={responseData} loading={loading} error={error}>
        {() => (
            <div className="flex items-center justify-center p-4">
              <div className="min-w-64 overflow-hidden rounded-lg bg-white shadow-md border border-gray-200 relative">
                 {!customHours && (
                    <div className='bg-white p-5 border-t border-gray-200'>
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute top-2 right-2"
                            onClick={() => alert('Action')}>
                            Nuovo
                        </button>
                    </div>  
                 )}
                
                <div className="w-full p-5">
                    {content}
                </div>
              </div>
            </div>
        )}
      </GenericComponent>
    );
};