"use client";

import React, { useState, useEffect } from "react";
import GenericComponent from "@/components/genericComponent";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { ClipboardDocumentCheckIcon, EnvelopeIcon, UserIcon, CalendarIcon, HashtagIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { PenIcon } from "lucide-react";
import { setDate } from "date-fns";

// INTERFACCE
interface TaskProps {
    oggetto?: string | null;
    mailmittente?: string | null;
    usermittente?: string | null;
    dataricezione?: string | null;
    linkToMail?: string | null;
}

interface CompanyDetails {
    id: string;
    name: string;
}

// Formatta una Date in stringa YYYY-MM-DD (ora locale) per gli <input type="date">
const toInputDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function TaskApp(props: TaskProps) {
    return (
        <div className="overflow-y-auto overflow-x-hidden h-screen bg-slate-50">
            <GenericComponent>{() => <TaskRegistration {...props} />}</GenericComponent>
        </div>
    );
}

function TaskRegistration({ oggetto, mailmittente, usermittente, dataricezione, linkToMail }: TaskProps) {
    const [isLoadingCompany, setIsLoadingCompany] = useState(false);
    const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
    const [priority, setPriority] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [expiration, setExpiration] = useState<Date>();
    const [plannedDate, setPlannedDate] = useState<Date>();
    const [duration, setDuration] = useState<Number>();

    useEffect(() => {
        if (mailmittente) {
            fetchCompanyByEmail(mailmittente);
        }
    }, [mailmittente]);

    // Pre-compila le date con oggi (in useEffect per evitare mismatch di hydration)
    useEffect(() => {
        setExpiration(new Date());
        setPlannedDate(new Date());
    }, []);

    const fetchCompanyByEmail = async (emailToSearch: string) => {
        setIsLoadingCompany(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "get_company_by_contact"); 
            body.append("email", emailToSearch);

            const res = await axiosInstanceClient.post("/postApi", body);
            
            if (res.data && res.data.recordid) {
                setCompanyDetails({
                    id: res.data.recordid,
                    name: res.data.name || "Azienda Trovata"
                });
            }
        } catch (err) {
            console.error("Error fetching company by email", err);
        } finally {
            setIsLoadingCompany(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden selection:bg-indigo-100 pb-10">
             <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
             <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply" />
             <div className="absolute top-24 -left-24 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-40 pointer-events-none mix-blend-multiply" />
            
             <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8 md:py-16">
                 <header className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-widest mb-2">
                        <ClipboardDocumentCheckIcon className="w-4 h-4" />
                        Task App
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
                        Dettaglio Task
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium">
                        Informazioni estratte dalla mail ricevuta.
                    </p>
                </header>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 p-8 md:p-10">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sezione Dettagli Mail */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-4">Informazioni Ricezione</h3>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                    <HashtagIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Oggetto</div>
                                    <div className="text-sm font-semibold text-zinc-800 mt-0.5">{oggetto || "Nessun oggetto specificato"}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">User Mittente</div>
                                    <div className="text-sm font-semibold text-zinc-800 mt-0.5">{usermittente || "N/A"}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                    <EnvelopeIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Mittente</div>
                                    <div className="text-sm font-semibold text-zinc-800 mt-0.5 break-all">{mailmittente || "N/A"}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Data Ricezione</div>
                                    <div className="text-sm font-semibold text-zinc-800 mt-0.5">{dataricezione || "N/A"}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                    <HashtagIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Link alla mail</div>
                                    {linkToMail ? (
                                        <button
                                            type="button"
                                            onClick={() => window.open(linkToMail, "_blank", "noopener,noreferrer")}
                                            className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-bold rounded-lg transition-colors"
                                        >
                                            <EnvelopeIcon className="w-4 h-4" />
                                            Apri la mail
                                        </button>
                                    ) : (
                                        <div className="text-sm font-mono text-zinc-600 mt-0.5 break-all">N/A</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                    <PenIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Descrizione</div>

                                    <textarea 
                                        name="description"
                                        value={description ?? ""}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="mt-1 text-sm font-semibold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                    >    

                                    </textarea>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                    <HashtagIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Priorità</div>

                                    <select
                                        aria-label="Priorità"
                                        value={priority ?? ""}
                                        onChange={(e) => setPriority(e.target.value ? Number(e.target.value) : null)}
                                        className="mt-1 text-sm font-semibold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                    >

                                        <option value="1">Richiesta di Davide</option>
                                        <option value="2">Alta</option>
                                        <option value="3">Media</option>
                                        <option value="4">Bassa</option>
                                        <option value="5">Richiesta di Mauro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Data di scadenza</div>

                                    <input
                                        type="date"
                                        name="expiration"
                                        value={expiration ? toInputDate(expiration) : ""}
                                        onChange={(e) => setExpiration(e.target.value ? new Date(e.target.value) : undefined)}
                                        className="mt-1 text-sm font-semibold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                    />

                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-4">Data pianificata</div>

                                    <input
                                        type="date"
                                        name="plannedDate"
                                        value={plannedDate ? toInputDate(plannedDate) : ""}
                                        onChange={(e) => setPlannedDate(e.target.value ? new Date(e.target.value) : undefined)}
                                        className="mt-1 text-sm font-semibold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sezione Azienda Collegata */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-4">Azienda Collegata</h3>
                            
                            {isLoadingCompany ? (
                                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                                    <div className="text-sm font-bold text-zinc-500">Ricerca azienda per email in corso...</div>
                                </div>
                            ) : companyDetails ? (
                                <div className="p-6 border border-zinc-100 rounded-2xl bg-white shadow-sm flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
                                        <BuildingOfficeIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-zinc-800">{companyDetails.name}</div>
                                        <div className="text-xs font-mono text-zinc-400 mt-1">ID: {companyDetails.id}</div>
                                        <div className="mt-3 inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                                            Trovata tramite Email
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-100 rounded-2xl bg-zinc-50/50">
                                    <BuildingOfficeIcon className="w-10 h-10 text-zinc-300 mb-3" />
                                    <div className="text-sm font-medium text-zinc-500 text-center">
                                        {mailmittente 
                                            ? "Nessuna azienda associata a questa email." 
                                            : "In attesa di un'email mittente per cercare l'azienda."}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
             </main>
        </div>
    );
}
