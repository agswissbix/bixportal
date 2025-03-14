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

export default function Home() {
  const {selectedMenu} = useRecordsStore();
  const router = useRouter();


  return (    
    <div className="w-full h-full flex flex-col">
      <Toaster richColors position='top-right' />
      <Navbar />
      <div className="w-full flex-1 flex">
        <Sidebar />
        <div className="relative h-full w-11/12 bg-gray-100">
        {
              selectedMenu === 'TelAmicoCalendario' ? (
                <ScheduleCalendar />
              )
              : selectedMenu === 'TelAmicoAgenda' ? (
                <Agenda />
              ) 
              : selectedMenu === 'PitCalendar' ? (
                <PitCalendar />
              ) 
              : selectedMenu === 'Calendario' ? (
                <CalendarComponent />
              ) 
              : selectedMenu === 'Dashboard' ? (
                <Dashboard />
              )
              : (
                <StandardContent tableid={selectedMenu} />
              )
        }

        </div>
      </div>

    </div>
  );
}
