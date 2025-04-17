import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import CardFields from './cardFields';
import CardLinked from './cardLinked';
import RecordAttachments from './recordAttachments';
import RecordAttachmentsDemo from './recordAttachmentsDemo';
import { set } from 'lodash';

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
            activeTab: string;
        }

export default function CardTabs({ tableid,recordid,mastertableid, masterrecordid }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                activeTab: 'Fields'
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                activeTab: 'Fields'
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_card_active_tab', // riferimento api per il backend
            tableid: tableid
        };
    }, [tableid, recordid]);

    const [activeTab, setActiveTab] = useState<string>('Fields');


    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setActiveTab(response.activeTab);
        }
    }, [response]);


    return (
      <GenericComponent> 
      {(data) => (
          <div className="h-full">
          <div className="h-min text-sm font-medium text-center text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px relative">
              {/*
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'AttachmentsDemo'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('AttachmentsDemo')}
                >
                  AllegatiDemo
                </button>
              </li>
              */}
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Fields'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Fields')}
                >
                  Campi
                </button>
              </li>
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Linked'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Linked')}
                >
                  Collegati
                </button>
              </li>
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Attachments'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Attachments')}
                >
                  Allegati
                </button>
              </li>
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Analytics'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Analytics')}
                >
                  Statistiche
                </button>
              </li>
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Storical'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Storical')}  
                >
                  Storico 
                </button>
              </li>
            </ul>
          </div>

          <div className="h-5/6 p-4">
            {activeTab === 'Fields' && (
              <CardFields tableid={tableid} recordid={recordid}  mastertableid={mastertableid} masterrecordid={masterrecordid}/>
            )}
            {activeTab === 'Linked' && (
              <CardLinked tableid={tableid} recordid={recordid} />
            )}
            {activeTab !== 'Fields' && activeTab !== 'Linked' && activeTab !== 'Attachments' && activeTab !== 'AttachmentsDemo' && (
              <div className="text-gray-400 italic">Nessun contenuto da mostrare</div>
            )}
            {activeTab === 'Attachments' && (
              <RecordAttachments tableid={tableid} recordid={recordid}/>
            )}
            {activeTab === 'AttachmentsDemo' && (
              <RecordAttachmentsDemo tableid={tableid} recordid={recordid}/>
            )}
            
          </div>
        </div>
      )}
    </GenericComponent>
    );
};



