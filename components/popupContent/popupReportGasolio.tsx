import React, { useState, useMemo } from 'react';
import { useRecordsStore } from '../records/recordsStore';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

// INTERFACCIA PROPS
interface PropsInterface {
  tableid?: string;
  recordid?: string;
}

export default function PopupReportGasolio({ tableid, recordid }: PropsInterface) {
  const { setPopUpType } = useRecordsStore();

  // Calcolo dinamico: Mese corrente + 4 mesi precedenti
  const monthsOptions = useMemo(() => {
    const options = [];
    const date = new Date(); // Data di oggi

    for (let i = 0; i < 5; i++) {
      // Formatta Anno
      const year = date.getFullYear();
      // Formatta Mese (aggiunge lo 0 davanti se necessario, es: 05)
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      // Aggiunge la stringa "YYYY-MM" all'array
      options.push(`${year}-${month}`);
      
      // Sposta la data indietro di 1 mese per il prossimo ciclo
      date.setMonth(date.getMonth() - 1);
    }
    return options;
  }, []);

  // Stato per l'opzione selezionata (Default: il primo valore dell'array, cioè il mese corrente)
  const [selectedOption, setSelectedOption] = useState<string>(monthsOptions[0]);

  const stampaGasoli = async () => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "stampa_gasoli",
          recordid: recordid,
          date: selectedOption,
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
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'gasolio.pdf';

      const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
      link.href = url;
      link.setAttribute('download', filename);
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
      {/* Select Dinamica */}
      <select
        className="p-2 border rounded-md"
        value={selectedOption}
        onChange={(e) => setSelectedOption(e.target.value)}
      > 
        {monthsOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {/* Bottoni */}
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" onClick={() => { setPopUpType('emailGasolio') }}>
          Invia Email
        </button>
        <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" onClick={stampaGasoli}>
          Stampa
        </button>
      </div>
    </div>
  );
};