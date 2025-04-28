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
            type: string; // Added type to PropsInterface
        }

        interface EmailFields {
          to: string;
          cc: string;
          bcc: string;
          subject: string;
          text: string;
          attachment_relativepath?: string;
          attachment_name?: string;
        }
        
        interface ResponseInterface {
          emailFields: EmailFields;
          tableid: string;
          recordid: string;
        }

export default function PopupEmail({ tableid, recordid, type }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid + '' + recordid;

            

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                emailFields: {
                  to:"",
                  cc: "",
                  bcc: "",
                  subject: "", // Added missing subject property
                  text: "",
                  attachment_relativepath: "",// Default value for the new property
                  attachment_name: "" // Default value for the new property
                },
                tableid : tableid,
                recordid : recordid
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                emailFields: {
                    to:"to",
                    cc: "cc",
                    bcc: "",
                    subject: "subject", // Added missing subject property
                    text: "mailbody",
                    attachment_relativepath: "example/path", // Example value for development
                    attachment_name: "example.txt" // Example value for development
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
            recordid: recordid,
            type: type,
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
            
            const emailData: EmailFields = {
              ...responseData.emailFields,
              // Assicuriamoci che l’attachment abbia sempre una stringa
              attachment_relativepath: responseData.emailFields.attachment_relativepath ?? '',
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
      {() => (
        <div>
          <div className="flex flex-col space-y-4">
            {['to', 'cc', 'bcc', 'subject'].map(field => (
              <input
                key={field}
                name={field}
                type="text"
                placeholder={field.toUpperCase()}
                value={(responseData.emailFields as any)[field]}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-offset-2 transition-all duration-300"
              />
            ))}

            {/* Link all’allegato, se presente */}
            <input
                key='attachment_name'
                name='attachment_name'
                type="text"
                placeholder='Nome allegato'
                value={responseData.emailFields.attachment_name} 
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus-visible:ring-offset-2 transition-all duration-300"
              />
              
            {responseData.emailFields.attachment_relativepath && (
              
              <a
                className="text-blue-600 hover:underline"
                href={`/api/media-proxy?url=${responseData.emailFields.attachment_relativepath}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visualizza allegato: {responseData.emailFields.attachment_relativepath}
              </a>
            )}

            <InputEditor initialValue={responseData.emailFields.text} onChange={handleEditorChange} />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={saveEmail}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-sm px-5 py-2.5"
            >
              Invia
            </button>
          </div>
        </div>
      )}
    </GenericComponent>
    );
};











