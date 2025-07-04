import React, { use, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRecordsStore } from './records/recordsStore';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { GridStack, GridStackOptions } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true; // Cambiato a true per test

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          blocks?: {
            id: string;
            type: string;
            content?: string;
            gsw?: number;
            gsh?: number;
            gsx?: number;
            gsy?: number;
          }[];
        }


function Dashboard({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                blocks: [] // Aggiunto array vuoto
            };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
              blocks: [
                {
                  id: 'block-1',
                  type: 'text',
                  gsw: 2,
                  gsh: 2,
                  gsx: 0,
                  gsy: 0
                },
                {
                  id: 'block-2',
                  type: 'chart',
                  gsw: 3,
                  gsh: 2,
                  gsx: 2,
                  gsy: 0
                },
                {
                  id: 'block-3',
                  type: 'widget',
                  gsw: 2,
                  gsh: 3,
                  gsx: 0,
                  gsy: 2
                }
              ]
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
    const gridRef = useRef<HTMLDivElement>(null);
    const gridInstanceRef = useRef<GridStack | null>(null);

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
                const widget = {
                    w: block.gsw || 2,
                    h: block.gsh || 2,
                    x: block.gsx || 0,
                    y: block.gsy || 0,
                    id: block.id,
                    content: block.content || '',
                };
                grid.addWidget(widget);
            });
        } else {
           
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
              <div 
                className="grid-stack" 
                ref={gridRef}
                style={{ minHeight: '500px', width: '100%' }}
              ></div>
            )}
        </GenericComponent>
    );
};

export default Dashboard;