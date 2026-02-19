"use client";
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useApi } from "@/utils/useApi";
import GenericComponent from "@/components/genericComponent";
import { AppContext } from "@/context/appContext";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast, Toaster } from "sonner";
import * as Icons from "@heroicons/react/24/outline";
import QRCode from "react-qr-code";
import { useSearchParams } from "next/navigation";
import SelectStandard from "../../selectStandard";

export default function LenovoIntake({ initialRecordId }: { initialRecordId?: string }) {
    const { user, userName } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [loadingMethod, setLoadingMethod] = useState(false);
    
    // Signature State
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    
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
        
        // New Fields
        address: "",
        place: "",
        brand: "",
        model: "",
        username: "",
        password: "",
        warranty: "No", // 'Si' | 'No'
        warranty_type: "",
        
        // Authorization
        auth_factory_reset: "No",
        request_quote: "No",
        direct_repair: "No",
        direct_repair_limit: "",
        auth_formatting: "No",
        signatureUrl: "",
        accessories: [] as string | string[],
    });

    // Lookup State
    const [lookups, setLookups] = useState<{ itemcode: string; itemdesc: string; }[]>([]);

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
          setLookups(response.lookups?.accessories || [])
          console.log("Custom functions loaded:", response)
        }
      }, [response])

    // Params for Edit Mode
    const searchParams = useSearchParams();
    const recordId = initialRecordId || searchParams.get("recordid");

    // Fetch existing ticket if recordId is present
    useEffect(() => {
        const fetchTicket = async () => {
            if (!recordId) return;

            try {
                // setLoading(true); // Add loading state if needed
                const res = await axiosInstanceClient.post("/postApi", {
                    apiRoute: "get_lenovo_ticket",
                    ticket_id: recordId
                });

                if (res.data.success) {
                    const ticket = res.data.ticket;
                    console.log("Loaded Ticket:", ticket);
                    setFormData(prev => ({
                        ...prev,
                        ...ticket,
                        // Ensure accessories is a string if it comes as array, or handle accordingly
                        accessories: ticket.accessories || []
                    }));
                    // Optionally set step to 1 or allowing navigation
                } else {
                    toast.error("Errore nel caricamento del ticket: " + res.data.error);
                }
            } catch (error) {
                console.error("Error loading ticket:", error);
                toast.error("Errore di connessione nel caricamento del ticket.");
            } finally {
                // setLoading(false);
            }
        };

        fetchTicket();
    }, [recordId]);

    // Polling for photo, attachments and SIGNATURE update
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if ((step === 2 || step === 3 || step === 4) && formData.recordid) {
            interval = setInterval(async () => {
                try {
                    // 1. Check Ticket/Photo/Signature
                    const resTicket = await axiosInstanceClient.post("/postApi", {
                        apiRoute: "get_lenovo_ticket",
                        ticket_id: formData.recordid
                    });
                    
                    if (resTicket.data.success) {
                        const ticket = resTicket.data.ticket;
                        const serverPhoto = ticket.product_photo;
                        const serverSignature = ticket.signatureUrl;
                        
                        // Auto-update photo
                        if (serverPhoto !== formData.product_photo) {
                            setFormData(prev => ({ ...prev, product_photo: serverPhoto }));
                            if (!formData.product_photo && showQR) {
                                toast.success("Photo received!");
                            }
                        }

                        // Auto-update signature
                        if(serverSignature) {
                            // If we didn't have a signature and now we do
                            if(!formData.signatureUrl) {
                                setFormData(prev => ({ ...prev, signatureUrl: serverSignature }));
                                toast.success("Signature received!");
                                setShowQR(false); // Close QR when signed
                            }
                        }
                    }

                    // 2. Refresh Attachments
                    const resAtt = await axiosInstanceClient.post("/postApi", {
                        apiRoute: "get_lenovo_attachments",
                        ticket_id: formData.recordid
                    });
                    if(resAtt.data.success) {
                         setAttachments(resAtt.data.attachments);
                    }

                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [step, formData.recordid, formData.product_photo, formData.signatureUrl, showQR]);

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
            address: company.address || "",
            place: company.city || "",
            email: company.email || prev.email,
            phone: company.phonenumber || prev.phone,
        }));
        setShowResults(false);
    };

    const validateStep = (currentStep: number) => {
        // Step 1: Client
        if (currentStep === 1) {
            const requiredFields = ['company_name', 'name', 'surname', 'email'];
            for (const field of requiredFields) {
                if (fieldSettings[field]?.required && !formData[field as keyof typeof formData]) {
                    toast.error(`Please fill in required field: ${fieldSettings[field]?.label || field}`);
                    return false;
                }
            }
            if (!formData.company_name && !formData.name) {
                 toast.error("Please fill in Company or Name");
                 return false;
            }
            return true;
        }

        // Step 2: Product & Credentials
        if (currentStep === 2) {
            //  if (!formData.brand && !formData.model && !formData.serial) {
            //      toast.error("Please fill in at least one product detail (Brand/Model/Serial)");
            //      return false;
            //  }
             return true;
        }

        // Step 3: Assistance & Auth
        if (currentStep === 3) {
            const field = 'problem_description';
             if (fieldSettings[field]?.required && !formData.problem_description) {
                toast.error(`Please fill in required field: ${fieldSettings[field]?.label || 'Problem Description'}`);
                return false;
            }
            const requiredFields = ['auth_factory_reset', 'request_quote', 'direct_repair', 'auth_formatting'];
            for (const field of requiredFields) {
                 if (fieldSettings[field]?.required && (!formData[field as keyof typeof formData] || formData[field as keyof typeof formData] !== 'Si')) {
                    toast.error(`Please fill in required field: ${fieldSettings[field]?.label || field}`);
                    return false;
                }
            }
            return true;
        }

        // Step 4: Multimedia - no strict validation needed to proceed to save
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
    const Label = ({ field, text, className }: { field: string, text: string, className?: string }) => (
        <label className={className || "block text-sm font-medium text-gray-700 mb-1"}>
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
                    // setTimeout(() => window.location.reload(), 1500);
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

    const handleSaveAndSign = async () => {
        if (validateStep(step)) {
            // Save as 'Aperto' to trigger signature mode on mobile
            const id = await handleSave('Aperto');
            if(id) {
                const url = `${window.location.origin}/bixApps/lenovo-intake/mobile/${id}`;
                setMobileUrl(url);
                setShowQR(true); 
                toast.info("Scansiona il QR con il mobile per firmare.");
            }
        }
    };

    const handlePrint = async () => {
        if(!formData.recordid) return;
        
        const toastId = toast.loading("Generating PDF...");
        try {
            const res = await axiosInstanceClient.post("/postApi", {
                apiRoute: "print_lenovo_ticket",
                recordid: formData.recordid
            });

            if (res.data.success) {
                 // Decode base64 and download
                 const link = document.createElement('a');
                 link.href = res.data.pdf_base64;
                 link.download = `LenovoTicket_${formData.recordid}.pdf`;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 toast.dismiss(toastId);
                 toast.success("PDF Downloaded");
            } else {
                 toast.dismiss(toastId);
                 toast.error("PDF generation failed");
            }
        } catch (e) {
             toast.dismiss(toastId);
             toast.error("Network error");
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

            <main className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
                
                <div className="mb-8 flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-0"></div>
                    <div className={`absolute left-0 top-1/2 h-1 bg-[#E2231A] -z-0 transition-all duration-300`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
                    
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${step >= s ? 'bg-[#E2231A] text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {s}
                        </div>
                    ))}
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto px-1 py-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px]">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <Label field="address" text="Address" />
                                    <input 
                                        type="text" 
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Street Address"
                                    />
                                </div>
                                <div>
                                    <Label field="place" text="City/Place" />
                                    <input 
                                        type="text" 
                                        value={formData.place}
                                        onChange={e => setFormData({...formData, place: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Lugano"
                                    />
                                </div>
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

                    {/* Step 2: Product & Credentials */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-2xl font-bold mb-4">Product & Access</h2>
                            
                            {/* Product Fields */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label field="brand" text="Brand" />
                                    <input 
                                        type="text" 
                                        value={formData.brand}
                                        onChange={e => setFormData({...formData, brand: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Lenovo, HP, Apple..."
                                    />
                                </div>
                                <div>
                                    <Label field="model" text="Model" />
                                    <input 
                                        type="text" 
                                        value={formData.model}
                                        onChange={e => setFormData({...formData, model: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="ThinkPad X1..."
                                    />
                                </div>
                            </div>
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
                            <div>
                                <Label field="accessories" text="Accessories" />
                                <div className="flex gap-2 w-full">
                                    <SelectStandard
                                        initialValue={formData.accessories}
                                        onChange={e => setFormData({...formData, accessories: e})}
                                        lookupItems={lookups ?? []}
                                        isMulti={true}
                                    />
                                </div>
                            </div>

                            {/* Credentials */}
                            <div className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Access Credentials</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label field="username" text="Username" />
                                        <input 
                                            type="text" 
                                            value={formData.username}
                                            onChange={e => setFormData({...formData, username: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                            placeholder="User"
                                        />
                                    </div>
                                    <div>
                                        <Label field="password" text="Password/PIN" />
                                        <input 
                                            type="text" 
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                            placeholder="********"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Assistance & Authorization */}
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

                             {/* Warranty & Authorization */}
                             <div className="space-y-4 pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-bold">Warranty & Authorization</h3>
                                
                                {/* Warranty */}
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            id="warranty"
                                            checked={formData.warranty === 'Si'}
                                            onChange={e => setFormData({...formData, warranty: e.target.checked ? 'Si' : 'No'})}
                                            className="w-5 h-5 text-[#E2231A] rounded focus:ring-[#E2231A]"
                                        />
                                        <label htmlFor="warranty" className="font-medium text-gray-700">Under Warranty?</label>
                                    </div>
                                    {formData.warranty === 'Si' && (
                                        <input 
                                            type="text" 
                                            value={formData.warranty_type}
                                            onChange={e => setFormData({...formData, warranty_type: e.target.value})}
                                            placeholder="Warranty Type (e.g. OnSite, Depot)"
                                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    )}
                                </div>

                                {/* Auth Checks */}
                                <div className="space-y-3">
                                    <div 
                                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                        onClick={() => setFormData(prev => ({...prev, auth_factory_reset: prev.auth_factory_reset === 'Si' ? 'No' : 'Si'}))}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={formData.auth_factory_reset === 'Si'}
                                            readOnly
                                            className="w-5 h-5 mt-1 text-[#E2231A] rounded focus:ring-[#E2231A] pointer-events-none"
                                        />
                                        <Label 
                                            field="auth_factory_reset" 
                                            text="Authorize Factory Reset (Data may be lost)." 
                                            className="text-sm text-gray-600 font-normal cursor-pointer"
                                        />
                                    </div>

                                    <div 
                                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                        onClick={() => setFormData(prev => ({...prev, request_quote: prev.request_quote === 'Si' ? 'No' : 'Si'}))}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={formData.request_quote === 'Si'}
                                            readOnly
                                            className="w-5 h-5 mt-1 text-[#E2231A] rounded focus:ring-[#E2231A] pointer-events-none"
                                        />
                                        <Label 
                                            field="request_quote" 
                                            text="Request Quote (Evaluation cost max 50 CHF if rejected)." 
                                            className="text-sm text-gray-600 font-normal cursor-pointer"
                                        />
                                    </div>

                                    <div className="p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div 
                                            className="flex items-start gap-3 cursor-pointer"
                                            onClick={() => setFormData(prev => ({...prev, direct_repair: prev.direct_repair === 'Si' ? 'No' : 'Si'}))}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={formData.direct_repair === 'Si'}
                                                readOnly
                                                className="w-5 h-5 mt-1 text-[#E2231A] rounded focus:ring-[#E2231A] pointer-events-none"
                                            />
                                            <Label 
                                                field="direct_repair" 
                                                text="Authorize Direct Repair if cost is below limit." 
                                                className="text-sm text-gray-600 font-normal cursor-pointer"
                                            />
                                        </div>
                                        {formData.direct_repair === 'Si' && (
                                            <div className="ml-8 mt-2 flex items-center gap-2">
                                                <span className="text-sm text-gray-500">Limit (CHF):</span>
                                                <input 
                                                    type="number" 
                                                    value={formData.direct_repair_limit}
                                                    onChange={e => setFormData({...formData, direct_repair_limit: e.target.value})}
                                                    className="w-32 p-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder="e.g. 200"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div 
                                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                        onClick={() => setFormData(prev => ({...prev, auth_formatting: prev.auth_formatting === 'Si' ? 'No' : 'Si'}))}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={formData.auth_formatting === 'Si'}
                                            readOnly
                                            className="w-5 h-5 mt-1 text-[#E2231A] rounded focus:ring-[#E2231A] pointer-events-none"
                                        />
                                        <Label 
                                            field="auth_formatting" 
                                            text="Authorize Full Formatting (Data WILL be lost)." 
                                            className="text-sm text-gray-600 font-normal cursor-pointer"
                                        />
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* Step 4: Multimedia & Sign */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-2xl font-bold mb-4">Multimedia & Sign</h2>
                            
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

                                {/* Mobile Handoff & Direct Sign */}
                                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-all cursor-pointer"
                                     onClick={async () => {
                                        // Detect mobile (simple check)
                                        const isMobile = window.innerWidth < 768;

                                        if (isMobile) {
                                            setShowSignatureModal(true);
                                            return;
                                        }

                                        if (showQR) return setShowQR(false);

                                        let currentId = formData.recordid;
                                        if(!currentId) {
                                            const newId = await handleSave('Draft');
                                            if (newId) currentId = newId;
                                        }
                                     
                                        if (currentId) {
                                             const url = `${window.location.origin}/bixApps/lenovo-intake/mobile/${currentId}`;
                                             setMobileUrl(url);
                                             setShowQR(true);
                                         }
                                     }}
                                >
                                    <Icons.DevicePhoneMobileIcon className="w-10 h-10 text-gray-400 mb-2" />
                                    <p className="text-sm font-medium text-gray-600">
                                        {typeof window !== 'undefined' && window.innerWidth < 768 ? "Firma Ora" : "Usa Mobile"}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {typeof window !== 'undefined' && window.innerWidth < 768 ? "Firma direttamente qui" : (showQR ? 'Nascondi QR' : 'Scansiona QR Code')}
                                    </p>
                                </div>
                            </div>

                            {/* Inline QR Code Section */}
                            {showQR && (
                                <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-[#E2231A] text-center animate-in fade-in slide-in-from-top-4 shadow-xl relative ring-4 ring-red-50">
                                    <button 
                                        onClick={() => setShowQR(false)}
                                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                    >
                                        <Icons.XMarkIcon className="w-6 h-6" />
                                    </button>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Scan to Upload or Sign</h3>
                                    <p className="text-gray-500 mb-4">Use your mobile device to take photos and sign the ticket.</p>
                                    
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 inline-block shadow-sm">
                                            <QRCode value={mobileUrl} size={180} />
                                    </div>
                                    <p className="text-xs text-gray-400 font-mono mt-4 break-all bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                        {mobileUrl}
                                    </p>
                                </div>
                            )}

                            {formData.product_photo && (
                                <div className="mt-4 border rounded-xl overflow-hidden bg-white shadow-sm">
                                    <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex justify-between items-center">
                                        <span className="text-sm font-bold text-green-700 flex items-center gap-2">
                                            <Icons.CheckCircleIcon className="w-4 h-4" /> Photo Uploaded
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 flex items-center justify-center p-2">
                                        <img 
                                            src={`/api/media-proxy?url=${formData.product_photo}`} 
                                            alt="Product Preview" 
                                            className="max-h-64 object-contain rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}

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
                </div>
                </div>

                <div className="mt-8 flex items-center justify-between">
                    <button 
                        onClick={() => step > 1 && setStep(step - 1)}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors ${step > 1 ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'invisible'}`}
                    >
                        Back
                    </button>

                    <div className="flex gap-3">
                        {step < 4 ? (
                            <button 
                                onClick={handleNext}
                                className="px-8 py-3 bg-[#333333] text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2"
                            >
                                Next <Icons.ArrowRightIcon className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="flex items-center justify-end gap-3">
                            <button 
                                onClick={handleComplete}
                                disabled={loadingMethod}
                                className="px-8 py-3 bg-[#E2231A] text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {loadingMethod ? 'Saving...' : 'Save Ticket'} <Icons.CheckIcon className="w-5 h-5" />
                            </button>
                            {formData.recordid && step === 4 && (
                                <div className="flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {!formData.signatureUrl ? (
                                        <button
                                            onClick={handleSaveAndSign}
                                            className="bg-[#E2231A] text-white px-8 py-3 rounded-2xl font-bold shadow-xl flex items-center gap-3 hover:bg-black transition-all transform hover:scale-105"
                                        >
                                            <Icons.QrCodeIcon className="w-6 h-6" />
                                            Salva & Firma
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handlePrint}
                                            className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl flex items-center gap-3 hover:bg-green-700 transition-all transform hover:scale-105"
                                        >
                                            <Icons.PrinterIcon className="w-6 h-6" />
                                            Stampa PDF
                                        </button>
                                    )}
                                </div>
                            )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            
            {/* QR Modal for Signature/Mobile */}
        </div>
      )}
    </GenericComponent>
    );
}
