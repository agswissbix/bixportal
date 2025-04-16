import React from 'react';
import { useRecordsStore } from '../records/recordsStore';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  recordid?: string;
}

export default function PopupReportGasolio({ tableid, recordid }: PropsInterface) {

  const {setPopUpType, } = useRecordsStore();

  const stampaGasoli = async () => {
    try {

      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "stampa_gasoli",
          recordid: recordid,
        },
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bollettino.pdf');
      document.body.appendChild(link);
      link.click();
      toast.success('Report gasoli stampato con successo');

    } catch (error) {
      console.error('Errore durante la stampa dei gasoli', error);
      toast.error('Errore durante la stampa dei gasoli');
    }
  }
  
  return (
    <div className="h-full w-full p-4 flex flex-col gap-4">
      {/* Select */}
      <select className="p-2 border rounded-md">
        <option value="opzione1">Gennaio 2025</option>
        <option value="opzione2">Febbraio 2025</option>
        <option value="opzione3">Marzo 2025</option>
      </select>

      {/* Bottoni */}
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => {setPopUpType('email')}}>Invia Email</button>
        <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" onClick={stampaGasoli}>Stampa</button>
      </div>
    </div>
  );
};
