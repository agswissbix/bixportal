import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { UserCircle2, ChevronDown, Check } from 'lucide-react';

const isDev = false;

interface PropsInterface {
  tableid?: string;
  recordid?: string;
  type?: string;
}

interface ResponseInterface {
  badgeItems: {
    deal_name: string;
    deal_amount: string;
    deal_effectivemargin: string;
    company_name: string;
    sales_user_name: string;
    sales_user_photo: string;
    deal_stage?: string;
  };
}

export default function CardBadgeDeal({ tableid, recordid }: PropsInterface) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useContext(AppContext);

  const responseDataDEFAULT: ResponseInterface = {
    badgeItems: {
      deal_name: '',
      deal_amount: '0',
      deal_effectivemargin: '0',
      company_name: '',
      sales_user_name: '',
      sales_user_photo: '',
      deal_stage: 'Appuntamento',
    },
  };

  const responseDataDEV: ResponseInterface = {
    badgeItems: {
      deal_name: 'Nuovo Sito Web per Acme Corp',
      deal_amount: '50000',
      deal_effectivemargin: '12500',
      company_name: 'Acme Corp',
      sales_user_name: 'Mario Rossi',
      sales_user_photo: '/bixdata/users/avatar.jpg',
      deal_stage: 'Progetto in corso',
    },
  };

  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_record_badge_swissbix_deals',
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

  const stages = [
    'Appuntamento',
    'Offerta inviata',
    'Tech validation',
    'Credit Check',
    'Ordine materiale',
    'Progetto in corso',
    'Verifica saldo progetto',
    'Progetto fatturato',
  ];

  const currentStage = responseData.badgeItems.deal_stage || stages[0];
  const currentIndex = stages.findIndex((s) => s.toLowerCase() === currentStage.toLowerCase());

  const dealAmount = Number(responseData.badgeItems.deal_amount);
  const dealMargin = Number(responseData.badgeItems.deal_effectivemargin);
  const marginPercentage = dealAmount > 0 ? ((dealMargin / dealAmount) * 100).toFixed(0) : '0';

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Deal Badge">
      {(response: ResponseInterface) => (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="flex-1 flex flex-wrap items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {response.badgeItems.deal_name || 'Titolo Trattativa'}
              </h2>
              {/* Sales User in a compact layout */}
              <div className="flex items-center gap-2 mt-1 mr-2">
                <div className="flex-shrink-0">
                  {response.badgeItems.sales_user_photo ? (
                    <img
                      src={`/api/media-proxy?url=userProfilePic/${response.badgeItems.sales_user_photo}.png`}
                      alt="Sales User"
                      className="w-8 h-8 rounded-full object-cover"
                      draggable={false}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `/api/media-proxy?url=userProfilePic/default.jpg`;
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCircle2 className="text-gray-500 w-6 h-6" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {response.badgeItems.sales_user_name || 'Venditore'}
                </span>
              </div>
            </div>
            <div
              className={`text-gray-600 transform transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : 'rotate-0'
              }`}
            >
              <ChevronDown />
            </div>
          </div>

          {/* Content */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isCollapsed ? 'max-h-0' : 'max-h-[600px]'
            }`}
          >
            <div className="p-4 pt-0">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-500">Importo</div>
                  <div className="text-xl font-bold text-gray-800">
                    € {dealAmount.toLocaleString('it-CH')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Margine Lordo</div>
                  <div className="text-xl font-bold text-accent">
                    € {dealMargin.toLocaleString('it-CH')}
                  </div>
                </div>
              </div>

              {/* Margin/Amount Bar */}
              <div className='mb-6'>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-500">Margine / Importo</span>
                  <span className="font-bold text-accent">{marginPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-accent h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${marginPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stepper */}
              {/* Stepper con Pallini Sotto */}
<div className="mb-4">
  <div className="text-xs text-gray-500 mb-2">Stato della Trattativa</div>
  
  <div className="relative">
    {/* Segmenti discreti */}
    <div className="flex justify-between gap-1 mb-4">
      {stages.map((stage, index) => {
        const isActive = index <= currentIndex;
        return (
          <div
            key={index}
            className={`
              flex-1 h-2 rounded-full transition-all duration-300
              ${isActive ? 'bg-primary' : 'bg-gray-200'}
            `}
          ></div>
        );
      })}
    </div>
    
    {/* Indicatori circolari sotto i segmenti */}
    <div className="flex justify-between mb-3">
      {stages.map((_, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={index} className="flex justify-center" style={{ width: `${100/stages.length}%` }}>
            <div
              className={`
                w-4 h-4 rounded-full border-2 bg-white transition-all duration-200 flex items-center justify-center
                ${isCompleted || isCurrent 
                  ? 'border-primary' 
                  : 'border-gray-300'
                }
              `}
            >
              {isCompleted && (
                <Check className="w-2 h-2 text-primary m-0.5" strokeWidth={3} />
              )}
              {isCurrent && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
    
    <div className="flex justify-between mb-3">
      {stages.map((_, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <div key={index} className="flex justify-center" style={{ width: `${100/stages.length}%` }}>
            <div
              className={`text-xs text-center w-20 overflow-hidden text-ellipsis
                  ${isCompleted || isCurrent 
                    ? 'text-primary' 
                    : 'text-gray-300'
                  }
                `}
            >
              <span>{stages[index]}</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</div>
            </div>
          </div>
        </div>
      )}
    </GenericComponent>
  );
}