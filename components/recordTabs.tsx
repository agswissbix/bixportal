import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useRecordsStore } from './records/recordsStore';
import RecordsTable from './recordsTable';
import Kanban from './kanban';
import Pivot from './recordsPivot';
import PitCalendar from './pitCalendar';
import GalleryView from './gallery';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useApi } from '@/utils/useApi';

const isDev = false;

interface PropsInterface {
  tableid?: string;
}

interface ResponseInterface {
  tableTabs: string[];
  activeTab: string;
}

export default function RecordTabs({ tableid }: PropsInterface) {
  const { user } = useContext(AppContext);

  const responseDataDEFAULT: ResponseInterface = {
    tableTabs: ['Tabella', 'Kanban', 'Calendario', 'Galleria', 'Pivot'],
    activeTab: 'Tabella'
  };

  const responseDataDEV: ResponseInterface = {
    tableTabs: ['Tabella', 'Kanban', 'Calendario', 'Galleria', 'Pivot'],
    activeTab: 'Tabella'
  };

  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_table_active_tab',
      tableid: tableid
    };
  }, [tableid]);

  const [activeTab, setActiveTab] = useState<string>('Tabella');

  const { response, loading, error } = !isDev && payload
    ? useApi<ResponseInterface>(payload)
    : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
      setActiveTab(response.activeTab);
    }
  }, [response]);

  const { handleRowClick, searchTerm, tableView, currentPage, pageLimit, columnOrder, filtersList } = useRecordsStore();

  return (
    <GenericComponent>
      {(data) => (
        <div className="h-full">
          {/* Tabs */}
          <div className="h-min text-sm font-medium text-center text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px relative">
              {responseData.tableTabs.map((tab, index) => (
                <li key={index} className="me-2">
                  <button
                    className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                      activeTab === tab
                        ? 'text-primary border-primary'
                        : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tab Content */}
          <div className="h-5/6 p-4">
            {activeTab === 'Tabella' && (
              <RecordsTable tableid={tableid}context='standard'/>
            )}
            {activeTab === 'Kanban' && (
              <Kanban tableid={tableid} />
            )}
            {activeTab === 'Calendario' && (
              <PitCalendar tableid={tableid} />
            )}
            {activeTab === 'Galleria' && (
              <GalleryView tableid={tableid} />
            )}
            {activeTab === 'Pivot' && (
              <Pivot tableid={tableid} />
            )}
            {['Tabella', 'Kanban', 'Calendario', 'Galleria', 'Pivot'].indexOf(activeTab) === -1 && (
              <div className="text-gray-400 italic">Nessun contenuto da mostrare</div>
            )}
          </div>
        </div>
      )}
    </GenericComponent>
  );
}
