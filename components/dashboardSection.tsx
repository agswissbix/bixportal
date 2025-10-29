import React, { useMemo, useContext, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "./genericComponent";
import { AppContext } from "@/context/appContext";
import ChartsList from "@/components/chartsList";
import Dashboard from "@/components/dashboard";
import DashboardForm from "@/components/newDashboardForm";
import { useRecordsStore } from "./records/recordsStore";
import RecordCard from "@/components/recordCard";

const isDev = false;

// INTERFACCE
interface PropsInterface {
  initialTab?: string;
  initialYears?: string[];
  filters?: any;
  dashboardCategory?: string;
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

  // DATI RESPONSE PER LO SVILUPPO
  const responseDataDEV: ResponseInterface = {
    dashboards: [
      { id: "1", name: "Dashboard 1" },
      { id: "2", name: "Dashboard 2" },
    ],
  };

  const devInitialTab = responseDataDEFAULT.dashboards?.[0]?.id || "panoramica"; // Prende il primo dashboard come tab iniziale

  const { cardsList } = useRecordsStore();

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

  const [activeTab, setActiveTab] = useState(devInitialTab);
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
      loading={loading}
      error={error}
      data-oid="rv89u1z"
    >
      {(response: ResponseInterface) => (
<div className="flex flex-col opacity-100 transition-opacity duration-400 ease-out h-full overflow-hidden p-4 sm:p-6 lg:p-8 bg-gray-50" data-oid="t6b1_3p" >
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
<div className="flex-grow min-h-0 overflow-y-auto">
            {responseData.dashboards
              ?.filter(dashboard => dashboard.id === activeTab) // <-- AGGIUNTA CHIAVE: Filtra per la tab attiva
              .map(dashboard => ( // Ora .map() itera solo sull'unico elemento filtrato
                <div className="w-full" data-oid="qkqmynz" key={`${dashboard.id}-${dashboardKey}`}>
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
            {/* {cardsList.map((card, index) => (
              <RecordCard
                key={`${card.tableid}-${card.recordid}`}
                tableid={card.tableid}
                recordid={card.recordid}
                mastertableid={card.mastertableid}
                masterrecordid={card.masterrecordid}
                index={index}
                total={cardsList.length}
                type={card.type}
              />
            ))} */}
          </div>
        </div>
      )}
    </GenericComponent>
  );
}

export default DashboardSection
