import React, { useState, useContext } from 'react';
import { LogOut, User, Calendar, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ScheduleCalendarTelefono from './scheduleCalendarTelefono';
import ScheduleCalendarChat from './scheduleCalendarChat';
import { useRouter } from "next/navigation";
import Image from 'next/image';


const CalendarioTelefono = () => (
  <Card className="p-6">
    <div className="flex items-center space-x-3 mb-4">
      <Calendar className="w-6 h-6 text-blue-500" />
      <h2 className="text-xl font-semibold">Calendario Telefono</h2>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-gray-600">Contenuto del calendario telefono</p>
    </div>
  </Card>
);

const CalendarioChat = () => (
  <Card className="p-6">
    <div className="flex items-center space-x-3 mb-4">
      <Calendar className="w-6 h-6 text-green-500" />
      <h2 className="text-xl font-semibold">Calendario Chat</h2>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <p className="text-gray-600">Contenuto del calendario chat</p>
    </div>
  </Card>
);

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState('phone');
  const router = useRouter();
  const user='';
  //const { user, handleLogout } = useContext(AppContext);
  const username = "Alessandro Galli";
 


  const handleLogout = () => {
    console.log('Logging out...');
    router.push("/login"); // Reindirizza alla pagina di login
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-slate-200 border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Image
                          src="/bixdata/logos/logo_tabellone2.png"
                          alt="BixData"
                          width={1000}
                          height={1000}
                          className="h-14 w-auto mx-auto bg-white"
                          priority
                        />
            <User className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">              {user }            </span>
          </div>

          {/* Custom Tabs */}
          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'phone'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Telefono</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === 'chat'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </button>
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full p-6">
        {activeTab === 'phone' ? <ScheduleCalendarTelefono /> : <ScheduleCalendarChat />}
      </main>
    </div>
  );
};

export default AppLayout;