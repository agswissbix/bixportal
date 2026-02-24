'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { Lock, AlertTriangle } from 'lucide-react';
import LoadingComp from '@/components/loading';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { getActiveServer } from '@/utils/auth';
import axios from 'axios';
import '../globals.css';
import Image from 'next/image';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [activeServer, setActiveServer] = useState<string>('');
  
  useEffect(() => {
    const fetchActiveServer = async () => {
      const server = await getActiveServer();
      setActiveServer(server.activeServer);
    };
    fetchActiveServer();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('default');
  }, []);

  useEffect(() => {
    if (!uid || !token) {
      toast.error('Link di ripristino non valido o incompleto.');
    }
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!uid || !token) {
      toast.error('Impossibile verificare il link. Riprova dalla mail.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Le nuove password non coincidono. Riprova.');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      toast.error('La nuova password deve essere lunga almeno 8 caratteri.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'reset_password_with_token',
        uid: uid,
        token: token,
        new_password: newPassword,
      });

      toast.success(response.data.message || 'Password reimpostata con successo!');
      
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/login');
      }, 1500);
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 'Impossibile ripristinare la password.';
        toast.error('Errore: ' + errorMessage);
      } else {
        toast.error('Si è verificato un errore inatteso.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster richColors position='top-center' />
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-card">
        <div className="block sm:mx-auto sm:w-full sm:max-w-sm p-8 bg-card rounded-lg shadow-lg shadow-primary mx-auto">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm bg-primary p-4 rounded-md mb-6">
            <Image
              src={`/bixdata/logos/_default.png`}
              alt={activeServer}
              width={1000}
              height={1000}
              className="h-14 w-auto mx-auto"
              priority
            />
          </div>

          <div className="border-b border-border pb-4 mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
              <Lock className="h-6 w-6" /> Reimposta Password
            </h2>
            <p className="text-sm text-primary/80 mt-1">
              Inserisci due volte la tua nuova password.
            </p>
          </div>

          <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm/6 font-medium text-primary">Nuova Password</label>
                <div className="mt-2">
                  <input
                    type="password"
                    placeholder="Minimo 8 caratteri"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                    className="block w-full rounded-md py-3 px-4 text-primary bg-transparent border shadow-sm ring-1 ring-inset ring-border placeholder:text-badge focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm/6 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm/6 font-medium text-primary">Conferma Nuova Password</label>
                <div className="mt-2">
                  <input
                    type="password"
                    placeholder="Conferma la nuova password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="block w-full rounded-md py-3 px-4 text-primary bg-transparent border shadow-sm ring-1 ring-inset ring-border placeholder:text-badge focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm/6 transition-all duration-200"
                  />
                </div>
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1 font-medium bg-red-100 p-2 rounded border border-red-500">
                  <AlertTriangle className="h-4 w-4" /> Le password non corrispondono.
                </p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
                  className="flex w-full justify-center rounded-md bg-primary px-4 py-3 text-sm/6 font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? 'Attendi...' : 'Reimposta Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
