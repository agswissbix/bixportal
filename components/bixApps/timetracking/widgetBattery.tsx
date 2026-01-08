import React, { useMemo, useContext, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "@/components/genericComponent";
import { AppContext } from "@/context/appContext";

// Styling & Icons
import { BoltIcon, PauseIcon, PlayIcon } from "@heroicons/react/24/solid";

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
    hours: number;
}

interface ResponseInterface {
    stats: Stats;
}

export default function WidgetBattery({
    propExampleValue,
    customHours,
    cleanView = false,
    isLunchTime = false,
}: PropsInterface) {
    const responseDataDEFAULT: ResponseInterface = {
        stats: { hours: 0 },
    };

    const responseDataDEV: ResponseInterface = {
        stats: {
            hours: 3,
        },
    };

    const { user } = useContext(AppContext);
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

    const payload = useMemo(() => {
        if (isDev || customHours !== undefined) return null;
        return {
            apiRoute: "examplepost",
            example1: propExampleValue,
        };
    }, [propExampleValue, customHours]);

    const { response, loading, error } =
        !isDev && !customHours && payload
            ? useApi<ResponseInterface>(payload)
            : { response: null, loading: false, error: null };

    useEffect(() => {
        if (
            !isDev &&
            response &&
            JSON.stringify(response) !== JSON.stringify(responseData)
        ) {
            setResponseData(response);
        }
    }, [response, responseData]);

    useEffect(() => {
        if (isDev) setResponseData({ ...responseDataDEV });
    }, []);

    // CONFIGURAZIONE ORE
    const hoursPerDay = 8;
    const currentHours =
        customHours !== undefined
            ? customHours
            : responseData?.stats?.hours || 0;

    // CALCOLO RESIDUO
    const remainingHours = Math.max(0, hoursPerDay - currentHours);
    const remainingPercentage = Math.round(
        (remainingHours / hoursPerDay) * 100
    );
    const isOvertime = currentHours > hoursPerDay;

    const [displayedPercentage, setDisplayedPercentage] = useState(0);

    // Animazione della percentuale
    useEffect(() => {
        if (remainingPercentage === displayedPercentage) return;

        const interval = setInterval(() => {
            setDisplayedPercentage((prev) => {
                if (prev < remainingPercentage) return prev + 1;
                if (prev > remainingPercentage) return prev - 1;
                clearInterval(interval);
                return prev;
            });
        }, 15);

        return () => clearInterval(interval);
    }, [remainingPercentage]);

    // Colori basati sulla carica RIMANENTE
    const getBatteryColor = (percentage: number) => {
        if (isLunchTime) return "#fbbf24"; // Giallo pausa
        if (isOvertime) return "#ef4444"; // Rosso (batteria scarica/overtime)
        if (percentage > 50) return "#22c55e"; // Verde (molta carica)
        if (percentage > 20) return "#f59e0b"; // Arancione (metà carica)
        return "#ef4444"; // Rosso (carica bassa)
    };

    const Battery = ({ percentage }: { percentage: number }) => {
        const color = getBatteryColor(percentage);
        const fillWidth = Math.max(0, Math.min(100, percentage));

        return (
            <div className="flex items-center justify-center">
                <div
                    className={`w-24 h-10 bg-white border-2 border-gray-700 rounded-lg p-1 relative flex items-center transition-all ${
                        isLunchTime
                            ? "border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                            : ""
                    } ${
                        isOvertime
                            ? "animate-[flash-red-border_1.2s_infinite]"
                            : ""
                    }`}>
                    {/* Livello Carica */}
                    <div
                        style={{
                            width: `${fillWidth}%`,
                            backgroundColor: color,
                        }}
                        className="h-full rounded transition-all duration-500 ease-in-out"></div>

                    {/* Icone di stato */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        {isLunchTime ? (
                            <PauseIcon className="w-6 h-6 text-amber-600/80 animate-pulse" />
                        ) : isOvertime ? (
                            <BoltIcon className="w-6 h-6 text-red-600 animate-pulse" />
                        ) : percentage <= 20 ? (
                            <BoltIcon className="w-6 h-6 text-red-400/50" />
                        ) : null}
                    </div>
                </div>
                <div
                    className={`w-1.5 h-5 rounded-r-sm transition-colors ${
                        isLunchTime ? "bg-amber-400" : "bg-gray-700"
                    }`}></div>
            </div>
        );
    };

    const content = (
        <div
            className={`flex flex-col items-center justify-center ${
                !cleanView ? "p-4" : ""
            }`}>
            <Battery percentage={displayedPercentage} />

            <div
                className={`text-3xl font-bold mt-2 flex items-center ${
                    isLunchTime ? "text-amber-500" : "text-gray-800"
                }`}>
                {isLunchTime ? (
                    <span className="text-sm font-medium uppercase tracking-widest animate-pulse">
                        In Pausa
                    </span>
                ) : (
                    <span>{displayedPercentage}%</span>
                )}
            </div>

            {!cleanView && (
                <div className="mt-4 text-sm text-center text-gray-500">
                    {currentHours < hoursPerDay ? (
                        <>
                            Mancano <b>{remainingHours.toFixed(1)}</b> ore alla
                            fine
                        </>
                    ) : (
                        <span className="text-red-500 font-bold underline">
                            Overtime: +{(currentHours - hoursPerDay).toFixed(1)}{" "}
                            ore
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    if (cleanView) {
        return content;
    }

    return (
        <GenericComponent
            response={responseData}
            loading={loading}
            error={error}>
            {() => (
                <div className="flex items-center justify-center p-4">
                    <div className="min-w-64 overflow-hidden rounded-lg bg-white shadow-md border border-gray-200 relative">
                        {!customHours && (
                            <div className="bg-white p-5 border-t border-gray-200">
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute top-2 right-2"
                                    onClick={() => alert("Action")}>
                                    Nuovo
                                </button>
                            </div>
                        )}

                        <div className="w-full p-5">{content}</div>
                    </div>
                </div>
            )}
        </GenericComponent>
    );
}
