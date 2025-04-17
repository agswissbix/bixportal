import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import ImagePreview from './imagePreview';
import { backgroundSize } from 'html2canvas/dist/types/css/property-descriptors/background-size';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          tableid?: string;
          recordid?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            badgeItems: Array<{
                fieldid: string;
                value: string;
                type?: string;
            }>
        }


export default function GalleryCard({ tableid, recordid }: PropsInterface) {
    //DATI
            // DATI PROPS PER LO SVILUPPO
            const devPropExampleValue = isDev ? "Example prop" : tableid + '' + recordid;

            // DATI RESPONSE DI DEFAULT
            const responseDataDEFAULT: ResponseInterface = {
                badgeItems: []
              };

            // DATI RESPONSE PER LO SVILUPPO 
            const responseDataDEV: ResponseInterface = {
                badgeItems: [
                    {
                        fieldid: "test1",
                        value: "test1",
                        type: "text"
                    },
                    {
                        fieldid: "test2",
                        value: "test2",
                        type: "text"
                    },
                    {
                        fieldid: "test3",
                        value: "test3",
                        type: "text"
                    },
                    {
                        fieldid: "test4",
                        value: "test4",
                        type: "text"
                    },
                    {
                        fieldid: "test5",
                        value: "test5",
                        type: "text"
                    },
                    {
                        fieldid: "test7",
                        value: "projecttemplatemilestone/00000000000000000000000000000003",
                        type: "attachment"
                    }
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
            apiRoute: 'get_record_badge', // riferimento api per il backend
            tableid: tableid,
            recordid: recordid
        };
    }, [tableid]);

    // CHIAMATA AL BACKEND (solo se non in sviluppo) (non toccare)
    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND (solo se non in sviluppo) (non)
    useEffect(() => {
        if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
            setResponseData(response);
        }
    }, [response, responseData]);

    return (
<GenericComponent response={responseData} loading={loading} error={error}> 
    {(response: ResponseInterface) => (



<div className=" bg-gray-50 max-w-sm rounded-lg overflow-hidden shadow-lg mb-8 ml-12 w-2/2 h-2/3 ">
    <img
    className="w-full h-2/3"
    src={`/api/media-proxy?url=${tableid}/${recordid}/fotostabile.png`}
    alt="Immagine dello stabile"
    onError={(e) => {
        (e.target as HTMLImageElement).onerror = null; // previene loop infiniti
        (e.target as HTMLImageElement).src = 'https://i.pinimg.com/736x/87/6e/e8/876ee8ecc68c920dabc68a69a6ab2ca0.jpg'; // immagine di default
    }}
    />

  <div className="px-6 py-4 h-2/3">
    {responseData.badgeItems.map((item) => (
      (item.fieldid !== "fotostabile" && item.fieldid !== "test7") ? (
        item.fieldid === "titolo_stabile" ? (
          <div key={item.fieldid} className="font-bold text-xl mb-2">{item.value}</div>
        ) : (
          <div
            key={item.fieldid}
            className="flex items-center gap-2 px-3 py-1  rounded text-black shadow-md mb-2"
          >
            <span className="font-semibold text-black">{item.fieldid}:</span>
            <span className="text-black">{item.value}</span>
          </div>
        )
      ) : null
    ))}
  </div>
  <div className="px-6 pt-4 pb-2">
    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#photography</span>
    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#travel</span>
    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#winter</span>
  </div>
</div>

        
    )}
</GenericComponent>

    );
};
