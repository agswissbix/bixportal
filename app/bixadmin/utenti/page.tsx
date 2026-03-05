// components/UserSettings.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient'; // Usa la tua istanza
import NewUserForm from '@/components/admin/users/newUser'; 
// import NewGroupForm from './NewGroupForm'; 
import {useApi} from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';
import UserThemeSettings from '@/components/admin/users/settingsUser';

const isDev = false

interface ResponseInterface {
  users: Array<{}>;
  groups: Array<{}>;
}

const UserSettings = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState('list'); 
  const [responseData, setResponseData] = useState<ResponseInterface | null>(null);

  const payloadApi = useMemo(() => {
    if (isDev) return null;
    return { 
      apiRoute: 'get_users_and_groups_api' 
    };
  }, []);
  const { response, loading, error } = useApi<ResponseInterface>(payloadApi);
  useEffect(() => {
    if (!isDev && response) { 
      setResponseData(response); 
      setUsers(response.users || []);
      setGroups(response.groups || []);
      setIsLoading(false);
    }
  }, [response]);

  const handleUserClick = (userId) => {
    setSelectedUser(users.find(u => u.id === userId));
    setSelectedGroup(null);
    setViewMode('userSettings');
  };

  const handleGroupClick = (groupUsername) => {
    setSelectedGroup(groups.find(g => g.username === groupUsername));
    setSelectedUser(null);
    setViewMode('groupSettings');
  };

  const handleImpersonate = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstanceClient.post(
        '/postApi',
        {
          apiRoute: 'start_impersonate',
          target_user_id: userId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        toast.success(response.data.detail || 'Impersonation avviata');
        // Ricarica per applicare il nuovo contesto di sessione
        window.location.href = "/";
      } else {
        toast.error('Errore: ' + response.data.detail);
      }
    } catch (error: any) {
      console.error('Errore durante impersonation:', error);
      toast.error('Impossibile avviare impersonation: ' + (error.response?.data?.detail || error.message));
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'newUser':
        return <NewUserForm />;
      case 'newGroup':
        // return <NewGroupForm />;
      case 'userSettings':
        return (
          <div className="space-y-6">
            <UserThemeSettings userid={selectedUser.id} />
             <div className="bg-white shadow-sm p-4 rounded-md border border-gray-200 mt-6">
               <h4 className="text-lg font-medium text-gray-900 mb-2">Impersonation</h4>
               <p className="text-sm text-gray-500 mb-4">Accedi al sistema come questo utente per verificare impostazioni o problemi. Le azioni eseguite saranno tracciate.</p>
               <button onClick={() => handleImpersonate(selectedUser.id)} className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Accedi come {selectedUser.username}</button>
            </div>
          </div>
        );
      case 'groupSettings':
        return <div>Impostazioni Gruppo per: {selectedGroup.username}</div>;
      default:
        return (
          <div className="flex flex-col space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">Seleziona un'opzione</h3>
            <p className="text-gray-500">
              Scegli un utente o un gruppo dal menu a sinistra per visualizzarne le impostazioni.
            </p>
          </div>
        );
    }
  };

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex h-full w-full max-w-7xl mx-auto rounded-lg shadow-xl bg-white p-6">
        {/* Sidebar */}
        <div className="w-1/4 pr-6 border-r border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestione Utenti</h2>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Utenti</h3>
            <div className="space-y-2">
              <select onChange={(e) => handleUserClick(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md">
                <option value="">Seleziona un utente</option>
                {users.sort((a, b) => a.username.localeCompare(b.username)).map((user) => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setViewMode('newUser')}
              className="mt-4 w-full p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Nuovo Utente
            </button>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Gruppi</h3>
            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.username}
                  onClick={() => handleGroupClick(group.username)}
                  className="w-full text-left p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {group.username}
                </button>
              ))}
            </div>
            <button
              onClick={() => setViewMode('newGroup')}
              className="mt-4 w-full p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Nuovo Gruppo
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-3/4 pl-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Caricamento...
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
      )}
    </GenericComponent>
  );
};

export default UserSettings;