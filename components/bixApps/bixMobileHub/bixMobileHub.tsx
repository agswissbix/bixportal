"use client";

import React, { useMemo, useContext, useState, useEffect } from "react";
import GenericComponent from "@/components/genericComponent";
import BixHub from "./bixHub";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE

export default function BixMobileHub() {
    return (
        <div className="overflow-y-auto overflow-x-hidden h-screen">
            <GenericComponent>{() => <BixHub />}</GenericComponent>
        </div>
    );
}
