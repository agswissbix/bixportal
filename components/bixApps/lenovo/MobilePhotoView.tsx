"use client";
import React, { useState, useEffect } from 'react';
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast, Toaster } from "sonner";
import * as Icons from "@heroicons/react/24/outline";
import SignaturePad from './SignaturePad';

interface Props {
    ticketId: string;
}

type ViewMode = 'home' | 'upload_photo' | 'upload_attachment' | 'signature';

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

    const [activeTab, setActiveTab] = useState<'photo' | 'attachments' | 'signature'>('photo');

    useEffect(() => {
        if (ticketId) {
            fetchData();
        }
    }, [ticketId]);

    useEffect(() => {
        if(ticket?.status === 'Aperto' && !ticket?.signatureUrl && activeTab === 'photo') {
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
                // Determine initial view based on status
                if (ticketRes.data.ticket.status === 'Aperto' && !ticketRes.data.ticket.signatureUrl) {
                    setActiveTab('signature');
                }
            } else {
                toast.error("Ticket not found");
            }

            if (attRes.data.success) {
                setAttachments(attRes.data.attachments);
            }
        } catch (err) {
            toast.error("Error loading data");
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
            }
            formData.append("apiRoute", apiRoute);

            const res = await axiosInstanceClient.post("/postApi", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data.success) {
                toast.success("Upload successful!");
                await fetchData(); // Refresh data
                resetUpload();
            } else {
                toast.error("Upload failed: " + res.data.error);
            }
        } catch (err) {
            toast.error("Network error during upload");
        } finally {
            setUploading(false);
        }
    };

    const handleSignatureSave = async (signatureData: string) => {
        setUploading(true);
        toast.loading("Saving signature...");
        try {
            const formData = new FormData();
            formData.append("apiRoute", "save_lenovo_signature");
            formData.append("recordid", ticketId);
            formData.append("img_base64", signatureData);

            const res = await axiosInstanceClient.post("/postApi", formData);
            if (res.data.success) {
                toast.success("Signature saved!");
                // Reload to show signed state
                window.location.reload();
            } else {
                toast.error("Failed to save signature");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error saving signature");
        } finally {
            setUploading(false);
            toast.dismiss();
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
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
                    onClick={() => setView('upload_photo')}
                    className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] cursor-pointer active:bg-zinc-800 transition-colors relative overflow-hidden"
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
                    onClick={() => setView('upload_attachment')}
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
                            onClick={() => setView('upload_attachment')}
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
                    Firma per ritiro del prodotto
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
                                        <p>Tap to capture</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>

                            {view === 'upload_attachment' && (
                                <input 
                                    type="text" 
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Note..."
                                    className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E2231A]"
                                />
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
                
                {/* Tab Content */}
                {view === 'home' && (
                    <>
                    {activeTab === 'photo' && renderPhotoTab()}
                    {activeTab === 'attachments' && renderAttachmentsTab()}
                    {activeTab === 'signature' && renderSignatureTab()}
                    </>
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
                        onClick={() => setActiveTab('signature')}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'signature' ? 'text-[#E2231A] bg-red-900/10' : 'text-gray-500'}`}
                    >
                        <Icons.PencilSquareIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Sign</span>
                    </button>
                </div>
            )}
        </div>
    );
}
