import React, { useMemo, useContext, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "./genericComponent";
import { AppContext } from "@/context/appContext";
import ChartsList from "@/components/chartsList";
import Dashboard from "@/components/dashboard";
import DashboardForm from "@/components/newDashboardForm";
import { Pen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import axiosInstanceClient from "@/utils/axiosInstanceClient";

const isDev = false;

// INTERFACCE
interface PropsInterface {
  initialTab?: string;
  initialYears?: string[];
  dashboardCategory?: string;
  showFilters?: showFiltersTypes;
}

interface showFiltersTypes {
  years?: boolean;
  average?: boolean;
  numericFilters?: boolean;
  demographicFilters?: boolean | { [key: string]: boolean };
  clubs?: boolean;
}

interface Dashboards {
    id: string;
    name: string;
}

interface ResponseInterface {
  dashboards?: Dashboards[];
}

function DashboardSection({ initialTab, initialYears, dashboardCategory, showFilters={ years: false, average: false, numericFilters: false, demographicFilters: false, clubs: false } }: PropsInterface) {
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
  }, [response]);


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

  const Popup = ({ isOpen, onClose, children, title }: { isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string }) => {
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

  const TabButton = ({ id, title }: { id: string; title: string }) => {
    const isActive = activeTab === id;

    const renameTab = async (id: string) => {
      const newName = prompt("Nuovo nome:");
      if (!newName) return;

      try {
        const response = await axiosInstanceClient.post(
            "/postApi",
            {
              apiRoute: "update_dashboard",
              dashboard_name: newName,
              dashboardid: id
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          )
        
          if (response.data.success) {
            setResponseData(prev => ({
              ...prev,
              dashboards: prev.dashboards!.map(d =>
                d.id === id ? { ...d, name: newName } : d
              )
            }));
            toast.success("Dashboard rinominata con successo.")
          }
      } catch (error) {
        toast.error("Errore durante la rinominazione della dashboard")
      }

    };

    const deleteTab = async (id: string) => {
      toast.warning("Vuoi davvero eliminare questa dashboard?", {
        action: {
          label: "Elimina",
          onClick: async () => {
            try {
              const response = await axiosInstanceClient.post(
                "/postApi",
                {
                  apiRoute: "update_dashboard",
                  dashboardid: id
                },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                },
              );

              // La tua API restituisce: { message: "...", dashboardid: ... }
              if (response.data.message === "Dashboard deleted successfully") {

                toast.success("Dashboard eliminata con successo.");

                setResponseData(prev => {
                  const updated = {
                    ...prev,
                    dashboards: prev.dashboards!.filter(d => d.id !== id),
                  };

                  // Aggiorna tab attivo se necessario
                  if (activeTab === id) {
                    const remaining = updated.dashboards;
                    setActiveTab(remaining.length ? remaining[0].id : "");
                  }

                  return updated;
                });
              }

            } catch (error) {
              toast.error("Errore durante l'eliminazione della dashboard");
            }
          },
        },
      });
    };

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-2 px-4 py-2 text-base font-semibold transition-all duration-200 focus:outline-none ${
            isActive
              ? "border-b-2 border-green-600 text-gray-800"
              : "text-gray-500 border-b-2 border-transparent hover:text-gray-700"
          }`}
        >
          {title}
          
          {isActive && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  renameTab(id);
                }}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
                title="Rinomina"
              >
                <Pen className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTab(id);
                }}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                title="Elimina"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </button>
      </div>
    );
}

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
            title={"Dettagli del Grafico"}
            data-oid="67mp5as"
          >
            {popupContent}
          </Popup>


          {/* Contenitore unificato per Controlli e Tabs */}
    <div className="flex justify-between items-start px-4 mb-4">



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
              title={"Crea Dashboard"}
              onClick={() => {
                  setShowPopup(true);
                  setPopupContent(<DashboardForm category={dashboardCategory}/>);
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
                      showFilters={showFilters} 
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
