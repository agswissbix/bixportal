import React, { useMemo, useState, useEffect } from 'react';
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

// INTERFACCIA PROPS
interface PropsInterface {
  tableid: string;
}

export default function StandardContent({ tableid }: PropsInterface) {

  const [recordid, setRecordid] = useState('')
  const [showDropdown, setShowDropdown] = useState(false);





  const {refreshTable, setRefreshTable, setIsFiltersOpen, isFiltersOpen} = useRecordsStore(); // Stato per il valore di ricerca

  const {cardsList, addCard, removeCard, resetCardsList, handleRowClick} = useRecordsStore(); // Stato per il valore di ricerca


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
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "export_excel",
          tableid: tableid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Gestisci la risposta qui, ad esempio, scarica il file Excel
    } catch (error) {
      console.error("Errore durante l'esportazione in Excel", error);
    }
  }

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
            <div className="relative">


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



