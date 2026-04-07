// components/UserSettings.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient'; // Usa la tua istanza
import NewUserForm from '@/components/admin/users/newUser'; 
import NewGroupForm from '@/components/admin/users/newGroup'; 
import SettingsGroup from '@/components/admin/users/settingsGroup';
import {useApi} from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';
import UserProfileSettings from '@/components/admin/users/settingsUser';

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
  
  // Reorder state
  const [orderedGroups, setOrderedGroups] = useState<any[]>([]);

  useEffect(() => {
    if (groups.length > 0) {
      setOrderedGroups([...groups].sort((a: any,b: any) => (a.priority ?? 9999) - (b.priority ?? 9999)));
    }
  }, [groups]);

  const moveGroup = (index: number, direction: number) => {
      const newArray = [...orderedGroups];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newArray.length) return;
      
      const temp = newArray[index];
      newArray[index] = newArray[targetIndex];
      newArray[targetIndex] = temp;
      
      setOrderedGroups(newArray);
  };

  const savePriorities = async () => {
      const mappedGroups = orderedGroups.map((g, index) => ({ id: g.id, priority: index }));
      try {
          const res = await axiosInstanceClient.post('/postApi', {
             apiRoute: 'update_groups_priority_api',
             groups: mappedGroups
          });
          if (res.data.success) {
              toast.success('Priorità salvate con successo');
          } else {
              toast.error('Errore salvataggio priorità');
          }
      } catch (e: any) {
          toast.error('API Error: ' + e.message);
      }
  };

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

  const handleGroupClick = (groupId: number) => {
    setSelectedGroup(groups.find((g: any) => g.id === groupId));
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
        return <NewGroupForm users={users} />;
      case 'userSettings':
        return (
          <div className="space-y-6">
            <UserProfileSettings userid={selectedUser.id} />
             <div className="bg-white shadow-sm p-4 rounded-md border border-gray-200 mt-6">
               <h4 className="text-lg font-medium text-gray-900 mb-2">Impersonation</h4>
               <p className="text-sm text-gray-500 mb-4">Accedi al sistema come questo utente per verificare impostazioni o problemi. Le azioni eseguite saranno tracciate.</p>
               <button onClick={() => handleImpersonate(selectedUser.id)} className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">Accedi come {selectedUser.username}</button>
            </div>
          </div>
        );
      case 'groupSettings':
        return <SettingsGroup groupid={selectedGroup?.id} users={users} groups={groups} />;
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
      <div className="flex h-full w-full mx-auto rounded-lg shadow-xl bg-white p-6">
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
            <div className="space-y-1 mb-2 max-h-96 overflow-y-auto pr-2">
              {orderedGroups.map((g, index) => {
                 const isSelected = selectedGroup?.id === g.id;
                 return (
                   <div key={g.id} className={`flex items-center justify-between p-1 rounded-md border ${isSelected ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-50 border-gray-200'}`}>
                     <div className="flex items-center space-x-2 cursor-pointer w-full overflow-hidden" onClick={() => handleGroupClick(g.id)}>
                       <span className="font-mono text-xs text-gray-400 w-4">{index}</span>
                       <span className={`text-sm truncate ${isSelected ? 'font-bold text-indigo-800' : 'text-gray-700'}`}>{g.name}</span>
                     </div>
                     <div className="flex space-x-1 shrink-0">
                       <button onClick={() => moveGroup(index, -1)} disabled={index === 0} className="text-xs px-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30">▲</button>
                       <button onClick={() => moveGroup(index, 1)} disabled={index === orderedGroups.length - 1} className="text-xs px-1 text-gray-500 hover:text-indigo-600 disabled:opacity-30">▼</button>
                     </div>
                   </div>
                 )
              })}
            </div>
            <button onClick={savePriorities} className="w-full mb-4 p-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium">
              Salva Ordine / Priorità
            </button>
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