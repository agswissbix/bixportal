"use client";
import React, { useState, useEffect } from 'react';
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast, Toaster } from "sonner";
import * as Icons from "@heroicons/react/24/outline";
import SignaturePad from './SignaturePad';
import BarcodeScanner from './barcodeScanner';
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
    ticketId: string;
}

type ViewMode = 'home' | 'upload_photo' | 'upload_attachment' | 'signature' | 'completato';

export default function MobilePhotoView({ ticketId }: Props) {
    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState<any>(null);
    const [attachments, setAttachments] = useState<any[]>([]);
    
    const [view, setView] = useState<ViewMode>('home');
    const [uploading, setUploading] = useState(false);
    
    // Upload State
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [note, setNote] = useState("");
    const getAttachmentTypeByStatus = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'entrata' || s === 'diagnostica') return 'foto-diagnostica';
        if (s === 'diagnostica completata' || s === 'riparazione in corso' || s === 'ordine componenti' || s === 'attesa componenti') return 'foto-riparazione';
        return 'pre-intervento';
    };
    const [attachmentType, setAttachmentType] = useState("pre-intervento");

    const [activeTab, setActiveTab] = useState<'photo' | 'attachments' | 'signature' | 'summary'>('photo');
    const [completing, setCompleting] = useState(false);
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [scannedSuccess, setScannedSuccess] = useState(false);

    const mode = searchParams.get("mode");
    const [compName, setCompName] = useState("");
    const [oldSerial, setOldSerial] = useState("");
    const [newSerial, setNewSerial] = useState("");
    const [scanTarget, setScanTarget] = useState<'old'|'new'|null>(null);

    useEffect(() => {
        if (ticketId && ticketId !== 'search') {
            fetchData();
        } else if (ticketId === 'search') {
            setLoading(false);
        }
    }, [ticketId]);

    useEffect(() => {
        if(ticket?.status === 'Draft' && !ticket?.signatureUrl && activeTab === 'photo') {
             // Maybe don't auto-switch if we want them to take photo first.
             // User said "inquadro solo una volta", implies flow.
             // Let's stick to default 'photo' or 'signature' based on logic?
             // Actually, let's just let them choose via Navbar.
        }
    }, [ticket]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketRes, attRes] = await Promise.all([
                axiosInstanceClient.post("/postApi", { apiRoute: "get_lenovo_ticket", ticket_id: ticketId }),
                axiosInstanceClient.post("/postApi", { apiRoute: "get_lenovo_attachments", ticket_id: ticketId })
            ]);

            if (ticketRes.data.success) {
                setTicket(ticketRes.data.ticket);
                setAttachmentType(getAttachmentTypeByStatus(ticketRes.data.ticket.status));
                // Determine initial view based on status
                if (ticketRes.data.ticket.status === 'Riconsegnato') {
                    setActiveTab('summary');
                } else if (ticketRes.data.ticket.status === 'Riparato') {
                    setActiveTab('signature');
                } else if (ticketRes.data.ticket.status === 'Diagnostica') {
                    setActiveTab('attachments');
                } else if (ticketRes.data.ticket.status === 'Entrata') {
                    setActiveTab('attachments');
                } else if (ticketRes.data.ticket.product_photo === null || ticketRes.data.ticket.product_photo === '') {
                    setActiveTab('photo');
                } else {
                    setActiveTab('attachments');
                }
            } else {
                toast.error("Ticket non trovato");
            }

            if (attRes.data.success) {
                setAttachments(attRes.data.attachments);
            }
        } catch (err) {
            toast.error("Errore nel caricamento dei dati");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const resetUpload = () => {
        setPhoto(null);
        setPreview(null);
        setNote("");
        setView('home');
    };

    const handleUpload = async () => {
        if (!photo) return;
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("ticket_id", ticketId);
            formData.append("file", photo);

            let apiRoute = "";
            if (view === 'upload_photo') {
                apiRoute = "upload_lenovo_photo";
            } else {
                apiRoute = "upload_lenovo_attachment";
                formData.append("note", note);
                formData.append("attachment_type", attachmentType);
            }
            formData.append("apiRoute", apiRoute);

            const res = await axiosInstanceClient.post("/postApi", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data.success) {
                toast.success("Caricamento completato!");
                await fetchData(); // Refresh data
                resetUpload();
            } else {
                toast.error("Caricamento fallito: " + res.data.error);
            }
        } catch (err) {
            toast.error("Errore di rete durante il caricamento");
        } finally {
            setUploading(false);
        }
    };

    const handleSignatureSave = async (signatureData: string) => {
        setUploading(true);
        toast.loading("Salvataggio firma in corso...");
        try {
            const formData = new FormData();
            formData.append("apiRoute", "save_lenovo_signature");
            formData.append("recordid", ticketId);
            formData.append("img_base64", signatureData);
            formData.append("sig_type", (ticket.status === 'Draft' || ticket.status === 'Entrata' || !ticket.status) ? 'intake' : 'delivery');

            const res = await axiosInstanceClient.post("/postApi", formData);
            if (res.data.success) {
                toast.success("Firma salvata!");
                // Reload to show signed state
                window.location.reload();
            } else {
                toast.error("Impossibile salvare la firma");
            }
        } finally {
            setUploading(false);
            toast.dismiss();
        }
    };

    const handleComplete = async () => {
        setCompleting(true);
        try {
            const formData = new FormData();
            formData.append("apiRoute", "save_lenovo_ticket");
            formData.append("recordid", ticketId);
            
            const newStatus = ticket.signatureUrl ? "Completato" : "Completa ticket";
            const fields = {
                ...ticket,
                status: newStatus
            };
            
            formData.append("fields", JSON.stringify(fields));

            const res = await axiosInstanceClient.post("/postApi", formData);
            
            if (res.data.success) {
                toast.success("Ticket Completato!");
                setView('completato');
            } else {
                toast.error("Errore nel salvataggio del ticket: " + res.data.error);
            }
        } catch (err) {
            console.error(err);
            toast.error("Errore di rete");
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;


    if (ticketId === 'search') {
        const handleSendComponent = async () => {
            if (!sessionId) return;
            // Send exactly the same format as PC
            const newLine = `COMPONENT_DATA:${compName || 'Componente'} (Vecchio: ${oldSerial || '-'}, Nuovo: ${newSerial || '-'})`;
            const fd = new FormData();
            fd.append("apiRoute", "lenovo_mobile_handoff");
            fd.append("action", "set");
            fd.append("session_id", sessionId);
            fd.append("serial", newLine);
            await axiosInstanceClient.post("/postApi", fd);
            setScannedSuccess(true);
        };

        return (
            <div className="h-screen bg-black text-white flex flex-col font-sans">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-zinc-900 shrink-0">
                    <div className="flex items-center gap-2">
                        <img src="/bixdata/logos/lenovo.png" alt="Lenovo" className="h-6" />
                        <span className="font-bold text-sm">Service Intake Scanner</span>
                    </div>
                </div>
                <div className="flex-1 relative bg-black overflow-hidden flex flex-col items-center justify-center">
                    {scannedSuccess ? (
                        <div className="text-center p-8 animate-in zoom-in-95 duration-300">
                            <Icons.CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">Dati Inviati!</h2>
                            <p className="text-gray-400">Controlla lo schermo principale sul PC.</p>
                            <button 
                                onClick={() => {
                                    if (mode === 'components') {
                                        setScannedSuccess(false);
                                        setCompName(""); setOldSerial(""); setNewSerial("");
                                    } else {
                                        window.close();
                                    }
                                }}
                                className="mt-8 px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 w-full"
                            >
                                {mode === 'components' ? 'Inserisci Altro Componente' : 'Chiudi'}
                            </button>
                        </div>
                    ) : (
                        <div className="w-full h-full p-4 flex flex-col">
                            {mode === 'components' ? (
                                scanTarget ? (
                                    <div className="flex-1 flex flex-col rounded-2xl relative border-2 border-dashed border-gray-700 overflow-hidden bg-black animate-in fade-in">
                                        <div className="absolute top-0 inset-x-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
                                            <p className="text-white font-bold">Inquadra Seriale {scanTarget === 'old' ? 'VECCHIO' : 'NUOVO'}</p>
                                            <button onClick={() => setScanTarget(null)} className="p-2 bg-zinc-800 rounded-full text-white">
                                                <Icons.XMarkIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                        <div className="flex-1 w-full h-full relative">
                                            <BarcodeScanner 
                                                onDetected={(code) => {
                                                    if(scanTarget === 'old') setOldSerial(code);
                                                    if(scanTarget === 'new') setNewSerial(code);
                                                    setScanTarget(null);
                                                    toast.success("Acquisito: " + code);
                                                }}
                                                onClose={() => setScanTarget(null)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col pt-4">
                                        <h2 className="text-xl font-bold mb-4">Aggiunta Rapida Componente</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Componente</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Es. Batteria, Scheda Madre"
                                                    value={compName}
                                                    onChange={e => setCompName(e.target.value)}
                                                    className="w-full p-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white outline-none focus:border-[#E2231A]" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Vecchio Seriale</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Cerca o usa lo scanner"
                                                        value={oldSerial}
                                                        onChange={e => setOldSerial(e.target.value)}
                                                        className="w-full p-4 pr-14 bg-zinc-900 border border-zinc-700 rounded-xl text-white outline-none focus:border-[#E2231A]" 
                                                    />
                                                    <button 
                                                        onClick={() => setScanTarget('old')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 p-2 text-white rounded-lg hover:bg-zinc-700"
                                                    >
                                                        <Icons.QrCodeIcon className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Nuovo Seriale</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Cerca o usa lo scanner"
                                                        value={newSerial}
                                                        onChange={e => setNewSerial(e.target.value)}
                                                        className="w-full p-4 pr-14 bg-zinc-900 border border-zinc-700 rounded-xl text-white outline-none focus:border-[#E2231A]" 
                                                    />
                                                    <button 
                                                        onClick={() => setScanTarget('new')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 p-2 text-white rounded-lg hover:bg-zinc-700"
                                                    >
                                                        <Icons.QrCodeIcon className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8">
                                            <button 
                                                onClick={handleSendComponent}
                                                disabled={!compName && !oldSerial && !newSerial}
                                                className="w-full py-4 bg-[#E2231A] text-white rounded-xl font-bold shadow-lg hover:bg-red-700 disabled:opacity-50"
                                            >
                                                Invia Dati al PC
                                            </button>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="max-w-lg w-full text-center mx-auto">
                                    <p className="font-bold mb-4 p-4 text-lg">Inquadra il Codice a Barre</p>
                                    <div className="w-full h-[60vh] max-w-lg overflow-hidden rounded-2xl relative border-2 border-dashed border-gray-700">
                                        <BarcodeScanner 
                                            onDetected={async (code) => {
                                                if (window.confirm("Codice scansionato: " + code.slice(-8) + " Vuoi inviare i dati al PC (OK) o riprovare (Annulla)?")) {
                                                    if (sessionId) {
                                                        const fd = new FormData();
                                                        fd.append("apiRoute", "lenovo_mobile_handoff");
                                                        fd.append("action", "set");
                                                        fd.append("session_id", sessionId);
                                                        fd.append("serial", code.slice(-8));
                                                        await axiosInstanceClient.post("/postApi", fd);
                                                        setScannedSuccess(true);
                                                    } else {
                                                        window.location.href = `/bixApps/lenovo-intake?serial=${code.slice(-8)}`;
                                                    }
                                                } else {
                                                    window.location.reload();
                                                }
                                            }}
                                            onClose={() => {
                                                window.location.href = `/bixApps/bixMobileHub`;
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (!ticket) return <div className="flex items-center justify-center h-screen bg-black text-white">Ticket not found or invalid link.</div>;

    // Tab State
    // Derived view state for uploads (sub-views of tabs)
    // We can keep 'view' for the upload form overlay or just integrate it. 
    // Let's integrate it: The 'photo' tab shows current photo + generic upload button.
    
    // Check signature status on load to auto-switch?
    

    const renderPhotoTab = () => (
        <div className="space-y-6 pb-24">
             <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <h2 className="text-lg font-bold mb-1">{ticket.company_name || ticket.name}</h2>
                <p className="text-gray-400 text-sm">Status: <span className="text-[#E2231A]">{ticket.status}</span></p>
            </div>

            {/* Product Photo Section */}
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Main Product Photo</h3>
                <div 
                    onClick={() => {
                        if (!ticket.status || ticket.status === 'Draft' || ticket.status === 'Entrata') setView('upload_photo');
                        else toast.error('Non modificabile in questo stato');
                    }}
                    className={`bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] transition-colors relative overflow-hidden ${(!ticket.status || ticket.status === 'Draft' || ticket.status === 'Entrata') ? 'cursor-pointer active:bg-zinc-800' : 'opacity-75 cursor-not-allowed'}`}
                >
                    {ticket.product_photo ? (
                        <>
                            <img src={`/api/media-proxy?url=${ticket.product_photo}`} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                            <div className="relative z-10 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                                <Icons.ArrowPathIcon className="w-8 h-8 text-white mx-auto mb-1" />
                                <span className="text-xs font-bold">Change Photo</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <Icons.CameraIcon className="w-12 h-12 text-[#E2231A] mb-2" />
                            <span className="font-bold text-sm">Take Product Photo</span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="text-center">
                 <p className="text-xs text-gray-500">
                    Use the navigation bar below to switch between Photo, Attachments and Signature.
                 </p>
            </div>
        </div>
    );

    const renderAttachmentsTab = () => (
        <div className="space-y-4 pb-24">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Attachments ({attachments.length})</h3>
                <button 
                    onClick={() => { setAttachmentType(getAttachmentTypeByStatus(ticket?.status)); setView('upload_attachment'); }}
                    className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                >
                    <Icons.PlusIcon className="w-5 h-5 text-white" />
                </button>
            </div>
            
            <div className="space-y-3">
                {attachments.map(att => (
                    <div key={att.id} className="bg-zinc-900 p-3 rounded-lg flex items-center gap-3 border border-zinc-800">
                        <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center text-gray-400 shrink-0">
                            <Icons.DocumentIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold truncate text-white">{att.filename}</p>
                            {att.note && <p className="text-xs text-gray-400 truncate">{att.note}</p>}
                            <p className="text-[10px] text-gray-500">{att.date}</p>
                        </div>
                        <a href={`/api/media-proxy?url=${att.url}`} target="_blank" className="p-2 text-gray-500">
                            <Icons.EyeIcon className="w-5 h-5" />
                        </a>
                    </div>
                ))}
                {attachments.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-xl">
                        <Icons.PaperClipIcon className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                        <p className="text-zinc-500 text-sm">No attachments</p>
                        <button 
                            onClick={() => { setAttachmentType(getAttachmentTypeByStatus(ticket?.status)); setView('upload_attachment'); }}
                            className="mt-4 text-[#E2231A] font-bold text-sm"
                        >
                            + Add Attachment
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderSignatureTab = () => (
        <div className="flex flex-col h-full justify-center pb-24">
            <div className="bg-white rounded-xl overflow-hidden text-black shadow-lg">
                <div className="bg-[#E2231A] text-white p-3 font-bold text-center text-sm">
                    Firma per {ticket.status === 'Riparato' ? 'ritiro del prodotto' : 'consegna del prodotto'}
                </div>
                <div className="p-4 bg-gray-50 text-xs border-b border-gray-200 space-y-3">
                    <div>
                        <span className="text-gray-500 block mb-1">Cliente / Contatto</span>
                        <strong className="text-sm">{ticket.company_name || `${ticket.name || ''} ${ticket.surname || ''}`.trim()}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="text-gray-500 block mb-1">Prodotto</span>
                            <strong>{ticket.brand} {ticket.model}</strong>
                        </div>
                        <div>
                            <span className="text-gray-500 block mb-1">Seriale</span>
                            <strong className="font-mono bg-gray-200 px-1 rounded">{ticket.serial}</strong>
                        </div>
                    </div>
                    {ticket.problem_description && (
                        <div>
                            <span className="text-gray-500 block mb-1">Difetto / Problema</span>
                            <p className="font-medium text-gray-800 line-clamp-3">{ticket.problem_description}</p>
                        </div>
                    )}
                </div>
                <div className="bg-white p-2 text-center text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    Apponi la firma qui sotto
                </div>
                <SignaturePad onSave={handleSignatureSave} />
            </div>
        </div>
    );

    const renderSummaryTab = () => (
        <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <Icons.ClipboardDocumentCheckIcon className="w-6 h-6 text-[#E2231A]" />
                Sommario
            </h2>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-6">
                
                {/* Client Info */}
                <div>
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <Icons.UserIcon className="w-4 h-4 text-[#E2231A]" /> Dati Cliente
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-y-2 text-sm">
                        {ticket.company_name && <div><span className="text-gray-500 block text-xs">Azienda</span><span className="font-bold text-gray-200">{ticket.company_name}</span></div>}
                        {(ticket.name || ticket.surname) && <div><span className="text-gray-500 block text-xs">Contatto</span><span className="font-bold text-gray-200">{ticket.name} {ticket.surname}</span></div>}
                        {ticket.email && <div><span className="text-gray-500 block text-xs">Email</span><span className="font-medium text-gray-300">{ticket.email}</span></div>}
                        {ticket.phone && <div><span className="text-gray-500 block text-xs">Telefono</span><span className="font-medium text-gray-300">{ticket.phone}</span></div>}
                        {ticket.address && <div><span className="text-gray-500 block text-xs">Indirizzo</span><span className="font-medium text-gray-300">{ticket.address}, {ticket.place}</span></div>}
                    </div>
                </div>

                {/* Product Info */}
                <div>
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <Icons.ComputerDesktopIcon className="w-4 h-4 text-[#E2231A]" /> Prodotto e Accesso
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-y-2 text-sm">
                        {ticket.brand && <div><span className="text-gray-500 block text-xs">Dispositivo</span><span className="font-bold text-gray-200">{ticket.brand} {ticket.model}</span></div>}
                        {ticket.serial && <div><span className="text-gray-500 block text-xs">Seriale</span><span className="font-mono bg-zinc-800 px-1 border border-zinc-700 rounded text-gray-300">{ticket.serial}</span></div>}
                        {ticket.username && <div><span className="text-gray-500 block text-xs">Utente</span><span className="font-medium text-gray-300">{ticket.username}</span></div>}
                        {ticket.password && <div><span className="text-gray-500 block text-xs">Password/PIN</span><span className="font-medium font-mono bg-zinc-800 px-1 border border-zinc-700 rounded text-gray-300">{ticket.password}</span></div>}
                        {ticket.pick_up && <div><span className="text-gray-500 block text-xs">Pick Up</span><span className="font-medium text-gray-300">{ticket.pick_up}</span></div>}
                        {(ticket.accessories && ticket.accessories.length > 0) && <div><span className="text-gray-500 block text-xs">Accessori</span><span className="font-medium text-gray-300">{Array.isArray(ticket.accessories) ? ticket.accessories.join(", ") : ticket.accessories}</span></div>}
                    </div>
                </div>

                {/* Assistance Info */}
                <div>
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <Icons.WrenchScrewdriverIcon className="w-4 h-4 text-[#E2231A]" /> Assistenza
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-y-2 text-sm">
                        {ticket.problem_description && <div><span className="text-gray-500 block text-xs">Problema</span><span className="font-semibold text-gray-200">{ticket.problem_description}</span></div>}
                        <div><span className="text-gray-500 block text-xs">In Garanzia?</span><span className="font-bold text-gray-300">{ticket.warranty} {ticket.warranty === 'Si' ? `(${ticket.warranty_type})` : ''}</span></div>
                        <div><span className="text-gray-500 block text-xs">Auth. Ripristino</span><span className="font-bold text-gray-300">{ticket.auth_factory_reset}</span></div>
                        <div><span className="text-gray-500 block text-xs">Richiesta Preventivo</span><span className="font-bold text-gray-300">{ticket.request_quote}</span></div>
                        <div><span className="text-gray-500 block text-xs">Riparazione Diretta</span><span className="font-bold text-gray-300">{ticket.direct_repair} {ticket.direct_repair === 'Si' ? `(Max ${ticket.direct_repair_limit} CHF)` : ''}</span></div>
                        <div><span className="text-gray-500 block text-xs">Auth. Formattazione</span><span className="font-bold text-gray-300">{ticket.auth_formatting}</span></div>
                    </div>
                </div>

                {/* Multimedia & Allegati */}
                <div>
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                            <Icons.PaperClipIcon className="w-4 h-4 text-[#E2231A]" /> Allegati
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-y-2 text-sm">
                        <div><span className="text-gray-500 block text-xs">Foto Dispositivo</span>
                        <span className="font-bold text-gray-300">{ticket.product_photo ? 'Presente' : 'Non presente'}</span></div>
                        <div><span className="text-gray-500 block text-xs">Documenti/Altre foto</span>
                        <span className="font-bold text-gray-300">
                            {attachments.length > 0 
                                ? `${attachments.length} caricati` 
                                : 'Nessuno'}
                        </span></div>
                    </div>
                </div>
            </div>
            
            <div className="pt-6 border-t border-zinc-800 mt-6 flex justify-center">
                 <button 
                     onClick={handleComplete}
                     disabled={completing}
                     className="px-8 py-4 bg-[#E2231A] text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 w-full max-w-sm active:scale-95 disabled:opacity-50"
                 >
                     {completing ? 'Completamento...' : 'Completa Ticket'} <Icons.CheckBadgeIcon className="w-6 h-6" />
                 </button>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-black text-white flex flex-col font-sans overflow-hidden pb-20">
            <Toaster richColors position="top-center" />
            
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-zinc-900 shrink-0">
                <div className="flex items-center gap-2">
                    <img src="/bixdata/logos/lenovo.png" alt="Lenovo" className="h-6" />
                    <span className="font-bold text-sm">Service Intake</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{ticket.serial}</span>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 relative">
                {/* Upload Overlay (Modals) */}
                {(view === 'upload_photo' || view === 'upload_attachment') && (
                    <div className="absolute inset-0 z-50 bg-black flex flex-col p-4 animate-in slide-in-from-bottom-10">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={resetUpload} className="p-2 bg-zinc-800 rounded-full">
                                <Icons.ArrowLeftIcon className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold">
                                {view === 'upload_photo' ? 'Product Photo' : 'Add Attachment'}
                            </h2>
                        </div>

                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex-1 border-2 border-dashed border-zinc-700 rounded-2xl bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center p-6 text-gray-500">
                                        <Icons.CameraIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>Tap to capture or upload</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    accept={""}
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>

                            {view === 'upload_attachment' && (
                                <div className="space-y-4">
                                    <input 
                                        type="text" 
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Note..."
                                        className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E2231A]"
                                    />
                                    
                                    <Select
                                        value={attachmentType}
                                        onValueChange={setAttachmentType}
                                    >
                                        <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white h-[58px] rounded-xl focus:ring-[#E2231A] focus:border-[#E2231A] px-4">
                                            <SelectValue placeholder="Tipo di allegato..." />
                                        </SelectTrigger>
                                        <SelectContent className="">
                                            <SelectItem className="" value="pre-intervento">Foto pre-intervento</SelectItem>
                                            <SelectItem className="" value="foto-diagnostica">Foto diagnostica</SelectItem>
                                            <SelectItem className="" value="foto-riparazione">Foto riparazione</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <button 
                                onClick={handleUpload} 
                                disabled={!photo || uploading}
                                className="w-full py-4 bg-[#E2231A] rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                )}
                
                {view === 'home' && (
                    <>
                    {activeTab === 'photo' && renderPhotoTab()}
                    {activeTab === 'attachments' && renderAttachmentsTab()}
                    {activeTab === 'signature' && renderSignatureTab()}
                    {activeTab === 'summary' && renderSummaryTab()}
                    </>
                )}
                {view === 'completato' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center justify-center py-20 h-full">
                        <Icons.CheckCircleIcon className="w-24 h-24 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white text-center">Ticket Completato</h2>
                        <p className="text-gray-400 text-center max-w-md text-sm">
                            Il ticket è stato completato con successo. Puoi tornare alla Home o creare un nuovo ticket.
                        </p>
                        
                        <div className="flex flex-col gap-4 mt-8 w-full max-w-xs">
                            <button 
                                onClick={() => window.location.href = '/bixApps/bixMobileHub'}
                                className="px-6 py-4 bg-zinc-800 text-white rounded-xl font-bold shadow hover:bg-zinc-700 transition-all w-full text-center"
                            >
                                Home
                            </button>
                            <button 
                                onClick={() => window.location.reload()}
                                className="px-6 py-4 bg-transparent border-2 border-zinc-700 text-gray-300 rounded-xl font-bold shadow-sm hover:bg-zinc-800 transition-all w-full text-center"
                            >
                                Nuovo Ticket
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            {view === 'home' && (
                <div className="bg-zinc-900 border-t border-zinc-800 p-2 flex justify-around items-center shrink-0 safe-area-bottom">
                    <button 
                        onClick={() => setActiveTab('photo')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'photo' ? 'text-[#E2231A] bg-red-900/10' : 'text-gray-500'}`}
                    >
                        <Icons.CameraIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Photo</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('attachments')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'attachments' ? 'text-[#E2231A] bg-red-900/10' : 'text-gray-500'}`}
                    >
                        <Icons.PaperClipIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Files</span>
                    </button>
                    <button 
                        onClick={() => {
                            if (ticket.status === 'Riparato' || ticket.status === 'Entrata' || ticket.status === 'Draft' || !ticket.status) {
                                setActiveTab('signature');
                            } else {
                                toast.error('La firma è accessibile solo in fase di Ritiro o Consegna');
                            }
                        }}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'signature' ? 'text-[#E2231A] bg-red-900/10' : 'text-gray-500'} ${(ticket.status === 'Riparato' || ticket.status === 'Entrata' || ticket.status === 'Draft' || !ticket.status) ? '' : 'opacity-50 cursor-not-allowed'}`}
                    >
                        <Icons.PencilSquareIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Sign</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('summary')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'summary' ? 'text-[#E2231A] bg-red-900/10' : 'text-gray-500'}`}
                    >
                        <Icons.ClipboardDocumentCheckIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Summary</span>
                    </button>
                </div>
            )}
        </div>
    );
}
