// 📄 UserTableViews.tsx
import React, { useState, useEffect, useContext } from 'react';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';
import { Trash2, GripVertical } from 'lucide-react'; // Aggiunto GripVertical
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
  order_ascdesc?: number; // Campo opzionale per l'ordinamento
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

  // --- Logica Drag and Drop ---
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Opzionale: aggiunge trasparenza durante il trascinamento
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const onDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedItemIndex(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessario per permettere il drop
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number, isSystemView: boolean) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

    // Determiniamo i due blocchi di liste separatamente per evitare di mischiare 
    // viste personali e di sistema durante il drop se non desiderato
    const currentViews = [...views];
    const filteredViews = isSystemView 
        ? currentViews.filter(v => v.userid === 1) 
        : currentViews.filter(v => v.userid !== 1);
    
    const otherViews = isSystemView 
        ? currentViews.filter(v => v.userid !== 1) 
        : currentViews.filter(v => v.userid === 1);

    // Riordinamento dell'array filtrato
    const draggedItem = filteredViews[draggedItemIndex];
    const remainingItems = filteredViews.filter((_, idx) => idx !== draggedItemIndex);
    const reorderedFiltered = [
      ...remainingItems.slice(0, targetIndex),
      draggedItem,
      ...remainingItems.slice(targetIndex)
    ];

    // Riuniamo e aggiorniamo gli indici order_ascdesc (1-based)
    const finalViews = [...reorderedFiltered, ...otherViews].map((view, index) => ({
        ...view,
        order_ascdesc: index + 1
    }));

    // Aggiornamento ottimistico
    setViews(finalViews);

    // Chiamata API
    try {
      const response = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'reorder_table_views',
        orders: reorderedFiltered.map((v, i) => ({ id: v.id, order: i + 1 }))
      });
      if (!response.data.success) {
        throw new Error();
      }
      setRefreshViewsList();
    } catch (error) {
      toast.error("Errore nel salvataggio dell'ordine");
      fetchViews(selectedTableId); // Rollback
    }
  };
  // --- Fine Logica Drag and Drop ---

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
          setRefreshViewsList();
      } else {
          toast.error(delResponse.data.detail || "Errore durante l'eliminazione");
      }
    } catch (err) {
      toast.error("Errore di rete");
    }
  }

  // Helper per renderizzare l'item della lista
  const renderViewItem = (view: View, index: number, isSystem: boolean) => {
    const canDrag = !isSystem || isAdmin;

    return (
      <li 
        key={view.id} 
        draggable={canDrag}
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={(e) => handleDrop(e, index, isSystem)}
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl shadow-sm hover:shadow-md transition-all border 
          ${isSystem ? 'bg-white border-gray-200' : 'bg-blue-50/50 border-blue-100'} 
          ${canDrag ? 'cursor-default' : ''}`}
      >
        <div className="flex items-center gap-3">
          {canDrag && (
            <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
              <GripVertical className="w-5 h-5" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{view.name}</span>
            <span className="text-xs text-gray-500 mt-1">
              {isSystem ? 'Vista di sistema (condivisa)' : 'Vista personale'}
            </span>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-0 flex items-center gap-2">
            {(!isSystem || isAdmin) ? (
              <button
                onClick={() => handleDeleteView(view.id, view.name)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                title="Elimina vista"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs font-medium sm:hidden">Elimina</span>
              </button>
            ) : (
              <span className="text-xs text-gray-400 italic px-2">Non eliminabile</span>
            )}
        </div>
      </li>
    );
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl max-w-2xl mx-auto my-10 border border-gray-100">
      <p className="text-sm text-gray-600 mb-6 font-medium">
        Seleziona una tabella per gestire e ordinare le tue viste personalizzate.
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
              {/* Sezione Viste Personali */}
              {views.some(v => v.userid !== 1) && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Le tue Viste</h5>
                  <ul className="space-y-3">
                    {views.filter(v => v.userid !== 1).map((view, index) => renderViewItem(view, index, false))}
                  </ul>
                </div>
              )}

              {/* Sezione Viste di Sistema */}
              {views.some(v => v.userid === 1) && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Viste di Sistema</h5>
                  <ul className="space-y-3">
                    {views.filter(v => v.userid === 1).map((view, index) => renderViewItem(view, index, true))}
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