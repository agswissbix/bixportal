import React, { useMemo, useState, useEffect } from 'react';
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

export default function RecordCard({ tableid,recordid,mastertableid,masterrecordid, type,index=0,total=1 }: PropsInterface) {

  const { removeCard, cardsList, setIsPopupOpen, setPopUpType, setPopupRecordId } = useRecordsStore();
  const [animationClass, setAnimationClass] = useState('animate-slide-in'); 
  const [isMaximized, setIsMaximized] = useState(false);
  const [mountedTime, setMountedTime] = useState<string>("");
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  // Nuovo stato per il menu a tendina
  const [showDropdown, setShowDropdown] = useState(false);


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

  const stampaBollettino = async () => {
    try {
      //download a file from the response
      //const response = await axiosInstance.post('/customapp_pitservice/stampa_bollettino_test/', { recordid }, {responseType: 'blob'});
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "stampa_bollettino",
          recordid: recordid,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition ? contentDisposition.split('filename=')[1].split(';')[0] : 'bollettino-standard.pdf';
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      toast.success('Bollettino stampato con successo');

    } catch (error) {
      console.error('Errore durante la stampa del bollettino', error);
      toast.error('Errore durante la stampa del bollettino');
    }
  }

  const sendEmail = async () => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "send_email_from_record",
          recordid: recordid,
        },


        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success('Email inviata con successo');
    } catch (error) {
      console.error("Errore durante l'invio della email", error);
      toast.error("Errore durante l'invio della email");
    }
  }

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
    <div
            className={`absolute shadow-[0_3px_10px_rgb(0,0,0,0.2)] bg-gray-50 z-10 rounded-xl border-2 border-gray-50 p-3 ${animationClass} ${
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
                <div className='h-1/6 w-full flex justify-between items-center'>
                    <div className="flex">
                      <button 
                        onClick={() => setShowInfoPopup(!showInfoPopup)} 
                        title="Mostra info"
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110 transition-all duration-100 ease-in-out"
                      >
                        <Info className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                      </button>
                    </div>
                    <div className="flex items-center gap-5">
                        {/* -------------------- MENU A TENDINA -------------------- */}
            <div className="relative">

              

              <button 
                className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 
                           font-medium rounded-md text-sm px-5 py-2.5 text-center inline-flex items-center 
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
                
                <div 
                  className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded shadow-lg z-50"
                >
                  <ul className="py-1">
                    {tableid === 'bollettini' && (
                        <li 
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            toast.info('Stampa bollettino in corso...');
                            stampaBollettino();
                            setShowDropdown(false);
                          }}
                        >
                          Stampa bollettino
                        </li>
                    )}

                    {tableid === 'email' && (
                        <li 
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            toast.info('Invio email in corso...');
                            sendEmail();
                          }}
                        >
                          Invia email
                        </li>
                    )}

                    {tableid === 'rendicontolavanderia' && (
                        <li 
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          // Qui puoi inserire la logica per funzione2
                          setPopupRecordId(recordid);
                          setIsPopupOpen(true);
                          setPopUpType('email');
                          setShowDropdown(false);;
                        }}
                      >
                        Invia rendiconto
                      </li>
                    )}

                    {tableid === 'stabile' && (
                        <li 
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          // Qui puoi inserire la logica per funzione2
                          setPopupRecordId(recordid);
                          setIsPopupOpen(true);
                          setPopUpType('reportGasolio');
                          setShowDropdown(false);
                        }}
                      >
                        Report gasolio
                      </li>
                    )}
                    {tableid === 'bollettinitrasporto' && (
                        <li 
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          // Qui puoi inserire la logica per funzione2
                          setPopupRecordId(recordid);
                          setIsPopupOpen(true);
                          setPopUpType('email');
                          setShowDropdown(false);;
                        }}
                      >
                        Invia email
                      </li>
                    )}


                   
                  </ul>
                </div>
              )}
            </div>
            {/* ------------------ FINE MENU A TENDINA ------------------ */}
                        

                        <button 
                          onClick={() => setIsMaximized(!isMaximized)} 
                          title="Visualizza informazioni"
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110 transition-all duration-100 ease-in-out"
                      >
                          <Info className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                      </button>

                      <button 
                          onClick={() => setIsMaximized(!isMaximized)} 
                          title="Ingrandisci"
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors hover:scale-110 transition-all duration-100 ease-in-out"
                      >
                          <Maximize2 className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                      </button>

                      <button 
                          className="p-2 rounded-full hover:bg-red-100 transition-colors hover:scale-110 transition-all duration-100 ease-in-out" 
                          onClick={handleTrashClick}
                          title="Elimina"
                      >
                          <Trash2 className="w-6 h-6 text-primary hover:text-red-500" />
                      </button>

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
                    <CardBadgeStabile tableid={tableid} recordid={recordid}></CardBadgeStabile>
                ) : (
                    <CardBadge tableid={tableid} recordid={recordid}></CardBadge>
                )}
                </div>
                
            </div>
            
            <div className="h-5/6 w-full">
                <CardTabs tableid={tableid} recordid={recordid} mastertableid={mastertableid} masterrecordid={masterrecordid}></CardTabs>
            </div>
        </div>
  );
};