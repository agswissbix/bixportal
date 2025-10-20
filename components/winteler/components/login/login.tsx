import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from "../../../genericComponent";
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';
import GeneralButton from '../generalButton';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        interface User {
            name: string;
            password: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
          user: User;
        }

export default function Login({ onChangeView }) {
    //DATI
            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                user: {
                    name: "",
                    password: ""
                }
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                user: {
                    name: "",
                    password: ""
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
        };
    }, []);

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

    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);

    const handleUsernameChange = (event) => {
        const value = event.target.value;
    
        setResponseData(prevData => ({
            ...prevData,
            user: {
                ...prevData.user, 
                name: value 
            }
        }));

        if (value.length > 0) {
            setIsUsernameValid(true);
        } else {
            setIsUsernameValid(false);
        }
    };
    
    const handlePasswordChange = (event) => {
        const value = event.target.value;
        setResponseData(prevData => ({
            ...prevData,
            user: {
                ...prevData.user, 
                password: value 
            }
        }));
        if (value.length > 0) {
            setIsPasswordValid(true);
        } else {
            setIsPasswordValid(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onChangeView('menu');
    };

    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="w-full flex flex-col justify-center p-5">
                    <form onSubmit={handleSubmit} className='w-full mb-8'>
                        <div className="mb-8">
                            <label htmlFor="username" className={`${isUsernameValid ? 'text-green-500' : ''} focus-within:text-green-500 text-sm`}>
                                Utente
                            </label>
                            <input
                                type="text"
                                id="username"
                                placeholder="Utente"
                                value={response.user.name}
                                onChange={handleUsernameChange}
                                className={`w-full py-2 bg-transparent border-b 
                                            ${isUsernameValid ? 'border-green-500' : 'border-gray-300'} 
                                            focus:outline-none focus:border-green-500 transition-colors`}
                            />
                        </div>

                        <div className="mb-8">
                            <label htmlFor="password" className={`${isPasswordValid ? 'text-green-500' : ''} focus-within:text-green-500 text-sm`}>
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Password"
                                value={response.user.password}
                                onChange={handlePasswordChange}
                                className={`w-full py-2 bg-transparent border-b 
                                            ${isPasswordValid ? 'border-green-500' : 'border-gray-300'} 
                                            focus:outline-none focus:border-green-500 transition-colors`}
                                />
                        </div>

                        <GeneralButton
                            type="submit"
                            text='login'
                        />
                    </form>
                </div>
            )}
        </GenericComponent>
    );
};


