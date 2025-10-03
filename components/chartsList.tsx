import React, {
  useMemo,
  useContext,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "./genericComponent";
import { AppContext } from "@/context/appContext";
import { toast } from "sonner";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import ChartPreview from "@/components/charts/chartPreview";
import { PlusCircle } from "lucide-react"; // esempio per bottone nuovo blocco

const isDev = false;

interface PropsInterface {
  closePopup: () => void;
  propExampleValue?: string;
  setRefreshDashboard?: Dispatch<SetStateAction<number>>;
  onChartSelect?: (chart: { id: string; title: string }) => void;
  selectedChartId?: string;
  placeholder?: string;
  dashboardId?: string;
}

interface DashboardBlock {
  id: number;
  dashboardid: number;
  name: string;
  userid: string;
  description: string
  reportid: number;
  viewid: number;
  chartid?: number; 
}

interface ResponseInterface {
  block_list: DashboardBlock[];
}

function ChartsList({
  closePopup,
  setRefreshDashboard,
  onChartSelect,
  dashboardId,
}: PropsInterface) {
  const { user } = useContext(AppContext);

  const responseDataDEFAULT: ResponseInterface = {
    block_list: [
      {
        id: 1,
        dashboardid: 11,
        name: "Default Block",
        userid: "user_123",
        description: "Descrizione",
        reportid: 101,
        viewid: 201,
        chartid: 1,
      },
    ],
  };

  const responseDataDEV: ResponseInterface = {
    block_list: [
      {
        id: 1,
        dashboardid: 11,
        name: "Sales Dashboard",
        description: "Descrizione",
        userid: "user_123",
        reportid: 101,
        viewid: 201,
        chartid: 5,
      },
      {
        id: 2,
        dashboardid: 11,
        name: "Revenue Analytics",
        description: "Descrizione",
        userid: "user_123",
        reportid: 102,
        viewid: 202,
        chartid: 6,
      },
      {
        id: 3,
        dashboardid: 11,
        name: "Customer Metrics",
        description: "Descrizione",
        userid: "user_123",
        reportid: 103,
        viewid: 203,
        chartid: 7,
      },
    ],
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChartId, setSelectedChartId] = useState<number | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<DashboardBlock | null>(null);
  

  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: "get_dashboard_blocks",
      userid: user,
      dashboardid: dashboardId,
    };
  }, [user, dashboardId]);

  const { response, loading, error } =
    !isDev && payload
      ? useApi<ResponseInterface>(payload)
      : { response: null, loading: false, error: null };

  useEffect(() => {
    if (
      !isDev &&
      response &&
      JSON.stringify(response) !== JSON.stringify(responseData)
    ) {
      setResponseData(response);
    }
  }, [response, responseData]);

  const addDashboardBlock = async () => {
    const blockid = selectedBlock?.id;
    try {
      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "add_dashboard_block",
          userid: user,
          size: "full",
          dashboardid: dashboardId,
          blockid
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Disposizione della dashboard salvata con successo");
      closePopup();
      if (setRefreshDashboard) {
        setRefreshDashboard((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Errore durante il salvataggio", error);
      toast.error("Errore durante il salvataggio della dashboard");
    }
  };

  useEffect(() => {
    if (isDev) {
      const interval = setInterval(() => {
        setResponseData(responseDataDEV);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  const filteredBlocks = useMemo(() => {
    if (!responseData.block_list) return [];
    return responseData.block_list.filter((block) =>
      block.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [responseData.block_list, searchTerm]);

  const handleBlockSelect = (block: DashboardBlock) => {
    if (block.chartid) {
      setSelectedChartId(block.chartid);
      onChartSelect?.({ id: block.chartid.toString(), title: block.name });
      setSelectedBlock(block)
    } else {
      toast.error("Questo blocco non ha un grafico associato");
    }
  };

  return (
    <GenericComponent response={responseData} loading={loading} error={error} data-oid="144c0.a">
      {(response: ResponseInterface) => (
        <div className="flex gap-6 w-full">
          <div className="w-full max-w-md space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca blocco..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="border border-gray-200 rounded-md bg-white shadow-sm">
              <div className="max-h-80 overflow-y-auto">
                {filteredBlocks.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredBlocks.map((block) => (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => handleBlockSelect(block)}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors duration-150 ${
                          selectedBlock?.id === block.id
                            ? "bg-blue-100 border-l-4 border-blue-500"
                            : "hover:border-l-4 hover:border-blue-200"
                        }`}
                      >
                        <h3 className={`text-sm font-medium ${selectedBlock?.id === block.id ? "text-blue-900" : "text-gray-900"}`}>
                          {block.name}
                        </h3>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    Nessun blocco disponibile
                  </div>
                )}
              </div>
            </div>

            {selectedBlock && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800">Blocco selezionato</p>
                <p className="text-sm text-green-700 mt-1">{selectedBlock.name}</p>
              </div>
            )}
          </div>

          {selectedBlock && (
            <div className="flex-1 w-full h-full">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedBlock.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">ID: {selectedBlock.id}</p>
                  </div>

                  <div className="inline-block w-full rounded-lg overflow-hidden">
                    <ChartPreview chartId={selectedBlock.chartid} viewId={selectedBlock.viewid}/>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Descrizione
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedBlock.description || "Nessuna descrizione disponibile per questo grafico."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      onClick={addDashboardBlock}
                    >
                      Inserisci
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </GenericComponent>
  );
}

export default ChartsList;
