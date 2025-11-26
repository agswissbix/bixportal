// ...import e setup invariati
import React, { useMemo, useContext, useState, useEffect, useRef } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import { MoreVertical, X, Plus } from 'lucide-react';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import SelectUser from './selectUser';
import SelectStandard from './selectStandard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = false;

interface PropsInterface {
    tableid: string;
}

interface LookupItem {
    itemcode: string;
    itemdesc: string; 
}

interface ResponseInterface {
    filters: Array<{
        fieldid: string;
        type: string;
        label: string;
        lookupitemsuser?: Array<{ userid: string; firstname: string; lastname: string; }>;
        lookups?: Array<LookupItem>
    }>;
}

// Interfaccia per i dati utente
interface UserLookupItem {
    userid: string;
    firstname: string;
    lastname: string;
    link: string;
    linkdefield: string;
    linkedvalue: string;
}


export default function TableFilters({ tableid }: PropsInterface) {
    const responseDataDEFAULT: ResponseInterface = { filters: [] };
    const responseDataDEV: ResponseInterface = {
        filters: [
            { fieldid: "Parola", type: "Parola", label: "Parola" },
            { fieldid: "Numero", type: "Numero", label: "Numero" },
            { fieldid: "Data", type: "Data", label: "Data" },
            { fieldid: "Text", type: "text", label: "Text" },
            // Aggiungiamo un filtro di tipo "Utente" per il test
            { fieldid: "Utente", type: "Utente", label: "Utente" },
        ],
    };

    const { user } = useContext(AppContext);
    const { filtersList, setFiltersList } = useRecordsStore();

    const [filterValues, setFilterValues] = useState<Record<string, any[]>>({});

    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );

    const [openMenuFieldId, setOpenMenuFieldId] = useState<string | null>(null);
    const [filterConditions, setFilterConditions] = useState<Record<string, string>>({});

    const menuRef = useRef<HTMLDivElement | null>(null);

    // ✅ NUOVA CHIAMATA API PER GLI UTENTI
    const { response: usersResponse, loading: usersLoading, error: usersError } = useApi<{
        users: UserLookupItem[]
    }>({
        apiRoute: 'get_users',
    });
    
    // Stato per la lista degli utenti
    const [userLookupItems, setUserLookupItems] = useState<UserLookupItem[]>([]);

    useEffect(() => {
        if (usersResponse?.users) {
            setUserLookupItems(usersResponse.users);
        } else if (isDev) {
            // Dati di dev per l'utente, se `isDev` è true
            setUserLookupItems([
                { userid: "1", firstname: "Mario", lastname: "Rossi", link: "utenti", linkdefield: "userid", linkedvalue: "1" },
                { userid: "2", firstname: "Giulia", lastname: "Bianchi", link: "utenti", linkdefield: "userid", linkedvalue: "2" },
                { userid: "3", firstname: "Luca", lastname: "Verdi", link: "utenti", linkdefield: "userid", linkedvalue: "3" },
                { userid: "4", firstname: "Anna", lastname: "Neri", link: "utenti", linkdefield: "userid", linkedvalue: "4" }
            ]);
        }
    }, [usersResponse, isDev]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuFieldId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addInputForFilter = (fieldid: string, type: string) => {
        setFilterValues(prev => {
            const prevArray = prev[fieldid] || [];
            let newValue;

            if (type === "Numero") {
                newValue = { min: '', max: '' };
            } else if (type === "Data") {
                newValue = { from: '', to: '' };
            } else if (type === "Utente" || type === 'lookup') {
                newValue = []; // Per gli utenti, si inizializza un array vuoto
            } else {
                newValue = '';
            }
            
            return { ...prev, [fieldid]: [...prevArray, newValue] };
        });
    };

    const removeInputForFilter = (fieldId: string, indexToRemove: number) => {
        setFilterValues((prev) => {
            const updated = [...(prev[fieldId] || [])];
            updated.splice(indexToRemove, 1);
            return { ...prev, [fieldId]: updated };
        });
        setFilterConditions((prev) => {
            const updated = { ...prev };
            delete updated[`${fieldId}_${indexToRemove}`];
            const newUpdated: typeof updated = {};
            Object.entries(updated).forEach(([key, val]) => {
                if (key.startsWith(`${fieldId}_`)) {
                    const idx = parseInt(key.split('_')[1], 10);
                    if (idx > indexToRemove) {
                        newUpdated[`${fieldId}_${idx - 1}`] = val;
                    } else {
                        newUpdated[key] = val;
                    }
                } else {
                    newUpdated[key] = val;
                }
            });
            return newUpdated;
        });
    };

    async function applyFilters() {
        const filters = responseData.filters.map(filter => {
            const valuesArray = filterValues[filter.fieldid] || [];
            const conditionsArray = valuesArray.map((_, idx) =>
                filterConditions[`${filter.fieldid}_${idx}`] 
            )|| "Valore esatto"
            
            let combinedValue;
            if (filter.type === "Numero" || filter.type === "Data") {
                combinedValue = JSON.stringify(valuesArray);
            } else if (filter.type === "Parola" || filter.type === "text") {
                combinedValue = valuesArray.join('|');
            } else if (filter.type === "Utente" || filter.type === 'lookup') {
                // Per il tipo 'Utente', il valore è un array di ID che serializziamo in JSON.
                // Così il backend riceve un array di ID da filtrare.
                combinedValue = JSON.stringify(valuesArray);
            } else {
                combinedValue = valuesArray.join('|');
            }

            if (combinedValue === '[]' || combinedValue === '' || combinedValue === '||') {
                return null;
            }
            
            return {
                fieldid: filter.fieldid,
                type: filter.type,
                label: filter.label,
                value: combinedValue,
                conditions: conditionsArray,
            };
        }).filter(Boolean);

        console.log("Applying Filters:", filters);
        setFiltersList(filters);
    }

    const updateFilter = (
        fieldid: string,
        type: string,
        label: string,
        value: any,
        index: number
    ) => {
        setFilterValues(prev => {
            const prevArray = prev[fieldid] || [];
            const newArray = [...prevArray];

            // Aggiorna l'elemento all'indice specificato
            newArray[index] = value;
            
            // Per il tipo "Utente", il `value` è un array di stringhe
            // Rappresenta gli ID degli utenti selezionati
            if (type === "Utente" || type == "lookup") {
                // Se la selezione multipla è usata, `value` è un array di ID
                return { ...prev, [fieldid]: value };
            }

            // Per gli altri tipi
            return { ...prev, [fieldid]: newArray };
        });
    };

    const toggleConditionMenu = (key: string) => {
        setOpenMenuFieldId(prev => (prev === key ? null : key));
    };

    const selectCondition = (key: string, condition: string) => {
        setFilterConditions(prev => ({ ...prev, [key]: condition }));
        setOpenMenuFieldId(null);
    };

    const resetFilters = () => {
        setFilterValues({});
        setFiltersList([]);
        setFilterConditions({});
    };

    const { response, loading, error } = !isDev ? useApi<ResponseInterface>({
        apiRoute: 'get_table_filters',
        tableid: tableid
    }) : { response: null, loading: false, error: null };

    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    const renderConditionMenu = (fieldid: string, type: string) => {
        if (openMenuFieldId !== fieldid) return null;
        const baseConditions = ['Valore esatto', 'Diverso da', 'Nessun valore', 'Almeno un valore'];
        const dateExtraConditions = ['Oggi', 'Questa settimana', 'Questo mese', 'Passato', 'Futuro'];
        const allConditions = type === 'Data' ? [...baseConditions, ...dateExtraConditions] : baseConditions;

        return (
            <div
                ref={menuRef}
                className="absolute right-0 z-10 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-md"
            >
                {allConditions.map((condition, idx) => (
                    <button
                        key={idx}
                        onClick={() => selectCondition(fieldid, condition)}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                    >
                        {condition}
                    </button>
                ))}
            </div>
        );
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Prevents the default form submission behavior (page reload)
        applyFilters();
    };

    return (
        <GenericComponent response={responseData} loading={loading || usersLoading} error={error || usersError}>
            {(response: ResponseInterface) => (
                <div className=" overflow-y-auto p-2 w-full">
                     <form onSubmit={handleFormSubmit}>
                        <div className="space-y-4 relative">
                            {response.filters.map((filter, index) => {
                            const isLookupField = filter.type === 'lookup' && filter.lookups && filter.lookups.length > 0;
                            const isUserField = filter.type === "Utente";


                            return (
                            <div key={index} className="relative">
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Filtra per {filter.label}
                                </label>

                                {isLookupField && !isUserField && (
                                         <div className="flex flex-col gap-4 relative">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex gap-4 items-center">
                                                    <div className="flex gap-2 items-center w-full">
                                                        <div className="w-full">
                                                            <SelectStandard // <-- Il tuo componente Select
                                                                lookupItems={filter.lookups}
                                                                initialValue={filterValues[filter.fieldid] || []}
                                                                onChange={v => updateFilter(
                                                                    filter.fieldid,
                                                                    filter.type,
                                                                    filter.label,
                                                                    v, // v è l'array di itemcode selezionati
                                                                    0 // Indice fisso 0
                                                                )}
                                                                isMulti={true}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="relative flex items-center">
                                                         {/* Menu condizioni per Lookup/Utente (indice fisso 0) */}
                                                         <button type="button" onClick={() => toggleConditionMenu(`${filter.fieldid}_0`)}>
                                                             <MoreVertical className="text-gray-500 hover:text-gray-700" />
                                                         </button>
                                                         {renderConditionMenu(`${filter.fieldid}_0`, filter.type)}
                                                     </div>
                                                </div>
                                                {/* Visualizza la condizione selezionata */}
                                                {filterConditions[`${filter.fieldid}_0`] && (
                                                    <span className="text-xs text-gray-500 ml-1 mt-1">
                                                        Condizione: <strong>{filterConditions[`${filter.fieldid}_0`]}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {isUserField && (
                                    <div className="flex flex-col gap-4 relative">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex gap-4 items-center">
                                                <div className="flex gap-2 items-center w-full">
                                                    <div className="w-full">
                                            <SelectUser
                                                lookupItems={userLookupItems}
                                                initialValue={filterValues[filter.fieldid] || []}
                                                onChange={v => updateFilter(
                                                    filter.fieldid,
                                                    filter.type,
                                                    filter.label,
                                                    v,
                                                    0 // L'indice 0 è fisso per questo tipo di campo
                                                )}
                                                isMulti={true}
                                            />
                                            </div>
                                                </div>
                                                </div>
                                        </div>
                                    </div>
                                )}

                                {(!isLookupField && !isUserField) && (filter.type === "Parola" || filter.type === "text") && (
                                    <div className="flex flex-col gap-4 relative">
                                        {(filterValues[filter.fieldid] || ['']).map((val, idx) => (
                                            <div key={idx} className="flex flex-col gap-1 relative">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder={``}
                                                        value={val}
                                                        onChange={(e) =>
                                                            updateFilter(filter.fieldid, filter.type, filter.label, e.target.value, idx)
                                                        }
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                                    />
                                                    <div className="relative flex items-center">
                                                        <button onClick={() => toggleConditionMenu(`${filter.fieldid}_${idx}`)}>
                                                            <MoreVertical className="text-gray-500 hover:text-gray-700" />
                                                        </button>
                                                        {renderConditionMenu(`${filter.fieldid}_${idx}`, filter.type)}
                                                    </div>
                                                    {(filterValues[filter.fieldid]?.length ?? 1) > 1 && (
                                                        <button
                                                            onClick={() => removeInputForFilter(filter.fieldid, idx)}
                                                            className="text-red-500 hover:text-red-700 text-sm flex items-center"
                                                            title="Rimuovi questo campo"
                                                        >
                                                            <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                                                        </button>
                                                    )}
                                                </div>
                                                {filterConditions[`${filter.fieldid}_${idx}`] && (
                                                    <span className="text-xs text-gray-500 ml-1 mt-1">
                                                        Condizione: <strong>{filterConditions[`${filter.fieldid}_${idx}`]}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addInputForFilter(filter.fieldid, filter.type)}
                                            className="text-indigo-600 text-sm mt-1 hover:underline"
                                        >
                                            <Plus className="w-4 h-4 inline-block mr-1" />
                                            Aggiungi filtro
                                        </button>
                                    </div>
                                )}
                                {filter.type === "Numero" && (
                                    <div className="flex flex-col gap-4 relative">
                                        {(filterValues[filter.fieldid] && filterValues[filter.fieldid].length > 0
                                            ? filterValues[filter.fieldid]
                                            : [{ min: '', max: '' }]
                                        ).map((val, idx) => (
                                            <div key={idx} className="flex flex-col gap-1">
                                                <div className="flex gap-4 items-center">
                                                    <div className="flex gap-2 items-center w-full">
                                                        <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={val?.min || ''}
                                                            onChange={(e) =>
                                                                updateFilter(filter.fieldid, filter.type, filter.label, { ...val, min: e.target.value }, idx)
                                                            }
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={val?.max || ''}
                                                            onChange={(e) =>
                                                                updateFilter(filter.fieldid, filter.type, filter.label, { ...val, max: e.target.value }, idx)
                                                            }
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                                        />
                                                    </div>
                                                    <div className="relative flex items-center">
                                                        <button onClick={() => toggleConditionMenu(`${filter.fieldid}_${idx}`)}>
                                                            <MoreVertical className="text-gray-500 hover:text-gray-700" />
                                                        </button>
                                                        {renderConditionMenu(`${filter.fieldid}_${idx}`, filter.type)}
                                                    </div>
                                                    {(filterValues[filter.fieldid]?.length ?? 1) > 1 && (
                                                        <button
                                                            onClick={() => removeInputForFilter(filter.fieldid, idx)}
                                                            className="text-red-500 hover:text-red-700 flex items-center"
                                                            title="Rimuovi questo campo"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                {filterConditions[`${filter.fieldid}_${idx}`] && (
                                                    <span className="text-xs text-gray-500 ml-1 mt-1">
                                                        Condizione: <strong>{filterConditions[`${filter.fieldid}_${idx}`]}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addInputForFilter(filter.fieldid, filter.type)}
                                            className="text-indigo-600 text-sm hover:underline"
                                        >
                                            <Plus className="w-4 h-4 inline-block mr-1" />
                                            Aggiungi range
                                        </button>
                                    </div>
                                )}
                                {filter.type === "Data" && (
                                    <div className="flex flex-col gap-4 relative">
                                        {(filterValues[filter.fieldid] || [{ from: '', to: '' }]).map((range, idx) => (
                                            <div key={idx} className="flex flex-col gap-1">
                                                <div className="flex gap-4 items-center">
                                                    <div className="flex gap-2 items-center w-full">
                                                        <input
                                                            type="date"
                                                            placeholder="Dal"
                                                            value={range?.from || ''}
                                                            onChange={(e) =>
                                                                updateFilter(filter.fieldid, filter.type, filter.label, { ...range, from: e.target.value }, idx)
                                                            }
                                                            className="w-1/2 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                                        />
                                                        <input
                                                            type="date"
                                                            placeholder="Al"
                                                            value={range?.to || ''}
                                                            onChange={(e) =>
                                                                updateFilter(filter.fieldid, filter.type, filter.label, { ...range, to: e.target.value }, idx)
                                                            }
                                                            className="w-1/2 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                                        />
                                                    </div>
                                                    <div className="relative flex items-center">
                                                        <button onClick={() => toggleConditionMenu(`${filter.fieldid}_${idx}`)}>
                                                            <MoreVertical className="text-gray-500 hover:text-gray-700" />
                                                        </button>
                                                        {renderConditionMenu(`${filter.fieldid}_${idx}`, filter.type)}
                                                    </div>
                                                    {(filterValues[filter.fieldid]?.length ?? 1) > 1 && (
                                                        <button
                                                            onClick={() => removeInputForFilter(filter.fieldid, idx)}
                                                            className="text-red-500 hover:text-red-700 flex items-center"
                                                            title="Rimuovi questo campo"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                {filterConditions[`${filter.fieldid}_${idx}`] && (
                                                    <span className="text-xs text-gray-500 ml-1 mt-1">
                                                        Condizione: <strong>{filterConditions[`${filter.fieldid}_${idx}`]}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addInputForFilter(filter.fieldid, filter.type)}
                                            className="text-indigo-600 text-sm hover:underline"
                                        >
                                            <Plus className="w-4 h-4 inline-block mr-1" />
                                            Aggiungi range
                                        </button>
                                    </div>
                                )}
                            </div>
                        )})}
                        <div className="mt-6 flex gap-3">
                            <button
                                type="submit"
                                className="w-1/2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5"
                            >
                                Applica
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="w-1/2 text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 font-medium rounded-md text-sm px-5 py-2.5"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </form>
                </div>
            )}
        </GenericComponent>
    );
}