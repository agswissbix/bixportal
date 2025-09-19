import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { Crown, ShieldX, OctagonAlert, BadgeCheck, BadgeMinus } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = false;

interface PropsInterface {
  tableid?: string;
  recordid?: string;
  type?: string;
}

interface ResponseInterface {
  badgeItems: {
    company_name: string;
    payment_status: string;
    customer_type: string;
    total_timesheet: string;
    total_deals: string;
    total_invoices: string;
    sales_user_name: string;
    sales_user_photo: string;
    company_logo: string;
    company_email: string;
    company_address: string;
    company_phone: string;
  };
}

export default function CardBadgeCompany({ tableid, recordid }: PropsInterface) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useContext(AppContext);

  const responseDataDEFAULT: ResponseInterface = {
    badgeItems: {
      company_name: '',
      payment_status: '',
      customer_type: '',
      total_timesheet: '0',
      total_deals: '0',
      total_invoices: '0',
      sales_user_name: '',
      sales_user_photo: '',
      company_logo: '',
      company_email: '',
      company_address: '',
      company_phone: '',
    },
  };

  const responseDataDEV: ResponseInterface = {
    badgeItems: {
      company_name: 'SwissBix AG',
      payment_status: 'ok',
      customer_type: 'vip',
      total_timesheet: '156',
      total_deals: '23',
      total_invoices: '45',
      sales_user_name: 'Marco Rossi',
      sales_user_photo: '/bixdata/users/avatar.jpg',
      company_logo: '/bixdata/logos/swissbix_company.png',
      company_email: 'info@swissbix.com',
      company_address: 'Via Roma 123, 6900 Lugano',
      company_phone: '+41 91 123 45 67',
    },
  };

  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_record_badge_swissbix_company',
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

  // Mappa icone + colori
  const getCustomerTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'vip':
        return <Crown className="w-6 h-6 text-purple-400" />;
      case 'blocked':
        return <ShieldX className="w-6 h-6 text-red-400" />;
      case 'warning':
        return <OctagonAlert className="w-6 h-6 text-orange-400" />;
      default:
        return <OctagonAlert className="w-6 h-6 text-gray-400" />;
    }
  };

  const getPaymentStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'ok':
        return <BadgeCheck className="w-6 h-6 text-green-400" />;
      default:
        return <BadgeMinus className="w-6 h-6 text-red-400" />;
    }
  };

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Company Badge">
      {(response: ResponseInterface) => (
        <div className="w-full flex justify-center items-center">
          <div className="w-full bg-primary border-badge-border rounded-xl transition-all duration-300 ease-in-out">
            {/* Header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-primary-hover rounded-t-xl"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <div className="flex items-center gap-3">
                {response.badgeItems.company_logo && (
                  <img
                    src={`/api/media-proxy?url=${response.badgeItems.company_logo}`}
                    alt="Company Logo"
                    className="max-w-32 rounded object-contain"
                    draggable={false}
                  />
                )}
                <h2 className="text-xl font-bold text-primary-foreground">
                  {response.badgeItems.company_name || 'Nome Azienda'}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {/* Badge Status nell'header */}
                <div className="flex items-center gap-2">
                  {response.badgeItems.payment_status && (
                    <div className="flex items-center">
                      {getPaymentStatusIcon(response.badgeItems.payment_status)}
                    </div>
                  )}
                  {response.badgeItems.customer_type && (
                    <div className="flex items-center">
                      {getCustomerTypeIcon(response.badgeItems.customer_type)}
                    </div>
                  )}
                </div>

                <div
                  className={`text-primary-foreground transform transition-transform duration-200 ${
                    isCollapsed ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  ▼
                </div>
              </div>
            </div>

            {/* Contenuto */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isCollapsed ? 'max-h-0' : 'max-h-96'
              }`}
            >
              <div className="px-3 pb-3">
                {/* Info contatto */}
                <div className="text-center mb-4">
                  <div className="flex flex-row justify-evenly space-y-1 mb-3">
                    {response.badgeItems.company_email && (
                      <div className="text-xs text-primary-foreground opacity-80">
                        📧 {response.badgeItems.company_email}
                      </div>
                    )}
                    {response.badgeItems.company_address && (
                      <div className="text-xs text-primary-foreground opacity-80">
                        📍 {response.badgeItems.company_address}
                      </div>
                    )}
                    {response.badgeItems.company_phone && (
                      <div className="text-xs text-primary-foreground opacity-80">
                        📞 {response.badgeItems.company_phone}
                      </div>
                    )}
                  </div>

                  <div className="w-16 h-0.5 bg-accent mx-auto"></div>
                </div>

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
                          <span className="text-primary text-sm font-bold">
                            {response.badgeItems.sales_user_name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-primary-foreground uppercase tracking-wide">
                        Venditore di riferimento
                      </div>
                      <div className="text-sm font-medium text-white">
                        {response.badgeItems.sales_user_name}
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistiche */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-primary-hover rounded-lg p-3 text-center">
                    <div className="text-xs text-primary-foreground uppercase tracking-wide mb-1">
                      Totale Lavoro
                    </div>
                    <div className="text-lg font-bold text-accent">
                      {response.badgeItems.total_timesheet || '0'}
                    </div>
                  </div>

                  <div className="bg-primary-hover rounded-lg p-3 text-center">
                    <div className="text-xs text-primary-foreground uppercase tracking-wide mb-1">
                      Totale Venduto
                    </div>
                    <div className="text-lg font-bold text-accent">
                      {response.badgeItems.total_deals || '0'}
                    </div>
                  </div>

                  <div className="bg-primary-hover rounded-lg p-3 text-center">
                    <div className="text-xs text-primary-foreground uppercase tracking-wide mb-1">
                      Totale Fatturato
                    </div>
                    <div className="text-lg font-bold text-accent">
                      {response.badgeItems.total_invoices || '0'}
                    </div>
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