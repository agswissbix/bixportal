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

    handleRowClick: (context: string, recordid: string, tableid: string,  mastertableid?: string, masterrecordid?: string) => Promise<void>;

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
    setFiltersList: (filtersList: RecordsStore['filtersList']) => void;

    popUpType: string;
    setPopUpType: (popUpType: string) => void;

    popupRecordId: string;
    setPopupRecordId: (recordid: string) => void;

    userid: string;
    setUserid: (userid: string) => void;

    theme: string;
    setTheme: (theme: string) => void;

    timestamp: number;
    setTimestamp: (timestamp: number) => void;

    openSignatureDialog: boolean;
    setOpenSignatureDialog: (open: boolean) => void;

    dashboardFilters: {
    selectedYears: string[]
    showTotalAverage: boolean
    averageExcludeNoSharing: boolean
    numericFilters: Array<{
      field: string
      label: string
      operator: ">=" | "<="
      value: number
    }>
    demographicFilters: Array<{
        field: string
        label: string
        type: "number" | "select" | "toggle" | "distance"
        operator?: ">=" | "<=" // Solo per number e distance
        value: string | number | boolean
        options?: string[] // Solo per select
    }>
    selectedClubs: string[]
  }
  setDashboardFilters: (dashboardFilters: RecordsStore["dashboardFilters"]) => void;
}

export const useRecordsStore = create<RecordsStore>((set, get) => ({
    openSignatureDialog: false,
    setOpenSignatureDialog: (open: boolean) => set({ openSignatureDialog: open }),
    
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
        const tableType = context;
        if (tableType === 'standard') {
            // reset + aggiunta nello stesso set
            set({ cardsList: [{ tableid, recordid, type: tableType }] });
        } else {
            get().addCard(tableid, recordid, tableType, mastertableid, masterrecordid);
        }
    },

    searchTerm: '',
    setSearchTerm: (searchTerm: string) => set({ searchTerm }),

    selectedMenu: 'Dashboard',
    setSelectedMenu: (menuName: string) => {
        set({
            isTableChanging: true,
            selectedMenu: menuName,
            tableView: '', 
        });
    },

    activeServer: '',
    setActiveServer: (activeServer: string) => set({ activeServer }),

    tableView: '',
    setTableView: (view) =>
        set(state => ({
            tableView: view,
            refreshTable: state.refreshTable + 1
        })),

    columnOrder: {
        columnDesc: null,
        direction: "asc"
    },
    setColumnOrder: (columnOrder) => set({ columnOrder }),

    currentPage: 1,
    setCurrentPage: (currentPage: number) => set({ currentPage }),

    pageLimit: 10,
    setPageLimit: (pageLimit: number) => set({ pageLimit }),
    
    tableid: '',
    setTableid: (tableid: string) =>
        set({
            tableid,
            cardsList: [] // reset diretto, senza doppio set
        }),

    isPopupOpen: false,
    setIsPopupOpen: (isPopupOpen: boolean) => set({ isPopupOpen }),

    isFiltersOpen: false,
    setIsFiltersOpen: (isFiltersOpen: boolean) => set({ isFiltersOpen }),

    filtersList: [],
    setFiltersList: (filtersList) => {
        set({ filtersList });
        get().setRefreshTable(v => v + 1);
    },

    popUpType: '',
    setPopUpType: (popUpType: string) => set({ popUpType }),

    popupRecordId: '',
    setPopupRecordId: (recordid: string) => set({ popupRecordId: recordid }),

    userid: '',
    setUserid: (userid: string) => set({ userid }),

    theme: 'default',
    setTheme: (theme: string) => set({ theme }),

    timestamp: Date.now(),
    setTimestamp: (timestamp: number) => set({ timestamp }),

    dashboardFilters: {
    selectedYears: ["2022", "2023", "2024"],
    showTotalAverage: true,
    averageExcludeNoSharing: false,
    numericFilters: [],
    demographicFilters: [],
    selectedClubs: [],
  },
  setDashboardFilters: (dashboardFilters: RecordsStore["dashboardFilters"]) =>
    set({ dashboardFilters }),
}));
