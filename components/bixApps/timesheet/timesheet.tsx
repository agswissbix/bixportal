"use client";

import React, { useMemo, useContext, useState, useEffect } from "react";
import GenericComponent from "@/components/genericComponent";
import TimesheetRegistration from "./timesheetRegistration";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE

export default function Timesheet() {
    return (
        <div className="overflow-y-auto overflow-x-hidden h-screen">
            <GenericComponent>{() => <TimesheetRegistration />}</GenericComponent>
        </div>
    );
}
