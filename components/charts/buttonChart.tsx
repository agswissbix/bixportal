"use client";

// src/components/ValueChart.tsx

import { useMemo, useState } from "react";
import DynamicMenuItem from "../dynamicMenuItem";
import { ImageIcon } from "lucide-react";
import { useFrontendFunctions } from "@/lib/functionsDispatcher";
import LoadingComp from "../loading"; 

export type CustomFunction = {
    tableid: string;
    context: string;
    title: string;
    function: string;
    conditions?: any;
    params?: any;
    css?: string;
};

interface Dataset {
    label: string;
    data: number[];
    fn?: CustomFunction;
    tableid?: string;
    image?: string;
}

export interface ChartDataInterface {
    id: number;
    name: string;
    layout: string;
    labels: string[];
    datasets: Dataset[];
}

interface Props {
    chartType: string;
    chartData: ChartDataInterface;
    view: "chart" | "table";
    activeServer?: string;
}

export default function ButtonChart({ chartData }: Props) {
    const [errorImage, setErrorImage] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const frontendFunctions = useFrontendFunctions();

    // Estrazione dati sicura
    const firstDataset = chartData?.datasets?.[0];
    const fn = firstDataset?.fn;

    const computedTitle = useMemo(() => {
        if (!fn) return "";
        if (fn.context === "table") {
            return `${fn.title} ${firstDataset.tableid ?? ""}`;
        }
        return fn.title;
    }, [fn, firstDataset?.tableid]);

    // Logica di esecuzione centralizzata
    const handleExecute = async () => {
        if (!fn || isLoading) return;

        const func = frontendFunctions[fn.function];
        const params = {
            tableid: firstDataset.tableid,
            ...(typeof fn.params === "object" ? fn.params : {}),
        };

        setIsLoading(true);
        try {
            if (func) {
                console.log(`Esecuzione: ${fn.function}`, params);
                await func(params);
            } else {
                console.warn(`Funzione non trovata: ${fn.function}`);
            }
        } catch (error) {
            console.error(`Errore esecuzione ${fn.function}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!firstDataset || !fn) {
        return <div className="p-4 text-gray-500">Nessun dato disponibile</div>;
    }

    return (
        <div className="flex items-center justify-center h-full w-full">
            <div
                className={`group relative w-full flex items-center p-1 pr-6 bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/10 hover:border-accent ${
                    isLoading
                        ? "opacity-70 pointer-events-none"
                        : "active:scale-95"
                }`}>
                {/* Area Icona / Immagine - Ora cliccabile */}
                <div
                    className="relative flex items-center justify-center w-14 h-14 m-1 rounded-xl bg-slate-50 group-hover:bg-accent transition-colors duration-300 overflow-hidden cursor-pointer"
                    onClick={handleExecute}>
                    {isLoading ? (
                        <div className="scale-75">
                            <LoadingComp />
                        </div>
                    ) : firstDataset.image && !errorImage[0] ? (
                        <img
                            src={`/api/media-proxy?url=${firstDataset.image}`}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                            onError={() =>
                                setErrorImage((prev) => ({
                                    ...prev,
                                    [0]: true,
                                }))
                            }
                            alt="icon"
                        />
                    ) : (
                        <ImageIcon className="w-7 h-7 text-slate-300 group-hover:text-white" />
                    )}
                </div>

                {/* Area Testo/Bottone */}
                <div className="ml-4 flex flex-col flex-1 justify-center">
                    <div
                        className="
            cursor-pointer
            [&_*]:!border-0 
            [&_button]:!bg-transparent 
            [&_button]:!p-0 
            [&_button]:!m-0
            [&_button]:text-2xl 
            [&_button]:font-black 
            [&_button]:tracking-tight
            [&_button]:text-slate-800
            group-hover:[&_button]:text-accent
            transition-colors
          ">
                        <DynamicMenuItem
                            key={computedTitle}
                            fn={{
                                ...fn,
                                title: computedTitle,
                            }}
                            // Passiamo handleExecute come onClick e gestiamo lo stato esternamente
                            onClick={handleExecute}
                            externalLoading={isLoading}
                        />
                    </div>

                    {/* Sottolineatura decorativa */}
                    <div
                        className={`h-1 bg-accent rounded-full transition-all duration-300 mt-0.5 ${
                            isLoading
                                ? "w-full animate-pulse"
                                : "w-0 group-hover:w-full"
                        }`}
                    />
                </div>

                {/* Effetto Glow */}
                <div className="absolute -z-10 inset-0 bg-slate-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity rounded-2xl" />
            </div>
        </div>
    );
}
