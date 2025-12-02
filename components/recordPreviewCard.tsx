import React from 'react';
import { sanitizeHtml } from '@/utils/htmlPurify';

// L'interfaccia per le props rimane invariata
interface RecordPreviewCardProps {
  recordid: string;
  css?: string;
  fields: { [key: string]: string };
  onClick?: () => void;
}

export default function RecordPreviewCard({ recordid, css, fields, onClick }: RecordPreviewCardProps) {
  const fieldEntries = Object.entries(fields);
  const titleField = fieldEntries.length > 0 ? fieldEntries[0] : null;
  const otherFields = fieldEntries.slice(1);

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-700 
        p-4 rounded-lg 
        shadow hover:shadow-xl 
        transition-all duration-300 ease-in-out 
        cursor-pointer 
        active:scale-[0.98]
        mb-4 // <-- MODIFICA: Aggiunto margine inferiore
        ${css}
      `}
    >
      {/* Titolo della Card con tipografia aggiornata */}
      {titleField && (
        <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100 truncate">
          {titleField[1]}
        </h3>
      )}

      {/* Altri campi con una migliore gerarchia visiva */}
      <div className="space-y-2">
        {otherFields.map(([label, value]) => (
          <div key={label} className="text-sm">
            <span className="font-medium text-gray-500 dark:text-gray-400">{label}: </span>
            <span 
              className="text-gray-800 dark:text-gray-200" 
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}