import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useRecordsStore } from './records/recordsStore';
import { CircleX, Maximize2, Info, Trash2, Check } from 'lucide-react';
import CardBadge from './cardBadge';
import CardBadgeStabile from './cardBadgeStabile';
import CardTabs from './cardTabs';
import { toast, Toaster } from 'sonner';
import axiosInstance from '@/utils/axiosInstance'
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import SimplePopup from './inviaEmail';
import { Card } from './ui/card';
import { AppContext } from '@/context/appContext';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DynamicMenuItem, { CustomFunction } from './dynamicMenuItem';
import {useApi} from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { set } from 'lodash';

const isDev = false;


// INTERFACCIA PROPS
interface PropsInterface {
  tableid: string;
  recordid: string;
  mastertableid?: string;
  masterrecordid?: string;
  type: string;
  index?: number;
  total?: number;	
}
interface ResponseInterface {
  fn: CustomFunction[]
}

export default function RecordCard({ tableid,recordid,mastertableid,masterrecordid, type,index=0,total=1 }: PropsInterface) {

  const { removeCard, cardsList, setIsPopupOpen, setPopUpType, setPopupRecordId } = useRecordsStore();
  const {activeServer} = useContext(AppContext);
  const [animationClass, setAnimationClass] = useState('animate-slide-in'); 
  const [isMaximized, setIsMaximized] = useState(false);
  const [mountedTime, setMountedTime] = useState<string>("");
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  // Nuovo stato per il menu a tendina
  const [showDropdown, setShowDropdown] = useState(false);
  const responseDataDEFAULT: ResponseInterface = {
      fn: []
    };
    const responseDataDEV: ResponseInterface = {
      fn: []
    };
  
    const { user } = useContext(AppContext);
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
  
    // PAYLOAD (solo se non in sviluppo)
      const payload = useMemo(() => {
          if (isDev) return null;
          return {
              apiRoute: 'get_custom_functions',
              tableid: tableid,
          };
      }, [tableid]);
  
    // CHIAMATA AL BACKEND (solo se non in sviluppo)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };
  
    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
    useEffect(() => {
      if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
        setResponseData(response);
      }
    }, [response, responseData]);

  const getOffset = () => {
    if (isMaximized) return 0;
    const baseOffset = 30; // Base offset in pixels
    return (total - index - 1) * baseOffset;
  };

  const handleRemoveCard = () => {
    setAnimationClass('animate-slide-out');
    setTimeout(() => {
        removeCard(tableid, recordid);
    }, 300);
  };

  const deleteRecord = async () => {
        try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "delete_record",
                    tableid: tableid,
                    recordid: recordid,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            )
            handleRemoveCard();
            toast.success('Record eliminato con successo');
        } catch (error) {
            console.error('Errore durante l\'eliminazione del record', error);
            toast.error('Errore durante l\'eliminazione del record');
        }
    }

  const getEmailReady = () => {
    setIsPopupOpen(true);
  };
  
  const handleTrashClick = () => {
    toast.warning(
        "Sei sicuro di voler eliminare questo record?", 
        {
            action: {
                label: "Conferma",
                onClick: () => deleteRecord(),
            },
        }
    );
};
  
  {/*
        const handleGeneratePDF = async () => {
            try {
                const response = await axiosInstance.post('/backend_app/create_pdf/', {}, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'generated-file.pdf');
                document.body.appendChild(link);
                link.click();
            } catch (error) {
                console.error('Errore nella generazione del PDF', error);
            }
        };
    */}

  useEffect(() => {
        const now = performance.now();
        const minutes = Math.floor(now / 60000);
        const seconds = Math.floor((now % 60000) / 1000);
        const centiseconds = Math.floor((now % 1000) / 10);
        setMountedTime(`${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`);
    }, []);


  return (
    <GenericComponent title="recordCard" response={responseData} loading={loading} error={error}>
        {(response: ResponseInterface) => (
    <div
            className={`absolute shadow-[0_3px_10px_rgb(0,0,0,0.2)] bg-card-background z-10 rounded-xl border-2 border-card-border p-3 ${animationClass} ${
                isMaximized ? 'right-0 w-5/6 h-5/6' : 'w-2/6 h-5/6'
            } transition-all duration-300`}
            style={{
                right: `${getOffset() + 10}px`,
                marginTop: `${getOffset()}px`,
                zIndex: 50  + index
            }}
        >
          {showInfoPopup && (
  <div className="absolute top-5 left-5 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-72">
    <h3 className="text-lg font-semibold mb-2">Info record</h3>
    <ul className="text-sm text-gray-700">
      <li><strong>Table ID:</strong> {tableid}</li>
      <li><strong>Record ID:</strong> {recordid}</li>
      <li><strong>Master Table ID:</strong> {mastertableid || '-'}</li>
      <li><strong>Master Record ID:</strong> {masterrecordid || '-'}</li>
    </ul>
    <button 
      onClick={() => setShowInfoPopup(false)} 
      className="mt-3 bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded"
    >
      Chiudi
    </button>
  </div>
)}

            <div className="h-1/5 w-full">
              <div className="h-1/6 w-full flex justify-between items-center px-4 mb-2">
                <div className="flex-grow">
                  {activeServer !== 'belotti' && (
                    <button 
                      onClick={() => setShowInfoPopup(!showInfoPopup)} 
                      title="Mostra info"
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110 transition-all duration-100 ease-in-out"
                    >
                      <Info className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 w-full justify-end">
                  {activeServer !== 'belotti' && (
                    <>
                      {/* Dropdown menu */}
                      <div className="relative w-full">
                        <button 
                          className="theme-secondary w-1/2 float-end focus:outline-none focus:ring-2 focus:ring-accent/20
                                    font-medium rounded-md text-sm px-5 py-2.5 text-center inline-flex items-center justify-center
                                    dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800" 
                          type="button"
                          onClick={() => setShowDropdown(!showDropdown)}
                        >
                          Funzioni
                          <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>

                        {showDropdown && (
                          <div className="absolute right-0 mt-10 w-1/2 bg-white border border-gray-200 rounded shadow-lg z-50">
                            <ul className="py-1">
                              {response.fn.map((fn) => (
                                fn.context === 'cards' && (
                                  <DynamicMenuItem key={fn.title} fn={fn} params={recordid} onClick={() => {setShowDropdown(false)}} />
                                )
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => setIsMaximized(!isMaximized)}
                        title="Ingrandisci"
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110 transition-all duration-100 ease-in-out"
                      >
                        <Maximize2 className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                      </button>

                      <button 
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors hover:scale-110 transition-all duration-100 ease-in-out" 
                        onClick={handleTrashClick}
                        title="Elimina"
                      >
                        <Trash2 className="w-6 h-6 text-red-500 hover:text-red-700" />
                      </button>
                    </>
                  )}

                  {/* X SEMPRE VISIBILE */}
                  <button 
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110 transition-all duration-100 ease-in-out" 
                    onClick={handleRemoveCard}
                    title="Chiudi"
                  >
                    <CircleX className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                  </button>
                </div>
              </div>
  
              <div className="h-5/6">
              {tableid === 'stabile' ? (
              <CardBadgeStabile tableid={tableid} recordid={recordid} />
            ) : activeServer !== 'belotti' ? (
              <CardBadge tableid={tableid} recordid={recordid} />
            ) : null}

            </div>
                
            </div>
            
            <div className="h-5/6 w-full">
                <CardTabs tableid={tableid} recordid={recordid} mastertableid={mastertableid} masterrecordid={masterrecordid}></CardTabs>
            </div>
        </div>
        )}
        </GenericComponent>
  );
};