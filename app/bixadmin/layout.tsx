"use client"

import React, { useEffect } from "react"
import { Navigation } from "@/components/admin/adminNavigation"
import { Toaster } from "sonner"
import { AdminProtection } from "@/components/admin/adminProtection"
import { useRecordsStore } from "@/components/records/recordsStore";
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { toast } from "sonner";

export default function BixAdminLayout({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useRecordsStore();

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await axiosInstanceClient.post(
          "/postApi",
          { apiRoute: "get_user_theme" },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        if (!response.data || !response.data.theme) {
          console.log('Nessun tema trovato nella risposta dell\'API');
          return;
        } else {
          setTheme(response.data.theme.value);
        }
      } catch (error) {
        console.error('Errore ', error);
        toast.error('Errore durante il recupero del tema');
      }
    };
  
    fetchTheme();
  }, [setTheme]); 

useEffect(() => {
  if (theme) {
    document.documentElement.classList.add(theme);
  }
}, [theme]);


  return (
    <AdminProtection>
        <Toaster richColors position="bottom-right" />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="max-w-8xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                {children}
            </div>
        </main>
        </div>
    </AdminProtection>
  );
}