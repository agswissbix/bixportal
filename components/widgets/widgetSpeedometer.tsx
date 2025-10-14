import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
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

export default function WidgetSpeedometer({ propExampleValue }: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        stats: null
    };

    const responseDataDEV: ResponseInterface = {
      stats :{
        hours: 4
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

    const SegmentedGauge = ({ workload }) => {
      const workloadCalcolato = Math.min(workload, 100);
  
      const angle = (workloadCalcolato / 100) * 180 - 90;
  
      let color;
      if (workload > 100) {
          color = '#ef4444'; 
      } else if (workload >= 85) {
          color = '#ef4444'; 
      } else if (workload >= 50) {
          color = '#f59e0b'; 
      } else {
          color = '#22c55e'; 
      }
  
      return (
          <div className="w-full max-w-[200px] mx-auto text-center">
              <svg viewBox="0 0 64 36">
                  {/* Segmenti colorati */}
                  <path d="M4 32 A 28 28 0 0 1 32 4" stroke="#22c55e" strokeWidth="8" fill="none" />
                  <path d="M32 4 A 28 28 0 0 1 54.7 15.5" stroke="#f59e0b" strokeWidth="8" fill="none" />
                  <path d="M54.7 15.5 A 28 28 0 0 1 60 32" stroke="#ef4444" strokeWidth="8" fill="none" />
                  
                  {/* Perno della lancetta */}
                  <circle cx="32" cy="32" r="4" fill={color} />
  
                  {/* Lancetta */}
                  <line
                      style={{
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: '32px 32px',
                          stroke: color,
                      }}
                      className="transition-transform duration-500 ease-in-out"
                      x1="32" y1="32" x2="32" y2="10"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                  />
              </svg>
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
              bottomText = <span className='flex items-center gap-2'>100% raggiunto</span>;
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
                  <SegmentedGauge workload={actualPercentage} />
                  <div className="text-3xl font-bold text-gray-800 mt-2 flex items-center">
                    {isOvertime && <ExclamationTriangleIcon className="h-7 w-7 text-amber-500 mr-2" />}
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