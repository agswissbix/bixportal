"use client";
import React, { Suspense } from 'react';
import LenovoIntakeComponent from "@/components/bixApps/lenovo";
// We need useSearchParams to be wrapped in Suspense
import { useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';

function LenovoIntakeContent() {
    const searchParams = useSearchParams();
    const recordid = searchParams.get('recordid') || undefined;
    return <LenovoIntakeComponent initialRecordId={recordid} />;
}

export default function LenovoIntakePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <Toaster richColors position="bottom-right" />
            <LenovoIntakeComponent />
        </Suspense>
    );
}
