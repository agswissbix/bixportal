'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

export default function NewGroupForm({ users }: { users: any[] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [manager, setManager] = useState('');
  const [priority, setPriority] = useState(9999);
  
  const handleCreate = async () => {
    if (!name) {
      toast.error('Il nome del gruppo è obbligatorio');
      return;
    }
    
    try {
      const res = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'save_new_group_api',
        name,
        description,
        priority,
        idmanager: manager ? parseInt(manager) : null
      });
      if (res.data.success) {
        toast.success('Gruppo creato con successo');
        window.location.reload(); // Quick refresh
      } else {
        toast.error('Errore: ' + res.data.error);
      }
    } catch (e: any) {
      toast.error('Errore API: ' + e.message);
    }
  };

  return (
    <div className="bg-white shadow-sm p-4 rounded-md border border-gray-200">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Crea Nuovo Gruppo</h4>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descrizione</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700">Manager</label>
               <select value={manager} onChange={e => setManager(e.target.value)} className="mt-1 w-full p-2 border rounded-md">
                 <option value="">Nessuno</option>
                 {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700">Priorità (Default: 9999)</label>
               <input type="number" value={priority} onChange={e => setPriority(parseInt(e.target.value))} className="mt-1 w-full p-2 border rounded-md" />
            </div>
        </div>
        <div className="pt-2">
          <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Crea Gruppo</button>
        </div>
      </div>
    </div>
  );
}
