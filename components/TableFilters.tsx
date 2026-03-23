// ...import e setup invariati
import React, { useMemo, useContext, useState, useEffect, useRef } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import { MoreVertical, X, Plus, Filter, RotateCcw, Save } from 'lucide-react';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import SelectUser from './selectUser';
import SelectStandard from './selectStandard';
import { toast } from 'sonner';
import InputLinked from './input/inputLinked';
import InputDate from './input/inputDate';
import { Checkbox } from './ui/checkbox';
import InputTime from './input/inputTime';
import InputCheckbox from './inputCheckbox';

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
        tablelink?: string;
        keyfieldlink?: string;
    }>;
}

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
            { fieldid: "Utente", type: "Utente", label: "Utente" },
        ],
    };

    const { user } = useContext(AppContext);
    const { filtersList, setFiltersList, setRefreshViewsList } = useRecordsStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const [filterValues, setFilterValues] = useState<Record<string, any[]>>({});
    const [responseData, setResponseData] = useState<ResponseInterface>(
        isDev ? responseDataDEV : responseDataDEFAULT
    );
    const [openMenuFieldId, setOpenMenuFieldId] = useState<string | null>(null);
    const [filterConditions, setFilterConditions] = useState<Record<string, string>>({});
    const [isSaveViewChecked, setIsSaveViewChecked] = useState(false);
    const [newViewName, setNewViewName] = useState("");
    const menuRef = useRef<HTMLDivElement | null>(null);

    const { response: usersResponse, loading: usersLoading, error: usersError } = useApi<{
        users: UserLookupItem[]
    }>({
        apiRoute: 'get_users',
    });

    const [userLookupItems, setUserLookupItems] = useState<UserLookupItem[]>([]);

    useEffect(() => {
        if (usersResponse?.users) {
            setUserLookupItems(usersResponse.users);
        } else if (isDev) {
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

    useEffect(() => {
        if (!containerRef.current) return;

        // Inizializza la larghezza al mount
        setContainerWidth(containerRef.current.offsetWidth);
        console.log("Container width", containerRef.current.offsetWidth);

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                // Usa contentRect per una precisione maggiore
                setContainerWidth(entry.contentRect.width);
                console.log("Container width", entry.contentRect.width);
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, [containerRef.current]);

    const addInputForFilter = (fieldid: string, type: string) => {
        setFilterValues(prev => {
            const prevArray = prev[fieldid] || [];
            let newValue;
            if (type === "Numero" || type === "Ora") {
                newValue = { min: '', max: '' };
            } else if (type === "Data") {
                newValue = { from: '', to: '' };
            } else if (type === "Utente" || type === 'lookup') {
                newValue = [];
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
                filterConditions[`${filter.fieldid}_${idx}`] || (filter.type === 'Ora' ? 'Tra' : 'Valore esatto')
            );

            let combinedValue;
            if (filter.type === "Numero" || filter.type === "Data" || filter.type === "Ora") {
                combinedValue = JSON.stringify(valuesArray);
            } else if (filter.type === "Parola" || filter.type === "text") {
                combinedValue = valuesArray.join('|');
            } else if (filter.type === "Utente" || filter.type === 'lookup') {
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

        if (isSaveViewChecked && newViewName.trim() !== '') {
            axiosInstanceClient.post(`/postApi`, {
                apiRoute: "save_table_view",
                tableid: tableid,
                view_name: newViewName.trim(),
                filters: filters
            }).then(response => {
                if (response.data.success) {
                    setIsSaveViewChecked(false);
                    setNewViewName('');
                    setRefreshViewsList();
                    toast.success("Vista salvata con successo!");
                } else {
                    toast.error(response.data.detail || "Errore durante il salvataggio della vista");
                }
            }).catch(error => {
                toast.error(error.response?.data?.detail || "Errore di connessione o server interno");
            });
        }
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
            newArray[index] = value;

            if (type === "Utente" || type == "lookup") {
                return { ...prev, [fieldid]: value };
            }

            console.log("updateFilter", value);
            filterValues;
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
        const timeConditions = ['Tra', 'Maggiore di', 'Minore di', 'Valore esatto', 'Diverso da', 'Nessun valore', 'Almeno un valore'];
        const numberConditions = ['Tra', 'Maggiore di', 'Minore di'];

        let allConditions = baseConditions;
        if (type === 'Data') {
            allConditions = [...baseConditions, ...dateExtraConditions];
        } else if (type === 'Ora') {
            allConditions = timeConditions;
        } else if (type === 'Numero') {
            allConditions = [...baseConditions, ...numberConditions];
        }

        return (
            <div
                ref={menuRef}
                className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-xl border border-border bg-popover p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95"
            >
                {allConditions.map((condition, idx) => (
                    <button
                        key={idx}
                        onClick={() => selectCondition(fieldid, condition)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        {condition}
                    </button>
                ))}
            </div>
        );
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const isCompact = containerWidth < 400;

    // Stili — ottimizzati per spazi ridotti
    const inputBaseClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring";
    const labelClass = "text-xs font-semibold text-foreground uppercase tracking-wide";
    const addButtonClass = "inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:underline mt-1";
    const removeButtonClass = "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive";
    const menuButtonClass = "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";
    const conditionBadgeClass = "mt-1 inline-flex items-center rounded-md bg-accent-foreground border-l border-accent px-2 py-0.5 text-[11px] font-medium text-accent";

    return (
        <GenericComponent response={responseData} loading={loading || usersLoading} error={error || usersError}>
            {(response: ResponseInterface) => (
                <div ref={containerRef} className="w-full h-full overflow-auto px-4 pt-4">
                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">

                        {/* Header — compatto */}
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0">
                                <Filter className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground leading-tight">Filtri</h3>
                                <p className="text-[10px] text-muted-foreground leading-tight">Configura i criteri di ricerca</p>
                            </div>
                        </div>

                        {/* Filter Fields */}
                        <div className="flex flex-col gap-4">
                            {response.filters.map((filter, index) => {
                                const isLookupField = filter.type === 'lookup' && filter.lookups && filter.lookups.length > 0;
                                const isCheckBoxField = (filter.type || '').toLowerCase() === 'checkbox' && filter.lookups && filter.lookups.length > 0;
                                const isUserField = filter.type === "Utente";

                                return (
                                    <div key={index} className="flex flex-col gap-1.5">
                                        {/* Label con separatore sottile */}
                                        <label className={labelClass}>
                                            {filter.label}
                                        </label>

                                        {isLookupField && !isUserField && (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex-1 min-w-0">
                                                        <SelectStandard
                                                            lookupItems={filter.lookups}
                                                            initialValue={filterValues[filter.fieldid] || []}
                                                            onChange={v => updateFilter(filter.fieldid, filter.type, filter.label, v, 0)}
                                                            isMulti={true}
                                                        />
                                                    </div>
                                                    <div className="relative shrink-0">
                                                        <button type="button" onClick={() => toggleConditionMenu(`${filter.fieldid}_0`)} className={menuButtonClass}>
                                                            <MoreVertical className="h-3.5 w-3.5" />
                                                        </button>
                                                        {renderConditionMenu(`${filter.fieldid}_0`, filter.type)}
                                                    </div>
                                                </div>
                                                {filterConditions[`${filter.fieldid}_0`] && (
                                                    <span className={conditionBadgeClass}>{filterConditions[`${filter.fieldid}_0`]}</span>
                                                )}
                                            </div>
                                        )}

                                        {isCheckBoxField && (
                                            <InputCheckbox
                                                initialValue={(filterValues[filter.fieldid]?.[0] as string) || ""}
                                                onChange={v => updateFilter(filter.fieldid, filter.type, filter.label, v, 0)}
                                            />
                                        )}

                                        {isUserField && (
                                            <SelectUser
                                                lookupItems={userLookupItems}
                                                initialValue={filterValues[filter.fieldid] || []}
                                                onChange={v => updateFilter(filter.fieldid, filter.type, filter.label, v, 0)}
                                                isMulti={true}
                                            />
                                        )}

                                        {(!isLookupField && !isUserField) && (filter.type === "Parola" || filter.type === "text") && (
                                            <div className="flex flex-col gap-2">
                                                {(filterValues[filter.fieldid] || ['']).map((val, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                type="text"
                                                                placeholder="Inserisci valore..."
                                                                value={val}
                                                                onChange={(e) => updateFilter(filter.fieldid, filter.type, filter.label, e.target.value, idx)}
                                                                className={inputBaseClass}
                                                            />
                                                            <div className="relative shrink-0">
                                                                <button type="button" onClick={() => toggleConditionMenu(`${filter.fieldid}_${idx}`)} className={menuButtonClass}>
                                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                                </button>
                                                                {renderConditionMenu(`${filter.fieldid}_${idx}`, filter.type)}
                                                            </div>
                                                            {(filterValues[filter.fieldid]?.length ?? 1) > 1 && (
                                                                <button type="button" onClick={() => removeInputForFilter(filter.fieldid, idx)} className={removeButtonClass} title="Rimuovi">
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {filterConditions[`${filter.fieldid}_${idx}`] && (
                                                            <span className={conditionBadgeClass}>{filterConditions[`${filter.fieldid}_${idx}`]}</span>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addInputForFilter(filter.fieldid, filter.type)} className={addButtonClass}>
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Aggiungi filtro
                                                </button>
                                            </div>
                                        )}

                                        {filter.type === "Numero" && (
                                            <div className="flex flex-col gap-2">
                                                {(filterValues[filter.fieldid] && filterValues[filter.fieldid].length > 0
                                                    ? filterValues[filter.fieldid]
                                                    : [{ min: '', max: '' }]
                                                ).map((val, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex flex-1 gap-1.5 min-w-0">
                                                                <input
                                                                    type="number"
                                                                    placeholder="Min"
                                                                    value={val?.min || ''}
                                                                    onChange={(e) => updateFilter(filter.fieldid, filter.type, filter.label, { ...val, min: e.target.value }, idx)}
                                                                    className={inputBaseClass}
                                                                />
                                                                <input
                                                                    type="number"
                                                                    placeholder="Max"
                                                                    value={val?.max || ''}
                                                                    onChange={(e) => updateFilter(filter.fieldid, filter.type, filter.label, { ...val, max: e.target.value }, idx)}
                                                                    className={inputBaseClass}
                                                                />
                                                            </div>
                                                            <div className="relative shrink-0">
                                                                <button type="button" onClick={() => toggleConditionMenu(`${filter.fieldid}_${idx}`)} className={menuButtonClass}>
                                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                                </button>
                                                                {renderConditionMenu(`${filter.fieldid}_${idx}`, filter.type)}
                                                            </div>
                                                            {(filterValues[filter.fieldid]?.length ?? 1) > 1 && (
                                                                <button type="button" onClick={() => removeInputForFilter(filter.fieldid, idx)} className={removeButtonClass} title="Rimuovi">
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {filterConditions[`${filter.fieldid}_${idx}`] && (
                                                            <span className={conditionBadgeClass}>{filterConditions[`${filter.fieldid}_${idx}`]}</span>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addInputForFilter(filter.fieldid, filter.type)} className={addButtonClass}>
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Aggiungi range
                                                </button>
                                            </div>
                                        )}

                                        {filter.type === "Data" && (
                                            <div className="flex flex-col gap-2">
                                                {(filterValues[filter.fieldid] || [{ from: '', to: '' }]).map((range, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`flex flex-1 gap-1.5 min-w-0 ${isCompact ? 'flex-col' : 'flex-row'}`}>
                                                                <InputDate
                                                                    initialValue={range?.from || ''}
                                                                    onChange={(v) =>
                                                                        updateFilter(filter.fieldid, filter.type, filter.label, { ...range, from: v }, idx)
                                                                    }
                                                                />
                                                                <InputDate
                                                                    initialValue={range?.to || ''}
                                                                    onChange={(v) =>
                                                                        updateFilter(filter.fieldid, filter.type, filter.label, { ...range, to: v }, idx)
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="relative shrink-0">
                                                                <button type="button" onClick={() => toggleConditionMenu(`${filter.fieldid}_${idx}`)} className={menuButtonClass}>
                                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                                </button>
                                                                {renderConditionMenu(`${filter.fieldid}_${idx}`, filter.type)}
                                                            </div>
                                                            {(filterValues[filter.fieldid]?.length ?? 1) > 1 && (
                                                                <button type="button" onClick={() => removeInputForFilter(filter.fieldid, idx)} className={removeButtonClass} title="Rimuovi">
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {filterConditions[`${filter.fieldid}_${idx}`] && (
                                                            <span className={conditionBadgeClass}>{filterConditions[`${filter.fieldid}_${idx}`]}</span>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addInputForFilter(filter.fieldid, filter.type)} className={addButtonClass}>
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Aggiungi range
                                                </button>
                                            </div>
                                        )}

                                        {filter.type === "Ora" && (
                                            <div className="flex flex-col gap-2">
                                                {(filterValues[filter.fieldid] || [{ min: '', max: '' }]).map((range, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`flex flex-1 gap-1.5 min-w-0 ${isCompact ? 'flex-col' : 'flex-row'}`}>
                                                                <InputTime
                                                                    initialValue={range?.min || ''}
                                                                    onChange={(v) => updateFilter(filter.fieldid, filter.type, filter.label, { ...range, min: v }, idx)}
                                                                />
                                                                <InputTime
                                                                    initialValue={range?.max || ''}
                                                                    onChange={(v) => updateFilter(filter.fieldid, filter.type, filter.label, { ...range, max: v }, idx)}
                                                                />
                                                            </div>
                                                            <div className="relative shrink-0">
                                                                <button type="button" onClick={() => toggleConditionMenu(`${filter.fieldid}_${idx}`)} className={menuButtonClass}>
                                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                                </button>
                                                                {renderConditionMenu(`${filter.fieldid}_${idx}`, filter.type)}
                                                            </div>
                                                            {(filterValues[filter.fieldid]?.length ?? 1) > 1 && (
                                                                <button type="button" onClick={() => removeInputForFilter(filter.fieldid, idx)} className={removeButtonClass} title="Rimuovi">
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {filterConditions[`${filter.fieldid}_${idx}`] && (
                                                            <span className={conditionBadgeClass}>{filterConditions[`${filter.fieldid}_${idx}`]}</span>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addInputForFilter(filter.fieldid, filter.type)} className={addButtonClass}>
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Aggiungi range
                                                </button>
                                            </div>
                                        )}

                                        {filter.type === 'linkedmaster' && (
                                            <div className="flex flex-col gap-2">
                                                {(filterValues[filter.fieldid] || ['']).map((val, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex-1 min-w-0">
                                                                <InputLinked
                                                                    initialValue={val}
                                                                    valuecode={undefined}
                                                                    onChange={(v) => updateFilter(filter.fieldid, filter.type, filter.label, v, idx)}
                                                                    tableid={tableid}
                                                                    linkedmaster_tableid={filter.tablelink}
                                                                    linkedmaster_recordid={filterValues[filter.fieldid]?.[idx] || undefined}
                                                                    fieldid={filter.fieldid}
                                                                    formValues={filterValues}
                                                                />
                                                            </div>
                                                            <div className="relative shrink-0">
                                                                <button type="button" onClick={() => toggleConditionMenu(`${filter.fieldid}_${idx}`)} className={menuButtonClass}>
                                                                    <MoreVertical className="h-3.5 w-3.5" />
                                                                </button>
                                                                {renderConditionMenu(`${filter.fieldid}_${idx}`, filter.type)}
                                                            </div>
                                                            {(filterValues[filter.fieldid]?.length ?? 1) > 1 && (
                                                                <button type="button" onClick={() => removeInputForFilter(filter.fieldid, idx)} className={removeButtonClass} title="Rimuovi">
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        {filterConditions[`${filter.fieldid}_${idx}`] && (
                                                            <span className={conditionBadgeClass}>{filterConditions[`${filter.fieldid}_${idx}`]}</span>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addInputForFilter(filter.fieldid, filter.type)} className={addButtonClass}>
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Aggiungi filtro
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action Footer — sticky bottom */}
                        <div className="sticky bottom-0 mt-auto flex flex-col gap-4 border-t border-border bg-background/80 px-1 py-3 pb-4 backdrop-blur-lg z-10 -mx-1">
                            
                            {/* Save View Section — Integrata nello sticky */}
                            <div className="rounded-xl border border-border bg-card p-2.5">
                                <label className="flex cursor-pointer items-center gap-2.5">
                                    <Checkbox
                                        id="save-view-checkbox"
                                        checked={isSaveViewChecked}
                                        onCheckedChange={(checked) => setIsSaveViewChecked(checked as boolean)}
                                    />
                                    <div className="flex min-w-0 items-center gap-1.5">
                                        <Save className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <span className="truncate text-xs font-medium text-foreground">
                                            Salva come vista predefinita
                                        </span>
                                    </div>
                                </label>

                                {isSaveViewChecked && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                        <input
                                            type="text"
                                            placeholder="Nome della vista..."
                                            value={newViewName}
                                            onChange={(e) => setNewViewName(e.target.value)}
                                            required={isSaveViewChecked}
                                            className={inputBaseClass}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Buttons Container */}
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-md shadow-primary transition-all hover:bg-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    Applica
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
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