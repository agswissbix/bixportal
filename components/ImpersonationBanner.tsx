"use client";

import { useContext } from 'react';
import { AppContext } from '@/context/appContext';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';

export default function ImpersonationBanner() {
  const { isImpersonating, userName, user } = useContext(AppContext);

  if (!isImpersonating) return null;

  const handleStopImpersonating = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstanceClient.post(
        '/postApi',
        {
          apiRoute: 'stop_impersonate',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        toast.success(response.data.detail || 'Impersonation terminata');
        window.location.href = "/";
      } else {
        toast.error('Errore: ' + response.data.detail);
      }
    } catch (error: any) {
      console.error('Errore durante lo stop impersonation:', error);
      toast.error('Impossibile terminare impersonation');
    }
  };

  return (
    <div className="bg-red-600 px-4 py-3 text-white sm:flex sm:items-center sm:justify-center sm:px-6 lg:px-8 z-[9000] sticky top-0 w-full shadow-md">
      <p className="text-center font-medium sm:text-left">
        <span className="md:hidden">⚠️ Impersonando {userName || user}</span>
        <span className="hidden md:inline">
          ⚠️ <strong>ATTENZIONE:</strong> Stai operando come Utente {userName || user}. Eventuali azioni modificheranno il suo account.
        </span>
      </p>
      <button
        type="button"
        onClick={handleStopImpersonating}
        className="mt-3 flex w-full items-center justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-600 sm:mt-0 sm:ml-4 sm:w-auto"
      >
        Esci dall'impersonation e torna Admin
      </button>
    </div>
  );
}
