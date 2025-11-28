import React, { useState } from 'react';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { useRecordsStore } from '../records/recordsStore';

interface PropsInterface {
  tableid?: string;
  recordid?: string;
  onClose?: () => void;
}

export default function PopupStartDate({ tableid, recordid, onClose }: PropsInterface) {
  const [startDate, setStartDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { popupResolver, setPopupResolver, setIsPopupOpen } = useRecordsStore();

  const save = () => {
    if (!startDate) {
      toast.error('Seleziona una data');
      return;
    }

    if (popupResolver) {
      popupResolver(startDate);
      setPopupResolver(null);
      setIsPopupOpen(false);
    }
    
    onClose && onClose();
  };

  return (
    <div className="h-full w-full p-4 flex flex-col gap-4">
      <label className="text-sm font-medium">Data d'inizio</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="p-2 border rounded-md"
      />

      <div className="flex gap-2 mt-4">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          onClick={save}
          disabled={loading}
        >
          Salva
        </button>
        <button
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
          onClick={() => {
            if (popupResolver) {
              popupResolver(null);
              setPopupResolver(null);
            }
            setIsPopupOpen(false);
            onClose && onClose();
          }}
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
