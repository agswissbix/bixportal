'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, logoutUser } from '@/utils/auth';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/navbar';
import { getCsrfToken } from '@/utils/auth';
import Sidebar from '@/components/sidebar';
import StandardContent from '@/components/standardContent';
import { useRecordsStore } from '@/components/records/recordsStore';
import ScheduleCalendar from '@/app/custom/ta/components/scheduleCalendar';
import Agenda from '@/components/agenda';
import PitCalendar from '@/components/pitCalendar';
import CalendarComponent from '@/components/calendarComponent';
import Dashboard from '@/components/dashboard';
import { set } from 'lodash';
import SimplePopup from '@/components/inviaEmail';
import PopUpManager from '@/components/popUpManager';
import BelottiFormulari from '@/components/belottiFormulari';
import UserSettings from '@/components/userSettings';

export default function Home() {
  const {selectedMenu, setTableid, isPopupOpen, setIsPopupOpen, popUpType, popupRecordId} = useRecordsStore();
  const router = useRouter();

  useEffect(() => {
    if (selectedMenu) {
      setTableid(selectedMenu);
    }
  }, [selectedMenu]);

  return (    
   <div className="w-full h-screen flex">
    
      <Toaster richColors position="top-right" />
      
      {/* Sidebar occupa tutta l'altezza */}
      <Sidebar className="h-screen  bg-gray-800 text-white" />

      {/* Contenitore principale con Navbar e contenuto */}
      <div className="flex flex-col w-full h-full">
        <Navbar className="w-full  bg-white shadow-md" />

        {/* Contenuto principale */}
        <PopUpManager 
          isOpen={isPopupOpen} 
          onClose={() => setIsPopupOpen(false)} 
          type={popUpType}
          tableid={selectedMenu}
          recordid={popupRecordId}
        />

        <div className="flex-1 bg-gray-100 p-4 h-5/6">
          {selectedMenu === 'TelAmicoCalendario' ? (
            <ScheduleCalendar />
          ) : selectedMenu === 'TelAmicoAgenda' ? (
            <Agenda />
          ) : selectedMenu === 'PitCalendar' ? (
            <PitCalendar />
          ) : selectedMenu === 'Calendario' ? (
            <CalendarComponent />
          ) : selectedMenu === 'Dashboard' ? (
            <Dashboard />
          ) : selectedMenu === 'userSettings' ? (
            <UserSettings />
          ) : selectedMenu === 'LIFESTYLE' ? (
            <BelottiFormulari formType='LIFESTYLE' />
          ) : selectedMenu === 'LIQUIDI LAC' ? (
            <BelottiFormulari formType='LIQUIDI LAC' />
          ) : selectedMenu === 'MERCE VARIA BELOTTI' ? (
            <BelottiFormulari formType='MERCE VARIA BELOTTI' />
          ) : selectedMenu === 'MERCE VARIA BLITZ' ? (
            <BelottiFormulari formType='MERCE VARIA BLITZ' />
          ) : selectedMenu === 'MERCE VARIA OAKLEY' ? (
            <BelottiFormulari formType='MERCE VARIA OAKLEY' />
          ) : selectedMenu === 'RIORDINO LAC' ? (
            <BelottiFormulari formType='RIORDINO LAC' />
          ) : selectedMenu === 'UDITO' ? (
            <BelottiFormulari formType='UDITO' />
          ) : selectedMenu === 'qwe' ? (
            <BelottiFormulari formType='asd' />
          ) : selectedMenu === 'formularioMerceVariaBlitz' ? (
            <BelottiFormulari formType='MerceVariaBlitz' />
          ) : selectedMenu === 'formularioMerceVariaOakley' ? (
            <BelottiFormulari formType='MerceVariaOakley' />
          ) : selectedMenu === 'formularioOrdiniUdito' ? (
            <BelottiFormulari formType='OrdiniUdito' />
          ) : (
            <StandardContent tableid={selectedMenu} />
          )}
        </div>
      </div>
    </div>
  );
}
