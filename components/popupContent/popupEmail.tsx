import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import InputEditor from '../inputEditor';
import axiosInstance from '@/utils/axiosInstance';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
            tableid: string;
            recordid: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          emailFields: {
            to: string;
            cc: string;
            bcc: string;
            subject: string;
            text: string;
          };
        tableid: string;
        recordid: string;
        }

export default function PopupEmail({ tableid,recordid }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid + '' + recordid;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                emailFields: {
                  to:"",
                  cc: "",
                  bcc: "",
                  subject: "",
                  text: ""
                },
                tableid : tableid,
                recordid : recordid
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                emailFields: {
                    to:"to",
                    cc: "cc",
                    bcc: "bcc",
                    subject: "subject",
                    text: "mailbody"
                },
                tableid : tableid,
                recordid : recordid


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
            tableid: tableid,
            recordid: recordid
        };
    }, [tableid, recordid]);

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
    
    const handleEditorChange = (value: string) => {
        setResponseData((prevData) => ({
          ...prevData,
          emailFields: {
            ...prevData.emailFields,
            text: value, // Aggiorna il campo specifico
          },
        }));
    };

      const saveEmail = async () => {
        try {
            const emailData = {
                cc: responseData.emailFields.cc,
                bcc: responseData.emailFields.bcc,
                subject: responseData.emailFields.subject,
                text: responseData.emailFields.text,
            };
    
            // Pass the emailData to the backend
            await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "save_email",
                    emailData: emailData,
                    tableid: tableid,
                    recordid: recordid,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
    
            toast.success('Email salvata con successo');
        } catch (error) {
            console.error('Errore durante il salvataggio della mail', error);
            toast.error('Errore durante il salvataggio della mail');
        }
    };
    

      

    return (
        <GenericComponent response={responseData} error={error}> 
            {(response: ResponseInterface) => (
                <div>
                  <div className="flex flex-col space-y-4">
                  <input
                      name="to"
                      type="text"
                      placeholder="To"
                      value={response.emailFields.to}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus-within:ring-offset-2 transition-all duration-300"
                    />
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
                    <InputEditor initialValue={response.emailFields.text} onChange={handleEditorChange} />

                  </div>
                  <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => { saveEmail() }} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5 me-2 mt-4">Invia</button>
                  </div>
                </div>
            )}
        </GenericComponent>
    );
};











