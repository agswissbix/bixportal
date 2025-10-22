import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';

// Styling & Icons
import { CheckCircleIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/solid';

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
    inizio: Date;
    fine?: Date;
    durata?: Time;
    completed: boolean;
    timeSpent: number;
}

interface Time {
    giorni: number;
    ore: number;
    minuti: number;
    secondi: number;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
    task: Task;
}

const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};


const isWithinWorkingHours = (): boolean => {
    const now = new Date();
    const day = now.getDay(); 
    const hour = now.getHours();

    const isWeekday = day >= 1 && day <= 5;
    const isWorkHour = hour >= 9 && hour < 17;

    return isWeekday && isWorkHour;
};

export default function WidgetTaskTracker({ propExampleValue }: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
      task: null
    };

    const responseDataDEV: ResponseInterface = {
        task: {
            id: "a1b2c3d4",
            title: "Aggiornare doc",
            description: "Aggiornare la documentazione con le informazioni",
            inizio: new Date(Date.now() - 1 * 60 * 60 * 1000),
            // fine: new Date(Date.now() + 4 * 60 * 60 * 1000),
            durata: {
                giorni: 0,
                ore: 1,
                minuti: 10,
                secondi: 0,
            },
            completed: false,
            timeSpent: 0
        },
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

    const [isTracking, setIsTracking] = useState(false);
    const [timeSpent, setTimeSpent] = useState(
        responseData.task?.timeSpent || 0
    );
    const [isWorkingTime, setIsWorkingTime] = useState(isWithinWorkingHours());

    useEffect(() => {
        setTimeSpent(responseData.task?.timeSpent || 0);
    }, [responseData.task]);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;

        if (isTracking && !responseData.task?.completed) {
            timer = setInterval(() => {
                const isCurrentlyWorkTime = isWithinWorkingHours();
                setIsWorkingTime(isCurrentlyWorkTime);

                if (isCurrentlyWorkTime) {
                    setTimeSpent((prevTime) => prevTime + 1);
                }
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isTracking, responseData.task?.completed]);

    const handleToggleTracking = () => {
        if (responseData.task?.completed) return;
        setIsTracking((prev) => !prev);
    };

    const getStatusInfo = () => {
        if (responseData.task?.completed) {
            return { text: "Completato", color: "bg-gray-400" };
        }
        if (!isTracking) {
            return { text: "Non Attivo", color: "bg-red-500" };
        }
        if (isWorkingTime) {
            return { text: "Attivo", color: "bg-green-500 animate-pulse" };
        }
        return { text: "In Pausa (fuori orario)", color: "bg-yellow-500" };
    };

    const status = getStatusInfo();
    const isCompleted = responseData.task?.completed;

    const toggleBgClass = isTracking
        ? "bg-green-500"
        : isCompleted
        ? "bg-gray-400"
        : "bg-red-500";

    return (
      <GenericComponent response={responseData} loading={loading} error={error}>
        {(response: ResponseInterface) => {
          return (
              <div className="flex items-center justify-center p-4">
                  <div className="min-w-64 overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
                      <div className="w-full flex flex-col justify-center items-center p-5">
                          <div className="text-center">
                              <h3 className="font-bold text-gray-800 text-lg">
                                  {response.task.title}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                  {response.task.description}
                              </p>
                          </div>
                      </div>

                      <div className="bg-white p-5 border-t border-gray-200 text-sm">
                          <div className="font-mono text-5xl font-bold text-gray-800 bg-gray-100 rounded-lg p-4 w-full text-center">
                              {formatTime(timeSpent)}
                          </div>
                      </div>

                      <div className="bg-white p-5 border-t border-gray-200 text-sm">
                          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                              <div
                                  className={`w-3 h-3 rounded-full ${status.color}`}></div>
                              <span>
                                  Stato:{" "}
                                  <span className="font-semibold">
                                      {status.text}
                                  </span>
                              </span>
                          </div>
                      </div>

                      <div className="bg-white p-5 border-t border-gray-200 text-sm">
                          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                              <button
                                  onClick={handleToggleTracking}
                                  disabled={isCompleted}
                                  className={`relative inline-flex h-10 w-24 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none ${toggleBgClass} ${
                                      isCompleted ? "cursor-not-allowed" : ""
                                  }`}
                                  aria-label="Toggle Tracking">
                                  <span
                                      className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                                          isTracking
                                              ? "translate-x-14"
                                              : "translate-x-1"
                                      }`}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-between px-2">
                                      <PauseIcon
                                          className={`h-6 w-6 ${
                                              isTracking
                                                  ? "text-white"
                                                  : "text-red-200"
                                          }`}
                                      />
                                      <PlayIcon
                                          className={`h-6 w-6 ${
                                              !isTracking
                                                  ? "text-white"
                                                  : "text-green-200"
                                          }`}
                                      />
                                  </div>
                              </button>
                          </div>
                      </div>

                      {isCompleted && (
                          <div className="bg-white p-5 border-t border-gray-200 text-sm">
                              <div className="bg-green-100 p-4 border-t border-green-200 text-center text-green-800 font-semibold flex items-center justify-center">
                                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                                  <span>Task completata!</span>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          );
        }}
      </GenericComponent>
    );
};