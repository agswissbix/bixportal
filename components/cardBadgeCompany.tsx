import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import ImagePreview from './imagePreview';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
interface PropsInterface {
  tableid?: string;
  recordid?: string;
  type?: string;
}

// INTERFACCIA RISPOSTA DAL BACKEND
interface BadgeItem {
  value: string;
  type?: string;
}

interface ResponseInterface {
  badgeItems: Record<string, string>;
}

export default function CardBadgeCompany({ tableid, recordid }: PropsInterface) {
  // DATI DEL CONTESTO
  const { user } = useContext(AppContext);

  // DATI RESPONSE DI DEFAULT
  const responseDataDEFAULT: ResponseInterface = {
    badgeItems: {},
  };

  // DATI RESPONSE PER LO SVILUPPO
  const responseDataDEV: ResponseInterface = {
    badgeItems: {
      test1: 'test1',
      test2: 'test2',
      foto_logo: '/bixdata/logos/swissbix_company.png',
    },
  };

  // IMPOSTAZIONE DELLA RESPONSE
  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  // PAYLOAD (solo se non in sviluppo)
  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_record_badge',
      tableid: tableid,
      recordid: recordid,
    };
  }, [tableid, recordid]);

  // CHIAMATA AL BACKEND (solo se non in sviluppo)
  const { response, loading, error } =
    !isDev && payload
      ? useApi<ResponseInterface>(payload)
      : { response: null, loading: false, error: null };

  // AGGIORNAMENTO RESPONSE CON I DATI DEL BACKEND
  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, responseData]);

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="cardBadge">
      {(response: ResponseInterface) => (
        <>
          {(response.badgeItems && Object.keys(response.badgeItems).length > 0) && (
            <div className="w-full flex justify-center items-center">
              <div className="flex flex-wrap justify-center w-full h-5/6 bg-badge-background border-badge-border rounded-xl p-3">
                {Object.entries(response.badgeItems).map(([key, item]) => (
                    <>
                    {key.startsWith('foto') ? ( 
                      <img src={`${item}`} />
                    ) : (
                      <p key={key} className="w-1/3 text-center text-white">
                        {item}
                      </p>
                    )}
                    </>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </GenericComponent>
  );
}
