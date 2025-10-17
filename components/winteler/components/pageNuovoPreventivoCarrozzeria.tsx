import React, { useMemo, useContext, useState, useEffect, useRef } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from "../../genericComponent";
import { AppContext } from '@/context/appContext';
import GeneralButton from './generalButton';
import FloatingLabelInput from './floatingLabelInput';
import Image from 'next/image';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
            propExampleValue?: string;
        }

        interface PreventivoCarrozzeria {
            nome: string;
            cognome: string;
            targa: string;
            telaio: string;
            modello: string;
            utente: string;
            foto: File[];
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            preventivoCarrozzeria: PreventivoCarrozzeria;
        }

export default function PageNuovaPreventivoCarrozzeria({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                preventivoCarrozzeria: {
                    nome: "",
                    cognome: "",
                    targa: "",
                    telaio: "",
                    modello: "",
                    utente: "",
                    foto: []
                }
            };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                preventivoCarrozzeria: {
                    nome: "",
                    cognome: "",
                    targa: "",
                    telaio: "",
                    modello: "",
                    utente: "",
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

    const handleChange = (path: string, value: any) => {
        setResponseData(prev => {
            const newState = { ...prev };

            const keys = path.split('.');
            let currentLevel: any = newState.preventivoCarrozzeria;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]] = { ...currentLevel[keys[i]] };
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = value;
    
            return newState;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
    
        if (files && files.length > 0) {
            const newFiles = Array.from(files);

            setResponseData(prev => ({
                ...prev,
                preventivoCarrozzeria: {
                    ...prev.preventivoCarrozzeria,
                    foto: [...prev.preventivoCarrozzeria.foto, ...newFiles] 
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
            preventivoCarrozzeria: {
                ...prev.preventivoCarrozzeria,
                foto: prev.preventivoCarrozzeria.foto.filter((_, index) => index !== indexToRemove)
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
        savePreventivoCarrozzeria(
            responseData.preventivoCarrozzeria
        );
    };

    async function savePreventivoCarrozzeria({nome, cognome, targa, telaio, modello, utente}: PreventivoCarrozzeria) {
        try {
            const response = await axiosInstanceClient.post("/postApi",
                { 
                    apiRoute: "save_preventivo_carrozzeria",
                    nome,
                    cognome,
                    targa,
                    telaio,
                    modello,
                    utente
                  }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` 
                  },
            });
        } catch (error) {
            console.log(error);
        }
    }

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

                                    <div className="mb-8">
                                        <FloatingLabelInput
                                            id="nome"
                                            name="nome"
                                            label="Nome cliente"
                                            value={response.preventivoCarrozzeria.nome}
                                            onChange={(e) => handleChange('nome', e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="cognome"
                                            name="cognome"
                                            label="Cognome cliente"
                                            value={response.preventivoCarrozzeria.cognome}
                                            onChange={(e) => handleChange('cognome', e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="targa"
                                            name="targa"
                                            label="Targa"
                                            value={response.preventivoCarrozzeria.targa}
                                            onChange={(e) => handleChange('targa', e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="telaio"
                                            name="telaio"
                                            label="Telaio"
                                            value={response.preventivoCarrozzeria.telaio}
                                            onChange={(e) => handleChange('telaio', e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="modello"
                                            name="modello"
                                            label="Modello"
                                            value={response.preventivoCarrozzeria.modello}
                                            onChange={(e) => handleChange('modello', e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="utente"
                                            name="utente"
                                            label="Utente"
                                            value={response.preventivoCarrozzeria.utente}
                                            onChange={(e) => handleChange('utente', e.target.value)}
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
                                        text={response.preventivoCarrozzeria.foto.length > 0 ? 'Aggiungi Foto' : 'Carica Foto'} 
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


