import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { UserCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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
      deal_name: 'Fornitura Software CRM',
      deal_amount: '25000',
      deal_effectivemargin: '7000',
      company_name: 'SwissBix AG',
      sales_user_name: 'Marco Rossi',
      sales_user_photo: '/bixdata/users/avatar.jpg',
      deal_stage: 'Ordine materiale',
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

  const COLORS = ['#8884d8', '#82ca9d'];

  const chartData = [
    { name: 'Margine', value: Number(responseData.badgeItems.deal_effectivemargin) },
    {
      name: 'Resto Importo',
      value:
        Number(responseData.badgeItems.deal_amount) -
        Number(responseData.badgeItems.deal_effectivemargin),
    },
  ];

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
  const progressPercent = ((currentIndex + 1) / stages.length) * 100;

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Deal Badge">
      {(response: ResponseInterface) => (
        <div className="w-full flex justify-center items-center">
          <div className="w-full bg-primary border-badge-border rounded-xl transition-all duration-300 ease-in-out">
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-primary-hover rounded-t-xl"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-primary-foreground">
                  {response.badgeItems.company_name || 'Azienda'}
                </h2>
                <span className="text-sm text-primary-foreground opacity-80">{response.badgeItems.deal_name || 'Titolo trattativa'}</span>
              </div>
              <div
                className={`text-primary-foreground transform transition-transform duration-200 ${
                  isCollapsed ? 'rotate-180' : 'rotate-0'
                }`}
              >
                ▼
              </div>
            </div>

            {/* Contenuto */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isCollapsed ? 'max-h-0' : 'max-h-[600px]'
              }`}
            >
              <div className="px-3 pb-3">
                {/* Sales User */}
                {response.badgeItems.sales_user_name && (
                  <div className="flex items-center justify-center gap-3 mb-4 bg-primary-hover rounded-lg p-3">
                    <div className="flex-shrink-0">
                      {response.badgeItems.sales_user_photo ? (
                        <img
                          src={`/api/media-proxy?url=userProfilePic/${response.badgeItems.sales_user_photo}.png`}
                          alt="Sales User"
                          className="w-10 h-10 rounded-full object-cover border-2 border-accent"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                          <UserCircle2 className="text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-primary-foreground uppercase tracking-wide">
                        Venditore
                      </div>
                      <div className="text-sm font-medium text-white">
                        {response.badgeItems.sales_user_name}
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistiche numeriche */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className='flex flex-col gap-2'>
                    <div className="bg-primary-hover rounded-lg p-3 text-center">
                      <div className="text-xs text-primary-foreground uppercase tracking-wide mb-1">
                        Importo
                      </div>
                      <div className="text-lg font-bold"   style={{ color: COLORS[1] }}>
                        {response.badgeItems.deal_amount || '0'} CHF
                      </div>
                    </div>
                    <div className="bg-primary-hover rounded-lg p-3 text-center ">
                      <div className="text-xs text-primary-foreground uppercase tracking-wide mb-1">
                        Margine
                      </div>
                      <div className="text-lg font-bold"   style={{ color: COLORS[0] }}>
                        {response.badgeItems.deal_effectivemargin || '0'} CHF
                      </div>
                    </div>
                  </div>
                  {/* Grafico a torta */}
                  <div className="w-full h-40 mb-4">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                

                {/* Step vendita */}
                <div>
                  <div className="text-xs text-primary-foreground uppercase tracking-wide mb-2">
                    Stato trattativa
                  </div>
                  <div className="w-full bg-primary-hover rounded-full h-3 relative">
                    <div
                      className="bg-accent h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <div className=" w-full flex justify-between text-xs text-primary-foreground mt-1">
                    <span></span>
                    {stages.map((s, idx) => (
                      idx === currentIndex ? (
                      <span
                        key={s}
                        className={`font-bold opacity-80`}
                      >
                        {currentStage} ({currentIndex + 1}/{stages.length})
                      </span>
                      ) : <span></span>
                    ))}
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
