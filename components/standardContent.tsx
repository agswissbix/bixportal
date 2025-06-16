import React, { useMemo, useState, useEffect, useContext } from 'react';
import {useRecordsStore} from './records/recordsStore';
import QuickFilters from './quickFilters';
import TableFilters from './TableFilters';
import RecordTabs from './recordTabs';
import RecordCard from './recordCard';
import GenericComponent from './genericComponent';
import { PlusIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { Table } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { AppContext } from '@/context/appContext';
import axios from 'axios';
import LoadingComp from './loading';


// INTERFACCIA PROPS
interface PropsInterface {
  tableid: string;
}

export default function StandardContent({ tableid }: PropsInterface) {

  const [recordid, setRecordid] = useState('')
  const [showDropdown, setShowDropdown] = useState(false);





  const {refreshTable, setRefreshTable, setIsFiltersOpen, isFiltersOpen, } = useRecordsStore(); // Stato per il valore di ricerca

  const {cardsList, addCard, removeCard, resetCardsList, handleRowClick, searchTerm, tableView} = useRecordsStore(); // Stato per il valore di ricerca

  const {activeServer } = useContext(AppContext);
  

  


  const refreshTableFunc = () => {
    setRefreshTable(refreshTable + 1);
  }
  

  const handleCreaListaLavanderia = async (mese: string) => {
    try {
      const response = await axiosInstanceClient.post(
          "/postApi",
          {
              apiRoute: "crea_lista_lavanderie",
              mese: mese,
          },
          {
              headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
          }
      )
      toast.success('Record creati');
  } catch (error) {
      console.error('Errore durante la creazione dei record', error);
      toast.error('Errore durante la creazione dei record');
  }
}



  useEffect(() => {
    if (recordid) {
      resetCardsList(); // Resetta le schede
      addCard(tableid, recordid, 'standard'); // Aggiungi la nuova scheda

    }
  }, [recordid]);

const exportExcel = async () => {
  // crea un toast con dentro il componente LoadingComp e salva l'id
  const loadingToastId = toast.loading("Esportazione in corso...");
  try {
    const response = await axiosInstanceClient.post(
      "/postApi",
      {
        apiRoute: "export_excel",
        tableid: tableid,
        searchTerm: searchTerm,
        view: tableView,
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
    
    // Estrai il filename dal header Content-Disposition
    const contentDisposition = response.headers['content-disposition'] || '';
    let filename = 'export.xlsx';
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
    if (match && match[1]) {
      filename = decodeURIComponent(match[1]);
    }
    
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    toast.dismiss(loadingToastId);
    toast.success("File Excel esportato con successo");
  } catch (error) {
    console.error("Errore durante l'esportazione in Excel", error);
    toast.dismiss(loadingToastId);
    toast.error("Errore durante l'esportazione in Excel");
  }
};


  return (
    <GenericComponent title="standardContent"> 
      {(data) => (
          <div className="h-full w-full shadow-2xl bg-white rounded-lg p-4">
          {/*
          <h2>Contenuto</h2>
          <p>Hai selezionato: <strong>{tableid}</strong></p>
          */}
          <div className="flex flex-wrap w-full mb-2">
            <div className="w-1/2">
                <QuickFilters></QuickFilters>
            </div>
            <div className="w-1/2 h-1/2 flex justify-end gap-3">
            {activeServer !== 'belotti' && (
              <>
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
              <div className="absolute left-0 mt-2 w-28 bg-white border border-gray-200 rounded shadow-lg z-50">
                <ul className="py-1">
                  <li 
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => exportExcel()}
                  >
                    Esporta excel
                  </li>
                  
                  {tableid === 'rendicontolavanderia' && (
                    <li 
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleCreaListaLavanderia("mesecorrente")}
                    >
                      Crea rendiconti lavanderia mese corrente
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

                <button
                  type="button"
                  className="font-bold inline-flex items-center px-5 py-2.5 text-sm text-white bg-primary rounded-lg hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-100 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  onClick={() => handleRowClick('', "", tableid)}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Nuovo
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  onClick={refreshTableFunc}
                >
                  <ArrowPathIcon className="w-5 h-5 mr-2" />
                  Ricarica
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 ease-in-out shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  onClick={() => exportExcel()}
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Esporta
                </button>
                </>
          )}
            </div>
          </div>

          

    {cardsList.map((card, index) => (
      <RecordCard 
        key={`${card.tableid}-${card.recordid}`}
        tableid={card.tableid} 
        recordid={card.recordid}
        mastertableid={card.mastertableid}
        masterrecordid={card.masterrecordid}
        index={index}
        total={cardsList.length}
        type={card.type}
      />
    ))}

      <div className="w-full h-full flex gap-4 mb-4">
      {isFiltersOpen && (

      <div className="w-1/4 h-full flex flex-nowrap overflow-x-auto overflow-y-hidden border border-gray-200 p-2">
          <TableFilters tableid={tableid} ></TableFilters>
      </div>
        )}

      <div className="w-full h-full flex flex-nowrap overflow-x-auto overflow-y-hidden p-2">

          <div className="w-full h-full"><RecordTabs tableid={tableid}></RecordTabs></div>
          </div>
          </div>
  
        </div>
      )}
    </GenericComponent>
      
  );
};



