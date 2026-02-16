import React, {
  useMemo,
  useContext,
  useState,
  useEffect,
  createContext,
} from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "./genericComponent";
import { useRecordsStore } from "./records/recordsStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = false;

/* -------------------------------------------------- TYPES --------------------------------------------------- */

const AppContext = createContext({ user: { name: "" } });

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  searchTerm?: string;
  filters?: string;
  view?: string;
  order?: {
    columnDesc: string | null;
    direction: 'asc' | 'desc' | null;
  };
  context?: string;
  pagination?: {
    page: number;
    limit: number;
  };
  level?: number;
  filtersList?: Array<{
    fieldid: string;
    type: string;
    label: string;
    value: string;
  }>;
  masterTableid?: string;
  masterRecordid?: string;
}

interface FieldInterface {
  fieldid?: string;
  recordid?: string;
  css: string;
  type?: string;
  value: string;
}

interface RowInterface {
  recordid: string;
  css: string;
  fields: FieldInterface[];
}

interface GroupInterface {
  groupKey: string;
  level: number;
  fields: FieldInterface[];
  subGroups?: GroupInterface[];
  rows?: RowInterface[];
  css?: string;
}

interface ColumnInterface {
  fieldtypeid: string;
  desc: string;
}

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

interface GroupRowProps {
  group: GroupInterface;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (key: string) => void;
  handleRowClick: (type: string, recordid: string, ctx: string) => void;
  requiredColumns: number;
  level: number;
  tableid?: string;
}

const GroupRenderer: React.FC<GroupRowProps> = ({
  group,
  expandedGroups,
  toggleGroup,
  handleRowClick,
  requiredColumns,
  level,
  tableid,
}) => {
  const isExpanded = expandedGroups[group.groupKey] ?? true;
  const hasSubGroups = !!group.subGroups?.length;
  const hasRows = !!group.rows?.length;
  const isExpandable = hasSubGroups || hasRows;

  const indent = `pl-${4 + level * 4}`;

  return (
    <>
      {/* -------------------- RIGA GRUPPO -------------------- */}
      <tr
        className={`border-b border-gray-200 dark:border-gray-700 transition-colors duration-150 ease-in-out
                    ${group.css || ""}
                    ${isExpandable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : ""}
                    ${isExpanded && isExpandable
            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            : "bg-white dark:bg-gray-800"}`}
        onClick={isExpandable ? () => toggleGroup(group.groupKey) : undefined}
      >
        {Array.from({ length: requiredColumns }).map((_, idx) => {
          const field = group.fields[idx];
          return (
            <td
              key={`${group.groupKey}-fld-${idx}`}
              className={`px-4 py-3 align-middle
                          ${idx === 0 ? `flex items-center ${indent}` : ""}
                          ${idx === 0 ? "sticky left-0 z-20 bg-gray-100 dark:bg-gray-800" : ""}
                          ${idx === 1 ? "sticky left-[200px] z-20 bg-gray-100 dark:bg-gray-800" : ""}
                          ${field?.css || ""}`}
            >
              {idx === 0 ? (
                <>
                  {isExpandable ? (
                    <span className="mr-2 inline-flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  ) : (
                    <span className="mr-2 inline-block w-4" />
                  )}

                  {/* --------------------- CSS applicata anche allo span --------------------- */}
                  <span
                    className={`truncate ${level === 0 ? "font-semibold" : "font-medium"
                      } ${field?.css || ""}`}
                  >
                    {field?.value || ""}
                  </span>
                </>
              ) : (
                <span className={`truncate ${field?.css || ""} `}>
                  {field?.value || ""}
                </span>
              )}
            </td>
          );
        })}
      </tr>

      {/* -------------------- FIGLI (sub-groups / rows) -------------------- */}
      {isExpanded && (
        <>
          {/* sub-groups ---------------------------------------------------- */}
          {hasSubGroups &&
            group.subGroups!.map((sg) => (
              <GroupRenderer
                key={sg.groupKey}
                group={sg}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                handleRowClick={handleRowClick}
                requiredColumns={requiredColumns}
                level={level + 1}
              />
            ))}

          {/* rows ---------------------------------------------------------- */}
          {hasRows &&
            group.rows!.map((row, rIdx) => (
              <tr
                key={`${group.groupKey}-row-${row.recordid}-${rIdx}`}
                onClick={() =>
                  handleRowClick("standard", row.recordid, "rendicontolavanderia")
                }
                className={`w-full border-b border-gray-100 dark:border-gray-750 transition-colors duration-150 ease-in-out
                            ${rIdx % 2 === 0
                    ? "bg-white dark:bg-gray-800/90"
                    : "bg-gray-50 dark:bg-gray-800/80"
                  }
                            hover:bg-blue-50/50 dark:hover:bg-gray-700/70 cursor-pointer
                            ${row.css || ""}`}
              >
                {Array.from({ length: requiredColumns }).map((_, cIdx) => {
                  const field = row.fields[cIdx];
                  const indentRow = cIdx === 0 ? `pl-${4 + (level + 1) * 4}` : "";
                  return (
                    <td
                      key={`${group.groupKey}-row-${row.recordid}-cell-${cIdx}`}
                      className={`px-4 py-2.5 align-middle ${indentRow} 
                        ${field?.css || ""}
                        ${cIdx === 0 ? "sticky left-0 z-20" : ""}
                        ${cIdx === 1 ? "sticky left-[100px] z-20" : ""}
                        ${(cIdx === 0 || cIdx === 1) ? (rIdx % 2 === 0
                          ? "bg-white dark:bg-gray-800/90"
                          : "bg-gray-50 dark:bg-gray-800/80") : ""}
                      `}
                    >
                      {/* -------- CSS su contenuto -------- */}
                      <div className={`truncate ${field?.css || ""}`}>
                        {field?.value || ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
        </>
      )}
    </>
  );
};

/* -------------------------------------- COMPONENTE PIVOT -------------------------------------- */

export default function Pivot({ tableid, searchTerm, filters, view, order, context, pagination, level, masterTableid, masterRecordid }: PropsInterface) {
  const responseDataDEFAULT: ResponseInterface = { groups: [], columns: [] };
  const { user } = useContext(AppContext);

  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  const { refreshTable, handleRowClick } = useRecordsStore();

  /* ----------------------------- fetch backend ----------------------------- */
  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: "getPitservicePivotLavanderie",
      tableid,
      view,
      searchTerm,
    };
  }, [refreshTable, tableid]);

  const { response, loading, error } = !isDev && payload
    ? useApi<ResponseInterface>(payload)
    : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, responseData]);

  /* -------------------------- gestione espansione -------------------------- */
  useEffect(() => {
    const init: Record<string, boolean> = {};
    const walk = (gs: GroupInterface[]) => {
      gs.forEach((g) => {
        init[g.groupKey] = true;
        g.subGroups && walk(g.subGroups);
      });
    };
    walk(responseData.groups);
    setExpandedGroups(init);
  }, [responseData.groups]);

  const toggleGroup = (key: string) =>
    setExpandedGroups((p) => ({ ...p, [key]: !(p[key] ?? true) }));

  /* -------------------------- calcolo colonne -------------------------- */
  const calcCols = (data: ResponseInterface): number => {
    let max = data.columns.length;
    const walk = (items: (GroupInterface | RowInterface)[]) => {
      items.forEach((it) => {
        max = Math.max(max, "fields" in it ? it.fields.length : 0);
        if ("subGroups" in it && it.subGroups) walk(it.subGroups);
        if ("rows" in it && it.rows) walk(it.rows);
      });
    };
    walk(data.groups);
    return max;
  };

  const requiredColumns = calcCols(responseData);
  const finalColumns = [...responseData.columns];
  while (finalColumns.length < requiredColumns) {
    finalColumns.push({ fieldtypeid: "Filler", desc: "" });
  }

  /* ----------------------------------- UI ---------------------------------- */
  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(resp: ResponseInterface) => (
        <div className="h-full flex flex-col space-y-4 p-4 bg-gray-50 dark:bg-gray-900 font-sans">
          <div className="w-full flex-grow relative overflow-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300 table-auto">
              <thead className="text-xs sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm">
                <tr>
                  {finalColumns.map((c, i) => (
                    <th
                      key={`${c.desc}-${i}`}
                      scope="col"
                      className={`px-4 py-3 font-semibold tracking-wider text-gray-700 dark:text-gray-200 uppercase
          ${i === 0 ? "sticky left-0 z-20 bg-gray-100 dark:bg-gray-800" : ""}
          ${i === 1 ? "sticky left-[100px] z-20 bg-gray-100 dark:bg-gray-800" : ""}
        `}
                      style={i === 0 ? { minWidth: 200, maxWidth: 200 } : i === 1 ? { minWidth: 200, maxWidth: 200 } : {}}
                    >
                      {c.desc}
                    </th>
                  ))}
                </tr>
              </thead>


              <tbody>
                {resp.groups.map((g) => (
                  <GroupRenderer
                    key={g.groupKey}
                    group={g}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    handleRowClick={handleRowClick}
                    requiredColumns={requiredColumns}
                    level={0}
                    tableid={tableid}
                  />
                ))}

                {resp.groups.length === 0 && (
                  <tr>
                    <td
                      colSpan={requiredColumns}
                      className="p-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      Nessun gruppo da visualizzare.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* paginazione statica omessa per brevità */}
        </div>
      )}
    </GenericComponent>
  );
}
