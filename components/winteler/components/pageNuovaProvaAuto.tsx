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
import CondizioniNoleggio from './condizioni_noleggio';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

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
            data: Date;
            foto: File[];
        }

        interface SituazioneRientro {
            km: number;
            data: Date;
            foto: File[];
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          provaAuto: ProvaAuto
        }

const formatDateForInput = (date: Date | null): string => {
    if (!date) return ''; 
    return new Date(date).toISOString().split('T')[0];
};

const formatTimeForInput = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};


export default function PageNuovaProvaAuto({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

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


    const [activeIndex, setActiveIndex] = useState("");

    const [patenteUrlMap, setPatenteUrlMap] = useState(new Map<File, string>());
    const [partenzaUrlMap, setPartenzaUrlMap] = useState(new Map<File, string>());
    const [rientroUrlMap, setRientroUrlMap] = useState(new Map<File, string>());

    const [currentPhotoPath, setCurrentPhotoPath] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);

    const openPage = (route) => {

    };


    const toggleCategory = (section: string) => {
        setActiveIndex(prevIndex => (prevIndex === section ? "" : section));
    };

    const handleChange = (path: string, value: any) => {
        setResponseData(prev => {
            const newState = { ...prev };
            const keys = path.split('.');

            if (path === 'situazionePartenza.data' || path === 'situazioneRientro.data') {
                const datePathKey = keys[0] as 'situazionePartenza' | 'situazioneRientro';
                const existingDate = new Date(prev.provaAuto[datePathKey].data);

                if (typeof value === 'string' && value.includes('-')) { 
                    const [year, month, day] = value.split('-').map(Number);
                    existingDate.setFullYear(year, month - 1, day);
                } else if (typeof value === 'string' && value.includes(':')) { 
                    const [hours, minutes] = value.split(':').map(Number);
                    existingDate.setHours(hours, minutes, 0, 0); 
                }

                let currentLevel: any = newState.provaAuto;
                for (let i = 0; i < keys.length - 1; i++) {
                    currentLevel = currentLevel[keys[i]];
                }
                currentLevel[keys[keys.length - 1]] = existingDate;

            } else { 
                let currentLevel: any = newState.provaAuto;
                for (let i = 0; i < keys.length - 1; i++) {
                    currentLevel[keys[i]] = { ...currentLevel[keys[i]] };
                    currentLevel = currentLevel[keys[i]];
                }
                const processedValue = typeof value === 'boolean' ? value : value;
                currentLevel[keys[keys.length - 1]] = processedValue;
            }

            return newState;
        });
    };

    const handleCaricaFotoClick = (path: string) => {
        setCurrentPhotoPath(path);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (files && files.length > 0 && currentPhotoPath) {
            const newFiles = Array.from(files);

            setResponseData(prev => {
                const newState = { ...prev };
                const keys = currentPhotoPath.split('.');
                let currentLevel: any = newState.provaAuto;
                for (let i = 0; i < keys.length - 1; i++) {
                    currentLevel = currentLevel[keys[i]];
                }
                currentLevel[keys[keys.length - 1]] = [...currentLevel[keys[keys.length - 1]], ...newFiles];
                return newState;
            });
        }
    };

    const rimuoviFoto = (indexToRemove: number, path: string) => {
        setResponseData(prev => {
            const newState = { ...prev };
            const keys = path.split('.');
            let currentLevel: any = newState.provaAuto;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            const oldFiles = currentLevel[keys[keys.length - 1]];
            currentLevel[keys[keys.length - 1]] = oldFiles.filter((_, index) => index !== indexToRemove);
            return newState;
        });
    
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        const syncUrls = (files: File[], currentMap: Map<File, string>, setUrlMap: React.Dispatch<React.SetStateAction<Map<File, string>>>) => {
            const newMap = new Map<File, string>();
            const filesSet = new Set(files);
    
            currentMap.forEach((url, file) => {
                if (!filesSet.has(file)) {
                    URL.revokeObjectURL(url);
                }
            });
    
            files.forEach(file => {
                if (currentMap.has(file)) {
                    newMap.set(file, currentMap.get(file)!); 
                } else {
                    newMap.set(file, URL.createObjectURL(file));
                }
            });
    
            setUrlMap(newMap);
        };
    
        syncUrls(responseData.provaAuto.datiCliente.fotoPatente, patenteUrlMap, setPatenteUrlMap);
        syncUrls(responseData.provaAuto.situazionePartenza.foto, partenzaUrlMap, setPartenzaUrlMap);
        syncUrls(responseData.provaAuto.situazioneRientro.foto, rientroUrlMap, setRientroUrlMap);
    
    }, [
        responseData.provaAuto.datiCliente.fotoPatente,
        responseData.provaAuto.situazionePartenza.foto,
        responseData.provaAuto.situazioneRientro.foto
    ]);

    const handleScanSuccess = (decodedText, decodedResult) => {
        console.log(`Codice scansionato: ${decodedText}`, decodedResult);

        handleChange('datiAuto.barcode', decodedText);

        setScanResult(decodedText);
        setScanError(null);
    };


    const handleScanError = (errorMessage) => {
        console.error("Errore di scansione:", errorMessage);
        if (scanError) {
            setScanError(errorMessage);
        }
    };


    const handleSubmit = (event: React.FormEvent) => {

    };


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

                                        {/* Dati auto */}
                                        <div
                                            key="dati-auto"
                                            className="bg-white shadow overflow-hidden border border-gray-200"
                                        >
                                            <button
                                                type="button"
                                                className="w-full text-left flex items-center p-4 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                                                onClick={() => toggleCategory("dati-auto")}
                                                aria-expanded={activeIndex === "dati-auto"}
                                            >
                                                <span>Dati auto</span>
                                            </button>

                                            {activeIndex === "dati-auto" && (
                                                <>
                                                    <div className='p-4'>
                                                        {/* QR Code reader */}
                                                        <BarcodeScanner
                                                            onScanSuccess={handleScanSuccess}
                                                            onScanError={handleScanError}
                                                            />

                                                        <div className="mb-8 mt-8 flex items-center">
                                                            <div className="w-1/2 pr-2">
                                                                <FloatingLabelInput
                                                                    id="barcode"
                                                                    name="barcode"
                                                                    label="Barcode"
                                                                    value={response.provaAuto.datiAuto.barcode}
                                                                    onChange={(e) => handleChange('datiAuto.barcode', e.target.value)}
                                                                />
                                                            </div>

                                                            <div className='w-1/2 pl-2'>
                                                                <GeneralButton
                                                                    text='cerca'
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mb-8 mt-8 flex items-center">
                                                            <div className="w-1/2 pr-2">
                                                                <FloatingLabelInput
                                                                    id="telaio"
                                                                    name="telaio"
                                                                    label="Telaio"
                                                                    value={response.provaAuto.datiAuto.telaio}
                                                                    onChange={(e) => handleChange('datiAuto.telaio', e.target.value)}
                                                                />
                                                            </div>

                                                            <div className='w-1/2 pl-2'>
                                                                <GeneralButton
                                                                    text='cerca'
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="modello"
                                                                name="modello"
                                                                label="Modello"
                                                                value={response.provaAuto.datiAuto.modello}
                                                                onChange={(e) => handleChange('datiAuto.modello', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="targa"
                                                                name="targa"
                                                                label="Targa"
                                                                value={response.provaAuto.datiAuto.targa}
                                                                onChange={(e) => handleChange('datiAuto.targa', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <label className="flex items-center space-x-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={response.provaAuto.datiAuto.provaFutura}
                                                                    onChange={(e) => handleChange('datiAuto.provaFutura', e.target.checked)}
                                                                />
                                                                <span>Prova Futura</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                </>
                                            )}

                                        </div>

                                        {/* Dati cliente */}
                                        <div
                                            key="dati-cliente"
                                            className="bg-white shadow overflow-hidden border border-gray-200"
                                        >
                                            <button
                                                type="button"
                                                className="w-full text-left flex items-center p-4 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                                                onClick={() => toggleCategory("dati-cliente")}
                                                aria-expanded={activeIndex === "dati-cliente"}
                                            >
                                                <span>Dati cliente</span>
                                            </button>

                                            {activeIndex === "dati-cliente" && (
                                                <>
                                                    <div className='p-4'>
                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="cognome"
                                                                name="cognome"
                                                                label="Cognome"
                                                                value={response.provaAuto.datiCliente.cognome}
                                                                onChange={(e) => handleChange('datiCliente.cognome', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="nome"
                                                                name="nome"
                                                                label="Nome"
                                                                value={response.provaAuto.datiCliente.nome}
                                                                onChange={(e) => handleChange('datiCliente.nome', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="email"
                                                                name="email"
                                                                label="Email"
                                                                type='email'
                                                                value={response.provaAuto.datiCliente.email}
                                                                onChange={(e) => handleChange('datiCliente.email', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="indirizzo"
                                                                name="indirizzo"
                                                                label="Via / N. Civico"
                                                                value={response.provaAuto.datiCliente.indirizzo}
                                                                onChange={(e) => handleChange('datiCliente.indirizzo', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="cap"
                                                                name="cap"
                                                                label="CAP"
                                                                value={response.provaAuto.datiCliente.cap}
                                                                onChange={(e) => handleChange('datiCliente.cap', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="citta"
                                                                name="citta"
                                                                label="Città"
                                                                value={response.provaAuto.datiCliente.citta}
                                                                onChange={(e) => handleChange('datiCliente.citta', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="telefono"
                                                                name="telefono"
                                                                label="Telefono"
                                                                value={response.provaAuto.datiCliente.telefono}
                                                                onChange={(e) => handleChange('datiCliente.telefono', e.target.value)}
                                                            />
                                                        </div>

                                                        {patenteUrlMap.size > 0 && (
                                                            <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                                {Array.from(patenteUrlMap.entries()).map(([file, url], index) => (
                                                                    <div key={url} className="relative flex flex-col items-center">
                                                                        <Image
                                                                            src={url}
                                                                            alt={`Anteprima ${index + 1}`}
                                                                            width={150}
                                                                            height={150}
                                                                            className="object-contain border border-gray-300 rounded"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => rimuoviFoto(index, 'datiCliente.fotoPatente')}
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
                                                            text={response.provaAuto.datiCliente.fotoPatente.length > 0 ? 'Aggiungi Foto' : 'Carica Foto'}
                                                            className='mb-4'
                                                            action={() => handleCaricaFotoClick('datiCliente.fotoPatente')}
                                                            type="button"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                        </div>

                                        {/* Situazione partenza */}
                                        <div
                                            key="situazione-partenza"
                                            className="bg-white shadow overflow-hidden border border-gray-200"
                                        >
                                            <button
                                                type="button"
                                                className="w-full text-left flex items-center p-4 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                                                onClick={() => toggleCategory("situazione-partenza")}
                                                aria-expanded={activeIndex === "situazione-partenza"}
                                            >
                                                <span>Situazione partenza</span>
                                            </button>

                                            {activeIndex === "situazione-partenza" && (
                                                <>
                                                    <div className='p-4'>
                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="km"
                                                                name="km"
                                                                label="Km partenza"
                                                                type='number'
                                                                value={response.provaAuto.situazionePartenza.km}
                                                                onChange={(e) => handleChange('situazionePartenza.km', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="dataPartenza"
                                                                name="dataPartenza"
                                                                label="Data partenza"
                                                                type='date'
                                                                value={formatDateForInput(response.provaAuto.situazionePartenza.data)}
                                                                onChange={(e) => handleChange('situazionePartenza.data', e.target.value)}
                                                            />
                                                        </div>

                                                        <div className="mb-8 mt-8">
                                                            <FloatingLabelInput
                                                                id="oraPartenza"
                                                                name="oraPartenza"
                                                                label="Ora partenza"
                                                                type='time'
                                                                value={formatTimeForInput(response.provaAuto.situazionePartenza.data)}
                                                                onChange={(e) => handleChange('situazionePartenza.data', e.target.value)}
                                                            />
                                                        </div>

                                                        {partenzaUrlMap.size > 0 && (
                                                            <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                                {Array.from(partenzaUrlMap.entries()).map(([file, url], index) => (
                                                                    <div key={url} className="relative flex flex-col items-center">
                                                                        <Image
                                                                            src={url}
                                                                            alt={`Anteprima ${index + 1}`}
                                                                            width={150}
                                                                            height={150}
                                                                            className="object-contain border border-gray-300 rounded"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => rimuoviFoto(index, 'situazionePartenza.foto')}
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
                                                            text={response.provaAuto.situazionePartenza.foto.length > 0 ? 'Aggiungi Foto' : 'Carica Foto'}
                                                            className='mb-4'
                                                            action={() => handleCaricaFotoClick('situazionePartenza.foto')}
                                                            type="button"
                                                        />

                                                    </div>
                                                </>
                                            )}

                                        </div>

                                        {/* Situazione rientro */}
                                        <div
                                            key="situazione-rientro"
                                            className="bg-white shadow overflow-hidden border border-gray-200"
                                        >
                                            <button
                                                type="button"
                                                className="w-full text-left flex items-center p-4 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                                                onClick={() => toggleCategory("situazione-rientro")}
                                                aria-expanded={activeIndex === "situazione-rientro"}
                                            >
                                                <span>Situazione rientro </span>
                                            </button>

                                            {activeIndex === "situazione-rientro" && (
                                                <>
                                                <div className='p-4'>
                                                    <div className="mb-8 mt-8">
                                                        <FloatingLabelInput
                                                            id="km"
                                                            name="km"
                                                            label="Km arrivo"
                                                            type='number'
                                                            value={response.provaAuto.situazioneRientro.km}
                                                            onChange={(e) => handleChange('situazioneRientro.km', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="mb-8 mt-8">
                                                        <FloatingLabelInput
                                                            id="dataRientro"
                                                            name="dataRientro"
                                                            label="Data arrivo"
                                                            type='date'
                                                            value={formatDateForInput(response.provaAuto.situazioneRientro.data)}
                                                            onChange={(e) => handleChange('situazioneRientro.data', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="mb-8 mt-8">
                                                        <FloatingLabelInput
                                                            id="oraRientro"
                                                            name="oraRientro"
                                                            label="Ora arrivo"
                                                            type='time'
                                                            value={formatTimeForInput(response.provaAuto.situazioneRientro.data)}
                                                            onChange={(e) => handleChange('situazioneRientro.data', e.target.value)}
                                                        />
                                                    </div>

                                                    {rientroUrlMap.size > 0 && (
                                                        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                            {Array.from(rientroUrlMap.entries()).map(([file, url], index) => (
                                                                <div key={url} className="relative flex flex-col items-center">
                                                                    <Image
                                                                        src={url}
                                                                        alt={`Anteprima ${index + 1}`}
                                                                        width={150}
                                                                        height={150}
                                                                        className="object-contain border border-gray-300 rounded"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => rimuoviFoto(index, 'situazioneRientro.foto')}
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
                                                    text={response.provaAuto.situazioneRientro.foto.length > 0 ? 'Aggiungi Foto' : 'Carica Foto'}
                                                    className='mb-4'
                                                    action={() => handleCaricaFotoClick('situazioneRientro.foto')}
                                                    type="button"
                                                />

                                                </div>
                                            </>
                                            )}

                                        </div>

                                        {/* Condizioni di noleggio */}
                                        <div
                                            key="condizioni-noleggio"
                                            className="bg-white shadow overflow-hidden border border-gray-200"
                                        >
                                            <button
                                                type="button"
                                                className="w-full text-left flex items-center p-4 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                                                onClick={() => toggleCategory("condizioni-noleggio")}
                                                aria-expanded={activeIndex === "condizioni-noleggio"}
                                            >
                                                <span>Condizioni di noleggio</span>
                                            </button>

                                            {activeIndex === "condizioni-noleggio" && (
                                                <div className='max-w-lg'>
                                                    <CondizioniNoleggio />
                                                </div>
                                            )}

                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <FloatingLabelInput
                                            id="note"
                                            name="note"
                                            label="Note"
                                            value={response.provaAuto.note}
                                            onChange={(e) => handleChange('note', e.target.value)}
                                        />
                                    </div>

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