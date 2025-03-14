import React, { useState, useRef, useEffect, useContext } from 'react';
import { LogOut, User, Calendar, Phone, MessageCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ScheduleCalendarContent from './scheduleCalendarContent';
import ScheduleCalendarChat from './scheduleCalendarChat';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { AppContext } from '@/context/appContext';



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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // DATI DEL CONTESTO
  const { user, role, chat, telefono } = useContext(AppContext);
  // Determina il tab predefinito
    // Effetto che si occupa di impostare la tab iniziale (o aggiornarla) 
  // ogni volta che telefono o chat cambiano
  // State che controlla quale tab è attivo
  const [activeTab, setActiveTab] = useState<string | null>(null);
  useEffect(() => {
    if (telefono === 'Si') {
      setActiveTab('phone');
    } else if (chat === 'Si') {
      setActiveTab('chat');
    } else {
      setActiveTab(null);
    }
  }, [telefono, chat]);

  const handleLogout = () => {
    console.log('Logging out...');
    router.push("/login");
  };

  const handleChangePassword = () => {
    router.push("/change-password");
  }

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: { target: any; }) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    // Modifica: forzata l’altezza allo schermo e sempre scrollabile
    <div className="h-screen overflow-y-scroll bg-gray-50">
      <header className="w-full bg-slate-200 border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/bixdata/logos/logo_tabellone3.png"
              alt="BixData"
              width={1000}
              height={1000}
              className="h-14 w-auto mx-auto"
              priority
            />
          </div>

          {/* Navbar con tab */}
          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            {telefono === 'Si' && (
              <button
                onClick={() => setActiveTab('phone')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'phone'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Telefono </span>
              </button>
            )}

            {chat === 'Si' && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat </span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative" ref={dropdownRef}>
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-gray-900"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <User className="w-5 h-5 mr-2 text-gray-500" />
                {user} - { role } 
              </Button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    Il mio account
                  </div>
                  <button
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => {/* Handle profile click */}}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profilo
                  </button>
                  <button
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                  <button
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={handleChangePassword}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Cambia Password
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full p-6">
        {activeTab === 'phone' && telefono === 'Si' ? <ScheduleCalendarContent tipologia="telefono"  /> : null}
        {activeTab === 'chat' && chat === 'Si' ? <ScheduleCalendarContent tipologia="chat"  /> : null}
      </main>
    </div>
  );
};

export default AppLayout;
