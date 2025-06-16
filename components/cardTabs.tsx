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

            cardTabs: []

            activeTab: string;

        }



export default function CardTabs({ tableid,recordid,mastertableid, masterrecordid }: PropsInterface) {

    //DATI

            // DATI PROPS PER LO SVILUPPO

            const devPropExampleValue = isDev ? "Example prop" : tableid;



            // DATI RESPONSE DI DEFAULT

            const responseDataDEFAULT: ResponseInterface = {

                cardTabs: [], // Array di oggetti per le tab (esempio vuoto)

                activeTab: 'Campi'

              };



            // DATI RESPONSE PER LO SVILUPPO 

            const responseDataDEV: ResponseInterface = {

                cardTabs: [], // Array di oggetti per le tab (esempio vuoto)

                activeTab: 'Campi'

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



    const [activeTab, setActiveTab] = useState<string>('Campi');



    // Determina se mostrare solo la tab Campi (quando recordid è nullo)

    const showOnlyCampiTab = !recordid;



    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)

    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };



    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)

    useEffect(() => {

        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {

            setResponseData(response);

            setActiveTab(response.activeTab);

        }

    }, [response]);





    return (

      <GenericComponent> 

      {(data) => (

          <div className="h-full">

          <div className="h-min text-sm font-medium text-center text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700">

            <ul className="flex flex-wrap -mb-px relative">

              {/* Mostra sempre la tab Campi */}

              <li className="me-2">

                <button

                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${

                    activeTab === 'Campi'

                      ? 'text-primary border-primary'

                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'

                  }`}

                  onClick={() => setActiveTab('Campi')}

                >

                  Campi

                </button>

              </li>

              

              {/* Mostra le altre tab solo se recordid non è nullo */}

              {!showOnlyCampiTab && responseData.cardTabs.map((tab, index) => (

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



          <div className="h-5/6 p-4">

            {activeTab === 'Campi' && (

              <CardFields tableid={tableid} recordid={recordid}  mastertableid={mastertableid} masterrecordid={masterrecordid}/>

            )}

            {/* Mostra il contenuto delle altre tab solo se recordid non è nullo */}

            {!showOnlyCampiTab && activeTab === 'Collegati' && (

              <CardLinked tableid={tableid} recordid={recordid} />

            )}

            {!showOnlyCampiTab && activeTab !== 'Campi' && activeTab !== 'Collegati' && activeTab !== 'Allegati' && activeTab !== 'AttachmentsDemo' && (

              <div className="text-gray-400 italic">Nessun contenuto da mostrare</div>

            )}

            {!showOnlyCampiTab && activeTab === 'Allegati' && (

              <RecordAttachments tableid={tableid} recordid={recordid}/>

            )}

            {!showOnlyCampiTab && activeTab === 'AttachmentsDemo' && (

              <RecordAttachmentsDemo tableid={tableid} recordid={recordid}/>

            )}

            

          </div>

        </div>

      )}

    </GenericComponent>

    );

};