// src/store.ts
import { create } from 'zustand'

interface RecordsStore {
    refreshTable: number;
    setRefreshTable: (updater: (v: number) => number) => void;
    isTableChanging: boolean;
    setTableChangeCompleted: () => void;
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
    setTableView: (view: string) => void;

    columnOrder: {
        columnDesc: string | null;
        direction: 'asc' | 'desc' | null;
    }
    setColumnOrder: (columnOrder: { columnDesc: string | null; direction: 'asc' | 'desc' | null }) => void;

    currentPage: number;
    setCurrentPage: (currentPage: number) => void;

    pageLimit: number;
    setPageLimit: (pageLimit: number) => void;

    tableid: string;
    setTableid: (tableid: string) => void;

    isPopupOpen: boolean;
    setIsPopupOpen: (isPopupOpen: boolean) => void;

    isFiltersOpen: boolean;
    setIsFiltersOpen: (isFiltersOpen: boolean) => void;

    filtersList: Array<{
        fieldid: string;
        type: string;
        label: string;
        value: string 
    }>;
    setFiltersList: (filtersList: Array<{
        fieldid: string;
        type: string;
        label: string;
        value: string
    }>) => void;

    popUpType: string;
    setPopUpType: (popUpType: string) => void;

    popupRecordId: string;
    setPopupRecordId: (recordid: string) => void;
}

export const useRecordsStore = create<RecordsStore>((set, get) => ({
    refreshTable: 0,
    setRefreshTable: (updater) =>
    set(state => ({ refreshTable: updater(state.refreshTable) })),
    isTableChanging: false,
    setTableChangeCompleted: () => set({ isTableChanging: false }),
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
    setSelectedMenu: (menuName: string) => {
        set({
            isTableChanging: true, // ★ 4. IMPOSTA SU TRUE QUANDO INIZIA IL CAMBIO
            selectedMenu: menuName,
            tableView: '', // Resettare la view è ancora fondamentale
            // ... resetta altri stati se necessario (searchTerm, currentPage, etc.)
        });
    },

    activeServer: '',
    setActiveServer: (activeServer: string) => set({ activeServer }),

    tableView: '',
    setTableView: (view) =>
    set(state => ({
      tableView: view,
      refreshTable: state.refreshTable + 1   // ⚡ auto-refresh
    })),

    columnOrder: {
      columnDesc: null,
      direction: "asc"
    },
    setColumnOrder: (columnOrder: { columnDesc: string | null; direction: 'asc' | 'desc' | null }) => set({ columnOrder }),

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

    isFiltersOpen: false,
    setIsFiltersOpen: (isFiltersOpen: boolean) => set({ isFiltersOpen: isFiltersOpen}),

    filtersList: [],
    setFiltersList: (filtersList: Array<{
        fieldid: string;
        type: string;
        label: string;
        value: string
    }>) => set({ filtersList }),

    popUpType: '',
    setPopUpType: (popUpType: string) => set({ popUpType: popUpType }),

    popupRecordId: '',
    setPopupRecordId: (recordid: string) => set({ popupRecordId: recordid })

}));

