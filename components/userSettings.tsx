// 📄 UserSettings.jsx

import React, { useState } from 'react';
import UserProfile from './userProfile';
import UserFavTables from './userFavTables';
import UserTheme from './userTheme';

const AccordionItem = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border rounded-lg mb-2">
      <button
        className="flex justify-between items-center w-full p-4 font-medium text-left text-gray-700 hover:bg-gray-50 rounded-t-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && <div className="p-4 border-t">{children}</div>}
    </div>
  );
};

export default function UserSettings() {
  return (
    <div className="h-full w-full p-4 overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-4">Impostazioni Utente</h2>
      <AccordionItem title="Profilo Utente">
        <UserProfile />
      </AccordionItem>
      <AccordionItem title="Tabelle Preferite">
        <UserFavTables />
      </AccordionItem>
      <AccordionItem title="Tema dell'Applicazione">
        <UserTheme />
      </AccordionItem>
    </div>
  );
}