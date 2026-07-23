"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/solid";

interface BackButtonProps {
    comingFrom?: string | null;
    data?: { [key: string]: any } | null;
    // Classi di POSIZIONAMENTO, passate dalla pagina (es. "absolute top-6 left-4").
    // Lo stile/colore invece è fisso dentro al componente.
    className?: string;
}

// Sorgenti "esterne" (es. add-in di Outlook) senza una pagina a cui tornare nel sito:
// per queste NON mostriamo il bottone. Aggiungerne di nuove qui.
const EXTERNAL_SOURCES: string[] = ["email"];

// Etichette più leggibili per il bottone "Torna ..." (default: "a <nome>").
const BACK_LABELS: Record<string, string> = {
    company: "all'azienda",
};

// Costruisce l'URL di ritorno alla bixApp di provenienza, in base a 'comingFrom'.
// Riceve l'intero 'data': ogni case estrae da lì ciò che gli serve (così la firma
// resta stabile quando si aggiungono nuove sorgenti). Per 'company' torna alla
// scheda dell'azienda specifica (reference=id).
function buildBackPath(comingFrom: string | null | undefined, data?: { [key: string]: any } | null): string {
    const base = `/bixApps/${comingFrom ?? ""}`;
    switch (comingFrom) {
        case "company": {
            const companyRecordId = data?.companyRecordId;
            if (!companyRecordId) return base;
            const backData = { id: companyRecordId };
            return `${base}?reference=id&data=${encodeURIComponent(JSON.stringify(backData))}`;
        }
        default:
            return base;
    }
}

// Stile/colore FISSI (uguali ovunque).
const BASE_CLASSES =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium " +
    "text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors " +
    "focus:outline-none focus:ring-2 focus:ring-gray-300";

// Posizione di DEFAULT: in alto a sinistra (richiede un genitore 'relative').
// Passando 'className' la si sovrascrive con la posizione voluta dalla pagina.
const DEFAULT_POSITION = "absolute top-6 left-4 sm:left-6 lg:left-8 z-20";

export default function BackButton({ comingFrom, data, className }: BackButtonProps) {
    // Niente sorgente (o sorgente esterna) -> nessun bottone.
    if (!comingFrom || EXTERNAL_SOURCES.includes(comingFrom)) return null;

    return (
        <button
            type="button"
            onClick={() => {
                window.location.href = buildBackPath(comingFrom, data);
            }}
            className={`${BASE_CLASSES} ${className ?? DEFAULT_POSITION}`}
        >
            <ArrowLeftIcon className="w-4 h-4" />
            Torna {BACK_LABELS[comingFrom] ?? `a ${comingFrom}`}
        </button>
    );
}
