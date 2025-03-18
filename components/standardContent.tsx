import React, { useMemo, useState, useEffect } from 'react';
import {useRecordsStore} from './records/recordsStore';
import RecordFilters from './recordFilters';
import RecordTabs from './recordTabs';
import RecordCard from './recordCard';
import GenericComponent from './genericComponent';

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
          <div className="flex flex-wrap w-full mb-4">
            <div className="w-1/2">
                <RecordFilters></RecordFilters>
            </div>
            <div className="w-1/2">
              <button type="button" className="float-end text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" onClick={() => handleRowClick('', tableid, 'standard')}>Nuovo</button>
              <button type="button" className="float-end text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" onClick={refreshTableFunc}>Ricarica</button>
              <button type="button" className="float-end text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">Esporta</button>
            </div>  
          </div>
  
            {cardsList.map((card, index) => (
                <RecordCard 
                    key={`${card.tableid}-${card.recordid}`}
                    tableid={card.tableid} 
                    recordid={card.recordid}
                    index={index}
                    total={cardsList.length}
                />
            ))}
  
  
          <div><RecordTabs tableid={tableid}></RecordTabs></div>
  
        </div>
      )}
    </GenericComponent>
      
  );
};



