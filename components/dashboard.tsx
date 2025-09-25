import React, { use, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRecordsStore } from './records/recordsStore';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { GridStack, GridStackOptions } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
// import MultiBarLineChart from './charts/multiBarLineChart';
// import MultiBarBarChart from './charts/multi_barbarchart';
import { createRoot } from 'react-dom/client';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';
import * as XLSX from "sheetjs-style"; // Usiamo sheetjs-style per la formattazione
import { Dispatch, SetStateAction } from 'react';
import BlockChart from './blockChart';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        

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
            type: "value" | "barchart" | "piechart" | "linechart" |"donutchart" |"heatchart" |"orizbarchart" |"polarchart" |"radarchart" |"scatterchart"  | "multibarlinechart" | "multibarchart" | "text" | "chart" | "widget" ;
            content?: string;
            gsw?: number;
            gsh?: number;
            gsx?: number;
            gsy?: number;
            chart_data?: string;
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
            type: 'barchart',
            gsw: 3, gsh: 2, gsx: 0, gsy: 0,
            fields: [], value: [], name: 'Bar Chart', labels: [],
            chart_data: JSON.stringify({
                id: 1, name: "Vendite Annuali", layout: "vertical",
                labels: ["2021", "2022", "2023", "2024"],
                datasets: [{ label: "Ricavi", data: [120000, 155000, 135000, 189000] }]
            })
        },
        {
            id: 2,
            type: 'piechart',
            gsw: 3, gsh: 2, gsx: 3, gsy: 0,
            fields: [], value: [], name: 'Pie Chart', labels: [],
            chart_data: JSON.stringify({
                id: 2, name: "Distribuzione Clienti", layout: "pie",
                labels: ["Italia", "Germania", "Francia", "Spagna"],
                datasets: [{ label: "Clienti", data: [300, 150, 200, 100] }]
            })
        },
        {
            id: 3,
            type: 'linechart',
            gsw: 3, gsh: 2, gsx: 6, gsy: 0,
            fields: [], value: [], name: 'Line Chart', labels: [],
            chart_data: JSON.stringify({
                id: 3, name: "Crescita Mensile", layout: "line",
                labels: ["Gen", "Feb", "Mar", "Apr", "Mag"],
                datasets: [{ label: "Utenti", data: [50, 65, 80, 95, 120] }]
            })
        },
        {
            id: 4,
            type: 'donutchart',
            gsw: 3, gsh: 2, gsx: 0, gsy: 2,
            fields: [], value: [], name: 'Donut Chart', labels: [],
            chart_data: JSON.stringify({
                id: 4, name: "Spesa per Categoria", layout: "donut",
                labels: ["Cibo", "Trasporti", "Shopping", "Svago"],
                datasets: [{ label: "Euro", data: [400, 150, 250, 100] }]
            })
        },
        {
            id: 5,
            type: 'heatchart',
            gsw: 3, gsh: 2, gsx: 3, gsy: 2,
            fields: [], value: [], name: 'Heatmap Chart', labels: [],
            chart_data: JSON.stringify({
                id: 5, name: "Traffico Sito Orario", layout: "heatmap",
                labels: ["Lunedì", "Martedì", "Mercoledì", "Giovedì"],
                datasets: [{ label: "9-12", data: [15, 20, 25, 22] }, { label: "12-15", data: [30, 35, 28, 40] }]
            })
        },
        // ... (aggiungi gli altri tipi di grafico con dati di sviluppo)
        {
            id: 6,
            type: 'orizbarchart',
            gsw: 3, gsh: 2, gsx: 6, gsy: 2,
            fields: [], value: [], name: 'Oriz Bar Chart', labels: [],
            chart_data: JSON.stringify({
                id: 6, name: "Prodotti più venduti", layout: "horizontal-bar",
                labels: ["Laptop", "Smartphone", "Tablet", "Smartwatch"],
                datasets: [{ label: "Unità", data: [80, 120, 50, 90] }]
            })
        },
        {
            id: 7,
            type: 'polarchart',
            gsw: 3, gsh: 2, gsx: 0, gsy: 4,
            fields: [], value: [], name: 'Polar Area Chart', labels: [],
            chart_data: JSON.stringify({
                id: 7, name: "Consumo di Energia", layout: "polar",
                labels: ["Luce", "Gas", "Acqua", "Elettricità"],
                datasets: [{ label: "Kw/h", data: [150, 80, 50, 120] }]
            })
        },
        {
            id: 8,
            type: 'radarchart',
            gsw: 3, gsh: 2, gsx: 3, gsy: 4,
            fields: [], value: [], name: 'Radar Chart', labels: [],
            chart_data: JSON.stringify({
                id: 8, name: "Statistiche Giocatore", layout: "radar",
                labels: ["Velocità", "Forza", "Agilità", "Resistenza"],
                datasets: [{ label: "Giocatore A", data: [80, 75, 90, 85] }]
            })
        },
        {
            id: 9,
            type: 'scatterchart',
            gsw: 3, gsh: 2, gsx: 6, gsy: 4,
            fields: [], value: [], name: 'Scatter Chart', labels: [],
            chart_data: JSON.stringify({
                id: 9, name: "Età vs Punteggio", layout: "scatter",
                labels: [], // labels non usate in scatter chart
                datasets: [{
                    label: "Risultati",
                    data: [
                        { x: 20, y: 55 }, { x: 25, y: 70 }, { x: 30, y: 65 }, { x: 35, y: 80 }
                    ]
                }]
            })
        },
        {
          "id": 10,
          "type": "multibarlinechart",
          "gsw": 3,
          "gsh": 2,
          "gsx": 0,
          "gsy": 6,
          "fields": [],
          "value": [],
          "name": "Multi Bar Line Chart",
          "labels": [],
          "chart_data": "{\"id\":10,\"name\":\"Vendite e Prezzi\",\"layout\":\"multi-bar-line\",\"labels\":[\"Prodotto A\",\"Prodotto B\",\"Prodotto C\"],\"datasets\":[{\"label\":\"Vendite\",\"data\":[50,70,60]}],\"datasets2\":{\"label\":\"Prezzo\",\"data\":[150,120,180],\"type\":\"line\"}}"
        },
        {
            id: 11,
            type: 'multibarchart',
            gsw: 3, gsh: 2, gsx: 3, gsy: 6,
            fields: [], value: [], name: 'Multi Bar Chart', labels: [],
            chart_data: JSON.stringify({
                id: 11, name: "Andamento Trimestrale", layout: "multi-bar-bar",
                labels: ["Q1", "Q2", "Q3", "Q4"],
                datasets: [
                    { label: "Regione Nord", data: [10, 15, 12, 20] },
                    { label: "Regione Sud", data: [8, 11, 15, 18] }
                ]
            })
        },
        {
          id: 12,
            type: 'value',
            gsw: 3, gsh: 2, gsx: 3, gsy: 6,
            fields: [], value: [], name: 'Valore', labels: [],
            chart_data: JSON.stringify({
                id: 12, name: "Andamento Trimestrale", layout: "multi-bar-bar",
                labels: ["Q1", "Q2", "Q3", "Q4"],
                datasets: [
                    { label: "Regione Nord", data: [10, 15, 12, 20], icona: "chart/prova.png" },
                ]
            })
        }
    ],
    block_list: []
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
            const widget = {
                w: block.gsw || 2,
                h: block.gsh != null ? block.gsh : 4,
                x: block.gsx || 0,
                y: block.gsy || 0,
                id: String(block.id),
            };

            const addedWidget = grid.addWidget(widget);

            if (addedWidget) {
                const contentElement = addedWidget.querySelector('.grid-stack-item-content');
                if (contentElement) {
                    contentElement.className = 'grid-stack-item-content bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden border border-gray-200';
                    const root = createRoot(contentElement);

                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            // Rimosso il controllo dei tipi. Ora deleghiamo tutto a BlockChart
                            if (block.type === 'text' || block.type === 'widget') {
                                // Blocco generico (testo, widget)
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
                            } else {
                                // Tutti i tipi di grafici gestiti da BlockChart
                                root.render(
                                    <BlockChart
                                        id={block.id}
                                        name={block.name}
                                        type={block.type}
                                        chart_data={block.chart_data || ""}
                                        onDelete={deleteBlock}
                                        onExport={handleExcelExport}
                                    />
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
                      
                
                <div className="flex mb-4 ml-4">
        <button 
            className="flex items-center text-white bg-[#2dad6e] hover:bg-green-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5" 
            onClick={onOpenPopup}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Aggiungi grafico
        </button>

        <button 
            className="flex items-center text-white bg-[#2dad6e] hover:bg-green-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm ml-4 px-5 py-2.5" 
            
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