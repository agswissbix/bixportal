'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

export default function SettingsGroup({ groupid, users, groups }: { groupid: number, users: any[], groups: any[] }) {
  const [group, setGroup] = useState<any>(null);
  const [groupUsers, setGroupUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [manager, setManager] = useState('');
  const [newUser, setNewUser] = useState('');

  const fetchGroup = async () => {
    try {
      const response = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'get_group_detail_api',
        groupid: groupid
      });
      if (response.data.success) {
        setGroup(response.data.group);
        setGroupUsers(response.data.users);
        setName(response.data.group.name);
        setDescription(response.data.group.description || '');
        setManager(response.data.group.idmanager ? String(response.data.group.idmanager) : '');
      } else {
        toast.error('Errore nel caricamento del gruppo');
      }
    } catch (e: any) {
      toast.error('Errore API: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupid) {
        setLoading(true);
        fetchGroup();
    }
  }, [groupid]);

  const handleUpdate = async () => {
    try {
      const res = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'update_group_api',
        groupid: groupid,
        name,
        description,
        idmanager: manager ? parseInt(manager) : null
      });
      if (res.data.success) {
        toast.success('Gruppo aggiornato con successo');
      } else {
         toast.error('Errore aggiornamento: ' + res.data.error);
      }
    } catch (e: any) {
      toast.error('Errore API: ' + e.message);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare definitivamente questo gruppo? Tutti gli utenti associati verranno scollegati.')) return;
    try {
      const res = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'delete_group_api',
        groupid: groupid
      });
      if (res.data.success) {
        toast.success('Gruppo eliminato con successo');
        setTimeout(() => window.location.reload(), 1000);
      } else {
         toast.error('Errore eliminazione: ' + res.data.error);
      }
    } catch (e: any) {
      toast.error('Errore API: ' + e.message);
    }
  };

  const handleAddUser = async () => {
    if (!newUser) return;
    try {
      const res = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'add_user_to_group_api',
        groupid: groupid,
        userid: parseInt(newUser)
      });
      if (res.data.success) {
        toast.success('Utente aggiunto');
        setNewUser('');
        fetchGroup();
      } else {
         toast.error('Errore aggiunta: ' + res.data.error);
      }
    } catch (e: any) {
      toast.error('Errore API: ' + e.message);
    }
  };

  const handleRemoveUser = async (userid: number) => {
    try {
      const res = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'remove_user_from_group_api',
        groupid: groupid,
        userid: userid
      });
      if (res.data.success) {
        toast.success('Utente rimosso');
        fetchGroup();
      } else {
         toast.error('Errore rimosso: ' + res.data.error);
      }
    } catch (e: any) {
      toast.error('Errore API: ' + e.message);
    }
  };

  if (loading) return <div>Caricamento...</div>;

  const usersNotInGroup = users.filter(u => !groupUsers.find(gu => gu.userid === u.id));

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm p-4 rounded-md border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Dettagli Gruppo</h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrizione</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
          </div>
            <div>
               <label className="block text-sm font-medium text-gray-700">Manager</label>
               <select value={manager} onChange={e => setManager(e.target.value)} className="mt-1 w-full p-2 border rounded-md">
                 <option value="">Nessuno</option>
                 {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
               </select>
          </div>
          <div className="pt-2 flex space-x-2">
            <button onClick={handleUpdate} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Salva Modifiche</button>
            <button onClick={handleDeleteGroup} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Elimina Gruppo</button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm p-4 rounded-md border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Utenti nel Gruppo</h4>
        <div className="space-y-2 mb-4">
          {groupUsers.map(gu => {
             const userObj = users.find(u => u.id === gu.userid);
             return (
               <div key={gu.userid} className="flex justify-between items-center p-2 bg-gray-50 rounded-md border">
                 <span>{userObj ? userObj.username : `User ID: ${gu.userid}`}</span>
                 <button onClick={() => handleRemoveUser(gu.userid)} className="text-red-600 hover:text-red-800 text-sm">Rimuovi</button>
               </div>
             )
          })}
          {groupUsers.length === 0 && <p className="text-sm text-gray-500">Nessun utente nel gruppo</p>}
        </div>

        <h5 className="text-md font-medium text-gray-900 mb-2 mt-4">Aggiungi Utente</h5>
        <div className="flex space-x-2">
           <select value={newUser} onChange={e => setNewUser(e.target.value)} className="w-full p-2 border rounded-md">
             <option value="">Seleziona utente...</option>
             {usersNotInGroup.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
           </select>
           <button onClick={handleAddUser} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Aggiungi</button>
        </div>
      </div>
    </div>
  );
}
