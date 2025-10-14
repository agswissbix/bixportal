import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { memoWithDebug } from '@/lib/memoWithDebug';

// Styling & Icons
import { MoonIcon, SparklesIcon, SunIcon } from '@heroicons/react/24/solid';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
// INTERFACCIA PROPS
interface PropsInterface {
  propExampleValue?: string;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface ResponseInterface {
  
}

export default function WidgetToggle({ propExampleValue }: PropsInterface) {
    //DATI
    // DATI PROPS PER LO SVILUPPO
    const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

    // DATI RESPONSE DI DEFAULT
    const responseDataDEFAULT: ResponseInterface = {
      
    };

    const responseDataDEV: ResponseInterface = {
      
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

    const [theme, setTheme] = useState('light');

    const handleThemeToggle = () => {
        setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    const isLightTheme = theme === 'light';
          
    const cardClasses = isLightTheme
      ? 'bg-white border-gray-200'
      : 'bg-gray-800 border-gray-700';
            
    const iconContainerClasses = isLightTheme
      ? 'text-blue-500'
      : 'text-blue-400';
            
    const mainButtonClasses = isLightTheme
      ? 'bg-blue-200 text-blue-700 hover:bg-blue-300'
      : 'bg-gray-700 text-gray-200 hover:bg-gray-600';
            
    const themeButtonClasses = isLightTheme
      ? 'text-gray-600 hover:bg-gray-200'
      : 'text-gray-300 hover:bg-gray-700';

    const toggleContainerClasses = isLightTheme 
      ? 'bg-blue-200' 
      : 'bg-gray-600';

    return (
      <GenericComponent response={responseData} loading={loading} error={error}>
        {(response: ResponseInterface) => {
          return (
            <div className="flex items-center justify-center p-4">
              <div className={`min-w-64 overflow-hidden rounded-lg shadow-md transition-colors duration-300 ${cardClasses}`}>
                <div className="w-full flex flex-col justify-center items-center p-5">
                  <div className={`mt-2 flex w-full items-center justify-center text-4xl font-bold ${iconContainerClasses}`}>
                    <button
                          onClick={handleThemeToggle}
                          className={`relative inline-flex h-14 w-32 cursor-pointer items-center rounded-full transition-colors duration-300 ${toggleContainerClasses}`}
                          aria-label="Toggle theme"
                      >
                          <span
                              className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                                  isLightTheme ? 'translate-x-1' : 'translate-x-[5.25rem]'
                              }`}
                          />
                          <div className="absolute inset-0 flex items-center justify-between px-2">
                              <SunIcon className={`h-8 w-8 ${isLightTheme ? 'text-yellow-500' : 'text-gray-400'}`} />
                              <MoonIcon className={`h-8 w-8 ${isLightTheme ? 'text-gray-400' : 'text-slate-300'}`} />
                          </div>
                      </button>
                  </div>
                  <div className="w-full flex flex-col justify-center items-center p-5">
                    <SparklesIcon className='text-white animate-pulse'/>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </GenericComponent>
    );
};