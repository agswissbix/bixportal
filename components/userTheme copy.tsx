// 📄 UserTheme.jsx

import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { useRecordsStore } from './records/recordsStore';
import { Palette } from 'lucide-react'; 
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';
import ThemePreview from './themePreview';
import ProductList from './recordsCardPreview';
import RecordsCardPreview from './recordsCardPreview';
import themes, { themesSwissbix } from '@/app/themes_customs/themes_custom';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
interface PropsInterface {
  propExampleValue?: string;
}
interface ResponseInterface {
  userid: string
}

function UserTheme({ propExampleValue }: PropsInterface) {
  // DATI
  const devPropExampleValue = isDev ? "Example prop" : propExampleValue;
  const responseDataDEFAULT: ResponseInterface = {
    userid: "Default"
  };
  const responseDataDEV: ResponseInterface = {
    userid: "DevUser123",
  };

  const { user } = useContext(AppContext);
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
  const { theme, setTheme } = useRecordsStore(); // Ho aggiunto 'setTheme' per poter cambiare il tema
  const [themeConfig, setThemeConfig] = useState(themes);

  // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_user_id',
        };
    }, [propExampleValue]);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);

    try {
        await axiosInstanceClient.post(
            "/postApi",
            {
                apiRoute: "set_user_theme",
                theme: newTheme
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        )
        toast.success('Tema cambiato con successo');
    } catch (error) {
        console.error('Errore durante il cambio del tema', error);
        toast.error('Errore durante il cambio del tema');
    }
  };

  // CHIAMATA AL BACKEND (solo se non in sviluppo)
  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo)
  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
      setThemeConfig(themes);
    }
  }, [response, responseData]);

  // PER DEVELOPMENT (Rimosso l'interval che causa re-render inutili)
  
  console.log('[DEBUG] Rendering UserTheme', { propExampleValue, responseData });

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-full max-h-2xl mx-auto my-10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              <Palette className="inline-block mr-2 text-blue-500" />
              Selezione tema
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tema attuale: <span className="font-semibold text-blue-500">{theme}</span>
            </p>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Scegli il tuo tema preferito per personalizzare l'aspetto di BixData.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 justify-items-center">
            {themeConfig.map((themeName) => (
              <div key={themeName} className="flex flex-col items-center ">
                <button
                  onClick={() => handleThemeChange(themeName)}
                  className={`p-1 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500
                    ${theme === themeName ? 'border-blue-500 scale-105' : 'border-gray-300 hover:scale-105'}`}
                >
                  {/* Sostituito con il nuovo componente ThemePreview */}
                  <ThemePreview themeName={themeName} />
                </button>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {themeName.replace('-', ' ')}
                </span>
              </div>
            ))}
            <br />
          </div>
          <div className="mt-16 mx-auto justify-items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Anteprima del tema attuale
            </h3>
            <RecordsCardPreview />
        </div>
        </div>
      )}
    </GenericComponent>
  );
};

export default UserTheme;