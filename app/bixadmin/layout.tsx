import React from "react"
import { Navigation } from "@/components/admin/adminNavigation"
import { Toaster } from "sonner"
import { AdminProtection } from "@/components/admin/adminProtection"

export default function BixAdminLayout({ children }: { children: React.ReactNode }) {
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