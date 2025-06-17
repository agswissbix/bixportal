import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          tableid: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          filters: Array<{
            fieldid: string;
            type: string;
            label: string;
            }>
    }

export default function TableFilters({ tableid }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                filters: []
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                filters: [
                    {
                        fieldid: "test1",
                        type: "Parola",
                        label: "Test 1"
                    },
                    {
                        fieldid: "test2",
                        type: "Numero",
                        label: "Test 2"
                    },
                    {
                        fieldid: "test3",
                        type: "Data",
                        label: "Test 3"
                    },
                    {
                        fieldid: "Utente",
                        type: "text",
                        label: "Test 4"
                    },
                ]
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // STORE ZUSTAND
    const { filtersList, setFiltersList } = useRecordsStore();

    // STATE LOCALE PER I VALORI DEI FILTRI
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    // FUNZIONE PER AGGIORNARE UN FILTRO SPECIFICO
    const updateFilter = (fieldid: string, type: string, label: string, value: string) => {
        // Aggiorna lo state locale
        setFilterValues(prev => ({
            ...prev,
            [fieldid]: value
        }));

        // Aggiorna lo store
        const existingFilterIndex = filtersList.findIndex(filter => filter.fieldid === fieldid);
        
        if (existingFilterIndex >= 0) {
            // Aggiorna il filtro esistente
            const updatedFilters = [...filtersList];
            updatedFilters[existingFilterIndex] = { fieldid, type, label, value };
            setFiltersList(updatedFilters);
        } else {
            // Aggiungi nuovo filtro se il valore non è vuoto
            if (value.trim() !== '') {
                setFiltersList([...filtersList, { fieldid, type, label, value }]);
            }
        }

        // Rimuovi il filtro se il valore è vuoto
        if (value.trim() === '' && existingFilterIndex >= 0) {
            const updatedFilters = filtersList.filter(filter => filter.fieldid !== fieldid);
            setFiltersList(updatedFilters);
        }
    };

    // FUNZIONE PER AGGIORNARE FILTRI COMPOSTI (es. range numerico o data)
    const updateRangeFilter = (fieldid: string, type: string, label: string, rangeType: 'min' | 'max' | 'from' | 'to', value: string) => {
        const currentValues = filterValues[fieldid] || {};
        const newValues = { ...currentValues, [rangeType]: value };
        
        setFilterValues(prev => ({
            ...prev,
            [fieldid]: newValues
        }));

        // Crea il valore combinato per lo store
        let combinedValue = '';
        if (type === 'Numero') {
            const min = newValues.min || '';
            const max = newValues.max || '';
            combinedValue = `${min}|${max}`;
        } else if (type === 'Data' || type === 'Utente') {
            const from = newValues.from || '';
            const to = newValues.to || '';
            combinedValue = `${from}|${to}`;
        }

        // Aggiorna lo store solo se almeno un valore è presente
        if (newValues.min || newValues.max || newValues.from || newValues.to) {
            const existingFilterIndex = filtersList.findIndex(filter => filter.fieldid === fieldid);
            
            if (existingFilterIndex >= 0) {
                const updatedFilters = [...filtersList];
                updatedFilters[existingFilterIndex] = { fieldid, type, label, value: combinedValue };
                setFiltersList(updatedFilters);
            } else {
                setFiltersList([...filtersList, { fieldid, type, label, value: combinedValue }]);
            }
        } else {
            // Rimuovi il filtro se tutti i valori sono vuoti
            const updatedFilters = filtersList.filter(filter => filter.fieldid !== fieldid);
            setFiltersList(updatedFilters);
        }
    };

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'examplepost', // riferimento api per il backend
            example1: tableid
        };
    }, [tableid]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div>
                    {response.filters.map((filter, index) => (
                        <div key={index}>
                            <label className="text-sm font-medium text-gray-900">Filtra per {filter.label}</label>
                            {filter.type === "Parola" && (
                                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                                    <input
                                        name="word"
                                        type="text"
                                        placeholder="Inserisci un valore"
                                        value={filterValues[filter.fieldid] || ''}
                                        onChange={(e) => updateFilter(filter.fieldid, filter.type, filter.label, e.target.value)}
                                        className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                                    />
                                </div>
                            )}
                            {filter.type === "Numero" && (
                                <>
                                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                                    <input
                                        name="number-min"
                                        type="number"
                                        placeholder="min"
                                        value={filterValues[filter.fieldid]?.min || ''}
                                        onChange={(e) => updateRangeFilter(filter.fieldid, filter.type, filter.label, 'min', e.target.value)}
                                        className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                                    />
                                </div>

                                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                                    <input
                                        name="number-max"
                                        type="number"
                                        placeholder="max"
                                        value={filterValues[filter.fieldid]?.max || ''}
                                        onChange={(e) => updateRangeFilter(filter.fieldid, filter.type, filter.label, 'max', e.target.value)}
                                        className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                                    />
                                </div>
                                </>
                            )}
                            {filter.type === "Data" && (
                                <>
                                <br></br>
                                <label className="text-sm font-medium text-gray-900">dopo il</label>
                                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                                    <input
                                        name="date-from"
                                        type="date"
                                        placeholder="dopo il"
                                        value={filterValues[filter.fieldid]?.from || ''}
                                        onChange={(e) => updateRangeFilter(filter.fieldid, filter.type, filter.label, 'from', e.target.value)}
                                        className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                                    />
                                </div>
                                <label className="text-sm font-medium text-gray-900">prima del</label>

                                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                                    <input
                                        name="date-to"
                                        type="date"
                                        placeholder="prima del"
                                        value={filterValues[filter.fieldid]?.to || ''}
                                        onChange={(e) => updateRangeFilter(filter.fieldid, filter.type, filter.label, 'to', e.target.value)}
                                        className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                                    />
                                </div>
                                </>
                            )}
                            {filter.type === "Utente" && (
                                <>
                                <br></br>
                                <label className="text-sm font-medium text-gray-900">dopo il</label>
                                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                                    <input
                                        name="user-from"
                                        type="date"
                                        placeholder="dopo il"
                                        value={filterValues[filter.fieldid]?.from || ''}
                                        onChange={(e) => updateRangeFilter(filter.fieldid, filter.type, filter.label, 'from', e.target.value)}
                                        className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                                    />
                                </div>
                                <label className="text-sm font-medium text-gray-900">prima del</label>

                                <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                                    <input
                                        name="user-to"
                                        type="date"
                                        placeholder="prima del"
                                        value={filterValues[filter.fieldid]?.to || ''}
                                        onChange={(e) => updateRangeFilter(filter.fieldid, filter.type, filter.label, 'to', e.target.value)}
                                        className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
                                    />
                                </div>
                                </>
                            )}
                        <br></br>
                        </div>
                    ))}
                        <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 me-2 mt-4">
                            Applica filtri
                        </button>

                </div>
            )}
        </GenericComponent>
    );
};