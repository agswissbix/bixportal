"use client"; // Indica che questo è un client component

import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import React, { use } from 'react';
import RecordHoursRing from '@/components/widgets/widgetHoursRing';
import recordSpeedometer from '@/components/widgets/widgetSpeedometer';
import recordBattery from '@/components/widgets/widgetBattery';
import recordHighlightCard from '@/components/widgets/widgetHighlightCard';
import widgetFastAdd from '@/components/widgets/widgetFastAdd';

// Mappa dei componenti disponibili (anche in sotto-cartelle)
const componentsMap: Record<string, React.ComponentType<any>> = {
    exampleComponent: dynamic(() => import('@/components/exampleComponent')),
    exampleComponentWithData: dynamic(() => import('@/components/exampleComponentWithData')),
    navbar: dynamic(() => import('@/components/navbar')),
    sidebar: dynamic(() => import('@/components/sidebar')),
    sidebarMenu: dynamic(() => import('@/components/sidebarMenu')),
    standardContent : dynamic(() => import('@/components/standardContent')),
    recordTabs : dynamic(() => import('@/components/recordTabs')),
    recordFilters : dynamic(() => import('@/components/quickFilters')),
    recordsTable : dynamic(() => import('@/components/recordsTable')),
    recordCard : dynamic(() => import('@/components/recordCard')),
    cardTabs : dynamic(() => import('@/components/cardTabs')),
    cardBadge : dynamic(() => import('@/components/cardBadge')),
    cardFields : dynamic(() => import('@/components/cardFields')),
    cardLinked : dynamic(() => import('@/components/cardLinked')),
    scheduleCalendar : dynamic(() => import('@/app/custom/ta/components/scheduleCalendar')),
    pitserviceLavanderie : dynamic(() => import('@/components/recordsPivot')),
    dashboard: dynamic(() => import('@/components/dashboard')),
    scanner: dynamic(() => import('@/components/scannerTest')),
    belotti: dynamic(() => import('@/components/belotti1')),
    planner: dynamic(() => import('@/components/planner')),
    timeline: dynamic(() => import('@/components/timeline')),
    trasferta: dynamic(() => import('@/components/trasferta')),
    activeMind: dynamic(() => import('@/components/activeMind/activeMind')),
    bixverify: dynamic(() => import('@/components/bixverify')),
    recordsKanban: dynamic(() => import('@/components/recordsKanban/page')),
    recordTimeline: dynamic(() => import('@/components/recordTimeline')),
    recordGantt: dynamic(() => import('@/components/recordGantt')),
    recordLog: dynamic(() => import('@/components/recordLog')),
    widgetHoursRing: dynamic(() => import('@/components/widgets/widgetHoursRing')),
    widgetSpeedometer: dynamic(() => import('@/components/widgets/widgetSpeedometer')),
    widgetBattery: dynamic(() => import('@/components/widgets/widgetBattery')),
    widgetHighlightCard: dynamic(() => import('@/components/widgets/widgetHighlightCard')),
    widgetFastAdd: dynamic(() => import('@/components/widgets/widgetFastAdd')),
};

export default function DynamicComponentPage({ params }: { params: Promise<{ componentName: string }> }) {
    const { componentName } = use(params); // Usa React.use() per sbloccare params

    // Trova il componente nella mappa
    const Component = componentsMap[componentName];

    if (!Component) {
        return notFound(); // Se il componente non esiste, mostra la pagina 404
    }

    return (
        <div>
            {/*<h1 className='text-red-600'>Componente: {componentName}</h1><br/><br/> */}
            <Component className="overflow-auto" /> {/* Renderizza il componente senza passare props */}
        </div>
    );
}
