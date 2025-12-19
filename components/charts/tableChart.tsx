// src/components/ValueChart.tsx

import React from 'react';
import RecordsTable from '../recordsTable';
import { TooltipProvider } from '../ui/tooltip';
import { useRecordsStore } from '../records/recordsStore';
import { SquareArrowDownRight, SquareArrowOutUpRight, SquareArrowUpRight, SquarePlus } from 'lucide-react';
import QuickFilters from '../quickFilters';

interface Dataset {
  label: string;
  image?: string;
  tableid?: string
  view?: number | string;
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
}

export default function TableChart({ chartData, view }: Props) {
  const { handleRowClick, selectedMenu, setSelectedMenu, searchTerm } = useRecordsStore();


  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return <div className="p-4 text-gray-500">Nessun dato disponibile</div>;
  }
  const firstDataset = chartData?.datasets[0];

  // Vista "chart" minimalista - solo valore e immagine
  return (
    <div className="px-2">
        {firstDataset && (
            <>
            <TooltipProvider>

            <div className='flex justify-between items-center'>
              <button 
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-accent text-gray-700 hover:text-accent font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]`}
                onClick={() => handleRowClick('linked', '', firstDataset.tableid)}>
                  <SquarePlus className="h-5 w-5" />
                  <span>Aggiungi {firstDataset.tableid}</span>
              </button>

              <button 
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-accent text-gray-700 hover:text-accent font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]`}
                onClick={() => setSelectedMenu(firstDataset?.tableid)}>
                  <SquareArrowOutUpRight className="h-5 w-5" />
                  <span>Vai nella pagina {firstDataset.tableid}</span>
              </button>
            </div>

            {/* <div className='mt-4'> */}
              {/* TODO preview chart si bugga */}
              {/* <QuickFilters tableid={firstDataset.tableid}/>
            </div> */}

            <RecordsTable
                tableid={firstDataset.tableid}
                context="standard"
                searchTerm={searchTerm}
                view={firstDataset.view?.toString()}
                limit={10}
                />
            </TooltipProvider>
            </>
        )}
    </div>
  );
}