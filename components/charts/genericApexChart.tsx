import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

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
    datasets2?: Dataset[] | Dataset; // Aggiornato per gestire sia array che singolo dataset
}

interface Props {
    chartType: string;
    chartData: string;
    view: 'chart' | 'table';
}

const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

/**
 * Componente generico per la visualizzazione di grafici e tabelle.
 * Unifica il parsing e il rendering di diversi tipi di grafici.
 */
export default function GenericChart({ chartType, chartData, view }: Props) {
    let parsed: ChartDataInterface | null = null;
    try {
        if (typeof chartData === "string") {
            parsed = JSON.parse(chartData);
        } else {
            parsed = chartData as ChartDataInterface;
        }
    } catch (e) {
        console.error('Errore durante il parsing dei dati del grafico:', e);
        return <div className="p-4 text-red-500">Dati del grafico non validi.</div>;
    }

    if (!parsed || !parsed.datasets || !parsed.labels) {
        return <div className="p-4 text-red-500">Dati del grafico non validi.</div>;
    }

    // Gestione della vista a tabella (logica comune per tutti i grafici)
    if (view === 'table') {
        const allDatasets = parsed.datasets2 && Array.isArray(parsed.datasets2) ? [...parsed.datasets, ...parsed.datasets2] : parsed.datasets;
        return (
            <div className="h-full overflow-y-auto" style={{ transform: 'rotateY(180deg)' }}>
                <table className="min-w-full bg-white border border-gray-300 text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="py-2 px-4 border-b text-left font-medium text-gray-600">Categoria</th>
                            {allDatasets.map((d, i) => (
                                <th key={i} className="py-2 px-4 border-b text-left font-medium text-gray-600">
                                    {d.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {parsed.labels.map((label, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{label}</td>
                                {allDatasets.map((d, j) => (
                                    <td key={j} className="py-2 px-4 border-b">
                                        <>
                                        {Array.isArray(d.data)
                                            ? d.data[i]
                                            : (() => {
                                                const found = (d.data as { x: string; y: number }[]).find(item => item.x === label);
                                                return found ? found.y : '';
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

    // Gestione della vista a grafico (logica specifica per tipo)
    if (view === 'chart') {
        parsed.labels.forEach((label, index) => {
            if (label === null || label === undefined) {
                parsed!.labels[index] = 'N/A';
            }
        });

        let finalOptions: ApexOptions = { chart: { toolbar: { show: false } } };
        let finalSeries: ApexOptions['series'] = [];
        let finalType: 'line' | 'bar' | 'pie' | 'donut' | 'polarArea' | 'radar' | 'heatmap' | 'scatter' = 'line';

        switch (chartType) {
            case 'barchart':
                finalType = 'bar';
                finalSeries = parsed.datasets.map((d) => ({ name: d.label, data: d.data })) as ApexOptions['series'];
                finalOptions = {
                    xaxis: { categories: parsed.labels },
                    dataLabels: { enabled: false },
                    stroke: { width: 2 },
                };
                break;
            case 'orizbarchart':
                finalType = 'bar';
                const singleSeriesData = parsed.datasets[0]?.data || [];
                finalSeries = [{ data: singleSeriesData as number[] }];
                const randomColors = singleSeriesData.map(() => getRandomColor());
                finalOptions = {
                    chart: { toolbar: { show: false } },
                    colors: randomColors,
                    xaxis: { categories: parsed.labels, title: { text: parsed.labels.length > 0 ? 'Anno' : undefined } },
                    yaxis: { title: { text: 'Valore' } },
                    plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true } },
                    dataLabels: { enabled: true },
                    legend: { show: false },
                };
                break;
            case 'linechart':
                finalType = 'line';
                finalSeries = parsed.datasets.map((d) => ({ name: d.label, data: d.data })) as ApexOptions['series'];
                finalOptions = {
                    stroke: { curve: 'smooth', width: 2 },
                    xaxis: { categories: parsed.labels },
                    tooltip: { shared: true, intersect: false },
                    legend: { position: 'bottom' },
                };
                break;
            case 'piechart':
            case 'donutchart':
                finalType = chartType === 'piechart' ? 'pie' : 'donut';
                finalSeries = parsed.datasets[0]?.data as number[];
                finalOptions = {
                    labels: parsed.labels,
                    chart: { animations: { enabled: true, speed: 800 }, toolbar: { show: false } },
                    legend: { position: 'bottom' },
                };
                break;
            case 'polarchart':
                finalType = 'polarArea';
                finalSeries = parsed.datasets[0]?.data as number[];
                finalOptions = {
                    labels: parsed.labels,
                    chart: { animations: { enabled: true, speed: 800 }, toolbar: { show: false } },
                    legend: { position: 'bottom' },
                    fill: { opacity: 0.8 },
                    stroke: { width: 1, colors: ['#fff'] },
                };
                break;
            case 'radarchart':
                finalType = 'radar';
                finalSeries = parsed.datasets.map((d) => ({ name: d.label, data: d.data })) as ApexOptions['series'];
                finalOptions = {
                    xaxis: { categories: parsed.labels },
                    stroke: { width: 2 },
                    fill: { opacity: 0.3 },
                    markers: { size: 4 },
                };
                break;
            case 'heatchart':
                finalType = 'heatmap';
                finalSeries = parsed.datasets.map(d => {
                    const data = d.data as { x: string, y: number }[];
                    return {
                        name: d.label,
                        data: data.map((val, i) => {
                            if (typeof val === 'number') {
                                return { x: parsed.labels[i], y: val };
                            }
                            return val;
                        }),
                    };
                }) as ApexOptions['series'];
                finalOptions = {
                    dataLabels: { enabled: true, style: { colors: ['#000'] } },
                    colors: ['#008FFB'],
                    xaxis: { type: 'category', categories: parsed.labels },
                    yaxis: { show: true },
                    legend: { show: true },
                    tooltip: { y: { formatter: (val: number) => val.toFixed(0) } },
                };
                break;
            case 'scatterchart':
                finalType = 'scatter';
                finalSeries = parsed.datasets.map(d => ({
                    name: d.label,
                    data: parsed.labels.map((label, i) => ({ x: label, y: (d.data as number[])[i] })),
                })) as ApexOptions['series'];
                finalOptions = {
                    chart: { zoom: { enabled: true, type: 'xy' }, toolbar: { show: true } },
                    xaxis: { type: 'category', categories: parsed.labels, title: { text: 'Anno' } },
                    yaxis: { title: { text: 'Valore' } },
                    markers: { size: 6 },
                    tooltip: { shared: false, intersect: true },
                };
                break;
            case 'multibarlinechart':
                // 1. Prepara TUTTE le serie BARRE (da parsed.datasets)
                const barSeries = parsed.datasets.map(d => ({
                    name: d.label,
                    data: d.data,
                    type: 'bar' as const, // Aggiunto 'as const' per chiarezza di tipo
                }));

                // 2. Prepara la singola serie LINEA (da parsed.datasets2)
                const lineDataset = parsed.datasets2 
                    ? (Array.isArray(parsed.datasets2) ? parsed.datasets2[0] : parsed.datasets2)
                    : null;
                
                const lineSeries = lineDataset ? {
                    name: lineDataset.label,
                    data: lineDataset.data,
                    type: 'line' as const, // Aggiunto 'as const'
                } : null;

                // 3. Combina le serie: Bar (multiple) + Line (singola). 
                // L'ordine è importante: le barre sono le prime, la linea è l'ultima.
                finalSeries = (lineSeries ? [...barSeries, lineSeries] : barSeries) as ApexAxisChartSeries;
                finalType = 'line'; 

                // 4. Configura le opzioni (Assi Y)
                const yaxisConfig: ApexYAxis[] = [
                    {
                        // Asse Y Sinistro: Assegna automaticamente a tutte le serie di tipo 'bar'
                        // Se ci sono più barre, questo asse le gestisce.
                        min: 0,
                        axisTicks: { show: true },
                        axisBorder: { show: true, color: '#008FFB' },
                        labels: { style: { colors: '#008FFB' } },
                        title: { text: "Valori Barre", style: { color: '#008FFB', fontWeight: 600 } },
                    },
                ];

                if (lineSeries) {
                    // Asse Y Destro: È sempre il secondo asse nell'array (indice 1)
                    yaxisConfig.push({
        // *** PUNTO CRITICO: Non usiamo seriesName, ci affidiamo all'ordine.
        // ApexCharts assegna automaticamente la serie all'asse Y libero.
        // Poiché la linea è l'ultima in finalSeries, si prende l'ultimo asse.
                        show: true,
                        opposite: true,
                        min: 0,
                        forceNiceScale: true,
                        axisTicks: { show: true },
                        axisBorder: { show: true, color: '#FF4560' },
                        labels: { style: { colors: '#FF4560' } },
                        title: { text: lineSeries.name, style: { color: '#FF4560', fontWeight: 600 } },
                    });
                }

                finalOptions = {
                    // ... (configurazioni precedenti)
    chart: { stacked: false, toolbar: { show: false } },
    dataLabels: { enabled: false },
    stroke: {
        width: finalSeries.map(s => s.type === 'line' ? 3 : 0),
        curve: 'smooth',
    },
    xaxis: { categories: parsed.labels },
    yaxis: yaxisConfig, // Usiamo l'array configurato
                    tooltip: {
                        y: { formatter: (val) => val.toString() }
                    },
                    legend: {
                        position: 'top',
                        horizontalAlign: 'left',
                        offsetX: 40
                    }
                };
                break;
            case 'stackedchart':
                finalType = 'bar';
                const allBarStackedDatasets = parsed.datasets2 && Array.isArray(parsed.datasets2) ? [...parsed.datasets, ...parsed.datasets2] : parsed.datasets;
                finalSeries = allBarStackedDatasets.map(d => ({ name: d.label, data: d.data })) as ApexOptions['series'];
                finalOptions = {
                    chart: { type: 'bar', toolbar: { show: false }, stacked: true },
                    plotOptions: {
                        bar: { horizontal: false, columnWidth: '55%' },
                    },
                    dataLabels: { enabled: false },
                    stroke: { show: true, width: 2, colors: ['transparent'] },
                    xaxis: {
                        categories: parsed.labels,
                        title: { text: 'Anno' },
                    },
                    yaxis: {
                        title: { text: 'Valore' },
                    },
                    fill: { opacity: 1 },
                    tooltip: { y: { formatter: (val) => val.toString() } },
                    legend: { position: 'top', horizontalAlign: 'left', offsetX: 40 },
                };
                break;
            default:
                console.warn(`Tipo di grafico non supportato: ${chartType}`);
                return (<div className="p-4 text-red-500">Tipo di grafico non supportato.</div>);
        }

        console.log("chartData preview:", chartData);
console.log("series:", finalSeries);
console.log("options:", finalOptions);

        return <ReactApexChart options={finalOptions} series={finalSeries} type={finalType} height="400" />;
    }
    
    return null;
}