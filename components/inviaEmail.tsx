import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import InputEditor from './inputEditor';
import { CircleX } from 'lucide-react';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
            isOpen: boolean;
            onClose: () => void;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          emailFields: {
            cc: string;
            bcc: string;
            subject: string;
            text: string;
          };
        }

export default function EmailPopup({ isOpen, onClose }: PropsInterface) {
    //DATI
        if (!isOpen) return null;
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : isOpen + '' + onClose;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                emailFields: {
                  cc: "",
                  bcc: "",
                  subject: "",
                  text: ""
                }
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                emailFields: {
                    cc: "",
                    bcc: "",
                    subject: "",
                    text: ""
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
            apiRoute: 'prepara_email', // riferimento api per il backend
        };
    }, [isOpen]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setResponseData((prevData) => ({
          ...prevData,
          emailFields: {
            ...prevData.emailFields,
            [name]: value, // Aggiorna il campo specifico
          },
        }));
      };

      const saveEmail = async () => {
        try {
            await axiosInstance.post('/commonapp/save_email/');
            alert('aasdasd')
            toast.success('email salvata con successo');
            onClose();
        } catch (error) {
            console.error('Errore durante il salvataggio della mail', error);
            toast.error('Errore durante il salvataggio della mail');
        }
    }

      

    return (
        <GenericComponent response={responseData} error={error}> 
            {(response: ResponseInterface) => (
                <div className="fixed inset-0 flex h-fix items-center justify-center bg-black bg-opacity-50 z-[1000]">
                <div className="bg-white p-6 rounded-lg shadow-lg w-fix h-fix flex flex-col">

                  <CircleX
                    className="w-6 h-6 text-gray-500 relative mb-2 float-start  cursor-pointer"
                      onClick={onClose}
                  />
                  <div className="flex flex-col space-y-4">
                    <input
                      name="cc"
                      type="text"
                      placeholder="CC"
                      value={response.emailFields.cc}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus-within:ring-offset-2 transition-all duration-300"
                    />
                    <input
                      name="bcc"
                      type="text"
                      placeholder="BCC"
                      value={response.emailFields.bcc}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus-within:ring-offset-2 transition-all duration-300"
                    />
                    <input
                      name="subject"
                      type="text"
                      placeholder="Oggetto"
                      value={response.emailFields.subject}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus-within:ring-offset-2 transition-all duration-300"
                    />
                    <InputEditor initialValue={response.emailFields.text} />

                  </div>
                  <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => { saveEmail(); onClose(); }} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 me-2 mt-4">Invia</button>
                  </div>
                </div>
              </div>
            )}
        </GenericComponent>
    );
};











