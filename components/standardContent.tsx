import React, { useMemo, useState, useEffect } from 'react';
import {useRecordsStore} from './records/recordsStore';
import RecordFilters from './recordFilters';
import RecordTabs from './recordTabs';
import RecordCard from './recordCard';
import GenericComponent from './genericComponent';
import { PlusIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid: string;
}

export default function StandardContent({ tableid }: PropsInterface) {

  const [recordid, setRecordid] = useState('')





  const {refreshTable, setRefreshTable} = useRecordsStore(); // Stato per il valore di ricerca

  const {cardsList, addCard, removeCard, resetCardsList, handleRowClick} = useRecordsStore(); // Stato per il valore di ricerca


  const refreshTableFunc = () => {
    setRefreshTable(refreshTable + 1);
  }
  
  useEffect(() => {
    if (recordid) {
      resetCardsList(); // Resetta le schede
      addCard(tableid, recordid, 'standard'); // Aggiungi la nuova scheda

    }
  }, [recordid]);

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
                <RecordFilters></RecordFilters>
            </div>
            <div className="w-1/2 h-1/2 flex justify-end gap-3">
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
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Esporta
              </button>
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
  
  
          <div className="h-full"><RecordTabs tableid={tableid}></RecordTabs></div>
  
        </div>
      )}
    </GenericComponent>
      
  );
};



