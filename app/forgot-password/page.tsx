'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';
import LoadingComp from '@/components/loading';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { getActiveServer } from '@/utils/auth';
import axios from 'axios';
import '../globals.css';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error("Inserisci un'email valida.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstanceClient.post('/postApi', {
        apiRoute: 'request_password_reset',
        email: email,
        origin: window.location.origin,
      });

      toast.success(response.data.message || 'Email di ripristino inviata con successo!');
      setEmail('');
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || 'Impossibile inviare la mail di ripristino.';
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

          <button
            onClick={() => router.push('/login')}
            className="flex items-center text-sm text-primary mb-4 hover:text-primary-hover transition-colors duration-200 w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Torna al Login
          </button>

          <div className="border-b border-border pb-4 mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
              <Mail className="h-6 w-6" /> Password Dimenticata
            </h2>
            <p className="text-sm text-primary/80 mt-1">
              Inserisci l'indirizzo email associato al tuo account. Ti invieremo un link per reimpostare la tua password.
            </p>
          </div>

          <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm/6 font-medium text-primary">
                  Indirizzo Email
                </label>
                <div className="mt-2">
                  <input
                    type="email"
                    placeholder="mariorossi@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="block w-full rounded-md py-3 px-4 text-primary bg-transparent border shadow-sm ring-1 ring-inset ring-border placeholder:text-badge focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm/6 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="flex w-full justify-center rounded-md bg-primary px-4 py-3 text-sm/6 font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? 'Invio in corso...' : 'Invia Link di Ripristino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
