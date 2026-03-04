"use client";
import React, { use } from 'react';
import LenovoIntakeComponent from "@/components/bixApps/lenovo";
import { Toaster } from "sonner";
import { Suspense } from 'react';
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=lenovo-intake",
  title: "Lenovo Intake - BixData",
};

export default function LenovoIntakeEditPage({ params }: { params: Promise<{ recordid: string }> }) {
    const resolvedParams = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <Toaster richColors position="bottom-right" />
            <LenovoIntakeComponent initialRecordId={resolvedParams.recordid} />
        </Suspense>
    );
}
