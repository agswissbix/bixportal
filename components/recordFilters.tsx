import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import axiosInstance from '@/utils/axiosInstance';
import { set } from 'lodash';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          views: {
            id: number;
            name: string;
          }[];
        }

export default function RecordFilters({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                views: []
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
              views: [
                {
                  id: 1,
                  name: 'view1'
                },
                {
                  id: 2,
                  name: 'view2'
                },
                {
                  id: 3,
                  name: 'view3'
                }
              ]
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

            const [inputValue, setInputValue] = useState('');
            const [selectedView, setSelectedView] = useState(1);

            const {setSearchTerm,setTableView} = useRecordsStore();
            const {refreshTable,setRefreshTable,selectedMenu} = useRecordsStore();

            const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const keyword = e.target.value;
              setInputValue(keyword); // Aggiorna stato locale
              setSearchTerm(keyword); // Passa il valore al componente genitore
            };

            const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
              const viewid = e.target.value;
              setSelectedView(parseInt(viewid)); // Aggiorna stato locale
              setTableView(viewid); // Passa il valore al componente genitore
              researchTableSubmit();  
            }

            const researchTableSubmit = () => {
              setRefreshTable(refreshTable + 1);
            }

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_table_views', // riferimento api per il backend
            tableid: selectedMenu, 
        };
    }, [propExampleValue]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        setTableView(selectedView.toString());
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
            setSelectedView(response.views[0].id);
        }
    }, [response, responseData, selectedView]);

    return (
        <GenericComponent response={responseData} loading={loading} error={error} title="recordFilters" > 
            {(response: ResponseInterface) => (
                <div className="w-full">
                <form className="max-w-md" onSubmit={(e) => {e.preventDefault(); researchTableSubmit(); }}>
                  <select 
                        id="filter-type"
                        value={selectedView}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        onChange={handleViewChange}
                      >
                        {response.views.map((view) => (
                          <option key={view.id} value={view.id}>{view.name}</option>
                        ))}
                    </select>
                  <div className="max-w-md float-start">   
                      <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Cerca</label>
                      <div className="relative">
                          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                              </svg>
                          </div>
                          <input type="search" id="default-search" className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Cerca"  value={inputValue} onChange={handleInputChange} />
                          <button type="submit" className="text-white absolute end-2.5 bottom-2.5 bg-primary hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Cerca</button>
                      </div>
                  </div>
                </form>
                <button type="button" className="float-start text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">Filtri</button>
          
              </div>
            )}
        </GenericComponent>
    );
};


