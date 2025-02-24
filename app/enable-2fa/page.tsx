'use client'
import { useState } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import axiosInstance from "@/utils/axiosInstance";
import { toast, Toaster } from 'sonner';



const Enable2FA = () => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const enable2FA = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.post('/commonapp/enable_2fa/');
        setQrCodeUrl(response.data.qr_code); // usa il base64 dal backend
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error("Errore nell'abilitare 2FA: " + error.response?.data?.message);
        } else {
          toast.error("Errore nell'abilitare 2FA");
        }
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Toaster richColors position='top-center' />
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Abilita 2FA</h2>
            <p className="text-gray-600">Configura l'autenticazione a due fattori per il tuo account</p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={enable2FA}
              className="w-full py-3 px-4 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200"
            >
              Genera QR Code per 2FA
            </button>

            {error && (
              <div className="p-4 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {qrCodeUrl && (
              <div className="space-y-4 text-center">
                <h3 className="font-semibold text-gray-800">
                  Scansiona il QR code con l'app di autenticazione
                </h3>
                <div className="bg-white p-4 rounded-lg shadow-inner flex justify-center">
                  <img 
                    src={`data:image/png;base64,${qrCodeUrl}`} 
                    alt="QR Code"
                    className="max-w-full h-auto"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Utilizza Google Authenticator o un'app simile per scansionare il codice
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

export default Enable2FA;
