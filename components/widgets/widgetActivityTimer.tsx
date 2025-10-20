import React, { useMemo, useContext, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "../genericComponent";
import { AppContext } from "@/context/appContext";
import { memoWithDebug } from "@/lib/memoWithDebug";

// Styling & Icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { difference } from "lodash";

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

export default function WidgetActivityTimer({
    propExampleValue,
}: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        task: null,
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
        },
    };

    // DATI DEL CONTESTO
    const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: "examplepost", // riferimento api per il backend
            example1: propExampleValue,
        };
    }, [propExampleValue]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error, elapsedTime } =
        !isDev && payload
            ? useApi<ResponseInterface>(payload)
            : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (
            !isDev &&
            response &&
            JSON.stringify(response) !== JSON.stringify(responseData)
        ) {
            setResponseData(response);
        }
    }, [response, responseData]);

    // PER DEVELOPMENT
    useEffect(() => {
        setResponseData({ ...responseDataDEV });
    }, []);

    const [timeFromStart, setTimeFromStart] = useState<Time | null>(null);
    const [timeToEnd, setTimeToEnd] = useState<Time | null>(null);
    const [progress, setProgress] = useState<number | null>(null);

    const calculateTimeFromStart = (start: Date | undefined): Time | null => {
        if (!start) return null;

        const difference = +new Date() - +start;
        if (difference <= 0) return null;

        return {
            giorni: Math.floor(difference / (1000 * 60 * 60 * 24)),
            ore: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minuti: Math.floor((difference / 1000 / 60) % 60),
            secondi: Math.floor((difference / 1000) % 60),
        };
    };

    const calculateTimeLeft = (task: Task): Time | null => {
        var endDate = task.fine ? task.fine : null;

        if (!endDate && task.durata) {
            endDate = new Date(task.inizio.getTime());

            const durata = task.durata;

            endDate.setDate(endDate.getDate() + durata.giorni);
            endDate.setHours(endDate.getHours() + durata.ore);
            endDate.setMinutes(endDate.getMinutes() + durata.minuti);
            endDate.setSeconds(endDate.getSeconds() + durata.secondi);
        } else {
            return null;
        }

        const difference = +endDate - +new Date();
        if (difference <= 0) return null;

        return {
            giorni: Math.floor(difference / (1000 * 60 * 60 * 24)),
            ore: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minuti: Math.floor((difference / 1000 / 60) % 60),
            secondi: Math.floor((difference / 1000) % 60),
        };
    };

    const calculateProgress = (task: Task): number | null => {
        const startTime = task.inizio;
        let endTime: Date | null = task.fine || null;

        if (!endTime && task.durata) {
            endTime = new Date(startTime.getTime());
            const durata = task.durata;

            endTime.setDate(endTime.getDate() + durata.giorni);
            endTime.setHours(endTime.getHours() + durata.ore);
            endTime.setMinutes(endTime.getMinutes() + durata.minuti);
            endTime.setSeconds(endTime.getSeconds() + durata.secondi);
        }

        if (!startTime || !endTime) {
            return null;
        }

        const now = +new Date();
        const totalDurationMs = +endTime - +startTime;
        const elapsedDurationMs = now - +startTime;

        if (totalDurationMs <= 0) {
            return 0;
        }

        if (elapsedDurationMs < 0) {
            return 0;
        }

        if (elapsedDurationMs >= totalDurationMs) {
            return 100;
        }

        const progress = (elapsedDurationMs / totalDurationMs) * 100;
        return Math.max(0, Math.min(100, Math.round(progress) || 0));
    };

    useEffect(() => {
        setTimeFromStart(calculateTimeFromStart(responseData.task.inizio));
        setTimeToEnd(calculateTimeLeft(responseData.task));
        setProgress(calculateProgress(responseData.task));

        const timer = setInterval(() => {
            setTimeFromStart(calculateTimeFromStart(responseData.task.inizio));
            setTimeToEnd(calculateTimeLeft(responseData.task));
            setProgress(calculateProgress(responseData.task));
        }, 1000);

        return () => clearInterval(timer);
    }, [responseData.task.inizio]);

    const format = (num: number) => num.toString().padStart(2, "0");

    return (
        <GenericComponent
            response={responseData}
            loading={loading}
            error={error}>
            {(response: ResponseInterface) => {
                if (!response.task) return <div>Nessun task da mostrare.</div>;

                return (
                    <div className="flex items-center justify-center p-4">
                        <div className="min-w-64 overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
                            <div className="w-full flex flex-col justify-center items-center p-5 space-y-3">
                                <span className="font-semibold text-gray-700">
                                    {response.task.title}
                                </span>
                                {response.task.completed ? (
                                    <div className="text-lg font-bold text-green-500">
                                        Completato
                                    </div>
                                ) : (
                                    <>
                                        {timeFromStart ? (
                                            <>
                                                <span className="text-gray-700">
                                                    Tempo dall'inizio:
                                                </span>
                                                <div className="flex justify-center items-center space-x-2 text-center">
                                                    <div className="p-2 bg-gray-100 rounded-md w-16">
                                                        <div className="text-2xl font-bold text-blue-800">
                                                            {
                                                                timeFromStart.giorni
                                                            }
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            G
                                                        </div>
                                                    </div>
                                                    <div className="p-2 bg-gray-100 rounded-md w-16">
                                                        <div className="text-2xl font-bold text-blue-800">
                                                            {format(
                                                                timeFromStart.ore
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            H
                                                        </div>
                                                    </div>
                                                    <div className="p-2 bg-gray-100 rounded-md w-16">
                                                        <div className="text-2xl font-bold text-blue-800">
                                                            {format(
                                                                timeFromStart.minuti
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            M
                                                        </div>
                                                    </div>
                                                    <div className="p-2 bg-gray-100 rounded-md w-16">
                                                        <div className="text-2xl font-bold text-red-500">
                                                            {format(
                                                                timeFromStart.secondi
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            S
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <></>
                                        )}
                                    </>
                                )}
                            </div>
                            {progress !== null &&
                            response.task &&
                            !response.task.completed ? (
                                <div className="bg-white p-5 border-t border-gray-200 text-sm text-gray-600">
                                    <div className="text-center mb-2 font-medium text-gray-700">
                                        Avanzamento: {progress}%
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            style={{ width: `${progress}%` }}
                                            className={`h-3 rounded-full transition-all duration-500 ease-out 
                                                        ${
                                                            progress < 100
                                                                ? "bg-blue-600"
                                                                : "bg-green-600"
                                                        }
                                                        ${
                                                            progress > 95 &&
                                                            progress < 100
                                                                ? "animate-pulse"
                                                                : ""
                                                        }
                                                        `}></div>
                                    </div>

                                    {timeToEnd && (
                                        <div className="mt-4 text-center">
                                            <span className="text-red-600 font-semibold">
                                                Tempo rimanente:
                                            </span>{" "}
                                            {timeToEnd.giorni > 0
                                                ? `${timeToEnd.giorni}g `
                                                : ""}
                                            {format(timeToEnd.ore)}h :{" "}
                                            {format(timeToEnd.minuti)}m :{" "}
                                            {format(timeToEnd.secondi)}s
                                        </div>
                                    )}

                                    {progress === 100 &&
                                        !response.task.completed && (
                                            <div className="flex items-center justify-center mt-3 text-red-500 font-bold">
                                                <ExclamationTriangleIcon className="w-5 h-5 mr-1" />
                                                Tempo Scaduto
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <></>
                            )}
                            <div className="bg-white p-5 border-t border-gray-200 text-sm text-gray-600">
                                <span>{response.task.description}</span>
                            </div>
                        </div>
                    </div>
                );
            }}
        </GenericComponent>
    );
}
