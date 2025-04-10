// src/store.ts
import { create } from 'zustand'

interface RecordsStore {
    refreshTable: number;
    setRefreshTable: (refreshTable: number) => void;

    cardsList: Array<{
        tableid: string,
        recordid: string,
        type: string,
        mastertableid?: string,
        masterrecordid?: string
    }>;
    addCard: (tableid: string, recordid: string, type: string, mastertableid?: string, masterrecordid?: string) => void;
    removeCard: (tableid: string, recordid: string) => void;
    resetCardsList: () => void;

    handleRowClick: (context: string, recordid: string, tableid: string,  mastertableid?: string, masterrecordid?: string) => Promise<void>; // Aggiungi quia

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

    tableid: string;
    setTableid: (tableid: string) => void;

    isPopupOpen: boolean;
    setIsPopupOpen: (isPopupOpen: boolean) => void;
}

export const useRecordsStore = create<RecordsStore>((set, get) => ({
    refreshTable: 0,
    setRefreshTable: (refreshTable: number) => {
        const { resetCardsList } = get(); // Ottieni la funzione resetCardsList
        resetCardsList(); // Resetta la lista delle carte
        set({ refreshTable });
    },    

    cardsList: [],
    addCard: (tableid: string, recordid: string, type: string, mastertableid?: string, masterrecordid?: string) => 
        set((state) => {
            const cardExists = state.cardsList.some(
                (card) => card.tableid === tableid && card.recordid === recordid && card.mastertableid === mastertableid && card.masterrecordid === masterrecordid
            );
            if (!cardExists) {
                return { cardsList: [...state.cardsList, { tableid, recordid, type, mastertableid, masterrecordid }] };
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

    handleRowClick: async (context: string, recordid: string, tableid: string, mastertableid?: string, masterrecordid?: string) => {
        const { resetCardsList, addCard } = get(); // Ottieni i metodi dallo stato
        const tableType = context

        if (tableType === 'standard') {
            // Rimuovi tutte le card dalla lista
            await resetCardsList();

            // Aggiungi la nuova card
            addCard(tableid, recordid, tableType);
        } else {
            addCard(tableid, recordid, tableType, mastertableid, masterrecordid);
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
    
    tableid: '',
    setTableid: (tableid: string) => {
        const { resetCardsList } = get(); // Ottieni la funzione resetCardsList
        resetCardsList(); // Resetta la lista delle carte
        set({ tableid });
    },

    isPopupOpen: false,
    setIsPopupOpen: (isPopupOpen: boolean) => set({ isPopupOpen: isPopupOpen }),

}));

