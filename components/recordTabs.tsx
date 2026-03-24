import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useRecordsStore } from './records/recordsStore';
import RecordsTable from './recordsTable';
import Kanban from './kanban';
import Pivot from './recordsPivot';
import PitCalendar from './pitCalendar';
import RecordsView from '@/components/calendar/recordsView';
import RecordsMatrixCalendar from './recordsMatrixCalendar';
import RecordsPlanner from './recordsPlanner';
import GalleryView from './gallery';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useApi } from '@/utils/useApi';
import RecordsKanban from './recordsKanban/page';
import CardsList from './mobile/cardList';
import { CalendarBase, CalendarChildProps } from './calendar/calendarBase';
import RecordsCalendar from './recordsCalendar';
import MatrixView from './calendar/matrixView';
import UnifiedCalendar from './calendar/unifiedCalendar';
import RecordsGroupedTable from './recordsGroupedTable';
import CustomDeadlines from '@/app/custom/swissbix/tableTabs/customDeadline';
import TabsManager from '@/app/custom/swissbix/tableTabs/tabsManager';

const isDev = false;

interface PropsInterface {
  tableid?: string;
  contentRef?: React.MutableRefObject<HTMLDivElement | null>;
}

interface TableTab {
  id: string;
  name: string;
}

interface ResponseInterface {
  tableTabs: TableTab[];
  activeTab: TableTab;
}

export default function RecordTabs({ tableid, contentRef }: PropsInterface) {
  const { user } = useContext(AppContext);
  const [calendarType, setCalendarType] = useState<"calendar" | "planner">(
      "calendar"
  );

  const responseDataDEFAULT: ResponseInterface = {
    tableTabs: [
      { id: 'Tabella', name: 'Tabella' },
      { id: 'TabellaRaggruppata', name: 'TabellaRaggruppata' },
      { id: 'Kanban', name: 'Kanban' },
      { id: 'Calendario', name: 'Calendario' },
      { id: 'Timeline', name: 'Timeline' },
      { id: 'Gallery', name: 'Gallery' },
      { id: 'Pivot', name: 'Pivot' }
    ],
    activeTab: { id: 'Tabella', name: 'Tabella' }
  };

  const responseDataDEV: ResponseInterface = {
    tableTabs: [
      { id: 'Tabella', name: 'Tabella' },
      { id: 'TabellaRaggruppata', name: 'TabellaRaggruppata' },
      { id: 'Kanban', name: 'Kanban' },
      { id: 'Calendario', name: 'Calendario' },
      { id: 'Timeline', name: 'Timeline' },
      { id: 'Gallery', name: 'Gallery' },
      { id: 'Pivot', name: 'Pivot' }
    ],
    activeTab: { id: 'Tabella', name: 'Tabella' }
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
      setActiveTab(response.activeTab.id);
    }
  }, [response]);

  const { searchTerm, tableView, filtersList } = useRecordsStore();

  return (
      <GenericComponent>
          {(data) => (
              <div className="h-full flex flex-col">
                  {/* Tabs */}
                  <div className="hidden xl:inline h-min text-sm font-medium text-center text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700">
                      <ul className="flex flex-wrap -mb-px relative">
                          {responseData.tableTabs.map((tab, index) => (
                              <li
                                  key={index}
                                  className="me-2">
                                  <button
                                      className={`inline-block p-4 border-b-2 rounded-t-lg transition-all duration-300 ${
                                          activeTab === tab.id
                                              ? "text-primary border-primary"
                                              : "text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300"
                                      }`}
                                      onClick={() => setActiveTab(tab.id)}>
                                      {tab.name}
                                  </button>
                              </li>
                          ))}
                      </ul>
                  </div>

                  {/* Tab Content */}
                  <div id="printable-records-content" ref={contentRef} className="flex-1 p-4 overflow-auto xl:inline hidden">
                      {activeTab === "Tabella" && (
                          <RecordsTable
                              tableid={tableid}
                              context="standard"
                              view={tableView}
                              searchTerm={searchTerm}
                              filtersList={filtersList}
                              limit={100}
                          />
                      )}
                      {activeTab === "TabellaRaggruppata" && (
                            <RecordsGroupedTable
                                tableid={tableid}
                                view={tableView}
                                searchTerm={searchTerm}
                                filtersList={filtersList}
                                limit={20}
                            />
                      )}
                      {activeTab === "Kanban" && (
                          <RecordsKanban
                              tableid={tableid}
                              context="standard"
                              view={tableView}
                              searchTerm={searchTerm}
                          />
                      )}
                      {activeTab === "Calendario" && (
                          <UnifiedCalendar
                              tableid={tableid}
                              showUnplannedEvents={true}
                              defaultView="calendar"
                          />
                          // <RecordsCalendar tableid={tableid} context='standard' view={tableView} searchTerm={searchTerm} />
                      )}
                      {activeTab === "Gallery" && (
                          <GalleryView tableid={tableid} />
                      )}
                      {activeTab === "Pivot" && (
                          <Pivot
                              tableid={tableid}
                              context="standard"
                              view={tableView}
                              searchTerm={searchTerm}
                          />
                      )}
                      {activeTab === "Custom" && (
                        <TabsManager tableid={tableid} />
                      )}
                      {[
                          "Tabella",
                          "TabellaRaggruppata",
                          "Kanban",
                          "Calendario",
                          "Gallery",
                          "Pivot",
                          "Custom"
                      ].indexOf(activeTab) === -1 && (
                          <div className="text-gray-400 italic">
                              Nessun contenuto da mostrare
                          </div>
                      )}
                  </div>

                  <div className="flex-1 overflow-hidden xl:hidden">
                      <CardsList
                          tableid={tableid}
                          searchTerm={searchTerm}
                          view={tableView}
                          context="standard"
                      />
                  </div>
              </div>
          )}
      </GenericComponent>
  );
}
