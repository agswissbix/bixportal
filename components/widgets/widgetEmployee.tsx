import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from '../genericComponent';
import { AppContext } from '@/context/appContext';
import { UserCircleIcon, PlayCircleIcon, StopCircleIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/solid';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useRecordsStore } from '../records/recordsStore';

const isDev = false; // Set to true if you want to test with mock data

interface PropsInterface {
  userid?: number;
}

interface UserData {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

interface StatsData {
  today_count: number;
  month_hours: number;
}

interface ActivityData {
  recordid: string;
  status: "Running" | "Stopped";
  description: string;
  start_time: string;
  project_name: string;
  client_name: string;
}

interface ResponseInterface {
  user: UserData;
  stats: StatsData;
  activity: ActivityData;
}

export default function WidgetEmployee({ userid }: PropsInterface) {
    const targetUserId = userid

    // MOCK DATA for dev
    const responseDataDEV: ResponseInterface = {
        user: { id: 1, firstname: "Mario", lastname: "Rossi", email: "mario.rossi@example.com" },
        stats: { today_count: 3, month_hours: 45.5 },
        activity: { 
            recordid: "1",
            status: "Running", 
            description: "Sviluppo Widget", 
            start_time: "09:30",
            project_name: "BixPortal",
            client_name: "SwissBix"
        }
    };

    const responseDataDEFAULT: ResponseInterface = {
        user: { id: 0, firstname: "", lastname: "", email: "" },
        stats: { today_count: 0, month_hours: 0 },
        activity: { recordid: "", status: "Stopped", description: "", start_time: "", project_name: "", client_name: "" }
    };

    const { addCard } = useRecordsStore()

    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);

    const payload = useMemo(() => {
        if (isDev || !targetUserId) return null;
        return {
            apiRoute: 'get_widget_employee', 
            userid: targetUserId
        };
    }, [targetUserId]);

    const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

    useEffect(() => {
        if (!isDev && response) {
            setResponseData(response);
        }
    }, [response]);

    useEffect(() => {
        if (isDev) setResponseData(responseDataDEV);
    }, []);

    // Format hours helper
    const formatHours = (val: number) => val.toFixed(1);

    return (
      <GenericComponent response={responseData} loading={loading} error={error}>
        {(data: ResponseInterface) => {
          const { user: userData, stats, activity } = data;
          const isRunning = activity.status === "Running";

          return (
            <div className="flex flex-col w-full h-full bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header Profile - Lighter version */}
                <div className="relative bg-gradient-to-b from-gray-100 to-white p-6">
                    
                    <div className="relative flex items-center space-x-4">
                        {/* Larger profile image with subtle ring */}
                        <div className="relative">
                            <img 
                              src={`/api/media-proxy?url=userProfilePic/${userData.id}.png`} 
                              alt={`${userData.firstname} ${userData.lastname}`}
                              className="w-20 h-20 rounded-full border-3 border-gray-400 shadow-xl object-cover"
                              onError={(e) => (e.target as HTMLImageElement).src = "/api/media-proxy?url=userProfilePic/default.jpg"}
                            />
                            {/* Status indicator */}
                            <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-white shadow-md ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}>
                                {isRunning && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>}
                            </div>
                        </div>
                        
                        {/* User info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-800 truncate">
                                {userData.firstname} {userData.lastname}
                            </h3>
                            <p className="text-sm text-gray-500 truncate mt-0.5">{userData.email}</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-200 my-2"></div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                    
                    {/* Activity Status */}
                    <div className={`rounded-xl p-4 border-2 shadow-sm transition-all ${isRunning ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                                {isRunning ? (
                                    <div className="relative">
                                        <PlayCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                                        <div className="absolute inset-0">
                                            <PlayCircleIcon className="h-6 w-6 text-green-400 mr-2 animate-ping" />
                                        </div>
                                    </div>
                                ) : (
                                    <StopCircleIcon className="h-6 w-6 text-gray-500 mr-2" />
                                )}
                                <span className={`font-bold text-sm ${isRunning ? 'text-green-700' : 'text-gray-700'}`}>
                                    {isRunning ? "Attività in corso" : "Ultima attività"}
                                </span>
                            </div>
                            <button
                                type="button"
                                className="z-10 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addCard && addCard('timesheet', activity.recordid!, "card")
                                }}
                              >
                                <SquareArrowOutUpRight className="w-4 h-4" />
                              </button>
                        </div>
                        <p className="text-gray-800 font-medium text-sm line-clamp-3 mb-3" title={activity.description}>
                            {activity.description}
                        </p>
                        <div className="space-y-1.5 text-xs">
                            {activity.client_name && (
                                <div className="flex items-center text-gray-600 bg-white/50 rounded-md px-2 py-1">
                                    <span className="font-semibold mr-1.5 text-gray-700">Cliente:</span> 
                                    <span className="truncate">{activity.client_name}</span>
                                </div>
                            )}
                            {activity.project_name && (
                                <div className="flex items-center text-gray-600 bg-white/50 rounded-md px-2 py-1">
                                    <span className="font-semibold mr-1.5 text-gray-700">Progetto:</span> 
                                    <span className="truncate">{activity.project_name}</span>
                                </div>
                            )}
                            {activity.start_time && (
                                <div className="flex items-center text-gray-600 bg-white/50 rounded-md px-2 py-1">
                                    <ClockIcon className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                    <span>{isRunning ? 'Iniziato alle:' : 'Data:'} <span className="font-medium">{activity.start_time}</span></span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid - Enhanced */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex flex-col items-center justify-center text-center text-white">
                                <span className="text-3xl font-bold mb-1">{stats.today_count}</span>
                                <span className="text-xs font-medium opacity-90 flex items-center">
                                    <ClockIcon className="h-3.5 w-3.5 mr-1" /> Ore Oggi
                                </span>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex flex-col items-center justify-center text-center text-white">
                                <span className="text-3xl font-bold mb-1">{formatHours(stats.month_hours)}</span>
                                <span className="text-xs font-medium opacity-90 flex items-center">
                                    <CalendarIcon className="h-3.5 w-3.5 mr-1" /> Ore Mese
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
          );
        }}
      </GenericComponent>
    );
};