"use client";

import React, { useState, useEffect, useRef } from "react";
import GenericComponent from "@/components/genericComponent";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { ClipboardDocumentCheckIcon, EnvelopeIcon, UserIcon, CalendarIcon, HashtagIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { ClockIcon, LinkIcon, PenIcon } from "lucide-react";
import { setDate } from "date-fns";
import { toast, Toaster } from "sonner";
import { tr } from "date-fns/locale";

// INTERFACCE
interface TaskProps {
    oggetto?: string | null;
    mailmittente?: string | null;
    usermittente?: string | null;
    dataricezione?: string | null;
    linkToMail?: string | null;
    companyRecordId?: string | null;
    comingFrom?: string | null;
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

function TaskRegistration({ oggetto, mailmittente, usermittente, dataricezione, linkToMail, companyRecordId, comingFrom }: TaskProps) {
    const [isLoadingCompany, setIsLoadingCompany] = useState(false);
    const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
    const [priority, setPriority] = useState('1.Richiesta di Davide');
    const [description, setDescription] = useState('');
    const [expiration, setExpiration] = useState<Date>();
    const [plannedDate, setPlannedDate] = useState<Date>();
    const [duration, setDuration] = useState<Number>();
    const [isIdValid, setIsIdValid] = useState(true)

    // Ricerca azienda (autocomplete)
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Stato del salvataggio (per feedback sul bottone)
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (companyRecordId)
        {
            fetchCompanyById(companyRecordId);
        }
        else if (mailmittente) {
            fetchCompanyByEmail(mailmittente);
        }
    }, [mailmittente]);

    // Pre-compila le date con oggi (in useEffect per evitare mismatch di hydration)
    useEffect(() => {
        setExpiration(new Date());
        setPlannedDate(new Date());
    }, []);

    const handleSave = async () => {

        const allowedPriority = ['1.Richiesta di Davide', '2.Alta', '3.Media', '4.Bassa' ,'5.Richiesta di Mauro']

        if(!allowedPriority.includes(priority))
        {
            toast.error("La priorità deve essere tra 1 e 5")
            return
        }

        // Blocca il salvataggio se scadenza o data pianificata sono precedenti a oggi
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const isBeforeToday = (d?: Date) => {
            if (!d) return false;
            const day = new Date(d);
            day.setHours(0, 0, 0, 0);
            return day < startOfToday;
        };
        if (isBeforeToday(expiration) || isBeforeToday(plannedDate)) {
            toast.error("La data di scadenza e la data pianificata non possono essere precedenti a oggi.");
            return;
        }

        if(!companyDetails || !companyDetails.id || !companyDetails.name)
        {
            toast.error("Selezionare un'azienda prima di salvare");
            return;
        }

        if(!isIdValid)
        {
            toast.error("Selezionare un'azienda valida");
            return;
        }

        try {
            const res = await axiosInstanceClient.post("/postApi", {
                apiRoute: "save_mail_task",
                priority: priority ?? "1.Richiesta di Davide",
                description: description ?? "",
                expiration: expiration ?? new Date(),
                plannedDate: plannedDate ?? new Date(),
                duration: duration ?? 0,
                companyId: companyDetails.id ?? "",
                object: oggetto ?? "",
                mailSender: mailmittente ?? "",
                userSender: usermittente ?? "",
                receivedDate: dataricezione ?? "",
                linkToMail: linkToMail ?? "",
            });

            if (res.data?.success) {
                setSaved(true);
            } else {
                toast.error(res.data?.message || "Errore durante il salvataggio del task.");
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Errore durante il salvataggio del task.");
        }
    };

    const fetchCompanyById = async (companyId: string) => {
        setIsLoadingCompany(true)
        try {
            const body = new FormData();
            body.append("apiRoute", "get_company_details")
            body.append("id", companyId)

            const res = await axiosInstanceClient.post("/postApi", body)
            console.log(res.data);

            if(!res.data.companyName)
            {
                setIsIdValid(false)
            }
            
            setCompanyDetails( { id: companyId, name: res.data.companyName } )
        }
        catch (err) {
            console.error("Error fetching company by email", err);
        } finally {
            setIsLoadingCompany(false);
        }
    }

    const fetchCompanyByEmail = async (emailToSearch: string) => {
        setIsLoadingCompany(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "get_company_by_contact"); 
            body.append("email", emailToSearch);

            const res = await axiosInstanceClient.post("/postApi", body);
            console.log(res.data);
            // Il backend restituisce un array: prendiamo solo la prima azienda
            const firstCompany = Array.isArray(res.data) ? res.data[0] : res.data;
            if (firstCompany && firstCompany.recordid) {
                setCompanyDetails({
                    id: firstCompany.recordid,
                    name: firstCompany.name || "Azienda Trovata"
                });
            }
        } catch (err) {
            console.error("Error fetching company by email", err);
        } finally {
            setIsLoadingCompany(false);
        }
    };

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

    // Seleziona un'azienda dalla lista dei risultati
    const handleSelectCompany = (company: any) => {
        setIsIdValid(true)
        setCompanyDetails({ id: company.id, name: company.name });
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
             <Toaster richColors position="top-right" />
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
                        Creazione task con informazioni ricevute
                    </p>
                </header>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 p-8 md:p-10">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sezione Dettagli Mail */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-4">Informazioni Task</h3>
                            
                            {!comingFrom && (
                            <>
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
                                    <LinkIcon className="w-5 h-5" />
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
                            </>
                            )}

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
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="mt-1 text-sm font-semibold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                    >

                                        <option value="1.Richiesta di Davide">Richiesta di Davide</option>
                                        <option value="2.Alta">Alta</option>
                                        <option value="3.Media">Media</option>
                                        <option value="4.Bassa">Bassa</option>
                                        <option value="5.Richiesta di Mauro">Richiesta di Mauro</option>
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

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                    <ClockIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Durata</div>

                                    <input
                                        type="number"
                                        aria-label="Durata"
                                        min={0}
                                        step={0.1}
                                        onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : null)}
                                        className="mt-1 text-sm font-semibold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                    >
                                    </input>
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

                            <div className="relative" ref={searchRef}>
                                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Azienda</div>
                                <input
                                    type="text"
                                    value={companyDetails?.name ?? ""}
                                    onChange={e => {
                                        setCompanyDetails({ id: companyDetails?.id ?? "", name: e.target.value });
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

                <div className="mt-8 flex gap-4">
                    {comingFrom && (
                        <button
                            type="button"
                            onClick={() => {
                                // Torna alla bixApp di provenienza (root-relative: funziona in locale e in prod)
                                const backPath = companyRecordId
                                    ? `/bixApps/${comingFrom}/${companyRecordId}`
                                    : `/bixApps/${comingFrom}`;
                                window.location.href = backPath;
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-bold rounded-xl transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2"
                        >
                            <BuildingOfficeIcon className="w-4 h-4" />
                            Torna a {comingFrom}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saved}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            saved
                                ? "bg-emerald-600 shadow-emerald-600/20 cursor-default focus:ring-emerald-400"
                                : "bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.99] focus:ring-indigo-400"
                        }`}>
                        {saved ? (
                            <>
                                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                                Task salvata con successo!
                            </>
                        ) : (
                            "Salva"
                        )}
                    </button>
                </div>
                
                </div>
             </main>
        </div>
    );
}
