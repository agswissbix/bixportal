import React, { use, useMemo } from 'react';
import { useRecordsStore } from './records/recordsStore';
import RecordsTable from './recordsTable';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
}

export default function ExampleComponent({ tableid, searchTerm }: PropsInterface) {

  const {handleRowClick} = useRecordsStore();
  return (
    <div className="h-full w-full">
      <div>
        <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
          <li className="me-2">
            <a
              href="#"
              aria-current="page"
              className="inline-block p-4 text-primary bg-gray-100 rounded-t-lg active dark:bg-gray-800 dark:text-blue-500"
            >
              Tabella
            </a>
          </li>
          <li className="me-2">
            <a
              href="#"
              className="inline-block p-4 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              Kanban
            </a>
          </li>
        </ul>
      </div>
      <div id="records-tab-content">
        {/* Passa la funzione handleRowClick */}
        <RecordsTable
          tableid={tableid}
          searchTerm={searchTerm}
          context='standard'
        />
      </div>
    </div>
  );
};

