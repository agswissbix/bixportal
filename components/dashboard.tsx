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
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          responseExampleValue: string;
        }

function Dashboard({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                responseExampleValue: "Default"
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
              responseExampleValue: "Example"
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
    const gridRef = useRef<HTMLDivElement>(null);



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

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
            console.info('[DEBUG] Response updated from backend', response);
        }
    }, [response, responseData]);

    // PER DEVELLOPMENT 
    useEffect(() => {

       if (gridRef.current) {
          const options: GridStackOptions = {
            float: true,
            cellHeight: 80,
            draggable: { handle: '.grid-stack-item-content' },
          };

          const grid = GridStack.init(options, gridRef.current);

          // Aggiungi widget di esempio (solo una volta)
          if (grid.engine.nodes.length === 0) {
            grid.addWidget({ w: 2, h: 2, x: 0, y: 2, content: 'Widget 1', id: 'widget-1' });
            grid.addWidget({ w: 3, h: 2, x: 2, y: 0, content: 'Widget 2', id: 'widget-2' });
          }

          return () => { grid.destroy(false); }; // pulizia
        }
        return undefined;
        
        const interval = setInterval(() => {
            // forza un setState con lo stesso valore, quindi re-render inutile
            setResponseData({ responseExampleValue: 'Example' }); // stesso valore di prima

        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const uselessMemo = useMemo(() => {
        return Math.random(); // valore che cambia sempre
      }, [responseData]);
      

    console.log('[DEBUG] Rendering ExampleComponentWithData', { propExampleValue, responseData });
      
    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
              <div className="grid-stack" ref={gridRef}></div>
            )}
        </GenericComponent>
    );
};

export default Dashboard;


