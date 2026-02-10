"use client";
import React from 'react';
import LenovoIntakeComponent from "@/components/lenovo";
import { Toaster } from 'sonner';

export default function LenovoIntakePage() {
    return (
        <>
            <Toaster richColors position="bottom-right" />
            <LenovoIntakeComponent />
        </>
    );
}
