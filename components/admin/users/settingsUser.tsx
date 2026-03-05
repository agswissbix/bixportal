// components/UserThemeSettings.jsx
'use client';

import { useState, useEffect } from 'react';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';
import * as themes from '@/app/themes_customs/themes_custom';

const themeList = [
  ...Object.values(themes).flat(),
];

const UserSettings = ({ userid }: { userid: number }) => {
  const [selectedTheme, setSelectedTheme] = useState('');
  
  // Profile States
  const [profileData, setProfileData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    description: '',
    is_superuser: false,
    is_staff: false,
    is_active: true,
  });

  const [isLoadingTheme, setIsLoadingTheme] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    // Carica il tema dell'utente quando il componente viene montato
    const fetchUserTheme = async () => {
      if (!userid) return;
      setIsLoadingTheme(true);
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
        setIsLoadingTheme(false);
      }
    };

    const fetchUserProfile = async () => {
      if (!userid) return;
      setIsLoadingProfile(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axiosInstanceClient.post(
          '/postApi',
          {
            apiRoute: 'get_user_profile_api',
            userid: userid,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data.success && response.data.data) {
          setProfileData(response.data.data);
        } else {
            toast.error('Errore nel caricamento del profilo utente.');
        }
      } catch (error) {
        toast.error('Impossibile caricare il profilo utente.');
        console.error('Fetch profile error:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserTheme();
    fetchUserProfile();
  }, [userid]);

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
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
      setIsSavingTheme(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstanceClient.post(
        '/postApi',
        {
          apiRoute: 'save_user_profile_api',
          userid: userid,
          ...profileData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success('Profilo utente aggiornato con successo!');
      } else {
        toast.error('Errore nel salvataggio del profilo: ' + response.data.error);
      }
    } catch (error) {
      toast.error('Errore durante il salvataggio del profilo.');
      console.error('Save profile error:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoadingTheme || isLoadingProfile) {
    return <div className="text-center text-gray-500 py-4">Caricamento impostazioni utente...</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Blocco Profilo Utente */}
      <div className="bg-white shadow-sm p-4 rounded-md border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Modifica Profilo</h4>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" id="username" name="username" value={profileData.username} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" name="email" value={profileData.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">Nome</label>
              <input type="text" id="firstname" name="firstname" value={profileData.firstname} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">Cognome</label>
              <input type="text" id="lastname" name="lastname" value={profileData.lastname} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrizione (SysUser)</label>
              <input type="text" id="description" name="description" value={profileData.description} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h5 className="text-md font-medium text-gray-800 mb-3">Permessi e Stato</h5>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="is_active" checked={profileData.is_active} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700">Utente Attivo</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="is_staff" checked={profileData.is_staff} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700">Staff (Accesso base admin)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="is_superuser" checked={profileData.is_superuser} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700">Superuser (Accesso totale)</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSavingProfile ? 'Salvataggio...' : 'Salva Profilo'}
            </button>
          </div>
        </form>
      </div>

      {/* Blocco Tema */}
      <div className="flex items-center space-x-4 p-4 rounded-md bg-white shadow-sm border border-gray-200">
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
        type="button"
        onClick={handleSaveTheme}
        disabled={isSavingTheme}
        className="inline-flex items-center justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSavingTheme ? 'Salvataggio...' : 'Salva Tema'}
      </button>
    </div>
    </div>
  );
};

export default UserSettings;