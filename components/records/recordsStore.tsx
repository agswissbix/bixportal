// src/store.ts
import { create } from 'zustand'

interface RecordsStore {
    refreshTable: number;
    setRefreshTable: (refreshTable: number) => void;

    cardsList: Array<{
        tableid: string,
        recordid: string,
        type: string,
    }>;
    addCard: (tableid: string, recordid: string, type: string) => void;
    removeCard: (tableid: string, recordid: string) => void;
    resetCardsList: () => void;

    handleRowClick: (recordid: string, tableid: string, context: string) => Promise<void>; // Aggiungi quia

    searchTerm: string;
    setSearchTerm: (searchTerm: string) => void;
    
    selectedMenu: string;
    setSelectedMenu: (menuName: string) => void;

    activeServer: string;
    setActiveServer: (activeServer: string) => void;

    tableView: string;
    setTableView: (tableView: string) => void;

    columnOrder: string[];
    setColumnOrder: (column_order: string[]) => void;

    currentPage: number;
    setCurrentPage: (currentPage: number) => void;

    pageLimit: number;
    setPageLimit: (pageLimit: number) => void;
}

export const useRecordsStore = create<RecordsStore>((set, get) => ({
    refreshTable: 0,
    setRefreshTable: (refreshTable: number) => set({ refreshTable }),

    cardsList: [],
    addCard: (tableid: string, recordid: string, type: string) => 
        set((state) => {
            const cardExists = state.cardsList.some(
                (card) => card.tableid === tableid && card.recordid === recordid
            );
            if (!cardExists) {
                return { cardsList: [...state.cardsList, { tableid, recordid, type }] };
            }
            return state;
        }),
    removeCard: (tableid: string, recordid: string) => 
        set((state) => ({ 
            cardsList: state.cardsList.filter(
                (card) => card.tableid !== tableid || card.recordid !== recordid
            ) 
        })),
    resetCardsList: () => set({ cardsList: [] }),

    handleRowClick: async (recordid: string, tableid: string, context: string) => {
        const { resetCardsList, addCard } = get(); // Ottieni i metodi dallo stato
        const tableType = context

        if (tableType === 'standard') {
            // Rimuovi tutte le card dalla lista
            await resetCardsList();

            // Aggiungi la nuova card
            addCard(tableid, recordid, tableType);
        } else {
            // Rimuovi la card selezionata
            addCard(tableid, recordid, tableType);
        }
    },

    searchTerm: '',
    setSearchTerm: (searchTerm: string) => set({ searchTerm }),

    selectedMenu: 'Dashboard',
    setSelectedMenu: (menuName: string) => set({ selectedMenu: menuName }),

    activeServer: '',
    setActiveServer: (activeServer: string) => set({ activeServer }),

    tableView: '',
    setTableView: (tableView: string) => set({ tableView }),

    columnOrder: [],
    setColumnOrder: (columnOrder: string[]) => set({ columnOrder }),

    currentPage: 1,
    setCurrentPage: (currentPage: number) => set({ currentPage }),

    pageLimit: 10,
    setPageLimit: (pageLimit: number) => set({ pageLimit }),
    

}));

