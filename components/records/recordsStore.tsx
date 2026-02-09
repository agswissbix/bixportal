// src/store.ts
import { toast } from 'sonner';
import { create } from 'zustand'

interface RecordsStore {
    refreshTable: number;
    setRefreshTable: (updater: (v: number) => number) => void;
    isTableChanging: boolean;
    setTableChangeCompleted: () => void;
    cardsList: Array<{
        tableid: string;
        recordid: string;
        type: string;
        mastertableid?: string;
        masterrecordid?: string;
        prefillData?: Record<string, any>;
        minimized?: boolean;
    }>;
    addCard: (
        tableid: string,
        recordid: string,
        type: string,
        mastertableid?: string,
        masterrecordid?: string,
        prefillData?: Record<string, any>
    ) => void;
    removeCard: (tableid: string, recordid: string) => void;
    toggleMinimizeCard: (tableid: string, recordid: string) => void;
    resetCardsList: () => void;

    handleRowClick: (
        context: string,
        recordid: string,
        tableid: string,
        mastertableid?: string,
        masterrecordid?: string,
        prefillData?: Record<string, any>
    ) => Promise<void>;

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
        direction: "asc" | "desc" | null;
    };
    setColumnOrder: (columnOrder: {
        columnDesc: string | null;
        direction: "asc" | "desc" | null;
    }) => void;

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
        value: string;
    }>;
    setFiltersList: (filtersList: RecordsStore["filtersList"]) => void;

    popUpType: string;
    setPopUpType: (popUpType: string) => void;

    popupRecordId: string;
    setPopupRecordId: (recordid: string) => void;

    infoData: {
        title?: string;
        message: string;
        type?: "info" | "success" | "warning";
    };
    setInfoData: (infoData: RecordsStore["infoData"]) => void;

    userid: string;
    setUserid: (userid: string) => void;

    theme: string;
    setTheme: (theme: string) => void;

    timestamp: number;
    setTimestamp: (timestamp: number) => void;

    popupResolver: ((data: any) => void) | null;
    setPopupResolver: (resolver: ((data: any) => void) | null) => void;

    openPopup: (type: string, recordid?: string) => Promise<any>;

    dashboardFilters: {
        selectedYears: string[];
        showTotalAverage: boolean;
        averageExcludeNoSharing: boolean;
        numericFilters: Array<{
            field: string;
            label: string;
            operator: ">=" | "<=";
            value: number;
        }>;
        demographicFilters: Array<{
            field: string;
            label: string;
            type: "number" | "select" | "toggle" | "distance";
            operator?: ">=" | "<="; // Solo per number e distance
            value: string | number | boolean;
            options?: (string | { label: string; value: string })[]; // Solo per select
        }>;
        selectedClubs: string[];
        subgroupBy: "year" | "club";
    };
    setDashboardFilters: (
        dashboardFilters: RecordsStore["dashboardFilters"]
    ) => void;

    tableSettings: Record<string, Record<string, Setting>>;
    setTableSettings: (
        tableid: string,
        tableSettings: Record<string, Setting>
    ) => void;
    getIsSettingAllowed: (
        tableid: string,
        settingName: string,
        recordid?: string
    ) => boolean;
}

interface Setting {
  type: string;
  value: string;
  valid_records?: string[];
  conditions?: string 
}

export const useRecordsStore = create<RecordsStore>((set, get) => ({
    popupResolver: null,
    setPopupResolver: (resolver: ((data: any) => void) | null) =>
        set({ popupResolver: resolver }),
    openPopup: (type: string, recordid?: string) => {
        return new Promise((resolve) => {
            set({
                popupResolver: resolve,
                popupRecordId: recordid ?? "",
                popUpType: type,
                isPopupOpen: true,
            });
        });
    },

    refreshTable: 0,
    setRefreshTable: (updater) =>
        set((state) => ({ refreshTable: updater(state.refreshTable) })),

    isTableChanging: false,
    setTableChangeCompleted: () => set({ isTableChanging: false }),

    cardsList: [],
    addCard: (
        tableid: string,
        recordid: string,
        type: string,
        mastertableid?: string,
        masterrecordid?: string,
        prefillData?: Record<string, any>
    ) =>
        set((state) => {
            const cardExists = state.cardsList.some(
                (card) =>
                    card.tableid === tableid &&
                    card.recordid === recordid &&
                    card.mastertableid === mastertableid &&
                    card.masterrecordid === masterrecordid
            );
            if (!cardExists) {
                return {
                    cardsList: [
                        ...state.cardsList,
                        {
                            tableid,
                            recordid,
                            type,
                            mastertableid,
                            masterrecordid,
                            prefillData,
                        },
                    ],
                };
            }
            return state;
        }),

    removeCard: (tableid: string, recordid: string) =>
        set((state) => ({
            cardsList: state.cardsList.filter(
                (card) => card.tableid !== tableid || card.recordid !== recordid
            ),
        })),

    toggleMinimizeCard: (tableid: string, recordid: string) =>
        set((state) => ({
            cardsList: state.cardsList.map((card) => {
                if (card.tableid === tableid && card.recordid === recordid) {
                    return { ...card, minimized: !card.minimized };
                }
                return card;
            }),
        })),

    resetCardsList: () =>
        set((state) => ({
            cardsList: state.cardsList.filter((card) => card.minimized),
        })),

    handleRowClick: async (
        context: string,
        recordid: string,
        tableid: string,
        mastertableid?: string,
        masterrecordid?: string,
        prefillData?: Record<string, any>
    ) => {
        const tableType = context;
        if (tableType === "standard") {
            set((state) => {
                // Keep only minimized cards from the current list (effectively resetting non-minimized ones)
                // But we also need to handle the NEW card we want to open.
                
                // 1. Find if the card we want to open is already in the list (minimized or not)
                const existingCardIndex = state.cardsList.findIndex(
                    (c) => c.tableid === tableid && c.recordid === recordid
                );

                if (existingCardIndex !== -1) {
                     // The card exists. 
                     // We want to keep all OTHER minimized cards, AND this card (ensuring it's visible).
                     // Since we represent "Reset" behavior, we typically clear other non-minimized cards.
                     // So: Result = (All Minimized Cards) + (This Card, forced visible)
                     // Deduplicated.
                     
                     const otherMinimized = state.cardsList.filter(c => c.minimized && (c.tableid !== tableid || c.recordid !== recordid));
                     const targetCard = { ...state.cardsList[existingCardIndex], minimized: false };
                     
                     return { cardsList: [...otherMinimized, targetCard] };
                } else {
                    // Card does not exist.
                    // Result = (All Minimized Cards) + (New Card)
                     const minimizedCards = state.cardsList.filter(c => c.minimized);
                     const newCard = {
                        tableid,
                        recordid,
                        type: tableType,
                        mastertableid,
                        masterrecordid,
                        prefillData
                     };
                     return { cardsList: [...minimizedCards, newCard] };
                }
            });
        } else {
            if (prefillData != null) {
                get().addCard(
                    tableid,
                    recordid,
                    tableType,
                    mastertableid,
                    masterrecordid,
                    prefillData
                );
            } else {
                get().addCard(
                    tableid,
                    recordid,
                    tableType,
                    mastertableid,
                    masterrecordid
                );
            }
        }
    },

    searchTerm: "",
    setSearchTerm: (searchTerm: string) => set({ searchTerm }),

    selectedMenu: "Dashboard",
    setSelectedMenu: (menuName: string) => {
        set({
            isTableChanging: true,
            selectedMenu: menuName,
            tableView: "",
        });
    },

    activeServer: "",
    setActiveServer: (activeServer: string) => set({ activeServer }),

    tableView: "",
    setTableView: (view) =>
        set((state) => ({
            tableView: view,
            refreshTable: state.refreshTable + 1,
        })),

    columnOrder: {
        columnDesc: null,
        direction: "asc",
    },
    setColumnOrder: (columnOrder) => set({ columnOrder }),

    currentPage: 1,
    setCurrentPage: (currentPage: number) => set({ currentPage }),

    pageLimit: 10,
    setPageLimit: (pageLimit: number) => set({ pageLimit }),

    tableid: "",
    setTableid: (tableid: string) =>
        set({
            tableid,
            cardsList: [], // reset diretto, senza doppio set
        }),

    isPopupOpen: false,
    setIsPopupOpen: (isPopupOpen: boolean) => set({ isPopupOpen }),

    isFiltersOpen: false,
    setIsFiltersOpen: (isFiltersOpen: boolean) => set({ isFiltersOpen }),

    infoData: { title: "", message: "", type: "info" },
    setInfoData: (infoData) => set({ infoData }),

    filtersList: [],
    setFiltersList: (filtersList) => {
        set({ filtersList });
        get().setRefreshTable((v) => v + 1);
    },

    popUpType: "",
    setPopUpType: (popUpType: string) => set({ popUpType }),

    popupRecordId: "",
    setPopupRecordId: (recordid: string) => set({ popupRecordId: recordid }),

    userid: "",
    setUserid: (userid: string) => set({ userid }),

    theme: "default",
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
        subgroupBy: "club",
    },
    setDashboardFilters: (dashboardFilters: RecordsStore["dashboardFilters"]) =>
        set({ dashboardFilters }),

    tableSettings: {},
    setTableSettings: (tableid, tableSettings) => {
        set((state) => ({
            tableSettings: {
                ...state.tableSettings,
                [tableid]: tableSettings,
            },
        }));
    },

    getIsSettingAllowed: (tableid, settingName, recordid) => {
        const table = get().tableSettings[tableid];
        if (!table) return false;

        const setting = table[settingName];
        if (!setting) return false;

        const value = setting.value === "true";
        const validRecords = setting.valid_records ?? [];
        const hasConditions = Boolean(setting.conditions ?? false);

        if (!hasConditions) return value;
        if (!recordid) return value;

        const match = validRecords.includes(String(recordid));
        return match ? value : !value;
    },
}));
