// components/UserSettings.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient'; // Usa la tua istanza
import NewUserForm from '@/components/admin/newUser'; 
// import NewGroupForm from './NewGroupForm'; 
import {useApi} from '@/utils/useApi';
import GenericComponent from '@/components/genericComponent';

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

  const renderContent = () => {
    switch (viewMode) {
      case 'newUser':
        return <NewUserForm />;
      case 'newGroup':
        // return <NewGroupForm />;
      case 'userSettings':
        return <div>Impostazioni Utente per: {selectedUser.username}</div>;
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
                {users.map((user) => (
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