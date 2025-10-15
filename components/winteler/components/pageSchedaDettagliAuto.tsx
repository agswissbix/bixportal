import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from "../../genericComponent";
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { forEach } from 'lodash';
import GeneralButton from './generalButton';
import FloatingLabelInput from './floatingLabelInput';
import Image from 'next/image';

import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, CloudIcon, EyeIcon, FireIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';



const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        interface SchedaAuto {
            id: string;
            dati: Dati;
            documento_principale: Documento;
            allegati: Documento[];
            collegati: Link[];
        }

        interface Dati {
            barcode: string;
            modello: string;
            libro_auto: string;
            numero_wb: string;
            telaio: string;
            designazione: string;
        }

        interface Documento {
            titolo?: string;
            path: string;
        }

        interface Link {
            titolo?: string;
            path: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          scheda_auto: SchedaAuto
        }

export default function PageSchedaDettagliAuto({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                scheda_auto: {
                    id: '',
                    dati: {
                        barcode: '',
                        modello: '',
                        libro_auto: '',
                        numero_wb: '',
                        telaio: '',
                        designazione:'',
                    },
                    documento_principale: {
                        titolo: '',
                        path: '',
                    },
                    allegati: [],
                    collegati: [],
                }
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                scheda_auto: {
                    id: '12345',
                    dati: {
                        barcode: 'AUTO20212345',
                        modello: 'GLA',
                        libro_auto: '113200',
                        numero_wb: '0157100091',
                        telaio: 'W1N2477541J3074666',
                        designazione:'Mercedes-AMG GLA 45 S 4MATIC+',
                    },
                    documento_principale: {
                        titolo: 'Documento Principale',
                        path: 'il_mio_file.pdf',
                    },
                    allegati: [
                        {
                            titolo: 'Certificato di Conformità',
                            path: '/documenti/auto/54321/certificato_conformita.pdf'
                        },
                        {
                            path: '/documenti/auto/54321/libretto_tagliandi.pdf'
                        },
                        {
                            titolo: 'Ultima Revisione',
                            path: '/documenti/auto/54321/revisione_10-2025.pdf'
                        },
                        {
                            path: '/documenti/auto/54321/fattura_acquisto_cliente.pdf'
                        },
                        {
                            titolo: 'Foto Danni Grandine',
                            path: '/documenti/auto/54321/danni_grandine_01.jpg'
                        },
                        {
                            path: '/documenti/auto/54321/documentazione_varia.pdf'
                        }
                    ],
                    collegati: [
                        {
                            titolo: 'Anagrafica Cliente: Mario Rossi',
                            path: '/clienti/9876'
                        },
                        {
                            titolo: 'Contratto di Vendita N. C-2025-112',
                            path: '/contratti/C-2025-112'
                        },
                        {
                            titolo: 'Scheda di Lavorazione: Sostituzione Cinghia',
                            path: '/officina/lavori/88542'
                        },
                        {
                            titolo: 'Sinistro Assicurativo Correlato',
                            path: '/sinistri/S-101-A4'
                        },
                        {
                            titolo: 'Scheda Tecnica Ufficiale (Sito Esterno)',
                            path: 'https://www.google.com'
                        },
                        {
                            path: '/interventi/auto/W1N2477541J3074666'
                        }
                    ]
                }
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
        const interval = setInterval(() => {
            // forza un setState con lo stesso valore, quindi re-render inutile
            setResponseData({ ...responseDataDEV }); // stesso valore di prima

        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const [activeIndex, setActiveIndex] = useState("");

    const openPage = (route) => {
        
    };

    const toggleCategory = (section: string) => {
        setActiveIndex(prevIndex => (prevIndex === section ? "" : section));
    };

    const scaricaDocumento = (path: string) => {
        const fileName = path.split('/').pop() || 'documento';
        const link = document.createElement('a');
        link.href = path;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isExternalLink = (path: string) => path.startsWith('http') || path.startsWith('https');

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
                            <div
                                key="dati"
                                className="bg-white shadow overflow-hidden border border-gray-200"
                            >
                                <button
                                    className="w-full text-left flex items-center p-4 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                                    onClick={() => toggleCategory("dati")}
                                    aria-expanded={activeIndex === "dati"}
                                >
                                    <CloudIcon className='h-8 w-8 mr-5'/>
                                    <span>Dati</span>
                                </button>

                                {activeIndex === "dati" && (
                                    <div className="w-full text-sm text-gray-900 border-t border-gray-200 p-4">
                                        {Object.entries(response.scheda_auto.dati).map(([key, value]) => (
                                            value && (
                                                <div 
                                                    key={key} 
                                                    className="grid grid-cols-3 gap-4 px-4 py-3 border-b border-gray-200 last:border-b-0"
                                                >
                                                    <span className="font-medium text-gray-600 capitalize">
                                                        {key.replace('_', ' ')}
                                                    </span>

                                                    <span className="col-span-2 text-gray-800">
                                                        {value}
                                                    </span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}

                            </div>

                            <div
                                key="documento_principale"
                                className="bg-white shadow overflow-hidden border border-gray-200"
                            >
                                <button
                                    className="w-full text-left flex items-center p-4 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                                    onClick={() => toggleCategory("documento_principale")}
                                    aria-expanded={activeIndex === "documento_principale"}
                                >
                                    <FireIcon className='h-8 w-8 mr-5'/>
                                    <span>Documento Principale</span>
                                </button>

                                {activeIndex === "documento_principale" && (
                                    <div className="w-full border-t border-gray-200 p-4 flex flex-col items-center gap-4">
                                        <div className='w-full'>
                                            <iframe
                                                src={`${response.scheda_auto.documento_principale.path || null}`}
                                                className="w-full h-[300px] border "
                                                title={`${response.scheda_auto.documento_principale.titolo || 'Documento Principale'}`}
                                            >
                                            </iframe>
                                        </div>
                                        <div className="w-1/2">
                                            <GeneralButton 
                                                text='scarica'
                                                action={() => scaricaDocumento(response.scheda_auto.documento_principale.path)}
                                            />
                                        </div>
                                    </div>
                                )}

                            </div>

                            <div
                                key="allegati"
                                className="bg-white shadow overflow-hidden border border-gray-200"
                            >
                                <button
                                    className="w-full text-left flex items-center p-4 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                                    onClick={() => toggleCategory("allegati")}
                                    aria-expanded={activeIndex === "allegati"}
                                >
                                    <FireIcon className='h-8 w-8 mr-5'/>
                                    <span>Allegati</span>
                                </button>

                                {activeIndex === "allegati" && (
                                    <div className="w-full text-sm border-t border-gray-200 p-4 ">
                                        {response.scheda_auto.allegati.length > 0 ? (
                                            response.scheda_auto.allegati.map((documento) => (
                                                <div 
                                                    key={documento.path} 
                                                    className="flex items-center justify-between px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors duration-150"
                                                >
                                                    <span className="font-medium text-gray-700">
                                                        {documento.titolo || documento.path.split('/').pop()}
                                                    </span>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => window.open(`${API_BASE_URL}${documento.path}`, '_blank')}
                                                            className="text-gray-500 hover:text-blue-600 transition-colors"
                                                            title="Visualizza"
                                                        >
                                                            <EyeIcon className="h-5 w-5" />
                                                        </button>

                                                        <button
                                                            onClick={() => scaricaDocumento(documento.path)}
                                                            className="text-gray-500 hover:text-green-600 transition-colors"
                                                            title="Scarica"
                                                        >
                                                            <ArrowDownTrayIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-gray-500">Nessun allegato presente.</div>
                                        )}
                                </div>
                                )}

                            </div>

                            <div
                                key="collegati"
                                className="bg-white shadow overflow-hidden border border-gray-200"
                            >
                                <button
                                    className="w-full text-left flex items-center p-4 text-lg font-medium text-gray-700 hover:bg-gray-100 transition duration-150 ease-in-out border-b border-gray-200"
                                    onClick={() => toggleCategory("collegati")}
                                    aria-expanded={activeIndex === "collegati"}
                                >
                                    <FireIcon className='h-8 w-8 mr-5'/>
                                    <span>Collegati</span>
                                </button>

                                {activeIndex === "collegati" && (
                                    <div className="w-full text-sm border-t border-gray-200 p-4">
                                        {response.scheda_auto.collegati.length > 0 ? (
                                            response.scheda_auto.collegati.map((documento) => (
                                                isExternalLink(documento.path) ? (
                                                    <a
                                                        key={documento.path}
                                                        href={documento.path}
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                                    >
                                                        <span className="font-medium text-gray-700">{documento.titolo || documento.path}</span>
                                                        <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-500" />
                                                    </a>
                                                ) : (
                                                    <Link href={documento.path} key={documento.path} legacyBehavior>
                                                        <a className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
                                                            <span className="font-medium text-gray-700">{documento.titolo || documento.path}</span>
                                                            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-500" />
                                                        </a>
                                                    </Link>
                                                )
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-gray-500">Nessun collegamento presente.</div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>

                        <div className="w-full flex flex-col justify-center p-5 mb-8">
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


