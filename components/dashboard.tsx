import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import BarChart from './charts/barChart';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            blockList: {
                id: number;
                name: string;
                dashboardid: number | null;
                reportid: number | null;
                userid: number;
                viewid: number;
                widgetid: number | null;
                calendarid: number | null;
                width: number | null;
                height: number | null;
                order: number | null;
                gsx: number | null;
                gsy: number | null;
                gsw: number | null;
                gsh: number | null;
            }[];

            blocks: {
                id: number;
                dashboardBlockId: number;
                type: string;
                gsx: number;
                gsy: number;
                gsw: number;
                gsh: number;
                viewid: number;
                widgetid: number | null;
                width: string;
                height: string;
            }[];
        }

export default function Dashboard({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                blockList: [],
                blocks: []
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                blockList: [],
                blocks: [
                    {
                        id: 306,
                        dashboardBlockId: 20,
                        type: "barchart",
                        gsx: 0,
                        gsy: 0,
                        gsw: 2,
                        gsh: 2,
                        viewid: 67,
                        widgetid: null,
                        width: "4",
                        height: "50%",
                      },
                      {
                        id: 307,
                        dashboardBlockId: 21,
                        type: "barchart",
                        gsx: 0,
                        gsy: 1,
                        gsw: 2,
                        gsh: 2,
                        viewid: 68,
                        widgetid: null,
                        width: "4",
                        height: "50%",
                      },
                ],
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'examplepost', // riferimento api per il backend
            example1: propExampleValue
        };
    }, [propExampleValue]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        const grid = GridStack.init();
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    
    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                 <div>
                    <p>Dashboard</p>
                    <div className="grid-stack">
                        {response.blocks.map((block) => (
                            <div key={block.id} className="grid-stack-item" gs-x={block.gsx} gs-y={block.gsy} gs-w={block.gsw} gs-h={block.gsh}>
                                {block.type === 'barchart' && <BarChart dashboardBlockId={block.dashboardBlockId} blockId={block.id} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </GenericComponent>
    );
};
