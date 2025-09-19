import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { UserCircle2, CheckCircle2, Clock4, FileCheck2, Cpu, Banknote } from 'lucide-react';

const isDev = false;

interface PropsInterface {
  tableid?: string;
  recordid?: string;
  type?: string;
}

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

  const responseDataDEFAULT: ResponseInterface = {
    badgeItems: {
      project_name: '',
      project_status: '',
      expected_hours: '0',
      used_hours: '0',
      residual_hours: '0',
      company_name: '',
      manager_name: '',
      manager_photo: '',
    },
  };

  const responseDataDEV: ResponseInterface = {
    badgeItems: {
      project_name: 'Implementazione CRM',
      project_status: 'in corso',
      expected_hours: '200',
      used_hours: '120',
      residual_hours: '80',
      company_name: 'SwissBix AG',
      manager_name: 'Luca Bianchi',
      manager_photo: '/bixdata/users/avatar.jpg',
    },
  };

  const [responseData, setResponseData] = useState<ResponseInterface>(
    isDev ? responseDataDEV : responseDataDEFAULT
  );

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_record_badge_swissbix_project',
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

  const getStatusIcon = (status?: string) => {
    const s = status?.toLowerCase() || '';
    console.log('Project status:', s);
    if (s.includes('credit check')) {
      return <Banknote className="w-6 h-6 text-orange-400" />;
    }
    if (s.includes('tech validation')) {
      return <Cpu className="w-6 h-6 text-blue-400" />;
    }
    if (s.includes('in corso')) {
      return <Clock4 className="w-6 h-6 text-yellow-400" />;
    }
    if (s.includes('fatturato')) {
      return <FileCheck2 className="w-6 h-6 text-green-400" />;
    }
    return <Clock4 className="w-6 h-6 text-gray-400" />;
  };

  const expected = Number(responseData.badgeItems.expected_hours) || 0;
  const used = Number(responseData.badgeItems.used_hours) || 0;
  const percentUsed = expected > 0 ? (used / expected) * 100 : 0;

  return (
    <GenericComponent response={responseData} loading={loading} error={error} title="Project Badge">
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
                  {response.badgeItems.project_name || 'Titolo progetto'}
                </h2>
                <span className="text-sm text-primary-foreground opacity-80">{response.badgeItems.company_name || 'Ragione Sociale'}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(response.badgeItems.project_status)}
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
                isCollapsed ? 'max-h-0' : 'max-h-[600px]'
              }`}
            >
              <div className="px-3 pb-3">
                {/* Project Manager */}
                {response.badgeItems.manager_name && (
                  <div className="flex items-center justify-center gap-3 mb-4 bg-primary-hover rounded-lg p-3">
                    <div className="flex-shrink-0">
                      {response.badgeItems.manager_photo ? (
                        <img
                          src={`/api/media-proxy?url=userProfilePic/${response.badgeItems.manager_photo}.png`}
                          alt="Project Manager"
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
                        Responsabile tecnico
                      </div>
                      <div className="text-sm font-medium text-white">
                        {response.badgeItems.manager_name}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ore progetto */}
                <div className="mb-4">
                  <div className="text-xs text-primary-foreground uppercase tracking-wide mb-2">
                    Stato ore
                  </div>
                  <div className="w-full bg-primary-hover rounded-full h-3 relative">
                    <div
                      className="bg-accent h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentUsed}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-primary-foreground opacity-80 mt-1">
                    <span>Previste: {response.badgeItems.expected_hours}</span>
                    <span>Usate: {response.badgeItems.used_hours}</span>
                    <span>Residue: {response.badgeItems.residual_hours}</span>
                  </div>
                </div>

                {/* Placeholder: Task e Checklist */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-primary-hover rounded-lg p-3 text-center">
                    <div className="text-xs text-primary-foreground uppercase tracking-wide mb-1">
                      Task
                    </div>
                    <div className="text-sm font-bold text-accent">0 / 0</div>
                  </div>
                  <div className="bg-primary-hover rounded-lg p-3 text-center">
                    <div className="text-xs text-primary-foreground uppercase tracking-wide mb-1">
                      Checklist
                    </div>
                    <div className="text-sm font-bold text-accent">0 / 0</div>
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
