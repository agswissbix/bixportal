"use client";
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useApi } from "@/utils/useApi";
import GenericComponent from "@/components/genericComponent";
import { AppContext } from "@/context/appContext";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast, Toaster } from "sonner";
import * as Icons from "@heroicons/react/24/outline";
import QRCode from "react-qr-code";

export default function LenovoIntake() {
    const { user, userName } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [loadingMethod, setLoadingMethod] = useState(false);
    
    // Search State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // QR State
    const [showQR, setShowQR] = useState(false);
    const [mobileUrl, setMobileUrl] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        recordid: "",
        reception_date: new Date().toISOString().split('T')[0],
        status: "Draft",
        
        // Client
        company_name: "", 
        name: "",
        surname: "",
        email: "",
        phone: "",
        recordidcompany_: "",

        // Product
        serial: "",
        product_photo: "", 
        ticket_id: "", 

        // Assistance
        problem_description: "",
    });

    // Field Settings
    const [fieldSettings, setFieldSettings] = useState<any>({});

    const payload = useMemo(() => {
        return {
          apiRoute: "get_lenovo_intake_context",
        }
      }, [])
    
      // CHIAMATA AL BACKEND (solo se non in sviluppo)
      const { response, loading, error } = useApi<any>(payload)
    
      // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
      useEffect(() => {
        if (response) {
          setFieldSettings(response.field_settings)
          console.log("Custom functions loaded:", response)
        }
      }, [response])

    // useEffect(() => {
    //     // Fetch Context
    //     axiosInstanceClient.post("/postApi", {
    //         apiRoute: "get_lenovo_intake_context"
    //     })
    //         .then(res => {
    //             if(res.data.success && res.data.field_settings) {
    //                 setFieldSettings(res.data.field_settings);
    //             }
    //         })
    //         .catch(console.error);
    // }, []);

    // Polling for photo and attachments update
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 2 && formData.recordid) {
            interval = setInterval(async () => {
                try {
                    // 1. Check Ticket/Photo
                    const resTicket = await axiosInstanceClient.post("/postApi", {
                        apiRoute: "get_lenovo_ticket",
                        ticket_id: formData.recordid
                    });
                    
                    if (resTicket.data.success) {
                        const serverPhoto = resTicket.data.ticket.product_photo;
                        
                        // Auto-close only if we didn't have a photo and now we do, AND QR is open
                        if (!formData.product_photo && serverPhoto && showQR) {
                            setFormData(prev => ({ ...prev, product_photo: serverPhoto }));
                            toast.success("Photo received from mobile!");
                            setShowQR(false);
                        } else if (serverPhoto !== formData.product_photo) {
                            setFormData(prev => ({ ...prev, product_photo: serverPhoto }));
                        }
                    }

                    // 2. Refresh Attachments
                    const resAtt = await axiosInstanceClient.post("/postApi", {
                        apiRoute: "get_lenovo_attachments",
                        ticket_id: formData.recordid
                    });
                    if(resAtt.data.success) {
                        // specialized comparison could save renders, but simple set is okay
                        setAttachments(resAtt.data.attachments);
                    }

                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [step, formData.recordid, formData.product_photo, showQR]);

    // Close search on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchCompanies = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const body = new FormData();
            body.append("apiRoute", "search_timesheet_entities");
            body.append("target", "azienda");
            body.append("q", query);
            
            const res = await axiosInstanceClient.post("/postApi", body);
            setSearchResults(res.data.results || []);
            setShowResults(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectCompany = (company: any) => {
        setFormData(prev => ({
            ...prev,
            company_name: company.name,
            recordidcompany_: company.id,
        }));
        setShowResults(false);
    };

    const validateStep = (currentStep: number) => {
        // Step 1: Client
        if (currentStep === 1) {
            const requiredFields = ['company_name', 'name', 'surname', 'email', 'phone'];
            for (const field of requiredFields) {
                if (fieldSettings[field]?.required && !formData[field as keyof typeof formData]) {
                    toast.error(`Please fill in required field: ${fieldSettings[field]?.label || field}`);
                    return false;
                }
            }
            // Minimal fallback if no specific strict requirements
            if (!formData.company_name && !formData.name && !formData.surname && !formData.email && !formData.phone) {
                 toast.error("Please fill in at least one contact detail");
                 return false;
            }
            return true;
        }

        // Step 2: Product
        if (currentStep === 2) {
            const requiredFields = ['serial'];
            for (const field of requiredFields) {
                 if (fieldSettings[field]?.required && !formData[field as keyof typeof formData]) {
                    toast.error(`Please fill in required field: ${fieldSettings[field]?.label || field}`);
                    return false;
                }
            }
             // Hard requirement: must have at least serial or photo if configured that way, 
             // but usually serial is key. 
             // Let's assume Serial is always required if not explicitly set otherwise, 
             // or follow backend settings strictly.
             if (!formData.serial && !fieldSettings['serial']?.required) {
                 // If backend didn't mark it, maybe we still want it? 
                 // User said "problem description can be mandatory", implied others too.
                 // We'll stick to fieldSettings logic primarily. 
             }
            return true;
        }

        // Step 3: Assistance
        if (currentStep === 3) {
            const field = 'problem_description';
             if (fieldSettings[field]?.required && !formData.problem_description) {
                toast.error(`Please fill in required field: ${fieldSettings[field]?.label || 'Problem Description'}`);
                return false;
            }
            return true;
        }

        return true;
    };

    // Attachment State
    const [attachments, setAttachments] = useState<any[]>([]);
    const [attachmentNote, setAttachmentNote] = useState("");
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

    useEffect(() => {
        if(formData.recordid) {
            fetchAttachments();
        }
    }, [formData.recordid]);

    const fetchAttachments = async () => {
        try {
            const res = await axiosInstanceClient.post("/postApi", {
                apiRoute: "get_lenovo_attachments",
                ticket_id: formData.recordid
            });
            if(res.data.success) {
                setAttachments(res.data.attachments);
            }
        } catch(err) {
            console.error(err);
        }
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Ensure ticket exists
            let ticketId = formData.recordid;
            if (!ticketId) {
                ticketId = await handleSave('Draft');
                if(!ticketId) return;
            }

            setIsUploadingAttachment(true);
            const body = new FormData();
            body.append("apiRoute", "upload_lenovo_attachment");
            body.append("ticket_id", ticketId);
            body.append("file", file);
            body.append("note", attachmentNote);

            try {
                const res = await axiosInstanceClient.post("/postApi", body, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (res.data.success) {
                    toast.success("Attachment uploaded!");
                    setAttachments(prev => [res.data.mod, ...prev]);
                    setAttachmentNote(""); // Reset note
                }
            } catch (err) {
                toast.error("Attachment upload failed");
            } finally {
                setIsUploadingAttachment(false);
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const currentId = formData.recordid;
            
            // Ensure we have a record ID first
            let ticketId = currentId;
            if (!ticketId) {
                ticketId = await handleSave('Draft');
            }

            if (!ticketId) return;

            const body = new FormData();
            body.append("apiRoute", "upload_lenovo_photo");
            body.append("ticket_id", ticketId);
            body.append("file", file);

            setLoadingMethod(true);
            try {
                const res = await axiosInstanceClient.post("/postApi", body, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (res.data.success) {
                    setFormData(prev => ({...prev, product_photo: res.data.path}));
                    toast.success("Photo uploaded!");
                }
            } catch (err) {
                toast.error("Upload failed");
            } finally {
                setLoadingMethod(false);
            }
        }
    };

    // Helper for labels with required asterisk
    const Label = ({ field, text }: { field: string, text: string }) => (
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {text} {fieldSettings[field]?.required && <span className="text-red-500">*</span>}
        </label>
    );

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
        }
    };

    const handleComplete = () => {
        if (validateStep(step)) {
            handleSave('Aperto');
        }
    };

    const handleSave = async (status = "Draft") => {
        setLoadingMethod(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "save_lenovo_ticket");
            body.append("recordid", formData.recordid);
            
            const fields = {
                ...formData,
                status: status
            };
            
            body.append("fields", JSON.stringify(fields));

            const res = await axiosInstanceClient.post("/postApi", body);
            
            if (res.data.success) {
                const newId = res.data.recordid;
                setFormData(prev => ({ ...prev, recordid: newId }));
                
                if (status === 'Draft') {
                    toast.success("Draft saved");
                } else {
                    toast.success("Ticket registered successfully!");
                    setTimeout(() => window.location.reload(), 1500);
                }
                return newId;
            } else {
                toast.error("Error saving ticket: " + res.data.error);
                return null;
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
            return null;
        } finally {
            setLoadingMethod(false);
        }
    };
    
    return (
        <GenericComponent title="Lenovo Service Intake" response={fieldSettings} loading={loadingMethod} error={error}>
      {(response: any) => ( 
        <div className="min-h-screen overflow-auto bg-gray-50 text-gray-900 font-sans">
            
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 w-full mb-6">
                <div className="flex items-center gap-3">
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
                    <div>
                        <h1 className="text-lg font-bold leading-tight">Lenovo Service Intake</h1>
                        <p className="text-xs text-gray-400">New Service Ticket</p>
                    </div>
                </div>
                <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium">{userName || user || 'Guest'}</p>
                    <p className="text-xs text-gray-400">{new Date().toLocaleDateString()}</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                
                <div className="mb-8 flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-0"></div>
                    <div className={`absolute left-0 top-1/2 h-1 bg-[#E2231A] -z-0 transition-all duration-300`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
                    
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${step >= s ? 'bg-[#E2231A] text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {s}
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px] max-h-[75vh] overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-4">Client Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative" ref={searchRef}>
                                    <Label field="company_name" text="Company" />
                                    <input 
                                        type="text" 
                                        value={formData.company_name}
                                        onChange={e => {
                                            setFormData({...formData, company_name: e.target.value});
                                            searchCompanies(e.target.value);
                                        }}
                                        onFocus={() => { if(searchResults.length > 0) setShowResults(true); }}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Search Company..."
                                    />
                                    {showResults && searchResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {searchResults.map((item) => (
                                                <div 
                                                    key={item.id}
                                                    onClick={() => handleSelectCompany(item)}
                                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                                >
                                                    <p className="font-bold text-sm text-gray-800">{item.name}</p>
                                                    {item.details && <p className="text-xs text-gray-500">{item.details}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label field="name" text="Contact Name" />
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="First Name"
                                    />
                                    <input 
                                        type="text" 
                                        value={formData.surname}
                                        onChange={e => setFormData({...formData, surname: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Surname"
                                    />
                                </div>
                                <div>
                                    <Label field="email" text="Email" />
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="client@example.com"
                                    />
                                </div>
                                <div>
                                    <Label field="phone" text="Phone" />
                                    <input 
                                        type="tel" 
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="+41 79 ..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-4">Product Details</h2>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <Label field="serial" text="Serial Number" />
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={formData.serial}
                                            onChange={e => setFormData({...formData, serial: e.target.value.toUpperCase()})}
                                            className="uppercase w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all font-mono tracking-wider"
                                            placeholder="PF..."
                                        />
                                    </div>
                                </div>

                                {/* Product Photo Section */}
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* PC Upload */}
                                    <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-all relative">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <Icons.ComputerDesktopIcon className="w-10 h-10 text-gray-400 mb-2" />
                                        <p className="text-sm font-medium text-gray-600">Upload from PC</p>
                                        <p className="text-xs text-gray-400">Click or drag file here</p>
                                    </div>

                                    {/* Mobile Handoff */}
                                    <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-all cursor-pointer"
                                         onClick={async () => {
                                             let currentId = formData.recordid;
                                             if(!currentId) {
                                                 const newId = await handleSave('Draft');
                                                 if (newId) currentId = newId;
                                             }
                                             
                                             if (currentId) {
                                                 const url = `${window.location.origin}/bixApps/lenovo-intake/mobile/${currentId}`;
                                                 setMobileUrl(url);
                                                 setShowQR(prev => !prev);
                                             }
                                         }}
                                    >
                                        <Icons.DevicePhoneMobileIcon className="w-10 h-10 text-gray-400 mb-2" />
                                        <p className="text-sm font-medium text-gray-600">Use Mobile</p>
                                        <p className="text-xs text-gray-400">{showQR ? 'Hide QR' : 'Scan QR Code'}</p>
                                    </div>
                                </div>

                                {showQR && (
                                    <div className="text-center animate-in zoom-in duration-300 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <p className="font-bold text-[#E2231A] mb-4">Scan with Mobile</p>
                                        <div className="bg-white p-4 rounded-xl shadow-lg inline-block">
                                            <QRCode value={mobileUrl || "loading"} size={180} />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4 animate-pulse">Waiting for photo from mobile...</p>
                                    </div>
                                )}

                                {formData.product_photo && (
                                    <div className="mt-4 border rounded-xl overflow-hidden bg-white shadow-sm">
                                        <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex justify-between items-center">
                                            <span className="text-sm font-bold text-green-700 flex items-center gap-2">
                                                <Icons.CheckCircleIcon className="w-4 h-4" /> Photo Uploaded
                                            </span>
                                            <button 
                                                onClick={() => setFormData(prev => ({...prev, product_photo: ""}))}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="w-full bg-gray-100 flex items-center justify-center p-2">
                                            {/* Media Proxy for Preview */}
                                            <img 
                                                src={`/api/media-proxy?url=${formData.product_photo}`} 
                                                alt="Product Preview" 
                                                className="max-h-64 object-contain rounded-lg"
                                            />
                                        </div>
                                    </div>
                                    )}
                                </div>

                             <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    <Icons.PaperClipIcon className="w-5 h-5" /> Attachments
                                </h3>
                                
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex gap-4 mb-4">
                                        <input 
                                            type="text" 
                                            value={attachmentNote} 
                                            onChange={e => setAttachmentNote(e.target.value)}
                                            placeholder="Note for attachment (optional)"
                                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                onChange={handleAttachmentUpload}
                                                disabled={isUploadingAttachment}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                                                {isUploadingAttachment ? <Icons.ArrowPathIcon className="w-4 h-4 animate-spin"/> : <Icons.PlusIcon className="w-4 h-4"/>}
                                                Add File
                                            </button>
                                        </div>
                                    </div>

                                    {/* Attachment List */}
                                    <div className="space-y-3">
                                        {attachments.map((att, i) => {
                                            const extension = att.filename?.split('.').pop()?.toLowerCase() || '';
                                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
                                            const imageSrc = isImage ? `/api/media-proxy?url=${att.url}` : null;

                                            const getFileIcon = (ext: string) => {
                                                switch(ext) {
                                                    case 'pdf': return "📄";
                                                    case 'doc': case 'docx': return "📝";
                                                    case 'xls': case 'xlsx': return "📊";
                                                    case 'ppt': case 'pptx': return "📑";
                                                    case 'txt': return "📃";
                                                    case 'zip': case 'rar': return "🗜️";
                                                    case 'jpg': case 'jpeg': case 'png': case 'gif': return "🖼️";
                                                    default: return "📎";
                                                }
                                            };

                                            return (
                                            <div key={att.id || i} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                                <div className="flex items-center gap-4 overflow-hidden flex-1">
                                                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                                                        {imageSrc ? (
                                                            <img 
                                                                src={imageSrc} 
                                                                alt={att.filename} 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-2xl">{getFileIcon(extension)}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{att.filename}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <span className="uppercase font-semibold">{extension}</span>
                                                            {att.note && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="truncate italic">"{att.note}"</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <a 
                                                    href={`/api/media-proxy?url=${att.url}`} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="ml-4 p-2 text-gray-400 hover:text-[#E2231A] transition-colors rounded-lg hover:bg-red-50"
                                                    title="Download/View"
                                                >
                                                    <Icons.ArrowDownTrayIcon className="w-5 h-5" />
                                                </a>
                                            </div>
                                            );
                                        })}
                                        {attachments.length === 0 && (
                                            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                                <Icons.DocumentIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-400 text-sm">No attachments yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             </div>
                            </div>
                        )}

                    {step === 3 && (
                        <div className="space-y-6">
                             <h2 className="text-2xl font-bold mb-4">Issue Description</h2>
                            <div>
                                <Label field="problem_description" text="Problem Description" />
                                <textarea 
                                    value={formData.problem_description}
                                    onChange={e => setFormData({...formData, problem_description: e.target.value})}
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all h-32"
                                    placeholder="Describe the issue, error codes, physical damage..."
                                />
                             </div>


                        </div>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-between">
                    <button 
                        onClick={() => step > 1 && setStep(step - 1)}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors ${step > 1 ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'invisible'}`}
                    >
                        Back
                    </button>

                    <div className="flex gap-3">
                        {step < 3 ? (
                            <button 
                                onClick={handleNext}
                                className="px-8 py-3 bg-[#333333] text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2"
                            >
                                Next <Icons.ArrowRightIcon className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleComplete}
                                disabled={loadingMethod}
                                className="px-8 py-3 bg-[#E2231A] text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {loadingMethod ? 'Saving...' : 'Complete Intake'} <Icons.CheckIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

            </main>
        </div>
      )}
    </GenericComponent>
    );
}
