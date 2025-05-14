import React, { useMemo, useContext, useState, useEffect, createContext } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { useRecordsStore } from './records/recordsStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// Define or import AppContext
const AppContext = createContext({ user: { name: '' } });


// --- Definizioni Tipi Aggiornate ---

// INTERFACCIA PROPS
interface PropsInterface {
    tableid?: string;
    searchTerm?: string;
    filters?: string;
    context?: string;
  }

// Interfaccia per un singolo campo dati in una riga o gruppo
interface FieldInterface {
  fieldid?: string; // Optional: ID del campo (usato nei gruppi)
  recordid?: string; // Optional: ID del record (usato nelle righe)
  css: string;
  type?: string; // Optional: tipo del campo (usato nelle righe)
  value: string;
}

// Interfaccia per una riga di dati (foglia della gerarchia)
interface RowInterface {
  recordid: string;
  css: string;
  fields: FieldInterface[];
}

// Interfaccia ricorsiva per i gruppi
interface GroupInterface {
  groupKey: string; // Chiave univoca per questo gruppo (es: "RegioneX" o "RegioneX-CittaY")
  level: number; // Livello di nidificazione (0 per il top level)
  fields: FieldInterface[]; // Campi descrittivi per questo livello di gruppo
  subGroups?: GroupInterface[]; // Sotto-gruppi (ricorsivo)
  rows?: RowInterface[]; // Righe di dati (solo al livello più basso)
  css?: string; // CSS opzionale per la riga del gruppo
}

// Interfaccia per le colonne della tabella
interface ColumnInterface {
  fieldtypeid: string;
  desc: string;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  groups: GroupInterface[];
  columns: ColumnInterface[];
}

// --- Dati di Esempio Aggiornati (Multi-livello) ---
const responseDataDEV: ResponseInterface = {
  groups: [ // Livello 0: Raggruppamento per Cliente Principale
    {
      groupKey: "ClienteA",
      level: 0,
      fields: [ // Campi per il gruppo ClienteA
        { value: "Marvel Gestioni e Immobili Sagl", css: "" },
        { value: "Totale Cliente A", css: "font-semibold" }, // Esempio campo aggregato
        { value: "", css: "" }, // Placeholder per allineamento colonne
        { value: "", css: "" },
        { value: "5000", css: "font-bold" }
      ],
      subGroups: [ // Livello 1: Raggruppamento per Indirizzo/Progetto sotto ClienteA
        {
          groupKey: "ClienteA-Indirizzo1",
          level: 1,
          fields: [ // Campi per il sottogruppo Indirizzo1
            { value: "Progetto Casa Sirio", css: "" },
            { value: "Totale Indirizzo 1", css: "italic" },
            { value: "1000", css: "" }, // Valore Gennaio per Indirizzo 1
            { value: "1025", css: "" }, // Valore Febbraio per Indirizzo 1
            { value: "2025", css: "font-semibold" } // Totale Complessivo per Indirizzo 1
          ],
          rows: [ // Righe di dati per Indirizzo1
            {
              recordid: "1", css: "", fields: [
                { value: "Casa Sirio Via Giuseppe Stabile 3", css: "text-xs" },
                { value: "1000", css: "" }, { value: "500", css: "" }, { value: "525", css: "" }, { value: "1025", css: "" }
              ]
            },
             {
              recordid: "1b", css: "", fields: [
                { value: "Casa Sirio - Interno B", css: "text-xs" },
                { value: "1000", css: "" }, { value: "500", css: "" }, { value: "500", css: "" }, { value: "1000", css: "" }
              ]
            }
          ]
        },
        {
          groupKey: "ClienteA-Indirizzo2",
          level: 1,
          fields: [ // Campi per il sottogruppo Indirizzo2
            { value: "Progetto San Giorgio", css: "" },
            { value: "Totale Indirizzo 2", css: "italic" },
            { value: "1500", css: "" },
            { value: "1475", css: "" },
            { value: "2975", css: "font-semibold" }
          ],
          rows: [ // Righe di dati per Indirizzo2
            {
              recordid: "2", css: "", fields: [
                { value: "Condominio San Giorgio", css: "text-xs" },
                { value: "1500", css: "" }, { value: "700", css: "" }, { value: "775", css: "" }, { value: "1475", css: "" }
              ]
            }
          ]
        }
      ] // Fine subGroups ClienteA
    },
    { // Livello 0: Altro Cliente Principale
      groupKey: "ClienteB",
      level: 0,
      fields: [
        { value: "Agenzia Immobiliare Ceresio SA", css: "" },
        { value: "Totale Cliente B", css: "font-semibold" },
        { value: "", css: "" },
        { value: "", css: "" },
        { value: "6075", css: "font-bold" }
      ],
      rows: [ // ClienteB ha solo righe dirette, senza sottogruppi
        {
          recordid: "3", css: "", fields: [
            { value: "Ufficio Agenzia Ceresio", css: "text-xs" },
            { value: "2025", css: "" }, { value: "1000", css: "" }, { value: "1025", css: "" }, { value: "2025", css: "" }
          ]
        },
        {
          recordid: "4", css: "", fields: [
            { value: "Residenza Salice Via Frontini 8", css: "text-xs" },
            { value: "4050", css: "" }, { value: "2000", css: "" }, { value: "2050", css: "" }, { value: "4050", css: "" }
          ]
        }
      ] // Fine rows ClienteB
    }
  ],
  columns: [ // Definizioni colonne
    { fieldtypeid: "Parola", desc: "Nome / Descrizione" }, // Colonna principale
    { fieldtypeid: "Numero", desc: "Totale Riga/Gruppo" },
    { fieldtypeid: "Numero", desc: "Gennaio" },
    { fieldtypeid: "Numero", desc: "Febbraio" },
    { fieldtypeid: "Numero", desc: "Totale Complessivo" }
  ]
};


// --- Componente Ricorsivo per Gruppi/Righe ---

interface GroupRowProps {
  group: GroupInterface;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (groupKey: string) => void;
  handleRowClick: (type: string, recordid: string, context: string) => void;
  requiredColumns: number;
  level: number; // Aggiunto livello per indentazione
}

const GroupRenderer: React.FC<GroupRowProps> = ({
  group,
  expandedGroups,
  toggleGroup,
  handleRowClick,
  requiredColumns,
  level
}) => {
  const isExpanded = expandedGroups[group.groupKey] ?? true; // Default a espanso
  const hasSubGroups = group.subGroups && group.subGroups.length > 0;
  const hasRows = group.rows && group.rows.length > 0;
  const isExpandable = hasSubGroups || hasRows;

  // Calcola indentazione basata sul livello
  const indentationClass = `pl-${4 + level * 4}`; // es: pl-4, pl-8, pl-12

  return (
    <React.Fragment>
      {/* Riga Intestazione Gruppo */}
      <tr
        className={`border-b border-gray-200 dark:border-gray-700 transition-colors duration-150 ease-in-out ${group.css || ''} ${isExpandable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''} ${isExpanded && isExpandable ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'bg-white dark:bg-gray-800'}`}
        onClick={isExpandable ? () => toggleGroup(group.groupKey) : undefined}
      >
        {/* Renderizza celle per la riga gruppo */}
        {Array.from({ length: requiredColumns }).map((_, fieldIndex) => {
          const field = group.fields[fieldIndex];
          return (
            <td
              className={`px-4 py-3 align-middle ${fieldIndex === 0 ? `flex items-center ${indentationClass}` : ''} ${field?.css || ''}`}
              key={`${group.groupKey}-field-${fieldIndex}`}
            >
              {fieldIndex === 0 ? ( // Prima cella con icona (se espandibile) e valore
                <>
                  {isExpandable && ( // Mostra icona solo se ci sono figli
                    <span className={`mr-2 inline-flex items-center justify-center text-gray-500 dark:text-gray-400`}>
                      <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </span>
                  )}
                   {!isExpandable && <span className="mr-2 inline-block w-4"></span>} {/* Placeholder per allineamento se non espandibile */}
                  <span className={`truncate ${level === 0 ? 'font-semibold' : 'font-medium'}`}>{field?.value || ''}</span>
                </>
              ) : ( // Altre celle
                <span className="truncate">{field?.value || ''}</span>
              )}
            </td>
          );
        })}
      </tr>

      {/* Renderizzazione Ricorsiva Sottogruppi o Righe Figlio */}
      {isExpanded && (
        <>
          {/* Renderizza Sottogruppi */}
          {hasSubGroups && group.subGroups?.map((subGroup) => (
            <GroupRenderer
              key={subGroup.groupKey}
              group={subGroup}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
              handleRowClick={handleRowClick}
              requiredColumns={requiredColumns}
              level={level + 1} // Incrementa il livello
            />
          ))}

          {/* Renderizza Righe Figlio (solo se non ci sono sottogruppi) */}
          {hasRows && group.rows?.map((row, rowIndex) => (
            <tr
              className={`w-full border-b border-gray-100 dark:border-gray-750 transition-colors duration-150 ease-in-out ${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-800/90' : 'bg-gray-50 dark:bg-gray-800/80'} hover:bg-blue-50/50 dark:hover:bg-gray-700/70 cursor-pointer`}
              key={`${group.groupKey}-row-${row.recordid}-${rowIndex}`}
              onClick={() => handleRowClick('standard', row.recordid, 'informazionigasolio')}
            >
              {/* Renderizza celle per la riga figlio */}
              {Array.from({ length: requiredColumns }).map((_, fieldIndex) => {
                const field = row.fields[fieldIndex];
                // Indentazione per la prima colonna delle righe figlio
                const rowIndentationClass = fieldIndex === 0 ? `pl-${4 + (level + 1) * 4}` : ''; // Indenta un livello in più rispetto al gruppo padre
                return (
                  <td
                    className={`px-4 py-2.5 align-middle ${rowIndentationClass} ${field?.css || ''}`}
                    key={`${group.groupKey}-row-${row.recordid}-cell-${fieldIndex}`}
                  >
                    <div className="truncate">{field?.value || ''}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </>
      )}
    </React.Fragment>
  );
};


// --- Componente Pivot Principale ---
export default function Pivot({ tableid, searchTerm, filters, context }: PropsInterface) {


// DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : tableid + ' ' + searchTerm + ' ' + filters + ' ' + context;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
        groups: [],
        columns: []
    };

    const { user } = useContext(AppContext);
  // IMPOSTAZIONE DELLA RESPONSE (non toccare)
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const { refreshTable, handleRowClick } = useRecordsStore();


  // PAYLOAD (solo se non in sviluppo)
      const payload = useMemo(() => {
          if (isDev) return null;
          return {
              apiRoute: 'getPitservicePivotLavanderie', // riferimento api per il backend
              tableid: tableid,
              searchTerm: searchTerm,
          };
      }, [refreshTable, tableid]);
  
      // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
      const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };
  
      // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non toccare)
      useEffect(() => {
          if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
              setResponseData(response);
          }
      }, [response, responseData]);

  // Inizializza stato espansione (default a espanso)
  useEffect(() => {
    const initialExpansionState: Record<string, boolean> = {};
    const setInitialExpansion = (groups: GroupInterface[]) => {
        groups.forEach(group => {
            initialExpansionState[group.groupKey] = true; // Espandi di default
            if (group.subGroups) {
                setInitialExpansion(group.subGroups); // Ricorsivo
            }
        });
    };
    setInitialExpansion(responseData.groups);
    setExpandedGroups(initialExpansionState);
}, [responseData.groups]); // Riesegui se i gruppi cambiano


  // Funzione Toggle aggiornata per chiavi stringa
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !(prev[groupKey] ?? true) // Toggle, considera true se non definito
    }));
  };

  // Calcolo colonne (invariato)
  const calculateRequiredColumns = (data: ResponseInterface): number => {
        const columnCount = data.columns.length;
        let maxFields = 0;

        const findMaxFields = (items: (GroupInterface | RowInterface)[]) => {
            items.forEach(item => {
                if ('fields' in item) {
                    maxFields = Math.max(maxFields, item.fields.length);
                }
                if ('subGroups' in item && item.subGroups) {
                    findMaxFields(item.subGroups); // Check subgroups
                }
                 if ('rows' in item && item.rows) {
                    findMaxFields(item.rows); // Check rows within groups
                }
            });
        };

        findMaxFields(data.groups); // Start recursion with top-level groups

        return Math.max(columnCount, maxFields);
    };

  const requiredColumns = calculateRequiredColumns(responseData);
  const finalColumns = [...responseData.columns];
  while (finalColumns.length < requiredColumns) {
    finalColumns.push({ fieldtypeid: "Filler", desc: `` });
  }



      
  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <div className="h-full flex flex-col space-y-4 p-4 bg-gray-50 dark:bg-gray-900 font-sans">
          <div className="w-full flex-grow relative overflow-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300 table-auto">
              <thead className="text-xs sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm">
                 <tr>
                  {finalColumns.map((column, index) => (
                    <th
                      scope="col"
                      className={`px-4 py-3 font-semibold tracking-wider text-gray-700 dark:text-gray-200 uppercase ${index === 0 ? 'w-2/5' : ''}`} // Adjusted width for first column
                      key={`${column.desc}-${index}`}
                    >
                      {column.desc}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Renderizza i gruppi di primo livello usando il componente ricorsivo */}
                {response.groups.map((topLevelGroup) => (
                  <GroupRenderer
                    key={topLevelGroup.groupKey}
                    group={topLevelGroup}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    handleRowClick={handleRowClick}
                    requiredColumns={requiredColumns}
                    level={0} // Livello iniziale
                  />
                ))}
                 {/* Messaggio se non ci sono gruppi */}
                 {response.groups.length === 0 && (
                    <tr>
                        <td colSpan={requiredColumns} className="p-6 text-center text-gray-500 dark:text-gray-400">
                            Nessun gruppo da visualizzare.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginazione (Statica) */}
          <nav aria-label="Page navigation" className="flex justify-center pt-2">
             <ul className="inline-flex items-center text-xs rounded-md shadow-sm overflow-hidden border border-gray-200 dark:border-gray-600">
              <li><a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border-e border-gray-200 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>Prev</a></li>
              <li><a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border-e border-gray-200 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">1</a></li>
              <li><a href="#" aria-current="page" className="z-10 flex items-center justify-center px-3 h-8 text-white border-e border-blue-300 bg-blue-600 hover:bg-blue-700 transition-colors duration-150 dark:border-gray-700 dark:bg-blue-600 dark:hover:bg-blue-700">2</a></li>
              <li><a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border-e border-gray-200 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">3</a></li>
              <li><a href="#" className="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white hover:bg-gray-100 hover:text-blue-600 transition-colors duration-150 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">Next<svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></a></li>
            </ul>
          </nav>
        </div>
      )}
    </GenericComponent>
  );
};

