import React, { useMemo, useState, useEffect } from 'react';
import { useRecordsStore } from './records/recordsStore';
import { CircleX, Maximize2, Info, Trash2, Check } from 'lucide-react';
import CardBadge from './cardBadge';
import CardTabs from './cardTabs';
import { toast, Toaster } from 'sonner';
import axiosInstance from '@/utils/axiosInstance'
import SimplePopup from './inviaEmail';



// INTERFACCIA PROPS
interface PropsInterface {
  tableid: string;
  recordid: string;
  index?: number;
  total?: number;	
}

export default function RecordCard({ tableid,recordid,index=0,total=1 }: PropsInterface) {

  const { removeCard, cardsList, setIsPopupOpen } = useRecordsStore();
  const [animationClass, setAnimationClass] = useState('animate-slide-in'); 
  const [isMaximized, setIsMaximized] = useState(false);
  const [mountedTime, setMountedTime] = useState<string>("");
  // Nuovo stato per il menu a tendina
  const [showDropdown, setShowDropdown] = useState(false);

  const getOffset = () => {
    if (isMaximized) return 0;
    const baseOffset = 16; // Base offset in pixels
    return (total - index - 1) * baseOffset;
  };

  const handleRemoveCard = () => {
    setAnimationClass('animate-slide-out');
    setTimeout(() => {
        removeCard(tableid, recordid);
    }, 300);
  };

  const deleteRecord = async (tableid: string, recordid: string) => {
        try {
            await axiosInstance.post('/commonapp/delete_record/', { tableid, recordid });
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
      const response = await axiosInstance.post('/commonapp/stampa_bollettini_test/', { recordid }, {responseType: 'blob'});
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bollettino.pdf');
      document.body.appendChild(link);
      link.click();
      toast.success('Bollettino stampato con successo');

    } catch (error) {
      console.error('Errore durante la stampa del bollettino', error);
      toast.error('Errore durante la stampa del bollettino');
    }
  }

  const handleTrashClick = () => {
    toast.warning(
        "Sei sicuro di voler eliminare questo record?", 
        {
            action: {
                label: "Conferma",
                onClick: () => deleteRecord(tableid, recordid),
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
            <div className="h-1/5 w-full">
                <div className='h-1/6 w-full flex justify-between items-center'>
                    <div className="flex">
                        <p className="text-black">{tableid} </p>
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
                    <li 
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        // Qui puoi inserire la logica per funzione1
                        toast.info('Stampa bollettino in corso...');
                        stampaBollettino()
                        setShowDropdown(false);
                      }}
                    >
                      Stampa bollettino
                    </li>
                    <li 
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        // Qui puoi inserire la logica per funzione2
                        getEmailReady();
                        setShowDropdown(false);
                      }}
                    >
                      Invia email
                    </li>
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
                    <CardBadge tableid={tableid} recordid={recordid}></CardBadge>
                </div>
                
            </div>
            
            <div className="h-5/6 w-full">
                <CardTabs tableid={tableid} recordid={recordid}></CardTabs>
            </div>
        </div>
  );
};


