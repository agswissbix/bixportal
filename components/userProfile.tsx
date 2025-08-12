// UserSettings.jsx (Aggiornato)

import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { useRecordsStore } from './records/recordsStore';
import { toast } from 'sonner';
import { Camera, RefreshCcw } from 'lucide-react'; // Nuove icone

const isDev = true;

interface PropsInterface {
  propExampleValue?: string;
}

interface ResponseInterface {
  responseExampleValue?: string;
}

// Componente separato per l'immagine del profilo
function UserProfilePic() {
  const { user } = useContext(AppContext);
  const { userid } = useRecordsStore();
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());

  const profilePicUrl = `/api/media-proxy?url=userProfilePic/${userid}.png?t=${timestamp}`;
  const defaultPicUrl = "/api/media-proxy?url=userProfilePic/default.jpg";

  const updateUserProfilePic = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('apiRoute', 'update_user_profile_pic');
      formData.append('image', file);

      await axiosInstanceClient.post(
        "/postApi",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Immagine del profilo aggiornata con successo!");
      setTimestamp(Date.now()); // Aggiorna il timestamp per forzare il ricaricamento
    } catch (error) {
      toast.error("Errore durante l'aggiornamento dell'immagine del profilo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group w-24 h-24">
      <img
        src={profilePicUrl}
        alt="Immagine del profilo"
        className="w-full h-full rounded-full object-cover border-2 border-gray-300 transition-opacity duration-200"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.includes("default.jpg")) {
            target.src = defaultPicUrl;
          }
        }}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-full">
          <RefreshCcw className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="profile-pic-upload"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            updateUserProfilePic(file);
          }
        }}
      />
      <button
        onClick={() => document.getElementById('profile-pic-upload')?.click()}
        className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-0 group-hover:bg-opacity-50 transition-colors duration-300 rounded-full cursor-pointer"
        title="Modifica immagine del profilo"
      >
        <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>
    </div>
  );
}

// Componente principale UserSettings
function UserSettings({ propExampleValue }: PropsInterface) {
  const { user, userName } = useContext(AppContext);
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? { responseExampleValue: "Development response" } : { responseExampleValue: "Default response" });
  const { userid } = useRecordsStore();

  // Omessa la logica di useApi per brevità, dato che il focus è sull'interfaccia.

  return (
    <GenericComponent response={responseData} loading={false} error={null}>
      {(response: ResponseInterface) => (
        <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl max-w-lg mx-auto my-10">
          <UserProfilePic />

          <div className="text-center mt-4">
            <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
            <p className="text-sm text-gray-500">{user}</p>
          </div>

          <div className="w-full border-t border-gray-200 my-8"></div>

          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Impostazioni account</h3>
            {/* Qui puoi aggiungere altre opzioni */}
            <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
              <span className="text-gray-700">Notifiche Email</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}
    </GenericComponent>
  );
}

export default UserSettings;