import React, { useMemo, useContext, useState, useEffect, useRef } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from "../../genericComponent";
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { forEach } from 'lodash';
import GeneralButton from './generalButton';
import FloatingLabelInput from './floatingLabelInput';
import Image from 'next/image';
import BarcodeScanner from './barcodeScanner';
import FloatingLabelSelect from './floatingLabelSelect';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

const TIPO = [
    {value: 'Carburante', label: 'Carburante'},
    {value: 'Ristorazione', label: 'Ristorazione'},
    {value: 'Omaggi clienti', label: 'Omaggi Clienti'},
    {value: 'Altro', label: 'Altro'},
]

const PAGAMENTO = [
    {value: 'Carta di Credito Garage', label: 'Carta di Credito Garage'},
    {value: 'Carta di Credito Propria', label: 'Carta di Credito Propria'},
    {value: 'Contanti da rimborsare', label: 'Contanti da rimborsare'},
]

type ExtractValue<T extends ReadonlyArray<{ value: any, label: any }>> = T[number]['value'];

type TipoValue = ExtractValue<typeof TIPO>;
type PagamentoValue = ExtractValue<typeof PAGAMENTO>;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        interface Spesa {
            tipo: TipoValue;
            importo: number;
            pagamento: PagamentoValue;
            note: string;
            foto: File[] ;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          spesa: Spesa
        }

export default function PageNoteSpese({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                spesa: {
                    tipo: TIPO[0].value, 
                    importo: 0,
                    pagamento: PAGAMENTO[0].value, 
                    note: "",
                    foto: []
                }
            };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                spesa: {
                    tipo: TIPO[0].value, 
                    importo: 0,
                    pagamento: PAGAMENTO[0].value, 
                    note: "",
                    foto: []
                }
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    const [fotoPreview, setFotoPreview] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const openPage = (route) => {
        
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        setResponseData(prevData => {
            let processedValue: string | number | boolean = value;
    
            if (type === 'number') {
                processedValue = parseInt(value) || 0;
            } 
            else if (type === 'checkbox') {
                const isChecked = (e.target as HTMLInputElement).checked;
                processedValue = isChecked ? 'Si' : 'No'; 
            }
            else {
                processedValue = value;
            }
            
            return {
                ...prevData,
                spesa: {
                    ...prevData.spesa,
                    [name]: processedValue as any, 
                }
            };
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
    
        if (files && files.length > 0) {
            const newFiles = Array.from(files);

            setResponseData(prev => ({
                ...prev,
                spesa: {
                    ...prev.spesa,
                    foto: [...prev.spesa.foto, ...newFiles] 
                }
            }));
    
            const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));

            setFotoPreview(prev => [...prev, ...newPreviewUrls]);
        }
    };

    const caricaFoto = (): void => {
        fileInputRef.current?.click();
    };

    const rimuoviFoto = (indexToRemove: number) => {
        URL.revokeObjectURL(fotoPreview[indexToRemove]);

        setResponseData(prev => ({
            ...prev,
            spesa: {
                ...prev.spesa,
                foto: prev.spesa.foto.filter((_, index) => index !== indexToRemove)
            }
        }));
    
        setFotoPreview(prev => prev.filter((_, index) => index !== indexToRemove));
    
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        return () => {
            fotoPreview.forEach(url => URL.revokeObjectURL(url));
        };
    }, [fotoPreview]);

    const handleSubmit = (event: React.FormEvent) => {
        
    };

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="flex items-center justify-center p-4 overflow-y-auto max-h-screen">
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
                                    <div className="mb-8">
                                        <FloatingLabelSelect
                                            id="tipo"
                                            name="tipo"
                                            label="Tipo"
                                            value={response.spesa.tipo}
                                            onChange={handleChange}
                                            options={TIPO}
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            type='number'
                                            id="importo"
                                            name="importo"
                                            label="Importo"
                                            value={response.spesa.importo}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-8">
                                        <FloatingLabelSelect
                                            id="pagamento"
                                            name="pagamento"
                                            label="Pagamento"
                                            value={response.spesa.pagamento}
                                            onChange={handleChange}
                                            options={PAGAMENTO}
                                        />
                                    </div>

                                    <div className="mb-8">
                                        <FloatingLabelInput
                                            id="note"
                                            name="note"
                                            label="Note"
                                            value={response.spesa.note}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {fotoPreview.length > 0 && (
                                        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {fotoPreview.map((previewUrl, index) => (
                                                <div key={index} className="relative flex flex-col items-center">
                                                    <Image
                                                        src={previewUrl}
                                                        alt={`Anteprima ${index + 1}`}
                                                        width={150}
                                                        height={150}
                                                        className="object-contain border border-gray-300 rounded"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => rimuoviFoto(index)}
                                                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        Rimuovi
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <input
                                            type="file"
                                            ref={fileInputRef} 
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                        />

                                    <GeneralButton
                                        text={response.spesa.foto.length > 0 ? 'Aggiungi Foto' : 'Carica Foto'} 
                                        className='mb-4'
                                        action={caricaFoto}
                                        type="button" 
                                    />

                                    <GeneralButton 
                                        type="submit" 
                                        text='salva' 
                                        className='mb-4'
                                        />
                                </div>
                            </form>
                            <GeneralButton
                                text='menu'
                                action={() => openPage("/menu")}
                                />
                        </div>
                    </div>
                </div>
            )}
        </GenericComponent>
    );
};


