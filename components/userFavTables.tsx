// 📄 UserFavTables.jsx
import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';
import axios from 'axios';

// Importa le icone da lucide-react
import { Search, X, Star } from 'lucide-react';

interface PropsInterface {
  propExampleValue?: string;
}

interface Table {
  itemcode: string;
  itemdesc: string;
  favorite: boolean;
}

interface ResponseInterface {
  tables: Table[];
}

const isDev = false;
const responseDataDEV: ResponseInterface = {
  tables: [
    { itemcode: '1', itemdesc: 'Vendite Settimanali', favorite: true },
    { itemcode: '2', itemdesc: 'Statistiche Mensili', favorite: false },
    { itemcode: '3', itemdesc: 'Fatturato Anno Precedente', favorite: true },
    { itemcode: '4', itemdesc: 'Ordini in Arrivo', favorite: false },
    { itemcode: '5', itemdesc: 'Report Finanziario Q1', favorite: false },
    { itemcode: '6', itemdesc: 'Dashboard HR', favorite: false },
    { itemcode: '7', itemdesc: 'Analisi Marketing', favorite: false },
  ],
};

export default function UserFavTables({ propExampleValue }: PropsInterface) {
  const { user } = useContext(AppContext);
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : { tables: [] });
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1); // Stato per l'indice evidenziato

  useEffect(() => {
    if (responseData) {
      const initialFavs = responseData.tables.filter(t => t.favorite).map(t => t.itemcode);
      setSelectedFavorites(initialFavs);
    }
  }, [responseData]);

  const saveFavTables = async () => {
    try {
      console.info('Salvataggio preferite in corso...', selectedFavorites)
      const response = await axiosInstanceClient.post("/postApi", {
        apiRoute: "save_favorite_tables",
        tables: selectedFavorites,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.success('Preferenze salvate con successo');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error("Errore nel salvataggio: " + error.response?.data?.message);
      } else {
        toast.error("Errore generico nel salvataggio");
      }
    }
  };

  const addFavorite = (tableCode: string) => {
    if (!selectedFavorites.includes(tableCode)) {
      setSelectedFavorites([...selectedFavorites, tableCode]);
    }
    setSearchTerm('');
    setHighlightedIndex(-1); // Resetta l'indice evidenziato
  };

  const removeFavorite = (tableCode: string) => {
    setSelectedFavorites(selectedFavorites.filter(code => code !== tableCode));
  };

  const filteredTables = responseData.tables.filter(table =>
    table.itemdesc.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedFavorites.includes(table.itemcode)
  );

  const selectedTableObjects = selectedFavorites
    .map(code => responseData.tables.find(t => t.itemcode === code))
    .filter(Boolean) as Table[];

  const payload = useMemo(() => {
    if (isDev) return null;
    return { apiRoute: 'get_favorite_tables', userid: user };
  }, [propExampleValue, user]);

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response) {
      setResponseData(response);
      setSelectedFavorites(response.tables.filter(table => table.favorite).map(table => table.itemcode));
    }
  }, [response]);

  // Funzione per gestire i tasti
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && highlightedIndex >= 0 && filteredTables[highlightedIndex]) {
      addFavorite(filteredTables[highlightedIndex].itemcode);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prevIndex =>
        Math.min(prevIndex + 1, filteredTables.length - 1)
      );
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prevIndex => Math.max(prevIndex - 1, 0));
    }
  };

  // Funzione per mostrare la lista al focus
  const handleInputFocus = () => {
    if (!searchTerm) {
      setSearchTerm(''); // Mantiene la lista visibile se non c'è testo
    }
    setHighlightedIndex(0); // Evidenzia il primo elemento
  };

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <div className=" p-6 bg-white rounded-2xl shadow-xl max-w-2xl mx-auto my-10">
          <p className="text-sm text-gray-600 mb-4">
            Seleziona le tabelle che usi più di frequente per un accesso rapido dal menu principale.
          </p>

          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-2">Le tue tabelle preferite ({selectedFavorites.length})</h4>
            <div className="flex flex-wrap gap-2 min-h-[40px] border border-gray-200 rounded-md p-2 bg-white">
              {selectedTableObjects.length > 0 ? (
                selectedTableObjects.map(table => (
                  <div
                    key={table.itemcode}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium shadow-sm"
                  >
                    <span>{table.itemdesc}</span>
                    <button
                      onClick={() => removeFavorite(table.itemcode)}
                      className="text-blue-500 hover:text-blue-700 p-1 -mr-2"
                      title="Rimuovi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-gray-400 text-sm italic">Nessuna tabella preferita selezionata.</span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-2">Aggiungi nuove tabelle</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca una tabella da aggiungere..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown} // Gestisci i tasti
                onFocus={handleInputFocus} // Mostra la lista al focus
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="w-5 h-5" />
              </div>
            </div>

            {filteredTables.length > 0 && (
              <ul className="mt-2 border border-gray-200 rounded-md bg-white max-h-48 overflow-y-auto shadow-lg">
                {filteredTables.map((table, index) => (
                  <li
                    key={table.itemcode}
                    className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 cursor-pointer 
                    ${index === highlightedIndex ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-blue-50'}`}
                    onClick={() => addFavorite(table.itemcode)}
                  >
                    <span className="text-sm font-medium text-gray-700">{table.itemdesc}</span>
                    <span className="text-blue-400">
                      <Star className="w-5 h-5" />
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {searchTerm && filteredTables.length === 0 && (
              <div className="mt-2 p-3 text-sm text-gray-500 italic">Nessun risultato trovato.</div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveFavTables}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-bold text-white transition-colors duration-200 ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Salvataggio...' : 'Salva preferenze'}
            </button>
          </div>
        </div>
      )}
    </GenericComponent>
  );
}