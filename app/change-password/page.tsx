'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
import LoadingComp from '@/components/loading';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { AlertTriangle, Lock } from 'lucide-react';

const ChangePasswordForm = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsLoading(true);

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

    await changePassword();
    setIsLoading(false);
  };

  const changePassword = async () => {
    try {
      console.info('Cambio password in corso...');

      const response = await axiosInstanceClient.post("/postApi", {
        apiRoute: "changePassword",
        old_password: oldPassword,
        new_password: newPassword,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      toast.success(response.data.message || 'Password aggiornata con successo. Verrai reindirizzato al login.');

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/login');
      }, 1500);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Non è stato possibile cambiare la password. Riprova più tardi.";
        toast.error("Errore nel cambio della password: " + errorMessage);
      } else {
        toast.error("Si è verificato un errore inatteso. Controlla la tua connessione.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Toaster position="top-center" richColors />
      <Card className="w-full max-w-md shadow-2xl transition-all duration-300 hover:shadow-primary/30">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" /> Cambia Password
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Per la tua sicurezza, inserisci la password attuale e la nuova.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <label htmlFor="old-password" className="text-sm font-medium">Password Attuale</label>
              <Input
                id="old-password"
                type="password"
                placeholder="Inserisci la tua password attuale"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                disabled={isLoading}
                className='placeholder:text-gray-400'
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">Nuova Password</label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimo 8 caratteri"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
                className='placeholder:text-gray-400' 
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">Conferma Nuova Password</label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Conferma la nuova password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className='placeholder:text-gray-400'
              />
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> Le password non corrispondono.
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
            >
              {isLoading ? (
                <>
                  <LoadingComp />
                </>
              ) : (
                'Cambia Password'
              )}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordForm;
