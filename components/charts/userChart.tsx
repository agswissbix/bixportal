"use client";

// src/components/ValueChart.tsx

import { useMemo, useState } from "react";
import DynamicMenuItem from "../dynamicMenuItem";
import { ImageIcon } from "lucide-react";
import { useFrontendFunctions } from "@/lib/functionsDispatcher";
import LoadingComp from "../loading"; 
import WidgetEmployee from "../widgets/widgetEmployee";

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
    userid?: number
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
}

export default function UserChart({ chartData }: Props) {

    // Estrazione dati sicura
    const firstDataset = chartData?.datasets?.[0];
    const userid = firstDataset?.userid;

    if (!firstDataset || !userid) {
        return <div className="p-4 text-gray-500">Nessun dato disponibile</div>;
    }

    return (
        <div className="flex items-center justify-center h-full w-full">
            <WidgetEmployee userid={userid} />
        </div>
    );
}
