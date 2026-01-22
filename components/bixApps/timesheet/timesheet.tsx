"use client";

import React, { useMemo, useContext, useState, useEffect } from "react";
import GenericComponent from "@/components/genericComponent";
import TimesheetRegistration from "./timesheetRegistration";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
interface TimesheetProps {
    recordid?: string | null;
}

export default function Timesheet({ recordid }: TimesheetProps) {
    return (
        <div className="overflow-y-auto overflow-x-hidden h-screen">
            <GenericComponent>{() => <TimesheetRegistration recordid={recordid} />}</GenericComponent>
        </div>
    );
}
