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
            foto: File | null;
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
                    foto: null
                }
            };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                spesa: {
                    tipo: TIPO[0].value, 
                    importo: 0,
                    pagamento: PAGAMENTO[0].value, 
                    note: "",
                    foto: null
                }
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
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
        const file = e.target.files?.[0];
    
        if (file) {
            setResponseData(prev => ({
                ...prev,
                spesa: {
                    ...prev.spesa,
                    foto: file
                }
            }));
    
            const previewUrl = URL.createObjectURL(file);
            setFotoPreview(previewUrl);
        }
    };

    const caricaFoto = (): void => {
        fileInputRef.current?.click();
    };

    const rimuoviFoto = () => {
        setResponseData(prev => ({
            ...prev,
            spesa: {
                ...prev.spesa,
                foto: null
            }
        }));
    
        setFotoPreview(null);
    
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        return () => {
            if (fotoPreview) {
                URL.revokeObjectURL(fotoPreview);
            }
        };
    }, [fotoPreview]);

    const handleSubmit = (event: React.FormEvent) => {
        
    };

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="flex items-center justify-center p-4">
                    <div className="overflow-hidden bg-white shadow-md border border-gray-200">
                        <div className="w-full flex flex-col justify-center items-center p-4">
                            <Image
                                    src="/bixdata/logos/winteler.png"
                                    alt=""
                                    width={400}
                                    height={200}
                                />
                        </div>

                        <div className="w-full flex flex-col justify-center p-5 mb-8">
                            <form onSubmit={handleSubmit} className='w-full'>
                                <div className='p-4'>
                                    <div className="mb-8">
                                        <FloatingLabelSelect
                                            id="tipo"
                                            name="tipo"
                                            label="tipo"
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
                                            label="importo"
                                            value={response.spesa.importo}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-8">
                                        <FloatingLabelSelect
                                            id="pagamento"
                                            name="pagamento"
                                            label="pagamento"
                                            value={response.spesa.pagamento}
                                            onChange={handleChange}
                                            options={PAGAMENTO}
                                        />
                                    </div>

                                    <div className="mb-8">
                                        <FloatingLabelInput
                                            id="note"
                                            name="note"
                                            label="note"
                                            value={response.spesa.note}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {fotoPreview && (
                                        <div className="mb-4 flex flex-col items-center">
                                            <p className="font-semibold mb-2">Anteprima:</p>
                                            <Image
                                                src={fotoPreview}
                                                alt="Anteprima scontrino"
                                                width={200}
                                                height={200}
                                                className="object-contain border border-gray-300"
                                            />
                                        </div>
                                    )}

                                    <input
                                            type="file"
                                            ref={fileInputRef} 
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*"
                                        />

                                    <GeneralButton
                                        text={responseData.spesa.foto ? 'Cambia Foto' : 'Carica Foto'} 
                                        className='mb-4'
                                        action={caricaFoto}
                                        type="button" 
                                    />

                                    {fotoPreview && (
                                            <GeneralButton
                                                text='Rimuovi foto'
                                                action={rimuoviFoto}
                                                type="button"
                                                className="mb-4" 
                                            />
                                        )}

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


