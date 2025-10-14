import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';

// Styling & Icons
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
// INTERFACCIA PROPS
interface PropsInterface {
  propExampleValue?: string;
}

interface ToDo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  todos: ToDo[]
}

export default function WidgetToDo({ propExampleValue }: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
      todos: []
    };

    const responseDataDEV: ResponseInterface = {
      "todos": [
        {
          "id": "work-001",
          "title": "Finalizzare il report vendite Q3",
          "description": "Aggregare i dati da Salesforce e preparare la presentazione per il meeting di venerdì.",
          "completed": false
        },
        {
          "id": "work-002",
          "title": "Preparare agenda riunione kick-off Progetto Phoenix",
          "description": "Definire i punti chiave da discutere, gli obiettivi e i partecipanti. Inviare l'invito entro oggi pomeriggio.",
          "completed": false
        },
        {
          "id": "work-003",
          "title": "Code Review pull request #582",
          "description": "Controllare le modifiche sull'API di autenticazione e lasciare commenti per il team.",
          "completed": true
        },
        {
          "id": "work-004",
          "title": "Compilare nota spese trasferta a Milano",
          "description": "Caricare tutte le ricevute sul portale aziendale e inviare per l'approvazione.",
          "completed": true
        },
        {
          "id": "work-005",
          "title": "Definire gli OKR per il Q4",
          "description": "Scrivere la bozza degli obiettivi e dei risultati chiave per il prossimo trimestre da discutere con il manager.",
          "completed": false
        },
        {
          "id": "work-006",
          "title": "Follow-up con il cliente Acme Corp",
          "description": "Inviare un'email di riepilogo dopo la chiamata di ieri e confermare i prossimi passi del progetto.",
          "completed": false
        },
        {
          "id": "work-007",
          "title": "Aggiornare la documentazione delle API",
          "description": "Documentare i nuovi endpoint aggiunti nello sprint corrente sulla piattaforma Confluence.",
          "completed": true
        },
        {
          "id": "work-008",
          "title": "Pianificare il deploy in produzione",
          "description": "Coordinarsi con il team DevOps per schedulare il rilascio della versione 2.5 dell'applicazione.",
          "completed": false
        }
      ]
    }

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

    const markComplete = (id: string) => () => {
      setResponseData(prevData => ({
        ...prevData,
        todos: prevData.todos.map(todo => 
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ),
      }));
    };

    return (
      <GenericComponent response={responseData} loading={loading} error={error}>
        {(response: ResponseInterface) => {
          if (!response || !response.todos) {
            return (
              <div className="flex items-center justify-center p-4">
                <div className="flex h-48 w-48 items-center justify-center">
                  <span className="text-sm text-gray-500">Caricamento...</span>
                </div>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center p-4">
              <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
                <div className="p-5">
                  {(!response?.todos || response.todos.length === 0) ? (
                    <p className="text-center text-gray-500">Nessuna task da mostrare</p>
                  ) : (
                    <ul className="w-full text-sm font-medium text-gray-900">
                      {response.todos.map((todo) => (
                        <li
                          key={todo.id}
                          className="flex w-full items-center border-b border-gray-200 py-3 ps-3 last:border-b-0"
                        >
                          <input
                            id={`todo-${todo.id}`}
                            type="checkbox"
                            checked={todo.completed}
                            onChange={markComplete(todo.id)} 
                            className="sr-only"
                          />
                          <label
                            htmlFor={`todo-${todo.id}`}
                            className="flex w-full cursor-pointer items-start ms-2" 
                          >
                            {todo.completed ? (
                              <CheckCircleIcon className="h-10 w-10 flex-shrink-0 text-green-500 me-2" />
                            ) : (
                              <XCircleIcon className="h-10 w-10 flex-shrink-0 text-gray-400 me-2" />
                            )}

                            <div className="flex flex-col">
                              <span
                                className={`font-medium ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                              >
                                {todo.title}
                              </span>
                              {todo.description && (
                                <p className={`text-sm mt-1 ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                    {todo.description}
                                </p>
                              )}
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      </GenericComponent>
    );
};