import React, { useMemo, useContext, useState, useEffect, useCallback } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from "../../genericComponent";
import { AppContext } from '@/context/appContext';
import GeneralButton from './generalButton';
import FloatingLabelInput from './floatingLabelInput';
import Image from 'next/image';
import { CHECK_LIST_SCHEMA } from './schema/checkListSchema';
import { useGeneralFormState } from './useGeneralFormState';
import { GeneralFormTemplate } from './generalFormTemplate';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        interface Venditore {
            value: number;
            label: string;
        }

        interface CheckList {
            datiCliente: DatiCliente,
            datiVettura: DatiVettura,
            controlloOfficina: ControlloOfficina,
            controlloCarrozzeria: ControlloCarrozzeria,
            foto: File[]
        }

        interface DatiCliente {
            nome: string;
            indirizzo: string;
            telefono: string;
            email: string;
            venditore: string;
        }

        interface DatiVettura {
            marca: string;
            modello: string;
            telaio: string;
            targa: string;
            km: string;
        }

        interface ControlloOfficina {
            pneumatici: Pneumatici,
            cerchi: Record<string, 'ok' | 'non ok' | ''>;
            freni: Freni;
            motore: Motore;
            assale: Assale;
            parabrezza: Parabrezza;
            batteria: Batteria;
            testBreve: 'si' | 'no' | string;
            msiPlus: MSIPlus;
            starclass: Starclass;
            osservazioni: string;
            stimaCosti: string;
        }

        interface Pneumatici {
            antSx: { mm: string | number | null, data: Date | null },
            antDx: { mm: string | number | null, data: Date | null },
            postSx: { mm: string | number | null, data: Date | null },
            postDx: { mm: string | number | null, data: Date | null },
        }

        interface FrenoDati {
            perc: string | number; 
            stato: 'ok' | 'sost' | string; 
        }

        interface Freni {
            antSx: FrenoDati;
            antDx: FrenoDati;
            postSx: FrenoDati;
            postDx: FrenoDati;
        }

        interface Motore {
            olio: { 
                perdite: 'si' | 'no' | string, 
                dove: string
            },
            liquido: { 
                perdite: 'si' | 'no' | string, 
                dove: string
            },
        }

        interface Assale {
            anteriore: {
                presente: 'si' | 'no' | string, 
                dove: string
            },
            posteriore: {
                presente: 'si' | 'no' | string, 
                dove: string
            }
        }

        interface Parabrezza {
            danni: 'si' | 'no' | string, 
            sostituzione: 'si' | 'no' | string, 
        }

        interface Batteria {
            avviamento: 'ok' | 'sost' | string, 
            secondaria: 'ok' | 'sost' | string, 
        }

        interface MSIPlus {
            presente: 'si' | 'no' | string,
            scadenza: Date | null
        }

        interface Starclass {
            presente: 'si' | 'no' | string,
            scadenza: Date | null
        }

        interface ControlloCarrozzeria {
            grandinata: 'si' | 'no' | string,
            osservazioni: string,
            stimaCosti: string,
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            checkList: CheckList,
            venditori: Venditore[]
        }

export default function PageCheckList({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                checkList: {
                    datiCliente: {
                        nome: "",
                        indirizzo: "",
                        telefono: "",
                        email: "",
                        venditore: "", 
                    },
                    datiVettura: {
                        marca: "",
                        modello: "",
                        telaio: "",
                        targa: "",
                        km: "",
                    },
                    controlloOfficina: {
                        pneumatici: { 
                            antSx: { mm: "", data: null },
                            antDx: { mm: "", data: null },
                            postSx: { mm: "", data: null },
                            postDx: { mm: "", data: null },
                        },
                        cerchi: {},
                        freni: {
                            antSx: { perc: "", stato: "" },
                            antDx: { perc: "", stato: "" },
                            postSx: { perc: "", stato: "" },
                            postDx: { perc: "", stato: "" },
                        },
                        motore: {
                            olio: { 
                                perdite: "",
                                dove: "",
                            },
                            liquido: { 
                                perdite: "",
                                dove: "",
                            },
                        },
                        assale: {
                            anteriore: {
                                presente: "",
                                dove: "",
                            },
                            posteriore: {
                                presente: "",
                                dove: "",
                            },
                        },
                        parabrezza: {
                            danni: "",
                            sostituzione: "",
                        },
                        batteria: {
                            avviamento:"",
                            secondaria: "",
                        },
                        testBreve: "",
                        msiPlus: {
                            presente: "",
                            scadenza: null,
                        },
                        starclass: {
                            presente: "",
                            scadenza: null,
                        },
                        osservazioni: "",
                        stimaCosti: "",
                    },
                    controlloCarrozzeria: {
                        grandinata: "",
                        osservazioni: "",
                        stimaCosti: "",
                    },
                    foto: []
                },
                venditori: [], 
            };

            // DATI RESPONSE PER LO SVILUPPO
            const responseDataDEV: ResponseInterface = {
                checkList: {
                    datiCliente: {
                        nome: "",
                        indirizzo: "",
                        telefono: "",
                        email: "",
                        venditore: "", 
                    },
                    datiVettura: {
                        marca: "",
                        modello: "",
                        telaio: "",
                        targa: "",
                        km: "",
                    },
                    controlloOfficina: {
                        pneumatici: { 
                            antSx: { mm: "", data: null },
                            antDx: { mm: "", data: null },
                            postSx: { mm: "", data: null },
                            postDx: { mm: "", data: null },
                        },
                        cerchi: {},
                        freni: {
                            antSx: { perc: "", stato: "" },
                            antDx: { perc: "", stato: "" },
                            postSx: { perc: "", stato: "" },
                            postDx: { perc: "", stato: "" },
                        },
                        motore: {
                            olio: { 
                                perdite: "",
                                dove: "",
                            },
                            liquido: { 
                                perdite: "",
                                dove: "",
                            },
                        },
                        assale: {
                            anteriore: {
                                presente: "",
                                dove: "",
                            },
                            posteriore: {
                                presente: "",
                                dove: "",
                            },
                        },
                        parabrezza: {
                            danni: "",
                            sostituzione: "",
                        },
                        batteria: {
                            avviamento:"",
                            secondaria: "",
                        },
                        testBreve: "",
                        msiPlus: {
                            presente: "",
                            scadenza: null,
                        },
                        starclass: {
                            presente: "",
                            scadenza: null,
                        },
                        osservazioni: "",
                        stimaCosti: "",
                    },
                    controlloCarrozzeria: {
                        grandinata: "",
                        osservazioni: "",
                        stimaCosti: "",
                    },
                    foto: []
                },
                venditori: [
                    { value: 1, label: 'Giulio Verdi' },
                    { value: 2, label: 'Anna Rossi' },
                    { value: 3, label: 'Mario Bianchi' },
                ],
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
            example1: propExampleValue
        };
    }, [propExampleValue]);

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
        return CHECK_LIST_SCHEMA
            .filter(section => section.specialComponent === 'PhotoUpload' && section.specialDataPath)
            .map(section => section.specialDataPath as string);
    }, []);

    function openPage(arg0: string) {
        throw new Error('Function not implemented.');
    }

    const {
        formData, handleChange, activeIndex, toggleCategory, handleCaricaFotoClick,
        handleFileChange, rimuoviFoto, photoUrlMaps, fileInputRef,
    } = useGeneralFormState(responseData, allFotoPaths);

    const formatDateForInput = (date: Date | null): string => date ? new Date(date).toISOString().split('T')[0] : '';
    const formatTimeForInput = (date: Date | null): string => {
        if (!date) return ''; //
        const d = new Date(date);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const [validationErrors, setValidationErrors] = useState({});

    const handleSubmit = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        
        const { isValid, errors } = validateForm(CHECK_LIST_SCHEMA, formData);
        
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
        
        
    }, [formData, toggleCategory]);

    const schemaWithVenditori = useMemo(() => {
        const venditoriOptions = responseData.venditori.map(v => ({
            value: String(v.value),
            label: v.label,
        }));

        const updatedSchema = JSON.parse(JSON.stringify(CHECK_LIST_SCHEMA)); 

        const datiClienteSection = updatedSchema.find((s: any) => s.key === 'datiCliente');
        if (datiClienteSection && datiClienteSection.fields) {
            const venditoreField = datiClienteSection.fields.find((f: any) => f.id === 'venditore');
            if (venditoreField && venditoreField.type === 'select') {
                venditoreField.options = venditoriOptions;
            }
        }
        return updatedSchema;
    }, [responseData.venditori]);

    return (
        <GenericComponent response={responseData} loading={loading} error={error}>
            {(response: ResponseInterface) => (
                <div className="flex items-start justify-center p-0 sm:p-4 overflow-y-auto max-h-screen">
                    <div className="overflow-hidden bg-white shadow-md border border-gray-200">
                        <div className="w-full flex flex-col justify-center items-center p-4">
                            <Image
                                src="/bixdata/logos/winteler.png"
                                alt="Logo Winteler"
                                width={400}
                                height={200}
                                className="w-full h-auto"
                            />
                        </div>

                        <div className="w-full flex flex-col justify-center p-5 mb-8">
                            <form onSubmit={handleSubmit} className='w-full'>
                                <div className='p-4'>
                                    <div className="w-full flex flex-col justify-center p-5 mb-8">

                                        <GeneralFormTemplate
                                            schema={schemaWithVenditori}
                                            formData={formData} 
                                            handleChange={handleChange}
                                            activeIndex={activeIndex}
                                            toggleCategory={toggleCategory}
                                            handleCaricaFotoClick={handleCaricaFotoClick}
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

                                    <GeneralButton type="submit" text='salva' className='mb-4' />
                                </div>
                            </form>
                            <GeneralButton text='menu' action={() => {openPage("/menu")}} />
                        </div>
                    </div>
                </div>
            )}
        </GenericComponent>
    );
};