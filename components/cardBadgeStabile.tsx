import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import ImagePreview from './imagePreview';

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
        <div className="h-full w-full flex justify-center items-center">
          <div className="flex flex-wrap justify-center w-full h-5/6 bg-secondary rounded-xl p-3 overflow-hidden">
            {Object.entries(response.badgeItems).map(([fieldid, item]) =>
              fieldid === 'fotostabile' && item ? (
                <div key={fieldid} className="h-full w-1/2">
                  <p className="w-full text-center text-white"></p>
                  <ImagePreview imageUrl={`/api/media-proxy?url=${item}`} />
                </div>
              ) : (
                <div key={fieldid} className="w-1/2 h-full">
                  <p className="w-1/3 text-center text-white">{item}</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </GenericComponent>
  );
}
