"use client"

import React, { useState, useEffect, useRef } from "react";
import GenericComponent from "@/components/genericComponent";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import CardBadgeCompany from "@/components/customBadges/cardBadgeCompany";
import { ClipboardDocumentCheckIcon, EnvelopeIcon, UserIcon, CalendarIcon, HashtagIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { ClockIcon, LinkIcon, PenIcon } from "lucide-react";
import { toast, Toaster } from "sonner";

// INTERFACCE
interface ContactProps {
    phoneNumber?: string | null;
}

interface Contact {
    id?: string | null;
    name?: string | null;
    surname?: string | null;
    email?: string | null;
    phone?: string | null;
    mobilePhone?: string | null;
    companyRecordId?: string | null;
}

// Riga "etichetta / valore". Non renderizza nulla se il valore è vuoto,
// così non lascia spazi vuoti nella colonna.
const Field = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null;
    return (
        <div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</div>
            <div className="text-sm font-semibold text-zinc-800 mt-0.5 break-all">{value}</div>
        </div>
    );
};

async function normalizePhone(phone: string): Promise<string | null> {
    const body = new FormData();
    body.append("apiRoute", "normalize_phone");
    body.append("phone", phone);

    const res = await axiosInstanceClient.post("/postApi", body);

    return res.data.normalizedPhone ?? null;
}

async function getContact(phone: string) {
    const body = new FormData();
    body.append("apiRoute", "get_contact_by_phone");
    body.append("phone", phone);

    const res = (await axiosInstanceClient.post("/postApi", body)).data;

    const contact: Contact = { 
        id: res.recordid,
        name: res.name,
        surname: res.surname,
        email: res.email,
        phone: res.phone,
        mobilePhone: res.mobilePhone,
        companyRecordId: res.companyRecordId
    }

    return contact;
}

export default function ContactApp(props: ContactProps) {
    return (
        <div className="overflow-y-auto overflow-x-hidden h-screen bg-slate-50">
            <GenericComponent>{() => <ContactDisplay {...props} />}</GenericComponent>
        </div>
    );
}

function ContactDisplay({ phoneNumber }: ContactProps) {
    const [contact, setContact] = useState<Contact>({});

    // Ricerca azienda (autocomplete) - mostrata solo se il contatto non ha un'azienda
    const [companyQuery, setCompanyQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Normalizza il numero (chiamata async) e aggiorna lo stato quando arriva la risposta
    useEffect(() => {
        if (!phoneNumber) return;
        
        normalizePhone(phoneNumber).then((normalized) => {
            getContact(normalized).then((cont) => {
                // Mostriamo il numero normalizzato, non quello grezzo del DB
                setContact({ ...cont, phone: normalized ?? cont.phone });
            });
        });
    }, [phoneNumber]);

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
        <div className="min-h-screen relative overflow-x-hidden selection:bg-indigo-100 pb-10">
            <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 md:py-16">
                <header className="mb-10">
                    <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-widest mb-2">
                        <UserIcon className="w-4 h-4" />
                        Contact App
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
                        Dettaglio Contatto
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium">
                        Informazioni del contatto e dell'azienda collegata.
                    </p>
                </header>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/40 p-8 md:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
                        {/* Colonna Contatto */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-4">Contatto</h3>

                            {/* Nome e cognome sulla stessa riga */}
                            <Field label="Nome" value={[contact.name, contact.surname].filter(Boolean).join(" ")} />
                            <Field label="Email" value={contact.email} />
                            <Field label="Telefono" value={contact.phone} />
                            <Field label="Cellulare" value={contact.mobilePhone} />
                        </div>

                        {/* Colonna Azienda */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-4">Azienda</h3>

                            {/* Badge azienda - mostrato solo se un'azienda è selezionata */}
                            {contact.companyRecordId && (
                                <CardBadgeCompany tableid="company" recordid={contact.companyRecordId} />
                            )}

                            {/* Barra di ricerca azienda - sempre visibile */}
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
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}