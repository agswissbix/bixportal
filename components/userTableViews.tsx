// 📄 UserTableViews.tsx
import React, { useState, useEffect, useContext } from 'react';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useRecordsStore } from './records/recordsStore';
import { AppContext } from '@/context/appContext';

interface Table {
  id: string;
  description: string;
}

interface View {
  id: number;
  name: string;
  userid: number;
  tableid: string;
}

export default function UserTableViews() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [views, setViews] = useState<View[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingViews, setIsLoadingViews] = useState(false);
  
  const { setRefreshViewsList } = useRecordsStore();
  const { role } = useContext(AppContext);
  const isAdmin = role.toLowerCase() === 'admin';

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTableId) {
      fetchViews(selectedTableId);
    } else {
      setViews([]);
    }
  }, [selectedTableId]);

  const fetchTables = async () => {
    setIsLoadingTables(true);
    try {
      const response = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'get_all_tables'
      });
      if (response.data && response.data.tables) {
        setTables(response.data.tables);
      }
    } catch (error) {
      toast.error("Errore nel caricamento delle tabelle");
    } finally {
      setIsLoadingTables(false);
    }
  };

  const fetchViews = async (tableid: string) => {
    setIsLoadingViews(true);
    try {
      const response = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'get_table_views',
        tableid: tableid
      });
      if (response.data && response.data.views) {
        setViews(response.data.views);
      }
    } catch (error) {
      toast.error("Errore nel caricamento delle viste");
    } finally {
      setIsLoadingViews(false);
    }
  };

  const handleDeleteView = async (viewId: number, viewName: string) => {
    toast.warning(`Sei sicuro di voler eliminare la vista "${viewName}"?`, {
      action: {
        label: 'Conferma',
        onClick: async () => {
          await deleteView(viewId);
        },
      },
    });
  };

  const deleteView = async (viewId: number) => {
    try {
      const delResponse = await axiosInstanceClient.post(`/postApi`, {
          apiRoute: "delete_table_view",
          view_id: viewId
      });
      if (delResponse.data.success) {
          toast.success("Vista eliminata con successo");
          setViews(prev => prev.filter(v => v.id !== viewId));
          setRefreshViewsList(); // Aggiorniamo quickFilters se necessario
      } else {
          toast.error(delResponse.data.detail || "Errore durante l'eliminazione");
      }
    } catch (err) {
      toast.error("Errore di rete");
    }
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl max-w-2xl mx-auto my-10 border border-gray-100">
      <p className="text-sm text-gray-600 mb-6 font-medium">
        Seleziona una tabella per gestire le tue viste personalizzate.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-800 mb-2">Tabella</label>
        {isLoadingTables ? (
          <div className="text-sm text-gray-500 animate-pulse">Caricamento tabelle...</div>
        ) : (
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
            className="w-full h-11 bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 transition-all duration-200"
          >
            <option value="">-- Seleziona una tabella --</option>
            {tables.map(table => (
              <option key={table.id} value={table.id}>{table.description}</option>
            ))}
          </select>
        )}
      </div>

      {selectedTableId && (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center justify-between">
            Le tue viste per questa tabella
            {isLoadingViews && <span className="text-xs text-blue-500 font-normal">Aggiornamento...</span>}
          </h4>
          
          {views.length === 0 && !isLoadingViews ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-500 italic text-center">
              Nessuna vista disponibile per questa tabella.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Viste Personali */}
              {views.some(v => v.userid !== 1) && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Le tue Viste</h5>
                  <ul className="space-y-3">
                    {views.filter(v => v.userid !== 1).map(view => (
                      <li key={view.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{view.name}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            Vista personale
                          </span>
                        </div>
                        <div className="mt-3 sm:mt-0 flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteView(view.id, view.name)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                              title="Elimina la tua vista"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-xs font-medium sm:hidden">Elimina</span>
                            </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Viste di Sistema */}
              {views.some(v => v.userid === 1) && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Viste di Sistema</h5>
                  <ul className="space-y-3">
                    {views.filter(v => v.userid === 1).map(view => (
                      <li key={view.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{view.name}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            Vista di sistema (condivisa)
                          </span>
                        </div>
                        <div className="mt-3 sm:mt-0 flex items-center gap-2">
                            {isAdmin ? (
                              <button
                                onClick={() => handleDeleteView(view.id, view.name)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                title="Elimina vista di sistema"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-xs font-medium sm:hidden">Elimina</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic px-2">Non eliminabile</span>
                            )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
