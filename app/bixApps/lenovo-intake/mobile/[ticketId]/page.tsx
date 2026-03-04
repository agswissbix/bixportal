import React, { use } from 'react'; // Importa 'use'
import MobilePhotoView from "@/components/bixApps/lenovo/MobilePhotoView";
import { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/api/manifest?app=lenovo-intake",
  title: "Lenovo Intake - BixData",
};

export default function LenovoMobilePage({ params }: { params: Promise<{ ticketId: string }> }) {
    // Utilizziamo React.use() per attendere la risoluzione della Promise params
    const resolvedParams = use(params);
    const ticketId = resolvedParams.ticketId;

    return <MobilePhotoView ticketId={ticketId} />;
}