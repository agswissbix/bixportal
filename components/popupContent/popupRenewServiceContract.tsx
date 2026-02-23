import React, { useState } from 'react';
import { toast } from 'sonner';
import { useRecordsStore } from '../records/recordsStore';

interface PropsInterface {
  tableid?: string;
  recordid?: string;
  onClose?: () => void;
}

export default function PopupRenewServiceContract({ tableid, recordid, onClose }: PropsInterface) {
  const [invoiceno, setInvoiceNo] = useState('');
  const [contractHours, setContractHours] = useState('');
  const [startDate, setStartDate] = useState('');
  const { popupResolver, setPopupResolver, setIsPopupOpen } = useRecordsStore();

  const save = () => {
    if (!invoiceno) {
      toast.error('Inserisci il valore di Fattura n.');
      return;
    }
    if (!contractHours) {
      toast.error('Inserisci il valore per le Ore contrattuali');
      return;
    }
    if (!startDate) {
      toast.error("Seleziona una data d'inizio");
      return;
    }
    if (popupResolver) {
      popupResolver({ invoiceno, contracthours: contractHours, startdate: startDate });
      setPopupResolver(null);
      setIsPopupOpen(false);
    }
    onClose && onClose();
  };

  const cancel = () => {
    if (popupResolver) {
      popupResolver(null);
      setPopupResolver(null);
    }
    setIsPopupOpen(false);
    onClose && onClose();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
          {/* Refresh icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
            Rinnovo Contratto
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Compila i campi per rinnovare il contratto di servizio
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-700 mb-5" />

      {/* Fields */}
      <div className="space-y-5">

        {/* Fattura n. */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            Fattura n. <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600 dark:text-gray-500 pointer-events-none select-none">
              F-
            </span>
            <input
              type="number"
              value={invoiceno}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm text-gray-900 dark:text-white placeholder:text-gray-400
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="12345"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Numero progressivo della fattura associata al rinnovo
          </p>
        </div>

        {/* Ore contrattuali */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            Ore contrattuali <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.5"
              value={contractHours}
              onChange={(e) => setContractHours(e.target.value)}
              className="w-full pl-3 pr-12 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
              placeholder="10.5"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 dark:text-gray-500 pointer-events-none">
              ore
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Numero totale di ore incluse nel contratto rinnovato
          </p>
        </div>

        {/* Data d'inizio */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            Data d'inizio <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all text-sm text-gray-900 dark:text-white"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Data di decorrenza del contratto rinnovato
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-700 mt-6 mb-4" />

      {/* Required note */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        <span className="text-red-500">*</span> Campi obbligatori
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={cancel}
          className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          Annulla
        </button>
        <button
          onClick={save}
          className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Salva
        </button>
      </div>
    </div>
  );
}