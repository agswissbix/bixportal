import React from 'react';

// Interfaccia per le props della card
interface RecordPreviewCardProps {
  recordid: string;
  css?: string;
  // I campi sono un oggetto chiave-valore per la massima flessibilità
  fields: { [key: string]: string }; 
  onClick?: () => void;
}

export default function RecordPreviewCard({ recordid, css, fields, onClick }: RecordPreviewCardProps) {
  // Il primo campo viene spesso usato come titolo
  const fieldEntries = Object.entries(fields);
  const titleField = fieldEntries.length > 0 ? fieldEntries[0] : null;
  const otherFields = fieldEntries.slice(1);

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border dark:border-gray-700 mb-3 cursor-pointer hover:shadow-lg transition-shadow duration-200 ${css}`}
    >
      {/* Titolo della Card */}
      {titleField && (
        <h3 className="font-bold text-md mb-2 text-gray-900 dark:text-gray-100 truncate">
          {titleField[1]}
        </h3>
      )}

      {/* Altri campi */}
      <div className="space-y-1">
        {otherFields.map(([label, value]) => (
          <div key={label} className="text-sm">
            <span className="font-semibold text-gray-600 dark:text-gray-400">{label}: </span>
            <span className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        ))}
      </div>
    </div>
  );
}