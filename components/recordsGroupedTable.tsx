"use client";

import { useMemo, useState, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "./genericComponent";
import { useRecordsStore } from "./records/recordsStore";
import RecordsTable from "./recordsTable";
import { Layers, ChevronDown, ChevronRight } from "lucide-react";
import React from "react";

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

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const { response: resDim, loading: loadingDim } = useApi<any>({
        apiRoute: "get_available_groups_for_table",
        tableid,
    });

    useEffect(() => {
        if (resDim?.groups?.length > 0 && !selectedDimension) {
            setSelectedDimension(resDim.groups[0]);
        }
    }, [resDim, selectedDimension]);

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

    const formatNumber = (val: any) => {
        const num = parseFloat(val);
        if (isNaN(num)) return "0";
        return new Intl.NumberFormat("it-IT").format(num);
    };

    return (
        <GenericComponent
            response={resDim}
            loading={loadingDim}
            title="recordsGroupedTable">
            {() => (
                <div className="flex flex-col h-full max-h-screen">
                    <div className="sticky top-0 z-30 p-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50">
                        <div className="max-w-7xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3.5 pr-6 border-r border-gray-100 dark:border-gray-800">
                                    <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]">
                                        <Layers className="w-5 h-5 text-primary opacity-90" />
                                    </div>

                                    <div className="flex flex-col justify-center leading-tight">
                                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                            Raggruppa
                                        </span>
                                        <span className="text-[14px] font-black text-primary uppercase tracking-tight">
                                            Campo
                                        </span>
                                    </div>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setIsMenuOpen(!isMenuOpen)
                                        }
                                        className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-primary/50 transition-all active:scale-95">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                            {selectedDimension?.label ||
                                                "Seleziona dimensione"}
                                        </span>
                                        <ChevronDown
                                            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                                                isMenuOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>

                                    {isMenuOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() =>
                                                    setIsMenuOpen(false)
                                                }
                                            />

                                            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {resDim?.groups?.map(
                                                        (dim: any) => (
                                                            <button
                                                                key={dim.value}
                                                                onClick={() => {
                                                                    setSelectedDimension(
                                                                        dim
                                                                    );
                                                                    setIsMenuOpen(
                                                                        false
                                                                    );
                                                                }}
                                                                className={`
                                                                    w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                                                                    ${
                                                                        selectedDimension?.value ===
                                                                        dim.value
                                                                            ? "bg-primary/10 text-primary"
                                                                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                                                    }
                                                                `}>
                                                                {dim.label}
                                                                {selectedDimension?.value ===
                                                                    dim.value && (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                )}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-800">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                    {resInst?.groups?.length || 0} Tabelle
                                    caricate
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="max-w-7xl mx-auto flex flex-col gap-3">
                            {loadingInst ? (
                                <div className="flex justify-center p-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : resInst?.groups?.length > 0 ? (
                                resInst.groups.map(
                                    (group: any, idx: number) => {
                                        const isExpanded =
                                            !!expandedGroups[group.value];
                                        return (
                                            <div
                                                key={idx}
                                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                                                <div
                                                    className="flex flex-col md:flex-row md:items-center p-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                                                    onClick={() =>
                                                        toggleGroup(group.value)
                                                    }>
                                                    <div className="flex items-center gap-4 flex-1 min-w-0 mb-4 md:mb-0">
                                                        <div
                                                            className={`shrink-0 p-2 rounded-xl transition-colors ${
                                                                isExpanded
                                                                    ? "bg-primary text-white"
                                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                                            }`}>
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span
                                                                className={`text-[15px] font-bold leading-tight truncate ${
                                                                    isExpanded
                                                                        ? "text-primary"
                                                                        : "text-gray-800 dark:text-gray-100"
                                                                }`}
                                                                title={
                                                                    group.label
                                                                }>
                                                                {group.label}
                                                            </span>
                                                            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">
                                                                {group.count}{" "}
                                                                Record
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 shrink-0 md:ml-12 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                                                        {resInst.numeric_columns?.map(
                                                            (col: any) => (
                                                                <div
                                                                    key={col.id}
                                                                    className="flex flex-col items-start md:items-end min-w-[100px]">
                                                                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-tight mb-0.5 whitespace-nowrap">
                                                                        {
                                                                            col.desc
                                                                        }
                                                                    </span>
                                                                    <span className="text-[13px] font-black text-gray-700 dark:text-gray-200 tabular-nums">
                                                                        {formatNumber(
                                                                            group
                                                                                .totals?.[
                                                                                col
                                                                                    .id
                                                                            ] ??
                                                                                0
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <RecordsTable
                                                            tableid={tableid}
                                                            searchTerm={
                                                                searchTerm
                                                            }
                                                            view={view}
                                                            order={order}
                                                            filtersList={[
                                                                ...filtersList,
                                                                {
                                                                    fieldid:
                                                                        selectedDimension.value,
                                                                    type: group.type,
                                                                    value: group.value,
                                                                    conditions:
                                                                        [],
                                                                },
                                                            ]}
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
                                    }
                                )
                            ) : (
                                <div className="p-20 text-center text-gray-400 italic">
                                    Nessun dato presente.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </GenericComponent>
    );
}
