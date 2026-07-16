"use client";

import React, { useState, useEffect, useRef } from "react";
import GenericComponent from "@/components/genericComponent";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { BuildingOfficeIcon, MagnifyingGlassIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import CardBadgeCompany from "@/components/customBadges/cardBadgeCompany";
import { toast, Toaster } from "sonner";

// INTERFACCE
interface CompanyProps {
    data?: { [key: string]: any } | null;
    reference?: string | null;
}

interface ListItem {
    id: string;
    name: string;
    details?: string;
}

// Normalizza un numero di telefono usando l'endpoint backend 'normalize_phone'.
// Ritorna il numero in formato E.164, oppure null se non normalizzabile.
async function normalizePhone(phone: string): Promise<string | null> {
    const body = new FormData();
    body.append("apiRoute", "normalize_phone");
    body.append("phone", phone);
    const res = await axiosInstanceClient.post("/postApi", body);
    return res.data.normalizedPhone ?? null;
}

export default function CompanyApp({ data, reference }: CompanyProps) {
    return (
        <div className="overflow-y-auto overflow-x-hidden h-screen bg-slate-50">
            <Toaster richColors position="top-right" />
            <GenericComponent>{() => <CompanyRegistration data={data} reference={reference} />}</GenericComponent>
        </div>
    );
}

function CompanyRegistration({ data, reference }: CompanyProps) {
    const [companyId, setCompanyId] = useState<string | null>(reference === 'id' ? (data?.id ?? null) : null);
    const [company, setCompany] = useState<ListItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // Chiave dell'ultimo input già elaborato. Un ref (non uno state) perché deve
    // sopravvivere al doppio mount di StrictMode in dev, dove lo state non è ancora
    // aggiornato alla seconda esecuzione dell'effetto.
    const lastFetchKey = useRef<string | null>(null);

    const router = useRouter();

    // In base al 'reference' scegliamo quale campo di 'data' usare per la ricerca.
    useEffect(() => {
        // Elabora ogni input una sola volta: evita il doppio fetch (e doppio toast)
        // del doppio mount di StrictMode in dev, e un eventuale re-fetch inutile.
        const key = `${reference}:${JSON.stringify(data)}`;
        if (lastFetchKey.current === key) return;
        lastFetchKey.current = key;

        switch (reference) {
            case 'id':
                if (data?.id) {
                    runLookup(() => fetchCompanyDetails(data.id));
                }
                break;
            case 'email':
                if (data?.email) {
                    runLookup(() => fetchCompanyByContact(data.email, null));
                }
                break;
            case 'telefono':
                if (data?.telefono) {
                    runLookup(() => fetchCompanyByContact(null, data.telefono));
                }
                break;
            case 'ticketId':
                if(data?.ticketId) {
                    runLookup(() => fetchCompanyByTicketId(data.ticketId));
                }
        }
    }, [reference, data]);

    // Gestisce in un UNICO posto loading, errori e toast per ogni lookup della switch.
    // Le funzioni di lookup restano "pure" (fanno la chiamata e aggiornano lo stato):
    // così ogni nuovo case che passa da runLookup eredita automaticamente questo comportamento.
    const runLookup = async (fn: () => Promise<void>) => {
        setIsLoading(true);
        try {
            await fn();
        } catch (err: any) {
            // NB: su risposte non-2xx il proxy /postApi ri-avvolge il messaggio Django
            // sotto la chiave 'error' (non 'message'). Leggiamo 'error' e teniamo 'message'
            // come fallback per sicurezza.
            const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
            // 404 = nessun risultato (record inesistente): caso normale, non un errore.
            if (err?.response?.status === 404) {
                toast.info(backendMsg || "Nessun risultato trovato.");
            } else {
                console.error("Errore durante il caricamento", err);
                toast.error(backendMsg || "Errore durante il caricamento.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCompanyByContact = async (emailToSearch: string | null | undefined, telefonoToSearch: string | null | undefined) => {
        // Rimuove eventuali apici/spazi attorno al valore
        const clean = (v: string | null | undefined) => (v ?? "").replace(/^['"\s]+|['"\s]+$/g, "");

        // Normalizza il telefono col backend (fallback al valore pulito se non normalizzabile)
        const cleanTelefono = clean(telefonoToSearch);
        const telefono = cleanTelefono ? (await normalizePhone(cleanTelefono)) ?? cleanTelefono : "";

        const body = new FormData();
        body.append("apiRoute", "get_company_by_contact");
        body.append("email", clean(emailToSearch));
        body.append("telefono", telefono);

        const res = await axiosInstanceClient.post("/postApi", body);

        // Il backend restituisce un array di aziende su match.
        const companies = Array.isArray(res.data) ? res.data : [];

        const companiesList: ListItem[] = companies.map((company) => ({
            id: company['recordid'],
            name: company['name'],
        }));

        if (companiesList.length === 1) {
            // Un solo risultato: andiamo direttamente alla scheda (badge)
            setCompany(companiesList[0]);
            setCompanyId(companiesList[0].id);
        } else {
            // Più risultati: mostriamo la lista per far scegliere
            setSearchResults(companiesList);
        }
    };

    const fetchCompanyDetails = async (id: string) => {
        const body = new FormData();
        body.append("apiRoute", "get_company_details");
        body.append("id", id);

        const res = await axiosInstanceClient.post("/postApi", body);

        // Il backend restituisce i campi "flat" (id, companyName, address, ...)
        if (res.data && res.data.id) {
            setCompanyId(res.data.id);   // il badge legge da companyId, non da company
            setCompany({
                id: res.data.id,
                name: res.data.companyName || 'Dettaglio Azienda',
                details: res.data.address || ""
            });
        }
    };

    const fetchCompanyByTicketId = async(ticketId: string) => {
        const body = new FormData();
        body.append("apiRoute", "get_ticket_by_freshdeskid");
        body.append("ticketId", ticketId);

        const res = await axiosInstanceClient.post("/postApi", body);

        const id = res.data?.ticket?.['recordidcompany_'];
        if (!id) {
            // Il ticket esiste ma non ha un'azienda collegata: NON è un errore,
            // è una condizione di business -> info specifica di questo lookup.
            toast.info("Il ticket non ha un'azienda collegata.");
            return;
        }

        await fetchCompanyDetails(id);
    }

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "search_timesheet_entities");
            body.append("target", "azienda");
            body.append("searchTerm", query);

            const res = await axiosInstanceClient.post("/postApi", body);
            if (res.data && res.data.results) {
                setSearchResults(res.data.results);
            }
        } catch (err) {
            console.error("Error searching companies", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCompany = (selected: ListItem) => {
        setCompany(selected);
        setCompanyId(selected.id);
        setSearchQuery("");
        setSearchResults([]);

        // I parametri sono serializzati in un unico JSON nel query param 'data'.
        // 'reference' sta FUORI da 'data' e indica quale campo di 'data' identifica
        // l'entità da cercare (qui 'id' -> l'azienda è determinata da data.id).
        const reference = "id";
        const data = { id: selected.id };
        const basePath = window.location.pathname.replace(/\/$/, "");
        router.push(
            `${basePath}?reference=${encodeURIComponent(reference)}&data=${encodeURIComponent(JSON.stringify(data))}`
        );
    };

    if(company == null)
    {
        return (
            <div className="min-h-screen relative overflow-x-hidden selection:bg-blue-100 pb-10">
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply" />
                <div className="absolute top-24 -left-24 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply" />
                
                <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8 md:py-16">
                    <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-widest mb-2">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            BixData App
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
                            Ricerca Azienda
                        </h1>
                        <p className="text-zinc-500 mt-2 font-medium">
                            Cerca un'azienda nel database per visualizzarne la scheda.
                        </p>
                    </header>

                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <div className="p-6 md:p-8">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-6 w-6 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-14 pr-6 py-5 bg-zinc-50/50 border-0 rounded-2xl text-zinc-900 ring-1 ring-inset ring-zinc-200 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-lg sm:leading-6 transition-all placeholder:text-zinc-400 font-medium shadow-sm hover:bg-zinc-50"
                                    placeholder="Digita il nome dell'azienda da cercare..."
                                    value={searchQuery}
                                    onChange={(e) => {handleSearch(e.target.value)}}
                                />
                            </div>

                            {isLoading && (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                    <div className="text-sm font-bold text-zinc-500 animate-pulse">Ricerca in corso...</div>
                                </div>
                            )}

                            {!isLoading && searchResults.length > 0 && (
                                <div className="mt-6 divide-y divide-zinc-100 border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
                                    {searchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            onClick={() => handleSelectCompany(result)}
                                            className="group flex items-center justify-between p-5 hover:bg-blue-50 transition-colors cursor-pointer bg-white"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-zinc-100/80 text-zinc-500 flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors border border-zinc-200/50 group-hover:border-blue-200">
                                                    <BuildingOfficeIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="text-base font-bold text-zinc-800 group-hover:text-blue-700 transition-colors">{result.name}</div>
                                                    {result.details && <div className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{result.details}</div>}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <ArrowRightIcon className="w-4 h-4 text-zinc-400 group-hover:text-blue-600 transition-all" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                                <div className="text-center py-16 text-zinc-500">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-4">
                                        <BuildingOfficeIcon className="w-8 h-8 text-zinc-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-700 mb-1">Nessun risultato</h3>
                                    <p className="text-sm">Non abbiamo trovato aziende che corrispondono a "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        );
    }
    else
    {
        return (
            <div className="w-full max-w-4xl mx-auto px-6 py-8 md:py-16 flex flex-col items-center gap-6">
                <CardBadgeCompany tableid="company" recordid={companyId ?? undefined} />

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            setCompany(null);
                            setCompanyId(null);
                            // Torna alla pagina di ricerca rimuovendo i query param (?id / ?data),
                            // cioè navigando allo stesso path senza query string.
                            router.push(window.location.pathname);
                        }}
                        className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2"
                    >
                        <MagnifyingGlassIcon className="w-5 h-5" />
                        Cerca un'altra azienda
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            // Ricava dinamicamente il nome della bixApp dal path (.../bixApps/<app>/...)
                            const segments = window.location.pathname.split("/").filter(Boolean);
                            const bixIdx = segments.indexOf("bixApps");
                            const comingFrom = bixIdx !== -1 ? (segments[bixIdx + 1] ?? "company") : "company";
                            // Nuovo formato: reference + data (JSON). Il task cercherà l'azienda per id.
                            const data = { companyRecordId: companyId };
                            window.location.href =
                                `/bixApps/task?reference=id&comingFrom=${encodeURIComponent(comingFrom)}&data=${encodeURIComponent(JSON.stringify(data))}`;
                        }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2"
                    >
                        <ArrowRightIcon className="w-5 h-5" />
                        Crea task
                    </button>
                </div>
            </div>
        );
    }
}
