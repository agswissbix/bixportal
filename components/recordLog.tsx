import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';

// Styling
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        interface Event {
          recordid: string;
          command: string;
          data: string[];
          details: string[];
          user: User;
          date: Date;
          isError: boolean;
        }

        interface User {
          name: string;
          img: string;
        }

        interface EventCardProps {
          event: Event;
          showDetails: boolean;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          events: Event[];
          data_details: boolean; // Se true: mostra i dati dell'evento
        }

export default function RecordLog({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                events: [],
                data_details: false,
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
              events: [
                {
                  recordid: "0",
                  command: "AUTENTICAZIONE",
                  data: ["user_id: usr_1a2b3c", "status: success"],
                  details: ["Autenticazione riuscita.", "IP di origine: 192.168.1.10"],
                  user: {
                    name: "Mario Rossi",
                    img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=mario_rossi" 
                  },
                  date: new Date("2025-10-09T09:15:42.123Z"),
                  isError: false,
                },
                {
                  recordid: "1",
                  command: "AGGIUNTA",
                  data: ["entity: document", "entity_id: doc_a4b5c6", "parent_id: fld_proj_alpha"],
                  details: ["Aggiunto nuovo documento: 'Report Finanziario Q3'."],
                  user: {
                    name: "Giulia Bianchi",
                    img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=giulia_bianchi" 
                  },
                  date: new Date("2025-10-09T09:12:10.456Z"),
                  isError: false,
                },
                {
                  recordid: "2",
                  command: "MODIFICA",
                  data: ["entity: user_settings", "entity_id: usr_1a2b3c", "field: notifications", "new_value: disabled"],
                  details: ["Le impostazioni utente sono state aggiornate."],
                  user: {
                    name: "Mario Rossi",
                    img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=mario_rossi" 
                  },
                  date: new Date("2025-10-09T09:08:22.789Z"),
                  isError: false,
                },
                {
                  recordid: "3",
                  command: "AUTENTICAZIONE",
                  data: ["username_attempt: luca.verdi", "status: failure", "reason: invalid_password"],
                  details: ["Tentativo di autenticazione fallito.", "IP di origine: 203.0.113.55"],
                  user: {
                    name: "System",
                    img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=system" 
                  },
                  date: new Date("2025-10-09T09:05:03.912Z"),
                  isError: true,
                },
                {
                  recordid: "4",
                  command: "ELIMINAZIONE",
                  data: ["entity: user", "entity_id: usr_7d8e9f"],
                  details: ["L'entità 'user' con id 'usr_7d8e9f' è stata eliminata.", "Azione eseguita dall'amministratore."],
                  user: {
                    name: "Admin",
                    img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=admin" 
                  },
                  date: new Date("2025-10-09T08:59:51.345Z"),
                  isError: false,
                },
                {
                  recordid: "5",
                  command: "ESECUZIONE",
                  data: ["action: export_data", "format: CSV", "records: 1520"],
                  details: ["Eseguita azione di esportazione dati.", "File generato: 'clients_export_20251009.csv'"],
                  user: {
                    name: "Giulia Bianchi",
                    img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=giulia_bianchi" 
                  },
                  date: new Date("2025-10-09T08:45:18.678Z"),
                  isError: false,
                },
                {
                    recordid: "6",
                    command: "ACCESSO",
                    data: ["device: mobile", "location: Milan"],
                    details: ["Accesso da dispositivo mobile rilevato."],
                    user: {
                        name: "Luca Verdi",
                        img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=luca_verdi" 
                    },
                    date: new Date("2025-10-09T08:30:00.000Z"),
                    isError: false,
                },
                {
                    recordid: "7",
                    command: "UPLOAD",
                    data: ["file_name: presentation.pptx", "size: 10MB"],
                    details: ["Nuovo file caricato nel progetto 'Alpha'."],
                    user: {
                        name: "Anna Neri",
                        img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=anna_neri"
                    },
                    date: new Date("2025-10-09T08:25:00.000Z"),
                    isError: false,
                },
                {
                    recordid: "8",
                    command: "UPLOAD",
                    data: ["file_name: presentation.pptx", "size: 10MB"],
                    details: ["Tentativo di upload fallito."],
                    user: {
                        name: "Persona",
                        img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=persona"
                    },
                    date: new Date("2025-10-10T08:25:00.000Z"),
                    isError: true,
                }
              ],
              data_details: true,
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

    // PER DEVELOPMENT 
    useEffect(() => {
      setResponseData({ ...responseDataDEV });
    }, []);

    const EventCard = ({event, showDetails}: EventCardProps) => {
      const [isOpen, setIsOpen] = useState(false);
    
      const toggleAccordion = () => {
        setIsOpen(!isOpen);
      }
    
      return (
        <div className="mb-4 w-full bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <button
            onClick={toggleAccordion}
            className="w-full flex justify-between items-center p-5 text-left font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center">
              <img 
                src={event.user.img} 
                alt="Avatar utente" 
                className="w-10 h-10 rounded-full object-cover mr-4 flex-shrink-0"
              />
              
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">{event.user.name}</span>
                
                <div className="border-t border-gray-200 my-1"></div>
                
                <span className={`text-sm font-medium ${
                    event.isError ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {event.command}
                </span>
              </div>
            </div>
            <svg
              className={`w-6 h-6 transform transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>
    
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-gray-50/75 p-5 border-t border-gray-200 text-sm">
              <div
                className={
                  showDetails ? "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6" : ""
                }
              >
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-gray-400">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    Dettagli dell'Evento
                  </h4>
                  <div className="space-y-2 text-gray-700">
                    {event.details.map((detail, index) => (
                      <div key={index} className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-indigo-400 flex-shrink-0 mt-0.5">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {
                  showDetails ? (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-gray-400">
                          <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.665l3-3z" />
                          <path d="M8.603 14.47a2.5 2.5 0 01-3.535-3.536l1.225-1.224a.75.75 0 00-1.06-1.06l-1.224 1.224a4 4 0 005.656 5.656l3-3a4 4 0 00-.225-5.865.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.665l-3 3z" />
                        </svg>
                        Dati evento
                      </h4>
                      <div className="font-mono text-xs border border-gray-200 bg-white rounded-md p-3 space-y-2">
                        {event.data.map((dataPoint, index) => {
                          const parts = dataPoint.split(':');
                          const key = parts[0];
                          const value = parts.slice(1).join(':').trim();

                          return (
                            <div key={index} className="flex justify-between items-center border-b border-gray-100 last:border-b-0 pb-1">
                              <span className="text-gray-500">{key}:</span>
                              <span className="text-black font-semibold ml-2 text-right">{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div></div>
                  )
                }
              </div>
            </div>
          </div>
          <div className='bg-white p-2 pl-5 border-t border-gray-200 text-sm'>
              <span className='font-semibold text-gray-800 mb-3 flex items-center'>
                {event.date.toLocaleString('it-IT')}
              </span>
            </div>
        </div>
      );
    }

    return (
      <GenericComponent response={responseData} loading={false} error={null}>
        {(response: ResponseInterface) => (
          <div className="w-full h-screen overflow-hidden">
            <div className="h-full overflow-y-auto w-full">
              <div className="max-w-3xl mx-auto px-6">
                <div className="relative py-8">
                  {/* Timeline */}
                  <div className="absolute top-0 -translate-x-1/2 w-1 bg-gray-500 h-full"></div>
      
                  {response.events.map((event, index) => (
                    <div key={event.recordid || index} className="relative w-full mb-8 min-h-[80px]">
                      <div className="absolute -translate-x-1/2 z-10 top-6">
                        {
                          event.isError ? (
                            <XCircleIcon 
                              className="w-8 h-8 text-red-500 bg-white rounded-full border-2 border-red-500" 
                            />
                          ) : (        
                            <CheckCircleIcon 
                              className="w-8 h-8 text-blue-500 bg-white rounded-full border-2 border-blue-500" 
                            />
                          )
                        }
                      </div>
                      
                      <div className="relative  pl-8 text-left">
                        <EventCard event={event} showDetails={response.data_details}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </GenericComponent>
    );
};
