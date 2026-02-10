"use client";
import React, { useState, useEffect } from 'react';
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast, Toaster } from "sonner";
import * as Icons from "@heroicons/react/24/outline";

interface Props {
    ticketId: string;
}

type ViewMode = 'home' | 'upload_photo' | 'upload_attachment';

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

    useEffect(() => {
        if (ticketId) {
            fetchData();
        }
    }, [ticketId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketRes, attRes] = await Promise.all([
                axiosInstanceClient.post("/postApi", { apiRoute: "get_lenovo_ticket", ticket_id: ticketId }),
                axiosInstanceClient.post("/postApi", { apiRoute: "get_lenovo_attachments", ticket_id: ticketId })
            ]);

            if (ticketRes.data.success) {
                setTicket(ticketRes.data.ticket);
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

    if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
    if (!ticket) return <div className="flex items-center justify-center h-screen bg-black text-white">Ticket not found or invalid link.</div>;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
            <Toaster richColors position="top-center" />
            
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-zinc-900">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#E2231A] rounded flex items-center justify-center text-white font-bold text-xl" style={{ display: 'none' }} ref={(el) => {
                        const img = el?.nextElementSibling as HTMLImageElement;
                        if (img && el) {
                            const originalOnError = img.onerror;
                            img.onerror = (e) => {
                                if (originalOnError) (originalOnError as Function).call(img, e);
                                el.style.display = 'flex';
                            };
                        }
                    }}>
                        L
                    </div>
                    <img src="/bixdata/logos/lenovo.png" alt="Lenovo Logo" className="h-10" onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}/>
                    <span className="font-bold">Lenovo Service</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{ticket.serial}</span>
            </div>

            <main className="flex-1 p-4 overflow-y-auto">
                
                {view === 'home' && (
                    <div className="space-y-6">
                        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                            <h2 className="text-lg font-bold mb-1">{ticket.company_name || ticket.name}</h2>
                            <p className="text-gray-400 text-sm">Tap below to add photos or documents.</p>
                        </div>

                        {/* Product Photo Section */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Main Product Photo</h3>
                            <div 
                                onClick={() => setView('upload_photo')}
                                className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] cursor-pointer active:bg-zinc-800 transition-colors relative overflow-hidden"
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
                                        <Icons.CameraIcon className="w-10 h-10 text-[#E2231A] mb-2" />
                                        <span className="font-bold text-sm">Upload Product Photo</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Attachments</h3>
                            
                            <div className="space-y-3 mb-4">
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
                                    </div>
                                ))}
                                {attachments.length === 0 && (
                                    <p className="text-center text-gray-600 text-sm py-2">No attachments yet.</p>
                                )}
                            </div>

                            <button 
                                onClick={() => setView('upload_attachment')}
                                className="w-full py-3 bg-zinc-800 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:bg-zinc-700 transition-colors"
                            >
                                <Icons.PlusIcon className="w-4 h-4" /> Add Attachment
                            </button>
                        </div>
                    </div>
                )}

                {(view === 'upload_photo' || view === 'upload_attachment') && (
                    <div className="flex flex-col h-full">
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
                                        <p>Tap to take photo or upload</p>
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
                                    placeholder="Add a note (optional)..."
                                    className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E2231A]"
                                />
                            )}

                            <button 
                                onClick={handleUpload} 
                                disabled={!photo || uploading}
                                className="w-full py-4 bg-[#E2231A] rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
                            >
                                {uploading ? 'Uploading...' : 'Confirm Upload'}
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
