// components/UserThemeSettings.jsx
'use client';

import { useState, useEffect } from 'react';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';
import * as themes from '@/app/themes_customs/themes_custom';

const themeList = [
  ...Object.values(themes).flat(),
];

const UserThemeSettings = ({ userid }) => {
  const [selectedTheme, setSelectedTheme] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Carica il tema dell'utente quando il componente viene montato
    const fetchUserTheme = async () => {
      if (!userid) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axiosInstanceClient.post(
          '/postApi',
          {
            apiRoute: 'get_user_settings_api',
            userid: userid,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('User theme response:', response.data);
        console.log('Available themes:', themeList);
        if (response.data.success && themeList.includes(response.data.theme)) {
          setSelectedTheme(response.data.theme);
        } else {
          toast.error('Errore nel caricamento del tema: ' + response.data.theme);
            setSelectedTheme('default');
        }
      } catch (error) {
        toast.error('Impossibile caricare il tema utente.');
        console.error('Fetch theme error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserTheme();
  }, [userid]);

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstanceClient.post(
        '/postApi',
        {
          apiRoute: 'save_user_theme_api',
          userid: userid,
          theme: selectedTheme,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success('Tema salvato con successo!');
      } else {
        toast.error('Errore nel salvataggio del tema: ' + response.data.error);
      }
    } catch (error) {
      toast.error('Errore durante il salvataggio.', error)
      console.error('Save theme error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Caricamento tema...</div>;
  }

  return (
    <div className="flex items-center space-x-4 p-4 rounded-md bg-white shadow-sm">
      <label htmlFor="select-theme" className="text-sm font-medium text-gray-700">Tema:</label>
      <select
        id="select-theme"
        value={selectedTheme}
        onChange={(e) => setSelectedTheme(e.target.value)}
        className="form-select block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      >
        {themeList.map((theme) => (
          <option key={theme} value={theme}>
            {theme}
          </option>
        ))}
      </select>
      <button
        onClick={handleSaveTheme}
        disabled={isSaving}
        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSaving ? 'Salvataggio...' : 'Salva'}
      </button>
    </div>
  );
};

export default UserThemeSettings;