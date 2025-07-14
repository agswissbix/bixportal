// ...import e setup invariati
import React, { useMemo, useContext, useState, useEffect, useRef } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import { MoreVertical, X, Plus } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = true;

interface PropsInterface {
    tableid: string;
}

interface ResponseInterface {
    filters: Array<{
        fieldid: string;
        type: string;
        label: string;
    }>;
}

export default function TableFilters({ tableid }: PropsInterface) {
    const devPropExampleValue = isDev ? "Example prop" : tableid;
    const responseDataDEFAULT: ResponseInterface = { filters: [] };
    const responseDataDEV: ResponseInterface = {
        filters: [
            { fieldid: "Parola", type: "Parola", label: "Parola" },
            { fieldid: "Numero", type: "Numero", label: "Numero" },
            { fieldid: "Data", type: "Data", label: "Data" },
            { fieldid: "Text", type: "text", label: "Text" },
        ],
    };

    const { user } = useContext(AppContext);
    const { filtersList, setFiltersList } = useRecordsStore();

    const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );



    const [openMenuFieldId, setOpenMenuFieldId] = useState<string | null>(null);
    const [filterConditions, setFilterConditions] = useState<Record<string, string>>({});

    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuFieldId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addInputForFilter = (fieldid: string) => {
        setFilterValues(prev => {
            const prevArray = prev[fieldid] || [''];
            // aggiungi un nuovo valore vuoto alla fine
            return { ...prev, [fieldid]: [...prevArray, ''] };
        });
    };

    const removeInputForFilter = (fieldId: string, indexToRemove: number) => {
        setFilterValues((prev) => {
            const updated = [...(prev[fieldId] || [])];
            updated.splice(indexToRemove, 1);
            return { ...prev, [fieldId]: updated };
        });

        // Rimuove la condizione associata a quell’indice (se presente)
        setFilterConditions((prev) => {
            const updated = { ...prev };
            delete updated[`${fieldId}_${indexToRemove}`];

            // 🔄 Aggiorna anche gli indici successivi per evitare mismatch
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


    async function sendFiltersToBackend() {
        const payload = {
            filters: responseData.filters.map(filter => {
                const valuesArray = filterValues[filter.fieldid] || [''];
                const conditionsArray = valuesArray.map((_, idx) =>
                    filterConditions[`${filter.fieldid}_${idx}`] || "Valore esatto"
                );

                return {
                    fieldid: filter.fieldid,
                    type: filter.type,
                    label: filter.label,
                    values: valuesArray,
                    conditions: conditionsArray,
                };
            }),
        };

        console.log("Invio filtri al backend:", payload);

        try {
            const response = await fetch('/api/filter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Errore nella risposta: ${response.status}`);
            }

            const data = await response.json();
            console.log("Risposta backend:", data);
            return data;

        } catch (error) {
            console.error("Errore invio filtri:", error);
            return null;
        }
    }



    const updateFilter = (
        fieldid: string,
        type: string,
        label: string,
        value: string,
        index: number
    ) => {
        setFilterValues(prev => {
            const prevArray = prev[fieldid] || [];
            const newArray = [...prevArray];
            newArray[index] = value;

            // Costruisce il valore combinato aggiornato
            const combinedValue = newArray.map(v => v || '').join('|');

            // Costruisce il nuovo filtro
            const newFilter = { fieldid, type, label, value: combinedValue };

            // Rimuove il filtro se tutti i valori sono vuoti o solo separatori
            const isAllEmpty = combinedValue.trim() === '' || /^(\|)+$/.test(combinedValue);

            if (isAllEmpty) {
                const updatedFilters = filtersList.filter(filter => filter.fieldid !== fieldid);
                setFiltersList(updatedFilters);
            } else {
                const existingFilterIndex = filtersList.findIndex(filter => filter.fieldid === fieldid);
                if (existingFilterIndex >= 0) {
                    const updatedFilters = [...filtersList];
                    updatedFilters[existingFilterIndex] = newFilter;
                    setFiltersList(updatedFilters);
                } else {
                    setFiltersList([...filtersList, newFilter]);
                }
            }

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
        apiRoute: 'examplepost',
        example1: tableid
    }) : { response: null, loading: false, error: null };

    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    const renderConditionMenu = (fieldid: string, type: string) => {
        if (openMenuFieldId !== fieldid) return null;

        const baseConditions = [
            'Valore esatto',
            'Diverso da',
            'Nessun valore',
            'Almeno un valore'
        ];

        const dateExtraConditions = [
            'Oggi',
            'Questa settimana',
            'Questo mese',
            'Passato',
            'Futuro'
        ];

        const allConditions = type === 'Data'
            ? [...baseConditions, ...dateExtraConditions]
            : baseConditions;

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



    return (
        <GenericComponent response={responseData} loading={loading} error={error}>
            {(response: ResponseInterface) => (
                <div className="h-[90%] overflow-y-auto p-2 w-full">
                    <div className="space-y-4 relative">
                        {response.filters.map((filter, index) => (
                            <div key={index} className="relative">
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Filtra per {filter.label}
                                </label>

                                {(filter.type === "Parola" || filter.type === "text") && (
                                    <div className="flex flex-col gap-4 relative">
                                        {(filterValues[filter.fieldid] || ['']).map((val, idx) => (
                                            <div key={idx} className="flex flex-col gap-1 relative">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder={`Inserisci un valore`}
                                                        value={val}
                                                        onChange={(e) =>
                                                            updateFilter(filter.fieldid, filter.type, filter.label, e.target.value, idx)
                                                        }
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                                    />

                                                    {/* Menu condizione */}
                                                    <div className="relative flex items-center">
                                                        <button onClick={() => toggleConditionMenu(`${filter.fieldid}_${idx}`)}>
                                                            <MoreVertical className="text-gray-500 hover:text-gray-700" />
                                                        </button>
                                                        {renderConditionMenu(`${filter.fieldid}_${idx}`, filter.type)}
                                                    </div>

                                                    {/* Bottone ✕ per rimuovere input (solo se più di uno) */}
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

                                        {/* Bottone per aggiungere un nuovo campo */}
                                        <button
                                            type="button"
                                            onClick={() => addInputForFilter(filter.fieldid)}
                                            className="text-indigo-600 text-sm mt-1 hover:underline"
                                        >
                                            <Plus className="w-4 h-4 inline-block mr-1" />
                                            Aggiungi filtro
                                        </button>
                                    </div>
                                )}


                                {filter.type === "Numero" && (
                                    <div className="flex flex-col gap-4 relative">
                                        {(filterValues[filter.fieldid] || ['']).map((val, idx) => (
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
                                            onClick={() => addInputForFilter(filter.fieldid)}
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
                                            onClick={() => addInputForFilter(filter.fieldid)}
                                            className="text-indigo-600 text-sm hover:underline"
                                        >
                                            <Plus className="w-4 h-4 inline-block mr-1" />
                                            Aggiungi range
                                        </button>
                                    </div>
                                )}



                            </div>
                        ))}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                className="w-1/2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5"
                                onClick={() => sendFiltersToBackend(filtersList)}
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
                </div>
            )}
        </GenericComponent>
    );
}
