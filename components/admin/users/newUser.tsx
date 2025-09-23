// components/NewUserForm.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';

const NewUserForm = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Rimosso se non si reindirizza internamente

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axiosInstanceClient.post(
        '/postApi',
        {
          apiRoute: 'save_newuser',
          ...formData,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('Utente creato con successo! 🎉');
      } else {
        toast.error(response.data.error || 'Errore nel salvataggio dell\'utente.');
      }
    } catch (error) {
      console.error('Errore API:', error);
      toast.error('Si è verificato un errore durante la richiesta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Rimosse classi di layout come min-h-screen, items-center, justify-center, bg-gray-100, p-4
    // Il layout esterno è gestito dal componente padre (UserSettings)
    <div className="w-full max-w-full rounded-lg bg-white p-6 shadow-md"> {/* Stili adattati */}
      <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">Crea Nuovo Utente</h2>
      <form onSubmit={handleSubmit} className="space-y-3"> {/* Spaziatura ridotta */}
        <input
          type="text"
          name="firstname"
          placeholder="Nome"
          value={formData.firstname}
          onChange={handleChange}
          required
          className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <input
          type="text"
          name="lastname"
          placeholder="Cognome"
          value={formData.lastname}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
        <div className="flex justify-end space-x-2 mt-4"> {/* Pulsanti affiancati e allineati a destra */}
          <button
            type="button" // Cambiato in type="button" per evitare il submit automatico
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm transition duration-200 hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoading ? 'Creazione in corso...' : 'Crea Utente'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewUserForm;