'use client'
import { useState } from "react";
import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import axiosInstanceClient from "@/utils/axiosInstanceClient";


const Verify2FA = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();


  const verifyOTP = async () => {

    try {
      const response = await axiosInstanceClient.post("/postApi", {
        apiRoute: "verify_2fa",
        otp: otp,
        
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }

      } 
    );
    toast.success(response.data.message);
    router.push('/custom');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      toast.error("Errore nella verifica del codice OTP: " + error.response?.data?.message);
    } else {
      toast.error("Errore nella verifica del codice OTP");
    }

  }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Toaster richColors position='top-center' />
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifica 2FA</h2>
          <p className="text-gray-600">Inserisci il codice di verifica a due fattori</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Inserisci codice OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="w-full px-4 py-3 text-center text-lg tracking-wider border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
          />

          <button
            onClick={verifyOTP}
            className="w-full py-3 px-4 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200"
          >
            Verifica
          </button>

          {message && (
            <div className={`p-4 rounded-lg text-sm ${
              message.includes('Errore')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verify2FA;
