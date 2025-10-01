import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { Crown, ShieldX, OctagonAlert, BadgeCheck, BadgeMinus, TrendingUp, Cog, DollarSign, Clock, Target, Phone, Database, Lock, ChevronDown  } from 'lucide-react';

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
      company_name: 'Auriel Investment SA',
      payment_status: 'ok',
      customer_type: 'vip',
      total_timesheet: '22',
      total_deals: '37.458',
      total_invoices: '148.458',
      sales_user_name: 'Marco Rossi',
      sales_user_photo: '/bixdata/users/avatar.jpg',
      company_logo: '/bixdata/logos/swissbix_company.png',
      company_email: 'info@aurielinvestment.com',
      company_address: 'Via Aurelia 45, 6900 Lugano',
      company_phone: '+41 91 987 65 43',
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
    let icon = null;
    let colorClass = '';

    switch (type?.toLowerCase()) {
      case 'vip':
        icon = <Crown className="w-12 h-12 text-purple-500" />;
        colorClass = 'to-purple-100'; // Classe completa
        break;
      case 'blocked':
        icon = <ShieldX className="w-12 h-12 text-red-500" />;
        colorClass = 'to-red-100'; // Classe completa
        break;
      case 'warning':
        icon = <OctagonAlert className="w-12 h-12 text-orange-500" />;
        colorClass = 'to-orange-100'; // Classe completa
        break;
      default:
        icon = <OctagonAlert className="w-12 h-12 text-gray-400" />;
        colorClass = 'to-gray-100'; // Classe completa
        break;
    }

    return (
      <div className={`flex items-center justify-left w-32 h-10 bg-gradient-to-r from-transparent ${colorClass} rounded-xl`}>
        {icon}
      </div>
    )
  };

  const getPaymentStatusIcon = (status?: string) => {
    let colorClass = 'to-red-100';
    let icon = <BadgeMinus className="w-12 h-12 text-red-500" />;
    if (status?.toLowerCase() === 'ok') {
      icon = <BadgeCheck className="w-12 h-12 text-green-500" />;
      colorClass = 'to-green-100';
    }

    return (
      <div className={`flex items-center justify-left w-32 h-10 bg-gradient-to-r from-transparent ${colorClass} rounded-xl`}>
        {icon}
      </div>
    )
  };

  // Lista servizi statici come da immagine
  const services = [
    { name: 'Firewall', icon: <ShieldX className="w-6 h-6 text-accent" /> },
    { name: 'Contratto PBX', icon: <Phone className="w-6 h-6 text-accent" /> },
    { name: 'Monte ore attivo', icon: <Clock className="w-6 h-6 text-accent" /> },
    { name: 'Be all backup', icon: <Database className="w-6 h-6 text-accent" /> },
    { name: 'Be all EDR', icon: <Lock className="w-6 h-6 text-accent" /> }
  ];

  // Componente riutilizzabile per le card metriche
  const MetricCard = ({ title, value, icon: IconComponent, suffix = '' }: {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    suffix?: string;
  }) => (
    <div className="relative h-32 flex-1">
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white px-3 py-2 rounded-t-xl text-xs font-medium whitespace-nowrap">
        {title}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary"></div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-3 pt-6 h-full flex items-center justify-evenly">
        <div className='w-full flex justify-center border-r border-gray-300'>
          <IconComponent className="w-12 h-12 text-accent flex-shrink-0" />
        </div>
        <div className='w-full'>
        <div className="text-lg font-bold text-gray-800 text-center">
          {value}{suffix}
        </div>
        </div>
      </div>
    </div>
  );

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Company Badge">
      {(response: ResponseInterface) => (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header with company name and collapse button */}
          <div 
            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <h2 className="text-xl font-semibold text-gray-800">
              {response.badgeItems.company_logo && (
                  <img
                    src={`/api/media-proxy?url=${response.badgeItems.company_logo}`}
                    alt="Company Logo"
                    className="max-w-32 rounded object-contain"
                    draggable={false}
                  />
                )}
              {response.badgeItems.company_name || 'Nome Azienda'}
            </h2>
            
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
              isCollapsed ? 'max-h-0' : 'max-h-[800px]'
            }`}
          >
            <div className="p-6">
              {/* Top metrics cards */}
              <div className="flex gap-4 mb-6">
                <MetricCard 
                  title="TOTALE LAVORI"
                  value={response.badgeItems.total_timesheet || '0'}
                  icon={Clock}
                />
                <MetricCard 
                  title="TOTALE FATTURATO"
                  value={response.badgeItems.total_invoices || '0'}
                  icon={TrendingUp}
                  suffix=" CHF"
                />
                <MetricCard 
                  title="MARGINALITA'"
                  value={response.badgeItems.total_deals || '0'}
                  icon={DollarSign}
                  suffix=" CHF"
                />
              </div>

              {/* Bottom section with status badges and services */}
              <div className="flex gap-6">
                {/* Left: Status badges */}
                <div className="flex flex-col gap-4 justify-center">
                  {/* Payment Status Badge */}
                  {response.badgeItems.payment_status && (
                    <>
                      {getPaymentStatusIcon(response.badgeItems.payment_status)}
                    </>
                  )}

                  {/* Customer Type Badge */}
                  {response.badgeItems.customer_type && (
                    <>
                      {getCustomerTypeIcon(response.badgeItems.customer_type)}
                    </>
                  )}
                </div>

                {/* Right: Services */}
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute -top-3 left-6 bg-primary text-white px-4 py-2 rounded-t-xl text-sm font-medium">
                      SERVIZI ATTIVI
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary"></div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 pt-8">
                      <div className="grid grid-cols-2 gap-3">
                        {services.map((service, index) => (
                          <div key={index} className="flex items-center gap-2 text-gray-700">
                            <span className="text-lg">{service.icon}</span>
                            <span className="text-sm">{service.name}</span>
                          </div>
                        ))}
                      </div>
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