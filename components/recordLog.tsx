import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';

// Styling
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        interface Event {
          name: string;
          description: string;
          date: Date
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          events: Event[];
        }

export default function Timeline({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                events: []
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
              events: [
                {
                  name: "Demo Event 1",
                  description: "This is a test event for development",
                  date: new Date("2025-10-01")
                },
                {
                  name: "Demo Event 2",
                  description: "Another sample event",
                  date: new Date("2025-10-15")
                },
                {
                  name: "Demo Event 3",
                  description: "Another sample event",
                  date: new Date("2025-10-16")
                },
                {
                  name: "Demo Event 4",
                  description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text everlore",
                  date: new Date("2025-10-16")
                },
                {
                  name: "Demo Event 5",
                  description: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)",
                  date: new Date("2025-10-16")
                },
                {
                  name: "Demo Event 6",
                  description: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like)",
                  date: new Date("2025-10-16")
                },
              ]
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
        const interval = setInterval(() => {
            // forza un setState con lo stesso valore, quindi re-render inutile
            setResponseData({ ...responseDataDEV }); // stesso valore di prima

        }, 3000);
        return () => clearInterval(interval);
    }, []);

 
    return (
      <GenericComponent response={responseData} loading={false} error={null}>
        {(response: ResponseInterface) => (
          <div className="w-full h-screen overflow-hidden">
            <div className="h-full overflow-y-auto w-full">
              <div className="max-w-3xl mx-auto">
                <div className="relative py-8">
                  {/* Timeline */}
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1 bg-gray-500 h-full"></div>
      
                  {response.events.map((event, idx) => {
                    const isLeft = idx % 2 === 0;
                    const containerPosition = isLeft ? 'left-0 pr-8 text-right' : 'left-1/2 pl-8 text-left';
      
                    return (
                      <div key={idx} className="relative w-full mb-8 min-h-[80px]">
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 top-6">
                          <CheckCircleIcon 
                            className="w-8 h-8 text-blue-500 bg-white rounded-full border-2 border-blue-500" 
                            />
                        </div>
                        
                        <div className={`relative w-1/2 ${containerPosition}`}>
                          <div className="bg-white p-4 rounded shadow border border-gray-200">
                            <div className="text-xl font-bold text-blue-600">
                              {event.date.toLocaleDateString()}
                            </div>
                            <div className="text-lg font-semibold text-gray-900 mt-1">
                              {event.name}
                            </div>
                            <p className="text-gray-700 mt-2">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </GenericComponent>
    );
};


