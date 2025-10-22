import React, { useMemo, useContext, useState, useEffect, useCallback } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from "../../../genericComponent";
import { AppContext } from '@/context/appContext';
import GeneralButton from '../generalButton';
import FloatingLabelInput from '../floatingLabelInput';
import Image from 'next/image';
import { PROVA_AUTO_SCHEMA } from '../schema/provaAutoSchema';
import { useGeneralFormState } from '../useGeneralFormState';
import { GeneralFormTemplate } from '../generalFormTemplate';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        interface ProvaAuto {
            datiAuto: DatiAuto;
            datiCliente: DatiCliente;
            situazionePartenza: SituazionePartenza;
            situazioneRientro: SituazioneRientro;
            note: string;
        }

        interface DatiAuto {
            barcode: string;
            telaio: string;
            modello: string;
            targa: string;
            provaFutura: boolean;
        }

        interface DatiCliente {
            cognome: string;
            nome: string;
            email: string;
            indirizzo: string;
            cap: string;
            citta: string;
            telefono: string;
            fotoPatente: File[];
        }

        interface SituazionePartenza {
            km: number;
            data: Date | null;
            foto: File[];
        }

        interface SituazioneRientro {
            km: number;
            data: Date | null;
            foto: File[];
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          provaAuto: ProvaAuto
        }

export default function NuovaProvaAuto({ onChangeView }) {
    //DATI
            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                provaAuto: {
                    datiAuto: {
                        barcode: "",
                        telaio: "",
                        modello: "",
                        targa: "",
                        provaFutura: false,
                    },
                    datiCliente: {
                        cognome: "",
                        nome: "",
                        email: "",
                        indirizzo: "",
                        cap: "",
                        citta: "",
                        telefono: "",
                        fotoPatente: []
                    },
                    situazionePartenza: {
                        km: 0,
                        data: null, 
                        foto: []
                    },
                    situazioneRientro: {
                        km: 0,
                        data: null,
                        foto: []
                    },
                    note: ""
                },
            };

            // DATI RESPONSE PER LO SVILUPPO
            const responseDataDEV: ResponseInterface = {
                provaAuto: {
                    datiAuto: {
                        barcode: "",
                        telaio: "",
                        modello: "",
                        targa: "",
                        provaFutura: false,
                    },
                    datiCliente: {
                        cognome: "",
                        nome: "",
                        email: "",
                        indirizzo: "",
                        cap: "",
                        citta: "",
                        telefono: "",
                        fotoPatente: []
                    },
                    situazionePartenza: {
                        km: 0,
                        data: null,
                        foto: []
                    },
                    situazioneRientro: {
                        km: 0,
                        data: null,
                        foto: []
                    },
                    note: ""
                },
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'examplepost', // riferimento api per il backend
        };
    }, []);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error, elapsedTime } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    // PER DEVELLOPMENT
    useEffect(() => {
        setResponseData({ ...responseDataDEV });
    }, []);

    const [searchError, setSearchError] = useState<string | null>(null);


    const validateForm = (schema: any, formData: any) => {
        const errors: any = {};
        let isValid = true;
    
        schema.forEach((section: any) => {
            section.fields?.forEach((field: any) => {
                if (field.required) {
                    const keys = field.path.split('.');
                    let value = formData; 
                    for (const key of keys) {
                        if (value && value[key] !== undefined) {
                            value = value[key];
                        } else {
                            value = undefined;
                            break;
                        }
                    }
    
                    const isValueEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
                    
                    if (isValueEmpty) {
                        isValid = false;
                        errors[section.key] = errors[section.key] || [];
                        errors[section.key].push({ path: field.path, label: field.label, message: `${field.label} è obbligatorio.` });
                    }
                }
            });
        });
    
        return { isValid, errors };
    };

    const allFotoPaths = useMemo(() => {
        return PROVA_AUTO_SCHEMA
            .filter(section => section.specialComponent === 'PhotoUpload' && section.specialDataPath)
            .map(section => section.specialDataPath as string);
    }, []);

    function openPage(route) {
        onChangeView(route);
    }

    const {
        formData, handleChange, activeIndex, toggleCategory, handleCaricaFotoClick,
        handleFileChange, rimuoviFoto, photoUrlMaps, fileInputRef,
    } = useGeneralFormState(responseData, allFotoPaths);

    const handleScanSuccess = (decodedText: string, decodedResult: any) => { handleChange('provaAuto.datiAuto.barcode', decodedText); };
    const handleScanError = (errorMessage: string) => { console.error("Scan Error:", errorMessage); };
    const formatDateForInput = (date: Date | null): string => date ? new Date(date).toISOString().split('T')[0] : '';
    const formatTimeForInput = (date: Date | null): string => {
        if (!date) return '';
        const d = new Date(date);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const [validationErrors, setValidationErrors] = useState({});

    const handleSubmit = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        
        const { isValid, errors } = validateForm(PROVA_AUTO_SCHEMA, formData);
        
        if (!isValid) {
            setValidationErrors(errors);
            console.error("Validation failed:", errors);
            
            const firstErrorKey = Object.keys(errors)[0];
            if (firstErrorKey) toggleCategory(firstErrorKey);
            
            alert("Compila tutti i campi obbligatori!");
            return;
        }

        setValidationErrors({}); 

        console.log("Form Data Validated and ready to submit:", formData);
        
        const provaAuto = formData.provaAuto;
        saveProvaAuto(
            provaAuto,
        );
    }, [formData, toggleCategory]);

    async function saveProvaAuto(provaAuto: ProvaAuto) {
        try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "save_prova_auto",
                    barcode: provaAuto.datiAuto.barcode,
                    telaio: provaAuto.datiAuto.telaio,
                    modello: provaAuto.datiAuto.modello,
                    targa: provaAuto.datiAuto.targa,
                    provaFutura: provaAuto.datiAuto.provaFutura,
                    cognome: provaAuto.datiCliente.cognome,
                    nome: provaAuto.datiCliente.nome,
                    email: provaAuto.datiCliente.email,
                    via: provaAuto.datiCliente.indirizzo,
                    cap: provaAuto.datiCliente.cap,
                    citta: provaAuto.datiCliente.citta,
                    telefono: provaAuto.datiCliente.telefono,
                    kmpartenza: provaAuto.situazionePartenza.km,
                    datapartenza: provaAuto.situazionePartenza.data,
                    kmarrivo: provaAuto.situazioneRientro.km,
                    dataarrivo: provaAuto.situazioneRientro.data,
                    note: provaAuto.note,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
        } catch (error) {
            console.log(error);
        }
    }

    const handleSearchBarcode = useCallback(async () => {
        setSearchError(null);
        const barcodeValue = formData.provaAuto.datiAuto.barcode;
        if (!barcodeValue) {
            setSearchError("Inserisci un Barcode per la ricerca.");
            return;
        }

        try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "search_scheda_auto",
                    barcode: barcodeValue,
                    telaio: "",
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.status == 200) {
                console.log(response.data.scheda_auto);
                handleChange(
                    "provaAuto.datiAuto.barcode",
                    response.data.scheda_auto.barcode
                );
                handleChange(
                    "provaAuto.datiAuto.telaio",
                    response.data.scheda_auto.telaio
                );
                handleChange(
                    "provaAuto.datiAuto.modello",
                    response.data.scheda_auto.modello
                );
            }
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const errorMessage =
                    error.response.data?.messaggio || "Errore sconosciuto.";

                if (status === 400) {
                    setSearchError(`Errore di input: ${errorMessage}`);
                } else if (status === 404) {
                    setSearchError(`Dati auto non trovati`);
                } else {
                    setSearchError(
                        "Si è verificato un errore del server. Riprova più tardi."
                    );
                }
            } else {
                setSearchError(
                    "Impossibile connettersi al server. Controlla la tua connessione."
                );
            }
        }
        
    }, [formData, handleChange]);

    const handleSearchTelaio = useCallback(async () => {
        setSearchError(null);

        const telaioValue = formData.provaAuto.datiAuto.telaio;
        if (!telaioValue) {
            setSearchError("Inserisci un Telaio per la ricerca.");
            return;
        }

        try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "search_scheda_auto",
                    barcode: "",
                    telaio: telaioValue,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (response.status == 200) {
                console.log(response.data.scheda_auto);
                handleChange(
                    "provaAuto.datiAuto.barcode",
                    response.data.scheda_auto.barcode
                );
                handleChange(
                    "provaAuto.datiAuto.telaio",
                    response.data.scheda_auto.telaio
                );
                handleChange(
                    "provaAuto.datiAuto.modello",
                    response.data.scheda_auto.modello
                );
            }
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const errorMessage =
                    error.response.data?.messaggio || "Errore sconosciuto.";

                if (status === 400) {
                    setSearchError(`Errore di input: ${errorMessage}`);
                } else if (status === 404) {
                    setSearchError(`Dati auto non trovati`);
                } else {
                    setSearchError(
                        "Si è verificato un errore del server. Riprova più tardi."
                    );
                }
            } else {
                setSearchError(
                    "Impossibile connettersi al server. Controlla la tua connessione."
                );
            }
        }
    }, [formData, handleChange]);

    const dynamicSchema = useMemo(() => {
        return PROVA_AUTO_SCHEMA.map((section) => {
            if (section.key === "datiAuto") {
                return {
                    ...section,
                    fields: section.fields.map((field) => {
                        if (field.id === "barcode" && field.actionButton) {
                            return {
                                ...field,
                                actionButton: {
                                    ...field.actionButton,
                                    action: handleSearchBarcode, 
                                },
                            };
                        }
                        if (field.id === "telaio" && field.actionButton) {
                            return {
                                ...field,
                                actionButton: {
                                    ...field.actionButton,
                                    action: handleSearchTelaio,
                                },
                            };
                        }
                        return field;
                    }),
                };
            }
            return section;
        });
    }, [handleSearchBarcode, handleSearchTelaio]);

    return (
        <GenericComponent
            response={responseData}
            loading={loading}
            error={error}>
            {(response: ResponseInterface) => (
                <div className="w-full flex flex-col justify-center p-5 mb-8">
                    <form
                        onSubmit={handleSubmit}
                        className="w-full">
                        <div className="p-4">
                            <div className="w-full flex flex-col justify-center p-5 mb-8">
                                {searchError && (
                                    <div className="text-center p-4 mb-4 bg-red-50 border border-red-200">
                                        <p className="text-sm text-gray-800">
                                            {searchError}
                                        </p>
                                    </div>
                                )}

                                <GeneralFormTemplate
                                    schema={dynamicSchema}
                                    formData={formData}
                                    handleChange={handleChange}
                                    activeIndex={activeIndex}
                                    toggleCategory={toggleCategory}
                                    handleCaricaFotoClick={
                                        handleCaricaFotoClick
                                    }
                                    rimuoviFoto={rimuoviFoto}
                                    photoUrlMaps={photoUrlMaps}
                                    formatDateForInput={formatDateForInput}
                                    formatTimeForInput={formatTimeForInput}
                                    validationErrors={validationErrors}
                                    validateForm={validateForm}
                                />

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                />
                            </div>

                            <div className="mb-8">
                                <FloatingLabelInput
                                    id="note"
                                    name="note"
                                    label="Note"
                                    value={formData.provaAuto.note}
                                    onChange={(e) =>
                                        handleChange(
                                            "provaAuto.note",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <GeneralButton
                                type="submit"
                                text="salva"
                                className="mb-4"
                            />
                        </div>
                    </form>
                    <GeneralButton
                        text="menu"
                        action={() => {
                            openPage("menu");
                        }}
                    />
                </div>
            )}
        </GenericComponent>
    );
};