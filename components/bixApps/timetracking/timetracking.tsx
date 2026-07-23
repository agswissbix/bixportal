"use client";

import React, { useMemo, useContext, useState, useEffect } from "react";
import GenericComponent from "@/components/genericComponent";
import TimetrackingList from "./timetrackingList";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
interface timetrackingProps {
    data?: { [key: string]: any } | null;
    reference?: string | null;
    comingFrom?: string | null;
}

export default function Timetracking({ data, reference, comingFrom }: timetrackingProps) {
    return (
        <div className="overflow-y-auto overflow-x-hidden h-screen">
            <GenericComponent>{() => <TimetrackingList data={data} reference={reference} comingFrom={comingFrom} />}</GenericComponent>
        </div>
    );
}
