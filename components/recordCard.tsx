import React, { useMemo, useState, useEffect } from 'react';
import { useRecordsStore } from './records/recordsStore';
import { CircleX, Maximize2, Info, Trash2 } from 'lucide-react';
import CardBadge from './cardBadge';
import CardTabs from './cardTabs';
import { toast, Toaster } from 'sonner';
import axiosInstance from '@/utils/axiosInstance';



// INTERFACCIA PROPS
interface PropsInterface {
  tableid: string;
  recordid: string;
  index?: number;
  total?: number;	
}

export default function RecordCard({ tableid,recordid,index=0,total=1 }: PropsInterface) {

  const { removeCard, cardsList } = useRecordsStore();
  const [animationClass, setAnimationClass] = useState('animate-slide-in'); 
  const [isMaximized, setIsMaximized] = useState(false);
  const [mountedTime, setMountedTime] = useState<string>("");

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
            className={`absolute shadow-2xl bg-gray-100 z-10 rounded-md p-3 ${animationClass} ${
                isMaximized ? 'right-0 w-5/6 h-5/6' : 'w-2/6 h-4/6'
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
                        <p className="text-black">{tableid}</p>
                    </div>
                    <div className="flex items-center gap-5">
                        <button 
                            className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800" 
                            type="button" 

                        >
                            Funzioni
                            <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                            </svg>
                        </button>

                        <button onClick={() => setIsMaximized(!isMaximized)}>
                            <Info className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                        </button>

                        <button onClick={() => setIsMaximized(!isMaximized)}>
                            <Maximize2 className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                        </button>

                        <button className="cursor-pointer w-6 h-6 flex items-center justify-center transition-colors" onClick={handleTrashClick}>
                            <Trash2 className="w-6 h-6 text-red-500 hover:text-red-700" />
                        </button>

                        <button className="cursor-pointer w-6 h-6 flex items-center justify-center transition-colors" onClick={handleRemoveCard}>
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


