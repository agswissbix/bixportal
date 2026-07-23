"use client";

import { ArrowRightIcon } from "@heroicons/react/24/outline";

interface GoButtonProps {
    goingTo: string;
    data?: { [key: string]: any } | null;
    reference?: string | null;
    // Classi EXTRA (posizione/dimensione) aggiunte a quelle di base.
    className?: string;
}

// Etichette più leggibili per il bottone "Vai ..." (default: "a <nome>").
const GO_LABELS: Record<string, string> = {
    company: "all'azienda",
    contact: "al contatto",
    task: "alla task",
    timesheet: "al timesheet",
    timetracking: "al timetracking",
};

// Stile/colore FISSI (uguali ovunque). Con 'className' si AGGIUNGONO classi (es. posizione).
const BASE_CLASSES =
    "px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold " +
    "transition-all active:scale-95 flex items-center gap-2";

export default function GoButton({ goingTo, data, reference, className }: GoButtonProps) {
    return (
        <button
            type="button"
            onClick={() => {
                // Ricava dinamicamente il nome della bixApp dal path (.../bixApps/<app>/...)
                const segments = window.location.pathname.split("/").filter(Boolean);
                const bixIdx = segments.indexOf("bixApps");
                const comingFrom = bixIdx !== -1 ? (segments[bixIdx + 1] ?? "company") : "company";

                // Formato: /bixApps/<goingTo>?comingFrom=<...>[&reference=<...>&data=<json>]
                let link = `/bixApps/${encodeURIComponent(goingTo)}?comingFrom=${encodeURIComponent(comingFrom)}`;

                if (data && reference) {
                    // Le chiavi con valore null/undefined non devono finire nell'URL
                    // (es. un contatto senza azienda -> niente "companyRecordId": null).
                    const cleanData = Object.fromEntries(
                        Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
                    );

                    // Se non resta nessun valore, reference e data non servono.
                    if (Object.keys(cleanData).length > 0) {
                        link += `&reference=${encodeURIComponent(reference)}&data=${encodeURIComponent(JSON.stringify(cleanData))}`;
                    }
                }

                window.location.href = link;
            }}
            className={`${BASE_CLASSES} ${className ?? ""}`}
        >
            <ArrowRightIcon className="w-5 h-5" />
            Vai {GO_LABELS[goingTo] ?? `a ${goingTo}`}
        </button>
    );
}
