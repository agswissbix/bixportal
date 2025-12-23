"use client";
import React, {
    useMemo,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";
import { useApi } from "@/utils/useApi";
import GenericComponent from "@/components/genericComponent";
import { AppContext } from "@/context/appContext";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast } from "sonner";

// HeroIcons v2 (Open Source)
import * as Icons from "@heroicons/react/24/outline";

const isDev = false;

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
    id: number
    tipo: "Allegato generico" | "Signature";
    file: File | null;
    filename: string;
    data: string;
    note: string;
    rapportiLavoro: ListItem | null;
    progetto: ListItem | null;
}

interface ResponseInterface {
    aziende: ListItem[];
    progetti: ListItem[];
    tickets: ListItem[];
    prodotti: ListItem[];
    servizi: ListItem[];
    rapporti: ListItem[];
    opzioni: ListItem[];
    utenteCorrente: ListItem;
}

export default function ProfessionalTimesheet() {
    const { user: contextUser } = useContext(AppContext);

    // COSTANTI
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

    // STATI TEMPORANEI MODALI
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
    const payload = useMemo(
        () => ({ apiRoute: "get_timesheet_initial_data" }),
        []
    );
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

    // --- RICERCA FILTRATA ---
    const filteredList = useMemo(() => {
        if (!activeSearch || !responseData) return [];
        const keyMap: any = {
            azienda: "aziende",
            progetto: "progetti",
            ticket: "tickets",
            prodotto: "prodotti",
            rapportiLavoro: "rapporti",
            progettoAllegato: "progetti",
        };
        const list = (responseData as any)[keyMap[activeSearch]] || [];
        if (!searchQuery) return list;
        return list.filter(
            (item: ListItem) =>
                (item?.name || "")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                (item.details &&
                    (item?.details || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()))
        );
    }, [activeSearch, searchQuery, responseData]);

    const update = (field: string, val: any) =>
        setFormData((p) => ({ ...p, [field]: val }));

    // --- VALIDAZIONE ---
    const isStepValid = useMemo(() => {
        switch (step) {
            case 4:
                return !!formData.servizio;
            case 6:
                return !!formData.data && !!formData.tempoLavoro;
            case 7:
                return formData.descrizione.trim().length > 1;
            default:
                return true;
        }
    }, [step, formData]);

    // --- SALVATAGGIO (LOGICA CARDSTEPS) ---
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const form = new FormData();
            form.append("apiRoute", "save_timesheet");

            const fieldsPayload = {
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
                materiali: formData.materiali.map((m) => ({
                    prodotto_id: m.prodotto?.id,
                    expectedquantity: m.qtaPrevista,
                    actualquantity: m.qtaEffettiva,
                    note: m.note,
                })),
            };

            form.append("fields", JSON.stringify(fieldsPayload));

            formData.allegati.forEach((a, i) => {
                if (a.file) {
                    form.append(`file_${i}`, a.file);
                    form.append(
                        `metadata_${i}`,
                        JSON.stringify({
                            tipo: a.tipo,
                            note: a.note,
                            filename: a.filename,
                            rapporto_id: a.rapportiLavoro?.id,
                            progetto_id: a.progetto?.id,
                        })
                    );
                }
            });

            const res = await axiosInstanceClient.post("/postApi", form);

            if (res.status === 200) {
                toast.success("Timesheet registrato correttamente");
                setIsSuccess(true);
            } else {
                toast.error(res.data.error || "Errore nel salvataggio");
            }
        } catch (err) {
            toast.error("Errore di rete");
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
        if (
            !value ||
            value === "00:00" ||
            (Array.isArray(value) && value.length === 0)
        )
            return null;
        return (
            <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
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
                <h2 className="text-3xl font-black uppercase">
                    Timesheet Inviato!
                </h2>
                <div className="w-full max-w-xs mt-10 space-y-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full h-16 bg-orange-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95">
                        <Icons.ArrowPathIcon className="w-5 h-5" />
                        Nuovo
                    </button>
                    <button
                        onClick={() => (window.location.href = "/home")}
                        className="w-full h-16 bg-zinc-100 text-zinc-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                        <Icons.HomeIcon className="w-5 h-5" />
                        Home
                    </button>
                </div>
            </div>
        );

    return (
        <GenericComponent
            response={responseData}
            loading={loading}
            error={error}>
            {(res: ResponseInterface) => (
                <div className="flex flex-col min-h-[100dvh] bg-[#F9FAFB] text-zinc-900 font-sans">
                    <div className="fixed top-0 left-0 right-0 h-1.5 flex z-[200] bg-white border-b border-zinc-100">
                        <div
                            className="h-full bg-orange-500 transition-all duration-500"
                            style={{ width: `${(step / 11) * 100}%` }}
                        />
                    </div>

                    <main className="flex-1 px-6 pt-12 pb-32 max-w-lg mx-auto w-full">
                        {/* 1. AZIENDA */}
                        {step === 1 && (
                            <div>
                                <StepTitle
                                    title="Cliente"
                                    sub="Azienda di riferimento."
                                    completed={!!formData.azienda}
                                />
                                <button
                                    onClick={() => setActiveSearch("azienda")}
                                    className={`w-full p-6 bg-white border rounded-3xl text-left shadow-sm flex items-center justify-between active:bg-zinc-50 ${
                                        formData.azienda
                                            ? "border-teal-200"
                                            : "border-zinc-200"
                                    }`}>
                                    <span
                                        className={`text-lg font-semibold ${
                                            formData.azienda
                                                ? "text-zinc-900"
                                                : "text-zinc-300"
                                        }`}>
                                        {formData.azienda?.name ||
                                            "Cerca Azienda..."}
                                    </span>
                                    <Icons.BuildingOffice2Icon
                                        className={`w-6 h-6 ${
                                            formData.azienda
                                                ? "text-teal-500"
                                                : "text-zinc-300"
                                        }`}
                                    />
                                </button>
                                {formData.azienda && (
                                    <button
                                        onClick={() => update("azienda", null)}
                                        className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase ml-2 tracking-widest">
                                        <Icons.XMarkIcon
                                            className="w-3.5 h-3.5"
                                            strokeWidth={3}
                                        />{" "}
                                        Rimuovi Scelta
                                    </button>
                                )}
                            </div>
                        )}

                        {/* 2. PROGETTO */}
                        {step === 2 && (
                            <div>
                                <StepTitle
                                    title="Progetto"
                                    sub="Associa a un progetto."
                                    completed={!!formData.progetto}
                                />
                                <button
                                    onClick={() => setActiveSearch("progetto")}
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
                                {formData.progetto && (
                                    <button
                                        onClick={() => update("progetto", null)}
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

                        {/* 3. TICKET */}
                        {step === 3 && (
                            <div>
                                <StepTitle
                                    title="Ticket"
                                    sub="Riferimento ticket."
                                    completed={!!formData.ticket}
                                />
                                <button
                                    onClick={() => setActiveSearch("ticket")}
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
                                        onClick={() => update("ticket", null)}
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

                        {/* 4. SERVIZIO */}
                        {step === 4 && (
                            <div>
                                <StepTitle
                                    title="Servizio"
                                    sub="Attività svolta."
                                    required
                                    completed={!!formData.servizio}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    {res.servizi.map((s) => {
                                        const IconComp =
                                            iconMap[s.icon_slug || ""] ||
                                            iconMap["default"];
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() =>
                                                    update("servizio", s)
                                                }
                                                className={`p-4 rounded-2xl border transition-all flex flex-col items-start gap-3 ${
                                                    formData.servizio?.id ===
                                                    s.id
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
                                                    <IconComp className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-left leading-tight">
                                                    {s.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 5. OPZIONI */}
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
                                            onClick={() => update("opzioni", o)}
                                            className={`p-4 min-h-[80px] rounded-2xl border transition-all flex items-center justify-center text-center ${
                                                formData.opzioni?.id === o.id
                                                    ? "border-orange-500 bg-orange-50 text-orange-800 font-bold"
                                                    : "border-zinc-200 bg-white text-zinc-500"
                                            }`}>
                                            <span className="text-[10px] font-black uppercase tracking-tight leading-tight">
                                                {o.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                {formData.opzioni && (
                                    <button
                                        onClick={() => update("opzioni", null)}
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

                        {/* 6. TEMPI */}
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
                                            className="font-semibold text-lg outline-none text-zinc-800 bg-transparent text-right"
                                            value={formData.data}
                                            onChange={(e) =>
                                                update("data", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="p-6 flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                            Lavoro
                                        </span>
                                        <input
                                            type="time"
                                            className="font-bold text-4xl outline-none text-orange-600 bg-transparent text-right"
                                            value={formData.tempoLavoro}
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
                                            className="font-bold text-xl outline-none text-zinc-400 bg-transparent text-right"
                                            value={formData.tempoTrasferta}
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

                        {/* 7. DESCRIZIONE */}
                        {step === 7 && (
                            <div className="h-full flex flex-col">
                                <StepTitle
                                    title="Descrizione"
                                    sub="Cosa hai fatto?"
                                    required
                                    completed={formData.descrizione.length > 3}
                                />
                                <div className="relative flex-1 flex flex-col">
                                    <textarea
                                        autoFocus
                                        maxLength={MAX_DESC_LENGTH}
                                        className={`flex-1 min-h-[300px] w-full p-6 text-lg font-medium bg-white border rounded-3xl outline-none transition-colors ${
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
                                    <div
                                        className={`absolute bottom-6 right-6 text-[10px] font-black px-2 py-1 rounded-lg ${
                                            formData.descrizione.length >=
                                            MAX_DESC_LENGTH
                                                ? "bg-red-500 text-white"
                                                : "bg-zinc-100 text-zinc-400"
                                        }`}>
                                        {formData.descrizione.length} /{" "}
                                        {MAX_DESC_LENGTH}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 8. EXTRA */}
                        {step === 8 && (
                            <div className="space-y-4">
                                <StepTitle
                                    title="Note Extra"
                                    sub="Note aggiuntive."
                                    completed={
                                        !!formData.noteInterne ||
                                        !!formData.notaRifiuto
                                    }
                                />
                                <input
                                    className="w-full p-5 bg-white border border-zinc-200 rounded-2xl font-semibold outline-none focus:border-zinc-400"
                                    placeholder="Note interne..."
                                    value={formData.noteInterne}
                                    onChange={(e) =>
                                        update("noteInterne", e.target.value)
                                    }
                                />
                                <input
                                    className="w-full p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 font-semibold outline-none"
                                    placeholder="Nota rifiuto..."
                                    value={formData.notaRifiuto}
                                    onChange={(e) =>
                                        update("notaRifiuto", e.target.value)
                                    }
                                />
                            </div>
                        )}

                        {/* 9. MATERIALI */}
                        {step === 9 && (
                            <div>
                                <StepTitle
                                    title="Materiali"
                                    sub="Prodotti usati."
                                    completed={formData.materiali.length > 0}
                                />
                                <div className="space-y-3 mb-6">
                                    {formData.materiali.map((m) => (
                                        <div
                                            key={m.id}
                                            className="bg-white p-5 rounded-2xl border border-zinc-200 flex justify-between items-center">
                                            <span className="font-bold text-sm">
                                                {m.prodotto?.name} (x
                                                {m.qtaEffettiva})
                                            </span>
                                            <button
                                                onClick={() =>
                                                    update(
                                                        "materiali",
                                                        formData.materiali.filter(
                                                            (x) => x.id !== m.id
                                                        )
                                                    )
                                                }
                                                className="text-zinc-300 active:text-red-500">
                                                <Icons.TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowAddMaterial(true)}
                                    className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 font-bold text-xs uppercase flex flex-col items-center gap-2 active:bg-zinc-50 transition-colors">
                                    <Icons.PlusIcon className="w-6 h-6" />{" "}
                                    Aggiungi Riga
                                </button>
                            </div>
                        )}

                        {/* 10. ALLEGATI */}
                        {step === 10 && (
                            <div>
                                <StepTitle
                                    title="Allegati"
                                    sub="Documentazione."
                                    completed={formData.allegati.length > 0}
                                />
                                <div className="space-y-3 mb-6">
                                    {formData.allegati.map((a, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white p-5 rounded-2xl border border-zinc-200 flex justify-between items-center">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                                    <Icons.DocumentIcon className="w-5 h-5" />
                                                </div>
                                                <div className="overflow-hidden text-left">
                                                    <p className="font-bold text-sm truncate max-w-[200px]">
                                                        {a.filename ||
                                                            a.file?.name}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400 uppercase font-black">
                                                        {a.tipo}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    update(
                                                        "allegati",
                                                        formData.allegati.filter(
                                                            (_, i) => i !== idx
                                                        )
                                                    )
                                                }
                                                className="text-zinc-300 active:text-red-500">
                                                <Icons.TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowAddAllegato(true)}
                                    className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 font-bold text-xs uppercase flex flex-col items-center gap-2 active:bg-zinc-50 transition-colors">
                                    <Icons.PlusIcon className="w-6 h-6" /> Nuovo
                                    Allegato
                                </button>
                            </div>
                        )}

                        {/* 11. RECAP TOTALE (TUTTO RIPRISTINATO) */}
                        {step === 11 && (
                            <div className="animate-in zoom-in-95 duration-300">
                                <StepTitle
                                    title="Recap"
                                    sub="Controlla tutto prima dell'invio."
                                    completed
                                />
                                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-sm space-y-1">
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
                                        label="Lavoro"
                                        value={formData.tempoLavoro}
                                        icon={Icons.ClockIcon}
                                        colorClass="text-orange-600"
                                    />
                                    <RecapRow
                                        label="Trasferta"
                                        value={formData.tempoTrasferta}
                                        icon={Icons.ClockIcon}
                                    />

                                    {formData.materiali.length > 0 && (
                                        <div className="pt-4 mt-4 border-t border-zinc-100 text-left">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                                                <Icons.ListBulletIcon className="w-3 h-3" />{" "}
                                                Materiali (
                                                {formData.materiali.length})
                                            </span>
                                            {formData.materiali.map((m) => (
                                                <p
                                                    key={m.id}
                                                    className="text-xs font-semibold text-zinc-600 flex justify-between tracking-tight">
                                                    <span>
                                                        • {m.prodotto?.name}
                                                    </span>
                                                    <span>
                                                        x{m.qtaEffettiva}
                                                    </span>
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {formData.allegati.length > 0 && (
                                        <div className="pt-4 mt-4 border-t border-zinc-100 text-left">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                                                <Icons.PaperClipIcon className="w-3 h-3" />{" "}
                                                Allegati (
                                                {formData.allegati.length})
                                            </span>
                                            {formData.allegati.map((a, i) => (
                                                <p
                                                    key={i}
                                                    className="text-[11px] text-zinc-500 italic truncate ml-2 mb-1">
                                                    📄 {a.filename || "Doc"}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    <div className="pt-4 mt-4 border-t border-zinc-100 text-left">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                                            Descrizione
                                        </span>
                                        <p className="text-sm font-medium italic text-zinc-600 leading-relaxed">
                                            "{formData.descrizione}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* FOOTER */}
                    <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-zinc-100 flex gap-3 z-[100]">
                        {step > 1 && (
                            <button
                                onClick={() => setStep((s) => s - 1)}
                                className="p-4 rounded-2xl border border-zinc-200 text-zinc-400 active:scale-90 transition-all">
                                <Icons.ChevronLeftIcon
                                    className="w-6 h-6"
                                    strokeWidth={2.5}
                                />
                            </button>
                        )}
                        <button
                            disabled={!isStepValid || isSaving}
                            onClick={() =>
                                step === 11
                                    ? handleSave()
                                    : setStep((s) => s + 1)
                            }
                            className={`flex-1 h-14 rounded-2xl font-bold tracking-tight shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                                !isStepValid
                                    ? "bg-zinc-100 text-zinc-400 shadow-none"
                                    : "bg-orange-600 text-white shadow-orange-200 hover:bg-orange-700"
                            }`}>
                            {isSaving
                                ? "Salvataggio..."
                                : step === 11
                                ? "Conferma Registrazione"
                                : "Prosegui"}
                            {!isSaving && isStepValid && (
                                <Icons.ChevronRightIcon
                                    className="w-5 h-5"
                                    strokeWidth={3}
                                />
                            )}
                        </button>
                    </footer>

                    {/* RICERCA (Z-INDEX 300) */}
                    {activeSearch && (
                        <div className="fixed inset-0 z-[300] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
                            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                                <button
                                    onClick={() => {
                                        setActiveSearch(null);
                                        setSearchQuery("");
                                    }}
                                    className="p-2 text-zinc-400 active:scale-90">
                                    <Icons.XMarkIcon className="w-6 h-6" />
                                </button>
                                <span className="font-bold text-zinc-800 uppercase text-[10px] tracking-widest">
                                    Scegli {activeSearch}
                                </span>
                                <div className="w-10"></div>
                            </div>
                            <div className="p-6 relative">
                                <Icons.MagnifyingGlassIcon className="absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                                <input
                                    autoFocus
                                    maxLength={MAX_SEARCH_LENGTH}
                                    className="w-full p-4 pl-12 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white focus:border-orange-200 font-semibold"
                                    placeholder="Scrivi per filtrare..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-2">
                                {filteredList.map((item: ListItem) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (activeSearch === "prodotto")
                                                setTempMaterial({
                                                    ...tempMaterial,
                                                    prodotto: item,
                                                });
                                            else if (
                                                activeSearch ===
                                                "rapportiLavoro"
                                            )
                                                setTempAllegato({
                                                    ...tempAllegato,
                                                    rapportiLavoro: item,
                                                });
                                            else if (
                                                activeSearch ===
                                                "progettoAllegato"
                                            )
                                                setTempAllegato({
                                                    ...tempAllegato,
                                                    progetto: item,
                                                });
                                            else update(activeSearch!, item);
                                            setActiveSearch(null);
                                            setSearchQuery("");
                                        }}
                                        className="w-full text-left p-5 bg-zinc-50 rounded-2xl font-semibold text-zinc-700 active:bg-zinc-800 active:text-white transition-all flex justify-between items-center group overflow-hidden">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <p className="group-active:text-white truncate font-bold">
                                                {item.name}
                                            </p>
                                            {item.details && (
                                                <p className="text-[10px] opacity-60 uppercase font-black truncate">
                                                    {item.details}
                                                </p>
                                            )}
                                        </div>
                                        <Icons.CheckCircleIcon className="w-5 h-5 opacity-0 group-active:opacity-100 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MODALE ALLEGATO (Z-INDEX 200) */}
                    {showAddAllegato && (
                        <div className="fixed inset-0 z-[200] bg-zinc-900/60 backdrop-blur-sm flex items-end">
                            <div className="w-full bg-white rounded-t-[3rem] p-8 shadow-2xl max-w-lg mx-auto overflow-y-auto max-h-[95dvh] animate-in slide-in-from-bottom duration-300">
                                <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-8"></div>
                                <div className="space-y-6 mb-10 text-left">
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            "Allegato generico",
                                            "Signature",
                                        ].map((t: any) => (
                                            <button
                                                key={t}
                                                onClick={() =>
                                                    setTempAllegato({
                                                        ...tempAllegato,
                                                        tipo: t,
                                                    })
                                                }
                                                className={`p-3 rounded-xl border-2 text-[9px] font-black transition-all ${
                                                    tempAllegato.tipo === t
                                                        ? "border-orange-500 bg-orange-50 text-orange-700"
                                                        : "border-zinc-100 text-zinc-400"
                                                }`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="bg-zinc-50 p-6 rounded-2xl border-2 border-dashed border-zinc-200 text-center relative">
                                        <Icons.ArrowUpTrayIcon className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                                        <span className="text-[10px] font-black text-zinc-400 block uppercase mb-4 truncate px-2">
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
                                                    file: e.target.files[0],
                                                    filename:
                                                        e.target.files[0].name,
                                                })
                                            }
                                        />
                                        <span className="bg-white px-4 py-2 rounded-lg text-[10px] font-black border border-zinc-100 active:scale-95 uppercase tracking-tighter cursor-pointer">
                                            Sfoglia
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 font-bold uppercase text-[10px] tracking-widest text-zinc-400">
                                            Filename
                                            <input
                                                className="w-full mt-2 bg-transparent text-sm font-bold text-zinc-800 outline-none"
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
                                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 font-bold uppercase text-[10px] tracking-widest text-zinc-400">
                                            Data
                                            <input
                                                type="date"
                                                className="w-full mt-2 bg-transparent text-sm font-bold text-zinc-800 outline-none"
                                                value={tempAllegato.data}
                                                onChange={(e) =>
                                                    setTempAllegato({
                                                        ...tempAllegato,
                                                        data: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-semibold text-sm"
                                        placeholder="Note aggiuntive..."
                                        rows={2}
                                        value={tempAllegato.note}
                                        onChange={(e) =>
                                            setTempAllegato({
                                                ...tempAllegato,
                                                note: e.target.value,
                                            })
                                        }
                                    />
                                    <button
                                        onClick={() =>
                                            setActiveSearch("rapportiLavoro")
                                        }
                                        className="w-full p-5 bg-white border-2 border-zinc-100 rounded-2xl text-left flex items-center justify-between active:bg-zinc-50 group transition-all">
                                        <span
                                            className={`text-sm font-bold ${
                                                tempAllegato.rapportiLavoro
                                                    ? "text-zinc-800"
                                                    : "text-zinc-300"
                                            }`}>
                                            {tempAllegato.rapportiLavoro
                                                ?.name ||
                                                "Rapporti di lavoro..."}
                                        </span>
                                        <Icons.ChevronRightIcon className="w-4 h-4 text-zinc-300 group-active:text-orange-500" />
                                    </button>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() =>
                                            setShowAddAllegato(false)
                                        }
                                        className="flex-1 p-5 rounded-2xl font-bold text-zinc-400 active:bg-zinc-50 transition-colors uppercase text-xs">
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
                                        className="flex-[2] h-16 bg-orange-600 text-white rounded-2xl font-bold shadow-lg disabled:bg-zinc-100 active:scale-95 transition-all uppercase text-xs tracking-widest">
                                        Salva
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODALE MATERIALE (Z-INDEX 200) */}
                    {showAddMaterial && (
                        <div className="fixed inset-0 z-[200] bg-zinc-900/40 backdrop-blur-sm flex items-end">
                            <div className="w-full bg-white rounded-t-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-300 max-w-lg mx-auto">
                                <h3 className="text-xl font-bold text-zinc-800 tracking-tight mb-8 text-center uppercase text-sm tracking-widest leading-none">
                                    Nuovo Materiale
                                </h3>
                                <div className="space-y-6 mb-10 text-left">
                                    <button
                                        onClick={() =>
                                            setActiveSearch("prodotto")
                                        }
                                        className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-2xl text-left flex items-center justify-between active:bg-zinc-100 group transition-all">
                                        <span
                                            className={`font-semibold ${
                                                tempMaterial.prodotto
                                                    ? "text-zinc-800"
                                                    : "text-zinc-400"
                                            }`}>
                                            {tempMaterial.prodotto?.name ||
                                                "Scegli Prodotto..."}
                                        </span>
                                        <Icons.MagnifyingGlassIcon className="w-5 h-5 text-zinc-300 group-active:text-orange-500" />
                                    </button>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 text-left text-zinc-400 font-bold uppercase text-[10px] tracking-widest">
                                            Q.tà Prevista
                                            <input
                                                type="number"
                                                className="w-full mt-2 bg-transparent text-xl font-bold text-zinc-800 outline-none"
                                                value={tempMaterial.qtaPrevista}
                                                onChange={(e) =>
                                                    setTempMaterial({
                                                        ...tempMaterial,
                                                        qtaPrevista:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-left text-orange-400 font-bold uppercase text-[10px] tracking-widest">
                                            Q.tà Effettiva
                                            <input
                                                type="number"
                                                className="w-full mt-2 bg-transparent text-xl font-bold text-orange-600 outline-none"
                                                value={
                                                    tempMaterial.qtaEffettiva
                                                }
                                                onChange={(e) =>
                                                    setTempMaterial({
                                                        ...tempMaterial,
                                                        qtaEffettiva:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <input
                                        className="w-full p-5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-semibold focus:border-orange-300 transition-colors"
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
                                        className="flex-1 p-5 rounded-2xl font-bold text-zinc-400 active:bg-zinc-50 uppercase text-xs">
                                        Annulla
                                    </button>
                                    <button
                                        disabled={!tempMaterial.prodotto}
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
                                        className="flex-[2] h-16 bg-orange-600 text-white rounded-2xl font-bold shadow-lg disabled:bg-zinc-100 active:scale-95 transition-all uppercase text-xs tracking-widest">
                                        Inserisci
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </GenericComponent>
    );
}
