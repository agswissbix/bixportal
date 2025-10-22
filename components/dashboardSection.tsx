import React, { useMemo, useContext, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "./genericComponent";
import { AppContext } from "@/context/appContext";
import ChartsList from "@/components/chartsList";
import Dashboard from "@/components/dashboard";
import DashboardForm from "@/components/newDashboardForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = false;

// INTERFACCE
interface PropsInterface {
  initialTab?: string;
  initialYears?: string[];
  filters?: any;
  dashboardCategory?: string;
}

interface SociOspitiData {
  Tassa_ammissione_fondo_perso: number;
  Nr_soci: number;
  Junioren: number;
  Nr_giri_soci: number;
  Nr_tornei_di_club: number;
  Nr_tornei_sezione_senior: number;
  Nr_tornei_sezione_femminile: number;
  Nr_tornei_sezione_giovanile: number;
  Nr_tornei_privati: number;
  Nr_giri_ospiti: number;
  Cifra_d_affari_ospiti: number;
  Prezzo_GF_feriali_adulto: number;
  Prezzo_GF_feriali_junior: number;
  Prezzo_GF_festivi_adulto: number;
  Prezzo_GF_festivi_junior: number;
  Politiche_club: {
    Raincheck: string;
    Online_payment: string;
  };
}

interface CampoData {
  Nr_buche: number;
  Area_gioco_corto: { presente: string; nr_buche: number };
  Superficie_totale_ha: number;
  Superficie_tee_ha: number;
  Superficie_fairway_ha: number;
  Superficie_green_ha: number;
  Budget_gestione_salari_esclusi: number;
  Valore_parco_macchine: number;
}

interface DrivingRangeData {
  Nr_postazioni: number;
  Nr_ingressi_annuali: number;
  Cifra_d_affari: number;
}

interface HrData {
  Dipendenti: { Greenkeeper: number; Totale: number };
  Contabilita: string;
}

interface RistoranteData {
  Gestito_dal_club: string;
  Nr_posti_interni: number;
  Nr_posti_terrazza: number;
  Affitto_annuo: number;
  Nr_collaboratori: number;
  Cifra_d_affari: number;
}

interface ProShopData {
  Gestito_dal_club: string;
  Spazio_vendita_mq: number;
  Affitto_annuo: number;
  Nr_collaboratori: number;
  Cifra_d_affari: number;
}

interface Dashboards {
    id: string;
    name: string;
}

interface ResponseInterface {
  dashboards?: Dashboards[];
}

function DashboardSection({ initialTab, initialYears, filters, dashboardCategory }: PropsInterface) {
  // DATI PROPS PER LO SVILUPPO

  // DATI RESPONSE DI DEFAULT

  // DATI RESPONSE DI DEFAULT - Con struttura valida ma vuota
  const responseDataDEFAULT: ResponseInterface = {};
  const dashboardID = "1";

  // DATI RESPONSE PER LO SVILUPPO
  const responseDataDEV: ResponseInterface = {
    dashboards: [
      { id: "1", name: "Dashboard 1" },
      { id: "2", name: "Dashboard 2" },
    ],
  };

  const devInitialTab = responseDataDEFAULT.dashboards?.[0]?.id || "panoramica"; // Prende il primo dashboard come tab iniziale

  const { user } = useContext(AppContext);

  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT,
  );

  // PAYLOAD (solo se non in sviluppo)
  const payloadApi = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: "get_dashboard_data", // riferimento api per il backend
      dashboardCategory: dashboardCategory || "",
    };
  }, []);

  // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
  const { response, loading, error } =
    !isDev && payloadApi
      ? useApi<ResponseInterface>(payloadApi)
      : { response: null, loading: false, error: null };

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
  useEffect(() => {
    if (
      !isDev &&
      response &&
      JSON.stringify(response) !== JSON.stringify(responseData)
    ) {
      setResponseData(response);
    }
  }, [response, responseData]);

  const DASHBOARD_BLOCKS_CONFIG = useMemo(
    () => ({
      memberBreakdownChart: {
        name: "Grafico: Ripartizione Soci",
        tab: "panoramica",
        type: "chart",
      },
      tournamentBreakdownChart: {
        name: "Grafico: Ripartizione Tornei",
        tab: "panoramica",
        type: "chart",
      },
    }),
    [],
  );

  const INITIAL_VISIBLE_BLOCKS = useMemo(
    () => ({
      memberBreakdownChart: false,
      tournamentBreakdownChart: false,
    }),
    [],
  );

  const [activeTab, setActiveTab] = useState(devInitialTab);
  const [visibleBlocks, setVisibleBlocks] = useState(INITIAL_VISIBLE_BLOCKS);
  const [blockToAdd, setBlockToAdd] = useState("");
  const [showCustomization, setShowCustomization] = useState(false);
  const [refreshDashboard, setRefreshDashboard] = useState(0);

  const availableYears = useMemo(
    () => ["2021", "2022", "2023", "2024", "2025"],
    [],
  );

  const [selectedYears, setSelectedYears] = useState<string[]>(
    initialYears && initialYears.length > 0 
      ? initialYears 
      : [availableYears[0].toString(), availableYears[1].toString(), availableYears[2].toString(), availableYears[3].toString(), availableYears[4].toString()  ]
  );

  const [dashboardKey, setDashboardKey] = useState(0);
  useEffect(() => {
    // Questo effetto si attiva quando i dati dei dashboard cambiano.
    if (responseData.dashboards && responseData.dashboards.length > 0) {
      // Controlla se la tab attiva corrente è valida. Se non lo è (es. al primo caricamento),
      // imposta la prima dashboard della lista come attiva.
      const isValidTab = responseData.dashboards.some(d => d.id === activeTab);
      if (!isValidTab) {
        setActiveTab(responseData.dashboards[0].id);
      }
    }
  }, [responseData.dashboards, activeTab]); // Dipendenze dell'effetto

  const formatCurrency = (value: number) => {
    return `€ ${value.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const PIE_CHART_COLORS = [
    "#10b981",
    "#3b82f6",
    "#f97316",
    "#8b5cf6",
    "#ec4899",
  ];

  const BAR_CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];
  const dashboardTickStyle = {
    fontFamily: "system-ui, sans-serif",
    fontSize: 12,
    fill: "#4b5563",
  };
  const dashboardLegendStyle = {
    fontFamily: "system-ui, sans-serif",
    fontSize: 12,
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = data.value;
      const name = data.name;
      const year = data.year;

      const formattedValue = data.percent
        ? `${formatCurrency(value)} (${data.percent.toFixed(1)}%)`
        : value.toLocaleString("it-IT");

      return (
        <div
          className="bg-white p-3 border border-gray-200 rounded-lg shadow-xl text-sm"
          data-oid="uf99gao"
        >
          <p
            className="font-semibold text-gray-800"
            data-oid="bcdpx8c"
          >{`${name} (${year})`}</p>
          <p style={{ color: payload[0].payload.fill }} data-oid="lc5uz9v">
            {formattedValue}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleYearToggle = (year: string) => {
    setSelectedYears((prev) => {
      const newSelection = prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year];
      if (newSelection.length === 0) return [year];
      return newSelection;
    });
    setDashboardKey(prevKey => prevKey + 1);
  };

  const handleHideBlock = (blockId: string) => {
    setVisibleBlocks((prev) => ({ ...prev, [blockId]: false }));
  };

  const handleAddBlock = () => {
    if (blockToAdd) {
      setVisibleBlocks((prev) => ({ ...prev, [blockToAdd]: true }));
      setBlockToAdd("");
    }
  };

  

  const HideIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      data-oid="z7d23sw"
    >
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" data-oid="9nl:t3h" />
      <path
        fillRule="evenodd"
        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
        data-oid="ohqranx"
      />
    </svg>
  );

  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState<React.ReactNode>(null);

  const Popup = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        data-oid="jthi9ay"
      >
        <div
          className="bg-white rounded-xl shadow-xl h-5/6 w-4/6 mx-4 overflow-auto"
          data-oid="ymjp.fo"
        >
          <div
            className="flex justify-between items-center p-6 border-b border-gray-200"
            data-oid="8vqpx2e"
          >
            <h2 className="text-xl font-bold text-gray-800" data-oid="bfz-0u6">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              data-oid="0h-47ye"
            >
              ×
            </button>
          </div>
          <div className="p-6 h-full w-full" data-oid="_o34702">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const DashboardBlock = ({ title, onHide, children, className = "" }) => {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col ${className}`}
        data-oid="r4rbovh"
      >
        <div
          className="p-4 border-b border-gray-200 flex justify-between items-center"
          data-oid="4xm0ili"
        >
          <h3
            className="text-lg font-semibold text-gray-800"
            data-oid="zf9-xl5"
          >
            {title}
          </h3>
          {onHide && (
            <button
              onClick={onHide}
              className="text-gray-400 hover:text-gray-600"
              title="Nascondi blocco"
              data-oid="1r1t0ud"
            >
              <HideIcon data-oid="b461ji-" />
            </button>
          )}
        </div>
        <div className="p-6 flex-grow" data-oid="e77qg1t">
          {children}
        </div>
      </div>
    );
  };

  const StatCard = ({
    title,
    value,
    previousValue,
    format = "number",
    onHide,
  }) => {
    const trend =
      previousValue && previousValue !== 0
        ? ((value - previousValue) / previousValue) * 100
        : 0;
    const isPositive = trend >= 0;

    const TrendIcon = () => (
      <svg
        className={`w-4 h-4 ${isPositive ? "text-green-500" : "text-red-500"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        data-oid="6dzu_6r"
      >
        {isPositive ? (
          <path
            fillRule="evenodd"
            d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.77a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25A.75.75 0 0110 17z"
            clipRule="evenodd"
            data-oid="tuyx4a_"
          />
        ) : (
          <path
            fillRule="evenodd"
            d="M10 3a.75.75 0 01.75.75v10.638l4.22-4.158a.75.75 0 111.06 1.06l-5.25 5.25a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 111.06-1.06L9.25 14.388V3.75A.75.75 0 0110 3z"
            clipRule="evenodd"
            data-oid="7s:keet"
          />
        )}
      </svg>
    );

    const formattedValue =
      format === "currency"
        ? formatCurrency(value)
        : value.toLocaleString("it-IT");

    return (
      <div
        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative h-full"
        data-oid="v4k:1i5"
      >
        {onHide && (
          <button
            onClick={onHide}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            title="Nascondi blocco"
            data-oid="oxte7ur"
          >
            <HideIcon data-oid="n1u80nb" />
          </button>
        )}
        <p
          className="text-sm font-medium text-gray-500 truncate"
          data-oid="hzesmv7"
        >
          {title}
        </p>
        <div
          className="mt-1 flex items-baseline justify-between"
          data-oid="710kmdf"
        >
          <p className="text-2xl font-bold text-gray-900" data-oid="nis6.:0">
            {formattedValue}
          </p>
          {previousValue !== undefined && (
            <div
              className={`flex items-baseline px-2.5 py-0.5 rounded-full text-xs font-semibold ${isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              data-oid="8p0q2.q"
            >
              <TrendIcon data-oid="3sa2s_r" />
              <span className="ml-1" data-oid="3doi7z2">
                {trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TabButton = ({ id, title }) => (
  <button
    onClick={() => setActiveTab(id)}
    // Rimuoviamo classi generiche e gestiamo tutto con la logica ternaria
    className={`px-3 py-2 text-lg font-semibold transition-colors duration-200 focus:outline-none ${
      activeTab === id
        ? " border-b-2 border-green-600" // Stile ATTIVO: testo verde, bordo inferiore verde
        : "text-gray-500 border-b-2 border-transparent" // Stile INATTIVO: testo grigio, bordo trasparente (per evitare salti di layout)
    }`}
  >
    {title}
  </button>
);

  return (
    <GenericComponent
      response={responseData}
      loading={false}
      error={null}
      data-oid="rv89u1z"
    >
      {(response: ResponseInterface) => (
<div className="flex flex-col opacity-100 transition-opacity duration-400 ease-out h-full p-4 sm:p-6 lg:p-8 bg-gray-50" data-oid="t6b1_3p" >
          <Popup
            isOpen={showPopup}
            onClose={() => setShowPopup(false)}
            title="Dettagli del Grafico"
            data-oid="67mp5as"
          >
            {popupContent}
          </Popup>


          {/* Contenitore unificato per Controlli e Tabs */}
    <div className="flex justify-between items-start pl-4 pr-4">



      {/* Tabs e pulsante Aggiungi (posizionati a destra) */}
      <div className="flex items-center space-x-2">
          {responseData.dashboards?.map((dashboard, index) => (
              <TabButton
                  id={dashboard.id}
                  title={dashboard.name}
                  key={index}
              />
          ))}
          <button
              className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
              title="Crea Dashboard"
              onClick={() => {
                  setShowPopup(true);
                  setPopupContent(<DashboardForm/>);
              }}
          >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
              >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
          </button>
      </div>

      {/* Controls Panel (posizionato a sinistra) */}
    <div
        className="w-fit bg-white rounded-xl shadow-sm border border-gray-200 p-4"
        data-oid="w9b7-qc"
    >
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Anni di riferimento
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                {availableYears.map((year) => (
                    <div key={year} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`compare-${year}`}
                            checked={selectedYears.includes(year)}
                            onChange={() => handleYearToggle(year)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                            htmlFor={`compare-${year}`}
                            className="ml-2 text-sm text-gray-700"
                        >
                            {year}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    </div>

  </div>

          

          {/* Tab Content */}
<div className="flex-grow min-h-0">
            {responseData.dashboards
              ?.filter(dashboard => dashboard.id === activeTab) // <-- AGGIUNTA CHIAVE: Filtra per la tab attiva
              .map(dashboard => ( // Ora .map() itera solo sull'unico elemento filtrato
                <div className="w-full h-full" data-oid="qkqmynz" key={`${dashboard.id}-${dashboardKey}`}>
                  <div className="w-full min-h-full" data-oid="fvz15n4">
                    <Dashboard 
                      onOpenPopup={() => { 
                        setShowPopup(true); 
                        setPopupContent(<ChartsList closePopup={() => setShowPopup(false)} dashboardId={dashboard.id} setRefreshDashboard={setRefreshDashboard} />); 
                      }} 
                      dashboardId={dashboard.id} 
                      selectedYears={selectedYears} 
                      refreshDashboard={refreshDashboard} 
                      setRefreshDashboard={setRefreshDashboard} 
                      filters={filters}
                      data-oid="r-lbass" 
                    />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </GenericComponent>
  );
}

export default DashboardSection
