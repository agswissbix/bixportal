'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/utils/axiosInstance';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import LoadingComp from '@/components/loading';


const ChangePasswordForm = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Validazione lato client
    if (newPassword !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('La nuova password deve essere lunga almeno 8 caratteri');
      return;
    }

    setIsLoading(true);
    changePassword();

  };

  const changePassword = async () => {
    try {
      const response = await axiosInstance.post('/commonapp/change_password/', 
        { old_password: oldPassword, new_password: newPassword},
        { 
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );
      toast.success(response.data.message);
      setTimeout(() => {
        router.push('/login');
      }, 450);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error("Errore nel cambio della password: " + error.response?.data?.message);
      } else {
        toast.error("Errore nella verifica della password");
      }
    }
  };

  // Utility per ottenere il CSRF token dai cookie
  const getCookie = (name: String) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  return (
<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Toaster position='top-center' richColors/>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cambia Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password Attuale</label>
              <Input  
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nuova Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Conferma Nuova Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit"
              className="w-full text-white bg-bixcolor-default hover:bg-bixcolor-light"
            >
              Cambia Password
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-6">
        {isLoading && <LoadingComp />}
      </div>
    </div>
  );
};

export default ChangePasswordForm;  

