"use client";

import { useMemo, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "./genericComponent";
import { useRecordsStore } from "./records/recordsStore";
import RecordsTable from "./recordsTable";
import { Layers, ChevronDown, ChevronRight, ListFilter } from "lucide-react";

export default function RecordsGroupedTable({
    tableid,
    searchTerm,
    view,
    order,
    filtersList = [],
    masterTableid,
    masterRecordid,
    limit = 100,
}: any) {
    const { refreshTable } = useRecordsStore();
    const [selectedDimension, setSelectedDimension] = useState<any>(null);
    const [expandedGroups, setExpandedGroups] = useState<
        Record<string, boolean>
    >({});

    // 1. Carica le COLONNE per il raggruppamento (Dimensioni)
    const { response: resDim, loading: loadingDim } = useApi<any>({
        apiRoute: "get_available_groups_for_table",
        tableid,
    });

    useEffect(() => {
        if (resDim?.groups?.length > 0 && !selectedDimension) {
            setSelectedDimension(resDim.groups[0]);
        }
    }, [resDim, selectedDimension]);

    // 2. Carica le ISTANZE (Mesi, Venditori, etc.)
    const payloadInstances = useMemo(() => {
        if (!selectedDimension) return null;
        return {
            apiRoute: "get_grouped_table_records",
            tableid,
            fieldid: selectedDimension.value,
            type: selectedDimension.type,
            searchTerm,
            view,
            filtersList,
            masterTableid,
            masterRecordid,
            _refreshTick: refreshTable,
        };
    }, [
        tableid,
        selectedDimension,
        searchTerm,
        view,
        filtersList,
        refreshTable,
    ]);

    const { response: resInst, loading: loadingInst } =
        useApi<any>(payloadInstances);

    useEffect(() => {
        setExpandedGroups({});
    }, [selectedDimension]);

    const toggleGroup = (val: string) => {
        setExpandedGroups((prev) => ({ ...prev, [val]: !prev[val] }));
    };

    return (
        <GenericComponent
            response={resDim}
            loading={loadingDim}
            title="recordsGroupedTable">
            {() => (
                <div className="flex flex-col gap-6">
                    {/* TOOLBAR PULSANTI (Come screenshot) */}
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border rounded-xl shadow-sm overflow-x-auto">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm whitespace-nowrap">
                            <Layers className="w-4 h-4" /> Raggruppa per:
                        </div>
                        <div className="flex gap-2">
                            {resDim?.groups?.map((dim: any) => (
                                <button
                                    key={dim.value}
                                    onClick={() => setSelectedDimension(dim)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                        selectedDimension?.value === dim.value
                                            ? "bg-primary text-white border-primary shadow-sm"
                                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                    }`}>
                                    {dim.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* LISTA TABELLE RAGGRUPPATE */}
                    <div className="flex flex-col gap-2">
                        {loadingInst ? (
                            <div className="flex justify-center p-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : resInst?.groups?.length > 0 ? (
                            resInst.groups.map((group: any, idx: number) => {
                                const isExpanded =
                                    !!expandedGroups[group.value];
                                const groupFilters = [
                                    ...filtersList,
                                    {
                                        fieldid: selectedDimension.value,
                                        type: group.type,
                                        label: group.label,
                                        value: group.value,
                                    },
                                ];

                                return (
                                    <div
                                        key={`${selectedDimension.value}-${idx}`}
                                        className="border-b border-gray-100 dark:border-gray-800">
                                        <div
                                            className="flex items-center gap-4 py-3 px-2 cursor-pointer group hover:bg-gray-50/50"
                                            onClick={() =>
                                                toggleGroup(group.value)
                                            }>
                                            <div className="p-1 rounded bg-gray-100 dark:bg-gray-800">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <span
                                                className={`text-sm font-bold tracking-tight ${
                                                    isExpanded
                                                        ? "text-primary"
                                                        : "text-gray-700"
                                                }`}>
                                                {group.label}
                                            </span>
                                        </div>

                                        {isExpanded && (
                                            <div className="pb-6 px-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <RecordsTable
                                                    tableid={tableid}
                                                    searchTerm={searchTerm}
                                                    view={view}
                                                    order={order}
                                                    filtersList={groupFilters}
                                                    masterTableid={
                                                        masterTableid
                                                    }
                                                    masterRecordid={
                                                        masterRecordid
                                                    }
                                                    limit={limit}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-20 text-center text-gray-400 italic">
                                Nessun dato presente.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </GenericComponent>
    );
}
