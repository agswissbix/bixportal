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
    const isNewRecord = !recordid;

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
        if (isDev || isNewRecord) return null;
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
        }
    }, [response]);

    return (
        <GenericComponent>
            {(data) => (
                <div className="h-full">
                    {/* Tabs */}
                    {!isNewRecord && (
                      <div className="h-min text-sm font-medium text-center text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700">
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
                    <div className="h-5/6 p-4">
                    {/* Mostra solo CardFields se recordid è nullo */}
                    {isNewRecord ? (
                      <CardFields
                        tableid={tableid}
                        recordid={recordid}
                        mastertableid={mastertableid}
                        masterrecordid={masterrecordid}
                      />
                    ) : (
                      <>
                        {activeTab === 'Campi' && (
                          <CardFields
                            tableid={tableid}
                            recordid={recordid}
                            mastertableid={mastertableid}
                            masterrecordid={masterrecordid}
                          />
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
                        {['Campi', 'Collegati', 'Allegati', 'AttachmentsDemo'].indexOf(activeTab) === -1 && (
                          <div className="text-gray-400 italic">Nessun contenuto da mostrare</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
            )}
        </GenericComponent>
    );
}




