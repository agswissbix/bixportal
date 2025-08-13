import React, { use, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRecordsStore } from './records/recordsStore';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { GridStack, GridStackOptions } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import BarChart2 from './barChart2';
import PieChart2 from './pieChart2';
import LineChart from './lineChart2';
import DonutChart from './donutChart2';
import HeatmapChart from './heatChart2';
import OrizBarChart from './orizbarChart2';
import PolarChart from './polarChart2';
import RadarChart from './radarChart2';
import ScatterChart from './scatterChart2';
import { createRoot } from 'react-dom/client';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';
import * as XLSX from "sheetjs-style"; // Usiamo sheetjs-style per la formattazione


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false; // Cambiato a true per test

// INTERFACCE
        // INTERFACCIA PROPS
        import { Dispatch, SetStateAction } from 'react';

        interface PropsInterface {
          onOpenPopup: () => void; // Funzione opzionale per aprire il popup
          dashboardId?: string; // ID della dashboard, opzionale per test
          selectedYears?: string[];
          refreshDashboard?: number; // Stato per forzare il refresh della dashboard
          setRefreshDashboard?: Dispatch<SetStateAction<number>>; // Funzione opzionale per
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          blocks?: {
            fields: string[];
            value: string[];
            name: string;
            labels: string[];
            id: number;
            type: "barchart" | "piechart" | "linechart" |"donutchart" |"heatchart" |"orizbarchart" |"polarchart" |"radarchart" |"scatterchart"  | "text" | "chart" | "widget" ;
            content?: string;
            gsw?: number;
            gsh?: number;
            gsx?: number;
            gsy?: number;
          }[];

          block_list:
          {
            id: number;
            dashboardid: number;
            name: string;
            userid: string;
            reportid: number;
            viewid: number;
          }[];
        }


function Dashboard({ onOpenPopup, dashboardId, selectedYears, refreshDashboard, setRefreshDashboard }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                blocks: [], // Aggiunto array vuoto
                block_list: [] // Aggiunto array vuoto
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
              blocks: [
                {
                  id: 1,
                  type: 'text',
                  gsw: 2,
                  gsh: 2,
                  gsx: 0,
                  gsy: 0,
                  fields: [],
                  value: [],
                  name: 'Text Block',
                  labels: []
                },
                {
                  id: 2,
                  type: 'chart',
                  gsw: 3,
                  gsh: 2,
                  gsx: 2,
                  gsy: 0,
                  fields: [],
                  value: [],
                  name: 'Chart Block',
                  labels: []
                },
                {
                  id: 3,
                  type: 'widget',
                  gsw: 2,
                  gsh: 3,
                  gsx: 0,
                  gsy: 2,
                  fields: [],
                  value: [],
                  name: 'Widget Block',
                  labels: []
                }
              ],

              block_list: [
                {
                  id: 1,
                  dashboardid: 1,
                  name: 'Block 1',
                  userid: 'user1',
                  reportid: 1,
                  viewid: 1
                },
                {
                  id: 2,
                  dashboardid: 1,
                  name: 'Block 2',
                  userid: 'user1',
                  reportid: 2,
                  viewid: 2
                }
              ]
            };


            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
    const gridRef = useRef<HTMLDivElement>(null);
    const gridInstanceRef = useRef<GridStack | null>(null);

    const [selectedBlock, setSelectedBlock] = useState<string>(''); // Stato per il blocco selezionato

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_dashboard_blocks', // riferimento api per il backend
            userid: user,
            dashboardid: dashboardId,
            years: selectedYears,
          };
    }, [user,selectedYears, refreshDashboard]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
            console.info('[DEBUG] Response updated from backend', response);
        }
    }, [response, responseData]);


    const saveDashboardDisposition = async () => {
      const value_list: { gsX: string | null; gsY: string | null; gsW: string | null; gsH: string | null; id: string | null; size: string; }[] = [];
      
      gridInstanceRef.current?.getGridItems().forEach((item) => {
          const gsX = item.getAttribute('gs-x');
          const gsY = item.getAttribute('gs-y');
          const gsW = item.getAttribute('gs-w');
          const gsH = item.getAttribute('gs-h');
          const id = item.getAttribute('gs-id');
          const res = item.getAttribute('data-gs-resize') || '1';

          value_list.push({
              'gsX': gsX,
              'gsY': gsY,
              'gsW': gsW,
              'gsH': gsH,
              'id': id,
              'size': res
          });
      });

      try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "save_dashboard_disposition",
          'values': value_list,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success('Disposizione della dashboard salvata con successo');
      console.info('[DEBUG] Dashboard disposition saved', response.data);

    } catch (error) {
      console.error('Errore durante il salvataggio della disposizione della dashboard', error);
      toast.error('Errore durante il salvataggio della disposizione della dashboard');
    }
  };

  const addDashboardBlock = async () => {
      
      const blockid = selectedBlock;

      try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "add_dashboard_block",
          'blockid': blockid,
          'userid': user,
          'size': 'full',
          'dashboardid': dashboardId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success('Disposizione della dashboard salvata con successo');

    } catch (error) {
      console.error('Errore durante il salvataggio della disposizione della dashboard', error);
      toast.error('Errore durante il salvataggio della disposizione della dashboard');
    }
  };

  const handleExcelExport = (blockid: number) => {
    const record = (responseData.blocks ?? []).find((block) => block.id === blockid);
    if (!record) return;
  
    const data = [
      ["Categoria", "Valore"],
      ...record.labels.map((label, index) => [label, record.value[index] || ""])
    ];
  
    const worksheet = XLSX.utils.aoa_to_sheet(data);
  
    worksheet["!cols"] = [{ wch: 20 }, { wch: 20 }];
  
    // Stile base per tutte le celle: bordi + centratura orizzontale e verticale
    const baseStyle = {
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  
    // Stile header personalizzato
    const headerStyle = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "DCE6F1" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cell_address]) continue;
        // Applica stile header alla prima riga, altrimenti baseStyle
        worksheet[cell_address].s = R === 0 ? headerStyle : baseStyle;
      }
    }
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Composizione 2025");
    XLSX.writeFile(workbook, "composizione-soci-2025.xlsx");
  };

  const deleteBlock = async (blockId: number) => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "delete_dashboard_block",
          blockid: blockId,
          dashboardid: dashboardId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Blocco eliminato con successo");
      if (setRefreshDashboard) {
        setRefreshDashboard((prev: number) => prev + 1); // Forza il refresh della dashboard
      }
      
    }
    catch (error) {
      console.error("Errore durante l'eliminazione del blocco", error);
      toast.error("Errore durante l'eliminazione del blocco");
    }
  }

    // INIZIALIZZAZIONE GRIDSTACK
    // INIZIALIZZAZIONE GRIDSTACK
useEffect(() => {
    if (!gridRef.current) return;

    if (!gridInstanceRef.current) {
        const options: GridStackOptions = {
            float: true,
            cellHeight: 80,
            margin: 10, 
            draggable: { handle: '.grid-stack-item-content' },
            resizable: { handles: 'e, se, s, sw, w' }
        };
        gridInstanceRef.current = GridStack.init(options, gridRef.current);
    }

    const grid = gridInstanceRef.current;
    grid.removeAll();

    if (responseData.blocks && responseData.blocks.length > 0) {
        responseData.blocks.forEach(block => {
            
            // Step 1: Definiamo il widget per GridStack SENZA content pre-stilizzato.
            // Gridstack creerà da solo il .grid-stack-item-content di base.
          const widget = {
              w: block.gsw || 2,
              h: block.gsh != null ? block.gsh : 4,  // <-- Controlla esplicitamente null/undefined
              x: block.gsx || 0,
              y: block.gsy || 0,
              id: String(block.id),
          };

            const addedWidget = grid.addWidget(widget);

            if (addedWidget) {
                // Step 2: Troviamo il vero elemento .grid-stack-item-content che GridStack ha creato.
                const contentElement = addedWidget.querySelector('.grid-stack-item-content');
                if (contentElement) {

                    // Step 3: APPLICHIAMO LE NOSTRE CLASSI DI STILE QUI, all'elemento corretto.
                    contentElement.className = 'grid-stack-item-content bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden border border-gray-200';

                    const root = createRoot(contentElement);

                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            // Step 4: Renderizziamo la nostra struttura interna.
                            // La logica flexbox è già nelle classi del contentElement,
                            // quindi non servono più gli style in linea.
                            
                            if (block.type === 'barchart' || block.type === 'piechart' || block.type === 'linechart' || block.type === 'donutchart' || block.type === 'heatchart' || block.type === 'orizbarchart' || block.type === 'polarchart' || block.type === 'radarchart' || block.type === 'scatterchart') {
                                root.render(
                                    <>
                                        {/* Header unificato con bottoni-icona */}
                                        <div className="px-4 pt-4 pb-2 flex justify-between items-center flex-shrink-0">
                                            <h4 className="text-lg font-semibold text-gray-700">{block.name}</h4>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleExcelExport(block.id)}
                                                    className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                                                    title="Scarica Excel"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => deleteBlock(block.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                                                    title="Elimina Blocco"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Contenitore del grafico che si espande */}
                                        <div className="w-full flex-grow p-4">
                                            {block.type === 'barchart' && (
                                                <BarChart2
                                                    values={block.value}
                                                    labels={block.labels}
                                                    name={block.name}
                                                    fields={block.fields}
                                                />
                                            )}
                                            {block.type === 'piechart' && (
                                                <PieChart2
                                                    values={block.value}
                                                    labels={block.labels}
                                                    name={block.name}
                                                    fields={block.fields}
                                                />
                                            )}
                                            {block.type === 'linechart' && (
                                                <LineChart
                                                    values={block.value}
                                                    labels={block.labels}
                                                    name={block.name}
                                                    fields={block.fields}
                                                />
                                            )}
                                            {block.type === 'donutchart' && (
                                                <DonutChart
                                                    values={block.value}
                                                    labels={block.labels}
                                                    name={block.name}
                                                    fields={block.fields}
                                                />
                                            )}
                                            {block.type === 'heatchart' && (
                                                <HeatmapChart
                                                    values={block.value}
                                                    labels={block.labels}
                                                    name={block.name}
                                                    fields={block.fields}
                                                />
                                            )}
                                            {block.type === 'orizbarchart' && (
                                                <OrizBarChart
                                                    values={block.value}
                                                    labels={block.labels}
                                                    name={block.name}
                                                    fields={block.fields}
                                                />
                                            )}
                                            {block.type === 'polarchart' && (
                                                <PolarChart
                                                    values={block.value}
                                                    labels={block.labels}
                                                    name={block.name}
                                                    fields={block.fields}
                                                />
                                            )}
                                            {block.type === 'radarchart' && (
                                                <RadarChart
                                                    values={block.value}
                                                    labels={block.labels}
                                                    name={block.name}
                                                    fields={block.fields}
                                                />
                                            )}
                                            {block.type === 'scatterchart' && (
                                                <ScatterChart
                                                    values={block.value}
                                                    labels={block.labels}
                                                    name={block.name}
                                                    fields={block.fields}
                                                />
                                            )}
                                        </div>
                                    </>
                                );
                            } else {
                                // Blocco generico (es. testo)
                                root.render(
                                    <div className="p-4 w-full h-full">
                                        <h4 className="text-lg font-semibold mb-2 text-gray-700">{block.name}</h4>
                                        <div className="text-gray-600">
                                            {block.content ? (
                                                <div dangerouslySetInnerHTML={{ __html: block.content }} />
                                            ) : (
                                                <p>Block type: {block.type}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        }, 200);
                    });
                }
            }
        });
    }

    return () => {
        if (gridInstanceRef.current) {
            gridInstanceRef.current.destroy(false);
            gridInstanceRef.current = null;
        }
    };
}, [responseData]);

    console.log('[DEBUG] Rendering Dashboard', { responseData });
      
    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
              <div>
                {/* 👇 ELEMENTO AGGIUNTO PER IL DEBUG 👇 */}
          
          {/* 👆 FINE ELEMENTO DI DEBUG 👆 */}
                      
                
                <div className="flex mt-2 ml-4">
        <button 
            className="flex items-center text-white bg-primary hover:bg-primaryHover focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5" 
            onClick={onOpenPopup}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Aggiungi grafico
        </button>

        <button 
            className="flex items-center text-white bg-secondary hover:bg-secondaryHover focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm ml-4 px-5 py-2.5" 
            
            onClick={saveDashboardDisposition}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Salva disposizione
        </button>

        
    </div>
              <div 
                className="grid-stack" 
                ref={gridRef}
                style={{ minHeight: '100%', width: '100%' }}
              >
              </div>
              </div>
              
            )}
        </GenericComponent>
    );
};

export default Dashboard;