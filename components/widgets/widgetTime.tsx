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

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
}

// Interfaccia per il tempo rimanente
interface TimeLeft {
  giorni: number;
  ore: number;
  minuti: number;
  secondi: number;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  task: Task
}

export default function WidgetTime({ propExampleValue }: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
      task: null
    };

    const responseDataDEV: ResponseInterface = {
      task: {
        id: 'a1b2c3d4',
        title: 'Aggiornare doc',
        description: 'Aggiornare la documentazione con le informazioni',
        dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        completed: false
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

    const remainingTime = (dueDate: string) => {
      var date = new Date(dueDate);

      return date.getTime();
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

    const calculateTimeLeft = (dueDate: string | undefined): TimeLeft | null => {
        if (!dueDate) return null;

        const difference = +new Date(dueDate) - +new Date();
        if (difference <= 0) return null;

        return {
            giorni: Math.floor(difference / (1000 * 60 * 60 * 24)),
            ore: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minuti: Math.floor((difference / 1000 / 60) % 60),
            secondi: Math.floor((difference / 1000) % 60),
        };
    };

    useEffect(() => {
        setTimeLeft(calculateTimeLeft(responseData.task?.dueDate));

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(responseData.task?.dueDate));
        }, 1000);

        return () => clearInterval(timer);
    }, [responseData.task?.dueDate]);

    const format = (num: number) => num.toString().padStart(2, '0');

    const isTimeLeft = !!timeLeft;
    const isLessThanOneHour = timeLeft && timeLeft.giorni === 0 && timeLeft.ore === 0;

    return (
      <GenericComponent response={responseData} loading={loading} error={error}>
        {(response: ResponseInterface) => {
          if (!response.task) return <div>Nessun task da mostrare.</div>;

          return (
            <div className="flex items-center justify-center p-4">
              <div className="min-w-64 overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
                <div className="w-full flex flex-col justify-center items-center p-5 space-y-3">
                  <span className="font-semibold text-gray-700">{response.task.title}</span>
                  {response.task.completed ? (
                      <div className="text-lg font-bold text-green-500">Completato</div> 
                    ) : (
                      <>
                        {timeLeft ? (
                          <>
                            <span className="text-gray-700">Tempo rimanente alla scadenza:</span>
                            <div className="flex justify-center items-center space-x-2 text-center">
                              <div className="p-2 bg-gray-100 rounded-md w-16">
                                <div className="text-2xl font-bold text-blue-800">{timeLeft.giorni}</div>
                                <div className="text-xs text-gray-500">G</div>
                              </div>
                              <div className="p-2 bg-gray-100 rounded-md w-16">
                                <div className="text-2xl font-bold text-blue-800">{format(timeLeft.ore)}</div>
                                <div className="text-xs text-gray-500">H</div>
                              </div>
                              <div className="p-2 bg-gray-100 rounded-md w-16">
                                <div className="text-2xl font-bold text-blue-800">{format(timeLeft.minuti)}</div>
                                <div className="text-xs text-gray-500">M</div>
                              </div>
                              <div className="p-2 bg-gray-100 rounded-md w-16">
                                <div className="text-2xl font-bold text-red-500">{format(timeLeft.secondi)}</div>
                                <div className="text-xs text-gray-500">S</div>
                              </div>
                            </div>
                            {isLessThanOneHour && (
                              <div className="flex items-center gap-2 text-sm font-bold text-red-500">
                                <ExclamationTriangleIcon className='h-10 w-10 animate-pulse'/>
                                <span>Meno di un'ora alla scadenza!</span>
                            </div>  
                            )}  
                          </>              
                        ) : (
                          <div className="text-lg font-bold text-red-500">Scaduto</div>
                        )}
                      </>
                    )}
                </div>
                <div className='bg-white p-5 border-t border-gray-200 text-sm text-gray-600'>
                  <span>{response.task.description}</span>
                </div>
              </div>
            </div>
          );
        }}
      </GenericComponent>
    );
};