"use client";

import React, { useState, useEffect, useRef } from "react";
import GenericComponent from "@/components/genericComponent";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { BuildingOfficeIcon, MagnifyingGlassIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import CardBadgeCompany from "@/components/customBadges/cardBadgeCompany";
import { toast, Toaster } from "sonner";
import GoButton from "@/components/ui/goButton"
import ContactDetail, { Contact } from "./contactDetail"
import { Phone } from "lucide-react";

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

    // Contatti dell'azienda + quello eventualmente aperto in dettaglio.
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    // L'azienda è modificabile solo se siamo arrivati DAL contatto (telefono/email).
    // Se si parte dall'azienda resta fissa. Tenuto in uno state per invertirlo facilmente.
    const [isCompanyEditable, setIsCompanyEditable] = useState(false);

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
                    runLookup(() => fetchByEmail(data.email));
                }
                break;
            case 'phoneNumber':
                if (data?.phoneNumber) {
                    runLookup(() => fetchByPhone(data.phoneNumber));
                }
                break;
            case 'ticketId':
                if(data?.ticketId) {
                    runLookup(() => fetchCompanyByTicketId(data.ticketId));
                }
        }
    }, [reference, data]);

    // Quando l'azienda è risolta (da QUALSIASI reference) carichiamo i suoi contatti.
    // Reagiamo al RISULTATO (companyId), non al reference: così ogni nuovo lookup che
    // porta a un'azienda eredita la lista contatti senza aggiungere codice.
    useEffect(() => {
        if (!companyId) {
            // NB: NON azzeriamo selectedContact qui: un contatto senza azienda lascia
            // companyId null, e cancellarlo farebbe sparire il contatto appena trovato.
            // La selezione viene azzerata dove l'utente esce davvero (vedi "Cerca un'altra azienda").
            setContacts([]);
            return;
        }
        fetchContacts(companyId);
    }, [companyId]);

    // Carica i contatti dell'azienda. Il backend restituisce i nomi delle COLONNE DB,
    // quindi li mappiamo sul tipo Contact usato dal form di dettaglio.
    const fetchContacts = async (id: string) => {
        try {
            const body = new FormData();
            body.append("apiRoute", "get_all_contacts_from_company");
            body.append("companyId", id);

            const res = await axiosInstanceClient.post("/postApi", body);
            const rows = res.data?.contacts ?? [];

            setContacts(rows.map((r: any) => ({
                id: r.recordid_,
                name: r.name,
                surname: r.surname,
                email: r.email,
                phone: r.phone,
                mobilePhone: r.mobilephone,
                companyRecordId: r.recordidcompany_,
            })));
        } catch (err) {
            console.error("Errore nel caricamento dei contatti", err);
            setContacts([]);
        }
    };

    // get_contact_by_phone e get_contact_by_email restituiscono la STESSA forma,
    // quindi una sola mappatura basta per entrambe.
    const mapContact = (d: any): Contact => ({
        id: d.recordid,
        name: d.name,
        surname: d.surname,
        email: d.email,
        phone: d.phone,
        mobilePhone: d.mobilePhone,
        companyRecordId: d.companyRecordId,
    });

    // Contatto risolto (modalità "contact-first"): lo apriamo in dettaglio e carichiamo
    // anche la sua azienda. Serve caricarla DAVVERO (non solo companyId) perché la vista
    // azienda si basa su 'company': senza, tornando indietro si finirebbe sulla ricerca
    // invece che sulla scheda con la lista completa dei contatti.
    const selectResolvedContact = async (contact: Contact) => {
        setSelectedContact(contact);
        setIsCompanyEditable(true);   // arrivati dal contatto -> azienda modificabile

        if (!contact.companyRecordId) {
            setCompanyId(null);
            return;
        }

        try {
            await fetchCompanyDetails(contact.companyRecordId);
        } catch (err) {
            // Azienda mancante/non valida: mostriamo comunque il contatto, senza scheda.
            console.error("Azienda del contatto non caricata", err);
            setCompanyId(null);
        }
    };

    // Telefono ed email seguono la STESSA logica: prima si cerca il CONTATTO, e solo
    // se non esiste si ripiega sull'AZIENDA (anche le aziende hanno telefono ed email).
    const fetchByPhone = async (phone: string) => {
        const normalized = (await normalizePhone(phone)) ?? phone;

        try {
            const body = new FormData();
            body.append("apiRoute", "get_contact_by_phone");
            body.append("phone", normalized);

            const res = await axiosInstanceClient.post("/postApi", body);
            await selectResolvedContact(mapContact(res.data));
            return;
        } catch (err: any) {
            // 404 = nessun contatto con quel numero: NON è un errore, si prova l'azienda.
            // Qualsiasi altro errore va rilanciato e gestito da runLookup.
            if (err?.response?.status !== 404) throw err;
        }

        await fetchCompanyByContact(null, phone);
    };

    const fetchByEmail = async (email: string) => {
        try {
            const body = new FormData();
            body.append("apiRoute", "get_contact_by_email");
            body.append("email", email);

            const res = await axiosInstanceClient.post("/postApi", body);
            await selectResolvedContact(mapContact(res.data));
            return;
        } catch (err: any) {
            // 404 = nessun contatto con quell'email -> si prova l'azienda (per dominio).
            if (err?.response?.status !== 404) throw err;
        }

        await fetchCompanyByContact(email, null);
    };

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

    // Mostriamo la ricerca solo se non abbiamo NÉ un'azienda NÉ un contatto aperto:
    // un contatto senza azienda deve comunque poter vedere il proprio dettaglio.
    if(company == null && !selectedContact)
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
        // Col contatto aperto serve più larghezza: il dettaglio mette il badge
        // azienda in colonna, che a max-w-4xl risulta compresso.
        return (
            <div className={`w-full ${selectedContact ? "max-w-7xl" : "max-w-4xl"} mx-auto px-6 py-8 md:py-16 flex flex-col items-center gap-6`}>
                {/* PANORAMICA AZIENDA (ricerca + badge + pulsanti): quando si apre un
                    contatto il dettaglio la sostituisce, quindi la nascondiamo tutta. */}
                {!selectedContact && (
                    <>
                        {/* Torna alla ricerca: azione secondaria -> stile "ghost". */}
                        <button
                            type="button"
                            onClick={() => {
                                setCompany(null);
                                setCompanyId(null);
                                // Qui l'utente esce davvero: azzeriamo anche il contatto
                                // (l'effetto su companyId non lo fa più, vedi sopra).
                                setSelectedContact(null);
                                // Torna alla pagina di ricerca rimuovendo i query param (?id / ?data),
                                // cioè navigando allo stesso path senza query string.
                                router.push(window.location.pathname);
                            }}
                            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        >
                            <MagnifyingGlassIcon className="w-4 h-4" />
                            Cerca un'altra azienda
                        </button>

                        <CardBadgeCompany tableid="company" recordid={companyId ?? undefined} />

                        <div className="flex flex-wrap justify-center gap-4 [&>button]:basis-64 [&>button]:justify-center">
                            <GoButton goingTo="task" reference="id" data={ { companyRecordId: companyId } } />

                            <GoButton goingTo="timetracking" reference="company" data={ { companyRecordId: companyId } } />

                            <GoButton goingTo="timesheet" reference="company" data={ { companyRecordId: companyId } } />
                        </div>
                    </>
                )}

                {/* CONTATTI: lista dell'azienda, oppure il dettaglio di quello aperto. */}
                <div className="w-full">
                    {selectedContact ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setSelectedContact(null)}
                                className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                            >
                                ← Torna ai contatti
                            </button>

                            {/* Aperto dall'azienda -> l'azienda NON è modificabile. */}
                            <ContactDetail
                                contact={selectedContact}
                                setContact={setSelectedContact as React.Dispatch<React.SetStateAction<Contact>>}
                                isCompanyEditable={isCompanyEditable}
                            />
                        </>
                    ) : (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/40 p-6 md:p-8">
                            <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-4">
                                Contatti ({contacts.length})
                            </h3>

                            {contacts.length === 0 ? (
                                <p className="text-sm text-zinc-500 py-4 text-center">
                                    Nessun contatto collegato a questa azienda.
                                </p>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {contacts.map((c) => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedContact(c);
                                                // Aperto dalla lista dell'azienda -> azienda NON modificabile.
                                                setIsCompanyEditable(false);
                                            }}
                                            className="flex items-center justify-between p-3 hover:bg-zinc-50 cursor-pointer transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-zinc-800 truncate">
                                                    {[c.name, c.surname].filter(Boolean).join(" ") || "(senza nome)"}
                                                </p>
                                                {c.email && <p className="text-xs text-zinc-500 truncate">{c.email}</p>}
                                            </div>
                                            <ArrowRightIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {selectedContact && (
                <div className="flex flex-wrap justify-center gap-4 [&>button]:basis-64 [&>button]:justify-center">
                    <GoButton goingTo="task" reference="contact" data={ 
                        { 
                            contactId: selectedContact.id,
                            companyRecordId: selectedContact.companyRecordId,
                        } } />

                    <GoButton goingTo="timetracking" reference="contact" data={ 
                        { 
                            contactId: selectedContact.id,
                            companyRecordId: selectedContact.companyRecordId,
                        } } />

                    <GoButton goingTo="timesheet" reference="contact" data={ 
                        { 
                            contactId: selectedContact.id,
                            companyRecordId: selectedContact.companyRecordId,
                        } } />
                </div>
                )}
            </div>
        );
    }
}