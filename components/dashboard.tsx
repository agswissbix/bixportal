import React, { use, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRecordsStore } from './records/recordsStore';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { GridStack, GridStackOptions } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import BarChart from './charts/barChart';
import { createRoot } from 'react-dom/client';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false; // Cambiato a true per test

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          blocks?: {
            fields: string[];
            value: string[];
            name: string;
            labels: string[];
            id: number;
            type: string;
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


function Dashboard({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

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
            userid: user
          };
    }, [user]);

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
          apiRoute: "save_dashboard_disposition",
          'blockid': blockid,

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

    // INIZIALIZZAZIONE GRIDSTACK
    useEffect(() => {
        if (!gridRef.current) return;

        // Inizializza GridStack solo se non esiste già
        if (!gridInstanceRef.current) {
            const options: GridStackOptions = {
                float: true,
                cellHeight: 80,  
                draggable: { handle: '.grid-stack-item-content' },
                resizable: { handles: 'e, se, s, sw, w' }
            };

            gridInstanceRef.current = GridStack.init(options, gridRef.current);
            console.info('[DEBUG] GridStack initialized');
        }

        const grid = gridInstanceRef.current;
        
        // Pulisci widgets esistenti
        grid.removeAll();

        // Aggiungi widgets dai dati response
        if (responseData.blocks && responseData.blocks.length > 0) {
            responseData.blocks.forEach(block => {
                // Crea un contenitore div per il widget
                const widgetElement = document.createElement('div');
                widgetElement.className = 'grid-stack-item-content p-2';
                widgetElement.style.backgroundColor = '#f8f9fa';
                widgetElement.style.border = '1px solid #dee2e6';
                widgetElement.style.borderRadius = '4px';

                const widget = {
                    w: block.gsw || 2,
                    h: 4,
                    x: block.gsx || 0,
                    y: block.gsy || 0,
                    id: String(block.id),
                    content: widgetElement
                };

                // Aggiungi il widget a GridStack
                const addedWidget = grid.addWidget(widget);

                // Dopo aver aggiunto il widget, trova il contenuto e renderizza il componente React
                if (addedWidget) {
    const contentElement = addedWidget.querySelector('.grid-stack-item-content');
    if (contentElement) {
        // Crea e monta il componente React
        const root = createRoot(contentElement);

        // Delay rendering to ensure layout has completed
        requestAnimationFrame(() => {
            setTimeout(() => {
                if (block.type === 'barchart') {
                    root.render(
                        <BarChart  
                            values={block.value} 
                            labels={block.labels}
                            name={block.name} 
                            fields={block.fields}
                        />
                    );
                } else {
                    root.render(
                        <div className="p-3 w-full h-full bg-white">
                            <h4 className="text-lg font-semibold mb-2">{block.name}</h4>
                            <p>Block type: {block.type}</p>
                            {block.content && <div dangerouslySetInnerHTML={{ __html: block.content }} />}
                        </div>
                    );
                }
            }, 200); // Delay sufficiente per assestamento layout
        });
    }
}

            });
        } else {
            console.log("Nessun blocco disponibile.");
        }

        console.info('[DEBUG] Widgets added to grid', responseData.blocks);

        // Cleanup function
        return () => {
            if (gridInstanceRef.current) {
                gridInstanceRef.current.destroy(false);
                gridInstanceRef.current = null;
            }
        };
    }, [responseData]); // Dipende solo da responseData

    console.log('[DEBUG] Rendering Dashboard', { propExampleValue, responseData });
      
    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
              <div>
                <select value={selectedBlock} onChange={(e) => setSelectedBlock(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                  <option key='default' value="" className="form-select-item">
                      Seleziona un blocco da aggiungere
                  </option>
                  {responseData.block_list.map((block) => (
                    <option key={block.id} value={block.id} className="form-select-item">
                      {block.name}
                    </option>
                  ))}
                </select>
                <button className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 font-medium rounded-md text-sm m-2 px-5 py-2.5 me-2 mt-2" onClick={addDashboardBlock}>Aggiungi blocco</button>
                <button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm ml-6 px-5 py-2.5 me-2 mt-2" onClick={saveDashboardDisposition}>Salva disposizione</button>
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