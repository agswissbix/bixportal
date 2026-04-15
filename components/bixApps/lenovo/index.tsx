"use client";
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useApi } from "@/utils/useApi";
import GenericComponent from "@/components/genericComponent";
import { AppContext } from "@/context/appContext";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast, Toaster } from "sonner";
import * as Icons from "@heroicons/react/24/outline";
import { RefreshCwIcon } from "lucide-react";
import QRCode from "react-qr-code";
import { useSearchParams } from "next/navigation";
import SelectStandard from "../../selectStandard";
import SelectUser from "../../selectUser";
import { StepIndicator } from "./StepIndicator";
import { AuthCard } from "./AuthCard";
import { AccessorySelector } from "./AccessorySelector";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label as UiLabel } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SignaturePad from './SignaturePad';
import BarcodeScanner from './barcodeScanner';
import router from 'next/router';

export default function LenovoIntake({ initialRecordId }: { initialRecordId?: string }) {
    type AppSection = 'initial' | 'presa_in_consegna' | 'diagnostica' | 'riparazione' | 'consegna';
    const { user, userName } = useContext(AppContext);
    const [step, setStep] = useState(1);
    const [appSection, setAppSection] = useState<AppSection>('initial');
    const [searchSerial, setSearchSerial] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [loadingMethod, setLoadingMethod] = useState(false);
    
    // Signature State
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    
    // Scanner State
    const [showScanner, setShowScanner] = useState(false);
    
    // Search State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const stepContentRef = useRef<HTMLDivElement>(null);

    // QR State
    const [showQR, setShowQR] = useState(false);
    const [mobileUrl, setMobileUrl] = useState("");
    const [mobileSessionId, setMobileSessionId] = useState("");

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1024;

    // Note Helpers
    const extractNotePart = (notes: string, section: 'diagnostica' | 'riparazione') => {
        if (!notes) return "";
        if (section === 'diagnostica') {
            const match = notes.match(/Diagnostica:\n([\s\S]*?)(?:\nRiparazione:\n|$)/i);
            // If the note doesn't match the new structure at all, just return everything for diagnostica
            if (!match && !notes.match(/Riparazione:\n/i)) return notes.trim();
            return match ? match[1].trim() : "";
        } else {
            const match = notes.match(/Riparazione:\n([\s\S]*?)$/i);
            return match ? match[1].trim() : "";
        }
    };

    // Helper: torna alla ricerca e rimuove il recordid dall'URL
    const initialFormData = {
        recordid: "",
        reception_date: new Date().toISOString().split('T')[0],
        status: "Draft",
        company_name: "",
        name: "",
        surname: "",
        email: "",
        phone: "",
        recordidcompany_: "",
        serial: "",
        product_photo: "",
        ticket_id: "",
        problem_description: "",
        internal_notes: "",
        replaced_components: "",
        address: "",
        place: "",
        brand: "",
        model: "",
        username: "",
        password: "",
        warranty: "No" as string,
        warranty_type: "",
        technician: "47",
        auth_factory_reset: "No",
        request_quote: "No",
        direct_repair: "No",
        direct_repair_limit: "",
        auth_formatting: "No",
        signatureUrl: "",
        deliverySignatureUrl: "",
        accessories: [] as string | string[],
        custom_accessory: "",
        pick_up: "",
    };

    const goToInitial = async (checkSave = false) => {
        if (appSection !== 'initial' && checkSave) {
            const wantsSave = window.confirm("Vuoi salvare i dati prima di tornare alla ricerca?\n\n[OK] = Salva e torna alla ricerca\n[Annulla] = Scegli se uscire senza salvare");
            if (wantsSave) {
                const savedId = await handleSave(formData.status || 'Draft');
                if (!savedId) return; // Don't exit if save fails
            } else {
                const proceed = window.confirm("Sei sicuro di voler uscire SENZA salvare? Le modifiche andranno perse.");
                if (!proceed) return;
            }
        }

        setFormData(initialFormData);
        setSearchSerial("");
        setWarrantyHistory([]);
        setAttachments([]);
        setCurrentNote("");
        setStep(1);
        setAppSection('initial');
        const url = new URL(window.location.href);
        url.searchParams.delete('recordid');
        window.history.pushState({}, '', url.toString());
    };
    
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
        internal_notes: "",
        replaced_components: "", // JSON string or text for multiple components
        
        // New Fields
        address: "",
        place: "",
        brand: "",
        model: "",
        username: "",
        password: "",
        warranty: "No", // 'Si' | 'No'
        warranty_type: "",
        technician: "",
        
        // Authorization
        auth_factory_reset: "No",
        request_quote: "No",
        direct_repair: "No",
        direct_repair_limit: "",
        auth_formatting: "No",
        signatureUrl: "",
        accessories: [] as string | string[],
        custom_accessory: "",
        pick_up: "",

        deliverySignatureUrl: "",
    });

    const [currentNote, setCurrentNote] = useState("");

    // Info for the mini-form to add a replaced component rapidly
    const [compName, setCompName] = useState("");
    const [oldSerial, setOldSerial] = useState("");
    const [newSerial, setNewSerial] = useState("");
    const [scannerTarget, setScannerTarget] = useState<'old' | 'new' | 'components' | null>(null);

    // Sync currentNote when navigating sections
    useEffect(() => {
        if (appSection === 'diagnostica') setCurrentNote(extractNotePart(formData.internal_notes, 'diagnostica'));
        else if (appSection === 'riparazione') setCurrentNote(extractNotePart(formData.internal_notes, 'riparazione'));
    }, [appSection, formData.recordid]);

    // Prevent accidental close/reload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (appSection !== 'initial') {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [appSection]);

    // Lookup State
    const [lookups, setLookups] = useState<{ itemcode: string; itemdesc: string; }[]>([]);
    const [pickUpLookups, setPickUpLookups] = useState<{ itemcode: string; itemdesc: string; }[]>([]);
    const [usersLookup, setUsersLookup] = useState<any[]>([]);

    // Lenovo API State
    const [isFetchingLenovo, setIsFetchingLenovo] = useState(false);
    const [lastCheckedSerial, setLastCheckedSerial] = useState("");

    const [fieldSettings, setFieldSettings] = useState<any>({});

    const [warrantyHistory, setWarrantyHistory] = useState<any[]>([]);
    const [showWarrantyHistory, setShowWarrantyHistory] = useState(false);

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
          setPickUpLookups(response.lookups?.pick_up || [])
          setUsersLookup(response.lookups?.users || [])
          if (response.field_settings.technician.default) {
            setFormData(prev => prev.technician ? prev : { ...prev, technician: response.field_settings.technician.default })
          }
        }
      }, [response])

    // Params for Edit Mode
    const searchParams = useSearchParams();
    const recordId = initialRecordId || searchParams.get("recordid");
    const serialParam = searchParams.get("serial");

    // Initial check for serial in URL
    useEffect(() => {
        if (!recordId && serialParam && appSection === 'initial') {
            setSearchSerial(serialParam);
            handleBarcodeSearch(undefined, serialParam);
        }
    }, [recordId, serialParam, appSection]);

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
                    const sanitizedTicket = Object.fromEntries(
                        Object.entries(ticket).map(([key, value]) => [key, value === null ? "" : value])
                    );
                    setFormData(prev => ({
                        ...prev,
                        ...sanitizedTicket,
                        // Ensure accessories is a string if it comes as array, or handle accordingly
                        accessories: ticket.accessories || [],
                        custom_accessory: ""
                    }));
                    
                    if (ticket.warrantyHistory && Array.isArray(ticket.warrantyHistory)) {
                        setWarrantyHistory(ticket.warrantyHistory);
                    }

                    // DETERMINE SECTION BASED ON STATUS
                    const st = (ticket.status || '').toLowerCase();
                    if (st === 'entrata') {
                        setAppSection('diagnostica');
                    } else if (st === 'diagnostica') {
                        setAppSection('riparazione');
                    } else if (st === 'riparato') {
                        setAppSection('consegna');
                    } else if (st === 'riconsegnato') {
                        setAppSection('consegna'); // Already delivered, just show it
                    } else {
                        setAppSection('presa_in_consegna');
                    }

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
        if (isMobile) return;
        let interval: NodeJS.Timeout;
        if ((step === 2 || step === 3 || step === 4 || step === 5 || appSection === 'consegna' || appSection === 'diagnostica' || appSection === 'riparazione') && formData.recordid) {
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
                        const serverDeliverySignature = ticket.deliverySignatureUrl;
                        
                        // Auto-update photo
                        if (serverPhoto !== formData.product_photo) {
                            setFormData(prev => ({ ...prev, product_photo: serverPhoto }));
                            if (!formData.product_photo && showQR) {
                                toast.success("Foto ricevuta!");
                            }
                        }

                        // Auto-update intake signature
                        if(serverSignature && !formData.signatureUrl) {
                            setFormData(prev => ({ ...prev, signatureUrl: serverSignature }));
                            toast.success("Firma ricevuta!");
                            setShowQR(false);
                        }

                        // Auto-update DELIVERY signature (consegna)
                        if(serverDeliverySignature && !formData.deliverySignatureUrl) {
                            setFormData(prev => ({ ...prev, deliverySignatureUrl: serverDeliverySignature }));
                            toast.success("Firma di consegna ricevuta!");
                            setShowQR(false);
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
    }, [step, formData.recordid, formData.product_photo, formData.signatureUrl, formData.deliverySignatureUrl, showQR]);

    // Scroll step content to top on step change
    useEffect(() => {
        if (stepContentRef.current) {
            stepContentRef.current.scrollTop = 0;
        }
    }, [step]);

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

    // Extract custom accessory from backend loaded data
    useEffect(() => {
        if (lookups.length > 0 && formData.accessories) {
            const accArray = Array.isArray(formData.accessories) ? formData.accessories : typeof formData.accessories === 'string' ? formData.accessories.split(',') : [];
            const standardCodes = lookups.map(l => l.itemcode);
            const customList = accArray.filter(a => !standardCodes.includes(a) && a !== 'Altro' && a.trim() !== '');
            
            if (customList.length > 0 && !formData.custom_accessory) {
                setFormData(prev => {
                    const prevAcc = Array.isArray(prev.accessories) ? prev.accessories : typeof prev.accessories === 'string' && prev.accessories ? prev.accessories.split(',') : [];
                    return { 
                        ...prev, 
                        custom_accessory: customList.join(', '),
                        accessories: [...prevAcc.filter(a => standardCodes.includes(a)), 'Altro']
                    };
                });
            }
        }
    }, [lookups, formData.accessories, formData.custom_accessory]);

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
            const requiredFields = ['company_name', 'name', 'surname', 'email', 'address', 'place', 'phone'];
            for (const field of requiredFields) {
                if (fieldSettings[field]?.required && !formData[field as keyof typeof formData]) {
                    toast.error(`Compila il campo obbligatorio: ${fieldSettings[field]?.label || field}`);
                    return false;
                }
            }
            return true;
        }

        // Step 2: Product & Credentials
        if (currentStep === 2) {
            const requiredFields = ['serial', 'brand', 'model', 'accessories', 'username', 'password', 'pickUpLookups'];
            for (const field of requiredFields) {
                if (fieldSettings[field]?.required && !formData[field as keyof typeof formData]) {
                    toast.error(`Compila il campo obbligatorio: ${fieldSettings[field]?.label || field}`);
                    return false;
                }
            }
             return true;
        }

        // Step 3: Assistance & Auth
        if (currentStep === 3) {
            const field = 'problem_description';
             if (fieldSettings[field]?.required && !formData.problem_description) {
                console.log("problem_description", formData.problem_description);
                toast.error(`Compila il campo obbligatorio: ${fieldSettings[field]?.label || 'Descrizione Problema'}`);
                return false;
            }
            const requiredFields = ['auth_factory_reset', 'request_quote', 'direct_repair', 'auth_formatting'];
            for (const field of requiredFields) {
                 if (fieldSettings[field]?.required && (!formData[field as keyof typeof formData] || formData[field as keyof typeof formData] !== 'Si')) {
                    toast.error(`Compila il campo obbligatorio: ${fieldSettings[field]?.label || field}`);
                    return false;
                }
            }
            return true;
        }

        // Step 4: Multimedia - no strict validation needed
        if (currentStep === 4) {
             return true;
        }

        // Step 5: Summary
        return true;
    };

    // Attachment State
    const [attachments, setAttachments] = useState<any[]>([]);
    const [attachmentNote, setAttachmentNote] = useState("");
    const [attachmentType, setAttachmentType] = useState("pre-intervento");
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

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>, typeOverride?: string) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Ensure ticket exists
        let ticketId = formData.recordid;
        if (!ticketId) {
            ticketId = await handleSave('Draft');
            if (!ticketId) return;
        }

        setIsUploadingAttachment(true);
        const total = files.length;
        let successCount = 0;

        for (let i = 0; i < total; i++) {
            const file = files[i];
            if (total > 1) {
                toast.loading(`Caricamento ${i + 1}/${total}...`, { id: 'att-upload' });
            }
            const body = new FormData();
            body.append("apiRoute", "upload_lenovo_attachment");
            body.append("ticket_id", ticketId);
            body.append("file", file);
            body.append("note", attachmentNote);
            body.append("attachment_type", typeOverride ?? attachmentType);

            try {
                const res = await axiosInstanceClient.post("/postApi", body, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                if (res.data.success) {
                    setAttachments(prev => [res.data.mod, ...prev]);
                    successCount++;
                } else {
                    toast.error(`Errore su ${file.name}`);
                }
            } catch (err) {
                toast.error(`Caricamento fallito: ${file.name}`);
            }
        }

        toast.dismiss('att-upload');
        if (successCount > 0) {
            toast.success(total === 1 ? "Allegato caricato!" : `${successCount}/${total} allegati caricati!`);
            setAttachmentNote("");
        }
        setIsUploadingAttachment(false);
        // Reset input so same files can be re-selected if needed
        e.target.value = "";
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
                    toast.success("Foto caricata!");
                }
            } catch (err) {
                toast.error("Caricamento fallito");
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

    useEffect(() => {
        // Polling logic for Mobile Handoff in search phase
        let interval: NodeJS.Timeout;
        if (showQR && appSection === 'initial' && mobileSessionId) {
            interval = setInterval(async () => {
                try {
                    const fd = new FormData();
                    fd.append("apiRoute", "lenovo_mobile_handoff");
                    fd.append("action", "check");
                    fd.append("session_id", mobileSessionId);
                    
                    const res = await axiosInstanceClient.post("/postApi", fd);
                    if (res.data.success && res.data.found && res.data.serial) {
                        toast.success("Codice letto da mobile!");
                        setShowQR(false);
                        setSearchSerial(res.data.serial);
                        // Trigger search automatically
                        handleBarcodeSearch(undefined, res.data.serial);
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                }
            }, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showQR, appSection, mobileSessionId]);

    useEffect(() => {
        // Polling logic for Component Scanner Handoff
        let interval: NodeJS.Timeout;
        if (!isMobile && scannerTarget && mobileSessionId) {
            interval = setInterval(async () => {
                try {
                    const fd = new FormData();
                    fd.append("apiRoute", "lenovo_mobile_handoff");
                    fd.append("action", "check");
                    fd.append("session_id", mobileSessionId);
                    
                    const res = await axiosInstanceClient.post("/postApi", fd);
                    if (res.data.success && res.data.found && res.data.serial) {
                        if (scannerTarget === 'components' && res.data.serial.startsWith("COMPONENT_DATA:")) {
                            const newLine = res.data.serial.replace("COMPONENT_DATA:", "");
                            setFormData(prev => ({
                                ...prev,
                                replaced_components: prev.replaced_components ? prev.replaced_components + '\n' + newLine : newLine
                            }));
                            toast.success("Componente aggiunto da mobile!");
                        } else {
                            toast.success("Seriale acquisito da mobile!");
                            if(scannerTarget === 'old') setOldSerial(res.data.serial);
                            if(scannerTarget === 'new') setNewSerial(res.data.serial);
                            setScannerTarget(null);
                            setMobileSessionId("");
                        }
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                }
            }, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isMobile, scannerTarget, mobileSessionId]);

    const handleComplete = () => {
        if (validateStep(step)) {
            handleSave('Presa in consegna');
        }
    };
    const handleSerialBlur = async (serialOverride?: string | React.FocusEvent<HTMLInputElement>) => {
        // Se l'evento viene dal blur "normale", serialOverride è un oggetto evento e verrà ignorato. 
        const s = typeof serialOverride === 'string' ? serialOverride : formData.serial;
        const currentSerial = s?.trim();
        if (!currentSerial || currentSerial === lastCheckedSerial) return;
        
        setIsFetchingLenovo(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "get_lenovo_device_info");
            body.append("product_id", currentSerial);
            
            const res = await axiosInstanceClient.post("/postApi", body);
            
            if (res.data.success && res.data.data) {
                console.log(res.data.data.data);
                const lenovoData = res.data.data.data;
                const updates: any = {};
                
                if (lenovoData.machineInfo?.productName) {
                    updates.model = lenovoData.machineInfo.productName;
                    updates.brand = "Lenovo";
                }
                
                const wStatus = lenovoData.warrantyStatus?.toLowerCase() || '';
                if (wStatus === 'in warranty') {
                    updates.warranty = 'Si';
                } else if (wStatus === 'out of warranty') {
                    updates.warranty = 'No';
                }

                const currentDeliveryType = lenovoData.currentWarranty?.deliveryType;
                if (currentDeliveryType) {
                    if (currentDeliveryType === 'PREMIER') updates.warranty_type = 'Premium';
                    else if (currentDeliveryType === 'DEPOT') updates.warranty_type = 'Depot';
                    else if (currentDeliveryType === 'ONSITE') updates.warranty_type = 'OnSite';
                    else if (currentDeliveryType === 'ADP') updates.warranty_type = 'ADP';
                }

                const baseW = lenovoData.baseWarranties || [];
                const upgradeW = lenovoData.upgradeWarranties || [];
                setWarrantyHistory([...baseW, ...upgradeW]);

                setFormData(prev => ({ ...prev, ...updates }));
                setLastCheckedSerial(currentSerial);
                toast.success("Dati Lenovo recuperati con successo");
            } else {
                toast.error("Prodotto non trovato");
            }
        } catch (err) {
            console.error("Lenovo API Error:", err);
            toast.error("Errore nel recupero dati Lenovo");
        } finally {
            setIsFetchingLenovo(false);
        }
    };

    const handleBarcodeSearch = async (e?: React.FormEvent, serialOverride?: string) => {
        if (e) e.preventDefault();
        const s = (serialOverride || searchSerial).trim().toUpperCase();
        if (!s) return;
        setIsSearching(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "search_lenovo_ticket_by_serial");
            body.append("serial", s);
            const res = await axiosInstanceClient.post("/postApi", body);
            
            if (res.data.success && res.data.found) {
                window.location.href = `?recordid=${res.data.recordid}`;
            } else {
                setFormData(prev => ({ ...prev, serial: s }));
                setAppSection('presa_in_consegna');
                setStep(1);
                handleSerialBlur(s);
            }
        } catch (err) {
            console.error(err);
            toast.error("Errore durante la ricerca.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSave = async (status = "Draft") => {
        setLoadingMethod(true);
        try {
            const body = new FormData();
            body.append("apiRoute", "save_lenovo_ticket");
            body.append("recordid", formData.recordid);
            
            let saveAccessories = Array.isArray(formData.accessories) ? [...formData.accessories] : (typeof formData.accessories === 'string' && formData.accessories ? formData.accessories.split(',') : []);
            
            // Handle custom accessory saving
            if (saveAccessories.includes('Altro')) {
                saveAccessories = saveAccessories.filter(a => a !== 'Altro');
                if (formData.custom_accessory && formData.custom_accessory.trim() !== '') {
                    saveAccessories.push(formData.custom_accessory.trim());
                }
            }

            // Compose internal_notes
            let finalNotes = formData.internal_notes || "";
            if (appSection === 'diagnostica') {
                const ripPart = extractNotePart(finalNotes, 'riparazione');
                finalNotes = `Diagnostica:\n${currentNote.trim()}` + (ripPart ? `\n\nRiparazione:\n${ripPart}` : "");
            } else if (appSection === 'riparazione') {
                const diagPart = extractNotePart(finalNotes, 'diagnostica') || finalNotes.replace(/Riparazione:[\s\S]*/i, "").trim();
                finalNotes = (diagPart ? `Diagnostica:\n${diagPart}\n\n` : "") + `Riparazione:\n${currentNote.trim()}`;
            }

            const fields = {
                ...formData,
                internal_notes: finalNotes,
                status: status,
                accessories: saveAccessories
            };
            
            body.append("fields", JSON.stringify(fields));
            body.append("warrantyHistory", JSON.stringify(warrantyHistory));

            const res = await axiosInstanceClient.post("/postApi", body);
            
            if (res.data.success) {
                const newId = res.data.recordid;
                setFormData(prev => ({ ...prev, recordid: newId }));
                
                if (status === 'Draft') {
                    toast.success("Bozza salvata");
                } else if (status === 'Riconsegnato') {
                    toast.success("Ticket Completato!");
                } else {
                    toast.success("Ticket registrato con successo!");
                    // setTimeout(() => window.location.reload(), 1500);
                }
                return newId;
            } else {
                toast.error("Errore nel salvataggio del ticket: " + res.data.error);
                return null;
            }
        } catch (err) {
            console.error(err);
            toast.error("Errore di rete");
            return null;
        } finally {
            setLoadingMethod(false);
        }
    };

    const handleSaveAndSign = async () => {
        if (validateStep(step)) {
            // Save as 'Aperto' to trigger signature mode on mobile
            const id = await handleSave('Entrata');
            if(id) {
                if (isMobile) {
                    setShowSignatureModal(true);
                } else {
                    const url = `${window.location.origin}/bixApps/lenovo-intake/mobile/${id}`;
                    setMobileUrl(url);
                    setShowQR(true); 
                    toast.info("Scansiona il QR con il telefono per firmare.");
                }
            }
        }
    };

    const handleSignatureSave = async (signatureData: string) => {
        toast.loading("Salvataggio firma in corso...");
        // set(true);
        try {
            const formDataLocal = new FormData();
            formDataLocal.append("apiRoute", "save_lenovo_signature");
            formDataLocal.append("recordid", formData.recordid);
            formDataLocal.append("img_base64", signatureData);
            formDataLocal.append("sig_type", appSection === 'consegna' ? 'delivery' : 'intake');

            const res = await axiosInstanceClient.post("/postApi", formDataLocal);
            if (res.data.success) {
                toast.dismiss();
                toast.success("Firma salvata!");
                setFormData(prev => ({ ...prev, signatureUrl: res.data.signatureUrl || "signed" }));
                setShowSignatureModal(false);
                // Reload to show signed state
                // window.location.reload();
            } else {
                toast.dismiss();
                toast.error("Impossibile salvare la firma");
            }
        } catch (e) {
            console.error(e);
            toast.dismiss();
            toast.error("Errore nel salvataggio della firma");
        } finally {
            // setUploading(false);
        }
    };

    const handlePrint = async (sigType?: 'intake' | 'delivery') => {
        if(!formData.recordid) return;
        
        const toastId = toast.loading("Generazione PDF in corso...");
        try {
            const printType = (sigType === 'intake' || appSection !== 'consegna') ? 'Ricevuta Firmata - Presa in Consegna' : 'Ricevuta Firmata - Riconsegna';
            const res = await axiosInstanceClient.post("/postApi", {
                apiRoute: "print_lenovo_ticket",
                recordid: formData.recordid,
                print_type: printType
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
                 toast.success("PDF scaricato");
            } else {
                 toast.dismiss(toastId);
                 toast.error("PDF generation failed");
            }
        } catch (e) {
             toast.dismiss(toastId);
             toast.error("Errore di rete");
        }
    };
    
    const needsIntakeSignature = formData.auth_factory_reset === 'Si' || formData.request_quote === 'Si' || formData.direct_repair === 'Si' || formData.auth_formatting === 'Si';

    return (
        <GenericComponent title="Lenovo Service Intake" response={fieldSettings} loading={loadingMethod} error={error}>
      {(response: any) => ( 
        <div className="min-h-screen overflow-auto bg-gray-50 text-gray-900 font-sans">
            
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 w-full mb-6">
                <div className="flex items-center gap-3">
                    {appSection !== 'initial' && (
                        <button
                            onClick={() => {goToInitial(true); setSearchSerial(formData.serial);}}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-gray-600 hover:text-[#E2231A] hover:bg-red-50 rounded-lg transition-colors border border-gray-200 mr-2"
                            title="Torna alla ricerca"
                        >
                            <Icons.ArrowLeftIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Ricerca</span>
                        </button>
                    )}
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
                        <p className="text-xs text-gray-400">Nuovo Ticket Assistenza</p>
                    </div>
                </div>
                <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium">{userName || user || 'Guest'}</p>
                    <p className="text-xs text-gray-400">{new Date().toLocaleDateString()}</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto pb-20 lg:pb-0 h-[calc(100vh-140px)] flex flex-col">
                
                {appSection === 'initial' && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
                            <Icons.QrCodeIcon className="w-16 h-16 mx-auto text-gray-400 mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ricerca Dispositivo</h2>
                            <p className="text-gray-500 mb-8 text-sm">Scannerizza o inserisci il Seriale (SN) del dispositivo per iniziare o riprendere la lavorazione.</p>
                            
                            <form onSubmit={(e) => handleBarcodeSearch(e)} className="flex flex-col gap-4">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={searchSerial}
                                        onChange={e => setSearchSerial(e.target.value)}
                                        placeholder="Es. PF2K..."
                                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-center text-xl font-mono uppercase tracking-widest focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all outline-none"
                                        autoFocus
                                    />
                                </div>
                                {showScanner && (
                                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
                                        <div className="w-full max-w-lg mb-4 text-center text-white font-bold">
                                        Inquadra il Codice a Barre
                                        </div>
                                        <div className="w-full max-w-lg h-[70vh] overflow-hidden rounded-2xl relative">
                                        <BarcodeScanner
                                            onDetected={(code) => {
                                            const serial = code.slice(-8);
                                            setSearchSerial(serial);
                                            setShowScanner(false);
                                            handleBarcodeSearch(undefined, serial);
                                            }}
                                            onClose={() => setShowScanner(false)}
                                        />
                                        </div>
                                    </div>
                                    )}
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="submit"
                                        disabled={isSearching || !searchSerial.trim()}
                                        className="w-full bg-[#E2231A] text-white py-4 rounded-xl font-bold text-[15px] sm:text-lg hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 outline-none"
                                    >
                                        {isSearching ? <Icons.ArrowPathIcon className="w-6 h-6 animate-spin shrink-0" /> : <Icons.MagnifyingGlassIcon className="w-6 h-6 shrink-0" />}
                                        <span className="truncate">Cerca / Inizia</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (isMobile) {
                                                setShowScanner(true);
                                            } else {
                                                if (showQR) return setShowQR(false);
                                                const sessionId = Math.random().toString(36).substring(2, 10);
                                                const url = `${window.location.origin}/bixApps/lenovo-intake/mobile/search?session_id=${sessionId}`;
                                                setMobileSessionId(sessionId);
                                                setMobileUrl(url);
                                                setShowQR(true);
                                            }
                                        }}
                                        className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-bold text-[15px] sm:text-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 outline-none"
                                    >
                                        <Icons.CameraIcon className="w-6 h-6 shrink-0" />
                                        <span className="truncate">Scannerizza</span>
                                    </button>
                                </div>
                            </form>
                            
                            {showQR && (
                                <div className="flex flex-col items-center justify-center mb-8 mt-8 p-6 bg-white rounded-2xl border-2 border-[#E2231A] text-center animate-in fade-in slide-in-from-top-4 shadow-xl relative ring-4 ring-red-50">
                                    <button 
                                        type="button"
                                        onClick={() => setShowQR(false)}
                                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                    >
                                        <Icons.XMarkIcon className="w-6 h-6" />
                                    </button>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Scansione Mobile</h3>
                                    <p className="text-gray-500 mb-4">Inquadra il QR con il telefono per la scansione!</p>
                                    
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 inline-block shadow-sm">
                                            <QRCode value={mobileUrl} size={180} />
                                    </div>
                                    <a href={mobileUrl} target="_blank" className="text-xs text-gray-400 font-mono mt-4 break-all bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                        {mobileUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {appSection === 'presa_in_consegna' && (
                    <>
                    <div className="mb-8 sticky top-[80px] z-20 bg-gray-50 p-4 lg:p-0 pt-2 pb-4">
                        {
                            step < 6 && (
                                <StepIndicator currentStep={step} onStepClick={(s) => {
                                     if (s < step) {
                                        setStep(s)
                                      } else if (s === step + 1) {
                                        if(validateStep(step)) setStep(s);
                                      }
                                }} />
                            )
                        }
                    </div>

                    <div ref={stepContentRef} className="flex-1 overflow-y-auto px-1 pb-24 lg:pb-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-4">Dettagli Cliente</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="relative" ref={searchRef}>
                                    <Label field="company_name" text="Azienda" />
                                    <input 
                                        type="text" 
                                        value={formData.company_name}
                                        onChange={e => {
                                            setFormData({...formData, company_name: e.target.value});
                                            searchCompanies(e.target.value);
                                        }}
                                        onFocus={() => { if(searchResults.length > 0) setShowResults(true); }}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Cerca Azienda..."
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
                                    <div className='flex flex-row gap-2'>
                                        <Label field="name" text="Nome Contatto" />
                                        <Label field="surname" text="" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Nome"
                                    />
                                    <input 
                                        type="text" 
                                        value={formData.surname}
                                        onChange={e => setFormData({...formData, surname: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Cognome"
                                    />
                                </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <Label field="address" text="Indirizzo" />
                                    <input 
                                        type="text" 
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Via, civico"
                                    />
                                </div>
                                <div>
                                    <Label field="place" text="Città/Località" />
                                    <input 
                                        type="text" 
                                        value={formData.place}
                                        onChange={e => setFormData({...formData, place: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Milano"
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
                                        placeholder="cliente@esempio.com"
                                    />
                                </div>
                                <div>
                                    <Label field="phone" text="Telefono" />
                                    <input 
                                        type="tel" 
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="+41 79 ..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-4 border-t border-gray-100 pt-4">
                                <button 
                                    onClick={() => setStep(5)}
                                    className="text-sm font-bold text-[#E2231A] hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    Vai al Riepilogo <Icons.PencilSquareIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Product & Credentials */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-2xl font-bold mb-4">Prodotto e Accesso</h2>
                            
                            {/* Product Fields */}
                            <div>
                                <Label field="serial" text="Numero Seriale" />
                                <div className="flex gap-2">
                                    <div className="relative w-full">
                                        <input 
                                            type="text" 
                                            value={formData.serial}
                                            onBlur={handleSerialBlur}
                                            onChange={e => setFormData({...formData, serial: e.target.value.toUpperCase()})}
                                            className="uppercase w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all font-mono tracking-wider"
                                            placeholder="PF..."
                                            disabled={isFetchingLenovo}
                                        />
                                        {isFetchingLenovo && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <RefreshCwIcon className="w-4 h-4 text-gray-400 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <Label field="brand" text="Marca" />
                                    <input 
                                        type="text" 
                                        value={formData.brand || "Lenovo"}
                                        onChange={e => setFormData({...formData, brand: e.target.value})}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all"
                                        placeholder="Lenovo, HP, Apple..."
                                    />
                                </div>
                                <div>
                                    <Label field="model" text="Modello" />
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
                                <Label field="accessories" text="Accessori" />
                                <div className="flex gap-2 w-full flex-col">
                                    <AccessorySelector
                                        selectedItems={Array.isArray(formData.accessories) ? formData.accessories : typeof formData.accessories === 'string' ? (formData.accessories as string).split(',') : []}
                                        onToggle={(item) => {
                                            setFormData(prev => {
                                                const current = Array.isArray(prev.accessories) ? prev.accessories : typeof prev.accessories === 'string' && prev.accessories ? (prev.accessories as string).split(',') : [];
                                                const exists = current.includes(item);
                                                const newAcc = exists 
                                                    ? current.filter(i => i !== item)
                                                    : [...current, item];
                                                return { ...prev, accessories: newAcc };
                                            });
                                        }}
                                        options={[...(lookups || []).map(l => ({ value: l.itemcode, label: l.itemdesc })), { value: 'Altro', label: 'Altro' }]}
                                    />
                                    { (Array.isArray(formData.accessories) ? formData.accessories : typeof formData.accessories === 'string' && formData.accessories ? (formData.accessories as string).split(',') : []).includes('Altro') && (
                                        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                                            <input 
                                                type="text" 
                                                value={formData.custom_accessory || ""}
                                                onChange={e => setFormData({...formData, custom_accessory: e.target.value})}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] text-sm transition-all"
                                                placeholder="Specifica l'accessorio personalizzato..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <Label field="pick_up" text="Pick Up" />
                                <Select
                                    value={formData.pick_up}
                                    onValueChange={(val) => setFormData({...formData, pick_up: val})}
                                >
                                    <SelectTrigger className="w-full bg-white border-gray-300 h-11 focus:ring-[#E2231A] focus:border-[#E2231A]">
                                        <SelectValue placeholder="Seleziona..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(pickUpLookups || []).map(l => (
                                            <SelectItem key={l.itemcode} value={l.itemcode} className="focus:bg-red-50 focus:text-[#E2231A]">{l.itemdesc}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Credentials */}
                            <div className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Credenziali d'Accesso</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                    {/* Step 3: Assistance */}
                    {step === 3 && (
                        <div className="space-y-6">
                             <h2 className="text-2xl font-bold mb-4">Descrizione Problema</h2>
                             <div>
                                <Label field="problem_description" text="Descrizione Problema" />
                                <textarea 
                                    value={formData.problem_description}
                                    onChange={e => setFormData({...formData, problem_description: e.target.value})}
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all h-32"
                                    placeholder="Descrivi il problema, codici errore, danni fisici..."
                                />
                             </div>

                             {/* Technician */}
                             <div>
                                <Label field="technician" text="Tecnico Assegnato" />
                                <SelectUser 
                                    lookupItems={usersLookup} 
                                    initialValue={formData.technician}
                                    onChange={(value) => setFormData(prev => ({...prev, technician: value as string}))}
                                />
                             </div>

                             {/* Warranty & Authorization */}
                             <div className="space-y-4 pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-bold">Garanzia</h3>
                                
                                {/* Warranty */}
                                <div className="flex items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                            <Icons.ShieldCheckIcon className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <label htmlFor="warranty" className="font-medium text-gray-700 cursor-pointer select-none">
                                            In Garanzia? {fieldSettings['warranty']?.required && <span className="text-red-500">*</span>}
                                        </label>
                                    </div>
                                    <Switch 
                                        id="warranty"
                                        checked={formData.warranty === 'Si'}
                                        onCheckedChange={(checked) => setFormData({...formData, warranty: checked ? 'Si' : 'No'})}
                                        className="data-[state=checked]:bg-[#E2231A]
                                                data-[state=unchecked]:bg-gray-300
                                                focus-visible:ring-[#E2231A]
                                                [&>span]:bg-white"
                                    />
                                </div>

                                {formData.warranty === 'Si' && (
                                     <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                             <Label field="warranty_type" text="Tipo Garanzia" />
                                             <Select
                                                 value={formData.warranty_type}
                                                 onValueChange={(val) => setFormData({...formData, warranty_type: val})}
                                             >
                                             <SelectTrigger className="w-full bg-white border-gray-300 h-11 focus:ring-[#E2231A] focus:border-[#E2231A]">
                                                 <SelectValue placeholder="Seleziona Tipo Garanzia..." />
                                             </SelectTrigger>
                                             <SelectContent>
                                                 <SelectItem className="focus:bg-red-50 focus:text-[#E2231A]" value="OnSite">OnSite Support</SelectItem>
                                                 <SelectItem className="focus:bg-red-50 focus:text-[#E2231A]" value="Depot">Depot / Carry-in</SelectItem>
                                                 <SelectItem className="focus:bg-red-50 focus:text-[#E2231A]" value="Premium">Premium Care</SelectItem>
                                                 <SelectItem className="focus:bg-red-50 focus:text-[#E2231A]" value="ADP">ADP (Accidental Damage)</SelectItem>
                                             </SelectContent>
                                             </Select>
                                     </div>
                                 )}

                                 {/* Warranty History Panel */}
                                 {warrantyHistory.length > 0 && (
                                     <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl">
                                         <div 
                                             className="flex justify-between items-center cursor-pointer mb-2 border-b pb-2"
                                             onClick={() => setShowWarrantyHistory(!showWarrantyHistory)}
                                         >
                                             <h4 className="text-sm font-bold text-gray-700 select-none">Storico Garanzia Lenovo</h4>
                                             <button type="button" className="text-gray-500 hover:text-gray-700">
                                                 {showWarrantyHistory ? (
                                                     <Icons.ChevronUpIcon className="w-5 h-5" />
                                                 ) : (
                                                     <Icons.ChevronDownIcon className="w-5 h-5" />
                                                 )}
                                             </button>
                                         </div>
                                         
                                         {showWarrantyHistory && (
                                             <div className="space-y-3 overflow-y-auto mt-3 pr-2">
                                                 {warrantyHistory.map((w, idx) => (
                                                     <div key={idx} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg text-sm">
                                                         <div className="flex justify-between items-start">
                                                             <span className="font-semibold text-gray-800">{w.name} ({w.type})</span>
                                                             {w.level && (
                                                                 <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium shrink-0 ml-2">
                                                                     {w.level}
                                                                 </span>
                                                             )}
                                                         </div>
                                                         <span className="text-gray-600">{w.deliveryTypeName}</span>
                                                         <div className="flex justify-between text-gray-500 text-xs mt-1">
                                                             <span>{w.startDate} da {w.endDate}</span>
                                                             <span className={`font-medium ${w.remainingDays > 0 ? "text-green-600" : "text-gray-400"}`}>
                                                                 {w.remainingDays > 0 ? `${w.remainingDays} giorni restanti` : "Scaduta"}
                                                             </span>
                                                         </div>
                                                         {w.description && (
                                                             <div className="mt-2 text-xs text-gray-500 italic border-t pt-1 border-gray-200">
                                                                 {w.description}
                                                             </div>
                                                         )}
                                                     </div>
                                                 ))}
                                             </div>
                                         )}
                                     </div>
                                 )}

                                <h2 className="text-2xl font-bold mb-4 border-t border-gray-100 pt-2">Autorizzazione</h2>

                            {/* ── System Operations ── */}
                            <div className="">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Operazioni di Sistema</p>
                                <div className="space-y-3">
                                <AuthCard
                                    checked={formData.auth_factory_reset === 'Si'}
                                    onChange={() => setFormData(prev => ({ ...prev, auth_factory_reset: prev.auth_factory_reset === 'Si' ? 'No' : 'Si' }))}
                                    title="Autorizza Ripristino Dati di Fabbrica"
                                    description="Il dispositivo verrà riportato alle impostazioni di fabbrica. I dati personali potrebbero andare persi."
                                    required={fieldSettings['auth_factory_reset']?.required}
                                    icon={<Icons.ArrowPathIcon className="w-5 h-5" />}
                                />
                                <AuthCard
                                    checked={formData.auth_formatting === 'Si'}
                                    onChange={() => setFormData(prev => ({ ...prev, auth_formatting: prev.auth_formatting === 'Si' ? 'No' : 'Si' }))}
                                    title="Autorizza Formattazione Completa"
                                    description="Formattazione completa del disco — tutti i dati verranno cancellati in modo definitivo."
                                    required={fieldSettings['auth_formatting']?.required}
                                    icon={<Icons.TrashIcon className="w-5 h-5" />}
                                />
                                </div>
                            </div>

                            {/* ── Financial Authorizations ── */}
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Autorizzazioni Finanziarie</p>
                                <div className="space-y-3">
                                <AuthCard
                                    checked={formData.request_quote === 'Si'}
                                    onChange={() => setFormData(prev => ({ ...prev, request_quote: prev.request_quote === 'Si' ? 'No' : 'Si' }))}
                                    title="Richiedi Preventivo di Riparazione"
                                    description="Si applica una tariffa diagnostica fino a CHF 50 in caso di rifiuto della riparazione post-valutazione."
                                    required={fieldSettings['request_quote']?.required}
                                    icon={<Icons.DocumentTextIcon className="w-5 h-5" />}
                                />
                                <AuthCard
                                    checked={formData.direct_repair === 'Si'}
                                    onChange={() => setFormData(prev => ({ ...prev, direct_repair: prev.direct_repair === 'Si' ? 'No' : 'Si' }))}
                                    title="Autorizza Riparazione Diretta"
                                    description="La riparazione procede senza preventivo, fino al limite di costo sotto indicato."
                                    required={fieldSettings['direct_repair']?.required}
                                    icon={<Icons.WrenchScrewdriverIcon className="w-5 h-5" />}
                                >
                                    <div className="flex items-center gap-3 pt-3 border-t border-dashed border-gray-200">
                                    <label className="text-xs font-semibold text-gray-600 shrink-0">Costo Max (CHF)</label>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">CHF</span>
                                        <input
                                        type="number"
                                        value={formData.direct_repair_limit}
                                        onChange={e => setFormData({ ...formData, direct_repair_limit: e.target.value })}
                                        className="w-full pl-11 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] outline-none"
                                        placeholder="e.g. 200"
                                        min={0}
                                        />
                                    </div>
                                    </div>
                                </AuthCard>
                                </div>
                            </div>
                             </div>
                        </div>
                    )}

                    {/* Step 4: Multimedia & Sign */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-2xl font-bold mb-4">Foto e Allegati</h2>
                            
                            {/* Foto Principale del Prodotto */}
                            <div>
                                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                                    <Icons.PhotoIcon className="w-5 h-5" /> Foto Principale Prodotto
                                </h3>
                                <p className="text-xs text-gray-400 mb-3">Foto che sarà allegata al ticket e alla ricevuta PDF. Clicca per caricarla o sostituirla.</p>
                                <div className="relative w-full h-44 rounded-xl overflow-hidden border-2 cursor-pointer group"
                                    style={formData.product_photo ? {
                                        backgroundImage: `url('/api/media-proxy?url=${formData.product_photo}')`,
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                        borderStyle: 'solid',
                                        borderColor: '#16a34a'
                                    } : { borderStyle: 'dashed', borderColor: '#d1d5db' }}>
                                    <input
                                        type="file"
                                        accept={isMobile ? "" : "image/*"}
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all ${formData.product_photo ? 'bg-black/0 group-hover:bg-black/40' : 'bg-gray-50'}`}>
                                        {formData.product_photo ? (
                                            <div className="opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center gap-2 text-white">
                                                <Icons.CameraIcon className="w-10 h-10 drop-shadow" />
                                                <span className="text-sm font-bold drop-shadow">Cambia Foto</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Icons.PhotoIcon className="w-10 h-10 text-gray-400 mb-2" />
                                                <p className="text-sm font-medium text-gray-500">Carica foto prodotto</p>
                                                <p className="text-xs text-gray-400">{isMobile ? "Scatta o scegli dal dispositivo" : "Clicca o trascina"}</p>
                                            </>
                                        )}
                                    </div>
                                    {formData.product_photo && (
                                        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow">
                                            <Icons.CheckCircleIcon className="w-3 h-3" /> Foto caricata
                                        </div>
                                    )}
                                </div>

                                {/* Mobile handoff for photo */}
                                {!isMobile && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (showQR) return setShowQR(false);
                                            let currentId = formData.recordid;
                                            if (!currentId) {
                                                const newId = await handleSave('Draft');
                                                if (newId) currentId = newId;
                                            }
                                            if (currentId) {
                                                const url = `${window.location.origin}/bixApps/lenovo-intake/mobile/${currentId}`;
                                                setMobileUrl(url);
                                                setShowQR(true);
                                            }
                                        }}
                                        className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Icons.DevicePhoneMobileIcon className="w-4 h-4" />
                                        {showQR ? 'Nascondi QR' : 'Usa il telefono per caricare la foto'}
                                    </button>
                                )}

                                {showQR && (
                                    <div className="flex flex-col items-center justify-center mt-4 p-6 bg-white rounded-2xl border-2 border-[#E2231A] text-center animate-in fade-in slide-in-from-top-4 shadow-xl relative ring-4 ring-red-50">
                                        <button 
                                            onClick={() => setShowQR(false)}
                                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                        >
                                            <Icons.XMarkIcon className="w-6 h-6" />
                                        </button>
                                        <h3 className="text-xl font-bold mb-2 text-gray-900">Scansiona QR per Foto</h3>
                                        <p className="text-gray-500 mb-4">Inquadra il QR con il telefono per incollare le foto nel ticket!</p>
                                        <div className="bg-white p-3 rounded-xl border border-gray-200 inline-block shadow-sm">
                                            <QRCode value={mobileUrl} size={180} />
                                        </div>
                                        <a href={mobileUrl} target="_blank" className="text-xs text-gray-400 font-mono mt-4 break-all bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                            {mobileUrl}
                                        </a>
                                    </div>
                                )}
                            </div>

                             <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    <Icons.PaperClipIcon className="w-5 h-5" /> Allegati
                                </h3>
                                
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex gap-4 mb-4">
                                        <input 
                                            type="text" 
                                            value={attachmentNote} 
                                            onChange={e => setAttachmentNote(e.target.value)}
                                            placeholder="Note per l'allegato (opzionale)"
                                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                multiple
                                                onChange={(e) => handleAttachmentUpload(e, 'pre-intervento')}
                                                disabled={isUploadingAttachment}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                                                {isUploadingAttachment ? <Icons.ArrowPathIcon className="w-4 h-4 animate-spin"/> : <Icons.PlusIcon className="w-4 h-4"/>}
                                                Aggiungi File
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
                                                            {att.type && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="font-medium px-2 py-0.5 bg-gray-100 rounded text-gray-600">{att.type}</span>
                                                                </>
                                                            )}
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
                                                <p className="text-gray-400 text-sm">Nessun allegato presente.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                        
                         
                    {/* Step 5: Sommario */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Icons.ClipboardDocumentCheckIcon className="w-8 h-8 text-[#E2231A]" />
                                Sommario
                            </h2>

                            <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 shadow-sm space-y-8">
                                
                                {/* Client Info */}
                                <div>
                                    <div className="flex items-center justify-between border-b border-red-200 pb-2 mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.UserIcon className="w-4 h-4 text-[#E2231A]" /> Dati Cliente
                                        </h3>
                                        <button onClick={() => setStep(1)} className="text-xs text-[#E2231A] font-medium hover:underline flex items-center gap-1">Modifica <Icons.PencilIcon className="w-3 h-3"/></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        {formData.company_name && <><span className="text-gray-500">Azienda</span><span className="font-bold">{formData.company_name}</span></>}
                                        {(formData.name || formData.surname) && <><span className="text-gray-500">Contatto</span><span className="font-bold">{formData.name} {formData.surname}</span></>}
                                        {formData.email && <><span className="text-gray-500">Email</span><span className="font-medium">{formData.email}</span></>}
                                        {formData.phone && <><span className="text-gray-500">Telefono</span><span className="font-medium">{formData.phone}</span></>}
                                        {formData.address && <><span className="text-gray-500">Indirizzo</span><span className="font-medium">{formData.address}, {formData.place}</span></>}
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div>
                                    <div className="flex items-center justify-between border-b border-red-200 pb-2 mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.ComputerDesktopIcon className="w-4 h-4 text-[#E2231A]" /> Prodotto e Accesso
                                        </h3>
                                        <button onClick={() => setStep(2)} className="text-xs text-[#E2231A] font-medium hover:underline flex items-center gap-1">Modifica <Icons.PencilIcon className="w-3 h-3"/></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        {formData.brand && <><span className="text-gray-500">Dispositivo</span><span className="font-bold">{formData.brand} {formData.model}</span></>}
                                        {formData.serial && <><span className="text-gray-500">Seriale</span><span className="font-mono bg-white px-1 border border-gray-200 rounded">{formData.serial}</span></>}
                                        {formData.username && <><span className="text-gray-500">Utente</span><span className="font-medium">{formData.username}</span></>}
                                        {formData.password && <><span className="text-gray-500">Password/PIN</span><span className="font-medium font-mono bg-white px-1 border border-gray-200 rounded">{formData.password}</span></>}
                                        {formData.pick_up && <><span className="text-gray-500">Pick Up</span><span className="font-medium">{pickUpLookups.find(l => l.itemcode === formData.pick_up)?.itemdesc || formData.pick_up}</span></>}
                                        {(formData.accessories && formData.accessories.length > 0) && <><span className="text-gray-500">Accessori</span><span className="font-medium">{Array.isArray(formData.accessories) ? formData.accessories.join(", ") : formData.accessories}</span></>}
                                    </div>
                                </div>

                                {/* Assistance Info */}
                                <div>
                                    <div className="flex items-center justify-between border-b border-red-200 pb-2 mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.WrenchScrewdriverIcon className="w-4 h-4 text-[#E2231A]" /> Assistenza
                                        </h3>
                                        <button onClick={() => setStep(3)} className="text-xs text-[#E2231A] font-medium hover:underline flex items-center gap-1">Modifica <Icons.PencilIcon className="w-3 h-3"/></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        {formData.problem_description && <><span className="text-gray-500">Problema</span><span className="font-semibold text-gray-900">{formData.problem_description}</span></>}
                                        <span className="text-gray-500">In Garanzia?</span><span className="font-bold">{formData.warranty} {formData.warranty === 'Si' ? `(${formData.warranty_type})` : ''}</span>
                                        <span className="text-gray-500">Auth. Ripristino</span><span className="font-bold">{formData.auth_factory_reset}</span>
                                        <span className="text-gray-500">Richiesta Preventivo</span><span className="font-bold">{formData.request_quote}</span>
                                        <span className="text-gray-500">Riparazione Diretta</span><span className="font-bold">{formData.direct_repair} {formData.direct_repair === 'Si' ? `(Max ${formData.direct_repair_limit} CHF)` : ''}</span>
                                        <span className="text-gray-500">Auth. Formattazione</span><span className="font-bold">{formData.auth_formatting}</span>
                                    </div>
                                </div>

                                {/* Multimedia & Allegati */}
                                <div>
                                    <div className="flex items-center justify-between border-b border-red-200 pb-2 mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.PaperClipIcon className="w-4 h-4 text-[#E2231A]" /> Allegati
                                        </h3>
                                        <button onClick={() => setStep(4)} className="text-xs text-[#E2231A] font-medium hover:underline flex items-center gap-1">Modifica <Icons.PencilIcon className="w-3 h-3"/></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        <span className="text-gray-500">Foto Dispositivo</span>
                                        <span className="font-bold">{formData.product_photo ? 'Presente' : 'Non presente'}</span>
                                        <span className="text-gray-500">Documenti/Altre foto</span>
                                        <span className="font-bold">
                                            {attachments.length > 0 
                                                ? `${attachments.length} caricati (Pre: ${attachments.filter(a => a.type === 'pre-intervento').length}, Post: ${attachments.filter(a => a.type === 'post-intervento').length}${attachments.filter(a => a.type !== 'pre-intervento' && a.type !== 'post-intervento').length > 0 ? `, Altri: ${attachments.filter(a => a.type !== 'pre-intervento' && a.type !== 'post-intervento').length}` : ''})` 
                                                : 'Nessuno'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-8">
                                <div className="flex flex-col items-center justify-center gap-4 text-center mt-6">
                                    <p className="text-gray-500 font-medium pb-2 max-w-sm">
                                        Verifica i dati riepilogati prima di accettare il dispositivo.
                                    </p>
                                </div>
                            </div>

                            {showQR && (
                                <div className="flex flex-col items-center justify-center mb-8 mt-8 p-6 bg-white rounded-2xl border-2 border-[#E2231A] text-center animate-in fade-in slide-in-from-top-4 shadow-xl relative ring-4 ring-red-50">
                                    <button 
                                        type="button"
                                        onClick={() => setShowQR(false)}
                                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                    >
                                        <Icons.XMarkIcon className="w-6 h-6" />
                                    </button>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Scansione Mobile</h3>
                                    <p className="text-gray-500 mb-4">Inquadra il QR con il telefono per la scansione!</p>
                                    
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 inline-block shadow-sm">
                                            <QRCode value={mobileUrl} size={180} />
                                    </div>
                                    <a href={mobileUrl} target="_blank" className="text-xs text-gray-400 font-mono mt-4 break-all bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                        {mobileUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 6: Completamento */}
                    {step === 6 && (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center justify-center py-10">
                            <Icons.CheckCircleIcon className="w-24 h-24 text-green-500 mb-4" />
                            <h2 className="text-3xl font-bold text-gray-900">Ticket Completato</h2>
                            <p className="text-gray-500 text-center max-w-md">
                                Il ticket è stato completato con successo. Puoi tornare alla Home o creare un nuovo ticket.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md">
                                <button 
                                    onClick={() => window.location.href = '/bixApps/bixMobileHub'}
                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-[#333333] text-white rounded-xl font-bold shadow hover:bg-black transition-all flex-1 text-center"
                                >
                                    <Icons.HomeIcon className="w-6 h-6" />
                                    Home
                                </button>
                                <button 
                                    onClick={() => window.location.href = '/bixApps/lenovo-intake'}
                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all flex-1 text-center"
                                >
                                    <RefreshCwIcon className="w-6 h-6" />
                                    Nuovo Ticket
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                </div>

                {step === 5 ? (
                    <div className="flex justify-between items-center w-full mt-4 bg-gray-50 p-4 border-t border-gray-200 -mx-4 px-4 lg:-mx-0 lg:px-0 lg:p-0 lg:mt-8 lg:border-none lg:bg-transparent">
                        <button
                            onClick={() => setStep(4)}
                            className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Indietro
                        </button>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={async () => {
                                    await handleSave(formData.status || "Draft");
                                }}
                                disabled={loadingMethod}
                                className="px-6 py-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                            >
                                Salva Modifiche
                            </button>
                            
                            {needsIntakeSignature && (!formData.signatureUrl || formData.signatureUrl == '') ? (
                                <button
                                    onClick={handleSaveAndSign}
                                    disabled={loadingMethod}
                                    className="px-8 py-4 bg-[#E2231A] text-white font-bold rounded-xl shadow-lg hover:bg-black transition-transform active:scale-95 flex items-center gap-3 disabled:opacity-50"
                                >
                                    <Icons.PencilSquareIcon className="w-5 h-5" /> 
                                    {loadingMethod ? 'Attendere...' : 'Firma e Passa in Entrata'}
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        const res = await handleSave("Entrata");
                                        if(res) {
                                            goToInitial();
                                            setSearchSerial(formData.serial);
                                        }
                                    }}
                                    disabled={loadingMethod}
                                    className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loadingMethod ? 'Salvataggio...' : 'Salva e passa in Entrata'}
                                    <Icons.ArrowRightIcon className="w-5 h-5" />
                                </button>
                            )}
                            
                            {needsIntakeSignature && formData.signatureUrl && (
                                <button
                                    onClick={() => handlePrint('intake')}
                                    className="px-6 py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center gap-2"
                                >
                                    <Icons.PrinterIcon className="w-5 h-5" /> Stampa Ricevuta
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 -mx-4 px-4 lg:-mx-0 lg:px-0 lg:p-0 lg:mt-8 lg:sticky lg:inset-auto lg:border-t-0 lg:bg-transparent">
                        <button 
                            onClick={() => step > 1 ? setStep(step - 1) : goToInitial()}
                            className={`px-6 py-3 rounded-xl font-medium transition-colors ${step >= 1 || appSection !== 'presa_in_consegna' ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' : 'invisible'}`}
                        >
                            Indietro
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    await handleSave(formData.status || "Draft");
                                }}
                                disabled={loadingMethod}
                                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                Salva Modifiche
                            </button>
                            <button 
                                onClick={handleNext}
                                className="px-8 py-3 bg-[#333333] text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2"
                            >
                                Avanti <Icons.ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
                </>
                )}

                {/* DIAGNOSTICA / RIPARAZIONE */}
                {(appSection === 'diagnostica' || appSection === 'riparazione') && (
                    <div className="flex-1 overflow-y-auto px-1 pb-24 lg:pb-8 pt-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8 animate-in fade-in slide-in-from-right-4">
                            
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {appSection === 'diagnostica' ? 'Diagnostica Ticket' : 'Riparazione Ticket'}
                                    </h2>
                                    <p className="text-gray-500 text-sm">Dispositivo: <span className="font-mono font-bold text-gray-700">{formData.serial}</span></p>
                                </div>
                                <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600 uppercase tracking-widest">
                                    {appSection}
                                </div>
                            </div>

                            {/* Info Base (Readonly) */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm">
                                <div><span className="text-gray-500 block text-xs">Cliente</span><span className="font-semibold">{formData.company_name || `${formData.name} ${formData.surname}`}</span></div>
                                <div><span className="text-gray-500 block text-xs">Modello</span><span className="font-semibold">{formData.brand} {formData.model}</span></div>
                                <div className="col-span-2"><span className="text-gray-500 block text-xs">Problema Dichiarato</span><span className="font-semibold">{formData.problem_description}</span></div>
                            </div>

                            {/* Note Interne / Diagnostica */}
                            <div>
                                <Label field="internal_notes" text={appSection === 'diagnostica' ? "Note Diagnostica" : "Note Riparazione"} />
                                <textarea 
                                    value={currentNote}
                                    onChange={e => setCurrentNote(e.target.value)}
                                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E2231A] focus:border-[#E2231A] transition-all h-32 text-sm"
                                    placeholder={appSection === 'diagnostica' ? "Annotazioni diagnostiche, problemi rilevati..." : "Dettagli sulla riparazione effettuata, test post-intervento..."}
                                />
                            </div>

                            {/* Riparazione: Componenti Sostituiti */}
                            {appSection === 'riparazione' && (
                                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Icons.WrenchScrewdriverIcon className="w-5 h-5" /> Componenti Sostituiti
                                    </h3>
                                    <textarea 
                                        value={formData.replaced_components}
                                        onChange={e => setFormData({...formData, replaced_components: e.target.value})}
                                        className="w-full p-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all h-32 text-sm"
                                        placeholder="Elenco seriali vecchi/nuovi, es:&#10;\nScheda Madre (Vecchio: X123, Nuovo: Y456)&#10;\nBatteria (Vecchio: B1, Nuovo: B2)"
                                    />
                                    <p className="text-xs text-blue-600 mt-2">Usa questo campo per tracciare tutti i seriali dei componenti sostituiti.</p>
                                    
                                    {/* Component Replacement Mini-Form */}
                                    <div className="mt-4 p-4 bg-white rounded-xl border border-blue-100 shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Aggiunta Rapida con Scanner</p>
                                            {!isMobile && (
                                                <button 
                                                    onClick={() => {
                                                        const newSessionId = Math.random().toString(36).substring(7);
                                                        setMobileSessionId(newSessionId);
                                                        setScannerTarget('components');
                                                    }}
                                                    className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition font-semibold"
                                                >
                                                    <Icons.DevicePhoneMobileIcon className="w-4 h-4" /> Usa Telefono
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-3">
                                            <input 
                                                type="text" 
                                                placeholder="Es. Batteria, Scheda Madre"
                                                value={compName}
                                                onChange={e => setCompName(e.target.value)}
                                                className="w-full p-3 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none" 
                                            />
                                            <div className="relative w-full">
                                                <input 
                                                    type="text" 
                                                    placeholder="Vecchio Seriale"
                                                    value={oldSerial}
                                                    onChange={e => setOldSerial(e.target.value)}
                                                    className="w-full p-3 pr-10 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50/30" 
                                                />
                                                <button 
                                                    onClick={() => {
                                                        if (!isMobile) setMobileSessionId(Math.random().toString(36).substring(7));
                                                        setScannerTarget('old');
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 p-1"
                                                >
                                                    <Icons.QrCodeIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="relative w-full">
                                                <input 
                                                    type="text" 
                                                    placeholder="Nuovo Seriale"
                                                    value={newSerial}
                                                    onChange={e => setNewSerial(e.target.value)}
                                                    className="w-full p-3 pr-10 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none bg-blue-50/30" 
                                                />
                                                <button 
                                                    onClick={() => {
                                                        if (!isMobile) setMobileSessionId(Math.random().toString(36).substring(7));
                                                        setScannerTarget('new');
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 p-1"
                                                >
                                                    <Icons.QrCodeIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-1">
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    if(!compName && !oldSerial && !newSerial) return;
                                                    const newLine = `${compName || 'Componente'} (Vecchio: ${oldSerial || '-'}, Nuovo: ${newSerial || '-'})`;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        replaced_components: prev.replaced_components ? prev.replaced_components + '\n' + newLine : newLine
                                                    }));
                                                    setCompName(""); setOldSerial(""); setNewSerial("");
                                                }}
                                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm active:scale-95"
                                            >
                                                Aggiungi
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Allegati */}
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Icons.CameraIcon className="w-5 h-5" /> Foto e Documenti
                                </h3>
                                
                                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                                    <input 
                                        type="text" 
                                        value={attachmentNote} 
                                        onChange={e => setAttachmentNote(e.target.value)}
                                        placeholder="Descrizione foto (opzionale)..."
                                        className="flex-1 p-3 border border-gray-300 rounded-lg text-sm"
                                    />
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:flex-none">
                                            <input 
                                                type="file" 
                                                onChange={(e) => {
                                                    const t = appSection === 'diagnostica' ? 'foto-diagnostica' : 'foto-riparazione';
                                                    handleAttachmentUpload(e, t);
                                                }}
                                                disabled={isUploadingAttachment}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <button className="w-full bg-[#333333] text-white font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-black transition-colors">
                                                {isUploadingAttachment ? <Icons.ArrowPathIcon className="w-5 h-5 animate-spin"/> : (isMobile ? <Icons.CameraIcon className="w-5 h-5"/> : <Icons.ArrowUpTrayIcon className="w-5 h-5"/>)}
                                                <span className="hidden sm:inline">{isMobile ? 'Carica / Scatta' : 'Upload PC'}</span>
                                                {isMobile && <span className="sm:hidden">Carica / Scatta</span>}
                                            </button>
                                        </div>
                                        {!isMobile && (
                                            <button 
                                                onClick={async () => {
                                                    if (showQR) return setShowQR(false);
                                                    const url = `${window.location.origin}/bixApps/lenovo-intake/mobile/${formData.recordid}`;
                                                    setMobileUrl(url);
                                                    setShowQR(true);
                                                }}
                                                className="flex-1 sm:flex-none bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Icons.QrCodeIcon className="w-5 h-5"/>
                                                <span className="hidden sm:inline">Usa Mobile</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {showQR && (
                                    <div className="flex flex-col items-center justify-center mb-8 mt-6 p-6 bg-white rounded-2xl border-2 border-[#E2231A] text-center animate-in fade-in slide-in-from-top-4 shadow-xl relative ring-4 ring-red-50">
                                        <button 
                                            onClick={() => setShowQR(false)}
                                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                        >
                                            <Icons.XMarkIcon className="w-6 h-6" />
                                        </button>
                                        <h3 className="text-xl font-bold mb-2 text-gray-900">Scansiona QR per Foto</h3>
                                        <p className="text-gray-500 mb-4">Inquadra il QR con il telefono per scattare foto e allegati!</p>
                                        
                                        <div className="bg-white p-3 rounded-xl border border-gray-200 inline-block shadow-sm">
                                                <QRCode value={mobileUrl} size={180} />
                                        </div>
                                        <a href={mobileUrl} target="_blank" className="text-xs text-gray-400 font-mono mt-4 break-all bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                            {mobileUrl}
                                        </a>
                                    </div>
                                )}

                                {/* Lista Allegati (mini) */}
                                {attachments.length > 0 && (
                                    <div className="mt-6 flex flex-wrap gap-4">
                                        {attachments.map((att, i) => {
                                            // Logica per determinare se è un'immagine e quale icona mostrare
                                            const extension = att.filename?.split('.').pop()?.toLowerCase() || '';
                                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
                                            const imageSrc = isImage ? `/api/media-proxy?url=${att.url}` : null;

                                            const getFileIcon = (ext) => {
                                                switch(ext) {
                                                    case 'pdf': return "📄";
                                                    case 'doc': case 'docx': return "📝";
                                                    case 'xls': case 'xlsx': return "📊";
                                                    case 'zip': case 'rar': return "🗜️";
                                                    default: return "📎";
                                                }
                                            };

                                            return (
                                                <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 min-w-[200px] flex-1">
                                                    {/* Box Anteprima/Icona */}
                                                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {imageSrc ? (
                                                            <img 
                                                                src={imageSrc} 
                                                                alt={att.filename} 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-lg">{getFileIcon(extension)}</span>
                                                        )}
                                                    </div>

                                                    {/* Testi */}
                                                    <div className="overflow-hidden">
                                                        <p className="text-xs font-bold truncate text-gray-700" title={att.filename}>
                                                            {att.filename}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 uppercase">
                                                            {extension || att.type} {att.note && `- ${att.note}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Azioni */}
                            <div className="flex justify-end items-center pt-8 border-t border-gray-100 mt-8 gap-4">
                                <button
                                    onClick={async () => {
                                        await handleSave(formData.status);
                                    }}
                                    disabled={loadingMethod}
                                    className="px-8 py-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                >
                                    Salva Modifiche
                                </button>
                                <button
                                    onClick={async () => {
                                        const statusObj = appSection === 'diagnostica' ? 'Diagnostica' : 'Riparato';
                                        const res = await handleSave(statusObj);
                                        if (res) {
                                            goToInitial();
                                            setSearchSerial(formData.serial);
                                        }
                                    }}
                                    disabled={loadingMethod}
                                    className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loadingMethod ? 'Salvataggio...' : `Completa e Salva come ${appSection === 'diagnostica' ? 'Diagnostica' : 'Riparato'}`}
                                    <Icons.CheckIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONSEGNA CON FIRMA */}
                {appSection === 'consegna' && (
                    <div className="flex-1 overflow-y-auto px-1 pb-24 lg:pb-8 pt-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Riconsegna Dispositivo</h2>
                                    <p className="text-gray-500 text-sm">Dispositivo: <span className="font-mono font-bold text-gray-700">{formData.serial}</span></p>
                                </div>
                                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold tracking-widest">
                                    PRONTO PER LA RICONSEGNA
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center mb-6">
                                <Icons.CheckBadgeIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Il ticket è stato processato</h3>
                                <p className="text-gray-500 text-sm max-w-md mx-auto">
                                    Le operazioni richieste sono state completate. Rivedi il sommario e procedi con la firma del cliente per la riconsegna.
                                </p>
                            </div>

                            {/* Sommario Readonly */}
                            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm space-y-8 mb-8">
                                {/* Client Info */}
                                <div>
                                    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.UserIcon className="w-4 h-4 text-green-600" /> Dati Cliente
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        {formData.company_name && <><span className="text-gray-500">Azienda</span><span className="font-bold">{formData.company_name}</span></>}
                                        {(formData.name || formData.surname) && <><span className="text-gray-500">Contatto</span><span className="font-bold">{formData.name} {formData.surname}</span></>}
                                        {formData.email && <><span className="text-gray-500">Email</span><span className="font-medium">{formData.email}</span></>}
                                        {formData.phone && <><span className="text-gray-500">Telefono</span><span className="font-medium">{formData.phone}</span></>}
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div>
                                    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.ComputerDesktopIcon className="w-4 h-4 text-green-600" /> Prodotto e Accesso
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        {formData.brand && <><span className="text-gray-500">Dispositivo</span><span className="font-bold">{formData.brand} {formData.model}</span></>}
                                        {formData.serial && <><span className="text-gray-500">Seriale</span><span className="font-mono bg-white px-1 border border-gray-200 rounded">{formData.serial}</span></>}
                                    </div>
                                </div>

                                {/* Assistance Info */}
                                <div>
                                    <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.WrenchScrewdriverIcon className="w-4 h-4 text-green-600" /> Intervento
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                        {formData.problem_description && <><span className="text-gray-500">Problema</span><span className="font-semibold text-gray-900">{formData.problem_description}</span></>}
                                        {formData.internal_notes && <><span className="text-gray-500">Note Riparazione</span><span className="font-medium text-gray-700 whitespace-pre-wrap">{formData.internal_notes}</span></>}
                                        {formData.replaced_components && <><span className="text-gray-500">Componenti Sost.</span><span className="font-medium text-blue-700 whitespace-pre-wrap">{formData.replaced_components}</span></>}
                                    </div>
                                </div>
                            </div>
                            
                            {formData.deliverySignatureUrl ? (
                                <div className="text-center p-6 bg-green-50 border border-green-200 rounded-xl">
                                    <Icons.DocumentCheckIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                    <h3 className="font-bold text-green-800 mb-2">Documento Firmato!</h3>
                                    <button
                                        onClick={() => handlePrint()}
                                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                                    >
                                        <Icons.PrinterIcon className="w-5 h-5" /> Scarica Ricevuta PDF
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                    <button 
                                        onClick={async () => {
                                            if (isMobile) {
                                                setShowSignatureModal(true);
                                            } else {
                                                const url = `${window.location.origin}/bixApps/lenovo-intake/mobile/${formData.recordid}`;
                                                setMobileUrl(url);
                                                setShowQR(true);
                                            }
                                        }}
                                        className="w-full sm:w-auto px-8 py-5 bg-[#E2231A] text-white font-bold rounded-xl shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-3 text-lg"
                                    >
                                        <Icons.PencilSquareIcon className="w-6 h-6" /> Firma Ora
                                    </button>
                                </div>
                            )}

                            {showQR && !formData.deliverySignatureUrl && (
                                <div className="flex flex-col items-center justify-center mb-8 p-6 bg-white rounded-2xl border-2 border-[#E2231A] text-center animate-in fade-in slide-in-from-top-4 shadow-xl relative ring-4 ring-red-50 mt-6">
                                    <button 
                                        onClick={() => setShowQR(false)}
                                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                    >
                                        <Icons.XMarkIcon className="w-6 h-6" />
                                    </button>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Inquadra per Firmare</h3>
                                    <p className="text-gray-500 mb-4">Inquadra il QR con il telefono per raccogliere la firma di consegna!</p>
                                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
                                        <Icons.ArrowPathIcon className="w-3 h-3 animate-spin" /> In attesa della firma...
                                    </p>
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 inline-block shadow-sm">
                                        <QRCode value={mobileUrl} size={180} />
                                    </div>
                                    <a href={mobileUrl} target="_blank" className="text-xs text-gray-400 font-mono mt-4 break-all bg-gray-50 p-2 rounded border border-gray-100 select-all">
                                        {mobileUrl}
                                    </a>
                                </div>
                            )}

                            <div className="flex justify-end items-center pt-8 border-t border-gray-100">
                                <button
                                    onClick={async () => {
                                        const res = await handleSave("Riconsegnato");
                                        if(res) {
                                            goToInitial();
                                            setSearchSerial(formData.serial);
                                        }
                                    }}
                                    disabled={!formData.deliverySignatureUrl || loadingMethod}
                                    className="px-8 py-4 bg-[#333333] text-white font-bold rounded-xl shadow-lg hover:bg-black transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {loadingMethod ? 'Salvataggio...' : 'Conferma Riconsegna'}
                                    <Icons.CheckCircleIcon className="w-5 h-5" />
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </main>
            
            {/* QR Modal for Signature/Mobile */}
            {showSignatureModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold mb-4 text-center">Firma Qui</h3>
                        <SignaturePad
                            onSave={handleSignatureSave}
                            onCancel={() => setShowSignatureModal(false)}
                        />
                    </div>
                </div>
            )}

            {/* Barcode Scanner Modal for Components */}
            {scannerTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Icons.QrCodeIcon className="w-6 h-6 text-blue-600" />
                                    {scannerTarget === 'components' ? 'Modalità Multicomponente' : 'Scansiona Seriale'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {scannerTarget === 'components' 
                                        ? '⚠️ Lascia aperto questo pannello finché non hai finito di inserire tutti i componenti dal telefono. ⚠️'
                                        : `Acquisizione seriale ${scannerTarget === 'old' ? 'VECCHIO' : 'NUOVO'}`
                                    }
                                </p>
                            </div>
                            <button 
                                onClick={() => {
                                    setScannerTarget(null);
                                    setMobileSessionId("");
                                }} 
                                className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-colors"
                            >
                                <Icons.XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="h-[60vh] min-h-[400px] max-h-[500px] rounded-xl overflow-hidden relative bg-black border-4 border-gray-100 shadow-inner flex flex-col items-center justify-center">
                            {isMobile && scannerTarget !== 'components' ? (
                                <BarcodeScanner 
                                    onDetected={(code) => {
                                        if(scannerTarget === 'old') setOldSerial(code);
                                        if(scannerTarget === 'new') setNewSerial(code);
                                        setScannerTarget(null);
                                        toast.success(`Seriale acquisito: ${code}`);
                                    }}
                                    onClose={() => setScannerTarget(null)}
                                />
                            ) : (
                                <div className={`bg-white p-4 rounded-xl text-center h-full w-full flex flex-col items-center justify-center gap-4 ${scannerTarget === 'components' ? 'overflow-y-auto' : ''}`}>
                                    <div className="shrink-0 flex items-center justify-center p-2 border-2 border-dashed border-gray-200 rounded-xl">
                                        <QRCode value={`${window.location.origin}/bixApps/lenovo-intake/mobile/search?session_id=${mobileSessionId}${scannerTarget === 'components' ? '&mode=components' : ''}`} size={scannerTarget === 'components' ? 120 : 200} />
                                    </div>
                                    {scannerTarget === 'components' ? (
                                        <div className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-y-auto max-h-32 shadow-inner">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 sticky top-0 bg-gray-50 pb-1">
                                                <Icons.ArrowDownTrayIcon className="w-3 h-3" />
                                                Componenti Sincronizzati
                                            </p>
                                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                                                {formData.replaced_components ? formData.replaced_components : <span className="text-gray-400 italic">In attesa di ricezione...</span>}
                                            </pre>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 font-medium text-sm">
                                            Inquadra dal telefono per leggere<br/>il Seriale {scannerTarget === 'old' ? 'VECCHIO' : 'NUOVO'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
    </GenericComponent>
    );
}

