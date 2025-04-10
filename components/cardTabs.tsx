import React, { useMemo,useState } from 'react';
import { useRecordsStore } from './records/recordsStore';
import CardFields from './cardFields';
import CardLinked from './cardLinked';
import GenericComponent from './genericComponent';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid: string;
  recordid: string;
}

export default function ExampleComponent({ tableid,recordid }: PropsInterface) {

  const {addCard} = useRecordsStore();
  const [activeTab, setActiveTab] = useState('Fields')

  return (
    <GenericComponent  title="SidebarMenu"> 
      {(data) => (
          <div className="h-full">
          <div className="h-min text-sm font-medium text-center text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px relative">
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Fields'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Fields')}
                >
                  Campi
                </button>
              </li>
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Linked'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Linked')}
                >
                  Collegati
                </button>
              </li>
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Linked'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Linked')}
                >
                  Allegati
                </button>
              </li>
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Linked'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Linked')}
                >
                  Statistiche
                </button>
              </li>
              <li className="me-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Linked'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Linked')}
                >
                  Storico
                </button>
              </li>
            </ul>
          </div>

          <div className="h-5/6 p-4">
            {activeTab === 'Fields' ? (
              <CardFields tableid={tableid} recordid={recordid} />
            ) : (
              <CardLinked tableid={tableid} recordid={recordid} />
            )}
          </div>
        </div>
      )}
    </GenericComponent>
    
  );
};


