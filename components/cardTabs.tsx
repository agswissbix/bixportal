import React, { useMemo, useContext, useState, useEffect, useLayoutEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import CardFields from './cardFields';
import CardLinked from './cardLinked';
import RecordAttachments from './recordAttachments';
import RecordAttachmentsDemo from './recordAttachmentsDemo';
import { set } from 'lodash';
import DynamicTableBridge from './customCardFields/dynamicCardFieldsBridge';
import CardSteps from './customCardFields/cardSteps';
import ChartConfigForm from './customCardFields/chartFields';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          tableid: string;
          recordid: string;
          mastertableid?: string;
          masterrecordid?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            cardTabs: string[];
            activeTab: string;
        }

export default function CardTabs({ tableid,recordid,mastertableid, masterrecordid }: PropsInterface) {
    const isNewRecord = !recordid;

    const tabsRef = React.useRef<HTMLDivElement>(null);
    const [tabsHeight, setTabsHeight] = useState(0);

    const responseDataDEFAULT: ResponseInterface = {
        cardTabs: isNewRecord ? ['Campi'] : [],
        activeTab: 'Campi'
    };

    const responseDataDEV: ResponseInterface = {
        cardTabs: isNewRecord ? ['Campi'] : [],
        activeTab: 'Campi'
    };

    const { user } = useContext(AppContext);

    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_card_active_tab',
            tableid: tableid
        };
    }, [tableid, recordid]);

    const [activeTab, setActiveTab] = useState<string>('Campi');

    const { response, loading, error } = !isDev && payload
        ? useApi<ResponseInterface>(payload)
        : { response: null, loading: false, error: null };

    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
            setActiveTab(response.activeTab);
            // for the first place
            if (response.cardTabs.includes('Custom')) {
                setResponseData({
                ...responseData,
                cardTabs: [
                  'Custom',
                  ...response.cardTabs.filter(tab => tab !== 'Custom')
                ]
                });
            }
        }
    }, [response]);

    useLayoutEffect(() => {
      if (typeof window === 'undefined') return;
      const el = tabsRef.current;
      if (!el) return;
    
      const compute = () => {
        const rect = el.getBoundingClientRect();
        // se vuoi includere margin-bottom (es se header ha margin che deve essere conteggiata)
        const style = window.getComputedStyle(el);
        const marginBottom = parseFloat(style.marginBottom || '0') || 0;
        setTabsHeight(Math.ceil(rect.height + marginBottom));
      };
    
      // misura immediata (sincrona)
      compute();
    
      // osserva i cambiamenti di dimensione (copre anche cambi di contenuto asincroni)
      let ro: ResizeObserver | undefined;
      if ((window as any).ResizeObserver) {
        ro = new ResizeObserver(() => {
          // debounce tramite rAF per evitare troppi re-render rapidi
          requestAnimationFrame(compute);
        });
        ro.observe(el);
      } else {
        // fallback: ricalcola al resize della finestra
        const onResize = () => compute();
        window.addEventListener('resize', onResize);
        // cleanup rimuove listener in return
        return () => window.removeEventListener('resize', onResize);
      }
    
      // piccolo catch-all: rifai la misura al prossimo frame (utile per casi particolari)
      const rafId = requestAnimationFrame(compute);
    
      return () => {
        if (ro) ro.disconnect();
        cancelAnimationFrame(rafId);
      };
    }, []);

    return (
        <GenericComponent>
            {(data) => (
                <div className="h-full">
                    {/* Tabs */}
                    {!isNewRecord && (
                      <div ref={tabsRef} className="h-min text-sm font-medium text-center text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700">
                        <ul className="flex flex-wrap -mb-px relative">
                          {responseData.cardTabs.map((tab, index) => (
                            <li key={index} className="me-2">
                              <button
                                className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                                  activeTab === tab
                                    ? 'text-primary border-primary'
                                    : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                                }`}
                                onClick={() => setActiveTab(tab)}
                              >
                                {tab}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}


                    {/* Tab Content */}
                    <div className=" p-4" style={{ height: `calc(100% - ${tabsHeight}px)` }}>
                    {/* Mostra solo CardFields se recordid è nullo */}
                    {isNewRecord ? (
                      responseData.cardTabs.find(tab => tab === 'Custom') ? (
                        <CardSteps 
                            tableid={tableid}
                            recordid={recordid}
                            mastertableid={mastertableid}
                            masterrecordid={masterrecordid}
                          />
                      ) : (
                        tableid === 'chart' ? (
                            <ChartConfigForm
                              tableid={tableid}
                              recordid={recordid}
                              mastertableid={mastertableid}
                              masterrecordid={masterrecordid}
                            />
                          ) : (
                            <CardFields
                              tableid={tableid}
                              recordid={recordid}
                              mastertableid={mastertableid}
                              masterrecordid={masterrecordid}
                            />
                          )
                      )
                    ) : (
                      <>
                        {activeTab === 'Custom' && (
                          <CardSteps 
                            tableid={tableid}
                            recordid={recordid}
                            mastertableid={mastertableid}
                            masterrecordid={masterrecordid}
                          />
                        )}
                        {activeTab === 'Campi' && (
                          tableid === 'chart' ? (
                            <ChartConfigForm
                              tableid={tableid}
                              recordid={recordid}
                              mastertableid={mastertableid}
                              masterrecordid={masterrecordid}
                            />
                          ) : (
                            <CardFields
                              tableid={tableid}
                              recordid={recordid}
                              mastertableid={mastertableid}
                              masterrecordid={masterrecordid}
                            />
                          )
                        )}
                        {activeTab === 'Collegati' && (
                          <CardLinked tableid={tableid} recordid={recordid} />
                        )}
                        {activeTab === 'Allegati' && (
                          <RecordAttachments tableid={tableid} recordid={recordid} />
                        )}
                        {activeTab === 'AttachmentsDemo' && (
                          <RecordAttachmentsDemo tableid={tableid} recordid={recordid} />
                        )}
                        {['Campi', 'Collegati', 'Allegati', 'AttachmentsDemo', 'Custom'].indexOf(activeTab) === -1 && (
                          <div className="text-gray-400 italic">Nessun contenuto da mostrare {activeTab}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
            )}
        </GenericComponent>
    );
}




