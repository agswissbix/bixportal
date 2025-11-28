import React, { useState } from 'react';
import { toast } from 'sonner';
import { useRecordsStore } from '../records/recordsStore';

interface PropsInterface {
  tableid?: string;
  recordid?: string;
  onClose?: () => void;
}

export default function PopupInvoiceNo({ tableid, recordid, onClose }: PropsInterface) {
  const [invoiceno, setInvoiceNo] = useState<string>('');
  const { popupResolver, setPopupResolver, setIsPopupOpen } = useRecordsStore();

  const save = () => {
    if (!invoiceno) {
      toast.error('Inserisci il valore ');
      return;
    }

    if (popupResolver) {
      popupResolver(invoiceno);
      setPopupResolver(null);
      setIsPopupOpen(false);
    }
    
    onClose && onClose();
  };

  return (
    <div className="h-full w-full p-4 flex flex-col gap-4">
      <label className="text-sm font-medium">Fattura n.</label>
      <input
        type="number"
        step="0.1"
        value={invoiceno}
        onChange={(e) => setInvoiceNo(e.target.value)}
        className="p-2 border rounded-md"
        placeholder="Es. 10.5"
      />

      <div className="flex gap-2 mt-4">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          onClick={save}
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
