import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import SelectStandard from './selectStandard';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';
import axios from 'axios';
import { set } from 'lodash';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            tables: Array<{ itemcode: string; itemdesc: string; favorite: boolean }>;
        }
          

export default function UserFavTables({ propExampleValue }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : propExampleValue;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                tables: []
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                tables: [
                    { itemcode: '1', itemdesc: 'Table 1', favorite: true },
                    { itemcode: '2', itemdesc: 'Table 2', favorite: false },
                    { itemcode: '3', itemdesc: 'Table 3', favorite: true },
                    { itemcode: '4', itemdesc: 'Table 4', favorite: false },
                ]
            };

            // DATI DEL CONTESTO
            const { user } = useContext(AppContext);

    // IMPOSTAZIONE DELLA RESPONSE (non toccare)
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);
    const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);


    const saveFavTables = async () => {
        console.info(selectedFavorites)
        try {
          console.info('Cambio password in corso...');
          const response = await axiosInstanceClient.post("/postApi", {
            apiRoute: "save_favorite_tables",
            tables: selectedFavorites,
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });

          toast.success(response.data.message);

        } catch (error) {
          if (axios.isAxiosError(error)) {
            toast.error("Errore nel cambio della password: " + error.response?.data?.message);
          } else {
            toast.error("Errore nella verifica della password");
          }
        }
      };


    // PAYLOAD (solo se non in sviluppo)
    const payload = useMemo(() => {
        if (isDev) return null;
        return {
            apiRoute: 'get_favorite_tables', // riferimento api per il backend
            userid : user
        };
        console.info(responseData)
    }, [propExampleValue]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response) {
            setResponseData(response);
            setSelectedFavorites(response.tables.filter(table => table.favorite).map(table => table.itemcode));
        }
    }, [response]);


    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(response: ResponseInterface) => (
                <div className="w-1/3 mx-auto">
                    <SelectStandard
                        initialValue={selectedFavorites}
                        lookupItems={response.tables}
                    onChange={(selectedOption) => setSelectedFavorites(
                            Array.isArray(selectedOption) ? selectedOption : [selectedOption]
                    )}
                    isMulti={true}
                    />

                    <button
                      onClick={saveFavTables}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Salva preferite
                    </button>

                </div>
            )}
        </GenericComponent>
    );
};
