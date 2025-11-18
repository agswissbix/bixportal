import React from 'react';
import ReactApexChart, { Props as ReactApexChartProps } from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// Estendo Props di ReactApexChart per includere tutti i tipi di series possibili
interface ExtendedApexOptions extends ApexOptions {
    series?: ReactApexChartProps['series'];
}

interface Dataset {
    label: string;
    data: number[] | { x: string; y: number }[];
}

interface ChartDataInterface {
    id: number;
    name: string;
    layout: string;
    labels: string[];
    datasets: Dataset[];
    datasets2?: Dataset[] | Dataset;
    colors?: string[];
    numeric_format?: string
}

interface Props {
    chartType: string;
    chartData: ChartDataInterface | null;
    view: 'chart' | 'table';
    showDataLabels?: boolean;
    hideMeta?: boolean;
}

// --- HELPERS ---
/**
 * Palette di colori preselezionati per un aspetto visivo più gradevole e coerente.
 */
const PLEASANT_COLORS = [
    '#0099C6'
];

/**
 * Restituisce un colore casuale dalla palette predefinita.
 * @returns {string} Un colore in formato esadecimale.
 */
const getRandomColorFromPalette = () => {
    return PLEASANT_COLORS[Math.floor(Math.random() * PLEASANT_COLORS.length)];
};

/**
 * Componente generico per la visualizzazione di grafici e tabelle.
 * Unifica il parsing e il rendering di diversi tipi di grafici.
 */
export default function GenericChart({ chartType, chartData, view, showDataLabels, hideMeta = false }: Props) {
    if (!chartData || !chartData.datasets || !chartData.labels) {
        return <div className="p-4 text-red-500">Dati del grafico non validi</div>;
    }

    const fmt = (v: number) =>
        new Intl.NumberFormat(chartData.numeric_format || "it-CH", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(v);

    // --- VISTA TABELLA (Logica comune) ---
    if (view === 'table') {
        const allDatasets = chartData.datasets2 && Array.isArray(chartData.datasets2) ? [...chartData.datasets, ...chartData.datasets2] : chartData.datasets;
        return (
            <div className="h-full overflow-y-auto" style={{ transform: 'rotateY(180deg)' }}>
                <table className="min-w-full bg-white border border-gray-300 text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="py-2 px-4 border-b text-left font-medium text-gray-600">{"Categoria"}</th>
                            {allDatasets.map((d, i) => (
                                <th key={i} className="py-2 px-4 border-b text-left font-medium text-gray-600">
                                    {d.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {chartData.labels.map((label, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{label}</td>
                                {allDatasets.map((d, j) => (
                                    <td key={j} className="py-2 px-4 border-b">
                                        <>
                                            {Array.isArray(d.data)
                                                ? (() => {
                                                    const value = d.data[i];
                                                    return typeof value === 'number'
                                                        ? fmt(value)
                                                        : value
                                                })()
                                                : (() => {
                                                      const found = (d.data as { x: string; y: number }[]).find(item => item.x === label);
                                                      return found
                                                        ? fmt(found.y)
                                                        : '';
                                                  })()
                                            }
                                        </>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // --- VISTA GRAFICO (Logica specifica per tipo) ---
    if (view === 'chart') {
        const safeLabels = chartData.labels.map(label =>
            label ?? "N/A"
        );

        // Opzioni di base comuni a tutti i grafici
        let finalOptions: ExtendedApexOptions = { 
            chart: { 
                id: `chart-${chartData.id}`,
                toolbar: {
                    show: true,
                    tools: {
                        download: false,
                        selection: false,
                        zoom: false,
                        zoomin: false,
                        zoomout: false,
                        pan: false,
                        reset: false,
                    },
                }, 
            }, 
        };
        let finalSeries: ExtendedApexOptions['series'] = [];
        let finalType: 'line' | 'bar' | 'pie' | 'donut' | 'polarArea' | 'radar' | 'heatmap' | 'scatter' = 'line';

        switch (chartType) {
            case "barchart":
                finalType = "bar";
                finalSeries = chartData.datasets.map((d) => ({
                    name: d.label,
                    data: d.data,
                })) as ApexOptions["series"];
                finalOptions = {
                    ...finalOptions,
                    xaxis: { categories: safeLabels },
                    dataLabels: { enabled: showDataLabels ?? false },
                    stroke: { width: 2 },
                    colors:
                        chartData.colors ||
                        chartData.datasets.map(() => getRandomColorFromPalette()),
                    legend: { position: "bottom" }, 
                };
                break;
            case "orizbarchart":
                finalType = "bar";
                const singleSeriesData = chartData.datasets[0]?.data || [];
                finalSeries = [{ data: singleSeriesData as number[] }];
                const pleasantColors = singleSeriesData.map(() =>
                    getRandomColorFromPalette()
                );
                finalOptions = {
                    ...finalOptions,
                    chart: { ...finalOptions.chart,  },
                    colors: chartData.colors || pleasantColors, 
                    xaxis: {
                        categories: safeLabels,
                        title: {
                            text: chartData.datasets[0].label ? chartData.datasets[0].label : undefined,
                        },
                    },
                    // yaxis: { title: { text: t('genericApexChart.year', 'Anno')} },
                    plotOptions: {
                        bar: {
                            borderRadius: 4,
                            horizontal: true,
                            distributed: true,
                        },
                    },
                    dataLabels: { enabled: showDataLabels ?? false },
                    legend: { show: false },
                };
                break;
            case "linechart":
                finalType = "line";
                finalSeries = chartData.datasets.map((d) => ({
                    name: d.label,
                    data: d.data,
                })) as ApexOptions["series"];
                finalOptions = {
                    ...finalOptions,
                    stroke: { curve: "smooth", width: 2 },
                    xaxis: { categories: safeLabels },
                    tooltip: { shared: true, intersect: false },
                    legend: { position: "bottom" },
                    colors:
                        chartData.colors ||
                        chartData.datasets.map(() => getRandomColorFromPalette()),
                    dataLabels: { enabled: showDataLabels ?? false },
                };
                break;
            case "piechart":
            case "donutchart":
                finalType = chartType === "piechart" ? "pie" : "donut";
                finalSeries = chartData.datasets[0]?.data as number[];
                finalOptions = {
                    ...finalOptions,
                    labels: safeLabels,
                    chart: {
                        ...finalOptions.chart,
                        animations: { enabled: true, speed: 800 },
                    },
                    legend: { position: "bottom" },
                    colors:
                        chartData.colors ||
                        safeLabels.map(() => getRandomColorFromPalette()),
                };
                break;
            case "polarchart":
                finalType = "polarArea";
                finalSeries = chartData.datasets[0]?.data as number[];
                finalOptions = {
                    ...finalOptions,
                    labels: safeLabels,
                    chart: {
                        ...finalOptions.chart,
                        animations: { enabled: true, speed: 800 },
                    },
                    legend: { position: "bottom" },
                    fill: { opacity: 0.8 },
                    stroke: { width: 1, colors: ["#fff"] },
                    colors:
                        chartData.colors ||
                        safeLabels.map(() => getRandomColorFromPalette()),
                };
                break;
            case "radarchart":
                finalType = "radar";
                finalSeries = chartData.datasets.map((d) => ({
                    name: d.label,
                    data: d.data,
                })) as ApexOptions["series"];
                finalOptions = {
                    ...finalOptions,
                    xaxis: { categories: safeLabels },
                    stroke: { width: 2 },
                    fill: { opacity: 0.3 },
                    markers: { size: 4 },
                    colors:
                        chartData.colors ||
                        chartData.datasets.map(() => getRandomColorFromPalette()),
                    legend: { position: "bottom" },
                    dataLabels: { enabled: showDataLabels ?? false },
                };
                break;
            case "heatchart":
                finalType = "heatmap";
                finalSeries = chartData.datasets.map((d) => {
                    const data = d.data as { x: string; y: number }[];
                    return {
                        name: d.label,
                        data: data.map((val, i) => {
                            if (typeof val === "number") {
                                return { x: safeLabels[i], y: val };
                            }
                            return val;
                        }),
                    };
                }) as ApexOptions["series"];
                finalOptions = {
                    ...finalOptions,
                    dataLabels: { enabled: true, style: { colors: ["#000"] } },
                    colors: chartData.colors || [PLEASANT_COLORS[0]], 
                    xaxis: { type: "category", categories: safeLabels },
                    yaxis: { show: true },
                    legend: { show: true },
                    tooltip: {
                        y: { formatter: (val: number) => val.toFixed(0) },
                    },
                };
                break;
            case "scatterchart":
                finalType = "scatter";
                finalSeries = chartData.datasets.map((d) => ({
                    name: d.label,
                    data: safeLabels.map((label, i) => ({
                        x: label,
                        y: (d.data as number[])[i],
                    })),
                })) as ApexOptions["series"];
                finalOptions = {
                    ...finalOptions,
                    chart: {
                        ...finalOptions.chart,
                        zoom: { enabled: true, type: "xy" },
                        toolbar: { show: true },
                    },
                    xaxis: {
                        type: "category",
                        categories: safeLabels,
                        // title: { text: "Anno" },
                    },
                    yaxis: { title: { text: chartData.datasets[0].label ? chartData.datasets[0].label : undefined, } },
                    markers: { size: 6 },
                    tooltip: { shared: false, intersect: true },
                    colors:
                        chartData.colors ||
                        chartData.datasets.map(() => getRandomColorFromPalette()),
                    legend: { position: "bottom" },
                };
                break;
            case "multibarlinechart":
                const barSeries = chartData.datasets.map((d) => ({
                    name: d.label,
                    data: d.data,
                    type: "bar" as const,
                }));

                const lineDataset = chartData.datasets2
                    ? Array.isArray(chartData.datasets2)
                        ? chartData.datasets2[0]
                        : chartData.datasets2
                    : null;

                const lineSeries = lineDataset
                    ? {
                          name: lineDataset.label,
                          data: lineDataset.data,
                          type: "line" as const,
                      }
                    : null;

                finalSeries = (
                    lineSeries ? [...barSeries, lineSeries] : barSeries
                ) as ApexAxisChartSeries;
                finalType = "line"; // Il tipo base in ApexCharts è 'line' per i grafici misti

                const leftAxisColor =
                    chartData.colors && chartData.colors.length > 0
                        ? chartData.colors[0]
                        : PLEASANT_COLORS[0]; 

                const lineSeriesIndex = chartData.datasets.length;

                let rightAxisColor = "#FF4560";

                if (
                    lineSeries &&
                    chartData.colors &&
                    chartData.colors.length > lineSeriesIndex
                ) {
                    rightAxisColor = chartData.colors[lineSeriesIndex];
                }

                const yaxisConfig: ApexYAxis[] = [
                    {
                        min: 0,
                        axisTicks: { show: true },
                        axisBorder: { show: true, color: leftAxisColor },
                        labels: { style: { colors: leftAxisColor } },
                        title: {
                            text: chartData.datasets[0].label ? chartData.datasets[0].label : undefined,
                            style: { color: leftAxisColor, fontWeight: 600 },
                        },
                    },
                ];

                if (lineSeries) {
                    yaxisConfig.push({
                        show: true,
                        opposite: true,
                        min: 0,
                        forceNiceScale: true,
                        axisTicks: { show: true },
                        axisBorder: { show: true, color: rightAxisColor },
                        labels: { style: { colors: rightAxisColor } },
                        title: {
                            text: lineSeries.name,
                            style: { color: rightAxisColor, fontWeight: 600 },
                        },
                    });
                }

                const multibarColorsFallback = [
                    ...chartData.datasets.map(() => leftAxisColor), 
                    ...(lineSeries ? [rightAxisColor] : []), 
                ];

                finalOptions = {
                    ...finalOptions,
                    chart: { ...finalOptions.chart, stacked: false,  },
                    colors: chartData.colors || multibarColorsFallback,
                    dataLabels: {
                        enabled: showDataLabels ?? false, // o showDataLabels
                        formatter: function (val, opts?: any) {
                             const seriesIndex = opts?.seriesIndex;
                             const dataPointIndex = opts?.dataPointIndex;
                             const w = opts?.w;
                             const series = w?.config?.series?.[seriesIndex];

                             const toStringArray = (arr: any[]) => arr.map(v => (typeof v === "number" ? fmt(v) : String(v)));

                            // 🔵 Caso 1: Serie a barre → mostra sempre le etichette
                            if (series?.type === "bar") {
                                if (Array.isArray(val)) {
                                    // Apex expects string[] (not number[]), convert numbers to formatted strings
                                    return toStringArray(val);
                                }
                                return val;
                            }
                            // 🔴 Caso 2: Serie linea → mostra solo l’ultimo punto
                            if (series?.type === "line") {
                                const lastIndex = (w?.globals?.series?.[seriesIndex]?.length ?? 1) - 1;
                                if (dataPointIndex !== lastIndex) return "";
                                if (Array.isArray(val)) {
                                    return toStringArray(val);
                                }
                                return val;
                            }
                            return "";
                        }
                    },
                    stroke: {
                        width: finalSeries.map((s) =>
                            s.type === "line" ? 3 : 0
                        ),
                        curve: "smooth",
                    },
                    xaxis: { categories: safeLabels },
                    yaxis: yaxisConfig,
                    tooltip: {
                        y: { formatter: (val) => val.toString() },
                    },
                    legend: {
                        position: "top",
                        horizontalAlign: "left",
                        offsetX: 40,
                    },
                };
                break;
            case "stackedchart":
                finalType = "bar";
                const allBarStackedDatasets =
                    chartData.datasets2 && Array.isArray(chartData.datasets2)
                        ? [...chartData.datasets, ...chartData.datasets2]
                        : chartData.datasets;
                finalSeries = allBarStackedDatasets.map((d) => ({
                    name: d.label,
                    data: d.data,
                })) as ApexOptions["series"];
                finalOptions = {
                    ...finalOptions,
                    chart: {
                        ...finalOptions.chart,
                        type: "bar",
                        stacked: true,
                    },
                    plotOptions: {
                        bar: { horizontal: false, columnWidth: "55%" },
                    },
                    dataLabels: { enabled: showDataLabels ?? false },
                    stroke: { show: true, width: 2, colors: ["transparent"] },
                    xaxis: {
                        categories: safeLabels,
                        // title: { text: "Anno" },
                    },
                    yaxis: {
                        title: { text: chartData.datasets[0].label ? chartData.datasets[0].label : undefined, },
                    },
                    fill: { opacity: 1 },
                    tooltip: { y: { formatter: (val) => val.toString() } },
                    legend: {
                        position: "top",
                        horizontalAlign: "left",
                        offsetX: 40,
                    },
                    colors:
                        chartData.colors ||
                        allBarStackedDatasets.map(() =>
                            getRandomColorFromPalette()
                        ),
                };
                break;
                
            case 'stackedpercentchart':
                finalType = 'bar';
                const allBarStackedDatasetspercent = chartData.datasets2 && Array.isArray(chartData.datasets2)
                    ? [...chartData.datasets, ...chartData.datasets2]
                    : chartData.datasets;
                finalSeries = allBarStackedDatasetspercent.map(d => ({
                    name: d.label,
                    data: d.data,
                })) as ApexOptions['series'];
                finalOptions = {
                    ...finalOptions,
                    chart: { 
                        ...finalOptions.chart,
                        type: 'bar', 
                        stacked: true, 
                        stackType: '100%' 
                    },
                    plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
                    dataLabels: { enabled: showDataLabels ?? false },
                    stroke: { show: true, width: 2, colors: ['transparent'] },
                    xaxis: { categories: safeLabels, title: { text: "Anno" } },
                    yaxis: { title: { text: "Percentuale %" } },
                    fill: { opacity: 1 },
                    tooltip: { y: { formatter: (val) => `${val.toFixed(2)}%` } },
                    legend: { position: 'top', horizontalAlign: 'left', offsetX: 40 },
                    colors:
                        chartData.colors ||
                        allBarStackedDatasetspercent.map(() => getRandomColorFromPalette()),
                };
                break;

            case 'orizstackedchart':
                finalType = 'bar';
                const allBarStackedDatasetsoriz =
                    chartData.datasets2 && Array.isArray(chartData.datasets2)
                        ? [...chartData.datasets, ...chartData.datasets2]
                        : chartData.datasets;
                finalSeries = allBarStackedDatasetsoriz.map(d => ({
                    name: d.label,
                    data: d.data,
                })) as ApexOptions['series'];
                finalOptions = {
                    ...finalOptions,
                    chart: { 
                        ...finalOptions.chart,
                        type: 'bar', 
                        
                        stacked: true 
                    },
                    plotOptions: { bar: { horizontal: true, columnWidth: '55%' } },
                    dataLabels: { enabled: showDataLabels ?? false },
                    stroke: { show: true, width: 2, colors: ['transparent'] },
                    xaxis: { categories: safeLabels, title: { text: chartData.datasets[0].label ? chartData.datasets[0].label : undefined } },
                    // yaxis: { title: { text: t('genericApexChart.value', 'Valore')} },
                    fill: { opacity: 1 },
                    tooltip: { y: { formatter: (val) => val.toString() } },
                    legend: { position: 'top', horizontalAlign: 'left', offsetX: 40 },
                    colors:
                        chartData.colors ||
                        allBarStackedDatasetsoriz.map(() => getRandomColorFromPalette()),
                };
                break;

            case 'orizstackedchartpercent':
                finalType = 'bar';
                const allBarStackedDatasetsorizpercent =
                    chartData.datasets2 && Array.isArray(chartData.datasets2)
                        ? [...chartData.datasets, ...chartData.datasets2]
                        : chartData.datasets;
                finalSeries = allBarStackedDatasetsorizpercent.map(d => ({
                    name: d.label,
                    data: d.data,
                })) as ApexOptions['series'];
                finalOptions = {
                    ...finalOptions,
                    chart: { 
                        ...finalOptions.chart,
                        type: 'bar', 
                        
                        stacked: true, 
                        stackType: '100%' 
                    },
                    plotOptions: { bar: { horizontal: true, columnWidth: '55%' } },
                    dataLabels: { enabled: showDataLabels ?? false },
                    stroke: { show: true, width: 2, colors: ['transparent'] },
                    xaxis: { categories: safeLabels, title: { text: chartData.datasets[0].label ? chartData.datasets[0].label : undefined } },
                    // yaxis: { title: { text: t('genericApexChart.percentage', 'Percentuale %')} },
                    fill: { opacity: 1 },
                    tooltip: { y: { formatter: (val) => `${val.toFixed(2)}%` } },
                    legend: { position: 'top', horizontalAlign: 'left', offsetX: 40 },
                    colors:
                        chartData.colors ||
                        allBarStackedDatasetsorizpercent.map(() => getRandomColorFromPalette()),
                };
                break;

            default:
                console.warn(`Tipo di grafico non supportato: ${chartType}`);
                return (
                    <div className="p-4 text-red-500">
                        {"Tipo di grafico non supportato"}
                    </div>
                );
        }

        const localFormatter = finalOptions.dataLabels?.formatter;

        finalOptions = {
            ...finalOptions,

            // TOOLTIP
            tooltip: {
                ...finalOptions.tooltip,
                y: {
                    ...(finalOptions.tooltip?.y || {}),
                    formatter: fmt
                }
            },
            
            // DATA LABELS
            dataLabels: {
                ...finalOptions.dataLabels,
                formatter: (val, ctx) => {
                    // 1) Prima formatter locale
                    const local = localFormatter ? localFormatter(val, ctx) : val;

                    // Se il formatter locale decide che non va mostrato
                    if (local === "" || local === null || local === undefined) return "";

                    // 2) Poi formatter globale numerico
                    if (typeof local === "number") {
                        return fmt(local);
                    }
                    return "";
                }
            },

            // YAXIS (singolo o array)
            yaxis: Array.isArray(finalOptions.yaxis)
                ? finalOptions.yaxis.map(axis => ({
                    ...axis,
                    labels: {
                        ...(axis.labels || {}),
                        formatter: fmt
                    }
                }))
                : {
                    ...(finalOptions.yaxis || {}),
                    labels: {
                        ...(finalOptions.yaxis?.labels || {}),
                        // formatter: fmt
                    }
                }
        };

        if (hideMeta) {
            finalOptions = {
                ...finalOptions,
                dataLabels: { enabled: false, },
                legend: { show: false },
                tooltip: { enabled: false },
                xaxis: {
                    ...finalOptions.xaxis,
                    labels: { show: false },
                    axisTicks: { show: false },
                    axisBorder: { show: false },
                    title: { text: undefined }
                },
                yaxis: Array.isArray(finalOptions.yaxis)
                    ? finalOptions.yaxis.map(axis => ({
                        ...axis,
                        labels: { show: false },
                        axisTicks: { show: false },
                        axisBorder: { show: false },
                        title: { text: undefined }
                    }))
                    : {
                        labels: { show: false },
                        axisTicks: { show: false },
                        axisBorder: { show: false },
                        title: { text: undefined }
                    }
            };
        }


        return (
            <ReactApexChart
            key={hideMeta ? "hidden" : "visible"}
                options={finalOptions}
                series={finalSeries}
                type={finalType}
                height="400"
            />
        );
    }
    
    return null;
}