"use client";
import React, { useMemo, useContext, useState, useEffect, useCallback } from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "@/components/genericComponent";
import { AppContext } from "@/context/appContext";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { useFrontendFunctions } from "@/lib/functionsDispatcher";
import { toast, Toaster } from "sonner";
import PopUpManager from "@/components/popUpManager";
import { useRecordsStore } from "@/components/records/recordsStore";

// HeroIcons v2 (Open Source)
import * as Icons from "@heroicons/react/24/outline";

const isDev = false;


function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// --- MAPPER ICONE SERVIZI ---
const iconMap: Record<string, React.ElementType> = {
    amministrazione: Icons.BuildingOffice2Icon,
    it: Icons.CpuChipIcon,
    pbx: Icons.PhoneIcon,
    sw: Icons.CommandLineIcon,
    web: Icons.GlobeAltIcon,
    commerciale: Icons.BriefcaseIcon,
    formazione: Icons.AcademicCapIcon,
    test: Icons.BeakerIcon,
    interno: Icons.HomeModernIcon,
    lenovo: Icons.CpuChipIcon,
    printing: Icons.PrinterIcon,
    riunione: Icons.UsersIcon,
    default: Icons.CommandLineIcon,
};

// --- INTERFACCE ---
interface ListItem {
    id: string;
    name: string;
    details?: string;
    icon_slug?: string;
}

interface Materiale {
    id: number;
    prodotto: ListItem | null;
    note: string;
    qtaPrevista: string;
    qtaEffettiva: string;
}

interface AllegatoDettagliato {
    id: number;
    tipo: "Allegato generico" | "Signature";
    file: File | null;
    filename: string;
    data: string;
    note: string;
    rapportiLavoro: ListItem | null;
    progetto: ListItem | null;
}

interface ResponseInterface {
    servizi: ListItem[];
    opzioni: ListItem[];
    aziendeRecenti: ListItem[];
    progettiRecenti: ListItem[];
    utenteCorrente: ListItem;
}

export default function ProfessionalTimesheet() {
    const { user: contextUser } = useContext(AppContext);

    const MAX_DESC_LENGTH = 500;
    const MAX_SEARCH_LENGTH = 40;

    // STATI DI NAVIGAZIONE
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeSearch, setActiveSearch] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddMaterial, setShowAddMaterial] = useState(false);
    const [showAddAllegato, setShowAddAllegato] = useState(false);

    // ID RITORNATO DAL BACKEND DOPO IL SALVATAGGIO DELLA TESTATA
    const [timesheetId, setTimesheetId] = useState<number | null>(null);

    const { handleSignTimesheet, swissbixPrintTimesheet } =
        useFrontendFunctions();
    const { isPopupOpen, setIsPopupOpen, popUpType, popupRecordId, infoData } =
        useRecordsStore();

    // STATO DEL FORM
    const [formData, setFormData] = useState({
        data: new Date().toISOString().split("T")[0],
        servizio: null as ListItem | null,
        opzioni: null as ListItem | null,
        descrizione: "",
        tempoLavoro: "01:00",
        azienda: null as ListItem | null,
        progetto: null as ListItem | null,
        ticket: null as ListItem | null,
        tempoTrasferta: "00:00",
        noteInterne: "",
        utente: null as ListItem | null,
        notaRifiuto: "",
        materiali: [] as Materiale[],
        allegati: [] as AllegatoDettagliato[],
    });

    const [tempMaterial, setTempMaterial] = useState<Materiale>({
        id: 0,
        prodotto: null,
        note: "",
        qtaPrevista: "1",
        qtaEffettiva: "1",
    });
    const [tempAllegato, setTempAllegato] = useState<AllegatoDettagliato>({
        id: 0,
        tipo: "Allegato generico",
        file: null,
        filename: "",
        data: new Date().toISOString().split("T")[0],
        note: "",
        rapportiLavoro: null,
        progetto: null,
    });

    // --- CARICAMENTO DATI ---
     const payload = useMemo(() => {
         if (isDev) return null;
         return {
             apiRoute: "get_timesheet_initial_data",
         };
     }, []);

    const { response, loading, error } = useApi<ResponseInterface>(payload);
    const [responseData, setResponseData] = useState<ResponseInterface | null>(
        null
    );

    useEffect(() => {
        if (response) {
            setResponseData(response);
            if (response.utenteCorrente)
                setFormData((prev) => ({
                    ...prev,
                    utente: response.utenteCorrente,
                }));
        }
    }, [response]);

    const [searchResults, setSearchResults] = useState<ListItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 300);

    const fetchResults = useCallback(async (target: string, query: string) => {
        setSearchLoading(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "search_timesheet_entities");
            body.append("target", target);
            body.append("q", query);

            const res = await axiosInstanceClient.post("/postApi", body);
            setSearchResults(res.data.results || []);
        } catch (err) {
            toast.error("Errore nel recupero dati");
        } finally {
            setSearchLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeSearch) fetchResults(activeSearch, debouncedSearch);
    }, [activeSearch, debouncedSearch, fetchResults]);

    const update = (field: string, val: any) =>
        setFormData((p) => ({ ...p, [field]: val }));

    // --- VALIDAZIONE CAMPI OBBLIGATORI ---
    const isStepValid = useMemo(() => {
        switch (step) {
            case 1:
                return !!formData.azienda;
            case 4:
                return !!formData.servizio;
            case 6:
                return !!formData.data && !!formData.tempoLavoro;
            case 7:
                return formData.descrizione.trim().length > 1;
            case 9:
                return (
                    !!formData.servizio &&
                    !!formData.data &&
                    formData.descrizione.trim().length > 1
                );
            default:
                return true;
        }
    }, [step, formData]);

    // --- LOGICHE DI SALVATAGGIO ---

    const handleSaveBase = async (mode: "finish" | "continue") => {
        setIsSaving(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "save_timesheet");
            body.append(
                "fields",
                JSON.stringify({
                    data: formData.data,
                    descrizione: formData.descrizione,
                    tempo_lavoro: formData.tempoLavoro,
                    tempo_trasferta: formData.tempoTrasferta,
                    note_interne: formData.noteInterne,
                    nota_rifiuto: formData.notaRifiuto,
                    servizio: formData.servizio?.name,
                    opzione: formData.opzioni?.name,
                    azienda_id: formData.azienda?.id,
                    progetto_id: formData.progetto?.id,
                    ticket_id: formData.ticket?.id,
                    utente_id: formData.utente?.id,
                })
            );

            const res = await axiosInstanceClient.post("/postApi", body);

            if (res.status === 200 && res.data.id) {
                setTimesheetId(res.data.id);
                toast.success("Timesheet salvato correttamente");
                if (mode === "finish") setIsSuccess(true);
                else setStep(10);
            } else {
                toast.error(res.data.error || "Errore nel salvataggio");
            }
        } catch (err) {
            toast.error("Errore di rete");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAllMaterials = async (mode: "finish" | "hub") => {
        if (!timesheetId) return;
        setIsSaving(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "save_timesheet_material");
            body.append("timesheet_id", timesheetId.toString());
            body.append(
                "materiali",
                JSON.stringify(
                    formData.materiali.map((m) => ({
                        prodotto_id: m.prodotto?.id,
                        expectedquantity: m.qtaPrevista,
                        actualquantity: m.qtaEffettiva,
                        note: m.note,
                    }))
                )
            );

            const res = await axiosInstanceClient.post("/postApi", body);
            if (res.status === 200) {
                toast.success("Materiali registrati");
                if (mode === "finish") setIsSuccess(true);
                else setStep(10);
            }
        } catch (err) {
            toast.error("Errore salvataggio materiali");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAllAttachments = async (mode: "finish" | "hub") => {
        if (!timesheetId) return;
        setIsSaving(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "save_timesheet_attachment");
            body.append("timesheet_id", timesheetId.toString());

            formData.allegati.forEach((a, i) => {
                if (a.file) {
                    body.append(`file_${i}`, a.file);
                    body.append(
                        `metadata_${i}`,
                        JSON.stringify({
                            tipo: a.tipo,
                            note: a.note,
                            filename: a.filename,
                            data: a.data,
                            rapporto_id: a.rapportiLavoro?.id,
                            progetto_id: a.progetto?.id,
                        })
                    );
                }
            });

            const res = await axiosInstanceClient.post("/postApi", body);
            if (res.status === 200) {
                toast.success("Allegati caricati correttamente");
                if (mode === "finish") setIsSuccess(true);
                else setStep(10);
            }
        } catch (err) {
            toast.error("Errore caricamento file");
        } finally {
            setIsSaving(false);
        }
    };

    // --- HELPERS UI ---
    const StepTitle = ({ title, sub, required, completed }: any) => (
        <div
            className={`mb-8 border-l-4 pl-4 transition-all duration-300 ${
                required && !completed
                    ? "border-orange-500"
                    : completed
                    ? "border-teal-500"
                    : "border-zinc-200"
            }`}>
            <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    {title}
                </h2>
                {completed && (
                    <Icons.CheckCircleIcon className="w-6 h-6 text-teal-500 animate-in zoom-in" />
                )}
            </div>
            <p className="text-zinc-500 text-sm font-medium">
                {sub}{" "}
                {required && !completed && (
                    <span className="text-orange-500 font-black text-[10px] uppercase ml-1">
                        Richiesto
                    </span>
                )}
            </p>
        </div>
    );

    const RecapRow = ({
        label,
        value,
        icon: Icon,
        colorClass = "text-zinc-800",
    }: any) => {
        if (!value || value === "00:00") return null;
        return (
            <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0 text-left">
                <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        {label}
                    </span>
                </div>
                <span
                    className={`text-sm font-semibold truncate max-w-[160px] ${colorClass}`}>
                    {value}
                </span>
            </div>
        );
    };

    if (isSuccess)
        return (
            <div className="flex flex-col min-h-[100dvh] bg-white items-center justify-center p-8 text-center animate-in fade-in duration-500">
                <Icons.CheckCircleIcon className="w-20 h-20 text-teal-500 mb-6" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">
                    Attività Inviata
                </h2>
                <div className="w-full max-w-xs mt-10 space-y-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full h-16 bg-orange-500 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Icons.ArrowPathIcon className="w-5 h-5" /> Nuovo
                        Timesheet
                    </button>
                    <button
                        onClick={() => (window.location.href = "/home")}
                        className="w-full h-16 bg-zinc-100 text-zinc-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                        <Icons.HomeIcon className="w-5 h-5" /> Home
                    </button>
                </div>
            </div>
        );

    return (
        <GenericComponent response={responseData} loading={loading} error={error}>
            {(res: ResponseInterface) => {
                
                // --- AGGIUNGI QUESTE DUE RIGHE ---
                console.log("DEBUG - Response dal server:", res);
                if (!res) return null; 
                // ---------------------------------

                return (
                    <>
                        <Toaster
                            richColors
                            position="top-right"
                        />

                        <div className="flex flex-col min-h-[100dvh] bg-[#F9FAFB] text-zinc-900 font-sans pb-24">
                            <div className="fixed top-0 left-0 right-0 h-1.5 flex z-[200] bg-white border-b border-zinc-100">
                                <div
                                    className="h-full bg-orange-500 transition-all duration-500"
                                    style={{ width: `${(step / 14) * 100}%` }}
                                />
                            </div>

                            <main className="flex-1 px-6 pt-12 pb-32 max-w-lg mx-auto w-full">
                                {/* --- STEP 1-8: FLOW RACCOLTA DATI --- */}
                                {step === 1 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <StepTitle
                                            title="Cliente"
                                            sub="Seleziona l'azienda."
                                            required
                                            completed={!!formData.azienda}
                                        />

                                        {/* Bottone di ricerca principale */}
                                        <button
                                            onClick={() =>
                                                setActiveSearch("azienda")
                                            }
                                            className={`w-full p-6 bg-white border rounded-3xl text-left flex items-center justify-between shadow-sm transition-all active:scale-95 ${
                                                formData.azienda
                                                    ? "border-teal-500 ring-4 ring-teal-50"
                                                    : "border-zinc-200"
                                            }`}>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase text-zinc-400 mb-1">
                                                    Ricerca Globale
                                                </span>
                                                <span
                                                    className={
                                                        formData.azienda
                                                            ? "text-zinc-900 font-bold text-lg"
                                                            : "text-zinc-300 text-lg"
                                                    }>
                                                    {formData.azienda?.name ||
                                                        "Cerca Azienda..."}
                                                </span>
                                            </div>
                                            <Icons.MagnifyingGlassIcon
                                                className={`w-6 h-6 ${
                                                    formData.azienda
                                                        ? "text-teal-500"
                                                        : "text-zinc-300"
                                                }`}
                                            />
                                        </button>

                                        {res.aziendeRecenti?.length > 0 &&
                                            !formData.azienda && (
                                                <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                                                    <div className="flex items-center gap-2 mb-4 px-2">
                                                        <Icons.ClockIcon className="w-4 h-4 text-zinc-400" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                            Scelte Recenti
                                                        </span>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        {res.aziendeRecenti.map(
                                                            (az) => (
                                                                <button
                                                                    key={az.id}
                                                                    onClick={() =>
                                                                        update(
                                                                            "azienda",
                                                                            az
                                                                        )
                                                                    }
                                                                    className="w-full p-5 bg-white border border-zinc-100 rounded-2xl text-left flex items-center justify-between hover:border-orange-200 active:bg-orange-50 transition-all group shadow-sm">
                                                                    <div className="overflow-hidden">
                                                                        <p className="font-bold text-zinc-800 text-sm group-hover:text-orange-600 transition-colors">
                                                                            {
                                                                                az.name
                                                                            }
                                                                        </p>
                                                                        {az.details && (
                                                                            <p className="text-[10px] text-zinc-400 truncate">
                                                                                {
                                                                                    az.details
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <Icons.ChevronRightIcon className="w-4 h-4 text-zinc-200 group-hover:text-orange-400 transition-colors" />
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        {formData.azienda && (
                                            <button
                                                onClick={() =>
                                                    update("azienda", null)
                                                }
                                                className="mt-6 flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase tracking-widest px-2 active:scale-95">
                                                <Icons.XCircleIcon className="w-4 h-4" />{" "}
                                                Cambia Azienda
                                            </button>
                                        )}
                                    </div>
                                )}

                                {step === 2 && (
                                    <div>
                                        <StepTitle
                                            title="Progetto"
                                            sub="Associa a un progetto."
                                            completed={!!formData.progetto}
                                        />
                                        <button
                                            onClick={() =>
                                                setActiveSearch("progetto")
                                            }
                                            className={`w-full p-6 bg-white border rounded-3xl text-left shadow-sm flex items-center justify-between active:bg-zinc-50 ${
                                                formData.progetto
                                                    ? "border-teal-200"
                                                    : "border-zinc-200"
                                            }`}>
                                            <span
                                                className={`text-lg font-semibold ${
                                                    formData.progetto
                                                        ? "text-zinc-900"
                                                        : "text-zinc-300"
                                                }`}>
                                                {formData.progetto?.name ||
                                                    "Cerca Progetto..."}
                                            </span>
                                            <Icons.FolderIcon
                                                className={`w-6 h-6 ${
                                                    formData.progetto
                                                        ? "text-teal-500"
                                                        : "text-zinc-300"
                                                }`}
                                            />
                                        </button>

                                        {res.progettiRecenti?.length > 0 &&
                                            !formData.progetto && (
                                                <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                                                    <div className="flex items-center gap-2 mb-4 px-2">
                                                        <Icons.ClockIcon className="w-4 h-4 text-zinc-400" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                            Progetti Recenti
                                                        </span>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        {res.progettiRecenti.map(
                                                            (prj) => (
                                                                <button
                                                                    key={prj.id}
                                                                    onClick={() =>
                                                                        update(
                                                                            "progetto",
                                                                            prj
                                                                        )
                                                                    }
                                                                    className="w-full p-5 bg-white border border-zinc-100 rounded-2xl text-left flex items-center justify-between hover:border-orange-200 active:bg-orange-50 transition-all group shadow-sm">
                                                                    <div className="overflow-hidden">
                                                                        <p className="font-bold text-zinc-800 text-sm group-hover:text-orange-600 transition-colors">
                                                                            {
                                                                                prj.name
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <Icons.ChevronRightIcon className="w-4 h-4 text-zinc-200 group-hover:text-orange-400 transition-colors" />
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        {formData.progetto && (
                                            <button
                                                onClick={() =>
                                                    update("progetto", null)
                                                }
                                                className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase ml-2 tracking-widest">
                                                <Icons.XMarkIcon
                                                    className="w-3.5 h-3.5"
                                                    strokeWidth={3}
                                                />{" "}
                                                Rimuovi
                                            </button>
                                        )}
                                    </div>
                                )}

                                {step === 3 && (
                                    <div>
                                        <StepTitle
                                            title="Ticket"
                                            sub="Riferimento ticket."
                                            completed={!!formData.ticket}
                                        />
                                        <button
                                            onClick={() =>
                                                setActiveSearch("ticket")
                                            }
                                            className={`w-full p-6 bg-white border rounded-3xl text-left shadow-sm flex items-center justify-between active:bg-zinc-50 ${
                                                formData.ticket
                                                    ? "border-teal-200"
                                                    : "border-zinc-200"
                                            }`}>
                                            <span
                                                className={`text-lg font-semibold ${
                                                    formData.ticket
                                                        ? "text-zinc-900"
                                                        : "text-zinc-300"
                                                }`}>
                                                {formData.ticket?.name ||
                                                    "Cerca Ticket..."}
                                            </span>
                                            <Icons.TicketIcon
                                                className={`w-6 h-6 ${
                                                    formData.ticket
                                                        ? "text-teal-500"
                                                        : "text-zinc-300"
                                                }`}
                                            />
                                        </button>
                                        {formData.ticket && (
                                            <button
                                                onClick={() =>
                                                    update("ticket", null)
                                                }
                                                className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase ml-2 tracking-widest">
                                                <Icons.XMarkIcon
                                                    className="w-3.5 h-3.5"
                                                    strokeWidth={3}
                                                />{" "}
                                                Rimuovi
                                            </button>
                                        )}
                                    </div>
                                )}

                                {step === 4 && (
                                    <div>
                                        <StepTitle
                                            title="Servizio"
                                            sub="Attività svolta."
                                            required
                                            completed={!!formData.servizio}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            {res.servizi.map((s) => (
                                                <button
                                                    key={s.id}
                                                    onClick={() =>
                                                        update("servizio", s)
                                                    }
                                                    className={`p-4 rounded-2xl border transition-all flex flex-col items-start gap-3 ${
                                                        formData.servizio
                                                            ?.id === s.id
                                                            ? "border-orange-500 bg-orange-50/40"
                                                            : "border-zinc-200 bg-white"
                                                    }`}>
                                                    <div
                                                        className={`p-2 rounded-lg ${
                                                            formData.servizio
                                                                ?.id === s.id
                                                                ? "bg-orange-500 text-white"
                                                                : "bg-zinc-50 text-zinc-400"
                                                        }`}>
                                                        <Icons.CommandLineIcon className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase text-left leading-tight">
                                                        {s.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {step === 5 && (
                                    <div>
                                        <StepTitle
                                            title="Opzioni"
                                            sub="Contratto."
                                            completed={!!formData.opzioni}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            {res.opzioni.map((o) => (
                                                <button
                                                    key={o.id}
                                                    onClick={() =>
                                                        update("opzioni", o)
                                                    }
                                                    className={`p-4 min-h-[80px] rounded-2xl border transition-all flex items-center justify-center text-center ${
                                                        formData.opzioni?.id ===
                                                        o.id
                                                            ? "border-orange-500 bg-orange-50 text-orange-800 font-bold"
                                                            : "border-zinc-200 bg-white text-zinc-500"
                                                    }`}>
                                                    <span className="text-[10px] font-black uppercase">
                                                        {o.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        {formData.opzioni && (
                                            <button
                                                onClick={() =>
                                                    update("opzioni", null)
                                                }
                                                className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase ml-2 tracking-widest">
                                                <Icons.XMarkIcon
                                                    className="w-3.5 h-3.5"
                                                    strokeWidth={3}
                                                />{" "}
                                                Rimuovi
                                            </button>
                                        )}
                                    </div>
                                )}

                                {step === 6 && (
                                    <div>
                                        <StepTitle
                                            title="Tempi"
                                            sub="Data e ore."
                                            required
                                            completed={
                                                !!formData.data &&
                                                !!formData.tempoLavoro
                                            }
                                        />
                                        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden divide-y divide-zinc-100 shadow-sm">
                                            <div className="p-6 flex items-center justify-between">
                                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                                    Giorno
                                                </span>
                                                <input
                                                    type="date"
                                                    className="font-semibold text-lg outline-none text-right bg-transparent"
                                                    value={formData.data}
                                                    onChange={(e) =>
                                                        update(
                                                            "data",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="p-6 flex items-center justify-between">
                                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                                    Lavoro
                                                </span>
                                                <input
                                                    type="time"
                                                    step="900"
                                                    className="font-bold text-4xl outline-none text-orange-600 text-right bg-transparent"
                                                    value={formData.tempoLavoro}
                                                    min="00:00"
                                                    max="12:00"
                                                    onChange={(e) =>
                                                        update(
                                                            "tempoLavoro",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="p-6 flex items-center justify-between">
                                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                                    Trasferta
                                                </span>
                                                <input
                                                    type="time"
                                                    step="900"
                                                    min="00:00"
                                                    max="12:00"
                                                    className="font-bold text-xl outline-none text-zinc-400 text-right bg-transparent"
                                                    value={
                                                        formData.tempoTrasferta
                                                    }
                                                    onChange={(e) =>
                                                        update(
                                                            "tempoTrasferta",
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 7 && (
                                    <div className="h-full flex flex-col">
                                        <StepTitle
                                            title="Descrizione"
                                            sub="Cosa hai fatto?"
                                            required
                                            completed={
                                                formData.descrizione.length > 3
                                            }
                                        />
                                        <textarea
                                            autoFocus
                                            maxLength={MAX_DESC_LENGTH}
                                            className={`flex-1 min-h-[300px] w-full p-6 text-lg font-medium bg-white border rounded-3xl outline-none ${
                                                formData.descrizione.length > 3
                                                    ? "border-teal-200 focus:border-teal-400"
                                                    : "border-zinc-200 focus:border-orange-300"
                                            }`}
                                            placeholder="Dettagli attività..."
                                            value={formData.descrizione}
                                            onChange={(e) =>
                                                update(
                                                    "descrizione",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                )}

                                {step === 8 && (
                                    <div className="space-y-4">
                                        <StepTitle
                                            title="Note Extra"
                                            sub="Note aggiuntive."
                                        />
                                        <input
                                            className="w-full p-5 bg-white border border-zinc-200 rounded-2xl font-semibold outline-none focus:border-zinc-400"
                                            placeholder="Note interne..."
                                            value={formData.noteInterne}
                                            onChange={(e) =>
                                                update(
                                                    "noteInterne",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <input
                                            className="w-full p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 font-semibold outline-none focus:border-red-300"
                                            placeholder="Nota rifiuto..."
                                            value={formData.notaRifiuto}
                                            onChange={(e) =>
                                                update(
                                                    "notaRifiuto",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                )}

                                {/* --- 9. RIEPILOGO RECAP --- */}
                                {step === 9 && (
                                    <div className="animate-in zoom-in-95 duration-300">
                                        <StepTitle
                                            title="Riepilogo Totale"
                                            sub="Verifica ogni dettaglio prima di registrare."
                                            required
                                            completed={isStepValid}
                                        />
                                        <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm space-y-1 mb-8 text-left">
                                            <RecapRow
                                                label="Utente"
                                                value={formData.utente?.name}
                                                icon={Icons.UserCircleIcon}
                                            />
                                            <RecapRow
                                                label="Cliente"
                                                value={formData.azienda?.name}
                                                icon={Icons.BuildingOffice2Icon}
                                            />
                                            <RecapRow
                                                label="Progetto"
                                                value={formData.progetto?.name}
                                                icon={Icons.FolderIcon}
                                            />
                                            <RecapRow
                                                label="Ticket"
                                                value={formData.ticket?.name}
                                                icon={Icons.TicketIcon}
                                            />
                                            <RecapRow
                                                label="Servizio"
                                                value={formData.servizio?.name}
                                                icon={Icons.CommandLineIcon}
                                                colorClass="text-orange-600"
                                            />
                                            <RecapRow
                                                label="Contratto"
                                                value={formData.opzioni?.name}
                                                icon={Icons.ShieldCheckIcon}
                                            />
                                            <RecapRow
                                                label="Data"
                                                value={formData.data}
                                                icon={Icons.CalendarIcon}
                                            />
                                            <RecapRow
                                                label="Tempo Lavoro"
                                                value={formData.tempoLavoro}
                                                icon={Icons.ClockIcon}
                                                colorClass="text-orange-600"
                                            />
                                            <RecapRow
                                                label="Tempo Trasferta"
                                                value={formData.tempoTrasferta}
                                                icon={Icons.ClockIcon}
                                            />
                                            <div className="pt-4 mt-4 border-t border-zinc-100">
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                                                    Descrizione Attività
                                                </span>
                                                <p className="text-sm font-medium italic text-zinc-600 leading-relaxed">
                                                    "{formData.descrizione}"
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <button
                                                onClick={() =>
                                                    handleSaveBase("finish")
                                                }
                                                disabled={
                                                    isSaving || !isStepValid
                                                }
                                                className="w-full h-16 bg-zinc-900 text-white rounded-3xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all">
                                                Invia e Chiudi{" "}
                                                <Icons.PaperAirplaneIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleSaveBase("continue")
                                                }
                                                disabled={
                                                    isSaving || !isStepValid
                                                }
                                                className="w-full h-16 bg-orange-600 text-white rounded-3xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all">
                                                Invia e Aggiungi Extra{" "}
                                                <Icons.ChevronRightIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* --- 10. HUB DECISIONALE --- */}
                                {step === 10 && (
                                    <div className="animate-in slide-in-from-bottom duration-500 text-center">
                                        <Icons.CheckCircleIcon className="w-16 h-16 text-teal-500 mx-auto mb-6" />
                                        <h2 className="text-2xl font-black uppercase tracking-tight">
                                            Cosa vuoi aggiungere?
                                        </h2>
                                        <div className="grid gap-4 mt-10">
                                            <button
                                                onClick={() => setStep(11)}
                                                className="p-6 bg-white border border-zinc-200 rounded-3xl flex items-center gap-4 active:scale-95 shadow-sm">
                                                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                                                    <Icons.InboxStackIcon className="w-6 h-6" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-zinc-800">
                                                        Aggiungi Materiali
                                                    </p>
                                                    <p className="text-xs text-zinc-400 font-medium">
                                                        {
                                                            formData.materiali
                                                                .length
                                                        }{" "}
                                                        prodotti in lista
                                                    </p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setStep(13)}
                                                className="p-6 bg-white border border-zinc-200 rounded-3xl flex items-center gap-4 active:scale-95 shadow-sm">
                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                                    <Icons.PaperClipIcon className="w-6 h-6" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-zinc-800">
                                                        Carica Allegati
                                                    </p>
                                                    <p className="text-xs text-zinc-400 font-medium">
                                                        {
                                                            formData.allegati
                                                                .length
                                                        }{" "}
                                                        file pronti
                                                    </p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (timesheetId) {
                                                        handleSignTimesheet({
                                                            recordid:
                                                                timesheetId.toString(),
                                                        });
                                                    } else {
                                                        toast.error(
                                                            "Salva prima il timesheet per poterlo firmare"
                                                        );
                                                    }
                                                }}
                                                className="p-6 bg-white border border-zinc-200 rounded-3xl flex items-center gap-4 active:scale-95 shadow-sm">
                                                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                                                    <Icons.PencilSquareIcon className="w-6 h-6" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-zinc-800">
                                                        Firma e scarica
                                                    </p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (timesheetId) {
                                                        swissbixPrintTimesheet({
                                                            recordid:
                                                                timesheetId.toString(),
                                                        });
                                                    } else {
                                                        toast.error(
                                                            "Salva prima il timesheet per poterlo firmare"
                                                        );
                                                    }
                                                }}
                                                className="p-6 bg-white border border-zinc-200 rounded-3xl flex items-center gap-4 active:scale-95 shadow-sm">
                                                <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
                                                    <Icons.PrinterIcon className="w-6 h-6" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-zinc-800">
                                                        Stampa
                                                    </p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setIsSuccess(true)
                                                }
                                                className="mt-10 p-6 bg-zinc-900 text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 w-full active:scale-95 transition-all shadow-lg">
                                                <Icons.FlagIcon className="w-5 h-5" />
                                                <span>Ho finito tutto</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* --- 11-12. MATERIALI --- */}
                                {step === 11 && (
                                    <div>
                                        <StepTitle
                                            title="Materiali"
                                            sub="Lista locale materiali usati."
                                        />
                                        {formData.materiali.map((m) => (
                                            <div
                                                key={m.id}
                                                className="bg-white p-5 rounded-2xl border mb-3 flex justify-between items-center shadow-sm">
                                                <span className="font-bold text-sm text-zinc-800">
                                                    {m.prodotto?.name} (x
                                                    {m.qtaEffettiva})
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        update(
                                                            "materiali",
                                                            formData.materiali.filter(
                                                                (x) =>
                                                                    x.id !==
                                                                    m.id
                                                            )
                                                        )
                                                    }
                                                    className="text-red-300 hover:text-red-500 transition-colors">
                                                    <Icons.TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() =>
                                                setShowAddMaterial(true)
                                            }
                                            className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 font-bold flex flex-col items-center gap-2 hover:bg-zinc-50 transition-colors">
                                            <Icons.PlusIcon className="w-6 h-6" />{" "}
                                            Nuovo Materiale
                                        </button>
                                        {formData.materiali.length > 0 && (
                                            <button
                                                onClick={() => setStep(12)}
                                                className="w-full mt-8 h-16 bg-orange-600 text-white rounded-2xl font-bold shadow-lg">
                                                Vai al Riepilogo Invio
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setStep(10)}
                                            className="w-full mt-6 flex items-center justify-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-800 uppercase tracking-widest transition-all">
                                            <Icons.ChevronLeftIcon
                                                className="w-4 h-4"
                                                strokeWidth={3}
                                            />{" "}
                                            <span>Torna alla Scelta</span>
                                        </button>
                                    </div>
                                )}

                                {step === 12 && (
                                    <div className="animate-in zoom-in-95">
                                        <StepTitle
                                            title="Conferma Materiali"
                                            sub="Verifica ed invia in blocco."
                                            completed
                                        />
                                        <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] space-y-3 mb-8 shadow-xl">
                                            {formData.materiali.map((m) => (
                                                <div
                                                    key={m.id}
                                                    className="flex justify-between border-b border-zinc-800 pb-2 text-sm font-semibold last:border-0">
                                                    <span className="truncate pr-4">
                                                        {m.prodotto?.name}
                                                    </span>
                                                    <span className="text-orange-400 font-mono shrink-0">
                                                        x{m.qtaEffettiva}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-4">
                                            <button
                                                onClick={() =>
                                                    handleSaveAllMaterials(
                                                        "finish"
                                                    )
                                                }
                                                disabled={isSaving}
                                                className="w-full h-16 bg-zinc-900 text-white rounded-3xl font-bold active:scale-95 shadow-lg">
                                                Invia e Termina
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleSaveAllMaterials(
                                                        "hub"
                                                    )
                                                }
                                                disabled={isSaving}
                                                className="w-full h-16 bg-orange-600 text-white rounded-3xl font-bold active:scale-95 shadow-lg">
                                                Invia e Torna alla Scelta
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* --- 13-14. ALLEGATI --- */}
                                {step === 13 && (
                                    <div>
                                        <StepTitle
                                            title="Allegati"
                                            sub="Seleziona i file da caricare."
                                        />
                                        {formData.allegati.map((a, i) => (
                                            <div
                                                key={i}
                                                className="bg-white p-5 rounded-2xl border mb-3 flex justify-between items-center shadow-sm">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Icons.DocumentIcon className="w-5 h-5 text-blue-500" />
                                                    <p className="font-bold text-sm truncate">
                                                        {a.filename}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        update(
                                                            "allegati",
                                                            formData.allegati.filter(
                                                                (_, idx) =>
                                                                    idx !== i
                                                            )
                                                        )
                                                    }
                                                    className="text-red-300 hover:text-red-500 transition-colors">
                                                    <Icons.TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() =>
                                                setShowAddAllegato(true)
                                            }
                                            className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 font-bold flex flex-col items-center gap-2 hover:bg-zinc-50 transition-colors">
                                            <Icons.PlusIcon className="w-6 h-6" />{" "}
                                            Scegli File
                                        </button>
                                        {formData.allegati.length > 0 && (
                                            <button
                                                onClick={() => setStep(14)}
                                                className="w-full mt-8 h-16 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">
                                                Vai al Riepilogo File
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setStep(10)}
                                            className="w-full mt-6 flex items-center justify-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-800 uppercase tracking-widest transition-all">
                                            <Icons.ChevronLeftIcon
                                                className="w-4 h-4"
                                                strokeWidth={3}
                                            />{" "}
                                            <span>Torna alla Scelta</span>
                                        </button>
                                    </div>
                                )}

                                {step === 14 && (
                                    <div className="animate-in zoom-in-95">
                                        <StepTitle
                                            title="Invia Allegati"
                                            sub="Riepilogo caricamento file."
                                            completed
                                        />
                                        <div className="bg-white border p-8 rounded-[2.5rem] space-y-3 mb-8 shadow-sm">
                                            {formData.allegati.map((a, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-4 text-sm font-semibold text-zinc-600 border-b border-zinc-50 pb-2 last:border-0">
                                                    <Icons.PaperClipIcon className="w-4 h-4 text-blue-500" />
                                                    {a.filename}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-4">
                                            <button
                                                onClick={() =>
                                                    handleSaveAllAttachments(
                                                        "finish"
                                                    )
                                                }
                                                disabled={isSaving}
                                                className="w-full h-16 bg-zinc-900 text-white rounded-3xl font-bold active:scale-95 shadow-lg">
                                                Carica e Chiudi
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleSaveAllAttachments(
                                                        "hub"
                                                    )
                                                }
                                                disabled={isSaving}
                                                className="w-full h-16 bg-blue-700 text-white rounded-3xl font-bold active:scale-95 shadow-lg">
                                                Carica e Torna alla Scelta
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </main>

                            <PopUpManager
                                isOpen={isPopupOpen}
                                onClose={() => setIsPopupOpen(false)}
                                type={popUpType}
                                recordid={popupRecordId}
                                infoData={infoData}
                            />

                            {/* FOOTER NAVIGAZIONE (SOLO STEP < 9) */}
                            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-zinc-100 flex gap-3 z-[100]">
                                {step > 1 && step < 10 && (
                                    <button
                                        onClick={() => setStep((s) => s - 1)}
                                        className="p-4 rounded-2xl border border-zinc-200 text-zinc-400 active:scale-90 transition-all">
                                        <Icons.ChevronLeftIcon
                                            className="w-6 h-6"
                                            strokeWidth={2.5}
                                        />
                                    </button>
                                )}
                                {step < 9 && (
                                    <button
                                        disabled={!isStepValid || isSaving}
                                        onClick={() => setStep((s) => s + 1)}
                                        className={`flex-1 h-14 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
                                            !isStepValid
                                                ? "bg-zinc-100 text-zinc-400 shadow-none"
                                                : "bg-orange-600 text-white active:scale-95"
                                        }`}>
                                        Prosegui{" "}
                                        <Icons.ChevronRightIcon
                                            className="w-5 h-5"
                                            strokeWidth={3}
                                        />
                                    </button>
                                )}
                            </footer>

                            {/* --- MODALE RICERCA --- */}
                            {activeSearch && (
                                <div className="fixed inset-0 z-[300] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
                                    {/* Header del Modale */}
                                    <div className="p-5 border-b flex items-center justify-between bg-zinc-50">
                                        <button
                                            onClick={() => {
                                                setActiveSearch(null);
                                                setSearchQuery("");
                                            }}
                                            className="p-2 text-zinc-400 active:scale-90 transition-all">
                                            <Icons.XMarkIcon className="w-6 h-6" />
                                        </button>
                                        <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">
                                            Ricerca {activeSearch}
                                        </span>
                                        <div className="w-10"></div>{" "}
                                    </div>
                                    <div className="p-6">
                                        <div className="relative">
                                            <input
                                                autoFocus
                                                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-3xl font-semibold outline-none focus:bg-white focus:border-orange-500 transition-all"
                                                placeholder="Inizia a scrivere per cercare..."
                                                value={searchQuery}
                                                onChange={(e) =>
                                                    setSearchQuery(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            {searchLoading && (
                                                <div className="absolute right-4 top-4">
                                                    <Icons.ArrowPathIcon className="w-6 h-6 text-orange-500 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lista Risultati */}
                                    <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-2">
                                        {searchResults.length === 0 &&
                                        !searchLoading &&
                                        searchQuery.length > 1 ? (
                                            <div className="text-center py-20">
                                                <Icons.MagnifyingGlassIcon className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                                                <p className="text-zinc-400 text-sm font-medium">
                                                    Nessun risultato trovato per
                                                    "{searchQuery}"
                                                </p>
                                            </div>
                                        ) : (
                                            searchResults.map(
                                                (item: ListItem) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            if (
                                                                activeSearch ===
                                                                "prodotto"
                                                            ) {
                                                                setTempMaterial(
                                                                    {
                                                                        ...tempMaterial,
                                                                        prodotto:
                                                                            item,
                                                                    }
                                                                );
                                                            } else if (
                                                                activeSearch ===
                                                                "rapportiLavoro"
                                                            ) {
                                                                setTempAllegato(
                                                                    {
                                                                        ...tempAllegato,
                                                                        rapportiLavoro:
                                                                            item,
                                                                    }
                                                                );
                                                            } else if (
                                                                activeSearch ===
                                                                "progettoAllegato"
                                                            ) {
                                                                setTempAllegato(
                                                                    {
                                                                        ...tempAllegato,
                                                                        progetto:
                                                                            item,
                                                                    }
                                                                );
                                                            } else {
                                                                update(
                                                                    activeSearch!,
                                                                    item
                                                                );
                                                            }
                                                            setActiveSearch(
                                                                null
                                                            );
                                                            setSearchQuery("");
                                                        }}
                                                        className="w-full text-left p-5 bg-zinc-50 rounded-2xl font-semibold flex justify-between items-center group active:bg-zinc-800 active:text-white transition-all border border-transparent hover:border-zinc-200">
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm truncate">
                                                                {item.name}
                                                            </p>
                                                            {item.details && (
                                                                <p className="text-[10px] font-normal text-zinc-400 group-active:text-zinc-300 truncate">
                                                                    {
                                                                        item.details
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Icons.ChevronRightIcon className="w-5 h-5 text-zinc-300 group-active:text-white" />
                                                    </button>
                                                )
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- MODALE MATERIALE (TUTTI I CAMPI RIPRISTINATI) --- */}
                            {showAddMaterial && (
                                <div className="fixed inset-0 z-[200] bg-zinc-900/40 backdrop-blur-sm flex items-end">
                                    <div className="w-full bg-white rounded-t-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom max-w-lg mx-auto">
                                        <h3 className="text-center text-base font-black uppercase tracking-widest mb-8 text-zinc-400 leading-none">
                                            Dettaglio Materiale
                                        </h3>
                                        <div className="space-y-6 mb-10 text-left">
                                            <button
                                                onClick={() =>
                                                    setActiveSearch("prodotto")
                                                }
                                                className="w-full p-5 bg-zinc-50 border rounded-2xl text-left flex justify-between active:bg-zinc-100 group transition-all">
                                                <span
                                                    className={
                                                        tempMaterial.prodotto
                                                            ? "font-bold text-zinc-800"
                                                            : "text-zinc-400"
                                                    }>
                                                    {tempMaterial.prodotto
                                                        ?.name ||
                                                        "Seleziona Prodotto"}
                                                </span>
                                                <Icons.MagnifyingGlassIcon className="w-5 h-5 text-zinc-300 group-active:text-orange-500" />
                                            </button>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-zinc-50 p-4 rounded-2xl border">
                                                    <span className="text-[10px] font-black uppercase block text-zinc-400">
                                                        Prevista
                                                    </span>
                                                    <input
                                                        type="number"
                                                        className="bg-transparent font-bold outline-none w-full"
                                                        value={
                                                            tempMaterial.qtaPrevista
                                                        }
                                                        onChange={(e) =>
                                                            setTempMaterial({
                                                                ...tempMaterial,
                                                                qtaPrevista:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                                    <span className="text-[10px] font-black uppercase block text-orange-400">
                                                        Effettiva
                                                    </span>
                                                    <input
                                                        type="number"
                                                        className="bg-transparent font-bold outline-none w-full text-orange-600"
                                                        value={
                                                            tempMaterial.qtaEffettiva
                                                        }
                                                        onChange={(e) =>
                                                            setTempMaterial({
                                                                ...tempMaterial,
                                                                qtaEffettiva:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <input
                                                className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-semibold text-sm focus:border-orange-300 transition-colors"
                                                placeholder="Note aggiuntive..."
                                                value={tempMaterial.note}
                                                onChange={(e) =>
                                                    setTempMaterial({
                                                        ...tempMaterial,
                                                        note: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() =>
                                                    setShowAddMaterial(false)
                                                }
                                                className="flex-1 p-5 rounded-2xl font-bold text-zinc-400 text-xs uppercase">
                                                Annulla
                                            </button>
                                            <button
                                                disabled={
                                                    !tempMaterial.prodotto
                                                }
                                                onClick={() => {
                                                    update("materiali", [
                                                        ...formData.materiali,
                                                        {
                                                            ...tempMaterial,
                                                            id: Date.now(),
                                                        },
                                                    ]);
                                                    setShowAddMaterial(false);
                                                    setTempMaterial({
                                                        id: 0,
                                                        prodotto: null,
                                                        note: "",
                                                        qtaPrevista: "1",
                                                        qtaEffettiva: "1",
                                                    });
                                                }}
                                                className="flex-[2] h-16 bg-orange-600 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 active:scale-95 transition-all uppercase text-xs tracking-widest">
                                                Aggiungi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- MODALE ALLEGATO --- */}
                            {showAddAllegato && (
                                <div className="fixed inset-0 z-[200] bg-zinc-900/60 backdrop-blur-sm flex items-end">
                                    <div className="w-full bg-white rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom max-w-lg mx-auto overflow-y-auto max-h-[95dvh]">
                                        <div className="space-y-6 mb-10 text-left">
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    "Allegato generico",
                                                    "Signature",
                                                ].map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() =>
                                                            setTempAllegato({
                                                                ...tempAllegato,
                                                                tipo: t as any,
                                                            })
                                                        }
                                                        className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase ${
                                                            tempAllegato.tipo ===
                                                            t
                                                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                                                : "border-zinc-100 text-zinc-400"
                                                        }`}>
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="bg-zinc-50 p-8 rounded-3xl border-2 border-dashed border-zinc-200 text-center relative">
                                                <Icons.ArrowUpTrayIcon className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                                                <span className="text-[10px] font-black text-zinc-400 block uppercase mb-4 truncate px-4">
                                                    {tempAllegato.file
                                                        ? tempAllegato.file.name
                                                        : "Scegli un file"}
                                                </span>
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={(e) =>
                                                        e.target.files &&
                                                        setTempAllegato({
                                                            ...tempAllegato,
                                                            file: e.target
                                                                .files[0],
                                                            filename:
                                                                e.target
                                                                    .files[0]
                                                                    .name,
                                                        })
                                                    }
                                                />
                                                <button className="bg-white px-6 py-2 rounded-xl text-[10px] font-black border uppercase shadow-sm cursor-pointer transition-all active:scale-95">
                                                    Sfoglia
                                                </button>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setActiveSearch(
                                                        "rapportiLavoro"
                                                    )
                                                }
                                                className="w-full p-4 bg-zinc-50 border rounded-2xl text-left flex justify-between items-center group">
                                                <span
                                                    className={
                                                        tempAllegato.rapportiLavoro
                                                            ? "font-bold text-zinc-800"
                                                            : "text-zinc-400 text-xs"
                                                    }>
                                                    {tempAllegato.rapportiLavoro
                                                        ?.name ||
                                                        "Associa Rapporto di Lavoro"}
                                                </span>
                                                <Icons.MagnifyingGlassIcon className="w-4 h-4 text-zinc-300 group-active:text-orange-500" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setActiveSearch(
                                                        "progettoAllegato"
                                                    )
                                                }
                                                className="w-full p-4 bg-zinc-50 border rounded-2xl text-left flex justify-between items-center group">
                                                <span
                                                    className={
                                                        tempAllegato.progetto
                                                            ? "font-bold text-zinc-800"
                                                            : "text-zinc-400 text-xs"
                                                    }>
                                                    {tempAllegato.progetto
                                                        ?.name ||
                                                        "Associa Progetto"}
                                                </span>
                                                <Icons.MagnifyingGlassIcon className="w-4 h-4 text-zinc-300 group-active:text-orange-500" />
                                            </button>
                                            <input
                                                className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-semibold text-sm focus:border-blue-300"
                                                placeholder="Note allegato..."
                                                value={tempAllegato.note}
                                                onChange={(e) =>
                                                    setTempAllegato({
                                                        ...tempAllegato,
                                                        note: e.target.value,
                                                    })
                                                }
                                            />
                                            <input
                                                className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-semibold text-sm focus:border-blue-300"
                                                placeholder="Nome visualizzato file..."
                                                value={tempAllegato.filename}
                                                onChange={(e) =>
                                                    setTempAllegato({
                                                        ...tempAllegato,
                                                        filename:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() =>
                                                    setShowAddAllegato(false)
                                                }
                                                className="flex-1 p-5 rounded-2xl font-bold text-zinc-400 uppercase text-xs">
                                                Annulla
                                            </button>
                                            <button
                                                disabled={!tempAllegato.file}
                                                onClick={() => {
                                                    update("allegati", [
                                                        ...formData.allegati,
                                                        {
                                                            ...tempAllegato,
                                                            id: Date.now(),
                                                        },
                                                    ]);
                                                    setShowAddAllegato(false);
                                                    setTempAllegato({
                                                        id: 0,
                                                        tipo: "Allegato generico",
                                                        file: null,
                                                        filename: "",
                                                        data: new Date()
                                                            .toISOString()
                                                            .split("T")[0],
                                                        note: "",
                                                        rapportiLavoro: null,
                                                        progetto: null,
                                                    });
                                                }}
                                                className="flex-[2] h-16 bg-blue-600 text-white rounded-2xl font-bold shadow-lg disabled:opacity-50 active:scale-95 transition-all uppercase text-xs tracking-widest">
                                                Pronto
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isDev && (
                                <div className="fixed bottom-2 left-2 text-[8px] text-zinc-300 font-mono z-[500] pointer-events-none uppercase tracking-widest">
                                    Dev Mode: Step {step} | TS_ID:{" "}
                                    {timesheetId || "None"}
                                </div>
                            )}
                        </div>
                    </>
                );}}
        </GenericComponent>
    );
}
