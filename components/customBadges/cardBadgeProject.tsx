import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { UserCircle2, ChevronDown, Check, Clock, AlertTriangle } from 'lucide-react'; // Aggiunto Clock per le ore

const isDev = false; // Imposta a true per usare i dati di sviluppo

interface PropsInterface {
  tableid?: string;
  recordid?: string;
  type?: string;
}

// Interfaccia aggiornata per i dati del Progetto
interface ResponseInterface {
  badgeItems: {
    project_name: string;
    project_status: string;
    expected_hours: string;
    used_hours: string;
    residual_hours: string;
    company_name: string;
    manager_name: string;
    manager_photo: string;
  };
}

export default function CardBadgeProject({ tableid, recordid }: PropsInterface) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useContext(AppContext);

  // Dati di default
  const responseDataDEFAULT: ResponseInterface = {
    badgeItems: {
      project_name: '',
      project_status: 'In attesa di avvio',
      expected_hours: '0',
      used_hours: '0',
      residual_hours: '0',
      company_name: '',
      manager_name: '',
      manager_photo: '',
    },
  };

  // Dati di sviluppo (simulano i dati dal backend)
  const responseDataDEV: ResponseInterface = {
    badgeItems: {
      project_name: 'Implementazione CRM Aziendale',
      project_status: 'In Corso',
      expected_hours: '160',
      used_hours: '40',
      residual_hours: '120',
      company_name: 'Acme Corp',
      manager_name: 'Bianca Verdi',
      manager_photo: '101', // ID dell'utente
    },
  };

  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  // Payload per la chiamata API
  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      // Modificato il nome della route API
      apiRoute: 'get_record_badge_swissbix_project',
      tableid: tableid,
      recordid: recordid,
    };
  }, [tableid, recordid]);

  // Chiamata API
  const { response, loading, error } =
    !isDev && payload
      ? useApi<ResponseInterface>(payload)
      : { response: null, loading: false, error: null };

  // Aggiornamento dello stato con i dati dell'API
  useEffect(() => {
    // Aggiungo anche il controllo su project_name per assicurarmi che i dati non siano quelli di default vuoti
    if (!isDev && response && response.badgeItems.project_name && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, responseData]);

  // Stati del progetto (adattati per i progetti)
  const stages = [
    "Attesa pagamento acconto",
    'Ordine materiale',
    'Progetto in corso',
    'Verifica saldo progetto',
    "Verifica saldo progetto",
    'Progetto fatturato',
  ];

  // Calcolo dell'indice dello stato corrente
  const currentStage = responseData.badgeItems.project_status || stages[0];
  const currentIndex = stages.findIndex((s) => s.toLowerCase() === currentStage.toLowerCase());

  // Calcolo delle ore e della percentuale di utilizzo
  const expectedHours = Number(responseData.badgeItems.expected_hours);
  const usedHours = Number(responseData.badgeItems.used_hours);
  const residualHours = Number(responseData.badgeItems.residual_hours);
  
  // Percentuale di ore utilizzate
  const usagePercentage = expectedHours > 0 ? ((usedHours / expectedHours) * 100).toFixed(0) : '0';
  
  // Percentuale di ore residue (opzionale, ma utile)
  const residualPercentage = expectedHours > 0 ? ((residualHours / expectedHours) * 100).toFixed(0) : '0';

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Project Badge">
      {(response: ResponseInterface) => (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="w-full flex-1 flex flex-wrap items-center justify-between">
              {/* Nome Progetto e Azienda */}
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-800 truncate">
                  {response.badgeItems.project_name || 'Titolo Progetto'}
                </h2>
                <p className="text-sm text-gray-500 truncate">
                  {response.badgeItems.company_name || 'Azienda Cliente'}
                </p>
              </div>

              {/* Project Manager in un layout compatto */}
              <div className="flex items-center gap-2 mt-1 mr-2 flex-shrink-0">
                <div className="flex-shrink-0">
                  {response.badgeItems.manager_photo ? (
                    <img
                      src={`/api/media-proxy?url=userProfilePic/${response.badgeItems.manager_photo}.png`}
                      alt="Project Manager"
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
                  {response.badgeItems.manager_name || 'Manager'}
                </span>
              </div>
            </div>
            
            <div
              className={`text-gray-600 transform transition-transform duration-200 ml-4 ${
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
              {/* Stats - Ore Progetto */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div>
                  <div className="text-sm text-gray-500">Ore Previste</div>
                  <div className="text-xl font-bold text-gray-800 flex items-center justify-center">
                    <Clock className="w-5 h-5 mr-1 text-gray-800" />
                    {expectedHours.toLocaleString('it-CH')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ore Usate</div>
                  <div className="text-xl font-bold text-red-500 flex items-center justify-center">
                    <Clock className="w-5 h-5 mr-1 text-red-500" />
                    {usedHours.toLocaleString('it-CH')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ore Residue</div>
                  <div className="text-xl font-bold text-green-500 flex items-center justify-center">
                    <Clock className="w-5 h-5 mr-1 text-green-500" />
                    {residualHours.toLocaleString('it-CH')}
                  </div>
                </div>
              </div>

              {/* Hours Usage Bar */}
              <div className='mb-6'>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-500">Ore Usate / Previste</span>
                  {/* Il colore del testo qui indica lo stato, rosso se l'utilizzo è alto, verde altrimenti */}
                  <span className={`font-bold ${Number(usagePercentage) > 100 ? 'text-red-500' : Number(usagePercentage) > 80 ? 'text-amber-500' : 'text-primary'}`}>
                    {usagePercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    // Il colore della barra riflette l'utilizzo
                    className={`h-2.5 rounded-full transition-all duration-500 ${Number(usagePercentage) > 100 ? 'bg-red-500' : Number(usagePercentage) > 80 ? 'bg-amber-500' : 'bg-primary'}`}
                    // Limito la larghezza al 100% anche se le ore usate superano le previste
                    style={{ width: `${Math.min(Number(usagePercentage), 100)}%` }}
                  />
                  {/* Indicatore visivo se le ore usate superano le previste */}
                  {Number(usagePercentage) > 100 && (
                    <div className="mt-1 text-xs text-red-500 font-medium flex items-center gap-x-1">
                      <AlertTriangle className='w-4 h-4'/> 
                      Ore Previste Superate! ({usagePercentage}%)
                    </div>
                  )}
                </div>
              </div>

              {/* Stepper (Stato del Progetto) */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Stato del Progetto</div>
                  
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
                    
                  {/* Nomi degli stati */}
                  <div className="flex justify-between mb-3">
                    {stages.map((stage, index) => {
                      const isCompleted = index < currentIndex;
                      const isCurrent = index === currentIndex;
                        
                      return (
                        <div key={index} className="flex justify-center" style={{ width: `${100/stages.length}%` }}>
                          <div
                            className={`text-xs text-center w-20 overflow-hidden text-ellipsis
                                ${isCompleted || isCurrent 
                                  ? 'text-primary font-medium' 
                                  : 'text-gray-500'
                                }
                              `}
                          >
                            <span>{stage}</span>
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