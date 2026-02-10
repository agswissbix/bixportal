"use client";

import React, { use } from 'react'; // Importa 'use'
import MobilePhotoView from "@/components/lenovo/MobilePhotoView";

export default function LenovoMobilePage({ params }: { params: Promise<{ ticketId: string }> }) {
    // Utilizziamo React.use() per attendere la risoluzione della Promise params
    const resolvedParams = use(params);
    const ticketId = resolvedParams.ticketId;

    return <MobilePhotoView ticketId={ticketId} />;
}