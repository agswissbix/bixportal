import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from "../../genericComponent";
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import { forEach, result } from 'lodash';
import GeneralButton from './generalButton';
import FloatingLabelInput from './floatingLabelInput';
import Image from 'next/image';
import BarcodeScanner from './barcodeScanner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        interface Auto {
            barcode: string;
            telaio: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          auto: Auto
        }

export default function PageSchedaAuto({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                auto: {
                    barcode: '',
                    telaio: ''
                }
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                auto: {
                    barcode: '',
                    telaio: ''
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
        setResponseData({ ...responseDataDEV });
    }, []);

    const openPage = (route) => {
        
    };

    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);


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
                        ...prevData.auto,
                        [name]: processedValue as any, 
                    }
                };
            });
        };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
    };

    const handleScanSuccess = (decodedText, decodedResult) => {
        console.log(`Codice scansionato: ${decodedText}`, decodedResult);
    
        setResponseData(prevData => ({
            ...prevData,
            auto: {
                ...prevData.auto, 
                barcode: decodedText 
            }
        }));
    
        setScanResult(decodedText);
        setScanError(null);
    };


    const handleScanError = (errorMessage) => {
        console.error("Errore di scansione:", errorMessage);
        if (scanError) {
            setScanError(errorMessage);
        }
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
                                    {/* QR Code reader */}
                                    <BarcodeScanner
                                        onScanSuccess={handleScanSuccess}
                                        onScanError={handleScanError}
                                        />

                                    <div className="mb-8 mt-8">
                                        <FloatingLabelInput
                                            id="barcode"
                                            name="barcode"
                                            label="Barcode"
                                            value={response.auto.barcode}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="mb-8">
                                        <FloatingLabelInput
                                            id="telaio"
                                            name="telaio"
                                            label="Telaio"
                                            value={response.auto.telaio}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                
                                
                                <GeneralButton 
                                    type="submit" 
                                    text='avanti' 
                                    className='mb-4'
                                    />
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


