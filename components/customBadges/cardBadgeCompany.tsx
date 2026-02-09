import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { Crown, ShieldX, OctagonAlert, BadgeCheck, BadgeMinus, TrendingUp, Cog, DollarSign, Clock, Target, Phone, Database, Lock, ChevronDown, CheckCircle, Server, Box, Globe, Shield, ExternalLink, Info, ChevronUp } from 'lucide-react';
import { useRecordsStore } from '../records/recordsStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = false;

interface PropsInterface {
  tableid?: string;
  recordid?: string;
  type?: string;
}

interface ActiveService {
  id: string;
  label: string;
  type: string;
  sector: string;
  status: string;
  quantity: number;
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
    active_services?: ActiveService[];
  };
}

export default function CardBadgeCompany({ tableid, recordid }: PropsInterface) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const { refreshTable, handleRowClick } = useRecordsStore()

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
      active_services: [],
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
      active_services: [
        { id: '1', label: 'Firewall', type: 'Hardware', sector: 'Hosting', status: 'Active', quantity: 1 },
        { id: '2', label: 'Microsoft 365', type: 'Software', sector: 'Software', status: 'Active', quantity: 10 },
        { id: '3', label: 'Servizio Backup', type: 'Service', sector: 'ICT', status: 'Active', quantity: 1 },
        { id: '4', label: 'Stampante', type: 'Hardware', sector: 'Printing', status: 'Active', quantity: 2 },
        { id: '5', label: 'Connettività', type: 'Service', sector: 'Swisscom', status: 'Active', quantity: 1 },
        { id: '6', label: 'Licenza Antivirus', type: 'Software', sector: 'Software', status: 'Active', quantity: 25 },
        { id: '7', label: 'Server Virtuale', type: 'Hardware', sector: 'Hosting', status: 'Active', quantity: 1 },
      ],
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
      _refreshTick: refreshTable
    };
  }, [tableid, recordid, refreshTable]);

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

  const getServiceIcon = (sector: string) => {
      const sectorIcons: Record<string, any> = {
      Hosting: Server,
      Software: Box,
      Swisscom: Globe,
      ICT: Database,
      Printing: Shield,
    };

    const Icon = sectorIcons[sector] || Box;
    // Returning just the icon, styling will be applied in the render loop
    return <Icon className="w-4 h-4" />;
  };

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
  
  const servicesList = response?.badgeItems.active_services || [];
  const visibleServices = showAllServices ? servicesList : servicesList.slice(0, 6);
  const hasMoreServices = servicesList.length > 6;

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Company Badge">
      {(response: ResponseInterface) => (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header with company name and collapse button */}
          <div 
            className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="flex items-center space-x-4">
                 {response.badgeItems.company_logo && (
                  <img
                    src={`/api/media-proxy?url=${response.badgeItems.company_logo}`}
                    alt="Company Logo"
                    className="max-w-24 max-h-16 rounded object-contain"
                    draggable={false}
                  />
                )}
                <h2 className="text-xl font-semibold text-gray-800">
                  {response.badgeItems.company_name || 'Nome Azienda'}
                </h2>
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
                <div className="flex flex-col gap-4 justify-center w-40">
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
                  <div className="relative h-full pt-2">
                    <div className="absolute -top-1 left-6 z-10">
                        <div className="bg-[#248da2] text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm">
                            SERVIZI ATTIVI ({servicesList.length})
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#248da2]"></div>
                    </div>
                    
                    {/* Updated Service List Layout */}
                    <div className="bg-[#f8fafc] rounded-xl p-5 pb-2 pt-8 h-full border border-gray-100/50 shadow-sm flex flex-col">
                      {servicesList.length > 0 ? (
                          <>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {visibleServices.map((service, index) => (
                                <div key={index} className="group relative flex items-center gap-3 p-0.5 rounded-lg transition-all duration-200">
                                    <span className="flex-shrink-0">
                                        {/* Force orange styling for icons as per screenshot */}
                                        {React.cloneElement(getServiceIcon(service.sector), { 
                                            className: "w-5 h-5 text-[#ea580c]" 
                                        })}
                                    </span>
                                    <span className="text-sm text-gray-600 font-medium truncate flex-1">{service.label}</span>
                                    {service.quantity > 1 && (
                                        <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                                            x{service.quantity}
                                        </span>
                                    )}
                                    
                                    {/* Info / Link Actions on Hover */}
                                    <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-gray-100 p-0.5 z-20">
                                        <button 
                                            className="p-1 text-gray-800 hover:text-white hover:bg-accent rounded"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRowClick('linked', service.id, 'serviceandasset');
                                            }}
                                            title="Apri scheda"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Detailed Tooltip on Hover */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs rounded-md shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        <p><strong>Nome:</strong> {service.label}</p>
                                        <p><strong>Tipo:</strong> {service.type}</p>
                                        <p><strong>Settore:</strong> {service.sector}</p>
                                        <p><strong>Stato:</strong> {service.status}</p>
                                        <p><strong>Quantità:</strong> {service.quantity}</p>
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                    </div>
                                </div>
                                ))}
                            </div>
                            
                            {hasMoreServices && (
                                <div className="mt-2 flex justify-center border-t border-gray-200/50 pt-2">
                                    <button
                                        onClick={() => setShowAllServices(!showAllServices)}
                                        className="flex items-center space-x-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                                    >
                                        <span>{showAllServices ? 'Vedi meno' : `Vedi tutti (${servicesList.length})`}</span>
                                        {showAllServices ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                </div>
                            )}
                          </>

                      ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm italic py-4">
                              Nessun servizio o asset attivo rilevato.
                          </div>
                      )}
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