"use client"

import React, { useState, useEffect, useRef } from "react";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import CardBadgeCompany from "@/components/customBadges/cardBadgeCompany";
import { toast } from "sonner";

export interface Contact {
    id?: string | null;
    name?: string | null;
    surname?: string | null;
    email?: string | null;
    phone?: string | null;
    mobilePhone?: string | null;
    companyRecordId?: string | null;
}

interface ContactDetailProps {
    contact: Contact;
    setContact: React.Dispatch<React.SetStateAction<Contact>>;
    // true  -> l'azienda si può cambiare (barra di ricerca visibile)
    // false -> azienda in sola lettura (solo badge)
    isCompanyEditable?: boolean;
    // Chiamata dopo un salvataggio riuscito: serve a chi ospita il componente per
    // ricaricare la lista contatti (altrimenti mostrerebbe i dati vecchi).
    onSaved?: () => void;
}

// Riga contatto: input sempre modificabile che scrive nello stato del contatto.
const ContactField = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value?: string | null;
    onChange: (v: string) => void;
}) => (
    <div>
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</div>
        <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Inserisci ${label.toLowerCase()}`}
            className="mt-1 w-full text-sm font-semibold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
        />
    </div>
);

export default function ContactDetail({ contact, setContact, isCompanyEditable = true, onSaved }: ContactDetailProps) {
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");

    // Ricerca azienda (autocomplete)
    const [companyQuery, setCompanyQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Aggiorna un singolo campo del contatto senza toccare gli altri
    const updateContact = <K extends keyof Contact>(key: K, value: Contact[K]) => {
        setContact((prev) => ({ ...prev, [key]: value }));
        // Dopo una modifica il salvataggio non è più aggiornato -> torna a "Salva"
        setSaveStatus((s) => (s === "success" ? "idle" : s));
    };

    async function saveContact(contact: Contact) {
        const body = new FormData();
        body.append("apiRoute", "save_contact");
        body.append("id", contact.id ?? "");
        body.append("name", contact.name ?? "");
        body.append("surname", contact.surname ?? "");
        body.append("email", contact.email ?? "");
        body.append("phone", contact.phone ?? "");
        body.append("mobilePhone", contact.mobilePhone ?? "");
        body.append("companyRecordId", contact.companyRecordId ?? "");

        setSaveStatus("saving");
        try {
            const res = await axiosInstanceClient.post("/postApi", body);
            if (res.data?.success) {
                setSaveStatus("success");
                onSaved?.();   // ricarica la lista contatti nella pagina che ci ospita
            } else {
                setSaveStatus("idle");
                toast.error(res.data?.message || "Errore durante il salvataggio del contatto.");
            }
        } catch (err: any) {
            setSaveStatus("idle");
            toast.error(err?.response?.data?.message || "Errore durante il salvataggio del contatto.");
        }
    }

    // Cerca le aziende mentre si digita (min 2 caratteri)
    const searchCompanies = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const body = new FormData();
            body.append("apiRoute", "search_timesheet_entities");
            body.append("target", "azienda");
            body.append("searchTerm", query);

            const res = await axiosInstanceClient.post("/postApi", body);
            setSearchResults(res.data.results || []);
            setShowResults(true);
        } catch (err) {
            console.error(err);
        }
    };

    // Seleziona un'azienda: imposta solo companyRecordId (senza toccare gli altri campi)
    const handleSelectCompany = (company: any) => {
        setContact((prev) => ({ ...prev, companyRecordId: company.id }));
        setCompanyQuery(company.name);   // riempie la barra col nome selezionato
        setShowResults(false);
        // Cambiare azienda è una modifica -> il salvataggio torna a "Salva"
        setSaveStatus((s) => (s === "success" ? "idle" : s));
    };

    // Chiude la lista dei risultati cliccando fuori
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/40 p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
                {/* Colonna Contatto */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-4">Contatto</h3>

                    {/* Nome e cognome sulla stessa riga */}
                    <div className="grid grid-cols-2 gap-4">
                        <ContactField label="Nome" value={contact.name} onChange={(v) => updateContact("name", v)} />
                        <ContactField label="Cognome" value={contact.surname} onChange={(v) => updateContact("surname", v)} />
                    </div>
                    <ContactField label="Email" value={contact.email} onChange={(v) => updateContact("email", v)} />
                    <ContactField label="Telefono" value={contact.phone} onChange={(v) => updateContact("phone", v)} />
                    <ContactField label="Cellulare" value={contact.mobilePhone} onChange={(v) => updateContact("mobilePhone", v)} />
                </div>

                {/* Colonna Azienda */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-4">Azienda</h3>

                    {/* Badge azienda - mostrato solo se un'azienda è selezionata */}
                    {contact.companyRecordId && (
                        <CardBadgeCompany tableid="company" recordid={contact.companyRecordId} />
                    )}

                    {/* Barra di ricerca azienda - solo se l'azienda è modificabile */}
                    {isCompanyEditable && (
                        <div className="relative" ref={searchRef}>
                            <input
                                type="text"
                                value={companyQuery}
                                onChange={(e) => {
                                    setCompanyQuery(e.target.value);
                                    searchCompanies(e.target.value);
                                }}
                                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
                                className="w-full text-sm font-semibold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                placeholder="Cerca Azienda..."
                            />

                            {showResults && searchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelectCompany(item)}
                                            className="p-3 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-0"
                                        >
                                            <p className="font-bold text-sm text-zinc-800">{item.name}</p>
                                            {item.details && <p className="text-xs text-zinc-500">{item.details}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={() => saveContact(contact)}
                disabled={saveStatus === "saving" || saveStatus === "success"}
                className={`mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    saveStatus === "success"
                        ? "bg-emerald-600 shadow-emerald-600/20 cursor-default focus:ring-emerald-400"
                        : saveStatus === "saving"
                        ? "bg-zinc-400 shadow-zinc-400/20 cursor-wait"
                        : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.99] focus:ring-blue-400"
                }`}
            >
                {saveStatus === "success" ? "Salvato" : saveStatus === "saving" ? "Salvando" : "Salva"}
            </button>
        </div>
    );
}
