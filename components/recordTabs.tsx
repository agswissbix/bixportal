import React, { use, useMemo, useState } from 'react';
import { useRecordsStore } from './records/recordsStore';
import RecordsTable from './recordsTable';
import Kanban from './kanban';
import Pivot from './pitserviceLavanderie'
import PitCalendar from './pitCalendar';
import GenericComponent from './genericComponent';
// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
}

export default function ExampleComponent({ tableid }: PropsInterface) {

  const {handleRowClick, searchTerm, tableView, currentPage, pageLimit } = useRecordsStore();
  const [activeTab, setActiveTab] = useState('Table');
  return (
    <GenericComponent title="recordTabs"> 
      {(data) => (
        <div className="h-full w-full">
          <div>
            <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <li className="me-2">
              <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Table'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Table')}
                >
                  Tabella
                </button>
              </li>
              <li className="me-2">
              <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Kanban'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Kanban')}
                >
                  Kanban
                </button>
              </li>

              <li className="me-2">
              <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Pivot'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Pivot')}
                >
                  Pivot
                </button>
              </li>

              <li className="me-2">
              <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                    activeTab === 'Calendar'
                      ? 'text-primary border-primary'
                      : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('Calendar')}
                >
                  Calendario
                </button>
              </li>
            </ul>
          </div>
          <div id="records-tab-content" className="mt-2">
            {activeTab === 'Table' ? (
                <RecordsTable
                  tableid={tableid}
                  searchTerm={searchTerm}
                  view={tableView}
                  pagination={{ page: currentPage, limit: pageLimit }}

                  context='standard'
                />
            ) : activeTab === 'Kanban' ? (
              <Kanban />
            ): activeTab === 'Pivot' ? (
              <Pivot />
            ): activeTab === 'Calendar' ? (
              <PitCalendar />
            ): null
            }
      
          

          </div>
        </div>
      )}
    </GenericComponent>
  );
};

