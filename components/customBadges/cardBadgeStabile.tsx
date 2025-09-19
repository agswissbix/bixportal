import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import ImagePreview from '../imagePreview';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = false;

// INTERFACCE
interface PropsInterface {
  tableid?: string;
  recordid?: string;
  type?: string;
}



interface ResponseInterface {
  badgeItems: Record<string, string>;
}

export default function CardBadgeStabile({ tableid, recordid }: PropsInterface) {
  const { user } = useContext(AppContext);

  const responseDataDEFAULT: ResponseInterface = {
    badgeItems: {},
  };

  const responseDataDEV: ResponseInterface = {
    badgeItems: {
      test1: 'test1',
      test2: 'test2',
      fotostabile: 'projecttemplatemilestone/00000000000000000000000000000003',
    },
  };

  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_record_badge',
      tableid: tableid,
      recordid: recordid,
    };
  }, [tableid, recordid]);

  const { response, loading, error } =
    !isDev && payload
      ? useApi<ResponseInterface>(payload)
      : { response: null, loading: false, error: null };

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
        <div className="h-5/6 w-full flex items-start">
        <div className="flex flex-row flex-wrap w-full h-5/6 bg-secondary rounded-xl p-3 gap-4 overflow-hidden">
          <div key="fotostabile" className="h-full w-1/6">
            <ImagePreview imageUrl={`/api/media-proxy?url=${response.badgeItems.fotostabile}`} />
          </div>
          
          <div key="fotoingresso" className="h-full w-1/6">
            <ImagePreview imageUrl={`/api/media-proxy?url=${response.badgeItems.fotoingresso}`} />
          </div>
          <div key="riferimentocompleto" className="h-full w-3/6 text-white text-center">
            {response.badgeItems.riferimentocompleto}
          </div>

        </div>
      </div>
          )}
          </>
      )}
    </GenericComponent>
  );
}
